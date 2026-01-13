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

import { IDLType, IDLReferenceType, isReferenceType, IDLEntry, DebugUtils } from "@idlizer/core/idl"
import { LWExpression, LWStatement, LWType } from "@idlizer/ost"
import { terminate } from "../../cli/error"
import { ProducerResult } from "../../engine"
import { IDLLibrary } from "./library"

export function selectEQ<T>(x: T): (x: IDLType) => T | undefined {
    return (type) => type === x ? type as T : undefined
}

export function selectReference(name: string): (x: IDLType) => IDLReferenceType | undefined {
    return (type) => isReferenceType(type) && type.name === name
        ? type
        : undefined
}

export function selectType<T extends IDLType>(pred: (x: IDLType, lib:IDLLibrary) => x is T, ...conds: ((x: T, lib:IDLLibrary) => boolean)[]): (x: IDLType, lib: IDLLibrary) => T | undefined {
    return (type, lib) => pred(type, lib) && conds.every(c => c(type, lib)) ? type : undefined
}

export function selectDeclaration<T extends IDLEntry>(pred: (x: IDLEntry) => x is T, ...conds: ((x: T) => boolean)[]): (x: IDLType, lib: IDLLibrary) => T | undefined {
    return (type, lib) => {
        if (!isReferenceType(type)) {
            return undefined
        }
        const decl = lib.toDeclaration(type)
        return pred(decl) && conds.every(c => c(decl))
            ? decl
            : undefined
    }
}

///

export interface GeneratorBox<T> {
    select: (type: IDLType, lib: IDLLibrary) => T | undefined,
    makeDeclaration: (decl: T, lib: IDLLibrary, selector: Selector) => ProducerResult
    toNative: (decl: T, param: LWExpression, lib:IDLLibrary, selector:Selector) => [LWStatement[], LWExpression, LWType]
    fromNative: (decl: T, returnValue: LWExpression, lib:IDLLibrary, selector:Selector, pushArg:(name:string, type:LWType, expr:LWExpression) => void) => [LWType, [LWStatement[], LWStatement[]], LWExpression]
}

export class SelectorBuilder {

    private boxes: GeneratorBox<any>[] = []

    register<T>(box: GeneratorBox<T>) {
        this.boxes.push(box)
    }

    build(): Selector {
        return new Selector(this.boxes)
    }
}

export class Selector {
    constructor(
        private specs: GeneratorBox<any>[]
    ) { }

    private findSafe(type: IDLType, library: IDLLibrary): [GeneratorBox<any>, any] | undefined {
        for (const spec of this.specs) {
            const result = spec.select(type, library)
            if (result) {
                return [spec, result]
            }
        }
        return undefined
    }

    private find(type: IDLType, library: IDLLibrary): [GeneratorBox<any>, any] {
        return this.findSafe(type, library) ?? terminate(`GENERATOR FOR THE TYPE "${DebugUtils.debugPrintType(type)}" is not specified`)
    }

    isRegistered(type: IDLType, library: IDLLibrary): boolean {
        return !!this.findSafe(type, library)
    }

    generate(type: IDLType, library: IDLLibrary): ProducerResult {
        const [spec, arg] = this.find(type, library)
        return spec.makeDeclaration(arg, library, this)
    }

    toNative(type: IDLType, library: IDLLibrary, param: LWExpression) {
        const [spec, arg] = this.find(type, library)
        return spec.toNative(arg, param, library, this)
    }

    fromNative(type: IDLType, library: IDLLibrary, returnValue: LWExpression, pushArg:(name:string, type:LWType, expr:LWExpression) => void) {
        const [spec, arg] = this.find(type, library)
        return spec.fromNative(arg, returnValue, library, this, pushArg)
    }
}
