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

import * as idl from '../../../idl'
import { capitalize } from '../../../util'
import { maybeTransformManagedCallback } from '../../ArgConvertors'
import { PrimitiveType } from '../../ArkPrimitiveType'
import { PeerGeneratorConfig } from '../../PeerGeneratorConfig'
import { PeerMethod } from '../../PeerMethod'
import { ReferenceResolver } from '../../ReferenceResolver'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from '../nameConvertor'

export interface ConvertResult {
    text: string,
    noPrefix: boolean
}

export class InteropConverter implements NodeConvertor<ConvertResult> {

    private make(text: string, noPrefix = false): ConvertResult {
        return { text, noPrefix }
    }

    constructor(
        protected resolver: ReferenceResolver
    ) {}

    convertNode(node: idl.IDLNode): ConvertResult {
        return convertNode<ConvertResult>(this, node)
    }

    convertInterface(node: idl.IDLInterface): ConvertResult {
        switch (node.subkind) {
            case idl.IDLInterfaceSubkind.AnonymousInterface:
                return node.name
                    ? this.make(node.name)
                    : this.make(this.computeTargetTypeLiteralName(node), true)
            case idl.IDLInterfaceSubkind.Interface:
            case idl.IDLInterfaceSubkind.Class:
                if (node.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.Namespace && it.value === 'predefined')) {
                    return this.make(node.name, true)
                }
                return this.make(node.name)
            case idl.IDLInterfaceSubkind.Tuple:
                return node.name
                    ? this.make(node.name)
                    : this.make(`Tuple_${node.properties.map(it => this.convertNode(idl.maybeOptional(it.type, it.isOptional)).text).join("_")}`, true)
        }
        throw new Error("Unknown interface type")
    }
    convertEnum(node: idl.IDLEnum): ConvertResult {
        return this.make(this.enumName(node))
    }
    convertTypedef(node: idl.IDLTypedef): ConvertResult {
        return this.make(node.name)
    }
    convertCallback(node: idl.IDLCallback): ConvertResult {
        return this.make(PrimitiveType.LibraryPrefix + node.name, true)
    }
    // convertImport
    //
    // if (idl.isImport(target))
    //     return this.make(this.mapImportTypeName(target), true)

    /////////////////////////////////////////////////////////////////////////////////////////

    convertOptional(type: idl.IDLOptionalType): ConvertResult {
        return this.convertNode(type.type)
    }
    convertUnion(type: idl.IDLUnionType): ConvertResult {
        return this.make(type.name, false)
    }
    convertContainer(type: idl.IDLContainerType): ConvertResult {
        if (idl.IDLContainerUtils.isPromise(type)) {
            return this.make(`Promise_${this.convertNode(type.elementType[0]).text}`)
        }
        if (idl.IDLContainerUtils.isSequence(type)) {
            if (type.elementType[0] === idl.IDLU8Type) {
                return this.make(`uint8_t*`, true)
            }
            return this.make(`Array_${this.convertNode(type.elementType[0]).text}`, true)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return this.make(`Map_${this.convertNode(type.elementType[0]).text}_${this.convertNode(type.elementType[1]).text}`, true)
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(type: idl.IDLReferenceType, _: string): ConvertResult {
        return this.make(idl.IDLCustomObjectType.name)
    }
    convertTypeReference(type: idl.IDLReferenceType): ConvertResult {
        const refName = type.name
        switch (refName) {
            case "object":
            case "Object":
                return this.make('CustomObject')
        }
        if (PeerGeneratorConfig.isKnownParametrized(refName)) {
            return this.make('CustomObject')
        }
        let decl = this.resolver.toDeclaration(type)
        if (idl.isCallback(decl)) {
            decl = maybeTransformManagedCallback(decl) ?? decl
        }
        if (idl.isType(decl)) {
            if (idl.isReferenceType(decl)) {
                return this.make(`${capitalize(decl.name)}`)
            }
            return this.convertNode(decl)
        }
        let res = this.convertNode(decl as idl.IDLEntry)
        if (type.name === "Optional")
            res = this.make("Opt_" + res.text, true)
        return res
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ConvertResult {
        return this.make('CustomObject')
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ConvertResult {
        switch (type) {
            case idl.IDLVoidType: return this.make('void', true)
            case idl.IDLI8Type: return this.make(`Int8`)
            case idl.IDLU8Type: return this.make(`UInt8`)
            case idl.IDLI16Type: return this.make(`Int16`)
            case idl.IDLU16Type: return this.make(`UInt16`)
            case idl.IDLI32Type: return this.make(`Int32`)
            case idl.IDLU32Type: return this.make(`UInt32`)
            case idl.IDLI64Type: return this.make(`Int64`)
            case idl.IDLU64Type: return this.make(`UInt64`)
            case idl.IDLF32Type: return this.make(`Float32`)
            case idl.IDLF64Type: return this.make(`Float64`)
            case idl.IDLNumberType: return this.make(`Number`)
            case idl.IDLStringType: return this.make(`String`)
            case idl.IDLBooleanType: return this.make(`Boolean`)
            case idl.IDLPointerType: return this.make('NativePointer')
            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType:
            case idl.IDLAnyType: return this.make(`CustomObject`)
            case idl.IDLUndefinedType: return this.make(`Undefined`)
            case idl.IDLLengthType: return this.make(`Length`)
            case idl.IDLFunctionType: return this.make(`Function`)
            case idl.IDLDate: return this.make(`Date`)
            case idl.IDLBufferType: return this.make('Buffer')
            case idl.IDLPointerType: return this.make('Pointer')
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    private mapImportTypeName(type: idl.IDLEntry): string {
        console.log(`Import type: ${type.name}`)
        switch (type.name) {
            // maybe we should remove them
            case "Resource": return "Resource"
            case "Callback": return PrimitiveType.Function.getText()
            default: return PrimitiveType.CustomObject.getText()
        }
    }

    private enumName(target: idl.IDLEnum): string {
        const namespace = idl.getExtAttribute(target, idl.IDLExtendedAttributes.Namespace)
        return `${namespace ? namespace + "_" : ""}${target.name}`
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
}

export class IDLNodeToStringConvertor implements IdlNameConvertor {
    private readonly interopConverter: InteropConverter
    constructor(
        protected resolver: ReferenceResolver
    ) {
        this.interopConverter = new InteropConverter(resolver)
    }
    convert(node: idl.IDLNode): string {
        return this.interopConverter.convertNode(node).text
    }
}

export class InteropReturnTypeConvertor implements TypeConvertor<string> {
    isVoid(method: PeerMethod): boolean {
        return this.convert(method.returnType) === idl.IDLVoidType.name
    }
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type) || idl.IDLContainerUtils.isPromise(type)) {
            // TODO return array by some way
            return "void"
        } else
            return PrimitiveType.NativePointer.getText()
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import type ${type.name} through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return this.convert(type.type)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI8Type:
            case idl.IDLU8Type:
            case idl.IDLI16Type:
            case idl.IDLU16Type:
            case idl.IDLI32Type:
            case idl.IDLU32Type:
            case idl.IDLI64Type:
            case idl.IDLU64Type:
            case idl.IDLF16Type:
            case idl.IDLF32Type:
            case idl.IDLF64Type:
            case idl.IDLNumberType: return PrimitiveType.Int32.getText()
            case idl.IDLBooleanType: return PrimitiveType.Boolean.getText()
            case idl.IDLAnyType:
            case idl.IDLBufferType:
            case idl.IDLStringType:
            case idl.IDLThisType:
            case idl.IDLUndefinedType:
            case idl.IDLUnknownType:
            case idl.IDLVoidType: return idl.IDLVoidType.name
            case idl.IDLPointerType: return PrimitiveType.NativePointer.getText()
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return idl.IDLVoidType.name
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (type.name.endsWith("Attribute"))
            return idl.IDLVoidType.name
        return PrimitiveType.NativePointer.getText()
    }
    convertUnion(type: idl.IDLUnionType): string {
        return PrimitiveType.NativePointer.getText()
    }
}

export class InteropArgConvertor implements TypeConvertor<string> {
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        throw new Error(`Cannot pass container types through interop`)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return "KNativePointer"
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI32Type: return "KInt"
            case idl.IDLNumberType: return 'number'
            case idl.IDLBigintType: return 'bigint'
            case idl.IDLBooleanType:
            case idl.IDLFunctionType: return 'KInt'
            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLBufferType: return `ArrayBuffer`
            case idl.IDLLengthType: return 'Length'
            case idl.IDLDate: return 'KLong'
            case idl.IDLUndefinedType:
            case idl.IDLVoidType: return PrimitiveType.NativePointer.getText()
            case idl.IDLPointerType: return "KPointer"//PrimitiveType.NativePointer.getText()
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
