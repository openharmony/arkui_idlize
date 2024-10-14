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

import { capitalize, dropSuffix, isDefined } from "../../util";
import { EnumConvertor} from "../Convertors";
import { ArgConvertor } from "../ArgConvertors";
import { PrimitiveType } from "../ArkPrimitiveType"
import { bridgeCcCustomDeclaration, bridgeCcGeneratedDeclaration } from "../FileGenerators";
import { createLanguageWriter, Method, NamedMethodSignature, Type } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";
import { CUSTOM_API, CustomAPI } from "../CustomAPI"
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { IdlPeerMethod } from "../idl/IdlPeerMethod";
import { Language } from "../../Language";

//const VM_CONTEXT_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_VMContext`)

class BridgeCcVisitor {
    readonly generatedApi = createLanguageWriter(Language.CPP)
    readonly customApi = createLanguageWriter(Language.CPP)

    constructor(
        private readonly library: PeerLibrary | IdlPeerLibrary,
        private readonly callLog: boolean,
    ) {}

    private generateApiCall(method: PeerMethod | IdlPeerMethod, modifierName?: string): string {
        // TODO: may be need some translation tables?
        let clazz = modifierName ?? dropSuffix(dropSuffix(dropSuffix(method.originalParentName, "Method"), "Attribute"), "Interface")
        return `get${capitalize(clazz)}${method.apiKind}()`
    }

    // TODO: may be this is another method of ArgConvertor?
    private generateApiArgument(argConvertor: ArgConvertor): string {
        const prefix = argConvertor.isPointerType() ? `(const ${argConvertor.nativeType(false)}*)&`: "    "
        if (argConvertor.useArray)
            return `${prefix}${argConvertor.param}_value`
        else
            return `${argConvertor.convertorArg(argConvertor.param, this.generatedApi)}`
    }

