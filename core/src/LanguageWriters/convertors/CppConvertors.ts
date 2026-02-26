/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as idl from '../../idl/index.js'
import { generatorConfiguration } from "../../config.js"
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from "../nameConvertor.js"
import { PrimitiveTypesInstance } from '../../peer-generation/PrimitiveType.js'
import { InteropArgConvertor } from './InteropConvertors.js'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver.js'
import { qualifiedName } from '../../peer-generation/idl/common.js'
import { isInIdlizeInternal } from '../../idl/index.js'
import { LibraryInterface } from '../../LibraryInterface.js'
import { isTopLevelConflicted } from '../../peer-generation/ConflictingDeclarations.js'
import { Language } from '../../Language.js'
import { maybeRestoreThrows, maybeTransformManagedCallback } from '../../transformers/transformUtils.js'

function isSubtypeTopLevelConflicted(library: LibraryInterface, node: idl.IDLType) {
    let hasConflicts = false
    idl.forEachChild(node, (child) => {
        if (idl.isReferenceType(child)) {
            const decl = library.resolveTypeReference(child)
            if (decl) {
                hasConflicts ||= isTopLevelConflicted(library, Language.CPP, decl)
            }
        }
    })
    return hasConflicts
}

export interface ConvertResult {
    text: string,
    noPrefix: boolean,
    resolvedType: idl.IDLType
}

export class GenericCppConvertor implements NodeConvertor<ConvertResult> {

    constructor(
        protected library: LibraryInterface,
    ) {}

    protected make(text: string, resolvedType: idl.IDLType, noPrefix = false): ConvertResult {
        return { text, noPrefix, resolvedType }
    }

