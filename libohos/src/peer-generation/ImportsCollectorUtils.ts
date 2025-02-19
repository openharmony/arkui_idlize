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
import { createFeatureNameConvertor, Language, convertDeclaration, LayoutNodeRole } from "@idlizer/core"
import { ImportFeature, ImportsCollector } from "./ImportsCollector"
import { createDependenciesCollector } from "./idl/IdlDependenciesCollector"
import { getInternalClassName, isBuilderClass, isMaterialized, PeerLibrary, maybeTransformManagedCallback } from "@idlizer/core"

export function convertDeclToFeature(library: PeerLibrary, node: idl.IDLEntry | idl.IDLReferenceType): ImportFeature {
    const featureNameConvertor = createFeatureNameConvertor(library.language)
    if (idl.isReferenceType(node)) {
        const decl = library.resolveTypeReference(node)
        if (!decl) {
            throw new Error("Expected to have an entry")
        }
        return convertDeclToFeature(library, decl)
    }

    let feature = convertDeclaration(featureNameConvertor, node)
    const featureNs = idl.getNamespaceName(node)
    if ((library.language === Language.TS || library.language === Language.ARKTS) && featureNs !== '') {
        if (library.language !== Language.ARKTS || !idl.isEnum(node)) {
            feature = featureNs.split('.')[0]
        }
    }

    const moduleName = library.layout.resolve(node, LayoutNodeRole.INTERFACE)
    return {
        feature,
        module: `./${moduleName}`,
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
) {
    if (idl.isSyntheticEntry(node) && Language.TS === library.language)
        return
    if (emitter instanceof ImportsCollector) {
        if (idl.isSyntheticEntry(node) && library.language === Language.ARKTS && library.name !== 'arkoala' // or if target is not arkoala
            ) {
            return
        }
        const feature = convertDeclToFeature(library, node)
        emitter.addFeature(feature.feature, feature.module)
        if (options?.includeMaterializedInternals) {
            if (idl.isInterface(node) && isMaterialized(node, library) && !isBuilderClass(node)) {
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
): void {
    const collector = createDependenciesCollector(library)
    const deps = collector.convert(node)
    if (options?.expandTypedefs)
        for (let i = 0; i < deps.length; i++) {
            if (!idl.isTypedef(deps[i]))
                continue
            for (const subDependency of collector.convert(deps[i])) {
                if (!deps.includes(subDependency))
                    deps.push(subDependency)
            }
        }
    if (Language.TS === library.language) {
        // expant type literals
        for (let i = 0; i < deps.length; i++) {
            if (!idl.isInterface(deps[i]) && !idl.isSyntheticEntry(deps[i]))
                continue
            for (const subDependency of collector.convert(deps[i])) {
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
}