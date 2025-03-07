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

    static get contextType(): string {
        return `Context`
    }

    static isCreate(name: string): boolean {
        return Config.isCreateOrUpdate(name) && name.startsWith(Config.createPrefix)
    }

    static isCreateOrUpdate(sourceMethodName: string): boolean {
        if (!sourceMethodName.startsWith(Config.createPrefix) && !sourceMethodName.startsWith(Config.updatePrefix)) {
            return false
        }
        const { rest } = splitCreateOrUpdate(sourceMethodName)
        return rest.length <= 1;
    }

    static get dataClassPrefix(): string {
        return `es2panda_`
    }

    static get defaultAncestor(): string {
        return `ArktsObject`
    }

    static get irNamespace(): string {
        return `ir`
    }

    static isAllowedPeerRegularMethod(name: string): boolean {
        return [
            `annotation`,
            `optional`
        ].some(it => name.toLowerCase().includes(it))
    }
}
