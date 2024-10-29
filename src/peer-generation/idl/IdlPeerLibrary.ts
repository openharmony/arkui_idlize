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

import * as idl from '../../idl'
import { BuilderClass } from '../BuilderClass';
import { MaterializedClass } from "../Materialized";
import { IdlComponentDeclaration, isConflictingDeclaration, isMaterialized } from './IdlPeerGeneratorVisitor';
import { IdlPeerFile } from "./IdlPeerFile";
import { CJTypeNameConvertor } from './IdlNameConvertor';
import { capitalize, isDefined } from '../../util';
import { AggregateConvertor, ArrayConvertor, CallbackConvertor, ClassConvertor, DateConvertor, EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, MapConvertor, MaterializedClassConvertor, OptionConvertor,  StringConvertor, TupleConvertor, TypeAliasConvertor, UnionConvertor } from './IdlArgConvertors';
import { PrimitiveType } from "../ArkPrimitiveType"
import { DependencySorter } from './DependencySorter';
import { IndentedPrinter } from '../../IndentedPrinter';
import { createLanguageWriter, LanguageWriter, MethodSignature, TSLanguageWriter } from '../LanguageWriters';
import { isImport, isStringEnum } from './common';
import { StructPrinter } from './StructPrinter';
import { PeerGeneratorConfig } from '../PeerGeneratorConfig';
import { ArgConvertor, BooleanConvertor, CustomTypeConvertor, LengthConvertor, NullConvertor, NumberConvertor, UndefinedConvertor, VoidConvertor } from '../ArgConvertors';
import { Language } from '../../Language';
import { generateSyntheticFunctionName } from '../../IDLVisitor';
import { collectUniqueCallbacks } from '../printers/CallbacksPrinter';
import { ReferenceResolver } from '../ReferenceResolver';
import { IdlTypeNameConvertor } from './IdlTypeConvertor';
import { JavaLanguageWriter } from '../LanguageWriters/writers/JavaLanguageWriter';
import { ETSLanguageWriter } from '../LanguageWriters/writers/ETSLanguageWriter';
import { CJLanguageWriter } from '../LanguageWriters/writers/CJLanguageWriter';

function createTypeNameConvertor(library: IdlPeerLibrary): IdlTypeNameConvertor {
    const language = library.language
    if (language === Language.TS)
        return new TSLanguageWriter(new IndentedPrinter(), library, language)
    if (language === Language.JAVA)
        return new JavaLanguageWriter(new IndentedPrinter(), library)
    if (language === Language.ARKTS)
        return new ETSLanguageWriter(new IndentedPrinter(), library)
    if (language == Language.CJ)
        return new CJLanguageWriter(new IndentedPrinter(), library)
    throw new Error(`Convertor from IDL to ${language} not implemented`)
}

