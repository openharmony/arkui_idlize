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

import { createAlgotithmicReferenceResolver } from "@idlizer/core"
import { createReferenceType, forEachChild, getFQName, IDLEntry, IDLFile, IDLReferenceType, IDLType, isEnum, isImport, isInterface, isReferenceType, isType, isTypedef, linearizeNamespaceMembers } from "@idlizer/core/idl"
import { terminate } from "../../cli/error"
import { ProjectConfig } from "./config"
import { Tracker } from "./tracker"

export class IDLLibrary {
    constructor(
        public files: IDLFile[],
        public index: Map<string, IDLEntry>,
        public config: ProjectConfig
    ) {}

    public tracker = new Tracker()

    toDeclarationSafe(reference:IDLReferenceType) {
        return this.index.get(reference.name)
    }

    toDeclaration(reference:IDLReferenceType) {
        return this.toDeclarationSafe(reference) ?? terminate(`Reference was not found! "${reference.name}" `)
    }

    followTypedefs(type:IDLType): IDLType {
        if (isReferenceType(type)) {
            const found = this.toDeclarationSafe(type)
            if (found && isTypedef(found)) {
                return this.followTypedefs(found.type)
            }
        }
        return type
    }

    rootDeclarations() {
        return this.files
            .flatMap(file => linearizeNamespaceMembers(file.entries))
            .filter(decl => isInterface(decl) || isEnum(decl))
            .map(decl => createReferenceType(decl))
    }

    allPackages(more?:string[]) {
        return new Set(this.files.map(file => file.packageClause.join('.')).concat(more ?? []))
    }

    ///

    isCustom(type:IDLType): boolean {
        type = this.followTypedefs(type)
        const test = (type:IDLType) => isReferenceType(type) && this.config.declarations.custom.includes(type.name)
        let found = false
        forEachChild(type, node => {
            if (isType(node) && test(node)) {
                found = true
            }
        })
        return found
    }

    ///

    prepareReport() {
        return this.tracker.prepareReport(
            'State of ' + this.config.name,
            this.files
                .flatMap(file => linearizeNamespaceMembers(file.entries))
                .filter(entry => !isImport(entry))
        )
    }
}

export function createLibrary(files: IDLFile[], projectConfig:ProjectConfig): IDLLibrary {

    const index = new Map<string, IDLEntry>()
    linearizeNamespaceMembers(files.flatMap(file => file.entries)).forEach(entry => {
        if (isImport(entry)) {
            return
        }
        index.set(getFQName(entry), entry)
    })

    const resolver = createAlgotithmicReferenceResolver(files, true)
    files.forEach(file => {
        forEachChild(file, (node) => {
            if (isReferenceType(node)) {
                const decl = resolver.resolveTypeReference(node)
                if (decl) {
                    node.name = getFQName(decl)
                }
            }
        })
    })

    return new IDLLibrary(files, index, projectConfig)
}

