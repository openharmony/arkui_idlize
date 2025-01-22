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

import { IDLPointerType, IDLPrimitiveType, IDLU32Type } from "@idlize/core"

export class Config {
    constructor(
        private interfacesGenerateFor?: string[],
        private methodsGenerateFor?: string[]
    ) {}

    private nativeModulePrefix = `_`

    private handwrittenMethods =new Set([
        `CreateConfig`, // sequence<String>
        `ProgramExternalSources`, // sequence<sequence>
        `ExternalSourcePrograms`, // sequence<sequence>
        `ProtectionFlagConst` // u8
    ])

    private handwrittenInterfaces = new Set<string>([])

    get nativeModuleName() {
        return `Es2pandaNativeModule`
    }

    methodFunction(interfaceName: string, methodName: string): string {
        return `${interfaceName}${methodName}`
    }

    nativeModuleFunction(name: string): string {
        return `${this.nativeModulePrefix}${name}`
    }

    get sequencePointerType(): IDLPrimitiveType {
        return IDLPointerType
    }

    get sequenceLengthType(): IDLPrimitiveType {
        return IDLU32Type
    }

    shouldEmitInterface(name: string): boolean {
        if (this.interfacesGenerateFor !== undefined) {
            return this.interfacesGenerateFor.includes(name)
        }
        return !this.handwrittenInterfaces.has(name)
    }

    shouldEmitMethod(name: string): boolean {
        if (this.methodsGenerateFor !== undefined) {
            return this.methodsGenerateFor.includes(name)
        }
        return !this.handwrittenMethods.has(name)
    }
}
