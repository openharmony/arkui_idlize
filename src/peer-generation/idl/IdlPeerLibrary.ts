/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as idl from '../../idl';
import { BuilderClass } from '../BuilderClass';
import { MaterializedClass } from "../Materialized";
import { IdlComponentDeclaration, isConflictingDeclaration, isMaterialized } from './IdlPeerGeneratorVisitor';
import { IdlPeerClass } from "./IdlPeerClass";
import { IdlPeerFile } from "./IdlPeerFile";
import { TSTypeNameConvertor } from './IdlNameConvertor';
import { capitalize, isDefined, Language } from '../../util';
import { AggregateConvertor, ArgConvertor, ArrayConvertor, BooleanConvertor, CallbackFunctionConvertor, ClassConvertor, cppEscape, CustomTypeConvertor, EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, LengthConvertor, MapConvertor, MaterializedClassConvertor, NumberConvertor, OptionConvertor, PredefinedConvertor, StringConvertor, TupleConvertor, TypeAliasConvertor, UndefinedConvertor, UnionConvertor } from './IdlArgConvertors';
import { collectCallbacks, IdlCallbackInfo } from '../printers/EventsPrinter';
import { PrimitiveType } from '../DeclarationTable';
import { DependencySorter } from './DependencySorter';
import { IndentedPrinter } from '../../IndentedPrinter';
import { LanguageWriter } from '../LanguageWriters';
import { isImport } from './common';
import { StructPrinter } from './StructPrinter';
import { PeerGeneratorConfig } from '../PeerGeneratorConfig';

export type IdlPeerLibraryOutput = {
    outputC: string[]
}

export class IdlPeerLibrary {
    public readonly files: IdlPeerFile[] = []
    public readonly builderClasses: Map<string, BuilderClass> = new Map()
    public get buildersToGenerate(): BuilderClass[] {
        return Array.from(this.builderClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get materializedToGenerate(): MaterializedClass[] {
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
    }

    constructor(
        public language: Language,
        public componentsToGenerate: Set<string>,
    ) {}

    readonly customComponentMethods: string[] = []
    // todo really dirty - we use it until we can generate interfaces
    // replacing import type nodes
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly componentsDeclarations: IdlComponentDeclaration[] = []
    readonly conflictedDeclarations: Set<idl.IDLEntry> = new Set()
    readonly nameConvertorInstance = new TSTypeNameConvertor(this)

    findPeerByComponentName(componentName: string): IdlPeerClass | undefined {
        for (const file of this.files)
            for (const peer of file.peers.values())
                if (peer.componentName == componentName) 
                    return peer
        return undefined
    }

    findFileByOriginalFilename(filename: string): IdlPeerFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    findComponentByDeclaration(iface: idl.IDLInterface): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration === iface || it.attributesDeclarations === iface)
    }

