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

import { IgnoreOptions, IrHackOptions } from "../options/IgnoreOptions"
import { NonNullableOptions } from "../options/NonNullableOptions"
import { CodeFragmentOptions } from "../options/CodeFragmentOptions";

export class Config {
    constructor(
        public ignore: IgnoreOptions,
        public nonNullable: NonNullableOptions,
        public irHack: IrHackOptions,
        public fragments: CodeFragmentOptions,
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

    static get uselessPrefix(): string {
        return `Get`
    }

    static get astNodeCommonAncestor(): string {
        return `AstNode`
    }

    static get context(): string {
        return `Context`
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
}
