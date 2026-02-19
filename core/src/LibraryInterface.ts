import * as idl from "./idl/index.js"
import { Language } from "./Language.js";
import { IdlNameConvertor } from "./LanguageWriters/index.js";
import { ArgConvertor } from "./LanguageWriters/ArgConvertors.js";
import { LayoutManager } from "./peer-generation/LayoutManager.js";
import { getModuleFor } from "./peer-generation/modules.js";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver.js";

// todo: TypeProcessor? LibraryBase?
export interface LibraryInterface extends ReferenceResolver {
    language: Language
    get files(): idl.IDLFile[]
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    createTypeNameConvertor(language: Language): IdlNameConvertor
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    isHandwritten(node: idl.IDLEntry | idl.IDLReferenceType): boolean
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

export function mapLibraryName(node: idl.IDLEntry, lang: Language, mapping?: Map<string, Map<string, string>>, prefix: string = "@"): string {
    const module = getModuleFor(node)
    if (module.tsLikePackage !== undefined) {
        return `^` + module.tsLikePackage
    }
    const packageName = idl.getPackageName(node)
    return `^` + (mapping?.get(packageName)?.get(lang.name) ?? `${prefix}${packageName}`)
}

