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

import { E, IdentityTransformer, lw, LWDeclaration, LWExpression, LWKind, LWType, T } from "@idlizer/ost"
import { Seed, showHistory } from "./seed.js"

export class ContinueWithGenerationError extends Error {
    constructor(
        public message: string,
        public causedBy: unknown
    ) {
        super(message)
    }
}

function callProduce(currentSeed: Seed, op: () => ProducerResult): ProducerResult {
    try {
        return op()
    } catch (ex) {
        throw new ContinueWithGenerationError(showHistory(currentSeed), ex)
    }
}


///

export interface ProducerContext<T, E> {
    library: T
    expectType<S extends Seed>(seed: S): LWType
    expectExpr<S extends Seed>(seed: S): LWExpression
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
export type Producer<T, E> = (request: Seed, context: ProducerContext<T, E>) => ProducerResult
export type ProducerBox<T, E> = {
    action: Producer<T, E>
}

class HoleScanner extends IdentityTransformer {
    constructor(
        private append: (req: Seed) => void,
    ) {
        super()
    }

    goHoleType(type: lw.HoleType): lw.LWType {
        if (Seed.isSeed(type.data)) {
            this.append(type.data)
        }
        return type
    }
    goHoleExpression(expr: lw.HoleExpression): lw.HoleExpression {
        if (Seed.isSeed(expr.data)) {
            this.append(expr.data)
        }
        return expr
    }
}

class HoleFiller<Q> extends IdentityTransformer {
    constructor(
        private cache: Map<string, LWType | LWExpression>
    ) {
        super()
    }

    goHoleType(type: lw.HoleType): lw.LWType {
        if (!Seed.isSeed(type.data)) {
            return super.goHoleType(type)
        }
        const found = this.cache.get(type.data.hash())
        if (found) {
            if (isLWType(found)) {
                return this.goType(found)
            }
            throw new Error(`CAN NOT USE EXPRESSION FOR TYPE HOLE "..."`)
        }
        return super.goHoleType(type)
    }
    goHoleExpression(expr: lw.HoleExpression): lw.LWExpression {
        if (!Seed.isSeed(expr.data)) {
            return super.goHoleExpression(expr)
        }
        const found = this.cache.get(expr.data.hash())
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

export interface GenerateOptions<T, E> {
    library: T
    createEffect: () => E,
    roots: { declarations: LWDeclaration[] } | { seeds: Seed[] }
    sharedMemory?: GeneratorMemory
}
export interface GenerateResult<E> {
    effect: E
    declarations: LWDeclaration[]
}

/**
 * @deprecated Please use forEachSeed instead
 */
export function continueWith<T, E>({ library, roots, createEffect, sharedMemory }: GenerateOptions<T, E>, produce: Producer<T, E>): GenerateResult<E> {

    /// THE ALGORITHM
    const effect = createEffect?.()
    const producerContext: ProducerContext<T, E> = {
        library,
        expectExpr: (s) => E.hole(s),
        expectType: (s) => T.hole(s),
        updateEffect: (up) => { up(effect) },
        getEffect: () => effect
    }

    const currentGeneratedIndex = sharedMemory ?? new Map<string, LWType | LWExpression>()
    const generatedDeclarations: LWDeclaration[] = []
    const requestQueue: Seed[] = []
    if ('declarations' in roots) {
        roots.declarations.forEach(decl => {
            generatedDeclarations.push(decl)
            const scanner = new HoleScanner(req => requestQueue.push(req))
            scanner.goDeclaration(decl)
        })
    } else {
        roots.seeds.forEach(seed => {
            requestQueue.push(seed)
        })
    }

    while (requestQueue.length) {
        const query = requestQueue.shift()!
        const queryString = query.hash()
        if (currentGeneratedIndex.has(queryString)) {
            continue
        }
        const result = callProduce(query, () => produce(query, producerContext))
        if ("skip" in result) {
            continue
        }
        const scanner = new HoleScanner(req => {
            req.causedBy = query
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
                if (Seed.isSeed(effect)) {
                    requestQueue.push(effect)
                }
            })
        }
    }

    const filler = new HoleFiller(currentGeneratedIndex)
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

export function forEachSeed<T>({
    context,
    begin,
    sharedMemory,
}: {
    context: T
    begin: Seed[]
    sharedMemory?: GeneratorMemory
}, produce: Producer<T, undefined>): LWDeclaration[] {
    return continueWith({
        createEffect: () => undefined,
        library: context,
        roots: { seeds: begin },
        sharedMemory,
    }, produce).declarations
}

///

export type TypedProducer<Q, T, E> = (request: Q, context: ProducerContext<T, E>) => ProducerResult
interface TypedProducerBox<T, E> {
    producer: Producer<T, E>
    seedTypeSpec: new (...args:any[]) => Seed
}

type ClassReturnType<C extends new (...args:any[]) => any> = C extends new (...args:any[]) => infer R ? R : never

class MatchBuilder<T, E> {
    constructor(
        private storage: TypedProducerBox<T, E>[]
    ) {}
    caseOf<Q extends new (...args:any[]) => Seed>(seedTypeSpec:Q, producer:TypedProducer<ClassReturnType<Q>, T, E>): this {
        this.storage.push({
            producer: producer as any,
            seedTypeSpec,
        })
        return this
    }
}

export function match<T, E>(op:(b:MatchBuilder<T, E>) => void): Producer<T, E> {
    const storage: TypedProducerBox<T, E>[] = []
    op(new MatchBuilder(storage))
    return (seed, ctx) => {
        for (const box of storage) {
            if (seed instanceof box.seedTypeSpec) {
                return box.producer(seed, ctx)
            }
        }
        return { skip: true }
    }
}

export function onlyFor<Q extends new (...args:any[]) => Seed, T, E>(seedTypeSpec:Q, producer:TypedProducer<ClassReturnType<Q>, T, E>): Producer<T, E> {
    return match(cases => cases.caseOf(seedTypeSpec, producer))
}
