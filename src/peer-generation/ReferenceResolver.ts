import * as idl from "../idl";
import { IdlPeerLibrary } from "./idl/IdlPeerLibrary";
import { PeerLibrary } from "./PeerLibrary";

export interface ReferenceResolver {
    resolveTypeReference(type: idl.IDLEnumType | idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined
    toDeclaration(type: idl.IDLType | idl.IDLCallback): idl.IDLEntry
}

export function createEmptyReferenceResolver(): ReferenceResolver {
    return {
        resolveTypeReference() {
            return undefined
        },
        toDeclaration(type) {
            return type
        }
    }
}

export function getReferenceResolver(library:IdlPeerLibrary | PeerLibrary): ReferenceResolver {
    if (library instanceof IdlPeerLibrary) {
        return library
    }
    return createEmptyReferenceResolver()
}
