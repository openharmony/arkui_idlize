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
    IDLContainerType,
    IDLContainerUtils,
    IDLKind,
    IDLMethod,
    IDLReferenceType,
    IndentedPrinter,
    isTypedef,
    throwException
} from "@idlize/core"
import {
    IDLEntry,
    IDLInterface,
    IDLParameter,
    IDLType,
    isInterface,
    isContainerType,
    isEnum,
    isPrimitiveType,
    isReferenceType,
} from "@idlize/core/idl"
import { NativeTypeConvertor } from "./NativeTypeConvertor"
import { convertType } from "@idlize/core"
import { IDLFile } from "./Es2PandaTransformer"
import { Config } from "./Config"

export class BridgesPrinter {
    constructor(
        private idl: IDLFile,
        private config: Config
    ) { }

    private printer = new IndentedPrinter()
    private convertor = new NativeTypeConvertor(this.idl.entries)

    print(): string {
        this.idl.entries.forEach(it => this.visit(it))
        return this.printer.getOutput().join('\n')
    }

    private visit(node: IDLEntry): void {
        console.log(node.name)
        if (isInterface(node)) return this.visitInterface(node)
        if (isEnum(node)) return
        if (isTypedef(node)) return

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private visitInterface(node: IDLInterface): void {
        if (!this.config.shouldEmit(node.name)) return
        node.methods
            .filter(it => !this.config.paramArray(`handwrittenMethods`).includes(it.name))
            .forEach(it => this.printMethod(node.name, it))
    }

    private printParameters(parameters: IDLParameter[]): void {
        parameters.forEach((it, index, array) => {
            const comma = index === array.length - 1 ? `` : `,`
            this.printer.print(`${this.mapType(it.type)} ${it.name}${comma}`)
        })
    }

    private printInteropMacro(constructorName: string, returnType: string, parameters: IDLParameter[]): void {
        const types = [
            constructorName,
            returnType,
            ...parameters.map(it => this.mapType(it.type))
        ].join(`, `)
        this.printer.print(`KOALA_INTEROP_${parameters.length}(${types})`)
    }

    private printBody(constructorName: string, parameters: IDLParameter[]): void {
        this.printer.print(`return GetImpl()->${constructorName}(`)
        this.printer.withIndent(() =>
            parameters.forEach((it, index, array) => {
                const comma = index !== array.length - 1
                    ? `,`
                    : ``
                this.printer.print(`${this.casted(it)}${comma}`)
            })
        )
        this.printer.print(`)`)
    }

    private casted(node: IDLParameter): string {
        if (isPrimitiveType(node.type)) return node.name
        if (isReferenceType(node.type) || isContainerType(node.type)) {
            const castTo = this.castTo(node.type)
            return castTo === undefined
                ? node.name
                : `reinterpret_cast<${castTo}>(${node.name})`
        }
        throw new Error(`Unsupported type "${node.type}"`)
    }

    private castTo(node: IDLReferenceType | IDLContainerType): string | undefined {
        if (isPrimitiveType(node)) return undefined
        if (isReferenceType(node)) return `${this.config.typePrefix}${node.name}*`
        if (isContainerType(node)) {
            if (IDLContainerUtils.isSequence(node)) {
                const typeParam = node.elementType[0]
                if (isContainerType(typeParam)) {
                    console.warn(`Warning: doing nothing for sequence<sequence<T>>`)
                    return undefined
                }
                if (!isReferenceType(typeParam)) throwException(
                    `Sequence of non-reference type: ${JSON.stringify(typeParam)}`
                )
                return `${this.config.typePrefix}${typeParam.name}**`
            }
        }

        throwException(`Unexpected type: ${IDLKind[node.kind]}`)
    }

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    private printMethod(astNodeName: string, node: IDLMethod): void {
        this.printFunction(`${this.config.methodFunction(astNodeName, node.name)}`, node.parameters, node.returnType)
    }

    private printFunction(name: string, parameters: IDLParameter[], returnType?: IDLType): void {
        const translatedReturnType = returnType === undefined
            ? `KNativePointer`
            : this.mapType(returnType)

        this.printer.print(`${translatedReturnType} ${this.config.implFunction(name)}(`)
        this.printer.withIndent(() =>
            this.printParameters(parameters)
        )
        this.printer.print(`) {`)
        this.printer.withIndent(() =>
            this.printBody(name, parameters)
        )
        this.printer.print(`}`)

        this.printInteropMacro(name, translatedReturnType, parameters)
        this.printer.print(``)
    }
}
