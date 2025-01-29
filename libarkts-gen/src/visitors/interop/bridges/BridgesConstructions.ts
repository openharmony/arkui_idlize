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

export class BridgesConstructions {
    static castedParameter(name: string): string {
        return `_${name}`
    }

    static interopMacro(isVoid: boolean, parametersCount: number): string {
        return `KOALA_INTEROP_${isVoid ? `V` : ``}${parametersCount}`
    }

    static implFunction(name: string): string {
        return `impl_${name}`
    }

    static referenceType(name: string): string {
        return `es2panda_${name}*`
    }

    static get sequenceLengthDeclaration(): string {
        return `std::size_t length`
    }

    static get sequenceLengthPass(): string {
        return `&length`
    }

    static get sequenceLengthUsage(): string {
        return `length`
    }

    static get result(): string {
        return `result`
    }

    static stringConstructor(name: string): string {
        return `new std::string(${name})`
    }

    static sequenceConstructor(first: string, length: string): string {
        return `new std::vector<void*>(${first}, ${first} + ${length})`
    }

    static referenceTypeCast(type: string): string {
        return `reinterpret_cast<${type}>`
    }

    static primitiveTypeCast(type: string): string {
        return `static_cast<${type}>`
    }

    static enumCast(type: string): string {
        return `static_cast<${type}>`
    }

    static callMethod(name: string): string {
        return `GetImpl()->${name}`
    }
}