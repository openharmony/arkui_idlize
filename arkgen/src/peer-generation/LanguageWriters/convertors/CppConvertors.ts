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
import { ArkPrimitiveTypesInstance } from '../../ArkPrimitiveType'
import { InteropArgConvertor } from './InteropConvertor'

export class CppInteropArgConvertor extends InteropArgConvertor {
    static INSTANCE = new CppInteropArgConvertor()

    convertOptional(type: idl.IDLOptionalType): string {
        return ArkPrimitiveTypesInstance.NativePointer.getText()
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLBooleanType: return ArkPrimitiveTypesInstance.Boolean.getText()
            case idl.IDLI32Type: return ArkPrimitiveTypesInstance.Int32.getText()
            case idl.IDLNumberType: return "KInteropNumber"
            case idl.IDLBufferType: return "Ark_Buffer"
            case idl.IDLLengthType: return "KLength"
            case idl.IDLFunctionType: return ArkPrimitiveTypesInstance.Int32.getText()
            case idl.IDLDate: return ArkPrimitiveTypesInstance.Int64.getText()
            case idl.IDLPointerType: return ArkPrimitiveTypesInstance.NativePointer.getText()
        }
        return super.convertPrimitiveType(type)
    }
}
