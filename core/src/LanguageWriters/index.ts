import { Language } from "../Language"
import { CJInteropArgConvertor } from "./convertors/CJConvertors"
import { CppInteropArgConvertor } from "./convertors/CppConvertors"
import { InteropArgConvertor } from "./convertors/InteropConvertors"
import { JavaInteropArgConvertor } from "./convertors/JavaConvertors"

export * from "./nameConvertor"

export function createInteropArgConvertor(language: Language): InteropArgConvertor {
    switch (language) {
        case Language.TS:
        case Language.ARKTS: return new InteropArgConvertor()
        case Language.CPP: return CppInteropArgConvertor.INSTANCE
        case Language.JAVA: return new JavaInteropArgConvertor()
        case Language.CJ: return new CJInteropArgConvertor()
    }
    throw new Error(`InteropArgConvertor for language ${language} not implemented`)
}

