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

import { IndentedPrinter } from "../../IndentedPrinter";
import { generateEventsBridgeSignature } from "./EventsPrinter";
import { nativeModuleDeclaration, nativeModuleEmptyDeclaration } from "../FileGenerators";
import { LanguageWriter, Method, NamedMethodSignature, StringExpression, Type, createLanguageWriter } from "../LanguageWriters";
import { PeerClass, PeerClassBase } from "../PeerClass";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";

class NativeModuleVisitor {
    readonly nativeModule: LanguageWriter
    readonly nativeModuleEmpty: LanguageWriter

    constructor(
        private readonly library: PeerLibrary,
    ) {
        this.nativeModule = createLanguageWriter(library.declarationTable.language)
        this.nativeModuleEmpty = createLanguageWriter(library.declarationTable.language)
    }

    private printPeerMethods(peer: PeerClass) {
        peer.methods.forEach(it => printPeerMethod(peer, it, this.nativeModule, this.nativeModuleEmpty))
    }

    private printMaterializedMethods(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter) {
        this.library.materializedToGenerate.forEach(clazz => {
            printPeerMethod(clazz, clazz.ctor, nativeModule, nativeModuleEmpty, Type.Pointer)
            printPeerMethod(clazz, clazz.finalizer, nativeModule, nativeModuleEmpty, Type.Pointer)
            clazz.methods.forEach(method => {
                const returnType = method.tsReturnType()
                // TODO: DotIndicator and DigitIndicator implements Indicator
                const subType = returnType?.name.includes(method.originalParentName)
                printPeerMethod(clazz, method, nativeModule, nativeModuleEmpty,
                    returnType === Type.This || subType ? Type.Pointer : returnType)
            })
        })
    }

    private printEventMethods(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter) {
        let method = generateEventsBridgeSignature(nativeModule.language)
        method = new Method(`_${method.name}`, method.signature, method.modifiers)
        nativeModule.writeNativeMethodDeclaration(method.name, method.signature)
        nativeModuleEmpty.writeMethodImplementation(method, writer => {
            writer.writePrintLog(method.name)
            writer.writeStatement(writer.makeReturn(new StringExpression(`0`)))
        })
    }

    print(): void {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        this.nativeModule.pushIndent()
        this.nativeModuleEmpty.pushIndent()
        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                this.printPeerMethods(peer)
            }
        }
        this.printMaterializedMethods(this.nativeModule, this.nativeModuleEmpty)
        this.printEventMethods(this.nativeModule, this.nativeModuleEmpty)
        this.nativeModule.popIndent()
        this.nativeModuleEmpty.popIndent()
    }
}

function printPeerMethod(clazz: PeerClassBase, method: PeerMethod, nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter,
    returnType?: Type
) {
    const component = clazz.generatedName(method.isCallSignature)
    clazz.setGenerationContext(`${method.isCallSignature ? "" : method.overloadedName}()`)
    let serializerArgCreated = false
    let args: ({name: string, type: string})[] = []
    for (let i = 0; i < method.argConvertors.length; ++i) {
        let it = method.argConvertors[i]
        if (it.useArray) {
            if (!serializerArgCreated) {
                const array = `thisSerializer`
                args.push({ name: `thisArray`, type: 'Uint8Array' }, { name: `thisLength`, type: 'int32' })
                serializerArgCreated = true
            }
        } else {
            // TODO: use language as argument of interop type.
            args.push({ name: `${it.param}`, type: it.interopType(nativeModule.language) })
        }
    }
    let maybeReceiver = method.hasReceiver() ? [{ name: 'ptr', type: 'KPointer' }] : []
    const parameters = NamedMethodSignature.make(returnType?.name ?? 'void', maybeReceiver.concat(args))
    let name = `_${component}_${method.overloadedName}`
    nativeModule.writeNativeMethodDeclaration(name, parameters)
    nativeModuleEmpty.writeMethodImplementation(new Method(name, parameters), (printer) => {
        printer.writePrintLog(name)
        if (returnType !== undefined && returnType.name !== Type.Void.name) {
            printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(returnType))))
        }
    })
    clazz.setGenerationContext(undefined)
}

export function printNativeModule(peerLibrary: PeerLibrary, nativeBridgePath: string): string {
    const lang = peerLibrary.declarationTable.language
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleDeclaration(visitor.nativeModule, nativeBridgePath, false, lang)
}

export function printNativeModuleEmpty(peerLibrary: PeerLibrary): string {
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleEmptyDeclaration(visitor.nativeModuleEmpty.getOutput())
}

function getReturnValue(type: Type): string {
    switch(type.name) {
        case Type.Boolean.name : return "false"
        case Type.Number.name: return "1"
        case Type.Pointer.name: return "-1"
        case "string": return `"some string"`
    }
    throw new Error(`Unknown return type: ${type.name}`)
}
