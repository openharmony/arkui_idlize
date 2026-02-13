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
import { isMaterialized } from '../../peer-generation/isMaterialized'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from '../nameConvertor'
import { InteropArgConvertor, InteropReturnTypeConvertor } from './InteropConvertors'
import { isTopLevelConflicted } from '../../peer-generation/ConflictingDeclarations'
import { isDeclaredInCurrentFile, LayoutNodeRole } from '../../peer-generation/LayoutManager'
import { Language } from '../../Language'
import { LibraryInterface } from '../../LibraryInterface'
import { maybeRestoreGenerics, maybeRestoreThrows } from '../../transformers/transformUtils'
import { LanguageWriter } from '../LanguageWriter'

const KBoolean = "KBoolean"
const KByte = "KByte"
const KUByte = "KUByte"
const KShort = "KShort"
const KUShort = "KUShort"
const KInt = "KInt"
const KUInt = "KUInt"
const KLong = "KLong"
const KULong = "KULong"
const KFloat = "KFloat"
const KDouble = "KDouble"
const KNativePointer = "KNativePointer"
const KStringPtr = "KStringPtr"
const KInteropReturnBuffer = "KInteropReturnBuffer"
const KInteropBuffer = "KInteropBuffer"
const KSerializerBuffer = "KSerializerBuffer"
const KUint8ArrayPtr = "KUint8ArrayPtr"
const KInt32ArrayPtr = "KInt32ArrayPtr"
const KFloat32ArrayPtr = "KFloat32ArrayPtr"
const Unit = "Unit"

