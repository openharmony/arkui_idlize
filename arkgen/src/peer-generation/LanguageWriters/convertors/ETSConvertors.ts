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

import * as idl from "@idlize/core/idl"
import { TsIDLNodeToStringConverter } from "./TSConvertors"
import { createReferenceType, IDLEntry, IDLReferenceType } from "@idlize/core/idl"
import { createDeclarationNameConvertor } from "@idlize/core"
import { convertDeclaration } from "@idlize/core"
import { Language, stringOrNone } from "@idlize/core"

export class EtsIDLNodeToStringConvertor extends TsIDLNodeToStringConverter {
    convertTypeReference(type: IDLReferenceType): string {
        // Only to deal with namespaces. TODO: remove later
        const decl = this.resolver.resolveTypeReference(type)
        if (decl && idl.isEnum(decl)) {
            return convertDeclaration(createDeclarationNameConvertor(Language.ARKTS), decl)
        }

        // TODO: Needs to be implemented properly
        const types = type.name.split(".")
        if (types.length > 1) {
            // Takes only name without the namespace prefix
            const decl = this.resolver.resolveTypeReference(createReferenceType(types.slice(-1).join()))
            if (decl !== undefined) {
                return convertDeclaration(createDeclarationNameConvertor(Language.ARKTS), decl)
            }
        }
        const typeName = super.convertTypeReference(type)
        // TODO: Fix for 'TypeError: Type 'Function<R>' is generic but type argument were not provided.'
        if (typeName === "Function") {
            return "Function<void>"
        }
        return typeName;
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

            case idl.IDLBufferType: return 'NativeBuffer'
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

    protected getNamespacePrefix(decl: IDLEntry): stringOrNone {
        return idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace);
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
