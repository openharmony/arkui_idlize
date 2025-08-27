import { generatorConfiguration } from "../config"
import { toIdlType } from "../from-idl/deserialize"
import * as idl from "../idl"
import { isBuilderClass } from "../peer-generation/BuilderClass"
import { generateSyntheticIdlNodeName } from "../peer-generation/idl/common"
import { isMaterialized } from "../peer-generation/isMaterialized"
import { ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { inplaceFQN } from "./FqnTransformer"

export function inplaceGenerics(
    node: idl.IDLNode,
    resolver: ReferenceResolver,
    options?: {
        ignore?: ((node: idl.IDLNode) => boolean)[]
    }
): void {
    const candidates: idl.IDLReferenceType[] = []
    idl.forEachChild(node, () => {}, (child) => {
        if (idl.isReferenceType(child))
            candidates.push(child)
    })
    options ??= {}
    options.ignore ??= []
    options.ignore.push(ignoreConfigRule, ignoreBuilderClassRule, createIgnoreMaterializedRule(resolver), createIgnoreResourceRule(resolver))
    candidates.forEach(it => inplaceReferenceGenerics(it, resolver, options))
}

export function isInplacedGeneric(entry: idl.IDLEntry) {
    return idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.OriginalGenericName)
}

export function maybeRestoreGenerics(
    maybeTransformedGeneric: idl.IDLReferenceType | idl.IDLEntry,
    resolver: ReferenceResolver,
): idl.IDLReferenceType | undefined {
    if (idl.isReferenceType(maybeTransformedGeneric)) {
        const resolved = resolver.resolveTypeReference(maybeTransformedGeneric)
        return resolved ? maybeRestoreGenerics(resolved, resolver) : undefined
    }
    if (maybeTransformedGeneric && idl.hasExtAttribute(maybeTransformedGeneric, idl.IDLExtendedAttributes.OriginalGenericName)) {
        const originalName = idl.getExtAttribute(maybeTransformedGeneric, idl.IDLExtendedAttributes.OriginalGenericName)!
        const typeArgumentsAttribute = idl.getExtAttribute(maybeTransformedGeneric, idl.IDLExtendedAttributes.TypeArguments)
        if (!typeArgumentsAttribute)
            throw new Error(`Can not restore original generic type arguments for ${originalName}: no type arguments`)
        const typeArguments = typeArgumentsAttribute.split(',').map(it => toIdlType(maybeTransformedGeneric.fileName ?? "", it))
        return idl.createReferenceType(
            originalName,
            typeArguments,
            {
                extendedAttributes: [{
                    name: idl.IDLExtendedAttributes.TypeArguments,
                    value: typeArgumentsAttribute,
                }]
            }
        )
    }
    return undefined
}

function ignoreConfigRule(node: idl.IDLNode): boolean {
    if (idl.isEntry(node))
        return generatorConfiguration().ignoreGenerics.includes(idl.getFQName(node))
    return false
}

function ignoreBuilderClassRule(node: idl.IDLNode): boolean {
    return idl.isInterface(node) && isBuilderClass(node)
}

function createIgnoreMaterializedRule(resolver: ReferenceResolver): (node: idl.IDLNode) => boolean {
    return (node: idl.IDLNode) => idl.isInterface(node) && isMaterialized(node, resolver) && !idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TransformOnSerialize)
}

function createIgnoreResourceRule(resolver: ReferenceResolver): (node: idl.IDLNode) => boolean {
    return (node: idl.IDLNode) => {
        if (!idl.isReferenceType(node)) {
            return false
        }
        const declaration = resolver.resolveTypeReference(node)
        if (!declaration) {
            return false
        }
        return generatorConfiguration().forceResource.includes(declaration.name)
    }
}

function monomorphisedEntryName(typedEntry: idl.IDLEntry, typeArguments: idl.IDLType[]): string {
    return typedEntry.name + "_" + typeArguments.map(generateSyntheticIdlNodeName).join("_")
}

function monomorphizeEntry<T extends idl.IDLEntry>(typedEntry: T, typeArguments: idl.IDLType[]): T {
    if (!idl.isTypedef(typedEntry) && !idl.isInterface(typedEntry) && !idl.isCallback(typedEntry))
        throw new Error(`Can not monomorphize ${typedEntry.kind}`)
    if (typedEntry.typeParameters?.length != typeArguments.length)
        throw new Error(`Trying to monomorphize entry ${typedEntry.name} that accepts ${typedEntry.typeParameters?.length} type parameters with ${typeArguments.length} type arguments`)
    const monomorphizedEntry = idl.clone(typedEntry)
    monomorphizedEntry.name = monomorphisedEntryName(typedEntry, typeArguments)
    monomorphizedEntry.typeParameters = undefined
    const nameToType = new Map(typedEntry.typeParameters.map((name, index) => [name, typeArguments[index]]))
    idl.updateEachChild(monomorphizedEntry, (node) => {
        if (idl.isTypeParameterType(node)) {
            if (!nameToType.has(node.name))
                throw new Error(`Can not name ${node.name} in type parameters of ${typedEntry.name}: available are ${typedEntry.typeParameters?.join(", ")}`)
            return idl.clone(nameToType.get(node.name)!)
        }
        return node
    })
    monomorphizedEntry.extendedAttributes = monomorphizedEntry.extendedAttributes?.filter(it => {
        return it.name != idl.IDLExtendedAttributes.TypeParameters
    }) ?? []
    monomorphizedEntry.extendedAttributes.push({
        name: idl.IDLExtendedAttributes.OriginalGenericName,
        value: idl.getFQName(typedEntry),
    }, {
        name: idl.IDLExtendedAttributes.TypeArguments,
        value: typeArguments.map(type => idl.printType(type)).join("|"),
    })
    inplaceRemoveMeaninglessFields(monomorphizedEntry)
    return monomorphizedEntry;
}