    findComponentByType(type: idl.IDLType): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration?.name === type.name || it.attributesDeclarations.name === type.name)
    }

    isComponentDeclaration(iface: idl.IDLInterface): boolean {
        return this.findComponentByDeclaration(iface) !== undefined
    }

    shouldGenerateComponent(name: string): boolean {
        return !this.componentsToGenerate.size || this.componentsToGenerate.has(name)
    }

    mapType(type: idl.IDLType | idl.IDLCallback | undefined): string {
        return this.nameConvertorInstance.convert(type ?? idl.createVoidType())
    }

    resolveTypeReference(type: idl.IDLEnumType | idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        entries ??= this.files.flatMap(it => it.entries)
        const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier);
        if (qualifier) {
            // This is a namespace or enum member. Try enum first
            const parent = this.resolveTypeReference(idl.createReferenceType(qualifier), entries)///oh oh, just entries.find?
            if (parent && idl.isEnum(parent))
                return parent.elements.find(it => it.name === type.name)
            // Else try namespaces
            return entries.find(it =>
                it.name === type.name && idl.getExtAttribute(it, idl.IDLExtendedAttributes.Namespace) === qualifier)
        }
        const result = entries.find(it =>
            it.name === type.name && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Namespace))
        return result ??
            entries
                .map(it => it.scope)
                .filter(isDefined)
                .flat()
                .find(it => it.name === type.name)
    }

    // TODO temporary, needed for unification with PeerLibrary
    setCurrentContext(context: string | undefined) {
    }

    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false, maybeCallback: boolean = false): ArgConvertor {
        if (isOptionalParam) {
            return new OptionConvertor(this, param, type)
        }
        if (idl.isPrimitiveType(type)) {
            switch (type.name) {
                case "any": return new CustomTypeConvertor(param, "Any")
                case "null_":
                case "undefined":
                case "void_": return new UndefinedConvertor(param)
                case "number": return new NumberConvertor(param)
                case "DOMString": return new StringConvertor(param)
                case "boolean": return new BooleanConvertor(param)
            }
        }
        if (idl.isReferenceType(type)) {
            switch (type.name) {
                case "Callback": return new FunctionConvertor(this, param, type)
                case "Resource": return new InterfaceConvertor("Resource", param, ArkResource)
                case "object": return new CustomTypeConvertor(param, "Object")
                case "unknown": return new CustomTypeConvertor(param, "Any")
            }
            if (isImport(type))
                return new ImportTypeConvertor(param, type)
        }
        if (idl.isReferenceType(type) || idl.isEnumType(type)) {
            const decl = this.resolveTypeReference(type)
            return this.declarationConvertor(param, type, decl, maybeCallback)
        }
        if (idl.isUnionType(type)) {
            return new UnionConvertor(this, param, type)
        }
        if (idl.isContainerType(type)) {
            if (type.name === "sequence")
                return new ArrayConvertor(this, param, type, type.elementType[0])
            if (type.name === "record")
                return new MapConvertor(this, param, type, type.elementType[0], type.elementType[1])
        }
        if (idl.isTypeParameterType(type)) {
            // TODO: unlikely correct.
            return new CustomTypeConvertor(param, type.name)
        }
        console.log(type)
        throw new Error(`Cannot convert: ${type.name} ${type.kind}`)
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType | idl.IDLEnumType,
        declaration: idl.IDLEntry | undefined, maybeCallback: boolean = false): ArgConvertor
    {
        let customConv = this.customConvertor(param, type.name, type)
        if (customConv)
            return customConv
        if (!declaration || isConflictingDeclaration(declaration))
            return new CustomTypeConvertor(param, type.name, type.name) // assume some predefined type

        const declarationName = declaration.name!
        if (isImport(declaration)) {
            return new ImportTypeConvertor(param, type as idl.IDLReferenceType)
        }
        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration, isStringEnum(declaration))
        }
        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent, isStringEnum(declaration.parent))
        }
        if (idl.isCallback(declaration)) {
            return maybeCallback
                ? new CallbackFunctionConvertor(this, param, type as idl.IDLReferenceType)
                : new FunctionConvertor(this, param, type as idl.IDLReferenceType)
        }
        if (idl.isTypedef(declaration)) {
            return new TypeAliasConvertor(this, param, declaration)
        }
        if (idl.isInterface(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(this, declarationName, param, declaration)
            }
            return new InterfaceConvertor(declarationName, param, declaration)
        }
        if (idl.isClass(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(this, declarationName, param, declaration)
            }
            return new ClassConvertor(declarationName, param, declaration)
        }
        if (declaration.kind === idl.IDLKind.AnonymousInterface) {
            return new AggregateConvertor(this, param, type, declaration as idl.IDLInterface)
        }
        if (declaration.kind === idl.IDLKind.TupleInterface) {
            return new TupleConvertor(this, param, declaration as idl.IDLInterface)
        }
        throw new Error(`Unknown decl ${declarationName} of kind ${declaration.kind}`)
    }

    private customConvertor(param: string, typeName: string, type: idl.IDLReferenceType | idl.IDLEnumType): ArgConvertor | undefined {
        switch (typeName) {
            case `Dimension`:
            case `Length`:
                return new LengthConvertor(typeName, param)
            case `Function`:
                return new FunctionConvertor(this, param, type as idl.IDLReferenceType)
            case `AnimationRange`:
                return new CustomTypeConvertor(param, "AnimationRange", "AnimationRange<number>")
            case `ContentModifier`:
                return new CustomTypeConvertor(param, "ContentModifier", "ContentModifier<any>")
            case `Record`:
                return new CustomTypeConvertor(param, "Record", "Record<string, string>")
            case `Optional`:
                const wrappedType = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!
                return new OptionConvertor(this, param, idl.toIDLType(wrappedType))
        }
        return undefined
    }

    private typeMap = new Map<idl.IDLType, [idl.IDLEntry, string, boolean]>()

    private cleanPrefix(name: string, prefix: string): string {
        return name.replace(prefix, "")
    }

    getTypeName(type: idl.IDLType, optional: boolean = false): string {
        let prefix = optional ? PrimitiveType.OptionalPrefix : ""
        let declaration = this.typeMap.get(type)
        if (!declaration) {
            this.requestType(type, false)
            declaration = this.typeMap.get(type)!
        }
        let name = declaration[1]
        if (optional) {
            name = this.cleanPrefix(name, PrimitiveType.ArkPrefix)
        }
        return prefix + name
    }

    toDeclaration(type: idl.IDLType): idl.IDLEntry {
        switch (type.name) {
            case "any": return ArkCustomObject
            case "null_":
            case "void_": return idl.createUndefinedType()
            case "Callback": return ArkFunction
            case "Resource": return ArkResource
        }
        if (isImport(type))
            return ArkCustomObject
        if (idl.isReferenceType(type) || idl.isEnumType(type)) {
            switch (type.name) {
                case `Dimension`: case `Length`: return ArkLength
                case `AnimationRange`:
                case `ContentModifier`: return ArkCustomObject
                case `Function`: return ArkFunction  // stub required to compile arkoala patched sdk
                case `Optional`:
                    const wrappedType = idl.toIDLType(idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!)
                    return this.toDeclaration(wrappedType)
            }
            const decl = this.resolveTypeReference(type)
            return !decl ? ArkCustomObject  // assume some builtin type
                : idl.isCallback(decl) ? ArkFunction
                : idl.isTypedef(decl) ? this.toDeclaration(decl.type)
                : decl
        }
        return type
    }

    requestType(type: idl.IDLType, useToGenerate: boolean) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            declaration[2] ||= useToGenerate
            return
        }
        const decl = this.toDeclaration(type)
        let name = this.computeTargetName(decl, false)
        if (type.name === "Optional")
            name = "Opt_" + cleanPrefix(name, PrimitiveType.ArkPrefix)
        this.typeMap.set(type, [decl, name, useToGenerate])
    }

    public get orderedDependencies(): idl.IDLEntry[] {
        return this._orderedDependencies
    }
    private _orderedDependencies: idl.IDLEntry[] = []

    public get orderedDependenciesToGenerate(): idl.IDLEntry[] {
        return this._orderedDependenciesToGenerate
    }
    private _orderedDependenciesToGenerate: idl.IDLEntry[] = []

    analyze() {///stolen from DeclTable
        const callbacks = collectCallbacks(this) as IdlCallbackInfo[]
        for (const callback of callbacks) {
            callback.args.forEach(arg => {
                const useToGenerate = this.shouldGenerateComponent(callback.componentName)
                this.requestType(arg.type, useToGenerate)
            })
        }

        let orderer = new DependencySorter(this)
        for (let declaration of this.typeMap.values()) {
            orderer.addDep(declaration[0])
        }
        this._orderedDependencies = orderer.getToposorted()
        this._orderedDependencies.unshift(ArkInt32)

        let toGenerateOrderer = new DependencySorter(this)
        for (let declaration of this.typeMap.values()) {
            if (declaration[2])
                toGenerateOrderer.addDep(declaration[0])
        }
        this._orderedDependenciesToGenerate = toGenerateOrderer.getToposorted()
    }

    generateStructs(structs: IndentedPrinter, typedefs: IndentedPrinter, writeToString: LanguageWriter) {
        new StructPrinter(this).generateStructs(structs, typedefs, writeToString)
    }

    computeTargetName(target: idl.IDLEntry, optional: boolean, idlPrefix: string = PrimitiveType.ArkPrefix): string {
        return this.computeTargetNameImpl(target, optional, idlPrefix)///inline
    }

    computeTargetTypeLiteralName(decl: idl.IDLInterface, prefix: string): string {
        const map = new Map<string, string[]>()
        for (const prop of decl.properties) {
            const type = this.computeTargetName(prop.type, prop.isOptional, "")
            const values = map.has(type) ? map.get(type)! : []
            values.push(prop.name)
            map.set(type, values)
        }
        const names = Array.from(map.keys()).map(key => `${key}_${map.get(key)!.join('_')}`)
        return prefix + `Literal_${names.join('_')}`
    }

    computeTargetNameImpl(target: idl.IDLEntry, optional: boolean, idlPrefix: string): string {
        const prefix = optional ? PrimitiveType.OptionalPrefix : ""
        if (idl.isPrimitiveType(target)) {
            let name = target.name
            switch (name) {
                case "any": return "CustomObject"
                case "DOMString": name = "String"; break
                case "null_": name = "null"; break///?
                case "void_": name = "void"; break
                default: name = capitalize(name); break
            }
            return (optional ? prefix : idlPrefix) + name
        }
        if (idl.isAnonymousInterface(target)) {
            return target.name
                ? (optional ? prefix : idlPrefix) + target.name
                : this.computeTargetTypeLiteralName(target, prefix)
        }
        if (idl.isTypeParameterType(target)) {
            // TODO: likely incorrect
            let name = PrimitiveType.CustomObject.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.ArkPrefix) : name)
        }
        if (idl.isEnum(target) || idl.isEnumType(target)) {
            const name = this.enumName(target)
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.ArkPrefix) : name)
        }
        if (idl.isUnionType(target)) {
            return prefix + `Union_${target.types.map(it => this.computeTargetName(it, false, "")).join("_")}`
        }
        if (idl.isInterface(target) || idl.isClass(target)) {
            return (optional ? prefix : idlPrefix) + target.name
        }
        if (idl.isCallback(target)) {
            return (optional ? prefix : idlPrefix) + "Function"
        }
        if (idl.isTupleInterface(target)) {
            return target.name
                ? (optional ? prefix : idlPrefix) + target.name
                : prefix + `Tuple_${target.properties.map(it => this.computeTargetName(it.type, it.isOptional, "")).join("_")}`
        }
        if (idl.isContainerType(target)) {
            switch (target.name) {
                case "sequence": return prefix + `Array_` + this.computeTargetName(target.elementType[0], false, "")
                case "record": return prefix + `Map_` +
                    this.computeTargetName(target.elementType[0], false, "") + "_" +
                    this.computeTargetName(target.elementType[1], false, "")
            }
        }
        if (idl.isReferenceType(target)) {
            const name = target.name
            if (name == "Optional") {
                const typeArg = idl.getExtAttribute(target, idl.IDLExtendedAttributes.TypeArguments)!
                return this.computeTargetName(idl.toIDLType(typeArg), true, idlPrefix)
            }
            if (name == "Callback") {
                return (optional ? prefix : idlPrefix) + "Function"
            }
            if (name === "ResourceColor")
                return "Union_Color_Number_String_Resource"///hack
            if (PeerGeneratorConfig.isKnownParametrized(name)) {
                const name = PrimitiveType.CustomObject.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.ArkPrefix) : name)
            }
            return (optional ? prefix : idlPrefix) + name
        }
        if (isImport(target))
            return prefix + this.mapImportTypeName(target)
        if (idl.isEnumMember(target))
            return this.computeTargetName(target.parent, optional, idlPrefix)
        if (idl.isTypedef(target))
            return (optional ? prefix : idlPrefix) + target.name
        throw new Error(`Cannot compute target name: ${idl.IDLKind[target.kind!]} ${target.name}`)
    }

    private mapImportTypeName(type: idl.IDLEntry): string {
        switch (type.name) {
            case "Resource": return "Resource"
            case "Callback": return PrimitiveType.Function.getText()
            default: return PrimitiveType.CustomObject.getText()
        }
    }

    private enumName(target: idl.IDLEnum | idl.IDLEnumType): string {
        // TODO: support namespaces in other declarations.
        const namespace = idl.getExtAttribute(target, idl.IDLExtendedAttributes.Namespace)
        return `${PrimitiveType.ArkPrefix}${namespace ? namespace + "_" : ""}${target.name}`
    }

    private allTypes<T extends idl.IDLEntry>(predicate: (e: idl.IDLEntry) => e is T): T[] {
        return this._orderedDependencies.filter(predicate)
    }

    allUnionTypes(): Map<string, {id: number, name: string}[]> {
        const data: Array<[string, {id: number, name: string}[]]> =
            this.allTypes(idl.isUnionType)
                .map(it => [
                    this.computeTargetName(it, false),
                    it.types.map((e, index) => { return {id: index, name: "value" + index }})])
        return new Map(data)
    }

    allLiteralTypes(): Map<string, string[]> {
        const data: Array<[string, string[]]> =
            this.allTypes(idl.isAnonymousInterface)
                .map(it => [
                    this.computeTargetName(it, false),
                    it.properties.map(p => cppEscape(p.name))])
        return new Map(data)
    }

    allOptionalTypes(): Set<string> {
        const data = this._orderedDependencies.map(it => this.computeTargetName(it, true))
        return new Set(data)
    }
}

