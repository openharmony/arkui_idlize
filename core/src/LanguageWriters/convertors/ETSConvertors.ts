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

import * as idl from "../../idl"
import { Language } from "../../Language"
import { createDeclarationNameConvertor } from "../../peer-generation/idl/IdlNameConvertor"
import { LanguageWriter } from "../LanguageWriter"
import { convertDeclaration, convertType, TypeConvertor } from "../nameConvertor"
import { TSInteropArgConvertor, TSTypeNameConvertor } from "./TSConvertors"

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
            return "Function<void>"
        }
        return typeName
    }
    override convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            switch (type.elementType[0]) {
                case idl.IDLU8Type: return 'KUint8ArrayPtr'
                case idl.IDLI32Type: return 'KInt32ArrayPtr'
                case idl.IDLF32Type: return 'KFloat32ArrayPtr'
            }
            return `Array<${this.convert(type.elementType[0])}>`
        }
        return super.convertContainer(type)
    }
    override convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLAnyType: return "object"
            case idl.IDLUnknownType: return "object"

            case idl.IDLPointerType: return 'KPointer'
            case idl.IDLVoidType: return 'void'
            case idl.IDLBooleanType: return 'boolean'

            case idl.IDLU8Type:
            case idl.IDLI8Type:
            case idl.IDLI16Type:
            case idl.IDLU16Type:
            case idl.IDLI32Type:
            case idl.IDLU32Type:
                return 'int32'

            case idl.IDLI64Type:
            case idl.IDLU64Type:
                return 'int64'

            case idl.IDLF32Type:
                return 'float32'

            case idl.IDLF64Type:
                return 'float64'
            case idl.IDLNumberType:
                return 'number'

            case idl.IDLStringType: return 'string'
            case idl.IDLFunctionType: return 'Object'

            case idl.IDLBigintType: return 'long'
            case idl.IDLCustomObjectType: return 'object'
        }
        return super.convertPrimitiveType(type)
    }
    protected override productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        if (decl.subkind === idl.IDLInterfaceSubkind.AnonymousInterface) {
            return decl.name
        }
        return super.productType(decl, isTuple, includeFieldNames)
    }
    protected override processTupleType(idlProperty: idl.IDLProperty): idl.IDLProperty {
        if (idlProperty.isOptional) {
            return {
                ...idlProperty,
                isOptional: false,
                type: idl.createUnionType([idlProperty.type, idl.IDLUndefinedType])
            }
        }
        return idlProperty
    }

    protected mapCallback(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it => {
            return `${it.name}${it.isOptional ? "?" : ""}: ${this.convert(it.type!)}`
        })
        return `((${params.join(",")}) => ${this.convert(decl.returnType)})`
    }

    protected mapFunctionType(typeArgs: string[]): string {
        // Fix for "TypeError: Type 'Function<R>' is generic but type argument were not provided."
        // Replace "Function" to "Function<void>"
        // Use "FunctionN" for ts compatibility
        if (typeArgs.length === 0) {
            typeArgs = [this.convert(idl.IDLVoidType)]
        }
        return `Function${typeArgs.length - 1}<${typeArgs.join(",")}>`
    }
}

export class ETSInteropArgConvertor extends TSInteropArgConvertor {}
