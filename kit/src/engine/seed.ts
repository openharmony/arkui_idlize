/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

export function showHistory(seed: Seed): string {
    const records: Seed[] = []
    let current: Seed | undefined = seed
    while (current) {
        records.unshift(current)
        current = current.causedBy
    }

    let text: string = '\n'
    records.forEach((record, i) => {
        if (i > 0) {
            text += '=> '
        }
        text += (record.debugMessage ? record.debugMessage() : record.hash()) + '\n'
    })

    return text
}

///

export abstract class Seed {
    public causedBy?: Seed

    abstract hash(): string

    debugMessage(): string {
        return this.hash()
    }

    static isSeed(something:unknown): something is Seed {
        return typeof something === 'object'
            && something !== null
            && something instanceof Seed
    }
}
