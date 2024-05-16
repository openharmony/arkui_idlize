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
import { Language, capitalize, dropSuffix, isDefined } from "../util";
import { ArgConvertor } from "./Convertors";
import { PrimitiveType } from "./DeclarationTable";
import { bridgeCcDeclaration } from "./FileGenerators";
import { createLanguageWriter } from "./LanguageWriters";
import { Materialized, MaterializedMethod } from "./Materialized";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";

class BridgeCcVisitor {
    readonly C = createLanguageWriter(new IndentedPrinter(), Language.CPP)

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private generateApiCall(method: PeerMethod): string {
        // TODO: may be need some translation tables?
        let clazz = dropSuffix(dropSuffix(dropSuffix(method.originalParentName, "Method"), "Attribute"), "Interface")
        return `get${capitalize(clazz)}${method.apiKind}()`
    }

    // TODO: may be this is another method of ArgConvertor?
    private generateApiArgument(argConvertor: ArgConvertor): string {
        const prefix = argConvertor.isPointerType() ? "&": "    "
        if (argConvertor.useArray) return `${prefix}${argConvertor.param}_value`
        return `${argConvertor.convertorArg(argConvertor.param, this.C.language)}`
    }

    private printAPICall(method: PeerMethod) {
        const hasReceiver = method.hasReceiver()
        const argConvertors = method.argConvertors
        const isVoid = method.retConvertor.isVoid
        const modifier = this.generateApiCall(method)
        const peerMethod = method.peerMethodName
        const receiver = hasReceiver ? ['self'] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.generateApiArgument(it))).join(", ")
        this.C.print(`${isVoid ? "" : "return "}${method.apiCall}->${modifier}->${peerMethod}(${args});`)
    }

    private printNativeBody(method: PeerMethod) {
        this.C.pushIndent()
        if (method.hasReceiver()) {
            this.C.print(`${method.receiverType} self = reinterpret_cast<${method.receiverType}>(thisPtr);`)
        }
        method.argConvertors.forEach(it => {
            if (it.useArray) {
                this.C.print(`Deserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                let result = `${it.param}_value`
                this.C.print(`${it.nativeType(false)} ${result};`)
                it.convertorDeserialize(it.param, result, this.C)
            }
        })
        this.printAPICall(method)
        this.C.popIndent()
    }

    private generateCParameterTypes(argConvertors: ArgConvertor[], hasReceiver: boolean): string[] {
        const receiver = hasReceiver ? [PrimitiveType.NativePointer.getText()] : []
        return receiver.concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t*, int32_t`
            } else {
                return it.interopType(this.C.language)
            }
        }))
    }

    private generateCMacroSuffix(method: PeerMethod): string {
        let counter = method.hasReceiver() ? 1 : 0
        method.argConvertors.forEach(it => {
            if (it.useArray) {
                counter += 2
            } else {
                counter += 1
            }
        })
        return `${method.retConvertor.macroSuffixPart()}${counter}`
    }

    private generateCParameters(method: PeerMethod, argConvertors: ArgConvertor[]): string[] {
        let maybeReceiver = method.hasReceiver() ? [`${PrimitiveType.NativePointer.getText()} thisPtr`] : []
        return (maybeReceiver.concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t* ${it.param}Array, int32_t ${it.param}Length`
            } else {
                let type = it.interopType(this.C.language)
                return `${type == "KStringPtr" ? "const KStringPtr&" : type} ${it.param}`
            }
        })))
    }

    private printMethod(method: PeerMethod) {
        const retConvertor = method.retConvertor
        const argConvertors = method.argConvertors

        let cName = `${method.originalParentName}_${method.overloadedName}`
        this.C.print(`${retConvertor.nativeType()} impl_${cName}(${this.generateCParameters(method, argConvertors).join(", ")}) {`)
        this.C.pushIndent()
        this.printNativeBody(method)
        this.C.popIndent()
        this.C.print(`}`)
        let macroArgs = [cName, method.maybeCRetType(retConvertor)].concat(this.generateCParameterTypes(argConvertors, method.hasReceiver()))
            .filter(isDefined)
            .join(", ")
        const suffix = this.generateCMacroSuffix(method)
        this.C.print(`KOALA_INTEROP_${suffix}(${macroArgs})`)
        this.C.print(` `)
    }

    print(): void {
        for (const file of this.library.files) {
            for (const peer of file.peers.values()) {
                for (const method of peer.methods) {
                    this.printMethod(method)
                }
            }
        }

        this.C.print("\n// Accessors\n")
        for (const clazz of Materialized.Instance.materializedClasses.values()) {
            for (const method of [clazz.ctor, clazz.dtor].concat(clazz.methods)) {
                this.printMethod(method)
            }
        }
    }
}

export function printBridgeCc(peerLibrary: PeerLibrary): string {
    const visitor = new BridgeCcVisitor(peerLibrary)
    visitor.print()
    return bridgeCcDeclaration(visitor.C.getOutput())
}