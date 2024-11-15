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
import { ArgConvertor, RetConvertor } from "../ArgConvertors";
import { PrimitiveType } from "../ArkPrimitiveType"
import { bridgeCcCustomDeclaration, bridgeCcGeneratedDeclaration } from "../FileGenerators";
import { createLanguageWriter, createTypeNameConvertor, ExpressionStatement, LanguageWriter } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";
import { Language } from "../../Language";
import { forceAsNamedNode, IDLBooleanType, IDLNumberType } from "../../idl";
import { getReferenceResolver } from "../ReferenceResolver";

class BridgeCcVisitor {
    readonly generatedApi = createLanguageWriter(Language.CPP, this.library)
    readonly customApi = createLanguageWriter(Language.CPP, this.library)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly callLog: boolean,
    ) {}

    protected generateApiCall(method: PeerMethod, modifierName?: string): string {
        // TODO: may be need some translation tables?
        let clazz = modifierName ?? dropSuffix(dropSuffix(dropSuffix(method.originalParentName, "Method"), "Attribute"), "Interface")
        return `get${capitalize(clazz)}${method.apiKind}()`
    }

    protected escapeKeyword(kw: string): string {
        return this.generatedApi.escapeKeyword(kw)
    }

    // TODO: may be this is another method of ArgConvertor?
    private generateApiArgument(argConvertor: ArgConvertor): string {
        const nameConverter = createTypeNameConvertor(Language.CPP, getReferenceResolver(this.library))
        const prefix = argConvertor.isPointerType() ? `(const ${nameConverter.convertType(argConvertor.nativeType())}*)&`: "    "
        if (argConvertor.useArray)
            return `${prefix}${this.escapeKeyword(argConvertor.param)}_value`
        else
            return `${argConvertor.convertorArg(this.escapeKeyword(argConvertor.param), this.generatedApi)}`
    }

    protected getApiCall(method: PeerMethod): string {
        return method.apiCall
    }

    protected printAPICall(method: PeerMethod, modifierName?: string) {
        const hasReceiver = method.hasReceiver()
        const argConvertors = method.argConvertors
        const isVoid = method.retConvertor.isVoid
        const modifier = this.generateApiCall(method, modifierName)
        const peerMethod = this.getPeerMethodName(method)
        const receiver = hasReceiver ? [this.getReceiverArgName()] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.generateApiArgument(it))).join(", ")
        const apiCall = this.getApiCall(method)
        const field = this.getApiCallResultField(method)
        const call = `${isVoid ? "" : "return "}${apiCall}->${modifier}->${peerMethod}(${args})${field};`
        if (this.callLog) this.printCallLog(method, apiCall, modifier)
        this.generatedApi.print(call)
    }

    protected getApiCallResultField(method: PeerMethod): string {
        return ""
    }

    protected getReceiverArgName(): string {
        return "self"
    }

    protected getPeerMethodName(method: PeerMethod): string {
        return method.peerMethodName
    }

    protected printReceiverCastCall(method: PeerMethod) {
        const receiverType = method.receiverType;
        const self = this.getReceiverArgName();
        this.generatedApi.print(`${receiverType} ${self} = reinterpret_cast<${receiverType}>(thisPtr);`)
    }

    private printNativeBody(method: PeerMethod, modifierName?: string) {
        this.generatedApi.pushIndent()
        if (method.hasReceiver()) {
            this.printReceiverCastCall(method)
        }
        let deserializerCreated = false
        method.argConvertors.forEach(it => {
            if (it.useArray) {
                if (!deserializerCreated) {
                    this.generatedApi.print(`Deserializer thisDeserializer(thisArray, thisLength);`)
                    deserializerCreated = true
                }
                let result = `${it.param}_value`
                this.generatedApi.writeStatement(it.convertorDeserialize(`${result}_buf`, `thisDeserializer`, (expr) => {
                    return new ExpressionStatement(this.generatedApi.makeString(
                        `${this.generatedApi.stringifyType(it.nativeType())} ${result} = ${expr.asString()};`
                    ))
                }, this.generatedApi))
            }
        })
        this.printAPICall(method, modifierName)
        this.generatedApi.popIndent()
    }

    private static varCnt : number = 0;

    private printCallLog(method: PeerMethod, api: string, modifier: string) {
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
            let ptrType = `const ${forceAsNamedNode(it.nativeType()).name}`
            this.generatedApi.print(`_logData.append("  ${ptrType} ${varNames[i]}_" + std::to_string(_num) + " = " + _tmp + ";\\n");`)
            BridgeCcVisitor.varCnt += 1
        }

        this.generatedApi.print(`_logData.append("  ${api}->${modifier}->${this.getPeerMethodName(method)}(");`)
        if (method.hasReceiver()) {
            this.generatedApi.print(`_logData.append("(${PrimitiveType.NativePointer})");`)
            this.generatedApi.print(`_logData.append("peer" + std::to_string((uintptr_t)thisPtr));`);
            if (method.argConvertors.length > 0)
                this.generatedApi.print(`_logData.append(", ");`)
        }
        method.argConvertors.forEach((it, index) => {
            const type = it.nativeType()
            if ('name' in type && type.name === "Number"
                && (it.idlType === IDLNumberType || it.idlType === IDLBooleanType)) {
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

    private generateCMacroSuffix(method: PeerMethod): string {
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

    private generateCParameters(method: PeerMethod, argConvertors: ArgConvertor[]): string[] {
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
                maybeReceiver.push(`${type} ${this.escapeKeyword(it.param)}`)
            }
        }
        return maybeReceiver
    }

    private printMethod(method: PeerMethod, modifierName?: string) {
        const retConvertor = method.retConvertor
        const argConvertors = method.argConvertors

        let cName = `${method.originalParentName}_${method.overloadedName}`
        let retValue: string | undefined = this.getRetValue(method, retConvertor)
        this.generatedApi.print(`${retValue} impl_${cName}(${this.generateCParameters(method, argConvertors).join(", ")}) {`)
        this.generatedApi.pushIndent()
        this.printNativeBody(method, modifierName)
        this.generatedApi.popIndent()
        this.generatedApi.print(`}`)
        retValue = retConvertor.isVoid ? undefined : retValue
        let macroArgs = [cName, retValue].concat(this.generateCParameterTypes(argConvertors, method.hasReceiver()))
            .filter(isDefined)
            .join(", ")
        const suffix = this.generateCMacroSuffix(method)
        this.generatedApi.print(`KOALA_INTEROP_${suffix}(${macroArgs})`)
        this.generatedApi.print(` `)
    }

    protected getRetValue(method: PeerMethod, retConvertor: RetConvertor): string | undefined {
        return retConvertor.interopType
            ? retConvertor.interopType()
            : retConvertor.nativeType();
    }

    /* 
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
                if (forceAsNamedNode(c.getArgType(it)).name !== forceAsNamedNode(type).name) {
                    castName = `${name}Cast`
                    const cast = forceAsNamedNode(it).name.endsWith("Enum") ? `${forceAsNamedNode(type).name}(${name})` : `(${forceAsNamedNode(type).name}) ${name}`
                    this.customApi.print(`${forceAsNamedNode(type).name} ${castName} = ${cast};`)
                }
                castNames = castNames.concat(castName)
            })
            const ret = sig.returnType === IDLVoidType ? "" : "return "
            this.customApi.print(`${ret}GetArkUI${c.apiName}()->${m.name}(${castNames.join(", ")});`)
        })
        const v = sig.returnType === IDLVoidType ? "V" : "";
        let args = c.withContext ? argsType.slice(1) : argsType
        const size = args.length
        args = sig.returnType === IDLVoidType ? args : [retType, ...args]
        const comma = args.length > 0 ? ", " : ""
        const CTX = c.withContext ? "_CTX" : ""
        this.customApi.print(`KOALA_INTEROP${CTX}_${v}${size}(${capitalizedName}${comma}${args.map(it => forceAsNamedNode(it).name).join(", ")})\n`)
    }
    */

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

        /* 
        this.customApi.print("\n// custom API methods\n")
        for(const customApi of CUSTOM_API) {
            for(const method of customApi.methods) {
                this.printCustomApiMethod(customApi, method)
            }
        }
        */
    }
}

