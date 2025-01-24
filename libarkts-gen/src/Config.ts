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
        private fixInput: boolean,
        private enumsGenerateFor?: string[],
        private interfaces?: string[],
        private methods?: string[],
        private files?: string[]
    ) {}

    private handwrittenEnums = new Set<string>([])

    private handwrittenMethods = new Set([
        `CreateConfig`, // sequence<String>
        `ProgramExternalSources`, // sequence<sequence>
        `ExternalSourcePrograms`, // sequence<sequence>
        `ProtectionFlagConst`, // u8
        `TypeIdConst`, // u64
    ])

    private handwrittenInterfaces = new Set<string>([])

    get sequencePointerType(): IDLPrimitiveType {
        return IDLPointerType
    }

    get sequenceLengthType(): IDLPrimitiveType {
        return IDLU32Type
    }

    shouldEmitEnum(name: string): boolean {
        if (this.enumsGenerateFor !== undefined) {
            return this.enumsGenerateFor.includes(name)
        }
        return !this.handwrittenEnums.has(name)
    }

    shouldEmitInterface(name: string): boolean {
        if (this.interfaces !== undefined) {
            return this.interfaces.includes(name)
        }
        return !this.handwrittenInterfaces.has(name)
    }

    shouldEmitMethod(name: string): boolean {
        if (this.methods !== undefined) {
            return this.methods.includes(name)
        }
        return !this.handwrittenMethods.has(name)
    }

    shouldEmitFile(name: string): boolean {
        if (this.files !== undefined) {
            return this.files.includes(name)
        }
        return true
    }

    shouldFixInput(): boolean {
        return this.fixInput
    }
}
