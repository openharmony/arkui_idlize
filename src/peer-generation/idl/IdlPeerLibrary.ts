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

import * as idl from '../../idl';
import { BuilderClass } from '../BuilderClass';
import { MaterializedClass } from "../Materialized";
import { IdlComponentDeclaration } from './IdlPeerGeneratorVisitor';
import { IdlPeerClass } from "./IdlPeerClass";
import { IdlPeerFile } from "./IdlPeerFile";
import { TSTypeNameConvertor } from './IdlTypeNameConvertor';
import { isDefined, Language } from '../../util';

export type IdlPeerLibraryOutput = {
    outputC: string[]
}

export class IdlPeerLibrary {
    public readonly files: IdlPeerFile[] = []
    public readonly builderClasses: Map<string, BuilderClass> = new Map()
    public get buildersToGenerate(): BuilderClass[] {
        return Array.from(this.builderClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get materializedToGenerate(): MaterializedClass[] {
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
    }

    constructor(
        public language: Language,
        public componentsToGenerate: Set<string>,
    ) {}

    readonly customComponentMethods: string[] = []
    // todo really dirty - we use it until we can generate interfaces
    // replacing import type nodes
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly componentsDeclarations: IdlComponentDeclaration[] = []
    readonly conflictedDeclarations: Set<idl.IDLEntry> = new Set()
    readonly nameConvertorInstance = new TSTypeNameConvertor(this)

    findPeerByComponentName(componentName: string): IdlPeerClass | undefined {
        for (const file of this.files)
            for (const peer of file.peers.values())
                if (peer.componentName == componentName) 
                    return peer
        return undefined
    }

    findFileByOriginalFilename(filename: string): IdlPeerFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    findComponentByDeclaration(iface: idl.IDLInterface): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration === iface || it.attributesDeclarations === iface)
    }

    findComponentByType(type: idl.IDLType): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration?.name === type.name || it.attributesDeclarations.name === type.name)
    }

    isComponentDeclaration(iface: idl.IDLInterface): boolean {
        return this.findComponentByDeclaration(iface) !== undefined
    }

    shouldGenerateComponent(name: string): boolean {
        return !this.componentsToGenerate.size || this.componentsToGenerate.has(name)
    }

    mapType(type: idl.IDLType | undefined): string {
        return this.nameConvertorInstance.convert(type ?? idl.createVoidType())
    }

    ///need EnumType?
    resolveTypeReference(type: idl.IDLEnumType | idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        entries ??= this.files.flatMap(it => it.entries)
        const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier);
        if (qualifier) {
            // This is a namespace or enum member. Try enum first
            const parent = this.resolveTypeReference(idl.createReferenceType(qualifier), entries)///oh oh, just entries.find?
            if (parent && idl.isEnum(parent))
                return parent.elements.find(it => it.name === type.name)
            // Else try namespaces
            return entries.find(it =>
                it.name === type.name && idl.getExtAttribute(it, idl.IDLExtendedAttributes.Namespace) === qualifier)
        }
        const result = entries.find(it =>
            it.name === type.name && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Namespace))
        return result ??
            entries
                .map(it => it.scope)
                .filter(isDefined)
                .flat()
                .find(it => it.name === type.name)
    }

    // TODO temporary, needed for unification with PeerLibrary
    setCurrentContext(context: string | undefined) {
    }
}
