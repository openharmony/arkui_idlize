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

import { createReferenceType, forEachChild, IDLEntry, IDLFile, IDLType, isEnum, isImport, isInterface, isReferenceType, isType, linearizeNamespaceMembers } from "@idlizer/core/idl"
import { ProjectConfig } from "./config"
import { Tracker } from "./tracker"
import { IDLFileLibrary } from "@idlizer/kit"

export class GeneratorLibrary extends IDLFileLibrary {
    constructor(
        files: IDLFile[],
        public config: ProjectConfig
    ) {
        super(files)
    }

    public tracker = new Tracker()


    rootDeclarations() {
        return this.files
            .flatMap(file => linearizeNamespaceMembers(file.entries))
            .filter(decl => isInterface(decl) || isEnum(decl))
            .map(decl => createReferenceType(decl))
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
