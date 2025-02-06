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

export class PeersConstructions {
    static fileName(node: string): string {
        return `${node}.ts`
    }

    static get peer(): string {
        return `peer`
    }

    static get validatePeer(): string {
        return `assertValidPeer`
    }

    static get super(): string {
        return `super`
    }

    static get typeGuard() {
        const parameter = `node`
        return {
            name: (type: string) => `is${type}`,
            parameter: parameter,
            returnType: (type: string) => `${parameter} is ${type}`,
            body: (type: string) => `${parameter} instanceof ${type}`
        }
    }
}