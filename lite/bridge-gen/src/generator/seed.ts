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
import { LWType, Ts, lw, LWExpression } from "@idlizer/ost"
import { makeSeed, Seed } from "@idlizer/kit"
import { showErrorForIDLNode, showErrorFile } from "./common"

export interface InteropGenerationSeedType {
    method: idl.IDLMethod
}
export const InteropGenerationSeed = makeSeed<InteropGenerationSeedType>(
    x => `::INTEROP:CORE:${idl.getFQName(x.method)}`,
    seed => {
        return `Generating peers for ` + showErrorForIDLNode(seed.method)
    }
)
///

export interface GeneratorSeedIDL {
    sort: 'idl'
    reference: idl.IDLType
}
export interface GeneratorSeedNested {
    sort: 'custom'
    seed: Seed<any>
}

export type GeneratorSeedType = GeneratorSeedIDL | GeneratorSeedNested

function hashIDLType(type: idl.IDLType): string {
    if (idl.isReferenceType(type)) {
        return `reference:${type.name}`
    }
    if (idl.isPrimitiveType(type)) {
        return `primitive:${type.name}`
    }
    throw new Error(`UNSUPPORTED IDL TYPE "${idl.DebugUtils.debugPrintType(type)}"`)
}

export const GeneratorSeed = makeSeed<GeneratorSeedType>(
    seed => {
        switch (seed.sort) {
            case 'idl': return `::SEED:declaration:idl:${hashIDLType(seed.reference)}`
            case 'custom': return `::SEED:declaration:custom:${seed.seed.typeOf.hash(seed.seed)}`
        }
    },
    seed => {
        switch (seed.sort) {
            case 'idl': return `Generating declaration for reference "${seed.reference}" ` + showErrorFile(seed.reference)
            case 'custom': {
                if (seed.seed.debugMessage) {
                    return seed.seed.debugMessage()
                }
                return `Generating for custom seed ` + seed.seed.hash()
            }
        }
    }
)

///

export interface TwinFunctionCallSeedType {
    method: idl.IDLMethod
    twinDeclaration: lw.FunctionDeclaration
}

export const TwinFunctionCallSeed = makeSeed<TwinFunctionCallSeedType>(
    seed => `::SEED:twinCall:${seed.twinDeclaration.name}:${idl.getFQName(seed.method)}`,
    seed => {
        return `Generating interop bridge for ` + showErrorForIDLNode(seed.method)
    }
)

///

export interface ApiSeedType {
    method: idl.IDLMethod,
    arguments: LWExpression[],
    apiCallParams: lw.FunctionDeclaration['parameters']
    apiReturnType: LWType
}

export const ApiCallSeed = makeSeed<ApiSeedType>(
    (x) => idl.getFQName(x.method) + ':' + 'API_CALL_SEED'
)

///

export const Ask = {
    typeName: (declaration: idl.IDLType | idl.IDLEntry): LWType =>
        idl.isPrimitiveType(declaration, 'void')
            ? Ts.prim.void
            : GeneratorSeed.createType({
                sort: 'idl',
                reference: idl.isType(declaration) ? declaration : idl.createReferenceType(declaration),
            }),
    makeGenerationSeed: (declaration: idl.IDLType | idl.IDLEntry): Seed<GeneratorSeedType> =>
        GeneratorSeed.create({
            sort: 'idl',
            reference: idl.isType(declaration) ? declaration : idl.createReferenceType(declaration),
        }),
    interopMethod: (method:idl.IDLMethod): LWExpression =>
        InteropGenerationSeed.createExp({ method }),
    interopCall: (method:idl.IDLMethod, twinDeclaration:lw.FunctionDeclaration): LWExpression =>
        TwinFunctionCallSeed.createExp({
            method,
            twinDeclaration,
        }),
    apiCall: (method:idl.IDLMethod, args:LWExpression[], apiCallParams: lw.FunctionDeclaration['parameters'], apiReturnType: LWType): LWExpression =>
        ApiCallSeed.createExp({
            method,
            arguments: args,
            apiCallParams,
            apiReturnType,
        })
}
