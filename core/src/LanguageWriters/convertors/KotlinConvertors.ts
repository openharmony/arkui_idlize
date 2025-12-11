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
import { removePoints } from '../../util'
import { InteropArgConvertor, InteropReturnTypeConvertor } from './InteropConvertors'
import { isTopLevelConflicted } from '../../peer-generation/ConflictingDeclarations'
import { isDeclaredInCurrentFile, LayoutNodeRole } from '../../peer-generation/LayoutManager'
import { Language } from '../../Language'
import { LibraryInterface } from '../../LibraryInterface'
import { maybeRestoreThrows } from '../../transformers/transformUtils'
import { LanguageWriter } from '../LanguageWriter'

const KBoolean = "KBoolean"
const KByte = "KByte"
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
        return this.mangleTopLevel(node) ?? removePoints(idl.getQualifiedName(node, 'namespace.name'))
    }
    convertEnum(node: idl.IDLEnum): string {
        return this.mangleTopLevel(node) ?? removePoints(idl.getQualifiedName(node, 'namespace.name'))
    }
    convertTypedef(node: idl.IDLTypedef): string {
        if (idl.isSyntheticEntry(node)) {
            return this.convert(node.type)
        }
        return this.mangleTopLevel(node) ?? removePoints(idl.getQualifiedName(node, 'namespace.name'))
    }
    convertCallback(node: idl.IDLCallback): string {
        if (idl.isSyntheticEntry(node)) {
            return this.mapCallback(node)
        }
        return this.mangleTopLevel(node) ?? removePoints(idl.getQualifiedName(node, 'namespace.name'))
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
            switch (type.elementType[0]) {
                case idl.IDLU8Type: return "UByteArray"
                case idl.IDLI32Type: return "IntArray"
                case idl.IDLF32Type: return "FloatArray"
            }
            return `ArrayList<${convertType(this, type.elementType[0])}>`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const stringes = type.elementType.slice(0, 2).map(it => convertType(this, it))
            return `MutableMap<${stringes[0]}, ${stringes[1]}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Any`
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
        const decl = this.library.resolveTypeReference(type)
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
                if (restoredThrow === idl.IDLThisType)
                    return this.convert(idl.createReferenceType(idl.IDLThrowsTypeName, [idl.IDLVoidType]))
            }
            return this.mangleTopLevel(decl) ?? removePoints(idl.getQualifiedName(decl, 'namespace.name'))
        }
        return this.convert(idl.IDLCustomObjectType)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLFunctionType: return 'Function'

            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType: return 'Any'
            case idl.IDLThisType: return 'this'
            case idl.IDLObjectType: return 'Any'
            case idl.IDLAnyType: return 'Any'
            case idl.IDLUndefinedType: return 'Nothing?'
            case idl.IDLPointerType: return 'KPointer'
            case idl.IDLSerializerBuffer: return 'KSerializerBuffer'
            case idl.IDLVoidType: return Unit
            case idl.IDLBooleanType: return 'Boolean'
            
            case idl.IDLI8Type: return 'Byte'
            case idl.IDLU8Type: return 'UByte'
            case idl.IDLI16Type: return 'Short'
            case idl.IDLU16Type: return 'UShort'
            case idl.IDLI32Type: return 'Int'
            case idl.IDLU32Type: return  'UInt'
            case idl.IDLI64Type: return 'Long'
            case idl.IDLU64Type: return 'ULong'
            case idl.IDLF32Type: return 'Float'
            case idl.IDLF64Type: return 'Double'
            case idl.IDLNumberType: return 'Double'

            case idl.IDLBigintType:
                return 'BigInteger' // relies on import java.math.BigInteger

            case idl.IDLStringType:
                return 'String'

            case idl.IDLDate:
                return 'Date'

            case idl.IDLBufferType:
                return 'NativeBuffer'

            case idl.IDLInteropReturnBufferType:
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
        const params = decl.parameters.map(it =>
            `${it.name}: ${this.convert(it.type!)}${it.isOptional ? "?" : ""}`)
        return `((${params.join(", ")}) -> ${this.convert(decl.returnType)})`
    }
}

