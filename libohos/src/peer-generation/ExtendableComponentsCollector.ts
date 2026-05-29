/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
import { PeerLibrary } from "@idlizer/core"
import { findComponentByDeclaration, getSuperComponent, IdlComponentDeclaration } from "./ComponentsCollector.js"
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js"

export class ExtendableComponentInfo {
    constructor(
        public readonly extendableComponent: idl.IDLInterface | undefined,
        public readonly componentName: string
    ) {}
    
}

let collectExtendableComponentsCache = new Map<PeerLibrary, ExtendableComponentInfo[]>()
export function collectExtendableComponents(library: PeerLibrary): ExtendableComponentInfo[] {
    if (collectExtendableComponentsCache.has(library)) {
        return collectExtendableComponentsCache.get(library)!
    }
    const extendableFQNs = peerGeneratorConfiguration().extendableComponents
    let result: ExtendableComponentInfo[] = []
    let implementableComponents = new Set<string>()
    for (const file of library.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (!idl.isInterface(entry) ||
                idl.isHandwritten(entry) ||
                idl.isNativeOnly(entry) ||
                peerGeneratorConfiguration().isHandWritten(entry.name))
                continue
            
            const fqn = idl.getFQNameSafe(entry)
            if (fqn && extendableFQNs.includes(fqn)) {
                let compDecl: IdlComponentDeclaration | undefined = undefined
                for (const implementableComp of entry.inheritance) {
                    const compResolved = library.resolveTypeReference(implementableComp)

                    if (compResolved === undefined || !idl.isInterface(compResolved))
                        continue
                    compDecl = findComponentByDeclaration(library, compResolved)
                    if (compDecl) {
                        result.push(new ExtendableComponentInfo(entry, compDecl.name))
                        implementableComponents.add(compDecl.name)
                        break
                    }
                }
            }
        }
    }
    for (const implementableComponent of implementableComponents) {
        let superComp = getSuperComponent(library, implementableComponent)
        while (superComp) {
            if (result.find(extCompInfo => extCompInfo.componentName == superComp!.name) === undefined) {
                result.push(new ExtendableComponentInfo(undefined, superComp.name))
            }
            superComp = getSuperComponent(library, superComp.name)
        }
    }
    collectExtendableComponentsCache.set(library, result)
    return result
}
