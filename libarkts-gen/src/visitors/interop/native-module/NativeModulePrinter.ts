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
    convertType,
    createEmptyReferenceResolver,
    IDLMethod,
    IndentedPrinter,
    Method,
    MethodSignature,
    TSLanguageWriter
} from "@idlizer/core"
import { IDLType, } from "@idlizer/core/idl"
import { IDLFile } from "../../../idl-utils"
import { InteropPrinter } from "../InteropPrinter"
import { ManagedTypeConvertor } from "./ManagedTypeConvertor"
import { NativeModuleConstructions } from "./NativeModuleConstructions"

export class NativeModulePrinter extends InteropPrinter {
    constructor(idl: IDLFile) {
        super(idl)
        this.writer.pushIndent()
    }

    override writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => this.mapType(node) },
    )

    private convertor = new ManagedTypeConvertor(this.idl.entries)

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    override printMethod(node: IDLMethod): void {
        this.writer.writeMethodImplementation(
            new Method(
                NativeModuleConstructions.method(node.name),
                new MethodSignature(
                    node.returnType,
                    node.parameters.map(it => it.type),
                    undefined,
                    undefined,
                    node.parameters.map(it => it.name)
                )
            ),
            (writer) => {
                writer.writeExpressionStatement(
                    writer.makeString(NativeModuleConstructions.unimplemented)
                )
            }
        )
    }
}
