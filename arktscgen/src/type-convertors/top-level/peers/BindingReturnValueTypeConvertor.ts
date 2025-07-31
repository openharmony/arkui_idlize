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

import { TopLevelTypeConvertor } from "../TopLevelTypeConvertor"
import { Typechecker } from "../../../general/Typechecker"
import {
    IDLOptionalType,
    IDLReferenceType,
    IDLType,
    isReferenceType,
    LanguageExpression,
    LanguageWriter, throwException
} from "@idlizer/core"
import { PeersConstructions } from "../../../constuctions/PeersConstructions"
import { Config } from "../../../general/Config"
import { baseNameString } from "../../../utils/idl"

export class BindingReturnValueTypeConvertor extends TopLevelTypeConvertor<
    (writer: LanguageWriter, call: LanguageExpression) => LanguageExpression
> {
    constructor(
        typechecker: Typechecker
    ) {
        const plain = (type: IDLType) =>
            (writer: LanguageWriter, call: LanguageExpression) =>
                call
        const wrap = (wrapWith: string) =>
                (writer: LanguageWriter, call: LanguageExpression) =>
                    writer.makeFunctionCall(wrapWith, [call])
        super(typechecker, {
            sequence: (type: IDLType) =>
                wrap(PeersConstructions.arrayOfPointersToArrayOfPeers),
            string: (type: IDLType) =>
                wrap(PeersConstructions.receiveString),
            reference: (type: IDLReferenceType) =>
                this.typechecker.isHeir(type.name, Config.astNodeCommonAncestor)
                    ? wrap(PeersConstructions.unpackNonNullable)
                    : wrap(baseNameString(type.name)),
            optional: (type: IDLOptionalType) => {
                if (isReferenceType(type.type)) {
                    if (this.typechecker.isHeir(type.type.name, Config.astNodeCommonAncestor)) {
                        return wrap(PeersConstructions.unpackNullable)
                    }
                    return wrap(PeersConstructions.newOf(baseNameString(type.type.name)))
                }
                throwException(`unexpected optional of non-reference type`)
            },
            enum: plain,
            number: plain,
            void: plain,
            pointer: plain,
            boolean: plain,
            undefined: plain
        })
    }
}