export class IdlPeerLibrary implements ReferenceResolver {
    public readonly predefinedFiles: IdlPeerFile[] = []
    public readonly files: IdlPeerFile[] = []
    public readonly builderClasses: Map<string, BuilderClass> = new Map()
    public get buildersToGenerate(): BuilderClass[] {
        return Array.from(this.builderClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get materializedToGenerate(): MaterializedClass[] {
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
    }

    public makeCMapName(keyType: idl.IDLType, valueType: idl.IDLType): string {
        return `Map_${this.computeTargetName(keyType, false, "")}_${this.computeTargetName(valueType, false, "")}`
    }

    public makeCArrayName(elementType: idl.IDLType): string {
        return `Array_${this.computeTargetName(elementType, false, "")}`
    }

    public readonly predefinedDeclarations: idl.IDLInterface[] = []

    constructor(
        public language: Language,
        public componentsToGenerate: Set<string>,
    ) {}

    readonly customComponentMethods: string[] = []
    // todo really dirty - we use it until we can generate interfaces
    // replacing import type nodes
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly declarations: idl.IDLEntry[] = []
    readonly componentsDeclarations: IdlComponentDeclaration[] = []
    readonly conflictedDeclarations: Set<idl.IDLEntry> = new Set()
    readonly nameConvertorInstance: IdlTypeNameConvertor = createTypeNameConvertor(this)
    readonly seenArrayTypes: Map<string, idl.IDLType> = new Map()

    readonly continuationCallbacks: idl.IDLCallback[] = []
    readonly syntheticEntries: idl.IDLEntry[] = []

    addSyntheticInterface(entry: idl.IDLInterface): idl.IDLReferenceType {
        this.syntheticEntries.push(entry)
        return idl.createReferenceType(entry.name)
    }

    private createContinuationCallbacks(): void {
        const callbacks = collectUniqueCallbacks(this)
        for (const callback of callbacks) {
            this.createContinuationCallbackIfNeeded(callback.returnType)
            this.requestType(this.createContinuationCallbackReference(callback.returnType), true)
        }
    }
    private createContinuationCallbackIfNeeded(continuationType: idl.IDLType): void {
        if (idl.isContainerType(continuationType) && idl.IDLContainerUtils.isPromise(continuationType))
            return this.createContinuationCallbackIfNeeded(continuationType.elementType[0])
        const continuationParameters = idl.isVoidType(continuationType) ? [] : [idl.createParameter('value', continuationType)]
        const continuationReference = this.createContinuationCallbackReference(continuationType)
        const maybeResolved = this.resolveTypeReference(continuationReference)
        if (maybeResolved)
            return
        const callback = idl.createCallback(idl.getIDLTypeName(continuationReference), continuationParameters, idl.IDLVoidType)
        this.continuationCallbacks.push(callback)
    }
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType {
        if (idl.isContainerType(continuationType) && idl.IDLContainerUtils.isPromise(continuationType))
            return this.createContinuationCallbackReference(continuationType.elementType[0])
        const continuationParameters = idl.isVoidType(continuationType) ? [] : [idl.createParameter('value', continuationType)]
        const syntheticName = generateSyntheticFunctionName(
            (type) => cleanPrefix(this.getTypeName(type), PrimitiveType.Prefix),
            continuationParameters,
            idl.IDLVoidType,
        )
        return idl.createReferenceType(syntheticName)
    }

    private context: string | undefined
    getCurrentContext(): string | undefined {
        return this.context
    }
    setCurrentContext(context: string | undefined) {
        this.context = context
    }

    findFileByOriginalFilename(filename: string): IdlPeerFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    findComponentByDeclaration(iface: idl.IDLInterface): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration === iface || it.attributeDeclaration === iface)
    }

