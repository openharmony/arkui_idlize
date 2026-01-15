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
import { ProducerContext, ProducerResult, SeedType, Seed, Producer, makeSeed, terminate } from "@idlizer/kit"
import { EssentialsGenerators, ProduceOptions, InteropGenerator, MakeApiOptions, PeerFunctionPlacementResult } from "./generator"
import { GenerationLibrary, Convertor } from "./common"
import { GeneratorSeedIDL, GeneratorSeedType, GeneratorSeed, ApiSeedType } from "./seed"

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
    onManagedDeclaration: (val: T, seed: GeneratorSeedIDL, ctx: ProducerContext<GenerationLibrary, undefined>) => ProducerResult
    onNativeDeclaration: (val: T, seed: GeneratorSeedIDL, ctx: ProducerContext<GenerationLibrary, undefined>) => ProducerResult
    fromInteropTransferable?: (val: T) => Convertor['fromInteropTransferable'],
    toInteropTransferable?: (val: T) => Convertor['toInteropTransferable'],
    interopBufferTransferable?: (val: T) => Convertor['toBufferTransferable'] & { symmetric?: true }
    returnBufferTransferable?: (val: T) => Convertor['fromBufferTransferrable']
    afterAll?: (val:[T, LWDeclaration[]][]) => LWDeclaration[]
    otherProducers?: CustomDeclarationProducer<any>[]
}

export interface InteropProducerTypeDescriptionHolder<T> {
    select: InteropProducerTypeDescription<T>['select']
    onManagedDeclaration: InteropProducerTypeDescription<T>['onManagedDeclaration']
    onNativeDeclaration: InteropProducerTypeDescription<T>['onNativeDeclaration']
    afterAll: InteropProducerTypeDescription<T>['afterAll']
    convertor: (val: T) => Convertor
}

export interface CustomDeclarationProducer<T> {
    seedType: SeedType<T>
    produce: Producer<T, GenerationLibrary, undefined>
}

export interface DeclarationSeedBuilder<T> {
    create: (x: T) => Seed<GeneratorSeedType>
    createType: (x: T) => LWType
    createExpr: (x: T) => LWExpression
}

export function makeDeclarationProducer<T>(seedType: SeedType<T>, produce: Producer<T, GenerationLibrary, undefined>): [CustomDeclarationProducer<T>, DeclarationSeedBuilder<T>] {
    return [
        {
            seedType,
            produce
        },
        {
            create(x) {
                return GeneratorSeed.create({
                    sort: 'custom',
                    seed: seedType.create(x)
                })
            },
            createExpr(x) {
                return E.hole(this.create(x))
            },
            createType(x) {
                return T.hole(this.create(x))
            },
        }
    ]
}

export function makeSingletonProducer(name:string, generator:(name:string) => LWDeclaration): [CustomDeclarationProducer<{}>, DeclarationSeedBuilder<{}>] {
    return makeDeclarationProducer(
        makeSeed(() => name),
        () => ({
            continuation: T.c(name),
            declarations: [generator(name)]
        })
    )
}

export class InteropGeneratorBuilder {

    private supportedTypes: InteropProducerTypeDescription<any>[] = []
    private customProducers: CustomDeclarationProducer<any>[] = []
    private overwrittenPeerProducer?: (node: idl.IDLMethod, func: FunctionDeclaration) => PeerFunctionPlacementResult
    private overwrittenApiCallProducer?: (seed: ApiSeedType, ctx: ProducerContext<GenerationLibrary, undefined>, options: MakeApiOptions) => ProducerResult

    constructor(
        private methods: idl.IDLMethod[],
        private generators: EssentialsGenerators,
        private options: ProduceOptions,
    ) { }

    addIDLTypeSupport<T>(desc: InteropProducerTypeDescription<T>) {
        this.supportedTypes.push(desc)
        return this
    }
    addDeclarationProducer<T>(producer: CustomDeclarationProducer<T>) {
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