// used for Kotlin code
export class KotlinTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(protected library: LibraryInterface) { }

    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): string {
        return node.name
    }
    convertInterface(node: idl.IDLInterface): string {
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, 'namespace.name')
    }
    convertEnum(node: idl.IDLEnum): string {
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, 'namespace.name')
    }
    convertTypedef(node: idl.IDLTypedef): string {
        if (idl.isSyntheticEntry(node)) {
            return this.convert(node.type)
        }
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, 'namespace.name')
    }
    convertCallback(node: idl.IDLCallback): string {
        if (idl.isSyntheticEntry(node)) {
            return this.mapCallback(node)
        }
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, 'namespace.name')
    }
    convertMethod(node: idl.IDLMethod): string {
        return node.name
    }
    convertConstant(node: idl.IDLConstant): string {
        return node.name
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return `${this.convert(type.type)}?`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return "Union_" + type.types.map(it => idl.generateSyntheticIdlNodeName(it)).join("_")
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            return `Array<${convertType(this, type.elementType[0])}>`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const stringes = type.elementType.slice(0, 2).map(it => convertType(this, it))
            return `MutableMap<${stringes[0]}, ${stringes[1]}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Promise<${this.convert(type.elementType[0])}>`
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertImport(type: idl.IDLImport): string {
        throw new Error("Not implemented")
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error("Not implemented")
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        let decl = this.library.resolveTypeReference(type)
        if (decl) {
            if (idl.isSyntheticEntry(decl)) {
                if (idl.isCallback(decl)) {
                    return this.mapCallback(decl)
                }
                if (idl.isTypedef(decl)) {
                    return this.convert(decl.type)
                }
            }

            let restoredThrow: idl.IDLType | undefined
            if (restoredThrow = maybeRestoreThrows(decl, this.library)) {
                if (LanguageWriter.isManagedThrowsTypeUnwrapped)
                    return this.convert(restoredThrow)
                if (idl.isPrimitiveType(restoredThrow, 'this'))
                    return this.convert(idl.createReferenceType(idl.IDLThrowsTypeName, [idl.createPrimitiveType('void')]))
            }

            let maybeRestoredGeneric = maybeRestoreGenerics(type, this.library)
            if (maybeRestoredGeneric) {
                type = maybeRestoredGeneric
                decl = this.library.resolveTypeReference(maybeRestoredGeneric)
            }
            let typeSpec = type.name
            let typeArgs = type.typeArguments?.map(it => this.convert(it))
            if (typeSpec === `Optional`) {
                return `${typeArgs}?`
            }
            // if (typeSpec === `Function`) {
            //     return this.mapFunctionType(typeArgs)
            // }

            const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(", ")}>`
            if (decl) {
                const path = idl.getNamespacesPathFor(decl).map(it => it.name)
                path.push(decl.name)
                return `${this.mangleTopLevel(decl) ?? path.join(".")}${maybeTypeArguments}`
            }
            return `${type.name}${maybeTypeArguments}`
        }
        return this.convert(idl.createPrimitiveType('CustomObject'))
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'Function': return 'Function'

            case 'unknown':
            case 'CustomObject': return 'Any'
            case 'this': return 'this'
            case 'Object': return 'Any'
            case 'any': return 'Any'
            case 'undefined': return 'Nothing?'
            case 'pointer': return 'KPointer'
            case 'SerializerBuffer': return 'KSerializerBuffer'
            case 'void': return Unit
            case 'boolean': return 'Boolean'
            
            case 'i8': return 'Byte'
            case 'u8': return 'UByte'
            case 'i16': return 'Short'
            case 'u16': return 'UShort'
            case 'i32': return 'Int'
            case 'u32': return  'UInt'
            case 'i64': return 'Long'
            case 'u64': return 'ULong'
            case 'f32': return 'Float'
            case 'f64': return 'Double'
            case 'number': return 'Double'

            case 'bigint':
                return 'Long'

            case 'String':
                return 'String'

            case 'date':
                return 'Instant'

            case 'buffer':
                return 'NativeBuffer'

            case 'InteropReturnBuffer':
                return KInteropReturnBuffer
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    private mangleTopLevel(decl: idl.IDLEntry): string | undefined {
        if (!isDeclaredInCurrentFile(this.library.layout, { node: decl, role: LayoutNodeRole.INTERFACE }) && isTopLevelConflicted(this.library, Language.KOTLIN, decl)) {
            const namespaces = idl.getNamespacesPathFor(decl)
            if (namespaces.length === 0) {
                return idl.getQualifiedName(decl, "package.namespace.name").replaceAll('.', '_')
            }
            const [rootNamespace, ...otherNamespaces] = idl.getNamespacesPathFor(decl)
            const mangledRoot = idl.getQualifiedName(rootNamespace, "package.namespace.name").replaceAll('.', '_')
            return [mangledRoot, ...otherNamespaces, decl.name].join(".")
        }
        return undefined
    }

    private mapCallback(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it => {
            // HACK: callbacks can have ThrowsWrapper<T> in argument but not in return type. Maybe there is more beautiful solution?
            const paramType = LanguageWriter.managedThrowsTypeUnwrapped(false, () => this.convert(it.type!))
            return `${it.name}: ${paramType}${it.isOptional ? "?" : ""}`
        })
        return `((${params.join(", ")}) -> ${this.convert(decl.returnType)})`
    }
}

// used for Kotlin code
export class KotlinInteropArgConvertor extends InteropArgConvertor {
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.isPrimitiveType(type.elementType[0])) {
            switch (type.elementType[0].name) {
                case 'u8': return KUint8ArrayPtr
                case 'i32': return KInt32ArrayPtr
                case 'f32': return KFloat32ArrayPtr
            }
        }
        throw new Error(`Cannot pass container types through interop`)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'i8': return KByte
            case 'u8': return KUByte
            case 'i16': return KShort
            case 'u16': return KUShort
            case 'i32': return KInt
            case 'u32': return KUInt
            case 'i64': return KLong
            case 'u64': return KULong
            case 'f32': return KFloat
            case 'f64': return KDouble
            case 'number': return KDouble
            case 'boolean': {
                // small trick to hide all casts Boolean <=> KBoolean in a NativeModule
                return "Boolean"
            }
            case 'Object': {
                // unsupported case for now, implementation returns Unit (analogue of void) instead of a real object
                return "Any"
            }
            case 'bigint': return KLong
            case 'SerializerBuffer': return KSerializerBuffer
            case 'Function': return KInt
            case 'String': return KStringPtr
            case 'buffer': return KInteropBuffer
            case 'InteropReturnBuffer': return KInteropReturnBuffer
            case 'date': return KLong
            case 'void': return Unit
            case 'pointer': return KNativePointer
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
}

// used for C code
export class KotlinCInteropReturnTypeConvertor extends InteropReturnTypeConvertor {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'i8': return KByte
            case 'u8': return KUByte
            case 'i16': return KShort
            case 'u16': return KShort
            case 'i32': return KInt
            case 'u32': return KInt
            case 'i64': return KLong
            case 'u64': return KLong
            case 'f32': return KFloat
            case 'f64': return KDouble
            case 'number': return KDouble
            case 'boolean': return KBoolean
            case 'bigint': return KLong
            case 'any':
            case 'this':
            case 'undefined':
            case 'unknown':
            case 'Object':
            case 'void': return 'void'
            case 'buffer': return KInteropReturnBuffer
            case 'InteropReturnBuffer': return KInteropReturnBuffer
            case 'String': return KStringPtr
            case 'pointer': return KNativePointer
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (type.name.endsWith("Attribute"))
            return 'void'
        const decl = this.resolver.resolveTypeReference(type)
        if (decl) {
            // Callbacks and array types return by value
            if (idl.isCallback(this.resolver.toDeclaration(type))) {
                return KInteropReturnBuffer
            }
            if (idl.isInterface(decl)) {
                if (isMaterialized(decl, this.resolver)) {
                    return KNativePointer
                }
                return KInteropReturnBuffer
            }
            if (idl.isEnum(decl)) {
                return this.convertPrimitiveType(idl.enumBinaryRepresentation(decl))
            }
        }
        return 'void'
    }
}

// used for C code
export class KotlinCInteropArgConvertor implements TypeConvertor<string> {
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        throw new Error(`Cannot pass container types through interop`)
    }
    convertImport(type: idl.IDLImport): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return KNativePointer
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'i8': return KByte
            case 'u8': return KUByte
            case 'i16': return KShort
            case 'u16': return KShort
            case 'i32': return KInt
            case 'u32': return KInt
            case 'i64': return KLong
            case 'u64': return KLong
            case 'f32': return KFloat
            case 'f64': return KDouble
            case 'number': return KDouble
            case 'boolean': return KBoolean
            case 'bigint': return KLong
            case 'SerializerBuffer': return KSerializerBuffer
            case 'Function': return KInt
            case 'String': return KStringPtr
            case 'buffer': return KInteropBuffer
            case 'date': return KLong
            case 'pointer': return KNativePointer
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        throw new Error("Cannot pass type parameters through interop")
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        throw new Error(`Cannot pass type references through interop`)
    }
    convertUnion(type: idl.IDLUnionType): string {
        throw new Error("Cannot pass union types through interop")
    }
}
