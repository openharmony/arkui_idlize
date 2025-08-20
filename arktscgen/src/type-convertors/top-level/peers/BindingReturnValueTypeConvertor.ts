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
    IDLContainerType,
    IDLInterface,
    IDLNamedNode,
    IDLOptionalType,
    IDLReferenceType,
    IDLType,
    isInterface,
    isReferenceType,
    LanguageExpression,
    LanguageWriter, throwException
} from "@idlizer/core"
import { PeersConstructions } from "../../../constuctions/PeersConstructions"
import { Config } from "../../../general/Config"
import { baseNameString } from "../../../utils/idl"
import { Importer } from "../../../printers/library/Importer"

export class BindingReturnValueTypeConvertor extends TopLevelTypeConvertor<
    (writer: LanguageWriter, call: LanguageExpression) => LanguageExpression
> {
    constructor(
        typechecker: Typechecker,
        private importer: Importer
    ) {
        const plain = (type: IDLType) =>
            (writer: LanguageWriter, call: LanguageExpression) =>
                call

        const wrap = (wrapWith: string, ...args: string[]) =>
                (writer: LanguageWriter, call: LanguageExpression) =>
                    writer.makeFunctionCall(wrapWith, [call, ...args.map(a => writer.makeString(a))])

        const isAstNode = (ref: IDLNamedNode): ref is IDLInterface =>
            (isReferenceType(ref) || isInterface(ref)) && this.typechecker.isHeir(ref, Config.astNodeCommonAncestor)

        const makeArgs = (type: IDLType): string[] => {
            const iface = isReferenceType(type)
                ? this.typechecker.resolveReference(type)
                : undefined

            if (iface && isAstNode(iface) && !this.typechecker.hasDescendants(iface)) {
                const astNodeTypeName = this.typechecker.nodeTypeName(iface)
                if (astNodeTypeName) {
                    importer.withEnumImport(Config.nodeTypeAttribute)
                    return [astNodeTypeName]
                }
            }

            return []

        }

        super(typechecker, {
            sequence: (type: IDLContainerType) =>
                wrap(PeersConstructions.arrayOfPointersToArrayOfPeers, ...makeArgs(type.elementType[0])),
            string: (type: IDLType) =>
                wrap(PeersConstructions.receiveString),
            reference: (type: IDLReferenceType) =>
                isAstNode(type)
                    ? wrap(PeersConstructions.unpackNonNullable, ...makeArgs(type))
                    : wrap(baseNameString(type.name)),
            optional: (type: IDLOptionalType) => {
                const innerType = type.type
                if (isReferenceType(innerType)) {
                    return isAstNode(innerType)
                        ? wrap(PeersConstructions.unpackNullable, ...makeArgs(innerType))
                        : wrap(PeersConstructions.newOf(baseNameString(innerType.name)))
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
