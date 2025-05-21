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

import { ConfigTypeInfer, D } from "@idlizer/core"
import { readFileSync } from "fs"

const KnownReferencesSchema = D.object({
    AttributeModifier: D.string(),
    AttributeUpdater: D.string(),
})
export type KnownReferencesType = ConfigTypeInfer<typeof KnownReferencesSchema>
export let referenceNames: KnownReferencesType | undefined = undefined
export function loadKnownReferences(path:string) {
    const content = readFileSync(path, 'utf-8')
    const data = JSON.parse(content)
    referenceNames = KnownReferencesSchema.validate(data).unwrap()
}
export function getReferenceTo(key:keyof KnownReferencesType): string {
    if (referenceNames === undefined) {
        throw new Error("Reference mapping is not loaded!")
    }
    return referenceNames[key]
}
