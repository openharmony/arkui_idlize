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

import * as ts from 'typescript'
import * as path from "path"
import { getOrPut, nameOrNull, renameClassToBuilderClass, renameClassToMaterialized, renameDtsToInterfaces } from "../util";
import { LanguageWriter } from "./LanguageWriters";
import { PeerLibrary } from './PeerLibrary';
import { isMaterialized } from './Materialized';
import { DeclarationNameConvertor } from './dependencies_collector';
import { PeerGeneratorConfig } from './PeerGeneratorConfig';
import { convertDeclaration } from './TypeNodeConvertor';
import { syntheticDeclarationFilename, isSyntheticDeclaration } from './synthetic_declaration';
import { isBuilderClass } from './BuilderClass';

export type ImportsCollectorFilter = (feature: string, module: string) => boolean

export class ImportsCollector {
    private readonly moduleToFeatures: Map<string, Set<string>> = new Map()
    private readonly filters: ImportsCollectorFilter[] = []

    addFeature(feature: string, module: string) {
        const dependencies = getOrPut(this.moduleToFeatures, module, () => new Set())
        dependencies.add(feature)
    }

    addFeatureByBasename(feature: string, basename: string) {
        const basenameNoExt = basename.replaceAll(path.extname(basename), '')
        this.addFeature(feature, `./${basenameNoExt}`)
    }

    addFilter(filter: ImportsCollectorFilter) {
        this.filters.push(filter)
    }

    addFilterByBasename(basename: string) {
        const basenameNoExt = basename.replaceAll(path.extname(basename), '')
        const module = `./${basenameNoExt}`
        this.addFilter((_, m) => m !== module)
    }

    print(printer: LanguageWriter) {
        this.moduleToFeatures.forEach((features, module) => {
            const filteredFeatures = Array.from(features).filter(feature => {
                return this.filters.every(it => it(feature, module))
            }).sort()
            if (filteredFeatures.length > 0)
                printer.print(`import { ${filteredFeatures.join(', ')} } from "${module}"`)
        })
    }
}

export type ImportFeature = { feature: string, module: string }

export function convertDeclToFeature(library: PeerLibrary, node: ts.Declaration): ImportFeature {
    if (isSyntheticDeclaration(node))
        return {
            feature: convertDeclaration(DeclarationNameConvertor.I, node), 
            module: `./${syntheticDeclarationFilename(node)}`
        }
    if (PeerGeneratorConfig.isConflictedDeclaration(node)) {
        const parent = node.parent
        let feature = ts.isModuleBlock(parent)
            ? parent.parent.name.text
            : convertDeclaration(DeclarationNameConvertor.I, node)
        return {
            feature: feature,
            module: './ConflictedDeclarations'
        }
    }

    if (!ts.isSourceFile(node.parent))
        throw "Expected parent of declaration to be a SourceFile"
    const originalBasename = path.basename(node.parent.fileName)
    let fileName = renameDtsToInterfaces(originalBasename, library.declarationTable.language)
    if ((ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) && !library.isComponentDeclaration(node)) {
        if (isBuilderClass(node)) {
            fileName = renameClassToBuilderClass(nameOrNull(node.name)!, library.declarationTable.language)
        } else if (isMaterialized(node)) {
            fileName = renameClassToMaterialized(nameOrNull(node.name)!, library.declarationTable.language)
        }
    }

    const basename = path.basename(fileName)
    const basenameNoExt = basename.replaceAll(path.extname(basename), '')
    return {
        feature: convertDeclaration(DeclarationNameConvertor.I, node),
        module: `./${basenameNoExt}`,
    }
}