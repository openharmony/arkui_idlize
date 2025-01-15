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
    IDLEnum,
    IDLKind,
    IDLMethod,
    IDLReferenceType,
    IndentedPrinter,
    throwException
} from "@idlize/core"
import { PeerLibrary } from "../peer-generation/PeerLibrary"
import {
    IDLConstructor,
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
import { convertType } from "../peer-generation/LanguageWriters/nameConvertor"

export class BridgesPrinter {
    constructor(
        private library: PeerLibrary
    ) { }

    private printer = new IndentedPrinter()
    private convertor = new NativeTypeConvertor(this.library)
    private static implPrefix = `impl_`
    private static constructorPrefix = `Create`
    private static typePrefix = `es2panda_`

    print(): string {
        this.library.files
            .flatMap(it => it.entries)
            .forEach(it => this.visit(it))
        return this.printer.getOutput().join('\n')
    }

    private visit(node: IDLEntry): void {
        console.log(node.name)
        if (isInterface(node)) return this.visitInterface(node)
        if (isEnum(node)) return this.visitEnum(node)

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private visitInterface(node: IDLInterface): void {
        node.constructors.forEach(it =>
            this.printConstructor(this.constructorFunction(node.name), it)
        )
        node.methods.forEach(it =>
            this.printMethod(node.name, it)
        )
    }

    private visitEnum(node: IDLEnum): void {
        // do nothing
    }

    private printConstructor(constructorName: string, node: IDLConstructor): void {
        this.printFunction(constructorName, node.parameters)
    }

    private printParameters(parameters: IDLParameter[]): void {
        parameters.forEach((it, index, array) => {
            const comma = index === array.length - 1 ? `` : `,`
            this.printer.print(`${this.mapType(it.type)} ${it.name}${comma}`)
        })
    }

    private printInteropMacro(constructorName: string, returnType: string, parameters: IDLParameter[]): void {
        const types = [
            this.constructorFunction(constructorName),
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

    private constructorFunction(astNodeName: string): string {
        return `${BridgesPrinter.constructorPrefix}${astNodeName}`
    }

    private implFunction(name: string): string {
        return `${BridgesPrinter.implPrefix}${name}`
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
        if (isReferenceType(node)) return `${BridgesPrinter.typePrefix}${node.name}*`
        if (isContainerType(node)) {
            if (IDLContainerUtils.isSequence(node)) {
                if (!isReferenceType(node.elementType[0])) throwException(`Sequence of non-reference type`)
                return `${BridgesPrinter.typePrefix}${node.elementType[0].name}**`
            }
        }

        throwException(`Unexpected type`)
    }

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    private printMethod(astNodeName: string, node: IDLMethod): void {
        this.printFunction(`${astNodeName}${node.name}`, node.parameters, node.returnType)
    }

    private printFunction(name: string, parameters: IDLParameter[], returnType?: IDLType): void {
        const translatedReturnType = returnType === undefined
            ? `KNativePointer`
            : this.mapType(returnType)

        this.printer.print(`${translatedReturnType} ${this.implFunction(name)}(`)
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
