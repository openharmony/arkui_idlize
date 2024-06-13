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
import { createLanguageWriter, Method, NamedMethodSignature, Type } from "./LanguageWriters";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";
import { CUSTOM_API, CustomAPI } from "./CustomAPI"

//const VM_CONTEXT_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_VMContext`)

class BridgeCcVisitor {
    readonly C = createLanguageWriter(Language.CPP)

    constructor(
        private readonly library: PeerLibrary,
        private readonly callLog: boolean,
    ) {}

    private generateApiCall(method: PeerMethod): string {
        // TODO: may be need some translation tables?
        let clazz = dropSuffix(dropSuffix(dropSuffix(method.originalParentName, "Method"), "Attribute"), "Interface")
        return `get${capitalize(clazz)}${method.apiKind}()`
    }

    // TODO: may be this is another method of ArgConvertor?
    private generateApiArgument(argConvertor: ArgConvertor): string {
        const prefix = argConvertor.isPointerType() ? `(const ${argConvertor.nativeType(false)}*)&`: "    "
        if (argConvertor.useArray)
            return `${prefix}${argConvertor.param}_value`
        else
            return `${argConvertor.convertorArg(argConvertor.param, this.C)}`
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
        const call = `${isVoid ? "" : "return "}${method.apiCall}->${modifier}->${peerMethod}(${args});`
        if (this.callLog) this.printCallLog(method, method.apiCall, modifier)
        this.C.print(call)
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
                this.C.writeStatement(it.convertorDeserialize(it.param, result, this.C))
            }
        })
        this.printAPICall(method)
        this.C.popIndent()
    }

    private printCallLog(method: PeerMethod, api: string, modifier: string) {
        this.C.print(`if (needGroupedLog(2)) {`)
        this.C.pushIndent()

        this.C.print(`std::string _logData("  ${api}->${modifier}->${method.peerMethodName}(");`)
        if (method.hasReceiver()) {
            this.C.print(`WriteToString(&_logData, thisPtr);`)
            if (method.argConvertors.length > 0)
                this.C.print(`_logData.append(", ");`)
        }
        method.argConvertors.forEach((it, index) => {
            this.C.print(`WriteToString(&_logData, ${this.generateApiArgument(it)});`)
            if (index < method.argConvertors.length - 1)
                this.C.print(`_logData.append(", ");`)
        })
        this.C.print(`_logData.append(");\\n");`)
        this.C.print(`appendGroupedLog(2, _logData);`)
        this.C.popIndent()
        this.C.print(`}`)
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
                switch (type) {
                    case "KStringPtr":
                        type = `const KStringPtr&`
                        break
                    case "KLength":
                        type = `const KLength&`
                        break
                }
                return `${type} ${it.param}`
            }
        })))
    }

    private printMethod(method: PeerMethod) {
        const retConvertor = method.retConvertor
        const argConvertors = method.argConvertors

        let cName = `${method.originalParentName}_${method.overloadedName}`
        let rv = retConvertor.nativeType()
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

    printCustomApiMethod(c: CustomAPI, m: Method) {
        const sig = m.signature as NamedMethodSignature
        const capitalizedName = capitalize(m.name)
        const retType = c.getArgType(sig.returnType)
        const argsType =sig.args.map(it => c.getArgType(it))
        const method = new Method(`impl_${capitalizedName}`, new NamedMethodSignature(
            retType, argsType, sig.argsNames))

        this.C.writeMethodImplementation(method, writer => {
            let castNames: string[] = []
            sig.args.forEach((it, index) => {
                const type = c.getCastType(it)
                const name = sig.argsNames[index];
                let castName = name
                if (c.getArgType(it).name !== type.name) {
                    castName = `${name}Cast`
                    const convert = it.name.endsWith("Enum") ? `${type.name}` : `reinterpret_cast<${type.name}>`
                    this.C.print(`${type.name} ${castName} = ${convert}(${name});`)
                }
                castNames = castNames.concat(castName)
            })
            const ret = sig.returnType === Type.Void ? "" : "return "
            this.C.print(`${ret}GetArkUI${c.apiName}()->${m.name}(${castNames.join(", ")});`)
        })
        const v = sig.returnType === Type.Void ? "V" : "";
        let args = c.withContext ? argsType.slice(1) : argsType
        const size = args.length
        args = sig.returnType === Type.Void ? args : [retType, ...args]
        const comma = args.length > 0 ? ", " : ""
        const CTX = c.withContext ? "_CTX" : ""
        this.C.print(`KOALA_INTEROP${CTX}_${v}${size}(${capitalizedName}${comma}${args.map(it => it.name).join(", ")})\n`)
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
        for (const clazz of this.library.materializedClasses.values()) {
            for (const method of [clazz.ctor, clazz.finalizer].concat(clazz.methods)) {
                this.printMethod(method)
            }
        }

        this.C.print("\n// custom API methods\n")
        for(const customApi of CUSTOM_API) {
            for(const method of customApi.methods) {
                this.printCustomApiMethod(customApi, method)
            }
        }
    }
}

export function printBridgeCc(peerLibrary: PeerLibrary, callLog: boolean): string {
    const visitor = new BridgeCcVisitor(peerLibrary, callLog)
    visitor.print()
    return bridgeCcDeclaration(visitor.C.getOutput())
}