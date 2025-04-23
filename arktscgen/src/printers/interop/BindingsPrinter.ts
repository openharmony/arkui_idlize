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
    ArgumentModifier,
    convertType,
    createEmptyReferenceResolver,
    IDLMethod,
    IndentedPrinter,
    Method,
    MethodModifier,
    MethodSignature,
    TSLanguageWriter
} from "@idlizer/core"
import { IDLType, } from "@idlizer/core/idl"
import { IDLFile } from "@idlizer/core"
import { InteropPrinter } from "./InteropPrinter"
import { BindingsConstructions } from "../../constuctions/BindingsConstructions"
import { BindingsTypeConvertor } from "../../type-convertors/interop/bindings/BindingsTypeConvertor"
import { ReturnTypeConvertor } from "../../type-convertors/interop/bindings/ReturnTypeConvertor"

export class BindingsPrinter extends InteropPrinter {
    constructor(idl: IDLFile) {
        super(idl)
        this.writer.pushIndent()
    }

    override writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => this.convertor.convertType(node) }
    )

    private convertor = new BindingsTypeConvertor(this.typechecker)

    private returnConvertor = new ReturnTypeConvertor(this.typechecker)

    override printMethod(node: IDLMethod): void {
        this.writer.writeMethodImplementation(
            new Method(
                BindingsConstructions.method(node.name),
                new MethodSignature(
                    this.returnConvertor.convertType(node.returnType),
                    node.parameters.map(it => it.type),
                    undefined,
                    node.parameters.map(it => it.isOptional ? ArgumentModifier.OPTIONAL : undefined),
                    undefined,
                    node.parameters.map(it => it.name)
                )
            ),
            (writer) => {
                writer.writeExpressionStatement(
                    writer.makeString(BindingsConstructions.unimplemented)
                )
            }
        )
    }
}
