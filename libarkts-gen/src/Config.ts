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

import { IDLPointerType, IDLPrimitiveType, IDLU32Type } from "@idlizer/core"
import { Options } from "./Options"

export class Config {
    constructor(
        private options: Options,
        private fixInput: boolean,
        private files?: string[]
    ) {}

    static get sequencePointerType(): IDLPrimitiveType {
        return IDLPointerType
    }

    static get sequenceLengthType(): IDLPrimitiveType {
        return IDLU32Type
    }

    static get createMethod(): string {
        return `Create`
    }

    static get updateMethod(): string {
        return `Update`
    }

    static get astNodeCommonAncestor(): string {
        return `AstNode`
    }

    shouldEmitEnum(name: string): boolean {
        return true
    }

    shouldEmitInterface(name: string): boolean {
        return this.options.shouldEmitInterface(name)
    }

    shouldEmitMethod(iface: string, method: string): boolean {
        return this.options.shouldEmitMethod(iface, method)
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
