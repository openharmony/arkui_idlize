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
import { IDLEnum, IDLType } from "@idlizer/core/idl"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { isNumber } from "../../utils/types"

export class EnumsPrinter extends SingleFilePrinter {
    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => { throwException(`Unexpected call to covert type`) } },
    )

    visit(): void {
        this.idl.entries
            .filter(isEnum)
            .forEach(it => this.printEnum(it))
    }

    private printEnum(node: IDLEnum): void {
        this.writer.writeEnum(
            node.name,
            node.elements.map(it => {
                if (!isNumber(it.initializer)) {
                    throwException(`unexpected initializer value: ${it.initializer}`)
                }
                return {
                    name: it.name,
                    stringId: undefined,
                    numberId: it.initializer,
                }
            })
        )
    }
}
