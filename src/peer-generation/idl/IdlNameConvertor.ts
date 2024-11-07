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

import * as idl from '../../idl'
import { DeclarationConvertor } from '../LanguageWriters/nameConvertor'

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    convertEnum(decl: idl.IDLEnum): string {
        return `${idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace) ?? ""}${decl.name}`
    }
    convertTypedef(decl: idl.IDLTypedef): string {
        return decl.name
    }
    convertCallback(decl: idl.IDLCallback): string {
        return decl.name ?? "MISSING CALLBACK NAME"
    }

    static readonly I = new DeclarationNameConvertor()
}
