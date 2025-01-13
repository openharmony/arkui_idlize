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

import { IndentedPrinter, throwException } from "@idlize/core"
import { PeerLibrary } from "../peer-generation/PeerLibrary"
import {
    IDLConstructor,
    IDLEntry,
    IDLInterface,
    IDLParameter,
    IDLType,
    isInterface, isReferenceType,
} from "@idlize/core/idl"
import { NativeTypeConvertor } from "./NativeTypeConvertor"
import { convertType } from "../peer-generation/LanguageWriters/nameConvertor"

export class LibPrinter {
    constructor(
        private library: PeerLibrary
    ) { }

    private printer = new IndentedPrinter()
    private convertor = new NativeTypeConvertor()
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
    }

    private visitInterface(node: IDLInterface): void {
        node.constructors.forEach(it =>
            this.printConstructor(this.constructorFunction(node.name), it)
        )
    }

    private printConstructor(constructorName: string, node: IDLConstructor): void {
        this.printer.print(`KNativePointer ${this.implFunction(constructorName)}(`)
        this.printer.withIndent(() =>
            this.printParameters(node.parameters)
        )
        this.printer.print(`) {`)
        this.printer.withIndent(() =>
            this.printBody(constructorName, node.parameters)
        )
        this.printer.print(`}`)

        this.printInteropMacro(constructorName, node.parameters)
        this.printer.print(``)
    }

    private printParameters(parameters: IDLParameter[]): void {
        parameters.forEach((it, index, array) => {
            const comma = index === array.length - 1 ? `` : `,`
            this.printer.print(`${this.mapType(it.type)} ${it.name}${comma}`)
        })
    }

    private printInteropMacro(constructorName: string, parameters: IDLParameter[]): void {
        const types = [
            this.constructorFunction(constructorName),
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
                if (it.type === undefined) throwException(`Parameter type is undefined`)
                const maybeCasted = isReferenceType(it.type)
                    ? `reinterpret_cast<${LibPrinter.typePrefix}${it.type.name}*>(${it.name})`
                    : it.name
                this.printer.print(`${maybeCasted}${comma}`)
            })
        )
        this.printer.print(`)`)
    }

    private constructorFunction(astNodeName: string): string {
        return `${LibPrinter.constructorPrefix}${astNodeName}`
    }

    private implFunction(name: string): string {
        return `${LibPrinter.implPrefix}${name}`
    }

    private mapType(node: IDLType | undefined): string {
        if (node === undefined) throwException(`Parameter type is undefined`)

        return convertType(this.convertor, node)
    }
}
