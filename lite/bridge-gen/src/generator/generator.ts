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
import { capitalize } from "@idlizer/core"
import { LWExpression, LWStatement, FunctionDeclaration, LWDeclaration, D, std, Ts, S, E } from "@idlizer/ost"
import { Config, ConfigBundle } from "../config"
import { ProducerContext, ProducerResult, GeneratorMemory, makeGeneratorMemory, continueWith, Producer, GenerateOptions, onlyFor, TypedProducer, Seed } from "@idlizer/kit"
import { InputLibrary } from "../library"
import { CustomDeclarationProducer, InteropProducerTypeDescription, InteropProducerTypeDescriptionHolder } from "./builder"
import { Convertor, GenerationLibrary, NotTransferrableType } from "./common"
import { GeneratedNativeModule, DividedResult, nativeModuleProducer } from "./nativeModuleProducer"
import { InteropGenerationSeed, GeneratorSeed, GeneratorSeedIDL, GeneratorSeedNested, ApiCallSeed, TwinFunctionCallSeed } from "./seed"

export interface MakeApiOptions {
    noHeader: boolean
    noReceiver: boolean
}

export class NotRegisteredTypeError extends Error {
    constructor(
        public type: idl.IDLType
    ) { super(`Type ${idl.DebugUtils.debugPrintType(type)} was not registered!`) }
}

export type Defined<T> = T extends undefined ? never : T

export class TypeSpecSelector {
    constructor(
        private typeSpecs: InteropProducerTypeDescriptionHolder<any>[],
        private customProducers: CustomDeclarationProducer<Seed>[],
    ) { }

    private memoizeTypeSpecCalls = new Map<InteropProducerTypeDescriptionHolder<any>, [any, LWDeclaration[]][]>()
    private registerTypeSpecCall(spec:InteropProducerTypeDescriptionHolder<any>, arg:any, generated:LWDeclaration[]) {
        if (!this.memoizeTypeSpecCalls.has(spec)) {
            this.memoizeTypeSpecCalls.set(spec, [])
        }
        this.memoizeTypeSpecCalls.get(spec)?.push([arg, generated])
    }

    flushMemory() {
        this.memoizeTypeSpecCalls.clear()
    }

    private findSpec(type: idl.IDLType): [any, InteropProducerTypeDescriptionHolder<any>] {
        for (const typeSpec of this.typeSpecs) {
            const selected = typeSpec.select(type)
            if (selected.selected()) {
                return [selected.get(), typeSpec]
            }
        }
        throw new NotRegisteredTypeError(type)
    }

    selectConvertor(type: idl.IDLType): Convertor {
        const [arg, found] = this.findSpec(type)
        return found.convertor(arg)
    }

    private notTransferrableType(type: idl.IDLType, direction: 'toNative' | 'toManaged'): never {
        throw new NotTransferrableType(type, direction === 'toNative' ? 'fromManagedToNative' : 'fromNativeToManaged')
    }
    toInteropBuffer(type: idl.IDLType, arg: LWExpression, buffer: LWExpression): LWStatement[] {
        return this.selectConvertor(type).toBufferTransferable?.toInteropBuffer(arg, buffer)
            ?? this.notTransferrableType(type, 'toNative')
    }
    fromInteropBuffer(type: idl.IDLType, buffer: LWExpression): [LWStatement[], LWExpression] {
        return this.selectConvertor(type).toBufferTransferable?.fromInteropBuffer(buffer)
            ?? this.notTransferrableType(type, 'toNative')
    }
    toReturnBuffer(type: idl.IDLType, arg: LWExpression, buffer: LWExpression): LWStatement[] {
        return this.selectConvertor(type).fromBufferTransferrable?.toReturnBuffer(arg, buffer)
            ?? this.notTransferrableType(type, 'toManaged')
    }
    fromReturnBuffer(type: idl.IDLType, buffer: LWExpression): [LWStatement[], LWExpression] {
        return this.selectConvertor(type).fromBufferTransferrable?.fromReturnBuffer(buffer)
            ?? this.notTransferrableType(type, 'toManaged')
    }

