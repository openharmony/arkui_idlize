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

import { GeneratorConfiguration, throwException } from "@idlize/core"

export class Config implements GeneratorConfiguration {
    constructor(
        private interfacesGenerateFor?: string[],
        private methodsGenerateFor?: string[]
    ) {}

    private implPrefix = `impl_`
    private nativeModulePrefix = `_`

    param<T>(name: string): T {
        throw new Error("Method not implemented.")
    }
    paramArray<T>(name: string): T[] {
        if (name === `handwrittenMethods`) return [
            `CreateConfig`, // sequence<String>
            `ProgramExternalSources`, // sequence<sequence>
            `ExternalSourcePrograms`, // sequence<sequence>
            `ProtectionFlagConst` // u8
        ] as T[]
        throwException(`Unexpected name: ${name}`)
    }

    get typePrefix() {
        return `es2panda_`
    }

    get nativeModuleName() {
        return `Es2pandaNativeModule`
    }

    interopMacroPrefix(isVoid: boolean): string {
        return `KOALA_INTEROP_${isVoid ? `V` : ``}`
    }

    methodFunction(interfaceName: string, methodName: string): string {
        return `${interfaceName}${methodName}`
    }

    implFunction(name: string): string {
        return `${this.implPrefix}${name}`
    }

    nativeModuleFunction(name: string): string {
        return `${this.nativeModulePrefix}${name}`
    }

    shouldEmitInterface(name: string): boolean {
        return this.interfacesGenerateFor?.includes(name) ?? true
    }

    shouldEmitMethod(name: string): boolean {
        return this.methodsGenerateFor?.includes(name) ?? true
    }
}
