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
import { PeerClass, PeerLibrary } from "@idlizer/core"
import { getSuperComponent } from './ComponentsCollector'
import { collectPeers } from './PeersCollector'

export class ModifierInfo {
    constructor(
        public readonly modifier: idl.IDLInterface | undefined,
        public readonly peer: PeerClass
    ) {}
}

export function collectModifiers(library: PeerLibrary): Map<idl.IDLFile, ModifierInfo[]> {
    const peers = collectPeers(library)
    let modifiers = new Map<string, ModifierInfo>()
    let parentComponents = new Set<string>

    for (const file of library.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (!idl.isInterface(entry) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Component) ||
                idl.isHandwritten(entry)) {
                continue
            }
            if (idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ComponentModifier) ||
                entry.name.endsWith("Modifier")) {
                const componentName = entry.name.substring(0, entry.name.length - "Modifier".length)
                const peer = peers.find(peer => {
                    return peer.componentName === componentName
                })
                if (peer) {
                    modifiers.set(componentName, new ModifierInfo(entry, peer))
                    let parentComponent = getSuperComponent(library, componentName)
                    while (parentComponent) {
                        parentComponents.add(parentComponent.name)
                        parentComponent = getSuperComponent(library, parentComponent.name)
                    }
                }
            }
        }
    }
    for (const componentName of parentComponents) {
        if (!modifiers.has(componentName)) {
            const peer = peers.find(peer => (peer.componentName === componentName))
            if (peer) {
                modifiers.set(componentName, new ModifierInfo(undefined, peer))
            }
        }
    }
    let result = new Map<idl.IDLFile, ModifierInfo[]>()
    for (const modifier of modifiers.values()) {
        const file = modifier.peer.file
        if (result.has(file)) {
            result.get(file)!.push(modifier)
        } else {
            result.set(file, [modifier])
        }
    }
    return result
}
