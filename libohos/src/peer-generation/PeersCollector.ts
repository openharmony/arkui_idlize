import * as path from "path"
import { ArgumentModifier, getSuper, isDefined, LibraryInterface, Method, NamedMethodSignature, PeerClass, PeerLibrary, PeerMethod, warn } from "@idlizer/core";
import * as idl from "@idlizer/core/idl"
import { collectComponents, findComponentByDeclaration, findComponentByType, IdlComponentDeclaration } from "./ComponentsCollector";
import { getMethodModifiers } from "./idl/IdlPeerGeneratorVisitor";
import { createOutArgConvertor } from "./PromiseConvertors";
import { peerGeneratorConfiguration } from "../DefaultConfiguration";

const collectPeers_cache = new Map<LibraryInterface, PeerClass[]>()
export function collectPeers(library: PeerLibrary): PeerClass[] {
    if (!collectPeers_cache.has(library))
        collectPeers_cache.set(library, collectComponents(library).map(it => generatePeer(library, it)))
    return collectPeers_cache.get(library)!
}

export function collectOrderedPeers(library: PeerLibrary): PeerClass[] {
    return Array.from(collectPeers(library)).sort((a, b) => a.componentName.localeCompare(b.componentName))
}

export function collectPeersForFile(library: PeerLibrary, file: idl.IDLFile): PeerClass[] {
    return collectPeers(library).filter(it => it.file === file)
}

function processMethodOrCallable(library: PeerLibrary, method: idl.IDLMethod | idl.IDLCallable, peer: PeerClass, parentName?: string): PeerMethod | undefined {
    if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(method.name!))
        return
    // Some method have other parents as part of their names
    // Such as the ones coming from the friend interfaces
    // E.g. ButtonInterface instead of ButtonAttribute
    const isCallSignature = idl.isCallable(method)
    const methodName = isCallSignature ? `set${peer.componentName}Options` : method.name
    const retType = method.returnType!
    const isThisRet = isCallSignature || idl.isNamedNode(retType) && (retType.name === peer.originalClassName || retType.name === "T" || retType === idl.IDLThisType)
    const originalParentName = parentName ?? peer.originalClassName!
    const argConvertors = method.parameters.map(param => library.typeConvertor(param.name, param.type, param.isOptional))
    const signature = new NamedMethodSignature(
        (isThisRet ? idl.IDLThisType : retType) ?? method.returnType!,
        method.parameters.map(it => it.type),
        method.parameters.map(it => it.name),
        undefined,
        method.parameters.map(it => it.isOptional ? ArgumentModifier.OPTIONAL : undefined)
    )
    const realRetType = isThisRet ? idl.IDLVoidType : retType
    return new PeerMethod(
        originalParentName,
        argConvertors,
        realRetType,
        isCallSignature,
        new Method(methodName!, signature, getMethodModifiers(method)),
        createOutArgConvertor(library, isThisRet ? idl.IDLVoidType : retType, argConvertors.map(it => it.param)))
}

function fillInterface(library: PeerLibrary, peer: PeerClass, iface: idl.IDLInterface) {
    peer.originalInterfaceName = iface.name
    const peerMethods = iface.callables
        .map(it => processMethodOrCallable(library, it, peer, iface?.name))
        .filter(isDefined)
    const overloadedMethods = PeerMethod.markAndGroupOverloads(peerMethods)
    peer.methods.push(...overloadedMethods)
}

function processProperty(library: PeerLibrary, prop: idl.IDLProperty, peer: PeerClass, parentName?: string): PeerMethod | undefined {
    if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(prop.name))
        return
    const originalParentName = parentName ?? peer.originalClassName!
    const argConvertor = library.typeConvertor("value", prop.type, prop.isOptional)
    const signature = new NamedMethodSignature(idl.IDLThisType, [idl.maybeOptional(prop.type, prop.isOptional)], ["value"])
    return new PeerMethod(
        originalParentName,
        [argConvertor],
        idl.IDLVoidType,
        false,
        new Method(prop.name, signature, []))
}

function processOptionAttribute(seenAttributes: Set<string>, property: idl.IDLProperty, peer: PeerClass) {
    const propName = property.name
    if (seenAttributes.has(propName)) {
        warn(`ignore seen property: ${propName}`)
        return
    }
    seenAttributes.add(propName)
    // const type = this.fixTypeLiteral(propName, property.type, peer)
    peer.attributesFields.push(property)
}

function createComponentAttributesDeclaration(clazz: idl.IDLInterface, peer: PeerClass) {
    if (peerGeneratorConfiguration().components.invalidAttributes.includes(peer.componentName)) {
        return
    }
    const seenAttributes = new Set<string>()
    clazz.properties.forEach(prop => {
        processOptionAttribute(seenAttributes, prop, peer)
    })
}

function fillClass(library: PeerLibrary, peer: PeerClass, clazz: idl.IDLInterface) {
    peer.originalClassName = clazz.name
    const parentDecl = getSuper(clazz, library)
    // TODO: should we check other parents?
    if (parentDecl) {
        const parentComponent = findComponentByDeclaration(library, parentDecl)!
        peer.originalParentName = parentDecl?.name
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

function generatePeer(library: PeerLibrary, component: IdlComponentDeclaration): PeerClass {
    if (!component.attributeDeclaration.fileName) {
        throw new Error("Expected parent of attributes to be a SourceFile, but fileName is undefined")
    }

    const originalFileName = component.attributeDeclaration.fileName
    const baseName = path.basename(originalFileName)
    const resolvedPath = path.resolve(originalFileName)

    const file = library.findFileByOriginalFilename(baseName) ||
                    library.findFileByOriginalFilename(resolvedPath)

    if (!file) {
        console.error("Available files in library:", library.files.map(f => f.fileName))
        throw new Error(`Not found a file corresponding to attributes class: ${baseName} (${resolvedPath})`)
    }

    const peer = new PeerClass(file, component.name, baseName)

    if (component.interfaceDeclaration) {
        fillInterface(library, peer, component.interfaceDeclaration)
    }

    fillClass(library, peer, component.attributeDeclaration)
    // TODO that changes ABI - some functions will not be merged. Do we want to continue with that? Or do we want to wait more
    // accurate methods merging algorithm?
    // collapseIdlEventsOverloads(this.library, peer)
    return peer
}