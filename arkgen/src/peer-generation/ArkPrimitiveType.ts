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

import { generatorConfiguration, PrimitiveType, PrimitiveTypeList } from "@idlize/core"

export class ArkPrimitiveTypeList extends PrimitiveTypeList {
    readonly Int32 = new ArkPrimitiveType(`Int32`)
    readonly Int64 = new ArkPrimitiveType(`Int64`)
    readonly Boolean = new ArkPrimitiveType(`Boolean`)
    readonly Function = new ArkPrimitiveType(`Function`, false)
    readonly Undefined = new ArkPrimitiveType(`Undefined`)
    readonly Void = new ArkPrimitiveType(`Void`)
    readonly NativePointer = new ArkPrimitiveType(`NativePointer`)
    readonly Tag = new ArkPrimitiveType(`Tag`)
    readonly Materialized = new ArkPrimitiveType(`Materialized`, true)
    readonly Length = new ArkPrimitiveType(`Length`, true)
    readonly CustomObject = new ArkPrimitiveType(`CustomObject`, true)
}

export class ArkPrimitiveType extends PrimitiveType {
    getText(): string {
        return generatorConfiguration().param("TypePrefix") + this.name
    }
}

export const ArkPrimitiveTypesInstance = new ArkPrimitiveTypeList()