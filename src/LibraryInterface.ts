import * as idl from "./idl";
import { ArgConvertor } from "./peer-generation/ArgConvertors";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver";

// todo: TypeProcessor? LibraryBase? 
export interface LibraryInterface extends ReferenceResolver {
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    getTypeName(type: idl.IDLType | idl.IDLInterface, optional?: boolean): string
    mapType(type: idl.IDLType | idl.IDLCallback): string
    computeTargetName(target: idl.IDLEntry, optional: boolean, idlPrefix?: string): string
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    /**
     * todo: is it really needed?
     */
    libraryPrefix: string

    /**
     * @deprecated
     */
    makeCArrayName(elementType: idl.IDLType): string
    /** 
     * @deprecated 
     */
    makeCMapName(keyType: idl.IDLType, valueType: idl.IDLType): string
}