    private createProducer(producer: (prod: InteropProducerTypeDescription<any>, val: any, seed: GeneratorSeedIDL, ctx: ProducerContext<GenerationLibrary, undefined>) => ProducerResult): TypedProducer<GeneratorSeed, GenerationLibrary, undefined> {
        return (seed, context) => {
            if (seed instanceof GeneratorSeedIDL) {
                const [arg, found] = this.findSpec(seed.reference)
                const result = producer(found, arg, seed, context)
                if (!("skip" in result)) {
                    this.registerTypeSpecCall(found, arg, result.declarations)
                }
                return result
            }
            if (seed instanceof GeneratorSeedNested) {
                for (const cp of this.customProducers) {
                    if (seed.innerSeed instanceof cp.seedClass) {
                        return cp.produce(seed.innerSeed, context)
                    }
                }
            }
            return { skip: true }
        }
    }

    createManagedProducer(): TypedProducer<GeneratorSeed, GenerationLibrary, undefined> {
        return this.createProducer((prod, val, seed, ctx) => prod.onManagedDeclaration(val, seed, ctx))
    }

    createNativeProducer(): TypedProducer<GeneratorSeed, GenerationLibrary, undefined> {
        return this.createProducer((prod, val, seed, ctx) => prod.onNativeDeclaration(val, seed, ctx))
    }

    callAfterAll(): LWDeclaration[] {
        const more: LWDeclaration[] = []
        this.memoizeTypeSpecCalls.forEach((info, spec) => {
            if (spec.afterAll) {
                more.push(...spec.afterAll(info))
            }
        })
        return more
    }
}

export interface ProduceOptions {
    library: InputLibrary
    projectConfig: Config
    flavours: string[]
}

export interface EssentialsGenerators {
    twinProducer: (method: idl.IDLMethod, selector: TypeSpecSelector) => FunctionDeclaration,
    bridgeProducer: (nm: GeneratedNativeModule) => LWDeclaration[],
    apiCallProducer: (seed: ApiCallSeed, ctx: ProducerContext<GenerationLibrary, undefined>, options: MakeApiOptions) => ProducerResult
}

export interface ProduceResult {
    wrapper: LWDeclaration[]
    host: LWDeclaration[]
    nativeModuleName: string
}

export interface PeerFunctionPlacementResult {
    reference: LWExpression
    declaration: LWDeclaration
}

export class InteropGenerator {

    constructor(
        private flavours: string[],
        private methods: idl.IDLMethod[],
        private generators: EssentialsGenerators,
        private options: ProduceOptions,
        private supportedTypes: InteropProducerTypeDescriptionHolder<any>[] = [],
        private customProducers: CustomDeclarationProducer<Seed>[] = [],

        private overwrittenPeerProducer?: (method: idl.IDLMethod, func: FunctionDeclaration) => PeerFunctionPlacementResult,
    ) { }

    ///

    private sharedMemory: GeneratorMemory = makeGeneratorMemory()

    private produceInitialFunctionPair(
        roots: { declarations: LWDeclaration[] } | { seeds: Seed[] },
        library: GenerationLibrary
    ): LWDeclaration[] {
        const { declarations } = continueWith<unknown, {}, undefined>({
            createEffect: () => undefined,
            library: {},
            roots,
            sharedMemory: this.sharedMemory,
        }, onlyFor(InteropGenerationSeed, (seed) => {
            let wrappedFunction: LWDeclaration = this.generators.twinProducer(seed.method, library.selector)
            let wrapperReference: LWExpression = E.v(wrappedFunction.name)
            if (this.overwrittenPeerProducer) {
                const { reference, declaration } = this.overwrittenPeerProducer(seed.method, wrappedFunction)
                wrappedFunction = declaration
                wrapperReference = reference
            }
            return {
                continuation: wrapperReference,
                declarations: [wrappedFunction]
            }
        }))
        return declarations
    }

