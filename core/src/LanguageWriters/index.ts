/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import { IndentedPrinter } from "../IndentedPrinter"
import { Language } from "../Language"
import { LibraryInterface } from "../LibraryInterface"
import { PeerLibrary } from "../peer-generation/PeerLibrary"
import { PrimitiveTypesInstance } from "../peer-generation/PrimitiveType"
import { createEmptyReferenceResolver } from "../peer-generation/ReferenceResolver"
import { CJIDLTypeToForeignStringConvertor, CJInteropArgConvertor, CJTypeNameConvertor } from "./convertors/CJConvertors"
import { CppInteropArgConvertor, CppConvertor } from "./convertors/CppConvertors"
import { ETSInteropArgConvertor, ETSTypeNameConvertor } from "./convertors/ETSConvertors"
import { KotlinCInteropArgConvertor, KotlinTypeNameConvertor } from "./convertors/KotlinConvertors"
import { TSInteropArgConvertor, TSTypeNameConvertor } from "./convertors/TSConvertors"
import { LanguageWriter } from "./LanguageWriter"
import { IdlNameConvertor, TypeConvertor } from "./nameConvertor"
import { CJLanguageWriter } from "./writers/CJLanguageWriter"
import { CppLanguageWriter } from "./writers/CppLanguageWriter"
import { ETSLanguageWriter } from "./writers/ETSLanguageWriter"
import { KotlinLanguageWriter } from "./writers/KotlinLanguageWriter"
import { TSLanguageWriter } from "./writers/TsLanguageWriter"

export * from "./nameConvertor"

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

export function createInteropArgConvertor(language: Language, library:PeerLibrary): IdlNameConvertor {
    switch (language) {
        case Language.TS: return new TSInteropArgConvertor()
        case Language.ARKTS: return new ETSInteropArgConvertor()
        case Language.CPP: return CppInteropArgConvertor.INSTANCE
        case Language.CJ: return new CJInteropArgConvertor()
        case Language.KOTLIN: return new KotlinTypeNameConvertor(library)
    }
    throw new Error(`InteropArgConvertor for language ${language} not implemented`)
}

