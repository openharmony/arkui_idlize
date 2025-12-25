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

const collectModifiers_cache = new Map<PeerLibrary, ModifierInfo[]>()
function collectModifiers(library: PeerLibrary): ModifierInfo[] {
    if (collectModifiers_cache.has(library)) {
        return collectModifiers_cache.get(library)!
    }

    const peers = collectPeers(library)
    let modifiers = new Map<string, ModifierInfo>()
    let parentComponents = new Set<string>

    for (const file of library.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (!idl.isInterface(entry) || idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Component)) {
                continue
            }
            if (!entry.name.endsWith("Modifier") || idl.isHandwritten(entry)) {
                continue
            }
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
    for (const componentName of parentComponents) {
        if (!modifiers.has(componentName)) {
            const peer = peers.find(peer => (peer.componentName === componentName))
            if (peer) {
                modifiers.set(componentName, new ModifierInfo(undefined, peer))
            }
        }
    }
    const result = [...modifiers.values()]
    collectModifiers_cache.set(library, result)
    return result
}

export function collectModifiersForFile(library: PeerLibrary, file: idl.IDLFile): ModifierInfo[] {
    return collectModifiers(library).filter(modifierInfo => {
        return modifierInfo.peer.file === file
    })
}