    private printAPICall(method: PeerMethod | IdlPeerMethod, modifierName?: string) {
        const hasReceiver = method.hasReceiver()
        const argConvertors = method.argConvertors
        const isVoid = method.retConvertor.isVoid
        const modifier = this.generateApiCall(method, modifierName)
        const peerMethod = method.peerMethodName
        const receiver = hasReceiver ? ['self'] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.generateApiArgument(it))).join(", ")
        const call = `${isVoid ? "" : "return "}${method.apiCall}->${modifier}->${peerMethod}(${args});`
        if (this.callLog) this.printCallLog(method, method.apiCall, modifier)
        this.generatedApi.print(call)
    }

    private printNativeBody(method: PeerMethod | IdlPeerMethod, modifierName?: string) {
        this.generatedApi.pushIndent()
        if (method.hasReceiver()) {
            this.generatedApi.print(`${method.receiverType} self = reinterpret_cast<${method.receiverType}>(thisPtr);`)
        }
        let deserializerCreated = false
        method.argConvertors.forEach(it => {
            if (it.useArray) {
                if (!deserializerCreated) {
                    this.generatedApi.print(`Deserializer thisDeserializer(thisArray, thisLength);`)
                    deserializerCreated = true
                }
                let result = `${it.param}_value`
                this.generatedApi.print(`${it.nativeType(false)} ${result};`)
                this.generatedApi.writeStatement(it.convertorDeserialize(`this`, result, this.generatedApi))
            }
        })
        this.printAPICall(method, modifierName)
        this.generatedApi.popIndent()
    }

    private static varCnt : number = 0;

    private printCallLog(method: PeerMethod | IdlPeerMethod, api: string, modifier: string) {
        this.generatedApi.print(`if (needGroupedLog(2)) {`)
        this.generatedApi.pushIndent()
        this.generatedApi.print('std::string _logData;')
        this.generatedApi.print('std::string _tmp;')
        this.generatedApi.print('static int _num = 0;')
        let varNames : string[] = new Array<string>()
        for (let i = 0; i < method.argConvertors.length; ++i) {
            let it = method.argConvertors[i]
            let name = this.generateApiArgument(it) // it.param + '_value'
            this.generatedApi.print(`_tmp = "", WriteToString(&_tmp, ${name});`)
            varNames.push(`var${BridgeCcVisitor.varCnt}`)
            let ptrType = it instanceof EnumConvertor ? `const ${it.nativeType(false).replace("enum ", "")}` : `const ${it.nativeType(false)}`
            this.generatedApi.print(`_logData.append("  ${ptrType} ${varNames[i]}_" + std::to_string(_num) + " = " + _tmp + ";\\n");`)
            BridgeCcVisitor.varCnt += 1
        }

        this.generatedApi.print(`_logData.append("  ${api}->${modifier}->${method.peerMethodName}(");`)
        if (method.hasReceiver()) {
            this.generatedApi.print(`_logData.append("(Ark_NativePointer)");`)
            this.generatedApi.print(`_logData.append("peer" + std::to_string((uintptr_t)thisPtr));`);
            if (method.argConvertors.length > 0)
                this.generatedApi.print(`_logData.append(", ");`)
        }
        method.argConvertors.forEach((it, index) => {
            if (it.nativeType(false) != "Ark_Number"
                && (it.tsTypeName == "number" || it.tsTypeName == "boolean")) {
                this.generatedApi.print(`_logData.append("${varNames[index]}_" + std::to_string(_num));`)
            } else {
                this.generatedApi.print(`_logData.append("&${varNames[index]}_" + std::to_string(_num));`)
            }
            if (index < method.argConvertors.length - 1)
                this.generatedApi.print(`_logData.append(", ");`)
        })
        this.generatedApi.print("_num += 1;")
        this.generatedApi.print(`_logData.append(");\\n");`)
        this.generatedApi.print(`appendGroupedLog(2, _logData);`)
        this.generatedApi.popIndent()
        this.generatedApi.print(`}`)
    }

    private generateCParameterTypes(argConvertors: ArgConvertor[], hasReceiver: boolean): string[] {
        const receiver = hasReceiver ? [PrimitiveType.NativePointer.getText()] : []
        let ptrCreated = false;
        for (let i = 0; i < argConvertors.length; ++i) {
            let it = argConvertors[i]
            if (it.useArray) {
                if (!ptrCreated) {
                    receiver.push(`uint8_t*, int32_t`)
                    ptrCreated = true
                }
            } else {
                receiver.push(it.interopType(this.generatedApi.language))
            }
        }
        return receiver
    }

    private generateCMacroSuffix(method: PeerMethod | IdlPeerMethod): string {
        let counter = method.hasReceiver() ? 1 : 0
        let arrayAdded = false
        method.argConvertors.forEach(it => {
            if (it.useArray) {
                if (!arrayAdded) {
                    counter += 2
                    arrayAdded = true
                }
            } else {
                counter += 1
            }
        })
        return `${method.retConvertor.macroSuffixPart()}${counter}`
    }

    private generateCParameters(method: PeerMethod | IdlPeerMethod, argConvertors: ArgConvertor[]): string[] {
        let maybeReceiver = method.hasReceiver() ? [`${PrimitiveType.NativePointer.getText()} thisPtr`] : []
        let ptrCreated = false;
        for (let i = 0; i < argConvertors.length; ++i) {
            let it = argConvertors[i]
            if (it.useArray) {
                if (!ptrCreated) {
                    maybeReceiver.push(`uint8_t* thisArray, int32_t thisLength`)
                    ptrCreated = true
                }
            } else {
                let type = it.interopType(this.generatedApi.language)
                switch (type) {
                    case "KStringPtr":
                        type = `const KStringPtr&`
                        break
                    case "KLength":
                        type = `const KLength&`
                        break
                }
                maybeReceiver.push(`${type} ${it.param}`)
            }
        }
        return maybeReceiver
    }

    private printMethod(method: PeerMethod | IdlPeerMethod, modifierName?: string) {
        const retConvertor = method.retConvertor
        const argConvertors = method.argConvertors

        let cName = `${method.originalParentName}_${method.overloadedName}`
        let rv = retConvertor.nativeType()
        this.generatedApi.print(`${retConvertor.nativeType()} impl_${cName}(${this.generateCParameters(method, argConvertors).join(", ")}) {`)
        this.generatedApi.pushIndent()
        this.printNativeBody(method, modifierName)
        this.generatedApi.popIndent()
        this.generatedApi.print(`}`)
        let macroArgs = [cName, method.maybeCRetType(retConvertor)].concat(this.generateCParameterTypes(argConvertors, method.hasReceiver()))
            .filter(isDefined)
            .join(", ")
        const suffix = this.generateCMacroSuffix(method)
        this.generatedApi.print(`KOALA_INTEROP_${suffix}(${macroArgs})`)
        this.generatedApi.print(` `)
    }

    printCustomApiMethod(c: CustomAPI, m: Method) {
        const sig = m.signature as NamedMethodSignature
        const capitalizedName = capitalize(m.name)
        const retType = c.getArgType(sig.returnType)
        const argsType =sig.args.map(it => c.getArgType(it))
        const method = new Method(`impl_${capitalizedName}`, new NamedMethodSignature(
            retType, argsType, sig.argsNames))

        this.customApi.writeMethodImplementation(method, writer => {
            let castNames: string[] = []
            sig.args.forEach((it, index) => {
                const type = c.getCastType(it)
                const name = sig.argsNames[index];
                let castName = name
                if (c.getArgType(it).name !== type.name) {
                    castName = `${name}Cast`
                    const cast = it.name.endsWith("Enum") ? `${type.name}(${name})` : `(${type.name}) ${name}`
                    this.customApi.print(`${type.name} ${castName} = ${cast};`)
                }
                castNames = castNames.concat(castName)
            })
            const ret = sig.returnType === Type.Void ? "" : "return "
            this.customApi.print(`${ret}GetArkUI${c.apiName}()->${m.name}(${castNames.join(", ")});`)
        })
        const v = sig.returnType === Type.Void ? "V" : "";
        let args = c.withContext ? argsType.slice(1) : argsType
        const size = args.length
        args = sig.returnType === Type.Void ? args : [retType, ...args]
        const comma = args.length > 0 ? ", " : ""
        const CTX = c.withContext ? "_CTX" : ""
        this.customApi.print(`KOALA_INTEROP${CTX}_${v}${size}(${capitalizedName}${comma}${args.map(it => it.name).join(", ")})\n`)
    }

    print(): void {
        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                for (const method of peer.methods) {
                    this.printMethod(method, peer.componentName)
                }
            }
        }

        this.generatedApi.print("\n// Accessors\n")
        for (const clazz of this.library.materializedToGenerate) {
            for (const method of [clazz.ctor, clazz.finalizer].concat(clazz.methods)) {
                this.printMethod(method)
            }
        }

        this.customApi.print("\n// custom API methods\n")
        for(const customApi of CUSTOM_API) {
            for(const method of customApi.methods) {
                this.printCustomApiMethod(customApi, method)
            }
        }
    }
}

export function printBridgeCcGenerated(peerLibrary: PeerLibrary | IdlPeerLibrary, callLog: boolean): string {
    const visitor = new BridgeCcVisitor(peerLibrary, callLog)
    visitor.print()
    return bridgeCcGeneratedDeclaration(visitor.generatedApi.getOutput())
}

export function printBridgeCcCustom(peerLibrary: PeerLibrary | IdlPeerLibrary, callLog: boolean): string {
    const visitor = new BridgeCcVisitor(peerLibrary, callLog)
    visitor.print()
    return bridgeCcCustomDeclaration(visitor.customApi.getOutput())
}