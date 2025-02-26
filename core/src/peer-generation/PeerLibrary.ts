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

import { warn } from 'console'
import * as idl from '../idl'
import { Language } from '../Language'
import { LanguageWriter } from '../LanguageWriters/LanguageWriter'
import { createLanguageWriter, IdlNameConvertor } from '../LanguageWriters'
import { BufferConvertor, CallbackConvertor, DateConvertor, MapConvertor, PointerConvertor, TupleConvertor, TypeAliasConvertor,
         AggregateConvertor, StringConvertor, ClassConvertor, ArrayConvertor, FunctionConvertor, OptionConvertor,
         NumberConvertor, NumericConvertor, CustomTypeConvertor, UnionConvertor, MaterializedClassConvertor,
         ArgConvertor, BooleanConvertor, EnumConvertor, UndefinedConvertor, VoidConvertor, ImportTypeConvertor, InterfaceConvertor, BigIntToU64Convertor,
} from "../LanguageWriters/ArgConvertors"
import { CppNameConvertor } from '../LanguageWriters/convertors/CppConvertors'
import { CJTypeNameConvertor } from '../LanguageWriters/convertors/CJConvertors'
import { CppConvertor } from '../LanguageWriters/convertors/CppConvertors'
import { ETSTypeNameConvertor } from '../LanguageWriters/convertors/ETSConvertors'
import { JavaTypeNameConvertor } from '../LanguageWriters/convertors/JavaConvertors'
import { TSTypeNameConvertor } from '../LanguageWriters/convertors/TSConvertors'
import { LibraryInterface } from '../LibraryInterface'
import { BuilderClass, isBuilderClass } from './BuilderClass'
import { generateSyntheticFunctionName, isImportAttr } from './idl/common'
import { MaterializedClass } from './Materialized'
import { PeerFile } from './PeerFile'
import { LayoutManager, LayoutManagerStrategy } from './LayoutManager'
import { IDLLibrary, lib, query } from '../library'
import { isMaterialized } from './isMaterialized'

export interface GlobalScopeDeclarations {
    methods: idl.IDLMethod[]
    constants: idl.IDLConstant[]
}

export const lenses = {
    globals: lib.lens(lib.select.files())
        .pipe(lib.select.nodes())
        .pipe(lib.req('globals', (nodes: idl.IDLNode[]): GlobalScopeDeclarations[] => {
            const result: GlobalScopeDeclarations[] = []
            const queue: idl.IDLNode[][] = [nodes]
            while (queue.length) {
                const line: GlobalScopeDeclarations= {
                    constants: [],
                    methods: []
                }
                const next = queue.pop()!
                next.forEach(node => {
                    if (idl.isNamespace(node)) {
                        queue.push(node.members)
                    }
                    if (idl.isConstant(node)) {
                        line.constants.push(node)
                    }
                    if (idl.isMethod(node)) {
                        line.methods.push(node)
                    }

                })
                if (line.constants.length || line.methods.length) {
                    result.push(line)
                }
            }
            return result
        }))
}

export class PeerLibrary implements LibraryInterface {
    private _cachedIdlLibrary?: IDLLibrary
    asIDLLibrary(): IDLLibrary {
        if (this._cachedIdlLibrary) {
            return this._cachedIdlLibrary
        }
        this._cachedIdlLibrary = {
            files: this.files.map(file => file.file)
        }
        return this._cachedIdlLibrary
    }

    public get globals() { return query(this.asIDLLibrary(), lenses.globals) }

    public layout: LayoutManager = LayoutManager.Empty()

