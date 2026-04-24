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
import { LWType, Ts, lw, LWExpression, E, T } from "@idlizer/ost"
import { Seed } from "@idlizer/kit"
import { showErrorForIDLNode, showErrorFile } from "./common"

export class InteropGenerationSeed extends Seed {
    constructor(
        public method: idl.IDLMethod
    ) {
        super()
    }
    hash(): string {
        return `::INTEROP:CORE:${idl.getFQName(this.method)}`
    }
    debugMessage(): string {
        return `Generating peers for ` + showErrorForIDLNode(this.method)
    }
}

///

function hashIDLType(type: idl.IDLType): string {
    if (idl.isReferenceType(type)) {
        return `reference:${type.name}`
    }
    if (idl.isPrimitiveType(type)) {
        return `primitive:${type.name}`
    }
    throw new Error(`UNSUPPORTED IDL TYPE "${idl.DebugUtils.debugPrintType(type)}"`)
}

export class GeneratorSeed extends Seed {

    static idlSeed(reference: idl.IDLType): GeneratorSeedIDL {
        return new GeneratorSeedIDL(reference)
    }

    static customSeed(seed: Seed): GeneratorSeedNested {
        return new GeneratorSeedNested(seed)
    }

    hash(): string {
        throw new Error("GeneratorSeed base class should not be instantiated directly")
    }
}

export class GeneratorSeedIDL extends GeneratorSeed {
    readonly reference: idl.IDLType

    constructor(reference: idl.IDLType) {
        super()
        this.reference = reference
    }

    hash(): string {
        return `::SEED:declaration:idl:${hashIDLType(this.reference)}`
    }
    debugMessage(): string {
        return `Generating declaration for reference "${this.reference}" ` + showErrorFile(this.reference)
    }
}

export class GeneratorSeedNested extends GeneratorSeed {
    readonly innerSeed: Seed

    constructor(innerSeed: Seed) {
        super()
        this.innerSeed = innerSeed
    }

    hash(): string {
        return `::SEED:declaration:custom:${this.innerSeed.hash()}`
    }
    debugMessage(): string {
        return `Generating for custom seed ` + this.innerSeed.hash()
    }
}

///

export class TwinFunctionCallSeed extends Seed {
    constructor(
        public method: idl.IDLMethod,
        public twinDeclaration: lw.FunctionDeclaration
    ) {
        super()
    }
    hash(): string {
        return `::SEED:twinCall:${this.twinDeclaration.name}:${idl.getFQName(this.method)}`
    }
    debugMessage(): string {
        return `Generating interop bridge for ` + showErrorForIDLNode(this.method)
    }
}

///

export class ApiCallSeed extends Seed {
    constructor(
        public method: idl.IDLMethod,
        public callArgs: LWExpression[],
        public apiCallParams: lw.FunctionDeclaration['parameters'],
        public apiReturnType: LWType,
    ) {
        super()
    }
    hash(): string {
        return idl.getFQName(this.method) + ':' + 'API_CALL_SEED'
    }
}

///

export const Ask = {
    typeName: (declaration: idl.IDLType | idl.IDLEntry): LWType =>
        idl.isPrimitiveType(declaration, 'void')
            ? Ts.prim.void
            : T.hole(GeneratorSeed.idlSeed(
                idl.isType(declaration) ? declaration : idl.createReferenceType(declaration),
            )),
    makeGenerationSeed: (declaration: idl.IDLType | idl.IDLEntry): Seed =>
        GeneratorSeed.idlSeed(
            idl.isType(declaration) ? declaration : idl.createReferenceType(declaration),
        ),
    interopMethod: (method: idl.IDLMethod): LWExpression =>
        E.hole(new InteropGenerationSeed(method)),
    interopCall: (method: idl.IDLMethod, twinDeclaration: lw.FunctionDeclaration): LWExpression =>
        E.hole(new TwinFunctionCallSeed(method, twinDeclaration)),
    apiCall: (method: idl.IDLMethod, args: LWExpression[], apiCallParams: lw.FunctionDeclaration['parameters'], apiReturnType: LWType): LWExpression =>
        E.hole(new ApiCallSeed(method, args, apiCallParams, apiReturnType))
}
