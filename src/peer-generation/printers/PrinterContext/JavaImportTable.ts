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

import { forceAsNamedNode, IDLType, toIDLType } from "../../../idl";
import { LanguageWriter } from "../../LanguageWriters";
import { ImportTable } from "../ImportTable";
import * as assert from "assert";

export class JavaImportTable implements ImportTable {
    private readonly imports = new Map<string, string[]>();

    constructor() {
        this.setPeerLibImports()
    }

    getImportsForTypes(types: IDLType[]): string[] {
        const allImports = new Set(types.flatMap(it => {
            return this.imports.get(this.encode(it)) ?? []
        }))
        return Array.from(allImports)
    }

    setImportsForType(type: IDLType, imports: string[]): void {
        const encodedType = this.encode(type)
        if (this.imports.has(encodedType)) {
            assert.deepStrictEqual(imports, this.imports.get(encodedType))
        }
        else {
            this.imports.set(encodedType, imports)
        }
    }

    printImportsForTypes(types: IDLType[], printer: LanguageWriter): void {
        const allImports = new Set(types.flatMap(it => {
            return this.imports.get(this.encode(it)) ?? []
        }))

        for (const importedModule of allImports) {
            printer.print(`import ${importedModule};\n`)
        }
    }

    private encode(type: IDLType): string {
        return forceAsNamedNode(type).name
    }

    private setPeerLibImports(): void {
        this.setImportsForType(toIDLType('Finalizable'), ['org.koalaui.interop.Finalizable'])
        this.setImportsForType(toIDLType('Consumer'), ['java.util.function.Consumer'])
        this.setImportsForType(toIDLType('Supplier'), ['java.util.function.Supplier'])
    }
}
