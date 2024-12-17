import * as idl from "../idl"
import * as path from "path"
import { createFeatureNameConvertor } from "./idl/IdlNameConvertor"
import { isBuilderClass, isMaterialized, isPredefined } from "./idl/IdlPeerGeneratorVisitor"
import { ImportFeature, ImportsCollector } from "./ImportsCollector"
import { convertDeclaration } from "./LanguageWriters/nameConvertor"
import { PeerLibrary } from "./PeerLibrary"
import { renameClassToBuilderClass, renameClassToMaterialized, renameDtsToInterfaces } from "../util"
import { createDependenciesCollector } from "./idl/IdlDependenciesCollector"
import { getInternalClassName } from "./Materialized"
import { maybeTransformManagedCallback } from "./ArgConvertors"
import { isComponentDeclaration } from "./ComponentsCollector"

export const SyntheticModule = "./SyntheticDeclarations"

export function convertDeclToFeature(library: PeerLibrary, node: idl.IDLNode): ImportFeature {
    const featureNameConvertor = createFeatureNameConvertor(library.language)
    if (idl.isReferenceType(node)) {
        const decl = library.resolveTypeReference(node)
        if (decl) {
            return convertDeclToFeature(library, decl)
        }
    }
    if (!idl.isEntry(node))
        throw new Error("Expected to have an entry")
    if (idl.isSyntheticEntry(node))
        return { feature: node.name, module: SyntheticModule }

    const originalBasename = path.basename(node.fileName!)
    let fileName = renameDtsToInterfaces(originalBasename, library.language)
    if (idl.isInterface(node) && !isComponentDeclaration(library, node)) {
        if (isBuilderClass(node)) {
            fileName = renameClassToBuilderClass(node.name, library.language)
        } else if (isMaterialized(node)) {
            fileName = renameClassToMaterialized(node.name, library.language)
        }
    }

    const basename = path.basename(fileName)
    const basenameNoExt = basename.replaceAll(path.extname(basename), '')
    return {
        feature: convertDeclaration(featureNameConvertor, node),
        module: `./${basenameNoExt}`,
    }
}

export function collectDeclItself(
    library: PeerLibrary,
    node: idl.IDLNode,
    emitter: ImportsCollector | ((entry: idl.IDLNode) => void),
    options?: {
        includeMaterializedInternals?: boolean,
        includeTransformedCallbacks?: boolean,
    },
) {
    if (emitter instanceof ImportsCollector) {
        const feature = convertDeclToFeature(library, node)
        emitter.addFeature(feature.feature, feature.module)
        if (options?.includeMaterializedInternals) {
            if (idl.isInterface(node) && isMaterialized(node) && !isBuilderClass(node)) {
                emitter.addFeature(getInternalClassName(node.name), feature.module)
            }
        }
        if (options?.includeTransformedCallbacks) {
            if (idl.isCallback(node)) {
                const maybeTransformed = maybeTransformManagedCallback(node)
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
    emitter: ImportsCollector | ((entry: idl.IDLNode) => void),
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
    for (const dep of deps) {
        collectDeclItself(library, dep, emitter, {
            includeMaterializedInternals: options?.includeMaterializedInternals,
            includeTransformedCallbacks: options?.includeTransformedCallbacks,
        })
    }
}