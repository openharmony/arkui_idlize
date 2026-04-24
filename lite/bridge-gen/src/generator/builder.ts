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

import * as idl from "@idlizer/core/idl"
import { LWType, LWExpression, E, T, FunctionDeclaration, LWDeclaration } from "@idlizer/ost"
import { ProducerContext, ProducerResult, Seed, Producer, TypedProducer, terminate } from "@idlizer/kit"
import { EssentialsGenerators, ProduceOptions, InteropGenerator, MakeApiOptions, PeerFunctionPlacementResult } from "./generator"
import { GenerationLibrary, Convertor } from "./common"
import { GeneratorSeed } from "./seed"

export class SelectResult<T> {
    private constructor(
        private hasValue: boolean,
        private value?: T
    ) { }

    static reject<U>(): SelectResult<U> {
        return new SelectResult(false)
    }
    static take<U>(val: U): SelectResult<U> {
        return new SelectResult(true, val)
    }

    selected(): boolean {
        return this.hasValue
    }
    get(): T {
        return this.value ?? terminate("NO VALUE!")
    }
}

export interface InteropProducerTypeDescription<T> {
    select: (ref: idl.IDLType) => SelectResult<T>
    onManagedDeclaration: (val: T, seed: GeneratorSeed, ctx: ProducerContext<GenerationLibrary, undefined>) => ProducerResult
    onNativeDeclaration: (val: T, seed: GeneratorSeed, ctx: ProducerContext<GenerationLibrary, undefined>) => ProducerResult
    fromInteropTransferable?: (val: T) => Convertor['fromInteropTransferable'],
    toInteropTransferable?: (val: T) => Convertor['toInteropTransferable'],
    interopBufferTransferable?: (val: T) => Convertor['toBufferTransferable'] & { symmetric?: true }
    returnBufferTransferable?: (val: T) => Convertor['fromBufferTransferrable']
    afterAll?: (val:[T, LWDeclaration[]][]) => LWDeclaration[]
    otherProducers?: CustomDeclarationProducer<Seed>[]
}

export interface InteropProducerTypeDescriptionHolder<T> {
    select: InteropProducerTypeDescription<T>['select']
    onManagedDeclaration: InteropProducerTypeDescription<T>['onManagedDeclaration']
    onNativeDeclaration: InteropProducerTypeDescription<T>['onNativeDeclaration']
    afterAll: InteropProducerTypeDescription<T>['afterAll']
    convertor: (val: T) => Convertor
}

export interface CustomDeclarationProducer<T extends Seed> {
    seedClass: new (...args: any[]) => T
    produce: Producer<GenerationLibrary, undefined>
}

export interface DeclarationSeedBuilder {
    create: (...args: any[]) => Seed
    createType: (...args: any[]) => LWType
    createExpr: (...args: any[]) => LWExpression
}

export function makeDeclarationProducer<T extends Seed>(
    seedClass: new (...args: any[]) => T,
    produce: TypedProducer<T, GenerationLibrary, undefined>,
): [CustomDeclarationProducer<T>, DeclarationSeedBuilder] {
    const wrappedProduce: Producer<GenerationLibrary, undefined> = (seed, ctx) => {
        if (seed instanceof seedClass) {
            return produce(seed, ctx)
        }
        return { skip: true }
    }
    return [
        {
            seedClass,
            produce: wrappedProduce
        },
        {
            create(this: any, ...args: any[]) {
                return GeneratorSeed.customSeed(new seedClass(...args))
            },
            createExpr(this: any, ...args: any[]) {
                return E.hole(this.create(...args))
            },
            createType(this: any, ...args: any[]) {
                return T.hole(this.create(...args))
            },
        }
    ]
}

export function makeSingletonProducer(name:string, generator:(name:string) => LWDeclaration): [CustomDeclarationProducer<Seed>, DeclarationSeedBuilder] {
    class SingletonSeed extends Seed {
        hash(): string { return name }
    }
    return makeDeclarationProducer(
        SingletonSeed,
        () => ({
            continuation: T.c(name),
            declarations: [generator(name)]
        })
    )
}

export class InteropGeneratorBuilder {

    private supportedTypes: InteropProducerTypeDescription<any>[] = []
    private customProducers: CustomDeclarationProducer<Seed>[] = []
    private overwrittenPeerProducer?: (node: idl.IDLMethod, func: FunctionDeclaration) => PeerFunctionPlacementResult
    private overwrittenApiCallProducer?: (seed: import("./seed").ApiCallSeed, ctx: ProducerContext<GenerationLibrary, undefined>, options: MakeApiOptions) => ProducerResult

    constructor(
        private methods: idl.IDLMethod[],
        private generators: EssentialsGenerators,
        private options: ProduceOptions,
    ) { }

    addIDLTypeSupport<T>(desc: InteropProducerTypeDescription<T>) {
        this.supportedTypes.push(desc)
        return this
    }
    addDeclarationProducer<T extends Seed>(producer: CustomDeclarationProducer<T>) {
        this.customProducers.push(producer)
        return this
    }
    overridePeerProducer(producer: typeof this.overwrittenPeerProducer) {
        this.overwrittenPeerProducer = producer
    }
    overrideApiCallProducer(producer: typeof this.overwrittenApiCallProducer) {
        this.overwrittenApiCallProducer = producer
    }
    when<T>(flavourName: string, builder: () => InteropProducerTypeDescription<T>) {
        if (this.options.flavours.includes(flavourName)) {
            this.addIDLTypeSupport(builder())
        }
    }
    either(defaultProducer: () => InteropProducerTypeDescription<any>, variants: [string, () => InteropProducerTypeDescription<any>][]) {
        for (const variant of variants) {
            if (this.options.flavours.includes(variant[0])) {
                this.addIDLTypeSupport(variant[1]())
                return
            }
        }
        this.addIDLTypeSupport(defaultProducer())
    }

    build(): InteropGenerator {
        return new InteropGenerator(
            this.options.flavours,
            this.methods,
            this.generators,
            this.options,
            this.supportedTypes.map(spec => {
                return {
                    select: spec.select,
                    onManagedDeclaration: spec.onManagedDeclaration,
                    onNativeDeclaration: spec.onNativeDeclaration,
                    afterAll: spec.afterAll,
                    convertor: (val) => {
                        const toBufferTransferable = spec.interopBufferTransferable?.(val)
                        const fromBufferTransferrable = spec.returnBufferTransferable?.(val)
                            ?? (toBufferTransferable && toBufferTransferable.symmetric
                                ? { toReturnBuffer: toBufferTransferable.toInteropBuffer, fromReturnBuffer: toBufferTransferable.fromInteropBuffer }
                                : undefined
                            )
                        return {
                            toBufferTransferable: toBufferTransferable,
                            fromBufferTransferrable: fromBufferTransferrable,
                            fromInteropTransferable: spec.fromInteropTransferable?.(val),
                            toInteropTransferable: spec.toInteropTransferable?.(val),
                        }
                    }
                }
            }),
            this.customProducers.concat(this.supportedTypes.flatMap(spec => spec.otherProducers ? spec.otherProducers : [])),
            this.overwrittenPeerProducer,
        )
    }
}

export function createInteropGenerator(methods: idl.IDLMethod[], generators: EssentialsGenerators, options: ProduceOptions): InteropGeneratorBuilder {
    return new InteropGeneratorBuilder(methods, generators, options)
}
