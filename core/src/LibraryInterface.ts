import * as idl from "./idl"
import { Language } from "./Language";
import { IdlNameConvertor } from "./LanguageWriters";
import { ArgConvertor } from "./LanguageWriters/ArgConvertors";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver";

// todo: TypeProcessor? LibraryBase?
export interface LibraryInterface extends ReferenceResolver {
    language: Language
    get files(): idl.IDLFile[]
    get libraryPackages(): string[] | undefined
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    getInteropName(node: idl.IDLNode): string
    createTypeNameConvertor(language: Language): IdlNameConvertor
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    /**
     * todo: is it really needed?
     */
    libraryPrefix: string
}