// TODO commonize this piece of code
class OhosBridgeCcVisitor extends BridgeCcVisitor {
    protected generateApiCall(method: PeerMethod, modifierName?: string): string {
        // TODO: may be need some translation tables?
        let clazz = modifierName ?? dropSuffix(dropSuffix(dropSuffix(method.originalParentName, "Method"), "Attribute"), "Interface")
        return capitalize(clazz) + "()"
    }

    protected getApiCall(method: PeerMethod): string {
        const libName = this.library.name;
        return `Get${libName}APIImpl(${libName}_API_VERSION)`
    }


    protected getReceiverArgName(): string {
        return "thisPtr"
    }

    protected printReceiverCastCall(method: PeerMethod) {
        // OHOS API does not need to cast native pointer at this moment
    }

    protected getPeerMethodName(method: PeerMethod): string {
        switch (method.peerMethodName) {
            case "ctor": return "construct"
            case "getFinalizer": return "destruct"
            default: return method.peerMethodName
        }
    }

    protected printAPICall(method: PeerMethod, modifierName?: string) {
        if (method.peerMethodName == "getFinalizer") {
            const modifier = this.generateApiCall(method, modifierName)
            const peerMethod = this.getPeerMethodName(method)
            const apiCall = this.getApiCall(method)
            const call = `return (${PrimitiveType.NativePointer}) &${apiCall}->${modifier}->${peerMethod};`
            this.generatedApi.print(call)
        } else {
            super.printAPICall(method, modifierName)
        }
    }

    protected getApiCallResultField(method: PeerMethod): string {
        // TODO Remove this workaround for case when number is replaced with int32
        if (method.method.signature.returnType === IDLNumberType) {
            return ".i32"
        } else {
            return super.getApiCallResultField(method)
        }
        
    }
}

type BridgeCcApi = {
    generated: LanguageWriter;
    custom: LanguageWriter;
};

export function printBridgeCcForOHOS(peerLibrary: PeerLibrary): BridgeCcApi {
    const visitor = new OhosBridgeCcVisitor(peerLibrary, false)
    visitor.print()
    return { generated: visitor.generatedApi, custom: visitor.customApi }
}

export function printBridgeCc(peerLibrary: PeerLibrary, callLog: boolean): BridgeCcApi {
    const visitor = new BridgeCcVisitor(peerLibrary, callLog)
    visitor.print()
    return { generated: visitor.generatedApi, custom: visitor.customApi }
}

export function printBridgeCcGenerated(peerLibrary: PeerLibrary, callLog: boolean): string {
    const { generated } = printBridgeCc(peerLibrary, callLog)
    return bridgeCcGeneratedDeclaration(generated.getOutput())
}

export function printBridgeCcCustom(peerLibrary: PeerLibrary, callLog: boolean): string {
    const { custom } = printBridgeCc(peerLibrary, callLog)
    return bridgeCcCustomDeclaration(custom.getOutput())
}