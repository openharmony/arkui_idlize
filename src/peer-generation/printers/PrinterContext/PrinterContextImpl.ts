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

import { Language } from '../../../util';
import { DeclarationTable } from '../../DeclarationTable';
import { ImportTable as ImportTable } from '../ImportTable';
import { PrinterContext } from '../PrinterContext';
import { SynthesizedTypesRegistry } from '../SynthesizedTypesRegistry';
import { JavaImportTable } from './JavaImportTable';
import { JavaSynthesizedTypesRegistry } from './JavaSynthesizedTypesRegistry';
import { CJSynthesizedTypesRegistry } from './CJSynthesizedTypesRegistry';

class PrinterContextImpl implements PrinterContext {
    get language(): Language {
        return this._language
    }
    get synthesizedTypes(): SynthesizedTypesRegistry | undefined {
        return this._synthesizedTypes
    }

    get imports(): ImportTable | undefined {
        return this._imports
    }
        
    constructor(table: DeclarationTable) {
        if (table.language == Language.JAVA) {
            this._imports = new JavaImportTable()
            this._synthesizedTypes = new JavaSynthesizedTypesRegistry(table, this._imports)
        }
        if (table.language == Language.CJ) {
            this._imports = new JavaImportTable()
            this._synthesizedTypes = new CJSynthesizedTypesRegistry(table, this._imports)
        }
        this._language = table.language
    }

    private readonly _language: Language
    private readonly _imports: ImportTable | undefined
    private readonly _synthesizedTypes: SynthesizedTypesRegistry | undefined
}

export function createPrinterContext(table: DeclarationTable): PrinterContext {
    return new PrinterContextImpl(table)
}
