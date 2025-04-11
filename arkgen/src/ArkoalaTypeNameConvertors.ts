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

import * as idl from '@idlizer/core/idl'
import { TSTypeNameConvertor, ETSTypeNameConvertor, JavaTypeNameConvertor, CJTypeNameConvertor } from '@idlizer/core'
import { ARK_CUSTOM_OBJECT } from '@idlizer/libohos'

export class ArkoalaTSTypeNameConvertor extends TSTypeNameConvertor {
    override convertTypeReference(type: idl.IDLReferenceType): string {
         switch (type.name) {
            case "AttributeModifier": return "AttributeModifier<object>"
            default: return super.convertTypeReference(type)
        }
    }
    override convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        return type === idl.IDLLengthType
            ? "Length"
            : super.convertPrimitiveType(type)
    }
}

export class ArkoalaETSTypeNameConvertor extends ETSTypeNameConvertor {
    override convertTypeReference(type: idl.IDLReferenceType): string {
         switch (type.name) {
            case "AttributeModifier": return type.name + "<object>"
            default: return super.convertTypeReference(type)
        }
    }
    override convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        return type === idl.IDLLengthType
            ? "Length"
            : super.convertPrimitiveType(type)
    }
}

export class ArkoalaJavaTypeNameConvertor extends JavaTypeNameConvertor {
    override convertTypeReference(type: idl.IDLReferenceType): string {
        switch (type.name) {
            case "ContentModifier": return ARK_CUSTOM_OBJECT
            case "Dimension":
            case "Length": return "Ark_Length"
            default: return super.convertTypeReference(type)
        }
    }
    override convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLAnyType: return ARK_CUSTOM_OBJECT
            case idl.IDLLengthType: return "Ark_Length"
            default: return super.convertPrimitiveType(type)
        }
    }
}

export class ArkoalaCJTypeNameConvertor extends CJTypeNameConvertor {
    override convertTypeReference(type: idl.IDLReferenceType): string {
        switch (type.name) {
            case 'Dimension':
            case 'Length': return 'Ark_Length'
            case 'ContentModifier':
            case 'Date': return ARK_CUSTOM_OBJECT
            default: return super.convertTypeReference(type)
        }
    }
    override convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLAnyType: return ARK_CUSTOM_OBJECT
            case idl.IDLLengthType: return 'Ark_Length'
            default: return super.convertPrimitiveType(type)
        }
    }
}
