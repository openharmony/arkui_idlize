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
import * as idl from "../idl/index.js"
import { IdlTransformer } from "./IdlTransformer.js"

export function nullsTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const transformer = new NullsTransformer()
    return files.map(it => transformer.visit(it)).map(idl.linkParentBack)
}

class NullsTransformer extends IdlTransformer {
    visit(node: idl.IDLType): idl.IDLType
    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isOptionalType(node)) {
            if (idl.isUnionType(node.type) && node.type.types.some(isNullReference)) {
                const unionTypes = node.type.types.filter(it => !isNullReference(it)).map(it => this.visit(it))
                const unionName = idl.generateSyntheticUnionName(unionTypes)
                const extendedAttributes = (node.extendedAttributes ?? [])
                    .concat({ name: idl.IDLExtendedAttributes.UnionWithNull })
                return idl.createOptionalType(
                    unionTypes.length === 1
                        ? unionTypes[0]
                        : idl.createUnionType(unionTypes, unionName, idl.cloneNodeInitializer(node.type)),
                    {
                        documentation: node.documentation,
                        extendedAttributes,
                        fileName: node.fileName,
                    }
                )
            }
        } else if (idl.isUnionType(node)) {
            if (node.types.some(isNullReference)) {
                const unionTypes = node.types.filter(it => !isNullReference(it)).map(it => this.visit(it))
                const unionName = idl.generateSyntheticUnionName(unionTypes)
                return idl.createOptionalType(
                    unionTypes.length === 1 ? unionTypes[0] : idl.createUnionType(
                        unionTypes,
                        unionName,
                        idl.cloneNodeInitializer(node),
                    ),
                    { extendedAttributes: [{ name: idl.IDLExtendedAttributes.UnionOnlyNull }] },
                )
            }
        }
        return this.visitEachChild(node)
    }
}

function isNullReference(node: idl.IDLNode): boolean {
    return idl.isReferenceType(node) && node.name === idl.IDLNullTypeName
}