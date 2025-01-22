/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export const bridgesConstructions = {
    castedParameterName(name: string): string {
        return `_${name}`
    },
    interopMacro(isVoid: boolean, parametersCount: number): string {
        return `KOALA_INTEROP_${isVoid ? `V` : ``}${parametersCount}`
    },
    implFunction(name: string): string {
        return `impl_${name}`
    },
    referenceType(name: string): string {
        return `es2panda_${name}`
    },
    get sequenceLengthDeclaration(): string {
        return `std::size_t length`
    },
    get sequenceLengthPass(): string {
        return `&length`
    },
    get sequenceLengthUsage(): string {
        return `length`
    },
    get resultName(): string {
        return `result`
    },
    get receiverName(): string {
        return `receiver`
    },
    sequenceConstructor(first: string, length: string): string {
        return `new std::vector<void*>(${first}, ${first} + ${length})`
    },
    referenceTypeCast(type: string): string {
        return `reinterpret_cast<${type}>`
    },
    primitiveTypeCast(type: string): string {
        return `static_cast<${type}>`
    },
    sequenceParameterPointer(parameter: string): string {
        return `${parameter}SequencePointer`
    },
    sequenceParameterLength(parameter: string): string {
        return `${parameter}SequenceLength`
    },
    callMethod(name: string): string {
        return `GetImpl()->${name}`
    }
}