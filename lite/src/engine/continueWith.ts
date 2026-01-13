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

import { IdentityTransformer, lw, LWDeclaration, LWExpression, LWKind, LWType } from "@idlizer/libohos"
import { Seed, SeedTypeDiscriminator, showHistory, withProcessingSeed } from "./seed"

export class ContinueWithGenerationError extends Error {
    constructor(
        public message:string,
        public causedBy: unknown
    ) {
        super(message)
    }
}

function callProduce(currentSeed: Seed<any>,op: () => ProducerResult): ProducerResult {
    try {
        return withProcessingSeed(currentSeed, op)
    } catch (ex) {
        throw new ContinueWithGenerationError(showHistory(currentSeed), ex)
    }
}


///

export interface ProducerContext<T, E> {
    library: T
    updateEffect: (updater: (x: E) => void) => void
    getEffect: () => E
}

export type ProducerContinuationResult = LWType | LWExpression
export type ProducerContinuation = ProducerContinuationResult
export interface ProducerResultData {
    continuation: ProducerContinuation
    declarations: LWDeclaration[]
    trigger?: unknown[]
}
export interface ProducerResultSkip {
    skip: true
}
export type ProducerResult = ProducerResultData | ProducerResultSkip
export type Producer<Q, T, E> = (request: Q, context: ProducerContext<T, E>) => ProducerResult
export type ProducerBox<Q, T, E> = {
    action: Producer<Q, T, E>
}

class HoleScanner extends IdentityTransformer {
    constructor(
        private seedType: GenerateOptions<any, any, any>['seedType'],
        private append: (req: Seed<any>) => void,
    ) {
        super()
    }

    goHoleType(type: lw.HoleType): lw.LWType {
        if (this.seedType.isCurrentSeed(type.data)) {
            this.append(type.data)
        }
        return type
    }
    goHoleExpression(expr: lw.HoleExpression): lw.HoleExpression {
        if (this.seedType.isCurrentSeed(expr.data)) {
            this.append(expr.data)
        }
        return expr
    }
}

class HoleFiller<Q> extends IdentityTransformer {
    constructor(
        private cache: Map<string, LWType | LWExpression>,
        private seeds: GenerateOptions<Q, any, any>['seedType']
    ) {
        super()
    }

    goHoleType(type: lw.HoleType): lw.LWType {
        if (!this.seeds.isCurrentSeed(type.data)) {
            return super.goHoleType(type)
        }
        const found = this.cache.get(this.seeds.hash(type.data))
        if (found) {
            if (isLWType(found)) {
                return this.goType(found)
            }
            throw new Error(`CAN NOT USE EXPRESSION FOR TYPE HOLE "..."`)
        }
        return super.goHoleType(type)
    }
    goHoleExpression(expr: lw.HoleExpression): lw.LWExpression {
        if (!this.seeds.isCurrentSeed(expr.data)) {
            return super.goHoleExpression(expr)
        }
        const found = this.cache.get(this.seeds.hash(expr.data))
        if (found) {
            if (!isLWType(found)) {
                return this.goExpression(found)
            }
            throw new Error(`CAN NOT USE TYPE FOR EXPRESSION HOLE "..."`)
        }
        return super.goHoleExpression(expr)
    }
}

export type GeneratorMemory = Map<string, LWType | LWExpression>
export function makeGeneratorMemory(): GeneratorMemory {
    return new Map()
}

export interface GenerateOptions<Q, T, E> {
    library: T
    createEffect: () => E
    seedType: SeedTypeDiscriminator<Q>
    roots: { declarations: LWDeclaration[] } | { seeds: Seed<any>[] }
    sharedMemory?: GeneratorMemory
}
export interface GenerateResult<E> {
    effect: E
    declarations: LWDeclaration[]
}

export function continueWith<Q, T, E>({ library, roots, seedType, createEffect, sharedMemory }: GenerateOptions<Q, T, E>, produce: Producer<Q, T, E>): GenerateResult<E> {

    /// THE ALGORITHM
    const effect = createEffect?.()
    const producerContext: ProducerContext<T, E> = {
        library,
        updateEffect: (up) => { up(effect) },
        getEffect: () => effect
    }

    const currentGeneratedIndex = sharedMemory ?? new Map<string, LWType | LWExpression>()
    const generatedDeclarations: LWDeclaration[] = []
    const requestQueue: Seed<any>[] = []
    if ('declarations' in roots) {
        roots.declarations.forEach(decl => {
            generatedDeclarations.push(decl)
            const scanner = new HoleScanner(seedType, req => {
                requestQueue.push(req)
            })
            scanner.goDeclaration(decl)
        })
    } else {
        roots.seeds.forEach(seed => {
            requestQueue.push(seed)
        })
    }

    while (requestQueue.length) {
        const query = requestQueue.shift()!
        if (!seedType.isCurrentSeed(query)) {
            continue
        }
        const queryString = seedType.hash(query)
        if (currentGeneratedIndex.has(queryString)) {
            continue
        }
        const result = callProduce(query, () => produce(query.data, producerContext))
        if ("skip" in result) {
            continue
        }
        const scanner = new HoleScanner(seedType, req => {
            requestQueue.push(req)
        })
        if (isLWType(result.continuation)) {
            scanner.goType(result.continuation)
        } else {
            scanner.goExpression(result.continuation)
        }
        currentGeneratedIndex.set(queryString, result.continuation)
        result.declarations.forEach(declaration => {
            generatedDeclarations.push(declaration)
            scanner.goDeclaration(declaration)
        })
        if (result.trigger) {
            result.trigger.forEach(effect => {
                if (seedType.isCurrentSeed(effect)) {
                    requestQueue.push(effect)
                }
            })
        }
    }

    const filler = new HoleFiller(currentGeneratedIndex, seedType)
    const declarations = generatedDeclarations.map(decl => {
        return filler.goDeclaration(decl)
    })

    return {
        effect,
        declarations,
    }
}

export function isLWType(node: LWType | LWExpression): node is LWType {
    return [LWKind.ValueType, LWKind.FunctionalType, LWKind.HoleType].includes(node.kind)
}
