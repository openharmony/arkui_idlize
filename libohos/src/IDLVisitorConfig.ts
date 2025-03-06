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

import {
    identName,
    toIDLFile,
} from "@idlizer/core";
import * as idl from '@idlizer/core/idl'
import * as ts from "typescript"
import * as path from "path"


export interface IDLVisitorConfiguration {
    DeletedDeclarations: string[]
    StubbedDeclarations: string[]
    ReplacedDeclarations: Map<string, idl.IDLEntry>
    NameReplacements: Map<string, [string, string]>
    TypeReplacementsFilePath: string

    isDeletedDeclaration(name: string): boolean
    isStubbedDeclaration(name: string): boolean
    getReplacedDeclaration(name: string): idl.IDLEntry | undefined
    checkPropertyTypeReplacement(property: ts.PropertyDeclaration | ts.PropertySignature): [idl.IDLType?, idl.IDLEntry?]
    checkParameterTypeReplacement(parameter: ts.ParameterDeclaration): [idl.IDLType?, idl.IDLEntry?]
    checkTypedefReplacement(typedef: ts.TypeAliasDeclaration): [idl.IDLType?, idl.IDLEntry?]
    checkNameReplacement(name: string, file: ts.SourceFile): string
    parsePredefinedIDLFiles(pathBase: string): void

    TypeReplacementsFile: idl.IDLFile
}

export const defaultIDLVisitorConfiguration: IDLVisitorConfiguration = {
    DeletedDeclarations: [],
    StubbedDeclarations: [],
    ReplacedDeclarations: new Map<string, idl.IDLEntry>([
        ["CustomBuilder", idl.createCallback("CustomBuilder", [], idl.IDLVoidType)],
    ]),
    NameReplacements: new Map<string, [string, string]>(),
    TypeReplacementsFilePath: "",

    TypeReplacementsFile: idl.createFile([]),

    isDeletedDeclaration(name: string) {
        return this.DeletedDeclarations.includes(name)
    },
    isStubbedDeclaration(name: string) {
        return this.StubbedDeclarations.includes(name)
    },
    getReplacedDeclaration(name: string) {
        return this.ReplacedDeclarations.get(name)
    },
    checkPropertyTypeReplacement(property: ts.PropertyDeclaration | ts.PropertySignature): [idl.IDLType?, idl.IDLEntry?] {
        const parent = property.parent
        if (!ts.isClassDeclaration(parent) && !ts.isInterfaceDeclaration(parent)) return []

        const className = identName(parent.name)!
        const propertyName = identName(property.name)!
        const entries: idl.IDLInterface[] = this.TypeReplacementsFile.entries.filter((it: idl.IDLEntry) => idl.isInterface(it)) as idl.IDLInterface[]
        const result = entries.find(it => it.name === className)?.properties.find((it: idl.IDLProperty) => it.name == propertyName)
        if (result) {
            let syntheticEntry: idl.IDLEntry | undefined
            if (idl.isReferenceType(result.type)) {
                syntheticEntry = findSyntheticDeclaration(this.TypeReplacementsFile, result.type.name)
            }
            console.log(`Replaced type for ${className}.${propertyName}`)
            return [result.type, syntheticEntry]
        }

        return []
    },
    checkParameterTypeReplacement(parameter: ts.ParameterDeclaration): [idl.IDLType?, idl.IDLEntry?] {
        const method = parameter.parent
        if (!ts.isClassDeclaration(method.parent) && !ts.isInterfaceDeclaration(method.parent)) return []

        const parameterName = identName(parameter.name)!
        const methodName = identName(method.name)!
        const classOrInterfaceName = identName(method.parent.name)!
        const entries: idl.IDLInterface[] = this.TypeReplacementsFile.entries.filter((it: idl.IDLEntry) => idl.isInterface(it)) as idl.IDLInterface[]
        const result = entries.find(it => it.name === classOrInterfaceName)?.methods.find((it: idl.IDLMethod) => it.name == methodName)?.parameters.find((it: idl.IDLParameter) => it.name == parameterName)
        if (result) {
            let syntheticEntry: idl.IDLEntry | undefined
            if (idl.isReferenceType(result.type)) {
                syntheticEntry = findSyntheticDeclaration(this.TypeReplacementsFile, result.type.name)
            }
            console.log(`Replaced type for ${classOrInterfaceName}.${methodName}(...${parameterName}...)`)
            return [idl.maybeOptional(result.type, result.isOptional), syntheticEntry]
        }

        return []
    },
    checkTypedefReplacement(typedef: ts.TypeAliasDeclaration): [idl.IDLType?, idl.IDLEntry?] {
        const typename = identName(typedef.name)!
        let entries: idl.IDLTypedef[] = this.TypeReplacementsFile.entries.filter(it => idl.isTypedef(it)) as idl.IDLTypedef[]
        const result = entries.find(it => it.name == typename)
        if (result) {
            let syntheticEntry: idl.IDLEntry | undefined
            if (idl.isReferenceType(result.type)) {
                syntheticEntry = findSyntheticDeclaration(this.TypeReplacementsFile, result.type.name)
            }
            if (idl.isUnionType(result.type)) {
                result.type.name = result.name
            }
            console.log(`Replaced type for typedef ${typename}`)
            return [result.type, syntheticEntry]
        }

        return []
    },
    checkNameReplacement(name: string, file: ts.SourceFile): string {
        const filename: string = path.basename(file.fileName)
        const replacementPair = this.NameReplacements.get(filename)
        if (replacementPair) {
            if (replacementPair[0][0] === name) {
                console.log(`Replaced "${name}" with "${replacementPair[0][1]}" in ${filename}`)
                return replacementPair[0][1]
            }
        }
        return name
    },
    parsePredefinedIDLFiles(pathBase: string) {
        const typeReplacementsFile = toIDLFile(path.resolve(path.join(pathBase, this.TypeReplacementsFilePath)))
        if (typeReplacementsFile) {
            this.TypeReplacementsFile = typeReplacementsFile
        }
    }
}

function findSyntheticDeclaration(file: idl.IDLFile, declName: string): idl.IDLEntry | undefined {
    return file.entries.filter(it => idl.isSyntheticEntry(it)).find(it => it.name == declName)
}
