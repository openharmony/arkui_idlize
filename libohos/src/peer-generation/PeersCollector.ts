import * as path from "path"
import { forceAsNamedNode, getSuperType, IDLCallable, IDLConstructor, IDLFile, IDLInterface, IDLMethod, IDLProperty, IDLReferenceType, IDLThisType, IDLType, IDLVoidType, isCallable, isDefined, isNamedNode, LibraryInterface, maybeOptional, Method, NamedMethodSignature, PeerClass, PeerLibrary, PeerMethod, warn } from "@idlizer/core";
import { collectComponents, findComponentByType, IdlComponentDeclaration } from "./ComponentsCollector";
import { peerGeneratorConfiguration } from "../DefaultConfiguration";
import { getMethodModifiers } from "./idl/IdlPeerGeneratorVisitor";
import { createOutArgConvertor } from "./PromiseConvertors";

function generateSignature(
    method: IDLCallable | IDLMethod | IDLConstructor,
    returnType?: IDLType
): NamedMethodSignature {
    return new NamedMethodSignature(
        returnType ?? method.returnType!,
        method.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
        method.parameters.map(it => it.name)
    )
}

function processMethodOrCallable(library: PeerLibrary, method: IDLMethod | IDLCallable, peer: PeerClass, parentName?: string): PeerMethod | undefined {
    if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(method.name!))
        return
    // Some method have other parents as part of their names
    // Such as the ones coming from the friend interfaces
    // E.g. ButtonInterface instead of ButtonAttribute
    const isCallSignature = isCallable(method)
    const methodName = isCallSignature ? `set${peer.componentName}Options` : method.name
    const retType = method.returnType!
    const isThisRet = isCallSignature || isNamedNode(retType) && (retType.name === peer.originalClassName || retType.name === "T")
    const originalParentName = parentName ?? peer.originalClassName!
    const argConvertors = method.parameters.map(param => library.typeConvertor(param.name, param.type, param.isOptional))
    const signature = generateSignature(method, isThisRet ? IDLThisType : retType)
    const realRetType = isThisRet ? IDLVoidType : retType
    return new PeerMethod(
        originalParentName,
        argConvertors,
        realRetType,
        isCallSignature,
        new Method(methodName!, signature, getMethodModifiers(method)),
        createOutArgConvertor(library, isThisRet ? IDLVoidType : retType, argConvertors.map(it => it.param)))
}

function fillInterface(library: PeerLibrary, peer: PeerClass, iface: IDLInterface) {
    peer.originalInterfaceName = iface.name
    const peerMethods = iface.callables
        .map(it => processMethodOrCallable(library, it, peer, iface?.name))
        .filter(isDefined)
    const overloadedMethods = PeerMethod.markAndGroupOverloads(peerMethods)
    peer.methods.push(...overloadedMethods)
}

function processProperty(library: PeerLibrary, prop: IDLProperty, peer: PeerClass, parentName?: string): PeerMethod | undefined {
    if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(prop.name))
        return
    const originalParentName = parentName ?? peer.originalClassName!
    const argConvertor = library.typeConvertor("value", prop.type, prop.isOptional)
    const signature = new NamedMethodSignature(IDLThisType, [maybeOptional(prop.type, prop.isOptional)], ["value"])
    return new PeerMethod(
        originalParentName,
        [argConvertor],
        IDLVoidType,
        false,
        new Method(prop.name, signature, []))
}

function createComponentAttributesDeclaration(clazz: IDLInterface, peer: PeerClass) {
    if (peerGeneratorConfiguration().components.invalidAttributes.includes(peer.componentName)) {
        return
    }
    const seenAttributes = new Set<string>()
    clazz.properties.forEach(prop => {
        const propName = prop.name
        if (seenAttributes.has(propName)) {
            warn(`ignore seen property: ${propName}`)
            return
        }
        seenAttributes.add(propName)
        // const type = this.fixTypeLiteral(propName, property.type, peer)
        peer.attributesFields.push(prop)
    })
}

function fillClass(library: PeerLibrary, peer: PeerClass, clazz: IDLInterface) {
    peer.originalClassName = clazz.name
    const parent = getSuperType(clazz)
    if (parent) {
        const parentComponent = findComponentByType(library, parent)!
        const parentDecl = library.resolveTypeReference(parent as IDLReferenceType)
        peer.originalParentName = forceAsNamedNode(parent).name
        peer.originalParentFilename = parentDecl?.fileName
        peer.parentComponentName = parentComponent.name
    }
    const peerMethods = [
        ...clazz.properties.map(it => processProperty(library, it, peer)),
        ...clazz.methods.map(it => processMethodOrCallable(library, it, peer)),
        ].filter(isDefined)
    const overloadedMethods = PeerMethod.markAndGroupOverloads(peerMethods)
    peer.methods.push(...overloadedMethods)

    createComponentAttributesDeclaration(clazz, peer)
}

export function componentToPeer(library: PeerLibrary, component: IdlComponentDeclaration): PeerClass {
    if (!component.attributeDeclaration.fileName) {
        throw new Error("Expected parent of attributes to be a SourceFile, but fileName is undefined")
    }

    const originalFileName = component.attributeDeclaration.fileName
    const baseName = path.basename(originalFileName)

    const peer = new PeerClass(component.name, baseName)

    if (component.interfaceDeclaration) {
        fillInterface(library, peer, component.interfaceDeclaration)
    }

    fillClass(library, peer, component.attributeDeclaration)
    // TODO that changes ABI - some functions will not be merged. Do we want to continue with that? Or do we want to wait more
    // accurate methods merging algorithm?
    // collapseIdlEventsOverloads(this.library, peer)
    return peer
}

const collectPeers_cache = new Map<LibraryInterface, PeerClass[]>()
export function collectPeers(library: PeerLibrary): PeerClass[] {
    if (collectPeers_cache.has(library))
        return collectPeers_cache.get(library)!
    collectPeers_cache.set(library, collectComponents(library).map(it => componentToPeer(library, it)))
    return collectPeers_cache.get(library)!
}

export function collectFilePeers(library: PeerLibrary, file: IDLFile): PeerClass[] {
    return collectPeers(library).filter(peer => peer.originalFilename === path.basename(file.fileName!))
}