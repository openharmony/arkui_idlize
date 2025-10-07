import { ReferenceResolver } from "./ReferenceResolver";
import * as idl from "../idl"
import { ArkCustomObject, ArkDate, ArkFunction, forceTypedefAsResource } from "./PeerLibrary";
import { warn } from "../util";
import { toIdlType } from "../from-idl/deserialize";
import { isImportAttr } from "./idl/common";

export function toDeclaration(type: idl.IDLType | idl.IDLEntry, resolver: ReferenceResolver): idl.IDLEntry | idl.IDLType {
    switch (type) {
        case idl.IDLAnyType: return ArkCustomObject
        case idl.IDLVoidType: return idl.IDLVoidType
        case idl.IDLUndefinedType: return idl.IDLUndefinedType
        case idl.IDLUnknownType: return ArkCustomObject
        // case idl.IDLObjectType: return ArkCustomObject
    }
    const typeName = idl.isNamedNode(type) ? type.name : undefined
    switch (typeName) {
        case "object":
        case "Object": return idl.IDLObjectType
    }
    if (idl.isReferenceType(type)) {
        // TODO: remove all this!
        if (type.name === 'Date') {
            return ArkDate
        }
        if (type.name === 'AnimationRange') {
            return ArkCustomObject
        }
        if (type.name === 'Function') {
            return ArkFunction
        }
        if (type.name === 'Optional') {
            return toDeclaration((type as idl.IDLReferenceType).typeArguments![0], resolver)
        }
        const decl = resolver.resolveTypeReference(type)
        if (!decl) {
            warn(`undeclared type ${idl.DebugUtils.debugPrintType(type)}`)
        }
        if (decl && idl.isTypedef(decl) && forceTypedefAsResource(resolver, type, decl)) {
            return idl.IDLObjectType
        }
        if (decl && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)) {
            const type = toIdlType("", idl.getExtAttribute(decl, idl.IDLExtendedAttributes.TransformOnSerialize)!)
            return toDeclaration(type, resolver)
        }
        return !decl ? ArkCustomObject  // assume some builtin type
            : idl.isTypedef(decl) ? toDeclaration(decl.type, resolver)
                : decl
    }
    if (isImportAttr(type)) {
        return ArkCustomObject
    }
    return type
}