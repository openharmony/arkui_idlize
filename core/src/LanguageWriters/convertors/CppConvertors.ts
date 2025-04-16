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
    noPrefix: boolean
}

export class GenericCppConvertor implements NodeConvertor<ConvertResult> {

    constructor(protected resolver: ReferenceResolver) {}

    private make(text: string, noPrefix = false): ConvertResult {
        return { text, noPrefix }
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
                    ? this.make(this.qualifiedName(node))
                    : this.make(this.computeTargetTypeLiteralName(node), true)
            case idl.IDLInterfaceSubkind.Interface:
            case idl.IDLInterfaceSubkind.Class:
                if (isInIdlizeInternal(node)) {
                    return this.make(this.qualifiedName(node), true)
                }
                return this.make(this.qualifiedName(node))
            case idl.IDLInterfaceSubkind.Tuple:
                return node.name
                    ? this.make(this.qualifiedName(node))
                    : this.make(`Tuple_${node.properties.map(it => this.convertNode(idl.maybeOptional(it.type, it.isOptional)).text).join("_")}`, true)
        }
    }
    convertEnum(node: idl.IDLEnum): ConvertResult {
        return this.make(this.qualifiedName(node))
    }
    convertTypedef(node: idl.IDLTypedef): ConvertResult {
        return this.make(this.qualifiedName(node))
    }
    convertCallback(node: idl.IDLCallback): ConvertResult {
        return this.make(generatorConfiguration().LibraryPrefix + this.qualifiedName(node), true)
    }
    convertMethod(node: idl.IDLMethod): ConvertResult {
        return this.make(node.name)
    }
    convertConstant(node: idl.IDLConstant): ConvertResult {
        return this.make(this.qualifiedName(node))
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    convertOptional(type: idl.IDLOptionalType): ConvertResult {
        return { text: generatorConfiguration().OptionalPrefix + this.convertNode(type.type).text, noPrefix: true }
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
    convertImport(type: idl.IDLImport): ConvertResult {
        console.warn("Imports are not implemented yet")
        return this.make(idl.IDLCustomObjectType.name)
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, _: string): ConvertResult {
        return this.convertTypeReference(type)
    }
    convertTypeReference(type: idl.IDLReferenceType): ConvertResult {
        const refName = type.name
        switch (refName) {
            case "object":
            case "Object":
                return this.make('CustomObject')
        }
        if (generatorConfiguration().parameterized.includes(refName)) {
            return this.make('CustomObject')
        }
        let decl = this.resolver.toDeclaration(type)
        if (idl.isCallback(decl)) {
            decl = maybeTransformManagedCallback(decl, this.resolver) ?? decl
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
            case idl.IDLBigintType: return this.make(`UInt64`) // TODO add arbitrary precision numeric type
            case idl.IDLPointerType: return this.make('NativePointer')
            case idl.IDLCustomObjectType: return this.make('CustomObject')
            case idl.IDLUnknownType:
            case idl.IDLAnyType: return this.make(`Object`)
            case idl.IDLUndefinedType: return this.make(`Undefined`)
            case idl.IDLLengthType: return this.make(`Length`)
            case idl.IDLFunctionType: return this.make(`Function`)
            case idl.IDLDate: return this.make(`Date`)
            case idl.IDLBufferType: return this.make('Buffer')
            case idl.IDLPointerType: return this.make('Pointer')
            case idl.IDLSerializerBuffer: return { text: 'KSerializerBuffer', noPrefix: true }
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
            case idl.IDLLengthType: return "KLength"
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
