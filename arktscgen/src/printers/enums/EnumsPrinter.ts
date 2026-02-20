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

import { createEmptyReferenceResolver, IndentedPrinter, isEnum, throwException, TSLanguageWriter } from "@idlizer/core"
import { createTypedef, IDLEntry, IDLEnum, IDLInterface, IDLType, IDLTypedef, isTypedef, isUnionType, printType } from "@idlizer/core/idl"
import { SingleFilePrinter } from "../SingleFilePrinter.js"
import { isNumber } from "../../utils/types.js"
import { fixEnumPrefix } from "../../general/common.js"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor.js"

export class EnumsPrinter extends SingleFilePrinter {
    protected converter = new LibraryTypeConvertor(this.typechecker)
    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        {
            convert : (node: IDLType) => {
                if (isUnionType(node)) {
                    // TODO: core implementation, it is better tor use the
                    // whole converters from core.
                    return node.types.map(type =>
                        this.converter.convertType(type)
                    ).join(' | ')
                }
                return this.converter.convertType(node)
            }
        },
    )

    protected printInterface(node: IDLInterface): void {}
    protected filterInterface(node: IDLInterface): boolean {
        return true
    }

    override printEnum(node: IDLEnum): void {
        this.writer.writeEnum(
            fixEnumPrefix(node.name),
            node.elements.map(it => {
                if (!isNumber(it.initializer)) {
                    throwException(`unexpected initializer value: ${it.initializer}`)
                }
                return {
                    name: it.name,
                    stringId: undefined,
                    numberId: it.initializer,
                }
            }),
            { isExport: true }
        )
    }

    override printTypedef(node: IDLTypedef): void {
        this.writer.writeTypeDeclaration(
            createTypedef(fixEnumPrefix(node.name), node.type, node.typeParameters)
        );
    }
}