export const ArkInt32: idl.IDLPrimitiveType = {
    kind: idl.IDLKind.PrimitiveType,
    name: "Int32"
}

export const ArkFunction: idl.IDLPrimitiveType = {
    kind: idl.IDLKind.PrimitiveType,
    name: "Function"
}

export const ArkLength: idl.IDLPrimitiveType = {
    kind: idl.IDLKind.PrimitiveType,
    name: "Length"
}

export const ArkCustomObject: idl.IDLPrimitiveType = {
    kind: idl.IDLKind.PrimitiveType,
    name: "CustomObject"
}

export const ArkResource: idl.IDLInterface = {
    name: "Resource",
    kind: idl.IDLKind.Interface,
    inheritance: [],
    constructors: [],
    constants: [],
    properties: [
        {
            name: "id",
            kind: idl.IDLKind.Property,
            type: idl.createNumberType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "type",
            kind: idl.IDLKind.Property,
            type: idl.createNumberType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "moduleName",
            kind: idl.IDLKind.Property,
            type: idl.createStringType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "bundleName",
            kind: idl.IDLKind.Property,
            type: idl.createStringType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "params",
            kind: idl.IDLKind.Property,
            type: idl.createContainerType("sequence", [idl.createStringType()]),
            isReadonly: true,
            isStatic: false,
            isOptional: true,
        },
    ],
    methods: [],
    callables: [],
}

function isStringEnum(decl: idl.IDLEnum): boolean {
    return decl.elements.some(e => e.type.name === "DOMString")
}

export function cleanPrefix(name: string, prefix: string): string {
    return name.replace(prefix, "")
}
