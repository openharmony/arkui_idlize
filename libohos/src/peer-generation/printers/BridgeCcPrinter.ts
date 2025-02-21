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

import {
    capitalize,
    dropSuffix,
    generatorTypePrefix,
    isDefined,
    Language,
    PeerMethod,
    createConstructPeerMethod,
    ArgConvertor,
    MaterializedClass,
    PeerLibrary,
    LanguageWriter,
    InteropReturnTypeConvertor,
    CppInteropArgConvertor,
    CppReturnTypeConvertor,
    PrimitiveTypesInstance,
} from "@idlizer/core";
import * as idl from "@idlizer/core";
import { bridgeCcCustomDeclaration, bridgeCcGeneratedDeclaration } from "../FileGenerators";
import { ExpressionStatement } from "../LanguageWriters";
import { forceAsNamedNode, IDLBooleanType, IDLNumberType, IDLVoidType } from '@idlizer/core/idl'

export class BridgeCcVisitor {
    readonly generatedApi = this.library.createLanguageWriter(Language.CPP)
    readonly customApi = this.library.createLanguageWriter(Language.CPP)
    private readonly returnTypeConvertor = new BridgeReturnTypeConvertor(this.library)

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
        const nameConverter = this.library.createTypeNameConvertor(Language.CPP)
        const prefix = argConvertor.isPointerType() ? `(const ${nameConverter.convert(argConvertor.nativeType())}*)&`: "    "
        if (argConvertor.useArray)
            return `${prefix}${this.escapeKeyword(argConvertor.param)}_value`
        else
            return `${argConvertor.convertorArg(this.escapeKeyword(argConvertor.param), this.generatedApi)}`
    }

    protected getApiCall(method: PeerMethod): string {
        return method.apiCall
    }

    protected printAPICall(method: PeerMethod, modifierName?: string) {
        const argAndOutConvertors = method.argAndOutConvertors
        const isVoid = this.returnTypeConvertor.isVoid(method)
        const modifier = this.generateApiCall(method, modifierName)
        const peerMethod = this.getPeerMethodName(method)
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = argAndOutConvertors.map(it => this.generateApiArgument(it))
        if (method.hasReceiver())
            args.unshift(this.getReceiverArgName())
        if (method.method.modifiers?.includes(idl.MethodModifier.THROWS))
            args.unshift(`reinterpret_cast<${generatorTypePrefix()}VMContext>(vmContext)`)
        const apiCall = this.getApiCall(method)
        const field = this.getApiCallResultField(method)
        // TODO: It is necessary to implement value passing to vm
        const peerMethodCall = `${apiCall}->${modifier}->${peerMethod}(${args.join(", ")})${field}`
        if (idl.isCallback(this.library.toDeclaration(method.returnType))
            || idl.IDLContainerUtils.isSequence(method.returnType)) {
            const statements = [
                `[[maybe_unused]] const auto &value = ${peerMethodCall};`,
                `// TODO: Value serialization needs to be implemented`,
                `return {};`
            ]
            statements.forEach(it => this.generatedApi.print(it))
        } else {
            if (this.returnTypeConvertor.isReturnInteropBuffer(method.returnType)) {
                this.generatedApi.print(`const auto &retValue = ${peerMethodCall};`)
                this.generatedApi.print(`Serializer _retSerializer {};`)
                const convertor = this.library.typeConvertor('retValue', method.returnType, false)
                convertor.convertorSerialize('_ret', 'retValue', this.generatedApi)
                this.generatedApi.writeStatement(
                    this.generatedApi.makeReturn(
                        this.generatedApi.makeMethodCall('_retSerializer', 'toReturnBuffer', [])
                    )
                )
            } else {
                if (isVoid) {
                    this.generatedApi.print(`${peerMethodCall};`)
                } else {
                    this.generatedApi.print(`return ${peerMethodCall};`)
                }
            }
        }
        if (this.callLog) this.printCallLog(method, apiCall, modifier)
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
        method.argAndOutConvertors.forEach(it => {
            if (it.useArray) {
                if (!deserializerCreated) {
                    this.generatedApi.print(`Deserializer thisDeserializer(thisArray, thisLength);`)
                    deserializerCreated = true
                }
                let result = `${it.param}_value`
                this.generatedApi.writeStatement(it.convertorDeserialize(`${result}_buf`, `thisDeserializer`, (expr) => {
                    return new ExpressionStatement(this.generatedApi.makeString(
                        `${this.generatedApi.getNodeName(it.nativeType())} ${result} = ${expr.asString()};`
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
        for (let i = 0; i < method.argAndOutConvertors.length; ++i) {
            let it = method.argAndOutConvertors[i]
            let name = this.generateApiArgument(it) // it.param + '_value'
            this.generatedApi.print(`_tmp = "", WriteToString(&_tmp, ${name});`)
            varNames.push(`var${BridgeCcVisitor.varCnt}`)
            let ptrType = `const ${forceAsNamedNode(it.nativeType()).name}`
            this.generatedApi.print(`_logData.append("  ${ptrType} ${varNames[i]}_" + std::to_string(_num) + " = " + _tmp + ";\\n");`)
            BridgeCcVisitor.varCnt += 1
        }

        this.generatedApi.print(`_logData.append("  ${api}->${modifier}->${this.getPeerMethodName(method)}(");`)
        if (method.hasReceiver()) {
            this.generatedApi.print(`_logData.append("(${PrimitiveTypesInstance.NativePointer})");`)
            this.generatedApi.print(`_logData.append("peer" + std::to_string((uintptr_t)thisPtr));`);
            if (method.argAndOutConvertors.length > 0)
                this.generatedApi.print(`_logData.append(", ");`)
        }
        method.argAndOutConvertors.forEach((it, index) => {
            const type = it.nativeType()
            if (type === IDLNumberType && (it.idlType === IDLNumberType || it.idlType === IDLBooleanType)) {
                this.generatedApi.print(`_logData.append("${varNames[index]}_" + std::to_string(_num));`)
            } else {
                this.generatedApi.print(`_logData.append("&${varNames[index]}_" + std::to_string(_num));`)
            }
            if (index < method.argAndOutConvertors.length - 1)
                this.generatedApi.print(`_logData.append(", ");`)
        })
        this.generatedApi.print("_num += 1;")
        this.generatedApi.print(`_logData.append(");\\n");`)
        this.generatedApi.print(`appendGroupedLog(2, _logData);`)
        this.generatedApi.popIndent()
        this.generatedApi.print(`}`)
    }

    private generateCMacroSuffix(method: PeerMethod): string {
        let argumentsCount = method.hasReceiver() ? 1 : 0
        let arrayAdded = false
        method.argAndOutConvertors.forEach(it => {
            if (it.useArray) {
                if (!arrayAdded) {
                    argumentsCount += 2
                    arrayAdded = true
                }
            } else {
                argumentsCount += 1
            }
        })
        const ctxSuffix = method.method.modifiers?.includes(idl.MethodModifier.THROWS) ? 'CTX_' : ''
        const voidSuffix = this.returnTypeConvertor.isVoid(method) ? 'V' : ''
        return `${ctxSuffix}${voidSuffix}${argumentsCount}`
    }

    private generateCParameters(method: PeerMethod): [string, string][] {
        const maybeReceiver: [string, string][] = method.hasReceiver()
            ? [[PrimitiveTypesInstance.NativePointer.getText(), "thisPtr"]] : []
        let ptrCreated = false;
        method.argAndOutConvertors.forEach(it => {
            if (it.useArray) {
                if (!ptrCreated) {
                    maybeReceiver.push(["uint8_t*", "thisArray"], ["int32_t", "thisLength"])
                    ptrCreated = true
                }
            } else {
                let typeName = CppInteropArgConvertor.INSTANCE.convert(it.interopType())
                maybeReceiver.push([typeName, this.escapeKeyword(it.param)])
            }
        })
        return maybeReceiver
    }

    // stub
    private mapToKTypes(type:idl.IDLType): string | undefined {
        switch (type) {
            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLNumberType: return 'KInteropNumber'
        }
        return undefined
    }

    protected printMethod(method: PeerMethod, modifierName?: string) {
        const cName = `${method.originalParentName}_${method.overloadedName}`
        const retType = this.returnTypeConvertor.convert(method.returnType)
        const argTypesAndNames = this.generateCParameters(method);
        const argDecls = argTypesAndNames.map(([type, name]) =>
            type === "KStringPtr" || type === "KLength" ? `const ${type}& ${name}` : `${type} ${name}`)
        if (method.method.modifiers?.includes(idl.MethodModifier.THROWS))
            argDecls.unshift("KVMContext vmContext")
        this.generatedApi.print(`${retType} impl_${cName}(${argDecls.join(", ")}) {`)
        this.generatedApi.pushIndent()
        this.printNativeBody(method, modifierName)
        this.generatedApi.popIndent()
        this.generatedApi.print(`}`)
        const macroRetType = this.mapToKTypes(method.returnType) ?? retType
        let macroArgs = [cName, retType === IDLVoidType.name ? undefined : macroRetType]
            .concat(argTypesAndNames.map(([type, _]) => type))
            .filter(isDefined)
            .join(", ")
        const suffix = this.generateCMacroSuffix(method)
        this.generatedApi.print(`KOALA_INTEROP_${suffix}(${macroArgs})`)
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
                for (const method of [createConstructPeerMethod(peer)].concat(peer.methods)) {
                    this.printMethod(method, peer.componentName)
                }
            }
        }

        this.generatedApi.print("\n// Accessors\n")
        for (const clazz of this.library.materializedToGenerate) {
            this.printMaterializedClass(clazz);
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

    protected printMaterializedClass(clazz: MaterializedClass) {
        for (const method of [clazz.ctor, clazz.finalizer].concat(clazz.methods)) {
            if (!method) continue
            this.printMethod(method)
        }
    }
}

export type BridgeCcApi = {
    generated: LanguageWriter;
    custom: LanguageWriter;
};

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

class BridgeReturnTypeConvertor extends InteropReturnTypeConvertor {
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (this.resolver != undefined && idl.isCallback(this.resolver.toDeclaration(type))) {
            return PrimitiveTypesInstance.NativePointer.getText()
        }
        return super.convertTypeReference(type)
    }

    convertContainer(type: idl.IDLContainerType): string {
        const retType = super.convertContainer(type)
        if (idl.IDLContainerUtils.isSequence(type)) {
            return PrimitiveTypesInstance.NativePointer.getText()
        }
        return retType
    }
}