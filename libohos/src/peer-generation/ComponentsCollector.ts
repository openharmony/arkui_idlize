/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { getSuper, LibraryInterface } from "@idlizer/core"
import { isDefined } from "@idlizer/core"
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js"

export class IdlComponentDeclaration {
    constructor(
        public readonly name: string,
        public readonly interfaceDeclaration: idl.IDLInterface | undefined,
        public readonly attributeDeclaration: idl.IDLInterface,
    ) {}
}

const collectComponents_cache = new Map<LibraryInterface, IdlComponentDeclaration[]>()
export function collectComponents(library: LibraryInterface): IdlComponentDeclaration[] {
    if (collectComponents_cache.has(library))
        return collectComponents_cache.get(library)!

    const components = new Array<IdlComponentDeclaration>()
    const isCollectedComponent = (entry: idl.IDLEntry): boolean => {
        return components.some(it => it.attributeDeclaration === entry || it.interfaceDeclaration === entry)
    }
    for (const file of library.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (!idl.isInterface(entry) ||
                !idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Component) ||
                idl.isHandwritten(entry) ||
                peerGeneratorConfiguration().isHandWritten(entry.name))
                continue
            const componentName = entry.name.replace("Attribute", "")
            if (peerGeneratorConfiguration().components.ignoreComponents.includes(componentName))
                continue
            const fqn = idl.deriveQualifiedNameFrom(`${componentName}Interface`, entry)
            const compInterface = library.resolveTypeReference(idl.createReferenceType(fqn), { unresolvedOk: true })
            if (!compInterface || idl.isInterface(compInterface)) {
                components.push(new IdlComponentDeclaration(componentName, compInterface, entry))
            }
        }
    }

    for (let i = 0; i < components.length; i++) {
        const attributes = components[i].attributeDeclaration
        const parentDecl = getSuper(attributes, library)
        if (!parentDecl) {
            continue
        }
        if (!idl.isInterface(parentDecl)) {
            throw new Error("Expected parent to be a class")
        }
        if (!isCollectedComponent(parentDecl)) {
            components.push(
                new IdlComponentDeclaration(parentDecl.name, undefined, parentDecl))
        }
    }
    // topological sort
    for (let i = 0; i < components.length; i++) {
        for (let j = i + 1; j < components.length; j++) {
            if (isSubclassComponent(library, components[i], components[j])) {
                components.splice(i, 0, ...components.splice(j, 1))
                i--
                break
            }
        }
    }
    collectComponents_cache.set(library, components)
    return components
}

export function isComponentDeclaration(library: LibraryInterface, decl: idl.IDLEntry): boolean {
    return collectComponents(library).some(it => it.interfaceDeclaration === decl || it.attributeDeclaration === decl)
}

export function findComponentByDeclaration(library: LibraryInterface, iface: idl.IDLInterface): IdlComponentDeclaration | undefined {
    return collectComponents(library).find(it =>
        it.interfaceDeclaration === iface || it.attributeDeclaration === iface)
}

export function findComponentByName(library: LibraryInterface, name: string): IdlComponentDeclaration | undefined {
    return collectComponents(library).find(it => it.name === name)
}

export function findComponentByType(library: LibraryInterface, type: idl.IDLType): IdlComponentDeclaration | undefined {
    return collectComponents(library).find(it =>
        idl.forceAsNamedNode(type).name === it.interfaceDeclaration?.name ||
        idl.forceAsNamedNode(type).name === it.attributeDeclaration.name)
}

function isSubclassComponent(library: LibraryInterface, a: IdlComponentDeclaration, b: IdlComponentDeclaration) {
    return isSubclass(library, a.attributeDeclaration, b.attributeDeclaration)
}

export function getSuperComponent(
    library: LibraryInterface,
    component: IdlComponentDeclaration): IdlComponentDeclaration | undefined {
    if (component.attributeDeclaration.inheritance.length) {
        const [parentRef] = component.attributeDeclaration.inheritance
        const parentDecl = library.resolveTypeReference(parentRef) as idl.IDLInterface
        return findComponentByDeclaration(library, parentDecl)
    }
    return undefined
}

function isSubclass(library: LibraryInterface, component: idl.IDLInterface, maybeParent: idl.IDLInterface): boolean {
    const parentDecl = getSuper(component, library)
    return isDefined(parentDecl) && (
        parentDecl.name === maybeParent.name ||
        idl.isInterface(parentDecl) && isSubclass(library, parentDecl, maybeParent))
}
