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

import * as idl from '../idl'
import { BuilderClass } from './BuilderClass';
import { MaterializedClass } from "./Materialized";
import { IdlComponentDeclaration, isConflictingDeclaration, isMaterialized } from './idl/IdlPeerGeneratorVisitor';
import { PeerFile } from "./PeerFile";
import { AggregateConvertor, ArrayConvertor, BufferConvertor, CallbackConvertor, ClassConvertor, DateConvertor, EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, MapConvertor, MaterializedClassConvertor, NumericConvertor, OptionConvertor,  StringConvertor, TupleConvertor, TypeAliasConvertor, UnionConvertor } from './ArgConvertors';
import { PrimitiveType } from "./ArkPrimitiveType"
import { DependencySorter } from './idl/DependencySorter';
import { IndentedPrinter } from '../IndentedPrinter';
import { createTypeNameConvertor, LanguageWriter } from './LanguageWriters';
import { isImport, isStringEnum, typeOrUnion } from './idl/common';
import { StructPrinter } from './printers/StructPrinter';
import { ArgConvertor, BooleanConvertor, CustomTypeConvertor, LengthConvertor, NullConvertor, NumberConvertor, UndefinedConvertor, VoidConvertor } from './ArgConvertors';
import { Language } from '../Language';
import { generateSyntheticFunctionName } from '../IDLVisitor';
import { collectUniqueCallbacks } from './printers/CallbacksPrinter';
import { convertType, IdlNameConvertor } from './LanguageWriters/nameConvertor';
import { LibraryInterface } from '../LibraryInterface';
import { IdlEntryManager } from './idl/IdlEntryManager';
import { IDLNodeToStringConvertor } from './LanguageWriters/convertors/InteropConvertor';
import { UnionFlattener } from './unions';
import { warn } from '../util';

export class PeerLibrary implements LibraryInterface {

    public readonly factory = new IdlEntryManager()

