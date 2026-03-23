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

import * as idl from '../idl/index.js'
import { Language } from '../Language.js'
import { LanguageWriter } from '../LanguageWriters/LanguageWriter.js'
import { createLanguageWriter, IdlNameConvertor } from '../LanguageWriters/index.js'
import {
    BufferConvertor, CallbackConvertor, DateConvertor, MapConvertor, PointerConvertor, TupleConvertor, TypeAliasConvertor,
    AggregateConvertor, StringConvertor, ClassConvertor, ArrayConvertor, FunctionConvertor, OptionConvertor,
    NumberConvertor, NumericConvertor, CustomTypeConvertor, UnionConvertor, MaterializedClassConvertor,
    ArgConvertor, BooleanConvertor, EnumConvertor, UndefinedConvertor, VoidConvertor, ImportTypeConvertor, InterfaceConvertor, BigIntToU64Convertor,
    ObjectConvertor,
    TransformOnSerializeConvertor,
    ThrowsConvertor,
    SetConvertor,
} from "../LanguageWriters/ArgConvertors.js"
import { CppNameConvertor, StructureNameConvertor } from '../LanguageWriters/convertors/CppConvertors.js'
import { CJTypeNameConvertor } from '../LanguageWriters/convertors/CJConvertors.js'
import { CppConvertor } from '../LanguageWriters/convertors/CppConvertors.js'
import { ETSTypeNameConvertor } from '../LanguageWriters/convertors/ETSConvertors.js'
import { TSTypeNameConvertor } from '../LanguageWriters/convertors/TSConvertors.js'
import { LibraryInterface } from '../LibraryInterface.js'
import { generateSyntheticFunctionName, isImportAttr } from './idl/common.js'
import { MaterializedClass } from './Materialized.js'
import { LayoutManager, LayoutManagerStrategy } from './LayoutManager.js'
import { IDLLibrary, lib, query } from '../library.js'
import { isMaterialized } from './isMaterialized.js'
import { isInCurrentModule } from './modules.js'
import { generatorConfiguration } from '../config.js'
import { KotlinTypeNameConvertor } from '../LanguageWriters/convertors/KotlinConvertors.js'
import { NativeModuleType } from '../LanguageWriters/common.js'
import { toIdlType } from '../from-idl/deserialize.js'
import { createCachedReferenceResolver, ReferenceResolver } from './ReferenceResolver.js'
import { maybeRestoreGenerics, maybeRestoreThrows } from '../transformers/transformUtils.js'

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
            const errorType = idl.createOptionalType(idl.createContainerType("sequence", [idl.createPrimitiveType('String')]))
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
            idl.createPrimitiveType('void'),
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

    isHandwritten(node: idl.IDLEntry | idl.IDLReferenceType): boolean {
        if (idl.isEntry(node)) {
            return idl.isHandwritten(node)
        }
        const entry = this.resolveTypeReference(node)
        if (entry) {
            return this.isHandwritten(entry)
        }
        return false
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
            switch (type.name) {
                case 'i8': return new NumericConvertor(this, param, type)
                case 'u8': return new NumericConvertor(this, param, type)
                case 'i16': return new NumericConvertor(this, param, type)
                case 'u16': return new NumericConvertor(this, param, type)
                case 'i32': return new NumericConvertor(this, param, type)
                case 'u32': return new NumericConvertor(this, param, type)
                case 'i64': return new NumericConvertor(this, param, type)
                case 'u64': return new NumericConvertor(this, param, type)
                case 'f16': return new NumericConvertor(this, param, type)
                case 'f32': return new NumericConvertor(this, param, type)
                case 'f64': return new NumericConvertor(this, param, type)
                case 'bigint': return new BigIntToU64Convertor(param, type)
                case 'SerializerBuffer': new PointerConvertor(param, type)
                case 'pointer': return new PointerConvertor(param, type)
                case 'buffer': return new BufferConvertor(param, type)
                case 'boolean': return new BooleanConvertor(param, type)
                case 'String': return new StringConvertor(param, type)
                case 'number': return new NumberConvertor(param, type)
                case 'undefined': return new UndefinedConvertor(param, type)
                case 'void': return new VoidConvertor(param, type)
                case 'unknown':
                case 'Object':
                case 'any': return new ObjectConvertor(param, idl.createPrimitiveType('any'))
                case 'date': return new DateConvertor(param, type)

                case 'Function': return new FunctionConvertor(this, param, type)
                default: throw new Error(`Unconverted primitive ${idl.DebugUtils.debugPrintType(type)}`)
            }
        }
        if (idl.isReferenceType(type)) {
            // Improve: special cases for interop types.
            // Improve: this types are not references! NativeModulePrinter must be fixed
            switch (type.name.replaceAll('%TEXT%:', '')) { // this is really bad stub, to fix legacy references
                case 'KBoolean': return new BooleanConvertor(param, idl.createPrimitiveType('boolean'))
                case 'KInt': return new NumericConvertor(this, param, idl.createPrimitiveType('i32'))
                case 'KFloat': return new NumericConvertor(this, param, idl.createPrimitiveType('f32'))
                case 'KLong': return new NumericConvertor(this, param, idl.createPrimitiveType('i64'))
                case 'KDouble': return new NumericConvertor(this, param, idl.createPrimitiveType('f64'))
                case 'KStringPtr': return new StringConvertor(param, idl.createPrimitiveType('String'))
                case 'number': return new NumberConvertor(param, idl.createPrimitiveType('number'))
                case 'KPointer': return new PointerConvertor(param, idl.createPrimitiveType('pointer'))
                case 'Int8Array': case 'Int16Array': case 'Int32Array':
                case 'Uint8ClampedArray': case 'Uint8Array': case 'Uint16Array': case 'Uint32Array':
                case 'Float16Array': case 'Float32Array': case 'Float64Array':
                case 'BigInt64Array': case 'BigUint64Array':
                case 'FixedArray': case 'ReadonlyArray':
                case 'DataView': return new BufferConvertor(param, idl.createPrimitiveType('buffer'))
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
            // Improve: unlikely correct.
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
            const sourceType = type
            const targetType = toIdlType("", idl.getExtAttribute(declaration, idl.IDLExtendedAttributes.TransformOnSerialize)!)
            return new TransformOnSerializeConvertor(param, this, declaration, sourceType, targetType)
        }
        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration, this)
        }
        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent, this)
        }
        if (idl.isCallback(declaration)) {
            return new CallbackConvertor(this, param, declaration, this.interopNativeModule)
        }
        if (idl.isTypedef(declaration)) {
            if (isSetDeclaration(this, declaration)) return new SetConvertor(this, param, declaration)
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
                return new ObjectConvertor(param, idl.createPrimitiveType('Object'))
            case `Date`:
                return new DateConvertor(param, idl.createPrimitiveType('date'))
            case `Function`:
                return new FunctionConvertor(this, param, idl.createPrimitiveType('Function'))
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


export function cleanPrefix(name: string, prefix: string): string {
    return name.replace(prefix, "")
}

export function forceTypedefAsResource(resolver: ReferenceResolver, type: idl.IDLType, decl: idl.IDLTypedef): boolean {
    if (idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)) return false
    if (generatorConfiguration().forceResource.includes(decl.name) ||
        generatorConfiguration().forceResource.includes(idl.getFQName(decl))) return true
    if (isCyclicTypeDef(resolver, decl)) {
        console.warn(`Cyclic typedef: ${idl.DebugUtils.debugPrintType(type)}`)
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
    if (idl.isPrimitiveType(type)) {
        switch (type.name) {
            case 'any': return idl.createPrimitiveType('CustomObject')
            case 'void': return idl.createPrimitiveType('void')
            case 'undefined': return idl.createPrimitiveType('undefined')
            case 'unknown': return idl.createPrimitiveType('CustomObject')
            // case 'Object': return ArkCustomObject
        }
    }
    const typeName = idl.isNamedNode(type) ? type.name : undefined
    switch (typeName) {
        case "object":
        case "Object": return idl.createPrimitiveType('Object')
    }
    if (idl.isReferenceType(type)) {
        // Improve: remove all this!
        if (type.name === 'Date') {
            return idl.createPrimitiveType('date')
        }
        if (type.name === 'AnimationRange') {
            return idl.createPrimitiveType('CustomObject')
        }
        if (type.name === 'Function') {
            return idl.createPrimitiveType('Function')
        }
        if (type.name === 'Optional') {
            return toDeclaration((type as idl.IDLReferenceType).typeArguments![0], resolver)
        }
        const decl = resolver.resolveTypeReference(type)
        if (!decl) {
            console.warn(`undeclared type ${idl.DebugUtils.debugPrintType(type)}`)
        }
        if (decl && idl.isTypedef(decl) && forceTypedefAsResource(resolver, type, decl)) {
            return idl.createPrimitiveType('Object')
        }
        if (decl && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)) {
            const type = toIdlType("", idl.getExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)!)
            return toDeclaration(type, resolver)
        }
        return !decl ? idl.createPrimitiveType('CustomObject')  // assume some builtin type
            : idl.isTypedef(decl) ? toDeclaration(decl.type, resolver)
                : decl
    }
    if (isImportAttr(type)) {
        return idl.createPrimitiveType('CustomObject')
    }
    return type
}

function isSetDeclaration(resolver: ReferenceResolver, decl: idl.IDLEntry) {
    const restoredReference = maybeRestoreGenerics(decl, resolver)
    const restored = restoredReference ? resolver.resolveTypeReference(restoredReference) : undefined
    return restored && idl.getFQName(restored) === idl.IDLSetTypeName
}
