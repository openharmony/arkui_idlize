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

export interface GeneratorConfiguration {
    param<T>(name: string): T
    readonly params: Record<string, any>

    TypePrefix: string,
    LibraryPrefix: string,
    OptionalPrefix: string,
}

export class BaseGeneratorConfiguration implements GeneratorConfiguration {
    readonly params: Record<string, any> = {}
    constructor(params: Record<string, any> = {}) {
        Object.assign(this.params, {
            TypePrefix: "",
            LibraryPrefix: "",
            OptionalPrefix: "",
            ...params
        });
    }
    param<T>(name: string): T {
        if (name in this.params) {
            return this.params[name] as T;
        }
        throw new Error(`${name} is unknown`)
    }

    get TypePrefix(): string { return this.param<string>("TypePrefix") }
    get LibraryPrefix(): string { return this.param<string>("LibraryPrefix") }
    get OptionalPrefix(): string { return this.param<string>("OptionalPrefix") }
}

let currentConfig: GeneratorConfiguration = new BaseGeneratorConfiguration()

export function setDefaultConfiguration(config: GeneratorConfiguration): void {
    currentConfig = config
}

export function generatorConfiguration(): GeneratorConfiguration {
    return currentConfig
}

export function generatorTypePrefix() {
    const conf = generatorConfiguration()
    return `${conf.param("TypePrefix")}${conf.param("LibraryPrefix")}`
}


