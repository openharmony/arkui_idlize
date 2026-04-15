/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as idl from "@idlizer/core/idl"
import { LibraryInterface, PeerClass, PeerLibrary } from "@idlizer/core"
import { IdlComponentDeclaration, findComponentByDeclaration, getSuperComponent } from './ComponentsCollector.js'
import { collectPeers } from './PeersCollector.js'
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js"

export class ModifierInfo {
    constructor(
        public readonly modifier: idl.IDLInterface | undefined,
        public readonly peer: PeerClass,
        public isParent: boolean = false
    ) {}
    public isTrivial?: boolean
    public parent?: ModifierInfo
}

class ModifierCollector {
    constructor(
        private readonly library: PeerLibrary
    ) {
        this.peers = collectPeers(library)
    }
    private modifiers?: Map<IdlComponentDeclaration, ModifierInfo>
    private peers: PeerClass[]

    private collectParentModifiers(
        component: IdlComponentDeclaration,
        modifier: ModifierInfo,
        newModifiers: Map<IdlComponentDeclaration, ModifierInfo>) {
        let parentComponent = getSuperComponent(this.library, component)
        if (parentComponent) {
            if (this.modifiers?.has(parentComponent)) {
                let parentModifier = this.modifiers.get(parentComponent)!
                modifier.parent = parentModifier
                parentModifier.isParent = true
            } else if (newModifiers.has(parentComponent)) {
                let parentModifier = newModifiers.get(parentComponent)!
                modifier.parent = parentModifier
                parentModifier.isParent = true
            } else {
                const parentPeer = this.peers.find(peer => (peer.componentName === parentComponent!.name))
                if (parentPeer) {
                    let parentModifier = new ModifierInfo(undefined, parentPeer, true)
                    modifier.parent = parentModifier
                    newModifiers.set(parentComponent, parentModifier)
                    this.collectParentModifiers(parentComponent, parentModifier, newModifiers)
                }
            }
        }
    }

    private isModifierTrivial(modifierInfo: ModifierInfo): boolean {
        if (modifierInfo.isTrivial !== undefined) {
            return modifierInfo.isTrivial
        }
        const modifier = modifierInfo.modifier
        if (modifier) {
            if (modifier.constructors.length || modifier.constants.length || modifier.properties.length ||
                modifier.methods.length || modifier.callables.length) {
                return false
            }
        }
        if (modifierInfo.parent) {
            return this.isModifierTrivial(modifierInfo.parent)
        }
        return true
    }

    public collectModifiers(): Map<IdlComponentDeclaration, ModifierInfo> {
        if (this.modifiers)
            return this.modifiers!
        this.modifiers = new Map<IdlComponentDeclaration, ModifierInfo>()

        for (const file of this.library.files) {
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (!idl.isInterface(entry) ||
                    idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Component) ||
                    idl.isHandwritten(entry) ||
 	                peerGeneratorConfiguration().isHandWritten(entry.name)) {
                    continue
                }
                const componentDecl = getComponentIfModifier(entry, this.library)
                if (componentDecl) {
                    const peer = this.peers.find(peer => (peer.componentName === componentDecl.name))
                    if (peer) {
                        this.modifiers.set(componentDecl, new ModifierInfo(entry, peer))
                    }
                }
            }
        }
        let newModifiers = new Map<IdlComponentDeclaration, ModifierInfo>()
        this.modifiers.forEach((modifier, comp) => {
            this.collectParentModifiers(comp, modifier, newModifiers)
        })
        for (const [newComp, newModifier] of newModifiers.entries()) {
            this.modifiers.set(newComp, newModifier)
        }
        for (let modifier of this.modifiers.values()) {
            modifier.isTrivial = this.isModifierTrivial(modifier)
        }
        return this.modifiers
    }
}

export function isModifier(entry: idl.IDLEntry, library: LibraryInterface): boolean {
    if (!idl.isInterface(entry)) {
        return false
    }
    if (idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ComponentModifier)) {
        return true;
    }
    for (const ancestor of entry.inheritance) {
        const ancestorEntry = library.resolveTypeReference(ancestor)
        if (ancestorEntry?.name === 'AttributeModifier') {
            return true
        }
        if (ancestorEntry && isModifier(ancestorEntry, library)) {
            return true
        }
    }
    return false
}

export function getComponentIfModifier(
    entry: idl.IDLEntry,
    library: LibraryInterface): IdlComponentDeclaration | undefined {
    if (!idl.isInterface(entry)) {
        return undefined
    }
    for (const ancestor of entry.inheritance) {
        const ancestorEntry = library.resolveTypeReference(ancestor)
        if (ancestorEntry?.name === 'AttributeModifier') {
            if (ancestor.typeArguments?.length) {
                const componentRef = ancestor.typeArguments[0]
                if (idl.isReferenceType(componentRef)) {
                    let componentEntry = library.resolveTypeReference(componentRef)
                    while (componentEntry && idl.isTypedef(componentEntry)) {
                        const typedefType = componentEntry.type
                        if (idl.isReferenceType(typedefType)) {
                            componentEntry = library.resolveTypeReference(typedefType)
                        } else {
                            break
                        }
                    }
                    if (componentEntry && idl.isInterface(componentEntry)) {
                        const componentDeclaration = findComponentByDeclaration(library, componentEntry)
                        if (componentDeclaration) {
                            return componentDeclaration
                        }
                    }
                }
            }
        }
    }
    return undefined
}

export function isNonTrivialModifier(entry: idl.IDLEntry, library: PeerLibrary) {
    const modifierCollection = collectModifiers(library)
    for (const modifiers of modifierCollection.values()) {
        for (const modifier of modifiers) {
            if (modifier.modifier === entry) {
                return (modifier.isTrivial === false)
            }
        }
    }
    return false
}

let collectModifiersCache = new Map<LibraryInterface, Map<idl.IDLFile, ModifierInfo[]>>()
export function collectModifiers(library: PeerLibrary): Map<idl.IDLFile, ModifierInfo[]> {
    if (collectModifiersCache.has(library)) {
        return collectModifiersCache.get(library)!
    }
    let modifierCollector = new ModifierCollector(library)

    let modifiers = modifierCollector.collectModifiers()
    let result = new Map<idl.IDLFile, ModifierInfo[]>()
    for (const modifier of modifiers.values()) {
        const file = modifier.peer.file
        if (result.has(file)) {
            result.get(file)!.push(modifier)
        } else {
            result.set(file, [modifier])
        }
    }
    collectModifiersCache.set(library, result)
    return result
}
