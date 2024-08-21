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

import { PeerClassBase } from "../PeerClass"
import { IdlPeerFile } from "./IdlPeerFile"
import { IdlPeerMethod } from "./IdlPeerMethod"

export class IdlPeerClass implements PeerClassBase {
    constructor(
        public readonly file: IdlPeerFile,
        public readonly componentName: string,
        public readonly originalFilename: string,
        // public readonly declarationTable: DeclarationTable
    ) { }

    setGenerationContext(context: string| undefined): void {}

    generatedName(isCallSignature: boolean): string{
        return isCallSignature ? this.originalInterfaceName! : this.originalClassName!
    }

    getComponentName(): string {
        return this.componentName
    }

    methods: IdlPeerMethod[] = []

    originalClassName: string | undefined = undefined
    originalInterfaceName: string | undefined = undefined
    originalParentName: string | undefined = undefined
    originalParentFilename: string | undefined = undefined
    parentComponentName: string | undefined = undefined
    attributesFields: string[] = []
    attributesTypes: {typeName: string, content: string}[] = []
    hasGenericType: boolean = false
}