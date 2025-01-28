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

import { LanguageWriter } from "@idlizer/core"

interface IdlSyntheticType {
    getName(): string
    setName(name: string): void
    isMadeFrom(source: Object): boolean
    print(writer: LanguageWriter): void
}

export abstract class IdlSyntheticTypeBase implements IdlSyntheticType {
    public name: string = ''
    constructor(public readonly source: Object | undefined) {}
    getName(): string {
        return this.name
    }
    setName(name: string): void {
        this.name = name
    }
    isMadeFrom(object: Object): boolean {
        return object === this.source
    }
    abstract print(writer: LanguageWriter): void
}

export function createInterfaceDeclName(name: string): string {
    return `INTERFACE_${name}`
}
