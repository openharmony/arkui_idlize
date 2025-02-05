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

import { createEmptyReferenceResolver, IndentedPrinter, isEnum, throwException, TSLanguageWriter, } from "@idlizer/core"
import { IDLEnum, IDLType, } from "@idlizer/core/idl"
import { IDLFile } from "../idl-utils"

export class EnumsPrinter {
    constructor(
        private idl: IDLFile,
    ) { }

    private writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => { throwException(`Unexpected call to covert type`) } },
    )

    print(): string {
        this.idl.entries
            .filter(isEnum)
            .forEach(it => this.printEnum(it))
        return this.writer.getOutput().join('\n')
    }

    private printEnum(node: IDLEnum): void {
        this.writer.writeEnum(
            node.name,
            node.elements.map(it => {
                if (typeof it.initializer !== 'number') {
                    throwException(`Unexpected type of initializer: ${typeof it.initializer}`)
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
