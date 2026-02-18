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

import { getFQName, IDLEntry, isProperty } from "../idl/index.js"
import { Language } from "../Language.js"

export function getInitializerFeature(lang: Language): string {
    // TBD: update code for CJ
    return "initializers"
}

export function getInitializerDefaultValue(decl: IDLEntry, lang: Language): string {
    const parent = decl.parent
    const fqn = parent && isProperty(decl)
        ? `${getFQName(parent)}NS.${decl.name}`
        : getFQName(decl)
    // TBD: update code for CJ
    return `${getInitializerFeature(lang)}.${fqn}`
}

