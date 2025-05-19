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

import * as idl from '../../idl'
import { generatorConfiguration, generatorTypePrefix } from "../../config"
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from "../nameConvertor"
import { PrimitiveTypesInstance } from '../../peer-generation/PrimitiveType'
import { InteropArgConvertor } from './InteropConvertors'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver'
import { maybeTransformManagedCallback } from '../ArgConvertors'
import { qualifiedName } from '../../peer-generation/idl/common'
import { capitalize } from '../../util'
import { isMaterialized } from '../../peer-generation/isMaterialized'
import { isInIdlizeInternal } from '../../idlize'

export interface ConvertResult {
    text: string,
    noPrefix: boolean,
    resolvedType: idl.IDLType
}

export class GenericCppConvertor implements NodeConvertor<ConvertResult> {

    constructor(protected resolver: ReferenceResolver) {}

    private make(text: string, resolvedType: idl.IDLType, noPrefix = false): ConvertResult {
        return { text, noPrefix, resolvedType }
    }

    convertNode(node: idl.IDLNode): ConvertResult {
        return convertNode<ConvertResult>(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): ConvertResult {
        throw new Error("Internal error: namespaces are not allowed on the interop layer")
    }

    convertInterface(node: idl.IDLInterface): ConvertResult {
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
        if (idl.isOptionalType(converted.resolvedType)) {
            return converted
        }
        return this.make(prefix + converted.text, type, true)
    }
    convertUnion(type: idl.IDLUnionType): ConvertResult {
        return this.make(type.name, type, false)
    }
    convertContainer(type: idl.IDLContainerType): ConvertResult {
        if (idl.IDLContainerUtils.isPromise(type)) {
            return this.make(`Promise_${this.convertNode(type.elementType[0]).text}`, type)
        }
        if (idl.IDLContainerUtils.isSequence(type)) {
            if (type.elementType[0] === idl.IDLU8Type) {
                return this.make(`uint8_t*`, type, true)
            }
            return this.make(`Array_${this.convertNode(type.elementType[0]).text}`, type, true)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return this.make(`Map_${this.convertNode(type.elementType[0]).text}_${this.convertNode(type.elementType[1]).text}`, type, true)
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(type: idl.IDLImport): ConvertResult {
        console.warn("Imports are not implemented yet")
        return this.make(idl.IDLCustomObjectType.name, idl.IDLCustomObjectType)
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, _: string): ConvertResult {
        return this.convertTypeReference(type)
    }
    convertTypeReference(type: idl.IDLReferenceType): ConvertResult {
        const refName = type.name
        if (generatorConfiguration().parameterized.includes(refName)) {
            return this.make('CustomObject', idl.IDLCustomObjectType)
        }
        let decl = this.resolver.toDeclaration(type)
        if (idl.isCallback(decl)) {
            decl = maybeTransformManagedCallback(decl, this.resolver) ?? decl
        }
        if (idl.isType(decl)) {
            if (idl.isReferenceType(decl)) {
                return this.make(`${capitalize(decl.name)}`, decl)
            }
            return this.convertNode(decl)
        }
        let res = this.convertNode(decl as idl.IDLEntry)
        if (type.name === "Optional")
            res = this.make("Opt_" + res.text, idl.createOptionalType(type.typeArguments![0]), true)
        return res
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ConvertResult {
        return this.make('CustomObject', idl.IDLCustomObjectType)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ConvertResult {
        switch (type) {
            case idl.IDLThisType: // maybe fix it in another level?
            case idl.IDLVoidType: return this.make('void', type, true)
            case idl.IDLI8Type: return this.make(`Int8`, type)
            case idl.IDLU8Type: return this.make(`UInt8`, type)
            case idl.IDLI16Type: return this.make(`Int16`, type)
            case idl.IDLU16Type: return this.make(`UInt16`, type)
            case idl.IDLI32Type: return this.make(`Int32`, type)
            case idl.IDLU32Type: return this.make(`UInt32`, type)
            case idl.IDLI64Type: return this.make(`Int64`, type)
            case idl.IDLU64Type: return this.make(`UInt64`, type)
            case idl.IDLF32Type: return this.make(`Float32`, type)
            case idl.IDLF64Type: return this.make(`Float64`, type)
            case idl.IDLNumberType: return this.make(`Number`, type)
            case idl.IDLStringType: return this.make(`String`, type)
            case idl.IDLBooleanType: return this.make(`Boolean`, type)
            case idl.IDLBigintType: return this.make(`Int64`, type) // TODO add arbitrary precision numeric type
            case idl.IDLPointerType: return this.make('NativePointer', type)
            case idl.IDLCustomObjectType: return this.make('CustomObject', type)
            case idl.IDLUnknownType:
            case idl.IDLObjectType:
            case idl.IDLAnyType: return this.make(`Object`, type)
            case idl.IDLUndefinedType: return this.make(`Undefined`, type)
            case idl.IDLFunctionType: return this.make(`Function`, type)
            case idl.IDLDate: return this.make(`Date`, type)
            case idl.IDLBufferType: return this.make('Buffer', type)
            case idl.IDLPointerType: return this.make('Pointer', type)
            case idl.IDLSerializerBuffer: return this.make('KSerializerBuffer', type, true)
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    private qualifiedName(target: idl.IDLNode): string {
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
}

export class CppConvertor extends GenericCppConvertor implements IdlNameConvertor {
    private unwrap(type: idl.IDLNode, result: ConvertResult): string {
        const conf = generatorConfiguration()
        if (result.noPrefix) {
            return result.text
        }
        const typePrefix = conf.TypePrefix
        // TODO remove this ugly hack for CustomObject's
        const convertedToCustomObject = result.text === idl.IDLCustomObjectType.name
        const libPrefix = this.isPrimitiveOrPrimitiveAlias(type) || convertedToCustomObject ? "" : conf.LibraryPrefix
        return `${typePrefix}${libPrefix}${result.text}`
    }

    private isPrimitiveOrPrimitiveAlias(type: idl.IDLNode): boolean {
        if (!idl.isType(type)) return false

        const { resolver } = this
        const seen = new Set<idl.IDLNode>
        while (type && idl.isReferenceType(type)) {
            const resolved = resolver.resolveTypeReference(type)
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
    constructor(protected resolver: ReferenceResolver) {
        this.cppConvertor = new GenericCppConvertor(resolver)
    }
    convert(node: idl.IDLNode): string {
        return this.cppConvertor.convertNode(node).text
    }
}

export class CppInteropArgConvertor extends InteropArgConvertor {
    static INSTANCE = new CppInteropArgConvertor()

    convertOptional(type: idl.IDLOptionalType): string {
        return PrimitiveTypesInstance.NativePointer.getText()
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLBooleanType: return PrimitiveTypesInstance.Boolean.getText()
            case idl.IDLI32Type: return PrimitiveTypesInstance.Int32.getText()
            case idl.IDLNumberType: return "KInteropNumber"
            case idl.IDLSerializerBuffer: return "KSerializerBuffer"
            case idl.IDLBufferType: return "KInteropBuffer"
            case idl.IDLFunctionType: return PrimitiveTypesInstance.Int32.getText()
            case idl.IDLDate: return PrimitiveTypesInstance.Int64.getText()
            case idl.IDLPointerType: return PrimitiveTypesInstance.NativePointer.getText()
        }
        return super.convertPrimitiveType(type)
    }
}

export class CppReturnTypeConvertor implements TypeConvertor<string> {
    private convertor: CppConvertor
    constructor(
        private resolver: ReferenceResolver
    ) {
        this.convertor = new CppConvertor(resolver)
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
        if (type == idl.IDLUndefinedType) return 'void'
        return this.convertor.convert(type)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return this.convertor.convert(type)
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        const decl = this.resolver.resolveTypeReference(type)
        if (decl && idl.isInterface(decl) && isMaterialized(decl, this.resolver)) {
            return generatorTypePrefix() + qualifiedName(decl, "_", "namespace.name")
        }
        return this.convertor.convert(type)
    }
    convertUnion(type: idl.IDLUnionType): string {
        return this.convertor.convert(type)
    }
}
