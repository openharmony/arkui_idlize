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
import { ReferenceResolver } from '../../ReferenceResolver';
import { IdlNameConvertor, IdlNameConvertorBase } from "../nameConvertor";
import { ConvertResult, InteropConverter } from './InteropConvertor';

export class CppIDLNodeToStringConvertor extends IdlNameConvertorBase {

    private readonly interopConverter: InteropConverter
    constructor(
        protected resolver: ReferenceResolver
    ) {
        super()
        this.interopConverter = new InteropConverter(resolver)
    }

    private unwrap(type: idl.IDLEntry | idl.IDLType | idl.IDLCallback, result:ConvertResult): string {
        if (idl.isType(type) && idl.isOptionalType(type)) {
            return `Opt_${result.text}`
        }
        if (result.noPrefix) {
            return result.text
        }
        return `${PrimitiveType.Prefix}${result.text}`
    }

    convertType(type: idl.IDLType): string {
        return this.unwrap(type, this.interopConverter.convertType(type))
    }

    convertEntry(entry: idl.IDLEntry): string {
        return this.unwrap(entry, this.interopConverter.convertEntry(entry))
    }
}
