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
import { PrimitiveType } from '../../ArkPrimitiveType';
import { IdlNameConvertor } from "../nameConvertor";
import { ConvertResult, InteropConverter } from './InteropConvertor';

export class CppIDLNodeToStringConvertor extends InteropConverter implements IdlNameConvertor {
    private unwrap(type: idl.IDLNode, result:ConvertResult): string {
        if (idl.isType(type) && idl.isOptionalType(type)) {
            return `Opt_${result.text}`
        }
        if (result.noPrefix) {
            return result.text
        }
        return `${PrimitiveType.Prefix}${result.text}`
    }

    convert(node: idl.IDLNode): string {
        return this.unwrap(node, this.convertNode(node))
    }

    override convertPrimitiveType(type: idl.IDLPrimitiveType): ConvertResult {
        return type === idl.IDLNullType
            ? { text: "Undefined", noPrefix: false }
            : super.convertPrimitiveType(type)
    }
}
