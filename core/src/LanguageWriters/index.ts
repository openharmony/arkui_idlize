import { IndentedPrinter } from "../IndentedPrinter"
import { Language } from "../Language"
import { PrimitiveTypesInstance } from "../peer-generation/PrimitiveType"
import { createEmptyReferenceResolver, ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { CJIDLTypeToForeignStringConvertor, CJInteropArgConvertor, CJTypeNameConvertor } from "./convertors/CJConvertors"
import { CppInteropArgConvertor, CppConvertor } from "./convertors/CppConvertors"
import { ETSInteropArgConvertor, ETSTypeNameConvertor } from "./convertors/ETSConvertors"
import { InteropArgConvertor } from "./convertors/InteropConvertors"
import { JavaInteropArgConvertor, JavaTypeNameConvertor } from "./convertors/JavaConvertors"
import { TSInteropArgConvertor, TSTypeNameConvertor } from "./convertors/TSConvertors"
import { LanguageWriter } from "./LanguageWriter"
import { TypeConvertor } from "./nameConvertor"
import { CJLanguageWriter } from "./writers/CJLanguageWriter"
import { CppLanguageWriter } from "./writers/CppLanguageWriter"
import { ETSLanguageWriter } from "./writers/ETSLanguageWriter"
import { JavaLanguageWriter } from "./writers/JavaLanguageWriter"
import { TSLanguageWriter } from "./writers/TsLanguageWriter"

export * from "./nameConvertor"

export function createLanguageWriter(language: Language, resolver?: ReferenceResolver): LanguageWriter {
    resolver ??= EmptyReferenceResolver
    const printer = new IndentedPrinter()
    switch (language) {
        case Language.TS: return new TSLanguageWriter(printer, resolver,
            new TSTypeNameConvertor(resolver))
        case Language.ARKTS: return new ETSLanguageWriter(printer, resolver,
            new ETSTypeNameConvertor(resolver), new CppConvertor(resolver))
        case Language.JAVA: return new JavaLanguageWriter(printer, resolver,
            new JavaTypeNameConvertor(resolver))
        case Language.CPP: return new CppLanguageWriter(printer, resolver,
            new CppConvertor(resolver), PrimitiveTypesInstance)
        case Language.CJ: return new CJLanguageWriter(printer, resolver,
            new CJTypeNameConvertor(resolver), new CJIDLTypeToForeignStringConvertor(resolver))
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
    }
    throw new Error(`InteropArgConvertor for language ${language} not implemented`)
}

const EmptyReferenceResolver = createEmptyReferenceResolver()
