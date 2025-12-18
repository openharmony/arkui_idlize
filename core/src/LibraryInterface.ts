import * as idl from "./idl"
import { Language } from "./Language";
import { IdlNameConvertor } from "./LanguageWriters";
import { ArgConvertor } from "./LanguageWriters/ArgConvertors";
import { LayoutManager } from "./peer-generation/LayoutManager";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver";

// todo: TypeProcessor? LibraryBase?
export interface LibraryInterface extends ReferenceResolver {
    language: Language
    get files(): idl.IDLFile[]
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    createTypeNameConvertor(language: Language): IdlNameConvertor
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    layout: LayoutManager
    /**
     * todo: is it really needed?
     */
    libraryPrefix: string
}

export function getTransformer(library: LibraryInterface, from: idl.IDLNode, to: idl.IDLNode): { module: string, ns?: string, method: string } {
    const convertor = library.createTypeNameConvertor(Language.CPP)
    const withNS = Language.supportNS(library.language)
    const handwritten = library.layout.handwrittenPackage()
    return {
        module: withNS ? handwritten : `${handwritten}.extractors`,
        ns: withNS ? "extractors" : undefined,
        method: `transform_${convertor.convert(from)}_to_${convertor.convert(to)}`
    }
}
