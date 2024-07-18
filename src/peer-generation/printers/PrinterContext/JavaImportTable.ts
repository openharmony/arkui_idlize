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

import { LanguageWriter, Type } from "../../LanguageWriters";
import { ImportTable } from "../ImportTable";

export class JavaImportTable implements ImportTable {
    private readonly imports = new Map<Type, string[]>();

    getImportsForType(type: Type): string[] {
        return this.imports.get(type) ?? []
    }

    setImportsForType(type: Type, imports: string[]): void {
        if (this.imports.has(type)) {
            throw new Error(`Imports already defined for type ${type.name}`)
        }
        this.imports.set(type, imports)
    }

    printImportsForTypes(types: Type[], printer: LanguageWriter): void {
        const allImports = new Set(types.flatMap(it => {
            return this.imports.get(it) ?? []
        }))

        for (const importedModule of allImports) {
            printer.print(`import ${importedModule};\n`)
        }
    }
}
