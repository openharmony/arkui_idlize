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

import { generatorConfiguration } from "../config"

export class PrimitiveType {
    constructor(protected name: string,
                protected isPointer: boolean = false) {
    }

    getText(): string {
        return generatorConfiguration().param("TypePrefix") + this.name
    }

    toString(): string {
        return this.getText()
    }
}

export class PrimitiveTypeList {
    public static get UndefinedTag() {
        return "INTEROP_TAG_UNDEFINED"
    }

    public static get UndefinedRuntime() {
        return "INTEROP_RUNTIME_UNDEFINED"
    }

    public static get ObjectTag() {
        return "INTEROP_TAG_OBJECT"
    }

    readonly Int32 = new PrimitiveType(`Int32`)
    readonly Int64 = new PrimitiveType(`Int64`)
    readonly Boolean = new PrimitiveType(`Boolean`)
    readonly Function = new PrimitiveType(`Function`)
    readonly Undefined = new PrimitiveType(`Undefined`)
    readonly Void = new PrimitiveType(`Void`)
    readonly NativePointer = new PrimitiveType(`NativePointer`)
    readonly Tag = new PrimitiveType(`Tag`)
    readonly Materialized = new PrimitiveType(`Materialized`, true)
    readonly CustomObject = new PrimitiveType(`CustomObject`, true)
}

export const PrimitiveTypesInstance = new PrimitiveTypeList()