    private _syntheticFile: idl.IDLFile = idl.createFile([])
    public initSyntheticEntries(file: idl.IDLFile) {
        this._syntheticFile = file
    }
    public getSyntheticData() {
        return this._syntheticFile.entries.filter(it => idl.isInterface(it)) as idl.IDLInterface[]
    }
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
        public libraryPackages: string[] | undefined,
    ) {}

    public name: string = ""

    readonly customComponentMethods: string[] = []

    createLanguageWriter(language?: Language): LanguageWriter {
        return createLanguageWriter(language ?? this.language, this)
    }

    createTypeNameConvertor(language: Language): IdlNameConvertor {
        switch (language) {
            case Language.TS: return new TSTypeNameConvertor(this)
            case Language.ARKTS: return new ETSTypeNameConvertor(this)
            case Language.JAVA: return new JavaTypeNameConvertor(this)
            case Language.CJ: return new CJTypeNameConvertor(this)
            case Language.CPP: return new CppConvertor(this)
        }
        throw new Error(`IdlNameConvertor for ${language} is not implemented`)
    }

    protected readonly targetNameConvertorInstance: IdlNameConvertor = this.createTypeNameConvertor(this.language)
    private readonly interopNameConvertorInstance: IdlNameConvertor = new CppNameConvertor(this)

    get libraryPrefix(): string {
        return this.name ? this.name + "_" : ""
    }

    createContinuationParameters(continuationType: idl.IDLType): idl.IDLParameter[] {
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

    mapType(type: idl.IDLType): string {
        return this.targetNameConvertorInstance.convert(type)
    }

    resolveTypeReference(type: idl.IDLReferenceType): idl.IDLEntry | undefined {
        return this.resolveTypeReferenceScoped(type)
    }

    private resolveTypeReferenceScoped(type: idl.IDLReferenceType, pointOfView?: idl.IDLEntry, rootEntries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        const entry = this._syntheticFile.entries.find(it => it.name === type.name)
        if (entry)
            return entry

        const qualifiedName = type.name.split(".");

        let pointOfViewNamespace = idl.fetchNamespaceFrom(type.parent)

        rootEntries ??= this.files.flatMap(it => it.entries)
        if (1 === qualifiedName.length) {
            const predefined = rootEntries.filter(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Predefined))
            predefined.push(...this.predefinedDeclarations)
            const found = predefined.find(it => it.name === qualifiedName[0])
            if (found)
                return found;
        }

        let doWork = true
        while (doWork) {
            doWork = !!pointOfViewNamespace
            let entries = pointOfViewNamespace
                ? [...pointOfViewNamespace.members]
                : [...rootEntries]
            for (let qualifiedNamePart = 0; qualifiedNamePart < qualifiedName.length; ++qualifiedNamePart) {
                const candidates = entries.filter(it => it.name === qualifiedName[qualifiedNamePart])
                if (!candidates.length)
                    break
                if (qualifiedNamePart === qualifiedName.length - 1) {
                    const target = candidates.length == 1
                        ? candidates[0]
                        : candidates.find(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Import)) // probably the wrong logic here
                    if (target && idl.isImport(target))// Temporary disable Import declarations
                        return undefined
                    return target
                }
                entries = []
                for (const candidate of candidates) {
                    if (idl.isNamespace(candidate))
                        entries.push(...candidate.members)
                    else if (idl.isEnum(candidate))
                        entries.push(...candidate.elements)
                    else if (idl.isInterface(candidate))
                        entries.push(...candidate.constants, ...candidate.properties, ...candidate.methods)
                }
            }

            pointOfViewNamespace = idl.fetchNamespaceFrom(pointOfViewNamespace?.parent)
        }

        // TODO: remove the next block after namespaces out of quarantine
        if (!pointOfView) {
            const resolveds: idl.IDLEntry[] = []
            const traverseNamespaces = (entry: idl.IDLEntry) => {
                if (entry && idl.isNamespace(entry) && entry.members.length) {
                    //console.log(`Try alien namespace '${idl.getNamespacesPathFor(entry.members[0]).map(obj => obj.name).join(".")}' to resolve name '${type.name}'`)
                    const resolved = this.resolveTypeReferenceScoped(type, entry, rootEntries)
                    if (resolved)
                        resolveds.push(resolved)
                    entry.members.forEach(traverseNamespaces)
                }
            }
            this.files.forEach(file => file.entries.forEach(traverseNamespaces))

            if (resolveds.length)
                console.log(`WARNING: Type reference '${type.name}' is not resolved without own namespace/pointOfView but resolved within some other namespace: '${idl.getNamespacesPathFor(resolveds[0]).map(obj => obj.name).join(".")}'`)
        }// end of block to remove

        return undefined // empty result
    }
    hasInLibrary(entry: idl.IDLEntry): boolean {
        return !this.libraryPackages?.length || this.libraryPackages?.includes(idl.getPackageName(entry))
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
                case idl.IDLBigintType: return new BigIntToU64Convertor(param)
                case idl.IDLPointerType: return new PointerConvertor(param)

                case idl.IDLBufferType: return new BufferConvertor(param)
                case idl.IDLBooleanType: return new BooleanConvertor(param)
                case idl.IDLStringType: return new StringConvertor(param)
                case idl.IDLNumberType: return new NumberConvertor(param)
                case idl.IDLUndefinedType: return new UndefinedConvertor(param)
                case idl.IDLVoidType: return new VoidConvertor(param)
                case idl.IDLUnknownType:
                case idl.IDLAnyType: return new CustomTypeConvertor(param, "Any", false, "Object")
                default: throw new Error(`Unconverted primitive ${idl.DebugUtils.debugPrintType(type)}`)
            }
        }
        if (idl.isReferenceType(type)) {
            if (isImportAttr(type))
                return new ImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
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
            return new CustomTypeConvertor(param, this.targetNameConvertorInstance.convert(type), true, `<${type.name}>`)
        }
        throw new Error(`Cannot convert: ${type.kind}`)
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor {
        let customConv = this.customConvertor(param, type.name, type)
        if (customConv)
            return customConv
        if (!declaration)
            return new CustomTypeConvertor(param, this.targetNameConvertorInstance.convert(type), false, this.targetNameConvertorInstance.convert(type)) // assume some predefined type

        const declarationName = declaration.name!
        if (isImportAttr(declaration)) {
            return new ImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
        }
        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration)
        }
        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent)
        }
        if (idl.isCallback(declaration)) {
            return new CallbackConvertor(this, param, declaration)
        }
        if (idl.isTypedef(declaration)) {
            if (isCyclicTypeDef(declaration)) {
                warn(`Cyclic typedef: ${idl.DebugUtils.debugPrintType(type)}`)
                return new CustomTypeConvertor(param, declaration.name, false, declaration.name)
            }
            return new TypeAliasConvertor(this, param, declaration)
        }
        if (idl.isInterface(declaration)) {
            if (isMaterialized(declaration, this)) {
                return new MaterializedClassConvertor(param, declaration)
            }
            if (isBuilderClass(declaration)) {
                return new ClassConvertor(this, declarationName, param, declaration)
            }
            switch (declaration.subkind) {
                case idl.IDLInterfaceSubkind.Interface:
                case idl.IDLInterfaceSubkind.Class:
                    return new InterfaceConvertor(this, declarationName, param, declaration)
                case idl.IDLInterfaceSubkind.AnonymousInterface:
                    return new AggregateConvertor(this, param, type, declaration as idl.IDLInterface)
                case idl.IDLInterfaceSubkind.Tuple:
                    return new TupleConvertor(this, param, type, declaration as idl.IDLInterface)
            }
        }
        throw new Error(`Unknown decl ${declarationName} of kind ${declaration.kind}`)
    }

    private customConvertor(param: string, typeName: string, type: idl.IDLReferenceType): ArgConvertor | undefined {
        switch (typeName) {
            case `Object`:
                return new CustomTypeConvertor(param, "Object", false, "Object")
            case `Date`:
                return new DateConvertor(param)
            case `Function`:
                return new FunctionConvertor(this, param, type as idl.IDLReferenceType)
            case `Record`:
                return new CustomTypeConvertor(param, "Record", false, "Record<string, string>")
            case `Optional`:
                return new OptionConvertor(this, param, type.typeArguments![0])
        }
        return undefined
    }

    getInteropName(node: idl.IDLNode) {
        return this.interopNameConvertorInstance.convert(node)
    }

    toDeclaration(type: idl.IDLType | idl.IDLTypedef | idl.IDLCallback | idl.IDLEnum | idl.IDLInterface): idl.IDLEntry | idl.IDLType {
        switch (type) {
            case idl.IDLAnyType: return ArkCustomObject
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
        if (isImportAttr(type)) {
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
            }
            if (decl && idl.isTypedef(decl) && isCyclicTypeDef(decl)) {
                warn(`Cyclic typedef: ${idl.DebugUtils.debugPrintType(type)}`)
                return ArkCustomObject
            }
            return !decl ? ArkCustomObject  // assume some builtin type
                : idl.isTypedef(decl) ? this.toDeclaration(decl.type)
                    : decl
        }
        return type
    }
    setFileLayout(strategy: LayoutManagerStrategy) {
        this.layout = new LayoutManager(strategy)
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

function isCyclicTypeDef(decl: idl.IDLTypedef): boolean {
    return idl.isReferenceType(decl.type) && idl.isNamedNode(decl.type) && decl.type.name == decl.name
}