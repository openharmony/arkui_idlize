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
import { DeclarationTable } from "./DeclarationTable";
import { MaterializedClass } from "./Materialized";
import { PeerClass } from "./PeerClass";
import { PeerFile } from "./PeerFile";
import { ComponentDeclaration } from './PeerGeneratorVisitor';
import { BuilderClass } from './BuilderClass';
import { Language } from '../util';
import { IndentedPrinter } from '../IndentedPrinter';
import { LanguageWriter } from './LanguageWriters';

export type PeerLibraryOutput = {
    outputC: string[]
}

export class PeerLibrary {
    public readonly files: PeerFile[] = []
    public readonly builderClasses: Map<string, BuilderClass> = new Map()
    public get buildersToGenerate(): BuilderClass[] {
        return Array.from(this.builderClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get materializedToGenerate(): MaterializedClass[] {
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
    }

    constructor(
        public declarationTable: DeclarationTable,
        public componentsToGenerate: Set<string>,
    ) {}

    public get language(): Language {
        return this.declarationTable.language
    }

    generateStructs(structs: IndentedPrinter, typedefs: IndentedPrinter, writeToString: LanguageWriter) {
        this.declarationTable.generateStructs(structs, typedefs, writeToString)
    }

    readonly customComponentMethods: string[] = []
    // todo really dirty - we use it until we can generate interfaces
    // replacing import type nodes
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly componentsDeclarations: ComponentDeclaration[] = []
    readonly conflictedDeclarations: Set<ts.Declaration> = new Set()

    findPeerByComponentName(componentName: string): PeerClass | undefined {
        for (const file of this.files)
            for (const peer of file.peers.values())
                if (peer.componentName == componentName) 
                    return peer
        return undefined
    }

    findFileByOriginalFilename(filename: string): PeerFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    findComponentByDeclaration(node: ts.Declaration): ComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it => {
            return it.interfaceDeclaration === node || it.attributesDeclarations === node 
        })
    }

    isComponentDeclaration(node: ts.Declaration): boolean {
        return this.findComponentByDeclaration(node) !== undefined
    }

    shouldGenerateComponent(name: string): boolean {
        return !this.componentsToGenerate.size || this.componentsToGenerate.has(name)
    }

    setCurrentContext(context: string | undefined) {
        this.declarationTable.setCurrentContext(context)
    }
}