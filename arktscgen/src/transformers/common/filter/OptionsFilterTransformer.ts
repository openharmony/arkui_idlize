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

import { BaseInterfaceFilterTransformer } from "./BaseInterfaceFilterTransformer"
import { Config } from "../../../general/Config"
import { IDLFile, IDLInterface } from "@idlizer/core"
import { nodeNamespace } from "../../../utils/idl"

export class OptionsFilterTransformer extends BaseInterfaceFilterTransformer {
    constructor(
        private config: Config,
        file: IDLFile
    ) {
        super(file)
    }

    protected shouldFilterOutInterface(entry: IDLInterface): boolean {
        const ns = nodeNamespace(entry) ?? ''
        return this.config.ignore.isIgnoredInterface(entry.name, ns)
    }

    protected shouldFilterOutMethod(node: string, name: string): boolean {
        return this.config.ignore.isIgnoredMethod(node, name)
    }

    protected shouldFilterOutProperty(node: string, name: string): boolean {
        return this.config.ignore.isIgnoredProperty(node, name)
    }
}
