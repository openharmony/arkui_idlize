import * as idl from "./idl";
import { Language } from "./Language";
import { ArgConvertor } from "./peer-generation/ArgConvertors";
import { IdlEntryManager } from "./peer-generation/idl/IdlEntryManager";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver";

// todo: TypeProcessor? LibraryBase? 
export interface LibraryInterface extends ReferenceResolver {
    language: Language
    get factory(): IdlEntryManager
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    getInteropName(node: idl.IDLNode): string
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    isComponentDeclaration(iface: idl.IDLInterface): boolean
    /**
     * todo: is it really needed?
     */
    libraryPrefix: string
}