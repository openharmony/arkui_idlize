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

import * as idl from "../../idl/index.js"
import { LanguageWriter } from "../LanguageWriter.js"
import { isInsideInstanceof } from "../nameConvertor.js"
import { TSInteropArgConvertor, TSTypeNameConvertor } from "./TSConvertors.js"

export class ETSTypeNameConvertor extends TSTypeNameConvertor {
    convertTypeReference(type: idl.IDLReferenceType): string {
        let typeName = super.convertTypeReference(type)
        if (LanguageWriter.isReferenceRelativeToNamespaces && idl.isReferenceType(type)) {
            const namespacesPath = idl.getNamespacesPathFor(type).map(it => `${it.name}.`).join("")
            if (typeName.startsWith(namespacesPath))
                typeName = typeName.substring(namespacesPath.length)
        }
        // TODO: Fix for 'TypeError: Type 'Function<R>' is generic but type argument were not provided.'
        if (typeName === "Function") {
            return isInsideInstanceof() ? "Function" : "Function<void>"
        }
        return typeName
    }
    override convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            return isInsideInstanceof() ? `Array` : `Array<${this.convert(type.elementType[0])}>`
        }
        if (idl.IDLContainerUtils.isRecord(type) && idl.hasExtAttribute(type, idl.IDLExtendedAttributes.AsRecord)) {
            return isInsideInstanceof() ? 'Record' : `Record<${this.convert(type.elementType[0])}, ${this.convert(type.elementType[1])}>`
        }
        return super.convertContainer(type)
    }
    override convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'any': return "object"
            case 'unknown': return "object"

            case 'pointer': return 'KPointer'
            case 'void': return 'void'
            case 'boolean': return 'boolean'

            case 'u8':
            case 'i8':
            case 'i16':
            case 'u16':
            case 'i32':
            case 'u32':
                return 'int32'

            case 'i64':
            case 'u64':
                return 'int64'

            case 'f32':
                return 'float'

            case 'f64':
                return 'double'
            case 'number':
                return 'number'

            case 'String': return 'string'
            case 'Function': return 'Object'

            case 'bigint': return 'long'
            case 'CustomObject': return 'object'
        }
        return super.convertPrimitiveType(type)
    }
    protected override productType(decl: idl.IDLInterface, args:idl.IDLType[] | undefined, isTuple: boolean, includeFieldNames: boolean): string {
        if (decl.subkind === idl.IDLInterfaceSubkind.AnonymousInterface) {
            return decl.name
        }
        return super.productType(decl, args, isTuple, includeFieldNames)
    }
    protected override processTupleType(idlProperty: idl.IDLProperty): idl.IDLProperty {
        if (idlProperty.isOptional) {
            return {
                ...idlProperty,
                isOptional: false,
                type: idl.createUnionType([idlProperty.type, idl.createPrimitiveType('undefined')])
            }
        }
        return idlProperty
    }

    protected mapCallback(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it => {
            // HACK: callbacks can have ThrowsWrapper<T> in argument but not in return type. Maybe there is more beautiful solution?
            const paramType = LanguageWriter.managedThrowsTypeUnwrapped(false, () => this.convert(it.type!))
            return `${it.name}${it.isOptional ? "?" : ""}: ${paramType}`
        })
        return `((${params.join(",")}) => ${this.convert(decl.returnType)})`
    }

    protected mapFunctionType(typeArgs: string[]): string {
        // Fix for "TypeError: Type 'Function<R>' is generic but type argument were not provided."
        // Replace "Function" to "Function<void>"
        // Use "FunctionN" for ts compatibility
        if (typeArgs.length === 0) {
            typeArgs = [this.convert(idl.createPrimitiveType('void'))]
        }
        return isInsideInstanceof() ? `Function${typeArgs.length - 1}` : `Function${typeArgs.length - 1}<${typeArgs.join(",")}>`
    }
}

export class ETSInteropArgConvertor extends TSInteropArgConvertor {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'bigint': return 'long'
        }
        return super.convertPrimitiveType(type)
    }
}