    convertNode(node: idl.IDLNode): ConvertResult {
        return convertNode<ConvertResult>(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): ConvertResult {
        throw new Error("Internal error: namespaces are not allowed on the interop layer")
    }

    convertInterface(node: idl.IDLInterface): ConvertResult {
        let restoredThrow: idl.IDLType | undefined
        if (restoredThrow = maybeRestoreThrows(node, this.library)) {
            if (idl.isPrimitiveType(restoredThrow, 'this'))
                restoredThrow = idl.createPrimitiveType('void')
            return this.make(`Throws_${this.convertNode(restoredThrow).text}`, idl.createReferenceType(node), true)
        }
        switch (node.subkind) {
            case idl.IDLInterfaceSubkind.AnonymousInterface:
                return node.name
                    ? this.make(this.qualifiedName(node), idl.createReferenceType(node))
                    : this.make(this.computeTargetTypeLiteralName(node), idl.createReferenceType(node), true)
            case idl.IDLInterfaceSubkind.Interface:
            case idl.IDLInterfaceSubkind.Class:
                if (isInIdlizeInternal(node)) {
                    return this.make(this.qualifiedName(node), idl.createReferenceType(node), true)
                }
                return this.make(this.qualifiedName(node), idl.createReferenceType(node))
            case idl.IDLInterfaceSubkind.Tuple:
                return node.name
                    ? this.make(this.qualifiedName(node), idl.createReferenceType(node))
                    : this.make(`Tuple_${node.properties.map(it => this.convertNode(idl.maybeOptional(it.type, it.isOptional)).text).join("_")}`, idl.createReferenceType(node), true)
        }
    }
    convertEnum(node: idl.IDLEnum): ConvertResult {
        return this.make(this.qualifiedName(node), idl.createReferenceType(node))
    }
    convertTypedef(node: idl.IDLTypedef): ConvertResult {
        return this.make(this.qualifiedName(node), idl.createReferenceType(node))
    }
    convertCallback(node: idl.IDLCallback): ConvertResult {
        return this.make(generatorConfiguration().LibraryPrefix + this.qualifiedName(node), idl.createReferenceType(node), true)
    }
    convertMethod(node: idl.IDLMethod): ConvertResult {
        return this.make(node.name, idl.createReferenceType(node))
    }
    convertConstant(node: idl.IDLConstant): ConvertResult {
        return this.make(this.qualifiedName(node), idl.createReferenceType(node))
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    convertOptional(type: idl.IDLOptionalType): ConvertResult {
        const converted = this.convertNode(type.type)
        const prefix = generatorConfiguration().OptionalPrefix
        return this.make(prefix + converted.text, type, true)
    }
    convertUnion(type: idl.IDLUnionType): ConvertResult {
        return this.insideStructure(() => {
            if (type.parent && idl.isTypedef(type.parent)) {
                return this.make(type.parent.name, type, false)
            }
            return this.make('Union_' + type.types.map(it => convertType(this, it).text).join("_"), type, false)
        })
    }
    convertContainer(type: idl.IDLContainerType): ConvertResult {
        return this.insideStructure(() => {
            if (idl.IDLContainerUtils.isPromise(type)) {
                return this.make(`Promise_${this.convertNode(type.elementType[0]).text}`, type)
            }
            if (idl.IDLContainerUtils.isSequence(type)) {
                if (idl.isPrimitiveType(type.elementType[0], 'u8')) {
                    return this.make(`uint8_t*`, type, true)
                }
                return this.make(`Array_${this.convertNode(type.elementType[0]).text}`, type, true)
            }
            if (idl.IDLContainerUtils.isRecord(type)) {
                return this.make(`Map_${this.convertNode(type.elementType[0]).text}_${this.convertNode(type.elementType[1]).text}`, type, true)
            }
            throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
        })
    }
    convertImport(type: idl.IDLImport): ConvertResult {
        console.warn("Imports are not implemented yet")
        return this.make('CustomObject', idl.createPrimitiveType('CustomObject'))
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, _: string): ConvertResult {
        return this.convertTypeReference(type)
    }
    convertTypeReference(type: idl.IDLReferenceType): ConvertResult {
        const refName = type.name
        if (generatorConfiguration().parameterized.includes(refName)) {
            return this.make('CustomObject', idl.createPrimitiveType('CustomObject'))
        }
        let decl = this.library.toDeclaration(type)
        if (idl.isCallback(decl)) {
            decl = maybeTransformManagedCallback(decl, this.library) ?? decl
        }
        if (idl.isType(decl)) {
            return this.convertNode(decl)
        }
        let res = this.convertNode(decl as idl.IDLEntry)
        if (type.name === "Optional")
            res = this.make("Opt_" + res.text, idl.createOptionalType(type.typeArguments![0]), true)
        return res
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ConvertResult {
        return this.make('CustomObject', idl.createPrimitiveType('CustomObject'))
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ConvertResult {
        if (this.isInsideStructure) {
            switch (type.name) {
                case 'void':
                    return this.make(`Void`, type)
                case 'i32':
                    return this.make('I32', type)
                case 'u32':
                    return this.make('U32', type)
                case 'f32':
                    return this.make('F32', type)
                case 'i64':
                    return this.make('I64', type)
                case 'u64':
                    return this.make('U64', type)
                case 'f64':
                    return this.make('F64', type)
                case 'pointer':
                    return this.make('Pointer', type)
            }
        }
        switch (type.name) {
            case 'this': // maybe fix it in another level?
            case 'void': return this.make('void', type, true)
            case 'i8': return this.make(`Int8`, type)
            case 'u8': return this.make(`UInt8`, type)
            case 'i16': return this.make(`Int16`, type)
            case 'u16': return this.make(`UInt16`, type)
            case 'i32': return this.make(`Int32`, type)
            case 'u32': return this.make(`UInt32`, type)
            case 'i64': return this.make(`Int64`, type)
            case 'u64': return this.make(`UInt64`, type)
            case 'f32': return this.make(`Float32`, type)
            case 'f64': return this.make(`Float64`, type)
            case 'number': return this.make(`Number`, type)
            case 'String': return this.make(`String`, type)
            case 'boolean': return this.make(`Boolean`, type)
            case 'bigint': return this.make(`Int64`, type) // TODO add arbitrary precision numeric type
            case 'pointer': return this.make('NativePointer', type)
            case 'CustomObject': return this.make('CustomObject', type)
            case 'unknown':
            case 'Object':
            case 'any': return this.make(`Object`, type)
            case 'undefined': return this.make(`Undefined`, type)
            case 'Function': return this.make(`Function`, type)
            case 'date': return this.make(`Date`, type)
            case 'buffer': return this.make('Buffer', type)
            case 'SerializerBuffer': return this.make('KSerializerBuffer', type, true)
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    private qualifiedName(target: idl.IDLNode): string {
        if (idl.isEntry(target) && isTopLevelConflicted(this.library, Language.CPP, target)) {
            return qualifiedName(target, "_", "package.namespace.name")
        }
        return qualifiedName(target, "_", "namespace.name")
    }

    private computeTargetTypeLiteralName(decl: idl.IDLInterface): string {
        const map = new Map<string, string[]>()
        for (const prop of decl.properties) {
            const type = this.convertNode(prop.type)
            const values = map.has(type.text) ? map.get(type.text)! : []
            values.push(prop.name)
            map.set(type.text, values)
        }
        const names = Array.from(map.keys()).map(key => `${key}_${map.get(key)!.join('_')}`)
        return `Literal_${names.join('_')}`
    }

    protected isInsideStructure: boolean = false
    protected insideStructure<T>(cb: () => T) {
        const prevIsInsideScructure = this.isInsideStructure
        this.isInsideStructure = true
        const result = cb()
        this.isInsideStructure = prevIsInsideScructure
        return result
    }
}

export class CppConvertor extends GenericCppConvertor implements IdlNameConvertor {
    private unwrap(type: idl.IDLNode, result: ConvertResult): string {
        const conf = generatorConfiguration()
        if (result.noPrefix) {
            return result.text
        }
        const typePrefix = conf.TypePrefix
        // TODO remove this ugly hack for CustomObject's
        const libPrefix = this.isPrimitiveOrPrimitiveAlias(result.resolvedType) ? "" : conf.LibraryPrefix
        return `${typePrefix}${libPrefix}${result.text}`
    }

    private isPrimitiveOrPrimitiveAlias(type: idl.IDLNode): boolean {
        if (!idl.isType(type)) return false

        const { library } = this
        const seen = new Set<idl.IDLNode>
        while (type && idl.isReferenceType(type)) {
            const resolved = library.resolveTypeReference(type)
            if (!resolved) return false
            if (!idl.isTypedef(resolved)) break
            if (seen.has(resolved))
                return false
            seen.add(resolved)
            type = resolved.type
        }

        return idl.isPrimitiveType(type)
    }

    convert(node: idl.IDLNode): string {
        return this.unwrap(node, this.convertNode(node))
    }
}

export class CppNameConvertor implements IdlNameConvertor {
    private readonly cppConvertor: GenericCppConvertor
    constructor(protected library: LibraryInterface) {
        this.cppConvertor = new GenericCppConvertor(library)
    }
    convert(node: idl.IDLNode): string {
        return this.cppConvertor.convertNode(node).text
    }
}

export class StructureNameConvertor extends CppConvertor {
    constructor(library: LibraryInterface) {
        super(library)
        this.isInsideStructure = true
    }

    convert(node: idl.IDLNode): string {
        return this.convertNode(node).text
    }
}

export class CppInteropArgConvertor extends InteropArgConvertor {
    static INSTANCE = new CppInteropArgConvertor()

    convertOptional(type: idl.IDLOptionalType): string {
        return PrimitiveTypesInstance.NativePointer.getText()
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'boolean': return PrimitiveTypesInstance.Boolean.getText()
            case 'i32': return PrimitiveTypesInstance.Int32.getText()
            case 'number': return "KInteropNumber"
            case 'SerializerBuffer': return "KSerializerBuffer"
            case 'buffer': return "KInteropBuffer"
            case 'Function': return PrimitiveTypesInstance.Int32.getText()
            case 'date': return PrimitiveTypesInstance.Int64.getText()
            case 'pointer': return PrimitiveTypesInstance.NativePointer.getText()
        }
        return super.convertPrimitiveType(type)
    }
}

export class CppReturnTypeConvertor implements TypeConvertor<string> {
    private convertor: CppConvertor
    constructor(
        private library: LibraryInterface,
    ) {
        this.convertor = new CppConvertor(library)
    }
    isVoid(returnType: idl.IDLType): boolean {
        return this.convert(returnType) == 'void'
    }
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        // Promise return is done as CPS callback, thus return type is void.
        if (idl.IDLContainerUtils.isPromise(type)) return 'void'
        return this.convertor.convert(type)
    }
    convertImport(type: idl.IDLImport): string {
        console.warn("Imports are not implemented yet")
        return "void"
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        return this.convertor.convert(type)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return this.convertor.convert(type)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        if (idl.isPrimitiveType(type, 'undefined')) return 'void'
        return this.convertor.convert(type)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return this.convertor.convert(type)
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        return this.convertor.convert(type)
    }
    convertUnion(type: idl.IDLUnionType): string {
        return this.convertor.convert(type)
    }
}