    public readonly files: PeerFile[] = []
    public readonly builderClasses: Map<string, BuilderClass> = new Map()
    public get buildersToGenerate(): BuilderClass[] {
        return Array.from(this.builderClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get materializedToGenerate(): MaterializedClass[] {
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly predefinedDeclarations: idl.IDLInterface[] = []

    constructor(
        public language: Language,
        public componentsToGenerate: Set<string>,
    ) {}

    public name: string = ""

    readonly customComponentMethods: string[] = []
    // todo really dirty - we use it until we can generate interfaces
    // replacing import type nodes
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly declarations: idl.IDLEntry[] = []
    readonly componentsDeclarations: IdlComponentDeclaration[] = []
    readonly conflictedDeclarations: Set<idl.IDLEntry> = new Set()
    readonly seenArrayTypes: Map<string, idl.IDLType> = new Map()

    private readonly targetNameConvertorInstance: IdlNameConvertor = createTypeNameConvertor(this.language, this)
    private readonly nativeNameConvertorInstance: IdlNameConvertor = createTypeNameConvertor(Language.CPP, this)
    private readonly interopNameConvertorInstance: IdlNameConvertor = new IDLNodeToStringConvertor(this)
    private readonly unionFlattener = new UnionFlattener(this)

    readonly continuationCallbacks: idl.IDLCallback[] = []

    get libraryPrefix(): string {
        return this.name ? this.name + "_" : ""
    }

    private createContinuationCallbacks(): void {
        const callbacks = collectUniqueCallbacks(this)
        for (const callback of callbacks)
            this.requestType(this.createContinuationCallbackIfNeeded(callback.returnType), true)
    }
    private createContinuationParameters(continuationType: idl.IDLType): idl.IDLParameter[] {
        const continuationParameters: idl.IDLParameter[] = []
        if (idl.isContainerType(continuationType) && idl.IDLContainerUtils.isPromise(continuationType)) {
            const errorType = idl.createOptionalType(idl.createContainerType("sequence", [idl.IDLStringType]))
            continuationParameters.push(idl.createParameter("error", errorType, true))
            const promise = continuationType as idl.IDLContainerType
            if (!idl.isVoidType(promise.elementType[0])) {
                const valueType = idl.createOptionalType(promise.elementType[0])
                continuationParameters.unshift(idl.createParameter("value", valueType, true))
            }
        } else if (!idl.isVoidType(continuationType))
            continuationParameters.push(idl.createParameter('value', continuationType))
        return continuationParameters
    }
    private createContinuationCallbackIfNeeded(continuationType: idl.IDLType): idl.IDLReferenceType {
        const continuationParameters = this.createContinuationParameters(continuationType)
        const syntheticName = generateSyntheticFunctionName(
            continuationParameters,
            idl.IDLVoidType,
        )
        const continuationReference = idl.createReferenceType(syntheticName)

        if (!this.resolveTypeReference(continuationReference)) {
            const callback = idl.createCallback(continuationReference.name, continuationParameters, idl.IDLVoidType, { extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }] })
            this.continuationCallbacks.push(callback)
        }
        return continuationReference
    }
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType {
        const continuationParameters = this.createContinuationParameters(continuationType)
        const syntheticName = generateSyntheticFunctionName(
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

    findFileByOriginalFilename(filename: string): PeerFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    findComponentByDeclaration(iface: idl.IDLInterface): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration === iface || it.attributeDeclaration === iface)
    }

    findComponentByType(type: idl.IDLType): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            idl.forceAsNamedNode(type).name === it.interfaceDeclaration?.name ||
            idl.forceAsNamedNode(type).name === it.attributeDeclaration.name)
    }

    isComponentDeclaration(iface: idl.IDLInterface): boolean {
        return this.findComponentByDeclaration(iface) !== undefined
    }

    shouldGenerateComponent(name: string): boolean {
        return !this.componentsToGenerate.size || this.componentsToGenerate.has(name)
    }

    mapType(type: idl.IDLType): string {
        return this.targetNameConvertorInstance.convert(
            type ?? idl.IDLVoidType
        )
    }

    resolveTypeReference(type: idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        const entry = this.factory.resolveTypeReference(type)
        if (entry) {
            return entry
        }
        entries ??= this.files.flatMap(it => it.entries)
            .concat(this.continuationCallbacks)

        const qualifiedName = type.name
        const lastDot = qualifiedName.lastIndexOf(".")
        if (lastDot >= 0) {
            const qualifier = qualifiedName.slice(0, lastDot)
            const typeName = qualifiedName.slice(lastDot + 1)
            // This is a namespace or enum member. Try enum first
            const parent = entries.find(it => it.name === qualifier)
            if (parent && idl.isEnum(parent))
                return parent.elements.find(it => it.name === type.name)
            // Else try namespaces
            return entries.find(it =>
                it.name === typeName && idl.getExtAttribute(it, idl.IDLExtendedAttributes.Namespace) === qualifier)
        }

        const candidates = entries.filter(it => type.name === it.name)
        return candidates.length == 1
            ? candidates[0]
            : candidates.find(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Import))
    }

    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false): ArgConvertor {
        if (isOptionalParam) {
            return new OptionConvertor(this, param, idl.maybeUnwrapOptionalType(type))
        }
        if (idl.isOptionalType(type)) {
            return new OptionConvertor(this, param, type.type)
        }
        if (idl.isPrimitiveType(type)) {
            switch (type) {
                case idl.IDLI8Type: return new NumericConvertor(param, type)
                case idl.IDLU8Type: return new NumericConvertor(param, type)
                case idl.IDLI16Type: return new NumericConvertor(param, type)
                case idl.IDLU16Type: return new NumericConvertor(param, type)
                case idl.IDLI32Type: return new NumericConvertor(param, type)
                case idl.IDLU32Type: return new NumericConvertor(param, type)
                case idl.IDLI64Type: return new NumericConvertor(param, type)
                case idl.IDLU64Type: return new NumericConvertor(param, type)
                case idl.IDLF16Type: return new NumericConvertor(param, type)
                case idl.IDLF32Type: return new NumericConvertor(param, type)
                case idl.IDLF64Type: return new NumericConvertor(param, type)
                
                case idl.IDLBufferType: return new BufferConvertor(param)
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
            if (type.name === 'Date') {
                return new DateConvertor(param)
            }
            if (isImport(type))
                return new ImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
        }
        if (idl.isReferenceType(type)) {
            const decl = this.resolveTypeReference(type)
            return this.declarationConvertor(param, type, decl)
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
            return new CustomTypeConvertor(param, this.targetNameConvertorInstance.convert(type), true)
        }
        throw new Error(`Cannot convert: ${type.kind}`)
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor {
        let customConv = this.customConvertor(param, type.name, type)
        if (customConv)
            return customConv
        if (!declaration || isConflictingDeclaration(declaration))
            return new CustomTypeConvertor(param, this.targetNameConvertorInstance.convert(type), false, this.targetNameConvertorInstance.convert(type)) // assume some predefined type

        const declarationName = declaration.name!
        if (isImport(declaration)) {
            return new ImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
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
            return new InterfaceConvertor(this, declarationName, param, declaration)
        }
        if (idl.isClass(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(this, declarationName, param, declaration)
            }
            return new ClassConvertor(this, declarationName, param, declaration)
        }
        if (declaration.kind === idl.IDLKind.AnonymousInterface) {
            return new AggregateConvertor(this, param, type, declaration as idl.IDLInterface)
        }
        if (declaration.kind === idl.IDLKind.TupleInterface) {
            return new TupleConvertor(this, param, type, declaration as idl.IDLInterface)
        }
        throw new Error(`Unknown decl ${declarationName} of kind ${declaration.kind}`)
    }

    private customConvertor(param: string, typeName: string, type: idl.IDLReferenceType): ArgConvertor | undefined {
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
                return new OptionConvertor(this, param, type.typeArguments![0])
        }
        return undefined
    }

    readonly typeMap = new Map<idl.IDLType | idl.IDLEntry, [idl.IDLNode, boolean]>()

    getInteropName(node: idl.IDLNode) {
        return this.interopNameConvertorInstance.convert(node)
    }

    toDeclaration(type: idl.IDLType | idl.IDLTypedef | idl.IDLCallback | idl.IDLEnum | idl.IDLInterface): idl.IDLEntry | idl.IDLType {
        switch (type) {
            case idl.IDLAnyType: return ArkCustomObject
            case idl.IDLNullType: return idl.IDLNullType
            case idl.IDLVoidType: return idl.IDLVoidType
            case idl.IDLUndefinedType: return idl.IDLUndefinedType
            case idl.IDLUnknownType: return ArkCustomObject
            case idl.IDLObjectType: return ArkCustomObject
        }
        const typeName = idl.isNamedNode(type) ? type.name : undefined
        switch (typeName) {
            case "object":
            case "Object": return ArkCustomObject
        }
        if (isImport(type)) {
            return ArkCustomObject
        }
        if (idl.isReferenceType(type)) {
            // TODO: remove all this!
            if (type.name === 'Dimension' || type.name === 'Length') {
                return ArkLength
            }
            if (type.name === 'Date') {
                return ArkDate
            }
            if (type.name === 'AnimationRange' || type.name === 'ContentModifier') {
                return ArkCustomObject
            }
            if (type.name === 'Function') {
                return ArkFunction
            }
            if (type.name === 'Optional') {
                return this.toDeclaration((type as idl.IDLReferenceType).typeArguments![0])
            }
            const decl = this.resolveTypeReference(type)
            if (!decl) {
                warn(`undeclared type ${idl.DebugUtils.debugPrintType(type)}`)
            } else if (isConflictingDeclaration(decl)) {
                return ArkCustomObject
            }
            return !decl ? ArkCustomObject  // assume some builtin type
                : idl.isTypedef(decl) ? this.toDeclaration(decl.type)
                : decl
        }
        return type
    }

    requestType(type: idl.IDLType | idl.IDLInterface  | idl.IDLEnum , useToGenerate: boolean) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            declaration[1] ||= useToGenerate
            return
        }
        const decl = this.toDeclaration(type)
        this.typeMap.set(type, [decl, useToGenerate])
    }

    public get orderedDependencies(): idl.IDLNode[] {
        return this._orderedDependencies
    }
    private _orderedDependencies: idl.IDLNode[] = []

    public get orderedDependenciesToGenerate(): idl.IDLNode[] {
        return this._orderedDependenciesToGenerate
    }
    private _orderedDependenciesToGenerate: idl.IDLNode[] = []

    generateSynteticsRequired() {
        for (const file of this.files)
            for (const entry of file.entries)
                idl.forEachFunction(entry, function_ => {
                    const promise = idl.asPromise(function_.returnType)
                    if (promise)
                        this.requestType(this.createContinuationCallbackIfNeeded(promise), true)
                })
    }

    analyze() {///stolen from DeclTable
        this.createContinuationCallbacks()
        const callbacks = collectUniqueCallbacks(this)

        let orderer = new DependencySorter(this)
        for (let declaration of this.typeMap.values()) {
            orderer.addDep(declaration[0])
        }
        for (const callback of callbacks) orderer.addDep(callback)
        this._orderedDependencies = orderer.getToposorted()
        this._orderedDependencies.unshift(ArkInt32)

        let toGenerateOrderer = new DependencySorter(this)
        for (let declaration of this.typeMap.values()) {
            if (declaration[1])
                toGenerateOrderer.addDep(declaration[0])
        }
        for (const callback of callbacks) toGenerateOrderer.addDep(callback)
        this._orderedDependenciesToGenerate = toGenerateOrderer.getToposorted()
    }

    generateStructs(structs: LanguageWriter, typedefs: IndentedPrinter, writeToString: LanguageWriter) {
        new StructPrinter(this).generateStructs(structs, typedefs, writeToString)
    }

    private allTypes<T extends idl.IDLType>(predicate: (e: idl.IDLNode) => e is T): T[] {
        return this._orderedDependencies.filter(predicate)
    }

    private allEntries<T extends idl.IDLEntry>(predicate: (e: idl.IDLNode) => e is T): T[] {
        return this._orderedDependencies.filter(predicate)
    }

    allUnionTypes(): Map<string, {id: number, name: string}[]> {
        const data: Array<[string, {id: number, name: string}[]]> =
            this.allTypes(idl.isUnionType)
                .map(it => [
                    this.nativeNameConvertorInstance.convert(it),
                    it.types.map((e, index) => { return {id: index, name: "value" + index }})])
        return new Map(data)
    }

    allLiteralTypes(): Map<string, string[]> {
        const data: Array<[string, string[]]> =
            this.allEntries(idl.isAnonymousInterface)
                .map(it => [
                    this.nativeNameConvertorInstance.convert(it),
                    it.properties.map(p => p.name)])
        return new Map(data)
    }

    allOptionalTypes(): Set<string> {
        const data = this._orderedDependencies
            .filter(it => it !== idl.IDLVoidType)
            .map(it => idl.isType(it)
                ? this.nativeNameConvertorInstance.convert(idl.createOptionalType(it))
                : PrimitiveType.OptionalPrefix + cleanPrefix(this.nativeNameConvertorInstance.convert(it), PrimitiveType.Prefix)
            )
        return new Set(data)
    }

    flattenType(type: idl.IDLType, name?: string): idl.IDLType {
        if (idl.isUnionType(type)) {
            const allTypes = type.types.flatMap(it => convertType(this.unionFlattener, it))
            const uniqueTypes = new Set(allTypes)
            return typeOrUnion(
                uniqueTypes.size === allTypes.length ? type.types : Array.from(uniqueTypes),
                name)
        }
        return type
    }
}

export const ArkInt32 = idl.IDLI32Type
export const ArkInt64 = idl.IDLI64Type
export const ArkFunction = idl.IDLFunctionType
export const ArkLength = idl.IDLLengthType
export const ArkDate = idl.IDLDate
export const ArkCustomObject = idl.IDLCustomObjectType

export function cleanPrefix(name: string, prefix: string): string {
    return name.replace(prefix, "")
}