    findComponentByType(type: idl.IDLType): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            idl.isIDLTypeName(type, it.interfaceDeclaration?.name) || idl.isIDLTypeName(type, it.attributeDeclaration.name))
    }

    isComponentDeclaration(iface: idl.IDLInterface): boolean {
        return this.findComponentByDeclaration(iface) !== undefined
    }

    shouldGenerateComponent(name: string): boolean {
        return !this.componentsToGenerate.size || this.componentsToGenerate.has(name)
    }

    mapType(type: idl.IDLType | idl.IDLCallback): string {
        return this.nameConvertorInstance.convert(
            type ?? idl.IDLVoidType
        )
    }

    resolveTypeReference(type: idl.IDLEnumType | idl.IDLReferenceType, entries?: idl.IDLEntry[], useSynthetic:boolean = false): idl.IDLEntry | undefined {
        const synthetics = useSynthetic ? this.syntheticEntries : []
        entries ??= synthetics
            .concat(this.files.flatMap(it => it.entries))
            .concat(this.continuationCallbacks)
        
        if (idl.isIDLTypeNameWith(type, name => name.indexOf(".") >= 0)) {
            const qualifier = idl.getIDLTypeName(type, (_, name) => name.split(".").slice(0, -2).join(".")) 
            // This is a namespace or enum member. Try enum first
            const parent = entries.find(it => it.name === qualifier)
            if (parent && idl.isEnum(parent))
                return parent.elements.find(it => it.name === idl.getIDLTypeName(type))
            // Else try namespaces
            return entries.find(it =>
                idl.isIDLTypeName(type, it.name) && idl.getExtAttribute(it, idl.IDLExtendedAttributes.Namespace) === qualifier)
        }

        const candidates = entries.filter(it => idl.isIDLTypeName(type, it.name))
        return candidates.length == 1
            ? candidates[0]
            : candidates.find(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Import))
    }

    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false, maybeCallback: boolean = false): ArgConvertor {
        if (isOptionalParam) {
            return new OptionConvertor(this, param, type)
        }
        if (idl.isPrimitiveType(type)) {
            switch (type) {
                case idl.IDLBooleanType: return new BooleanConvertor(param)
                case idl.IDLStringType: return new StringConvertor(param)
                case idl.IDLNullType: return new NullConvertor(param)
                case idl.IDLNumberType: return new NumberConvertor(param)
                case idl.IDLUndefinedType: return new UndefinedConvertor(param)
                case idl.IDLVoidType: return new VoidConvertor(param)
                case idl.IDLUnknownType:
                case idl.IDLAnyType: return new CustomTypeConvertor(param, "Any")
                default: throw new Error(`Unconverted primitive ${idl.DebugUtils.debugPrintType(type)}`)
            }
        }
        if (idl.isReferenceType(type)) {
            if (type == idl.IDLObjectType)
                return new CustomTypeConvertor(param, "Object")
            if (idl.isIDLTypeName(type, 'Date')) {
                return new DateConvertor(param)
            }
            if (isImport(type))
                return new ImportTypeConvertor(param, this.nameConvertorInstance.convert(type))
        }
        if (idl.isReferenceType(type) || idl.isEnumType(type)) {
            const decl = this.resolveTypeReference(type)
            return this.declarationConvertor(param, type, decl, maybeCallback)
        }
        if (idl.isUnionType(type)) {
            return new UnionConvertor(this, param, type)
        }
        if (idl.isContainerType(type)) {
            if (idl.IDLContainerUtils.isSequence(type))
                return new ArrayConvertor(this, param, type, type.elementType[0])
            if (idl.IDLContainerUtils.isRecord(type))
                return new MapConvertor(this, param, type, type.elementType[0], type.elementType[1])
        }
        if (idl.isTypeParameterType(type)) {
            // TODO: unlikely correct.
            return new CustomTypeConvertor(param, this.nameConvertorInstance.convert(type))
        }
        throw new Error(`Cannot convert: ${idl.getIDLTypeName(type)} ${type.kind}`)
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType | idl.IDLEnumType,
        declaration: idl.IDLEntry | undefined, maybeCallback: boolean = false): ArgConvertor
    {
        let customConv = this.customConvertor(param, idl.getIDLTypeName(type, idl.DebugUtils.easyGetName), type)
        if (customConv)
            return customConv
        if (!declaration || isConflictingDeclaration(declaration))
            return new CustomTypeConvertor(param, this.nameConvertorInstance.convert(type), false, this.nameConvertorInstance.convert(type)) // assume some predefined type

        const declarationName = declaration.name!
        if (isImport(declaration)) {
            return new ImportTypeConvertor(param, this.nameConvertorInstance.convert(type))
        }
        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration, isStringEnum(declaration))
        }
        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent, isStringEnum(declaration.parent))
        }
        if (idl.isCallback(declaration)) {
            return new CallbackConvertor(this, param, declaration)
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
                return new LengthConvertor(typeName, param, this.language)
            case `Date`:
                return new DateConvertor(param)
            case `Function`:
                return new FunctionConvertor(this, param, type as idl.IDLReferenceType)
            case `AnimationRange`:
                return new CustomTypeConvertor(param, "AnimationRange", false, "AnimationRange<number>")
            case `ContentModifier`:
                return new CustomTypeConvertor(param, "ContentModifier", false, "ContentModifier<any>")
            case `Record`:
                return new CustomTypeConvertor(param, "Record", false, "Record<string, string>")
            case `Optional`:
                const wrappedType = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!
                return new OptionConvertor(this, param, idl.toIDLType(wrappedType))
        }
        return undefined
    }

    readonly typeMap = new Map<idl.IDLType | idl.IDLCallback | idl.IDLEnum | idl.IDLInterface, [idl.IDLEntry, string[], boolean]>()

    private cleanPrefix(name: string, prefix: string): string {
        return name.replace(prefix, "")
    }

    getTypeName(type: idl.IDLType | idl.IDLInterface, optional: boolean = false): string {
        let prefix = optional ? PrimitiveType.OptionalPrefix : ""
        let declaration = this.typeMap.get(type)
        if (!declaration) {
            this.requestType(type, false)
            declaration = this.typeMap.get(type)!
        }
        let name = declaration[1][0]

        if (optional) {
            name = this.cleanPrefix(name, PrimitiveType.Prefix)
        }
        return prefix + name
    }

    toDeclaration(type: idl.IDLType | idl.IDLTypedef | idl.IDLCallback | idl.IDLEnum | idl.IDLInterface): idl.IDLEntry {
        switch (type) {
            case idl.IDLAnyType: return ArkCustomObject
            case idl.IDLNullType: return idl.IDLNullType
            case idl.IDLVoidType: return idl.IDLVoidType
            case idl.IDLUndefinedType: return idl.IDLUndefinedType
            case idl.IDLUnknownType: return ArkCustomObject
            case idl.IDLObjectType: return ArkCustomObject
        }
        const typeName = idl.isType(type) ? idl.getIDLTypeName(type, (_, name) => name) : type.name
        switch (typeName) {
            case "object":
            case "Object": return ArkCustomObject
        }
        if (isImport(type)) {
            return ArkCustomObject
        }
        if (idl.isReferenceType(type) || idl.isEnumType(type)) {
            // TODO: remove all this!
            if (idl.isIDLTypeName(type, 'Dimension') || idl.isIDLTypeName(type, 'Length')) {
                return ArkLength
            }
            if (idl.isIDLTypeName(type, 'Date')) {
                return ArkInt64
            }
            if (idl.isIDLTypeName(type, 'AnimationRange') || idl.isIDLTypeName(type, 'ContentModifier')) {
                return ArkCustomObject
            }
            if (idl.isIDLTypeName(type, 'Function')) {
                return ArkFunction
            }
            if (idl.isIDLTypeName(type, 'Optional')) {
                const wrappedType = idl.toIDLType(idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!)
                return this.toDeclaration(wrappedType)
            }
            const decl = this.resolveTypeReference(type)
            if (!decl) console.log(`WARNING: undeclared type ${idl.DebugUtils.debugPrintType(type)}`)
            return !decl ? ArkCustomObject  // assume some builtin type
                : idl.isTypedef(decl) ? this.toDeclaration(decl.type)
                : decl
        }
        return type
    }

    requestType(type: idl.IDLType | idl.IDLEnum | idl.IDLInterface, useToGenerate: boolean) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            declaration[2] ||= useToGenerate
            return
        }
        const decl = this.toDeclaration(type)
        let name = this.computeTargetName(decl, false)
        if (idl.isReferenceType(type) && idl.isIDLTypeName(type, "Optional"))
            name = "Opt_" + cleanPrefix(name, PrimitiveType.Prefix)
        this.typeMap.set(type, [decl, [name], useToGenerate])
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
        this.createContinuationCallbacks()
        const callbacks = collectUniqueCallbacks(this)
        for (const callback of callbacks) {
            callback.parameters.forEach(arg => {
                this.requestType(arg.type!, true)
            })
            this.requestType(callback.returnType, true)
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

    generateStructs(structs: LanguageWriter, typedefs: IndentedPrinter, writeToString: LanguageWriter) {
        new StructPrinter(this).generateStructs(structs, typedefs, writeToString)
    }

    computeTargetName(target: idl.IDLEntry, optional: boolean, idlPrefix: string = PrimitiveType.Prefix): string {
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
            let name: string = ""
            switch (target) {
                case idl.IDLAnyType: name = "CustomObject"; break
                case idl.IDLStringType: name = "String"; break
                case idl.IDLNullType: name = "Null"; break
                case idl.IDLVoidType: name = "Void"; break
                case idl.IDLI8Type: name = "Int32"; break
                case idl.IDLU8Type: name = "Int32"; break
                case idl.IDLI16Type: name = "Int32"; break
                case idl.IDLU16Type: name = "Int32"; break
                case idl.IDLI32Type: name = "Int32"; break
                case idl.IDLU32Type: name = "Int32"; break // FIXME: 
                case idl.IDLI64Type: name = "Int64"; break // FIXME:
                case idl.IDLU64Type: name = "Int64"; break // FIXME:
                case idl.IDLBooleanType: name = "Boolean"; break
                default: name = capitalize(idl.getIDLTypeName(target)); break
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
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (idl.isEnum(target) || idl.isEnumType(target)) {
            const name = this.enumName(target)
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (idl.isUnionType(target)) {
            return (optional ? prefix : idlPrefix) + idl.getIDLTypeName(target, idl.DebugUtils.easyGetName)
        }
        if (idl.isInterface(target) || idl.isClass(target)) {
            return (optional ? prefix : idlPrefix) + target.name
        }
        if (idl.isCallback(target)) {
            return (optional ? prefix : idlPrefix) + target.name
        }
        if (idl.isTupleInterface(target)) {
            return target.name
                ? (optional ? prefix : idlPrefix) + target.name
                : prefix + `Tuple_${target.properties.map(it => this.computeTargetName(it.type, it.isOptional, "")).join("_")}`
        }
        if (idl.isContainerType(target)) {
            if (idl.IDLContainerUtils.isSequence(target)) {
                return prefix + this.makeCArrayName(target.elementType[0])
            }
            if (idl.IDLContainerUtils.isRecord(target)) {
                return prefix + this.makeCMapName(target.elementType[0], target.elementType[1])
            }
            if (idl.IDLContainerUtils.isPromise(target)) {
                return prefix + `Promise_` + this.computeTargetName(target.elementType[0], false, "")
            }
            throw new Error(`Unknown container type ${idl.DebugUtils.debugPrintType(target)}`)
        }
        if (idl.isReferenceType(target)) {
            if (idl.isIDLTypeName(target, "Optional")) {
                const typeArg = idl.getExtAttribute(target, idl.IDLExtendedAttributes.TypeArguments)!
                return this.computeTargetName(idl.toIDLType(typeArg), true, idlPrefix)
            }
            const name = idl.getIDLTypeName(target, idl.DebugUtils.easyGetName)
            if (PeerGeneratorConfig.isKnownParametrized(name)) {
                const name = PrimitiveType.CustomObject.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
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
        console.log(`Import type: ${type.name}`)
        switch (type.name) {
            default: return PrimitiveType.CustomObject.getText()
        }
    }

    private enumName(target: idl.IDLEnum | idl.IDLEnumType): string {
        // TODO: support namespaces in other declarations.
        const namespace = idl.getExtAttribute(target, idl.IDLExtendedAttributes.Namespace)
        if (idl.isEnumType(target)) {
            return `${PrimitiveType.Prefix}${namespace ? namespace + "_" : ""}${idl.getIDLTypeName(target)}`
        }
        return `${PrimitiveType.Prefix}${namespace ? namespace + "_" : ""}${target.name}`
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
                    it.properties.map(p => p.name)])
        return new Map(data)
    }

    allOptionalTypes(): Set<string> {
        const data = this._orderedDependencies.map(it => this.computeTargetName(it, true))
        return new Set(data)
    }
}

export const ArkInt32 = idl.IDLI32Type
export const ArkInt64 = idl.IDLI64Type
export const ArkFunction = idl.IDLFunctionType
export const ArkLength = idl.IDLLengthType
export const ArkCustomObject = idl.IDLCustomObjectType

export function cleanPrefix(name: string, prefix: string): string {
    return name.replace(prefix, "")
}
