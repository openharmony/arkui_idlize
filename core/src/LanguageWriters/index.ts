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
import { IndentedPrinter } from "../IndentedPrinter.js"
import { Language } from "../Language.js"
import { LibraryInterface } from "../LibraryInterface.js"
import { PrimitiveTypesInstance } from "../peer-generation/PrimitiveType.js"
import { CJIDLTypeToForeignStringConvertor, CJInteropArgConvertor, CJTypeNameConvertor } from "./convertors/CJConvertors.js"
import { CppInteropArgConvertor, CppConvertor } from "./convertors/CppConvertors.js"
import { ETSInteropArgConvertor, ETSTypeNameConvertor } from "./convertors/ETSConvertors.js"
import { KotlinInteropArgConvertor, KotlinTypeNameConvertor } from "./convertors/KotlinConvertors.js"
import { TSInteropArgConvertor, TSTypeNameConvertor } from "./convertors/TSConvertors.js"
import { LanguageWriter } from "./LanguageWriter.js"
import { IdlNameConvertor } from "./nameConvertor.js"
import { CJLanguageWriter } from "./writers/CJLanguageWriter.js"
import { CppLanguageWriter } from "./writers/CppLanguageWriter.js"
import { ETSLanguageWriter } from "./writers/ETSLanguageWriter.js"
import { KotlinLanguageWriter } from "./writers/KotlinLanguageWriter.js"
import { TSLanguageWriter } from "./writers/TsLanguageWriter.js"

export * from "./nameConvertor.js"

export function createLanguageWriter(language: Language, library: LibraryInterface, nameConvertor?: IdlNameConvertor): LanguageWriter {
    const printer = new IndentedPrinter()
    switch (language) {
        case Language.TS: return new TSLanguageWriter(printer, library,
            nameConvertor ?? new TSTypeNameConvertor(library))
        case Language.ARKTS: return new ETSLanguageWriter(printer, library,
            nameConvertor ?? new ETSTypeNameConvertor(library), new CppConvertor(library))
        case Language.CPP: return new CppLanguageWriter(printer, library,
            nameConvertor ?? new CppConvertor(library), PrimitiveTypesInstance)
        case Language.CJ: return new CJLanguageWriter(printer, library,
            nameConvertor ?? new CJTypeNameConvertor(library), new CJIDLTypeToForeignStringConvertor(library))
        case Language.KOTLIN: return new KotlinLanguageWriter(printer, library,
            nameConvertor ?? new KotlinTypeNameConvertor(library))
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}

export function createInteropArgConvertor(language: Language): IdlNameConvertor {
    switch (language) {
        case Language.TS: return new TSInteropArgConvertor()
        case Language.ARKTS: return new ETSInteropArgConvertor()
        case Language.CPP: return CppInteropArgConvertor.INSTANCE
        case Language.CJ: return new CJInteropArgConvertor()
        case Language.KOTLIN: return new KotlinInteropArgConvertor()
    }
    throw new Error(`InteropArgConvertor for language ${language} not implemented`)
}

