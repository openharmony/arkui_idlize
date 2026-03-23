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

import { IDLContainerType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType, isEnum, isTypedef } from "@idlizer/core"
import { TopLevelTypeConvertor } from "./TopLevelTypeConvertor.js"
import { Typechecker } from "../../general/Typechecker.js"
import { fqName, innerType, makeEnoughQualifiedName, makeFullyQualifiedName } from "../../utils/idl.js"
import { Config } from "../../general/Config.js"
import { fixEnumPrefix } from "../../general/common.js"

class _LibraryTypeConvertor extends TopLevelTypeConvertor<string> {
    constructor(
        typechecker: Typechecker,
    ) {
        super(typechecker, {
            enum: (type: IDLReferenceType) => type.name,
            reference: (type: IDLReferenceType) => type.name,
            sequence: (type: IDLContainerType) => `readonly ${this.convertType(innerType(type))}[]`,
            optional: (type: IDLOptionalType) => `${this.convertType(type.type)} | undefined`,
            string: (type: IDLPrimitiveType) => `string`,
            number: (type: IDLPrimitiveType) => `number`,
            void: (type: IDLPrimitiveType) => `void`,
            boolean: (type: IDLPrimitiveType) => `boolean`,
            pointer: (type: IDLPrimitiveType) => `KNativePointer`,
            undefined: (type: IDLPrimitiveType) => `undefined`
        })
    }
}

export class LibraryTypeConvertor extends _LibraryTypeConvertor {
    constructor(
        typechecker: Typechecker,
        protected fullQualified: boolean = false
    ) { super(typechecker); }

    override convertTypeReference(type: IDLReferenceType): string {
        const node = this.typechecker.resolveReference(type)
        if (node && (isEnum(node) || isTypedef(node))) {
            if (node.name.startsWith(Config.dataClassPrefix)) {
                // Improve: support enums in namespace?
                return fixEnumPrefix(node.name)
            }
        }

        const resolver = this.typechecker.resolveReference.bind(this.typechecker);
        return this.fullQualified
            ? makeFullyQualifiedName(type, resolver)
            : makeEnoughQualifiedName(type, resolver);
    }
}
