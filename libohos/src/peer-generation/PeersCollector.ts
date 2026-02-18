import * as path from "path"
import { ArgumentModifier, capitalize, getSuper, isDefined, LibraryInterface, Method, NamedMethodSignature, PeerClass, PeerLibrary, PeerMethod, PeerMethodArg, PeerMethodSignature, warn } from "@idlizer/core";
import * as idl from "@idlizer/core/idl"
import { collectComponents, findComponentByDeclaration, findComponentByType, IdlComponentDeclaration } from "./ComponentsCollector";
import { getMethodModifiers } from "./idl/IdlPeerGeneratorVisitor";
import { peerGeneratorConfiguration } from "../DefaultConfiguration";

const collectPeers_cache = new Map<LibraryInterface, PeerClass[]>()
const componentPeers_cache = new Map<LibraryInterface, Map<IdlComponentDeclaration, PeerClass>>()
export function collectPeers(library: PeerLibrary): PeerClass[] {
    if (!collectPeers_cache.has(library))
        collectPeers_cache.set(library, collectComponents(library).map(it => generatePeer(library, it)))
    return collectPeers_cache.get(library)!
}

export function findPeerByComponentDeclaration(library: PeerLibrary, component: IdlComponentDeclaration): PeerClass | undefined {
    return componentPeers_cache.get(library)?.get(component)
}

export function collectOrderedPeers(library: PeerLibrary): PeerClass[] {
    return Array.from(collectPeers(library)).sort((a, b) => a.componentName.localeCompare(b.componentName))
}

export function collectPeersForFile(library: PeerLibrary, file: idl.IDLFile): PeerClass[] {
    return collectPeers(library).filter(it => it.file === file)
}

export function extractContentParameter(method: idl.IDLMethod | idl.IDLCallable): {
    hasContentParameter: boolean,
    parameters: idl.IDLParameter[]
} {
    if (idl.isCallable(method) && method.parameters.at(-1)?.name === 'content_') {
        return {
            hasContentParameter: true,
            parameters: method.parameters.slice(0, -1)
        }
    }
    return {
        hasContentParameter: false,
        parameters: method.parameters
    }
}

function processMethodOrCallable(library: PeerLibrary, method: idl.IDLMethod | idl.IDLCallable, peer: PeerClass, parentName?: string): PeerMethod | undefined {
    if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(method.name!))
        return
    // Some method have other parents as part of their names
    // Such as the ones coming from the friend interfaces
    // E.g. ButtonInterface instead of ButtonAttribute
    const isCallSignature = idl.isCallable(method)
    const methodName = isCallSignature ? `set${capitalize(peer.componentName)}Options` : method.name
    const retType = method.returnType!
    const isThisRet = isCallSignature || idl.isNamedNode(retType) && (retType.name === peer.originalClassName || retType.name === "T" || retType === idl.IDLThisType)
    const originalParentName = parentName ?? peer.originalClassName!
    const { parameters } = extractContentParameter(method)
    const signature = new NamedMethodSignature(
        (isThisRet ? idl.IDLThisType : retType) ?? method.returnType!,
        parameters.map(it => it.type),
        parameters.map(it => it.name),
        undefined,
        parameters.map(it => it.isOptional ? ArgumentModifier.OPTIONAL : undefined)
    )
    const realRetType = isThisRet ? idl.IDLVoidType : retType
    const overloadInfo = PeerMethodSignature.mangleOverloadedName(method)
    const newMethodName = isCallSignature
        ? methodName + overloadInfo.postfix
        : `set${capitalize(overloadInfo.alias ?? (methodName + overloadInfo.postfix))}`
    if (isCallSignature) {
        peer.componentBuilderInfos.push({
            uniqueOverloadName: overloadInfo.alias ?? peer.componentName,
            peerMethodName: newMethodName,
        })
    }
    return new PeerMethod(
        method,
        new PeerMethodSignature(
            newMethodName,
            idl.getFQName(method.parent as idl.IDLInterface).split('.').concat(newMethodName).join('_'),
            signature.args.map((it, index) => new PeerMethodArg(signature.argName(index), idl.maybeOptional(it, signature.isArgOptional(index)))),
            signature.returnType,
            method.parent as idl.IDLInterface,
        ),
        originalParentName,
        realRetType,
        isCallSignature,
        isCallSignature
            ? (library.useComponentNamedOverloads ? newMethodName : methodName)
            : overloadInfo.alias ?? methodName,
        new Method(methodName!, signature, getMethodModifiers(method))
    )
}

function fillInterface(library: PeerLibrary, peer: PeerClass, iface: idl.IDLInterface) {
    peer.originalInterfaceName = iface.name
    const peerMethods = iface.callables
        .map(it => processMethodOrCallable(library, it, peer, iface?.name))
        .filter(isDefined)
    peer.methods.push(...peerMethods)
}

function processProperty(library: PeerLibrary, prop: idl.IDLProperty, peer: PeerClass, parentName?: string): PeerMethod | undefined {
    if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(prop.name))
        return
    const originalParentName = parentName ?? peer.originalClassName!
    const signature = new NamedMethodSignature(idl.IDLThisType, [idl.maybeOptional(prop.type, prop.isOptional)], ["value"])
    const overloadInfo = PeerMethodSignature.mangleOverloadedName(prop)
    const methodName = `set${capitalize(overloadInfo.alias ?? (prop.name + overloadInfo.postfix))}`
    return new PeerMethod(
        prop,
        new PeerMethodSignature(
            methodName,
            idl.getFQName(prop.parent as idl.IDLInterface).split('.').concat(methodName).join('_'),
            [new PeerMethodArg('value', idl.maybeOptional(prop.type, prop.isOptional))],
            idl.IDLVoidType,
            prop.parent as idl.IDLInterface,
        ),
        originalParentName,
        idl.IDLVoidType,
        false,
        overloadInfo.alias ?? prop.name,
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
    peer.methods.push(...peerMethods)

    createComponentAttributesDeclaration(clazz, peer)
}

function fillComponentPeersCache(library: PeerLibrary, component: IdlComponentDeclaration, peer: PeerClass) {
    if (!componentPeers_cache.has(library)) {
        componentPeers_cache.set(library, new Map<IdlComponentDeclaration, PeerClass>())
    }
    componentPeers_cache.get(library)!.set(component, peer)
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

    const peer = new PeerClass(component.attributeDeclaration, file, component.name, baseName)
    fillComponentPeersCache(library, component, peer)

    if (component.interfaceDeclaration) {
        fillInterface(library, peer, component.interfaceDeclaration)
    }

    fillClass(library, peer, component.attributeDeclaration)
    // TODO that changes ABI - some functions will not be merged. Do we want to continue with that? Or do we want to wait more
    // accurate methods merging algorithm?
    // collapseIdlEventsOverloads(this.library, peer)
    return peer
}
