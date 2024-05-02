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

import { IndentedPrinter } from "../IndentedPrinter";
import { nativeModuleDeclaration, nativeModuleEmptyDeclaration } from "./FileGenerators";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";

class NativeModuleVisitor {
    readonly nativeModule = new IndentedPrinter()
    readonly nativeModuleEmpty = new IndentedPrinter()

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private printPeerMethods(peer: PeerClass) {
        peer.methods.forEach(method => {
            const component = method.isCallSignature ? peer.originalInterfaceName : peer.originalClassName
            peer.declarationTable.setCurrentContext(`${method.isCallSignature ? "" : method.methodName}()`)
            const basicParameters = method.argConvertors
                .map(it => {
                    if (it.useArray) {
                        const array = `${it.param}Serializer`
                        return `${it.param}Array: Uint8Array, ${array}Length: int32`
                    } else {
                        return `${it.param}: ${it.interopType(true)}`
                    }
                })
            let maybeReceiver = method.hasReceiver ? [`ptr: KPointer`] : []
            const parameters = maybeReceiver
                .concat(basicParameters)
                .join(", ")

            const implDecl = `_${component}_${method.methodName}(${parameters}): void`

            this.nativeModule.print(implDecl)
            this.nativeModuleEmpty.print(`${implDecl} { console.log("${method.methodName}") }`)
            peer.declarationTable.setCurrentContext(undefined)
        })
    }

    print(): void {
        for (const file of this.library.files) {
            for (const peer of file.peers.values()) {
                this.printPeerMethods(peer)
            }
        }
    }
}

export function printNativeModule(peerLibrary: PeerLibrary, nativeBridgePath: string): string {
    const lang = peerLibrary.declarationTable.language
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleDeclaration(visitor.nativeModule.getOutput(), nativeBridgePath, false, lang)
}

export function printNativeModuleEmpty(peerLibrary: PeerLibrary): string {
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleEmptyDeclaration(visitor.nativeModuleEmpty.getOutput())
}