function hasTypeParameterTypeChild(node: idl.IDLNode): boolean {
    let result = false
    idl.forEachChild(node, (child) => {
        if (idl.isTypeParameterType(child))
            result = true
    })
    return result
}

function inplaceReferenceGenerics(
    ref: idl.IDLReferenceType,
    resolver: ReferenceResolver,
    options?: {
        ignore?: ((node: idl.IDLNode) => boolean)[]
    }
): void {
    inplaceDefaultReferenceGenerics(ref, resolver)
    if (!ref.typeArguments?.length || hasTypeParameterTypeChild(ref)) {
        return
    }
    ref.typeArguments.forEach(it => inplaceFQN(it, resolver))
    const resolved = resolver.resolveTypeReference(ref)
    if (!resolved) {
        throw new Error(`Can not resolve ${ref.name}`)
    }
    if (options?.ignore?.some(it => it(ref) || it(resolved)) || generatorConfiguration().ignoreGenerics.includes(idl.getFQName(resolved))) {
        return
    }
    if (!idl.isTypedef(resolved) && !idl.isInterface(resolved) && !idl.isCallback(resolved)) {
        throw new Error(`Unsupported generics target ${resolved.kind}`)
    }
    const inplacedRef = idl.createReferenceType(monomorphisedEntryName(resolved, ref.typeArguments))
    if (!resolver.resolveTypeReference(inplacedRef)) {
        const monomorphizedEntry = monomorphizeEntry(resolved, ref.typeArguments)
        insertEntryNearTo(monomorphizedEntry, resolved)
        inplaceGenerics(monomorphizedEntry, resolver)
        correctTransformOnSerialize(resolver, monomorphizedEntry, ref.typeArguments, options)
    }
    ref.name = inplacedRef.name
    ref.typeArguments = undefined
}

function insertEntryNearTo(entry: idl.IDLEntry, anchor: idl.IDLEntry): void {
    if (!anchor.parent) {
        throw new Error(`Entry used as anchor has not parent`)
    }
    let parentEntries: idl.IDLEntry[]
    if (idl.isFile(anchor.parent)) {
        parentEntries = anchor.parent.entries
    } else if (idl.isNamespace(anchor.parent)) {
        parentEntries = anchor.parent.members
    } else {
        throw new Error(`Can not insert entry, unknown parent kind ${anchor.parent.kind}`)
    }
    parentEntries.splice(parentEntries.indexOf(anchor), 0, entry)
    idl.linkParentBack(anchor.parent)
}

// when generic declaration has TransformOnSerialize attribute, for monomorphized entry we must update that attribute that will look
// at monomorphized TransformOnSerialize
function correctTransformOnSerialize(
    resolver: ReferenceResolver,
    monomorphizedEntry: idl.IDLEntry,
    typeArguments: idl.IDLType[],
    options?: {
        ignore?: ((node: idl.IDLNode) => boolean)[]
    },
) {
    const targetName = idl.getExtAttribute(monomorphizedEntry, idl.IDLExtendedAttributes.TransformOnSerialize)
    if (targetName === undefined) {
        return
    }
    const targetType = toIdlType("", targetName)
    if (idl.isReferenceType(targetType)) {
        targetType.typeArguments = typeArguments
        inplaceReferenceGenerics(targetType, resolver, options)
        idl.updateExtAttribute(monomorphizedEntry, idl.IDLExtendedAttributes.TransformOnSerialize, targetType.name)
    }
}

function inplaceDefaultReferenceGenerics(
    node: idl.IDLReferenceType,
    resolver: ReferenceResolver,
): void {
    const decl = resolver.resolveTypeReference(node)
    if (!decl) {
        console.error(`Can not resolve reference for inplacing default generics ${node.name} in file ${node.fileName ?? '<unknown>'}`)
        return
    }
    if (!idl.isTypedef(decl) && !idl.isInterface(decl) && !idl.isCallback(decl)) {
        return
    }
    if ((decl.typeParameters?.length ?? 0) > (node.typeArguments?.length ?? 0)) {
        const defaults: (undefined | idl.IDLType)[] = decl.extendedAttributes
            ?.find(it => it.name === idl.IDLExtendedAttributes.TypeParametersDefaults)
            ?.typesValue ?? []
        while (defaults.length < decl.typeParameters!.length) {
            defaults.unshift(undefined)
        }
        node.typeArguments ??= []
        while (decl.typeParameters!.length > node.typeArguments.length) {
            if (defaults[node.typeArguments.length] === undefined) {
                throw new Error(`Can not validate reference to ${idl.getFQName(decl)} declaration: reference has not enough generic arguments or declaration does not have enough default generic values`)
            }
            node.typeArguments.push(defaults[node.typeArguments.length]!)
        }
    }
}

function isMeaninglessFieldType(type: idl.IDLType): boolean {
    return type === idl.IDLVoidType || type === idl.IDLUndefinedType
}

function inplaceRemoveMeaninglessFields(node: idl.IDLNode, options: { recursive: boolean } = {recursive: true }): void {
    if (options.recursive) {
        idl.forEachChild(node, child => inplaceRemoveMeaninglessFields(child, { recursive: false }))
        return
    }
    if (idl.isInterface(node)) {
        node.properties = node.properties.filter(it => !isMeaninglessFieldType(it.type))
    }
    if (idl.isMethod(node)) {
        node.parameters = node.parameters.filter(it => !isMeaninglessFieldType(it.type))
    }
}