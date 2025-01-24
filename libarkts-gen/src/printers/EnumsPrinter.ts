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

import { createEmptyReferenceResolver, IndentedPrinter, throwException, TSLanguageWriter, } from "@idlize/core"
import { IDLEnum, IDLType, isPrimitiveType, } from "@idlize/core/idl"
import { Config } from "../Config"
import { IDLFile } from "../IdlFile"
import { InteropPrinter } from "./InteropPrinter"

export class EnumsPrinter extends InteropPrinter {
    constructor(
        idl: IDLFile,
        config: Config
    ) {
        super(idl, config)
    }

    private writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => { throwException(`There is no type conversions for enums`) } },
    )

    override printEnum(node: IDLEnum): void {
        this.writer.writeEnum(
            node.name,
            node.elements.map(
                element => {
                    if (!isPrimitiveType(element.type)) {
                        throwException(`Unexpected kind of enum element type: ${element.type}`)
                    }
                    if (typeof element.initializer !== 'number') {
                        throwException(`Unexpected type of initializer: ${typeof element.initializer}`)
                    }
                    return {
                        name: element.name,
                        stringId: undefined,
                        numberId: element.initializer,
                    }
                }
            )
        )
    }

    override getOutput(): string[] {
        return this.writer.getOutput()
    }
}
