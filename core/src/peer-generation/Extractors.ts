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

import { getQualifiedName, IDLInterface } from "../idl/index.js"
import { Language } from "../Language.js"
import { capitalize } from "../util.js"
import { getInternalClassName, getInternalClassQualifiedName } from "./isMaterialized.js"
import { isInExternalModule } from "./modules.js"

function getExtractorClass(target: IDLInterface, toPtr: boolean = true): string {
    if (isInExternalModule(target)) {
        const qualifiedName = getQualifiedName(target, "namespace.name")
        const name = qualifiedName.split(`.`).map(it => capitalize(it)).join("")
        return name
    }
    return toPtr ? "Peer" : ""
}

export function getExtractor(target: IDLInterface, lang: Language, toPtr: boolean = true): { receiver?: string, method: string } {

    const receiver = isInExternalModule(target)
        ? `extractors`
        : toPtr
            ? undefined // TBD: update to MaterializedBase when import is updated
            : (lang == Language.CJ)
                ? getInternalClassName(target.name)
                : getInternalClassQualifiedName(target, "namespace.name", lang)

    const extractorClass = getExtractorClass(target, toPtr)
    const method = toPtr ? `to${extractorClass}Ptr` : `from${extractorClass}Ptr`
    return { receiver, method }
}