// used for Kotlin code
export class KotlinInteropArgConvertor extends InteropArgConvertor {
    convertContainer(type: idl.IDLContainerType): string {
        switch (type.elementType[0]) {
            case idl.IDLU8Type: return KUint8ArrayPtr
            case idl.IDLI32Type: return KInt32ArrayPtr
            case idl.IDLF32Type: return KFloat32ArrayPtr
        }
        throw new Error(`Cannot pass container types through interop`)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI8Type: return KByte
            case idl.IDLU8Type: return KByte
            case idl.IDLI16Type: return KShort
            case idl.IDLU16Type: return KUShort
            case idl.IDLI32Type: return KInt
            case idl.IDLU32Type: return KUInt
            case idl.IDLI64Type: return KLong
            case idl.IDLU64Type: return KULong
            case idl.IDLF32Type: return KFloat
            case idl.IDLF64Type: return KDouble
            case idl.IDLNumberType: return KDouble
            case idl.IDLBooleanType: {
                // small trick to hide all casts Boolean <=> KBoolean in a NativeModule
                return "Boolean"
            }
            case idl.IDLObjectType: {
                // unsupported case for now, implementation returns Unit (analogue of void) instead of a real object
                return "Any"
            }
            case idl.IDLBigintType: return KLong
            case idl.IDLSerializerBuffer: return KSerializerBuffer
            case idl.IDLFunctionType: return KInt
            case idl.IDLStringType: return KStringPtr
            case idl.IDLBufferType: return KInteropBuffer
            case idl.IDLInteropReturnBufferType: return KInteropReturnBuffer
            case idl.IDLDate: return KLong
            case idl.IDLVoidType: return Unit
            case idl.IDLPointerType: return KNativePointer
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
}

// used for C code
export class KotlinCInteropReturnTypeConvertor extends InteropReturnTypeConvertor {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI8Type: return KByte
            case idl.IDLU8Type: return KByte
            case idl.IDLI16Type: return KShort
            case idl.IDLU16Type: return KShort
            case idl.IDLI32Type: return KInt
            case idl.IDLU32Type: return KInt
            case idl.IDLI64Type: return KLong
            case idl.IDLU64Type: return KLong
            case idl.IDLF32Type: return KFloat
            case idl.IDLF64Type: return KDouble
            case idl.IDLNumberType: return KDouble
            case idl.IDLBooleanType: return KBoolean
            case idl.IDLBigintType: return KLong
            case idl.IDLAnyType:
            case idl.IDLThisType:
            case idl.IDLUndefinedType:
            case idl.IDLUnknownType:
            case idl.IDLObjectType:
            case idl.IDLVoidType: return idl.IDLVoidType.name
            case idl.IDLBufferType: return KInteropReturnBuffer
            case idl.IDLInteropReturnBufferType: return KInteropReturnBuffer
            case idl.IDLStringType: return KStringPtr
            case idl.IDLPointerType: return KNativePointer
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (type.name.endsWith("Attribute"))
            return idl.IDLVoidType.name
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
                return KInt
            }
        }
        return idl.IDLVoidType.name
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
        switch (type) {
            case idl.IDLI8Type: return KByte
            case idl.IDLU8Type: return KByte
            case idl.IDLI16Type: return KShort
            case idl.IDLU16Type: return KShort
            case idl.IDLI32Type: return KInt
            case idl.IDLU32Type: return KInt
            case idl.IDLI64Type: return KLong
            case idl.IDLU64Type: return KLong
            case idl.IDLF32Type: return KFloat
            case idl.IDLF64Type: return KDouble
            case idl.IDLNumberType: return KDouble
            case idl.IDLBooleanType: return KBoolean
            case idl.IDLBigintType: return KLong
            case idl.IDLSerializerBuffer: return KSerializerBuffer
            case idl.IDLFunctionType: return KInt
            case idl.IDLStringType: return KStringPtr
            case idl.IDLBufferType: return KInteropBuffer
            case idl.IDLDate: return KLong
            case idl.IDLPointerType: return KNativePointer
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
