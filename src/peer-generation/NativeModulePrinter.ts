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
import { LanguageWriter, Method, NamedMethodSignature, Type, createLanguageWriter } from "./LanguageWriters";
import { PeerClass, PeerClassBase } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { printGlobalMaterialized } from "./Materialized";
import { PeerMethod } from "./PeerMethod";

class NativeModuleVisitor {
    readonly nativeModule: LanguageWriter
    readonly nativeModuleEmpty: LanguageWriter

    constructor(
        private readonly library: PeerLibrary,
    ) {
        this.nativeModule = createLanguageWriter(new IndentedPrinter(), library.declarationTable.language)
        this.nativeModuleEmpty = createLanguageWriter(new IndentedPrinter(), library.declarationTable.language)
    }

    private printPeerMethods(peer: PeerClass) {
        peer.methods.forEach(it => printPeerMethod(peer, it, this.nativeModule, this.nativeModuleEmpty))
    }

    print(): void {
        for (const file of this.library.files) {
            for (const peer of file.peers.values()) {
                this.printPeerMethods(peer)
            }
        }
        printGlobalMaterialized(this.nativeModule, this.nativeModuleEmpty)
    }
}

export function printPeerMethod(clazz: PeerClassBase, method: PeerMethod, nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter,
    returnType?: Type
) {
    const component = clazz.generatedName(method.isCallSignature)
    clazz.setGenerationContext(`${method.isCallSignature ? "" : method.overloadedName}()`)
    const args = method.argConvertors
        .flatMap(it => {
            if (it.useArray) {
                const array = `${it.param}Serializer`
                return [{ name: `${it.param}Array`, type: 'Uint8Array' },
                { name: `${array}Length`, type: 'int32' }]
            } else {
                // TODO: use language as argument of interop type.
                return [{ name: `${it.param}`, type: it.interopType(nativeModule.language) }]
            }
        })
    let maybeReceiver = method.hasReceiver() ? [{ name: 'ptr', type: 'KPointer' }] : []
    const parameters = NamedMethodSignature.make(returnType?.name ?? 'void', maybeReceiver.concat(args))
    let name = `_${component}_${method.overloadedName}`
    nativeModule.writeNativeMethodDeclaration(name, parameters)
    nativeModuleEmpty.writeMethodImplementation(new Method(name, parameters), (printer) => {
        printer.writePrintLog(name)
        if (returnType !== undefined) {
            printer.writeStatement(printer.makeReturn(printer.makeString(`-1`)))
        }
    })
    clazz.setGenerationContext(undefined)
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