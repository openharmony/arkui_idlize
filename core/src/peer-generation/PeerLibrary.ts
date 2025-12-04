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
import {
    BufferConvertor, CallbackConvertor, DateConvertor, MapConvertor, PointerConvertor, TupleConvertor, TypeAliasConvertor,
    AggregateConvertor, StringConvertor, ClassConvertor, ArrayConvertor, FunctionConvertor, OptionConvertor,
    NumberConvertor, NumericConvertor, CustomTypeConvertor, UnionConvertor, MaterializedClassConvertor,
    ArgConvertor, BooleanConvertor, EnumConvertor, UndefinedConvertor, VoidConvertor, ImportTypeConvertor, InterfaceConvertor, BigIntToU64Convertor,
    ObjectConvertor,
    TransformOnSerializeConvertor,
    ThrowsConvertor,
} from "../LanguageWriters/ArgConvertors"
import { CppNameConvertor, StructureNameConvertor } from '../LanguageWriters/convertors/CppConvertors'
import { CJTypeNameConvertor } from '../LanguageWriters/convertors/CJConvertors'
import { CppConvertor } from '../LanguageWriters/convertors/CppConvertors'
import { ETSTypeNameConvertor } from '../LanguageWriters/convertors/ETSConvertors'
import { TSTypeNameConvertor } from '../LanguageWriters/convertors/TSConvertors'
import { LibraryInterface } from '../LibraryInterface'
import { generateSyntheticFunctionName, isImportAttr } from './idl/common'
import { MaterializedClass } from './Materialized'
import { LayoutManager, LayoutManagerStrategy } from './LayoutManager'
import { IDLLibrary, lib, query } from '../library'
import { isMaterialized } from './isMaterialized'
import { isInCurrentModule } from './modules'
import { generatorConfiguration } from '../config'
import { KotlinTypeNameConvertor } from '../LanguageWriters/convertors/KotlinConvertors'
import { NativeModuleType } from '../LanguageWriters/common'
import { toIdlType } from '../from-idl/deserialize'
import { createCachedReferenceResolver, ReferenceResolver } from './ReferenceResolver'
import { maybeRestoreThrows } from '../transformers/transformUtils'

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
                const line: GlobalScopeDeclarations = {
                    constants: [],
                    methods: []
                }
                const next = queue.pop()!
                next.forEach(node => {
                    if (!isInCurrentModule(node))
                        return
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
            files: this.files.map(file => file)
        }
        return this._cachedIdlLibrary
    }

    public get globals() {
        return query(this.asIDLLibrary(), lenses.globals)
    }

    public layout: LayoutManager = LayoutManager.Empty()

    private _files: idl.IDLFile[] = []
    public get files(): idl.IDLFile[] {
        return this._files
    }
    public set files(value: idl.IDLFile[]) {
        this._files = value
        this.resolver = createCachedReferenceResolver(value)
    }
    public readonly auxFiles: idl.IDLFile[] = []
    private resolver: ReferenceResolver = createCachedReferenceResolver([])

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get orderedMaterialized(): MaterializedClass[] {
        function accessorName(decl: idl.IDLEntry): string {
            return idl.getQualifiedName(decl, "namespace.name")
        }
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
            .sort((a, b) => accessorName(a.decl).localeCompare(accessorName(b.decl)))
    }

    constructor(
        public language: Language,
        public interopNativeModule: NativeModuleType,
        public readonly useMemoM3: boolean = false,
    ) { }

    public name: string = ""

    readonly customComponentMethods: string[] = []

    createLanguageWriter(language?: Language): LanguageWriter {
        return createLanguageWriter(language ?? this.language, this)
    }

    createTypeNameConvertor(language: Language): IdlNameConvertor {
        switch (language) {
            case Language.TS: return new TSTypeNameConvertor(this)
            case Language.ARKTS: return new ETSTypeNameConvertor(this)
            case Language.CJ: return new CJTypeNameConvertor(this)
            case Language.CPP: return new CppConvertor(this)
            case Language.KOTLIN: return new KotlinTypeNameConvertor(this)
        }
        throw new Error(`IdlNameConvertor for ${language} is not implemented`)
    }

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
            { nameConvertor: new StructureNameConvertor(this) }
        )
        const primaryReference = idl.createReferenceType(`synthetic.${syntheticName}`)
        if (this.resolveTypeReference(primaryReference, { unresolvedOk: true }))
            return primaryReference
        return idl.createReferenceType(`synthetic.synthetic_${syntheticName}`)
    }

    private context: string | undefined
    getCurrentContext(): string | undefined {
        return this.context
    }
    setCurrentContext(context: string | undefined) {
        this.context = context
    }

    findFileByOriginalFilename(filename: string): idl.IDLFile | undefined {
        return this.files.find(it => it.fileName === filename)
    }

    mapType(type: idl.IDLType): string {
        return this.createTypeNameConvertor(this.language).convert(type)
    }

    resolveTypeReference(type: idl.IDLReferenceType, options?: { terminalImports?: boolean, unresolvedOk?: boolean }): idl.IDLEntry | undefined {
        return this.resolver.resolveTypeReference(type, options)
    }

    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false): ArgConvertor {
        if (isOptionalParam) {
            return new OptionConvertor(this, param, idl.isOptionalType(type) ? type : idl.createOptionalType(type))
        }
        if (idl.isOptionalType(type)) {
            return new OptionConvertor(this, param, type)
        }
        if (idl.isPrimitiveType(type)) {
            switch (type) {
                case idl.IDLI8Type: return new NumericConvertor(this, param, type)
                case idl.IDLU8Type: return new NumericConvertor(this, param, type)
                case idl.IDLI16Type: return new NumericConvertor(this, param, type)
                case idl.IDLU16Type: return new NumericConvertor(this, param, type)
                case idl.IDLI32Type: return new NumericConvertor(this, param, type)
                case idl.IDLU32Type: return new NumericConvertor(this, param, type)
                case idl.IDLI64Type: return new NumericConvertor(this, param, type)
                case idl.IDLU64Type: return new NumericConvertor(this, param, type)
                case idl.IDLF16Type: return new NumericConvertor(this, param, type)
                case idl.IDLF32Type: return new NumericConvertor(this, param, type)
                case idl.IDLF64Type: return new NumericConvertor(this, param, type)
                case idl.IDLBigintType: return new BigIntToU64Convertor(param)
                case idl.IDLSerializerBuffer: new PointerConvertor(param)
                case idl.IDLPointerType: return new PointerConvertor(param)
                case idl.IDLBufferType: return new BufferConvertor(param)
                case idl.IDLBooleanType: return new BooleanConvertor(param)
                case idl.IDLStringType: return new StringConvertor(param)
                case idl.IDLNumberType: return new NumberConvertor(param)
                case idl.IDLUndefinedType: return new UndefinedConvertor(param)
                case idl.IDLVoidType: return new VoidConvertor(param)
                case idl.IDLUnknownType:
                case idl.IDLObjectType:
                case idl.IDLAnyType: return new ObjectConvertor(param, idl.IDLAnyType)
                case idl.IDLDate: return new DateConvertor(param)

                case idl.IDLFunctionType: return new FunctionConvertor(this, param)
                default: throw new Error(`Unconverted primitive ${idl.DebugUtils.debugPrintType(type)}`)
            }
        }
        if (idl.isReferenceType(type)) {
            // TODO: special cases for interop types.
            // TODO: this types are not references! NativeModulePrinter must be fixed
            switch (type.name.replaceAll('%TEXT%:', '')) { // this is really bad stub, to fix legacy references
                case 'KBoolean': return new BooleanConvertor(param)
                case 'KInt': return new NumericConvertor(this, param, idl.IDLI32Type)
                case 'KFloat': return new NumericConvertor(this, param, idl.IDLF32Type)
                case 'KLong': return new NumericConvertor(this, param, idl.IDLI64Type)
                case 'KDouble': return new NumericConvertor(this, param, idl.IDLF64Type)
                case 'KStringPtr': return new StringConvertor(param)
                case 'number': return new NumberConvertor(param)
                case 'KPointer': return new PointerConvertor(param)
            }
            if (generatorConfiguration().forceResource.includes(type.name)) {
                return new ObjectConvertor(param, type)
            }
            const decl = this.resolveTypeReference(type)
            if (decl && isImportAttr(decl) || !decl && isImportAttr(type))
                return new ImportTypeConvertor(param, this.createTypeNameConvertor(this.language).convert(type))
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
            return new CustomTypeConvertor(param, this.createTypeNameConvertor(this.language).convert(type), true, `<${type.name}>`)
        }
        throw new Error(`Cannot convert: ${type.kind}`)
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor {
        if (generatorConfiguration().forceResource.includes(type.name)) {
            return new ObjectConvertor(param, type)
        }
        let customConv = this.customConvertor(param, type.name, type)
        if (customConv)
            return customConv
        if (!declaration) {
            return new CustomTypeConvertor(param, this.createTypeNameConvertor(this.language).convert(type), false, this.createTypeNameConvertor(this.language).convert(type)) // assume some predefined type
        }

        const declarationName = declaration.name!
        if (isImportAttr(declaration)) {
            return new ImportTypeConvertor(param, this.createTypeNameConvertor(this.language).convert(type))
        }
        if (idl.isImport(declaration)) {
            throw new Error(`Unexpected declaration ${declaration.kind}`)
        }
        if (idl.hasExtAttribute(declaration, idl.IDLExtendedAttributes.TransformOnSerialize)) {
            const targetType = toIdlType("", idl.getExtAttribute(declaration, idl.IDLExtendedAttributes.TransformOnSerialize)!)
            return new TransformOnSerializeConvertor(param, this, declaration, targetType)
        }
        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration)
        }
        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent)
        }
        if (idl.isCallback(declaration)) {
            return new CallbackConvertor(this, param, declaration, this.interopNativeModule)
        }
        if (idl.isTypedef(declaration)) {
            if (forceTypedefAsResource(this, type, declaration)) return new ObjectConvertor(param, type)
            return new TypeAliasConvertor(this, param, declaration)
        }
        if (idl.isInterface(declaration)) {
            if (maybeRestoreThrows(declaration, this)) {
                return new ThrowsConvertor(this, param, declaration)
            }
            if (generatorConfiguration().forceResource.includes(declaration.name)) {
                return new ObjectConvertor(param, type)
            }
            if (isMaterialized(declaration, this)) {
                return new MaterializedClassConvertor(this, param, declaration)
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
                return new ObjectConvertor(param, idl.IDLObjectType)
            case `Date`:
                return new DateConvertor(param)
            case `Function`:
                return new FunctionConvertor(this, param)
            case `Record`:
                return new CustomTypeConvertor(param, "Record", false, "Record<string, string>")
            case `Optional`:
                throw new Error("Not expected to have reference type named Optional")
                // return new OptionConvertor(this, param, type.typeArguments![0])
        }
        return undefined
    }

    toDeclaration(type: idl.IDLType | idl.IDLTypedef | idl.IDLCallback | idl.IDLEnum | idl.IDLInterface): idl.IDLEntry | idl.IDLType {
        return toDeclaration(type, this)
    }
    setFileLayout(strategy: LayoutManagerStrategy) {
        this.layout = new LayoutManager(strategy)
    }
    withFileLayout(strategy: LayoutManagerStrategy, op:() => void) {
        const old = this.layout
        this.layout = new LayoutManager(strategy)
        op()
        this.layout = old
    }
}

