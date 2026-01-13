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

import { E, HoleExpression, HoleType, T } from "@idlizer/libohos"

///

let processingSeed: Seed<unknown> | undefined = undefined
export function setProcessingSeed(seed:Seed<unknown>) {
    processingSeed = seed
}
export function deleteProcessingSeed() {
    processingSeed = undefined
}
export function withProcessingSeed<T>(seed:Seed<unknown>, op: () => T): T {
    setProcessingSeed(seed)
    const r = op()
    deleteProcessingSeed()
    return r
}

export function showHistory(seed:Seed<unknown>): string {
    const records: Seed<unknown>[] = []
    let current: Seed<unknown> | undefined = seed
    while (current) {
        records.unshift(current)
        current = current.causedBy
    }

    let text: string = ''
    records.forEach((record, i) => {
        if (i > 0) {
            text += '\n'
        }
        text += '=> ' + (record.debugMessage ? record.debugMessage() : record.hash())
    })

    return text
}

///

const generatorAnchor = Symbol("GENERATED_SEED")

export interface Seed<T> {
    _meta: {
        symbol: Symbol,
        id: string
    },
    hash: () => void,
    debugMessage?: () => string,
    data: T
    typeOf: SeedType<T>
    causedBy: Seed<unknown> | undefined
}

export interface SeedTypeDiscriminator<T> {
    isCurrentSeed: (other: unknown) => other is Seed<T>
    hash: (seed: Seed<T>) => string
    debugMessage?: (data:Seed<T>) => string
}
export interface SeedType<T> extends SeedTypeDiscriminator<T> {
    create: (x: T) => Seed<T>
    createExp: (x: T) => HoleExpression
    createType: (x: T) => HoleType
}

function generatedRandomId(): string {
    return (Math.random() * 1000).toFixed(0) + Date.now() + (Math.random() * 1000).toFixed(0)
}

export function makeSeed<T>(
    hash: (x: T) => string,
    debugMessage?: (x:T) => string,
): SeedType<T> {
    const id = generatedRandomId()
    const make = (data: T, type: SeedType<T>): Seed<T> => {
        const seed: Seed<T> = {
            _meta: {
                id,
                symbol: generatorAnchor
            },
            data,
            debugMessage: debugMessage ? () => debugMessage(data) : undefined,
            hash: () => hash(data),
            typeOf: type,
            causedBy: processingSeed
        }
        return seed
    }
    const seedType: SeedType<T> = {
        create: x => make(x, seedType),
        createExp: x => E.hole(make(x, seedType)),
        createType: x => T.hole(make(x, seedType)),
        hash: (box) => "::SEED:" + box._meta.id + hash(box.data),
        debugMessage: debugMessage ? (box) => debugMessage?.(box.data) : undefined,
        isCurrentSeed: (box): box is Seed<T> => box !== undefined && typeof box === 'object' && box !== null
            && "_meta" in box && typeof box._meta === 'object' && box._meta !== null
            && "symbol" in box._meta && box._meta.symbol === generatorAnchor
            && "id" in box._meta && box._meta.id === id
    }
    return seedType
}