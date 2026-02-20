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
import { LibraryInterface, PeerClass, PeerLibrary, ReferenceResolver } from "@idlizer/core"
import { getSuperComponent } from './ComponentsCollector.js'
import { collectPeers } from './PeersCollector.js'
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js"

export class ModifierInfo {
    constructor(
        public readonly modifier: idl.IDLInterface | undefined,
        public readonly peer: PeerClass
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
    private modifiers?: Map<string, ModifierInfo>
    private peers: PeerClass[]

    private collectParentModifiers(modifier: ModifierInfo, newModifiers: Map<string, ModifierInfo>) {
        let parentComponent = getSuperComponent(this.library, modifier.peer.componentName)
        if (parentComponent) {
            const parentName = parentComponent.name
            if (this.modifiers?.has(parentName)) {
                modifier.parent = this.modifiers.get(parentName)!
            } else if (newModifiers.has(parentName)) {
                modifier.parent = newModifiers.get(parentName)!
            } else {
                const parentPeer = this.peers.find(peer => (peer.componentName === parentName))
                if (parentPeer) {
                    let parentModifier = new ModifierInfo(undefined, parentPeer)
                    modifier.parent = parentModifier
                    newModifiers.set(parentName, parentModifier)
                    this.collectParentModifiers(parentModifier, newModifiers)
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

    public collectModifiers(): Map<string, ModifierInfo> {
        if (this.modifiers)
            return this.modifiers!
        this.modifiers = new Map<string, ModifierInfo>()

        for (const file of this.library.files) {
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (!idl.isInterface(entry) ||
                    idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Component) ||
                    idl.isHandwritten(entry) ||
 	                peerGeneratorConfiguration().isHandWritten(entry.name)) {
                    continue
                }
                if (isModifier(entry, this.library)) {
                    const componentName = (entry.name.endsWith('Modifier')) ?
                        entry.name.substring(0, entry.name.length - 'Modifier'.length) :
                        entry.name
                    const peer = this.peers.find(peer => (peer.componentName === componentName))
                    if (peer) {
                        this.modifiers.set(componentName, new ModifierInfo(entry, peer))
                    }
                }
            }
        }
        let newModifiers = new Map<string, ModifierInfo>()
        for (let modifier of this.modifiers.values()) {
            this.collectParentModifiers(modifier, newModifiers)
        }
        for (const [newComp, newModifier] of newModifiers.entries()) {
            this.modifiers.set(newComp, newModifier)
        }
        for (let modifier of this.modifiers.values()) {
            modifier.isTrivial = this.isModifierTrivial(modifier)
        }
        return this.modifiers
    }
}

export function isModifier(entry: idl.IDLEntry, resolver: ReferenceResolver): boolean {
    if (!idl.isInterface(entry)) {
        return false
    }
    if (idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ComponentModifier)) {
        return true;
    }
    for (const ancestor of entry.inheritance) {
        const ancestorEntry = resolver.resolveTypeReference(ancestor)
        if (ancestorEntry?.name === 'AttributeModifier') {
            return true
        }
        if (ancestorEntry && isModifier(ancestorEntry, resolver)) {
            return true
        }
    }
    return false
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
