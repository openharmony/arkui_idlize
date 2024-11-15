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

import * as idl from "../../../idl";
import { TsIDLNodeToStringConverter } from "./TSConvertors";
import {createReferenceType, IDLReferenceType, IDLType} from "../../../idl";
import { createDeclarationNameConvertor, DeclarationNameConvertor } from "../../idl/IdlNameConvertor";
import { convertDeclaration } from "../nameConvertor";
import { Language } from "../../../Language";

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
        return super.convertTypeReference(type);
    }

    override convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            switch (type.elementType[0]) {
                case idl.IDLU8Type: return 'KUint8ArrayPtr'
                case idl.IDLI32Type: return 'KInt32ArrayPtr'
                case idl.IDLF32Type: return 'KFloat32ArrayPtr'
            }
            return `Array<${this.convertType(type.elementType[0])}>`
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
                return 'KInt'

            case idl.IDLI64Type:
            case idl.IDLU64Type:
                return 'KLong'

            case idl.IDLF32Type:
                return 'KFloat'

            case idl.IDLF64Type:
            case idl.IDLNumberType:
                return 'number'

            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLFunctionType: return 'Object'
        }
        return super.convertPrimitiveType(type)
    }
    protected override productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        if (idl.isAnonymousInterface(decl)) {
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
        const types = decl.parameters.map(it => {
            return `${this.convertType(it.isOptional ? idl.createUnionType([it.type!, idl.IDLUndefinedType]) : it.type!)}`
        })
        return `Function${types.length}<${types.join(",")}${types.length > 0 ? "," : ""}${this.convertType(decl.returnType)}>`
    }
}
