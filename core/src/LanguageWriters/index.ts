import { IndentedPrinter } from "../IndentedPrinter"
import { Language } from "../Language"
import { LibraryInterface } from "../LibraryInterface"
import { PrimitiveTypesInstance } from "../peer-generation/PrimitiveType"
import { createEmptyReferenceResolver, ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { CJIDLTypeToForeignStringConvertor, CJInteropArgConvertor, CJTypeNameConvertor } from "./convertors/CJConvertors"
import { CppInteropArgConvertor, CppConvertor } from "./convertors/CppConvertors"
import { ETSInteropArgConvertor, ETSTypeNameConvertor } from "./convertors/ETSConvertors"
import { InteropArgConvertor } from "./convertors/InteropConvertors"
import { JavaInteropArgConvertor, JavaTypeNameConvertor } from "./convertors/JavaConvertors"
import { KotlinCInteropArgConvertor, KotlinTypeNameConvertor } from "./convertors/KotlinConvertors"
import { TSInteropArgConvertor, TSTypeNameConvertor } from "./convertors/TSConvertors"
import { LanguageWriter } from "./LanguageWriter"
import { TypeConvertor } from "./nameConvertor"
import { CJLanguageWriter } from "./writers/CJLanguageWriter"
import { CppLanguageWriter } from "./writers/CppLanguageWriter"
import { ETSLanguageWriter } from "./writers/ETSLanguageWriter"
import { JavaLanguageWriter } from "./writers/JavaLanguageWriter"
import { KotlinLanguageWriter } from "./writers/KotlinLanguageWriter"
import { TSLanguageWriter } from "./writers/TsLanguageWriter"

export * from "./nameConvertor"

export function createLanguageWriter(language: Language, library: LibraryInterface): LanguageWriter {
    const printer = new IndentedPrinter()
    switch (language) {
        case Language.TS: return new TSLanguageWriter(printer, library,
            new TSTypeNameConvertor(library))
        case Language.ARKTS: return new ETSLanguageWriter(printer, library,
            new ETSTypeNameConvertor(library), new CppConvertor(library))
        case Language.JAVA: return new JavaLanguageWriter(printer, library,
            new JavaTypeNameConvertor(library))
        case Language.CPP: return new CppLanguageWriter(printer, library,
            new CppConvertor(library), PrimitiveTypesInstance)
        case Language.CJ: return new CJLanguageWriter(printer, library,
            new CJTypeNameConvertor(library), new CJIDLTypeToForeignStringConvertor(library))
        case Language.KOTLIN: return new KotlinLanguageWriter(printer, library,
            new KotlinTypeNameConvertor(library))
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}

export function createInteropArgConvertor(language: Language): TypeConvertor<string> {
    switch (language) {
        case Language.TS: return new TSInteropArgConvertor()
        case Language.ARKTS: return new ETSInteropArgConvertor()
        case Language.CPP: return CppInteropArgConvertor.INSTANCE
        case Language.JAVA: return new JavaInteropArgConvertor()
        case Language.CJ: return new CJInteropArgConvertor()
        case Language.KOTLIN: return new KotlinCInteropArgConvertor()
    }
    throw new Error(`InteropArgConvertor for language ${language} not implemented`)
}

const EmptyReferenceResolver = createEmptyReferenceResolver()
