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
import { generatorConfiguration } from "../../config"
import { IdlNameConvertor } from "../nameConvertor"
import { ConvertResult, InteropConvertor } from './InteropConvertors'
import { PrimitiveTypesInstance } from '../../peer-generation/PrimitiveType'
import { InteropArgConvertor } from './InteropConvertors'

export class CppInteropConvertor extends InteropConvertor implements IdlNameConvertor {
    private unwrap(type: idl.IDLNode, result: ConvertResult): string {
        const conf = generatorConfiguration()
        if (idl.isType(type) && idl.isOptionalType(type)) {
            return `${conf.OptionalPrefix}${result.text}`
        }
        if (result.noPrefix) {
            return result.text
        }
        const typePrefix = conf.TypePrefix
        // TODO remove this ugly hack for CustomObject's
        const convertedToCustomObject = result.text === idl.IDLCustomObjectType.name
        const libPrefix = idl.isPrimitiveType(type) || convertedToCustomObject ? "" : conf.LibraryPrefix
        return `${typePrefix}${libPrefix}${result.text}`
    }

    convert(node: idl.IDLNode): string {
        return this.unwrap(node, this.convertNode(node))
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
            case idl.IDLBufferType: return "Ark_Buffer"
            case idl.IDLLengthType: return "KLength"
            case idl.IDLFunctionType: return PrimitiveTypesInstance.Int32.getText()
            case idl.IDLDate: return PrimitiveTypesInstance.Int64.getText()
            case idl.IDLPointerType: return PrimitiveTypesInstance.NativePointer.getText()
        }
        return super.convertPrimitiveType(type)
    }
}