export const ArkInt32 = idl.IDLI32Type
export const ArkInt64 = idl.IDLI64Type
export const ArkFunction = idl.IDLFunctionType
export const ArkDate = idl.IDLDate
export const ArkCustomObject = idl.IDLCustomObjectType

export function cleanPrefix(name: string, prefix: string): string {
    return name.replace(prefix, "")
}

export function forceTypedefAsResource(resolver: ReferenceResolver, type: idl.IDLType, decl: idl.IDLTypedef): boolean {
    if (generatorConfiguration().forceResource.includes(idl.getFQName(decl))) return true
    if (isCyclicTypeDef(resolver, decl)) {
        warn(`Cyclic typedef: ${idl.DebugUtils.debugPrintType(type)}`)
        return true
    }
    return false
}

function isCyclicTypeDef(resolver: ReferenceResolver, decl: idl.IDLTypedef): boolean {
    let foundCycle = false
    idl.forEachChild(decl, (node) => {
        if (idl.isReferenceType(node) && resolver.resolveTypeReference(node) === decl)
            foundCycle = true
    })
    return foundCycle
}

export function toDeclaration(type: idl.IDLType | idl.IDLEntry, resolver: ReferenceResolver): idl.IDLEntry | idl.IDLType {
    switch (type) {
        case idl.IDLAnyType: return ArkCustomObject
        case idl.IDLVoidType: return idl.IDLVoidType
        case idl.IDLUndefinedType: return idl.IDLUndefinedType
        case idl.IDLUnknownType: return ArkCustomObject
        // case idl.IDLObjectType: return ArkCustomObject
    }
    const typeName = idl.isNamedNode(type) ? type.name : undefined
    switch (typeName) {
        case "object":
        case "Object": return idl.IDLObjectType
    }
    if (idl.isReferenceType(type)) {
        // TODO: remove all this!
        if (type.name === 'Date') {
            return ArkDate
        }
        if (type.name === 'AnimationRange') {
            return ArkCustomObject
        }
        if (type.name === 'Function') {
            return ArkFunction
        }
        if (type.name === 'Optional') {
            return toDeclaration((type as idl.IDLReferenceType).typeArguments![0], resolver)
        }
        const decl = resolver.resolveTypeReference(type)
        if (!decl) {
            warn(`undeclared type ${idl.DebugUtils.debugPrintType(type)}`)
        }
        if (decl && idl.isTypedef(decl) && forceTypedefAsResource(resolver, type, decl)) {
            return idl.IDLObjectType
        }
        if (decl && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)) {
            const type = toIdlType("", idl.getExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)!)
            return toDeclaration(type, resolver)
        }
        return !decl ? ArkCustomObject  // assume some builtin type
            : idl.isTypedef(decl) ? toDeclaration(decl.type, resolver)
                : decl
    }
    if (isImportAttr(type)) {
        return ArkCustomObject
    }
    return type
}
