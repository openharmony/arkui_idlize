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

import { IDLContainerUtils, IDLType, isContainerType, isEnum, isInterface, isOptionalType, isReferenceType } from "@idlizer/core"
import { Config } from "../../general/Config"
import { Importer } from "../../printers/library/Importer"
import { fqName } from "../../utils/idl"
import { dropPrefix } from "../../utils/string"
import { BaseTypeConvertor } from "../BaseTypeConvertor"

export function convertAndImport(importer: Importer, converter: BaseTypeConvertor<string>, type: IDLType, config: Config): string {
    const result = converter.convertType(type)

    if (isOptionalType(type)) {
        const _ = convertAndImport(importer, converter, type.type, config)

    } else if (isContainerType(type) && IDLContainerUtils.isSequence(type)) {
        const _ = convertAndImport(importer, converter, type.elementType[0], config)

    } else if (isReferenceType(type)) {
        const node = converter.typechecker.resolveReference(type)
        if (node && isEnum(node)) {
            importer.withEnumImport(result)

        } else if (node && isInterface(node) && converter.typechecker.isPeer(node)){
            if (config.ignore.hasReexportReplacement(fqName(node))) {
                importer.withReexportImport(dropPrefix(type.name, Config.dataClassPrefix))
            } else {
                importer.withPeerImport(type)
            }
        }
    }

    return result
}
