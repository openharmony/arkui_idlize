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
import { isThrows, toIdlType } from "@idlizer/core"
import { Language, LayoutNodeRole, isStaticMaterialized, maybeRestoreGenerics, isInExternalModule, isInStdlibModule, isTopLevelConflicted, getInitializerFeature, lib } from "@idlizer/core"
import { ImportFeature, ImportsCollector } from "./ImportsCollector.js"
import { createDependenciesCollector, DependenciesCollector } from "./idl/IdlDependenciesCollector.js"
import { getInternalClassName, isMaterialized, PeerLibrary, maybeTransformManagedCallback } from "@idlizer/core"

export function convertDeclToFeature(library: PeerLibrary, node: idl.IDLEntry | idl.IDLReferenceType): ImportFeature {
    const featureNameConvertor = library.createTypeNameConvertor(library.language)
    if (idl.isReferenceType(node)) {
        const decl = library.resolveTypeReference(node)
        if (!decl) {
            throw new Error(`Expected to have an entry: ${node.name}`)
        }
        return convertDeclToFeature(library, decl)
    }

    if (isInStdlibModule(node)) {
        return { module: '', feature: '' }
    }

    let feature = featureNameConvertor.convert(node).split(".")[0]
    let alias: string | undefined
    if ([Language.TS, Language.ARKTS, Language.KOTLIN].includes(library.language)) {
        if (isTopLevelConflicted(library, library.language, node)) {
            const featureNs = idl.getNamespacesPathFor(node)
            alias = feature
            feature = featureNs.at(0)?.name ?? node.name
        }
    }

    const moduleName = library.layout.resolve({
        node,
        role: LayoutNodeRole.INTERFACE
    })
    return {
        feature,
        alias,
        module: `${moduleName}`,
        isDefault: isDefaultDeclaration(node, library.language)
    }
}

export function collectDeclItself(
    library: PeerLibrary,
    node: idl.IDLEntry | idl.IDLReferenceType,
    emitter: ImportsCollector | ((entry: idl.IDLEntry | idl.IDLReferenceType) => void),
    options?: {
        includeMaterializedInternals?: boolean,
        includeTransformedCallbacks?: boolean,
    },
): void {
    if (idl.isReferenceType(node)) {
        node = library.resolveTypeReference(node) ?? node
    }
    if (idl.isSyntheticEntry(node)) {
        // TS needs no synthetic types
        if (library.language === Language.TS)
            return
        // ArkTS can inline callbacks and tuples, but not type literals
        if (library.language === Language.ARKTS && !(idl.isInterface(node) && node.subkind === idl.IDLInterfaceSubkind.AnonymousInterface))
            return
        // Kotlin can only inline callbacks
        if (library.language === Language.KOTLIN && idl.isCallback(node))
            return
    }
    if (isThrows(node, library))
        return
    if ([Language.TS, Language.ARKTS].includes(library.language)) {
        node = maybeRestoreGenerics(node, library) ?? node
        if (idl.isReferenceType(node)) {
            const decl = library.resolveTypeReference(node)
            if (decl && idl.isInterface(decl) && decl.subkind === idl.IDLInterfaceSubkind.Tuple) {
                return
            }
        }
    }
    else if (library.language === Language.KOTLIN) {
        node = maybeRestoreGenerics(node, library) ?? node
    }
    if (emitter instanceof ImportsCollector) {
        if (idl.isSyntheticEntry(node) && library.language === Language.ARKTS && library.name !== 'arkoala' // or if target is not arkoala
            ) {
            return
        }

        // import extractors for external materialized classes
        if (idl.isInterface(node) && isMaterialized(node, library) && isInExternalModule(node)) {
            emitter.addFeature("extractors", library.layout.handwrittenPackage())
        }

        const feature = convertDeclToFeature(library, node)
        if (!feature.module) {
            return
        }
        emitter.addFeature(feature.feature, feature.module, feature.alias, feature.isDefault)
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TransformOnSerialize)) {
            const targetType = toIdlType("", idl.getExtAttribute(node, idl.IDLExtendedAttributes.TransformOnSerialize)!)
            collectDeclDependencies(library, targetType, emitter, options)
        }
        if (options?.includeMaterializedInternals) {
            if (idl.isInterface(node) && isMaterialized(node, library) && !isStaticMaterialized(node, library) && !isInExternalModule(node)) {
                const ns = idl.getNamespaceName(node)
                if (ns !== '') {
                    emitter.addFeature(ns.split('.')[0], feature.module)
                } else {
                    emitter.addFeature(getInternalClassName(node.name), feature.module)
                }
            }
        }
        if (options?.includeTransformedCallbacks) {
            if (idl.isCallback(node)) {
                const maybeTransformed = maybeTransformManagedCallback(node, library)
                if (maybeTransformed)
                    collectDeclItself(library, maybeTransformed, emitter, options)
            }
        }
    } else {
        emitter(node)
    }
}

export function collectDeclDependencies(
    library: PeerLibrary,
    node: idl.IDLNode,
    emitter: ImportsCollector | ((entry: idl.IDLEntry | idl.IDLReferenceType) => void),
    options?: {
        expandTypedefs?: boolean,
        includeMaterializedInternals?: boolean,
        includeTransformedCallbacks?: boolean,
    },
    collector?: DependenciesCollector,
): void {
    collector = collector ?? createDependenciesCollector(library)
    const deps = collector.convert(node)
    if (options?.expandTypedefs) {
        for (let i = 0; i < deps.length; i++) {
            const dep = deps[i]
            if (!idl.isTypedef(dep) && !(idl.isInterface(dep) && dep.subkind === idl.IDLInterfaceSubkind.Tuple))
                continue
            for (const subDependency of collector.convert(dep)) {
                if (!deps.includes(subDependency))
                    deps.push(subDependency)
            }
        }
    }
    for (const dep of deps) {
        collectDeclItself(library, dep, emitter, {
            includeMaterializedInternals: options?.includeMaterializedInternals,
            includeTransformedCallbacks: options?.includeTransformedCallbacks,
        })
    }

    if (emitter instanceof ImportsCollector) {
        const needsConstInitializer = idl.isConstant(node) && !node.value
        const needsPropInitializer = idl.isInterface(node)
            && idl.isClassSubkind(node)
            && !isMaterialized(node, library)
            && node.properties.length > 0
        if (needsConstInitializer || needsPropInitializer) {
            emitter.addFeature(getInitializerFeature(library.language), library.layout.handwrittenPackage())
        }
    }

}


function isDefaultDeclaration(node: idl.IDLNode, lang: Language): boolean {
    if (lang !== Language.ARKTS) return false
    // Improve: handle default imports for declarations
    if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.DefaultExport)) return true
    const ns = node.parent
    if (ns && idl.isNamespace(ns) && idl.hasExtAttribute(ns, idl.IDLExtendedAttributes.DefaultExport)) return true
    return false
}