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

import { Options } from "./Options"
import { splitCreateOrUpdate } from "./utils/common"

export class Config {
    constructor(
        public options: Options,
        private fixInput: boolean,
        private files?: string[]
    ) {}

    static get createPrefix(): string {
        return `Create`
    }

    static get updatePrefix(): string {
        return `Update`
    }

    static get constPostfix(): string {
        return `Const`
    }

    static get nodeTypeAttribute(): string {
        return `Es2pandaAstNodeType`
    }

    static get nodeNamespaceAttribute(): string {
        return `cpp_namespace`
    }

    static get getterAttribute(): string {
        return `get`
    }

    static get astNodeCommonAncestor(): string {
        return `AstNode`
    }

    shouldEmitEnum(name: string): boolean {
        return true
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

    static isCreateOrUpdate(sourceMethodName: string): boolean {
        if (!sourceMethodName.startsWith(Config.createPrefix) && !sourceMethodName.startsWith(Config.updatePrefix)) {
            return false
        }
        const { rest } = splitCreateOrUpdate(sourceMethodName)
        if (rest.length > 1) {
            return false
        }
        return true
    }
}
