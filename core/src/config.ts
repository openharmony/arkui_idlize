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

export interface CoreConfiguration {
    readonly TypePrefix: string
    readonly LibraryPrefix: string
    readonly OptionalPrefix: string

    readonly rootComponents: string[]
    readonly standaloneComponents: string[]
    readonly parameterized: string[]
    readonly ignoreMaterialized: string[]
    readonly builderClasses: string[]
    readonly forceMaterialized: string[]
    readonly forceCallback: string[]
}

export const defaultCoreConfuguration: CoreConfiguration = {
    TypePrefix: "",
    LibraryPrefix: "",
    OptionalPrefix: "",

    rootComponents: [],
    standaloneComponents: [],
    parameterized: [],
    ignoreMaterialized: [],
    builderClasses: [],
    forceMaterialized: [],
    forceCallback: [],
}

let currentConfig: CoreConfiguration = defaultCoreConfuguration

export function setDefaultConfiguration<T extends CoreConfiguration>(config: T): void {
    currentConfig = config
}

export function generatorConfiguration<T extends CoreConfiguration>(): T {
    return currentConfig as T
}

export function generatorTypePrefix() {
    const conf = generatorConfiguration()
    return `${conf.TypePrefix}${conf.LibraryPrefix}`
}


