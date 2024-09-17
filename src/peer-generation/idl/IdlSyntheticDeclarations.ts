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
import { ImportFeature } from '../ImportsCollector'
import * as idl from '../../idl';

const syntheticDeclarations: Map<string, {node: idl.IDLEntry, filename: string, dependencies: ImportFeature[]}> = new Map()

export function makeSyntheticDeclaration(targetFilename: string, declName: string, factory: () => idl.IDLEntry): idl.IDLEntry {
    if (!syntheticDeclarations.has(declName))
        syntheticDeclarations.set(declName, {node: factory(), filename: targetFilename, dependencies: []})
    const decl = syntheticDeclarations.get(declName)!
    if (decl.filename !== targetFilename)
        throw "Two declarations with same name were declared"
    return decl.node
}

export function addSyntheticDeclarationDependency(node: idl.IDLEntry, dependency: ImportFeature) {
    for (const decl of syntheticDeclarations.values())
        if (decl.node === node) {
            decl.dependencies.push(dependency)
            return
        }
    throw "Declaration is not synthetic"
}

export function makeSyntheticTypeAliasDeclaration(targetFilename: string, declName: string, type: idl.IDLType): idl.IDLTypedef {
    const decl = makeSyntheticDeclaration(targetFilename, declName, () => {
        return idl.createTypedef(declName, type)
    })
    if (!idl.isTypedef(decl))
        throw "Expected declaration to be a TypeAlias"
    return decl
}

export function isSyntheticDeclaration(node: idl.IDLEntry): boolean {
    for (const decl of syntheticDeclarations.values())
        if (decl.node === node)
            return true
    return false
}

export function syntheticDeclarationFilename(node: idl.IDLEntry): string {
    for (const decl of syntheticDeclarations.values())
        if (decl.node === node)
            return decl.filename
    throw "Declaration is not synthetic"
}

export function makeSyntheticDeclarationsFiles(): Map<string, {dependencies: ImportFeature[], declarations: idl.IDLEntry[]}> {
    const files = new Map<string, {dependencies: ImportFeature[], declarations: idl.IDLEntry[]}>()
    for (const decl of syntheticDeclarations.values()) {
        if (!files.has(decl.filename))
            files.set(decl.filename, {dependencies: [], declarations: []})
        files.get(decl.filename)!.declarations.push(decl.node)
        files.get(decl.filename)!.dependencies.push(...decl.dependencies)
    }
    return files
}
