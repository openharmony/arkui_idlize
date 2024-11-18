import * as idl from "./idl";
import { ArgConvertor } from "./peer-generation/ArgConvertors";
import { IdlEntryManager } from "./peer-generation/idl/IdlEntryManager";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver";

// todo: TypeProcessor? LibraryBase? 
export interface LibraryInterface extends ReferenceResolver {
    get factory(): IdlEntryManager
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    /** @deprecated
     * Should be removed ASAP
     * Do not use this function if possible, instead use 
     * `LanguageWriter.stringifyType()`
     *   or `IdlNameConvertor.convert`
     */
    getTypeName(type: idl.IDLType): string
    /** @deprecated
     * Should be removed ASAP
     * Do not use this function if possible, instead use 
     * `IdlNameConvertor.convert`
     */
    getEntryName(entry: idl.IDLEntry): string
     /** @deprecated
     * Should be removed ASAP
     * Do not use this function if possible, instead use 
     * `IdlNameConvertor.convert`
     */
    getNodeName(node: idl.IDLNode): string
    getInteropName(node: idl.IDLNode): string
    mapType(type: idl.IDLType | idl.IDLCallback): string
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    isComponentDeclaration(iface: idl.IDLInterface): boolean
    /**
     * todo: is it really needed?
     */
    libraryPrefix: string
}