    private divideAndGenerate(wrapperDeclarations: LWDeclaration[], library: GenerationLibrary): DividedResult {
        const targetMappedName = library.targetName.split(/[.@\\/-]/).map(capitalize).join('_')
        const nativeModuleName = 'framework.nativeModule.GeneratedNM' + targetMappedName
        const { declarations: producedWrapperDeclarations, effect: nativeModuleDescription } = continueWith<unknown, GenerationLibrary, GeneratedNativeModule>({
            library,
            createEffect: () => ({ nativeModuleName, methods: [] }),
            roots: {
                declarations: wrapperDeclarations
            },
            sharedMemory: this.sharedMemory,
        }, onlyFor(TwinFunctionCallSeed, nativeModuleProducer))

        if (library.target === 'panda') {
            producedWrapperDeclarations.unshift(
                D.class(nativeModuleName, [], [
                    D.func(std.names.members.staticCtor, [], Ts.prim.void, S.block([
                        S.e(E.call(E.v('loadLibrary'), [E.s(nativeModuleName.split('.').at(-1)!)])),
                    ]))
                ])
            )
        }

        return {
            wrapperDeclarations: producedWrapperDeclarations,
            hostDeclarations: this.generators.bridgeProducer(nativeModuleDescription),
            nativeModuleName,
        }
    }

    private fillApiCall(
        declarations: LWDeclaration[],
        library: GenerationLibrary,
    ): LWDeclaration[] {
        const { declarations: produced } = continueWith<unknown, GenerationLibrary, undefined>({
            createEffect: () => undefined,
            library: library,
            roots: { declarations },
            sharedMemory: this.sharedMemory,
        }, onlyFor(ApiCallSeed, (req, ctx) => this.generators.apiCallProducer(
            req,
            ctx,
            {
                noHeader: !this.options.projectConfig.originalConfig.library.header,
                noReceiver: this.options.projectConfig.originalConfig.library.no_api_receiver
            })))
        return produced
    }

    private closeDeclarationsAndSerializers(declarations: LWDeclaration[], library: GenerationLibrary, style: 'managed' | 'native'): LWDeclaration[] {
        const { declarations: produced } = continueWith<unknown, GenerationLibrary, undefined>({
            createEffect: () => undefined,
            library,
            roots: { declarations },
            sharedMemory: this.sharedMemory,
        }, onlyFor(GeneratorSeed, style === 'managed' ? library.selector.createManagedProducer() : library.selector.createNativeProducer()))
        return produced
    }

    ///

    generate(target: ConfigBundle['target'], targetName: string): ProduceResult {
        const { library } = this.options
        const selector = new TypeSpecSelector(
            this.supportedTypes,
            this.customProducers,
        )
        const generationLibrary: GenerationLibrary = {
            stage: 'peer',
            original: library,
            target,
            targetName,
            selector,
            flavours: this.flavours,
        }

        // MANAGED SIDE GENERATION. SHARED MEMORY
        this.sharedMemory = makeGeneratorMemory()
        selector.flushMemory()
        let wrappedState: GenerateOptions<undefined, undefined>['roots'] = {
            seeds: this.methods.map(method => new InteropGenerationSeed(method))
        }

        /* until there is more InteropGenerationSeed in generated tree */
        while (true) {

            /* THE PAIR */
            generationLibrary.stage = 'peer'
            const wrappedDeclarations = this.produceInitialFunctionPair(
                wrappedState,
                generationLibrary,
            )

            if ("declarations" in wrappedState) {
                if (wrappedState.declarations.length === wrappedDeclarations.length) {
                    break
                }
            }

            /* DATA AND SERIALIZER CLOJURE */
            generationLibrary.stage = 'managed'
            const closedWrapper = this.closeDeclarationsAndSerializers(wrappedDeclarations, generationLibrary, 'managed')
            wrappedState = { declarations: closedWrapper }
        }

        // NATIVE SIDE GENERATION. RESET MEMORY
        this.sharedMemory = makeGeneratorMemory()
        selector.flushMemory()

        /* CALL STRATEGY */
        generationLibrary.stage = 'bridge'
        const { wrapperDeclarations, hostDeclarations, nativeModuleName } = this.divideAndGenerate(wrappedState.declarations, generationLibrary)

        /* API CALLS FILL */
        generationLibrary.stage = 'api'
        const updatedHost = this.fillApiCall(hostDeclarations, generationLibrary)

        generationLibrary.stage = 'native'
        const closedHost = this.closeDeclarationsAndSerializers(updatedHost, generationLibrary, 'native')
            .concat(selector.callAfterAll())

        return {
            wrapper: wrapperDeclarations,
            host: closedHost,
            nativeModuleName,
        }
    }
}
