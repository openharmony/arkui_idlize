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

import { Typechecker } from "../general/Typechecker"
import { IDLFile } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core"
import { Importer } from "./library/Importer";

export abstract class SingleFilePrinter {
    constructor(
        protected idl: IDLFile,
    ) { }

    protected typechecker = new Typechecker(this.idl.entries)
    protected importer?: Importer
    protected abstract writer: LanguageWriter

    print(): string {
        this.visit()
        return [
            this.importer?.getOutput() ?? [],
            this.writer.getOutput()
        ]
            .flat()
            .join(`\n`)
    }

    protected abstract visit(): void
}