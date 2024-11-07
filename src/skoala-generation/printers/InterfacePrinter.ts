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

import { LanguageWriter } from "../../peer-generation/LanguageWriters"
import { IldSkoalaFile, TSDeclConvertor, IdlSkoalaLibrary } from "../idl/idlSkoalaLibrary"
import * as idl from '../../idl'
import { convertDeclaration } from "../../peer-generation/LanguageWriters/nameConvertor"


export class TSInterfacesVisitor {
    constructor(private library: IdlSkoalaLibrary) { }

    printInterfaces(file: IldSkoalaFile, writer: LanguageWriter) {
        const typeConvertor = new TSDeclConvertor(writer, this.library)
        file.declarations.forEach(it => {
            if (!idl.isPackage(it) && !idl.isImport(it) && !idl.isModuleType(it) && !idl.isSyntheticEntry(it)) {
                convertDeclaration(typeConvertor, it)
            }
        })
    }
}
