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

import { BindingsConstructions } from "./BindingsConstructions"
import { InteropConstructions } from "./InteropConstructions"
import { peerMethod } from "../general/common"
import { capitalize, createReferenceType } from "@idlizer/core"

export class PeersConstructions {
    static fileName(node: string): string {
        return `${node}.ts`
    }

    static get pointerParameter(): string {
        return `pointer`
    }

    static get validatePeer(): string {
        return `assertValidPeer`
    }

    static get super(): string {
        return `super`
    }

    static get this() {
        const name = `this`
        return {
            type: createReferenceType(name),
            name: name
        }
    }

    static get typeGuard() {
        const parameter = `node`
        return {
            name: (type: string) => `is${type}`,
            parameter: {
                name: parameter,
                type: `object | undefined`
            },
            returnType: (type: string) => `${parameter} is ${type}`,
            body: (type: string) => `${parameter} instanceof ${type}`
        }
    }

    static get unpackNullable(): string {
        return `unpackNode`
    }

    static get unpackNonNullable(): string {
        return `unpackNonNullableNode`
    }

    static get arrayOfPointersToArrayOfPeers(): string {
        return `unpackNodeArray`
    }

    static get receiveString(): string {
        return `unpackString`
    }

    static passNode(name: string): string {
        return `passNode(${name})`
    }

    static passNodeArray(name: string): string {
        return `passNodeArray(${name})`
    }

    static arrayLength(name: string): string {
        return `${name}.length`
    }

    static get context(): string {
        return `global.context`
    }

    static get pointerUsage(): string {
        return `this.peer`
    }

    static callBinding(iface: string, method: string, namespace: string | undefined): string {
        return `global.generatedEs2panda.${
            BindingsConstructions.method(
                InteropConstructions.method(iface, method, namespace ?? ``)
            )
        }`
    }

    static get warn(): string {
        return `console.warn`
    }

    static stubNodeMessage(node: string): string {
        return `"Warning: stub node ${node}"`
    }

    static import(what: string, from: string): string {
        return `import { ${what} } from "./${from}"`
    }

    static createOrUpdate(iface: string, method: string): string {
        return peerMethod(`${method}${iface}`)
    }

    static universalCreate(iface: string): string {
        return peerMethod(`create${iface}`)
    }

    static universalUpdate(iface: string): string {
        return peerMethod(`update${iface}`)
    }

    static newOf(iface: string): string {
        return `new ${iface}`
    }

    static callPeerMethod(iface: string, method: string): string {
        return `${iface}.${method}`
    }

    static brand(iface: string): string {
        return `brand${capitalize(iface)}`
    }
}