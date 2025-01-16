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
    IDLContainerUtils,
    IDLKind,
    IDLMethod,
    Language,
    throwException
} from "@idlize/core"
import {
    IDLEntry,
    IDLInterface,
    IDLType,
    isInterface,
    isEnum,
    IDLPointerType,
    IDLI32Type,
} from "@idlize/core/idl"
// TODO: need language writers extracted to @idl/core :-()
// import { MethodSignature, createLanguageWriter } from "../../src/peer-generation/LanguageWriters"
import { LibarktsConfig } from "./LibarktsGenerator"
import { IDLParameter, IndentedPrinter } from "@idlize/core"
import { convertType } from "@idlize/core"
import { NativeTypeConvertor } from "./NativeTypeConvertor"
import { IDLFile } from "./Es2PandaTransformer"


export class NativeModulePrinter {
    constructor(
        private idl: IDLFile
    ) { }

    // private writer = createLanguageWriter(Language.TS, createEmptyReferenceResolver())
    private printer = new IndentedPrinter()
    private convertor = new NativeTypeConvertor(this.idl.entries)

    print(): string {
        // this.writer.writeInterface(
        //     LibarktsConfig.nativeModuleName,
        //     _ => {
        //         this.printInterfaceContents()
        //     }
        // )
        // return this.writer.printer.getOutput().join('\n')

        this.printer.print(`export interface ${LibarktsConfig.nativeModuleName} {`)
        this.printer.withIndent(() => {
            this.idl.entries.forEach(it => this.visit(it))
        })
        this.printer.print(`}`)
        return this.printer.getOutput().join('\n')
    }

    printInterfaceContents() {
        this.idl.entries.forEach(it => this.visit(it))
    }

    private visit(node: IDLEntry): void {
        console.log(node.name)
        if (isInterface(node)) return this.visitInterface(node)
        if (isEnum(node)) return

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private visitInterface(node: IDLInterface): void {
        node.methods.forEach(it =>
            this.printMethod(node, it)
        )
    }

    private convertType(type: IDLType): IDLType[] {
        return [type]
    }

    private convertReturnType(type: IDLType): IDLType {
        // if (IDLContainerUtils.isSequence(type))
        //     return IDLPointerType
        // else
        return type
    }

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    private printMethod(iface: IDLInterface, method: IDLMethod): void {
        const parameterTypes: IDLType[] = []

        parameterTypes.push(IDLPointerType) // Context
        parameterTypes.push(...method.parameters.map(it => this.convertType(it.type)).flat()) // proper parameters

        if (IDLContainerUtils.isSequence(method.returnType)) {
            parameterTypes.push(IDLI32Type)
        }

        // const adjustedSignature = new MethodSignature(
        //     this.convertReturnType(method.returnType),
        //     parameterTypes,
        //     [],
        //     undefined
        // )

        // this.writer.writeMethodDeclaration(
        //     LibarktsConfig.nativeModuleFunction(LibarktsConfig.methodFunction(iface.name, method.name)),
        //     adjustedSignature
        // )

        this.printer.print(this.printFunction(iface.name, method.name, parameterTypes, method.returnType))
    }

    printFunction(ifaceName: string, methodName: string, parameterTypes: IDLType[], returnType: IDLType) {
        const name = LibarktsConfig.nativeModuleFunction(LibarktsConfig.methodFunction(ifaceName, methodName))
        const parameters = parameterTypes.map((it, index) => this.printParameter(it, index)).join(", ")
        const retType = this.mapType(returnType)
        return `${name}(${parameters}): ${retType}`
    }

    printParameter(parameter: IDLType, index: number): string {
        return `arg${index}: ${this.mapType(parameter)}`
    }
}
