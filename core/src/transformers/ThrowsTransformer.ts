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

export function throwsTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    assertNoThrowsReferences(files)
    const transformer = new ThrowsTransformer()
    return files.map(it => transformer.visit(it)).map(idl.linkParentBack)
}

function assertNoThrowsReferences(files: idl.IDLFile[]): void {
    files.forEach(file => {
        idl.forEachChild(file, node => {
            if (idl.isReferenceType(node) && node.name === idl.IDLThrowsTypeName) {
                throw new Error(`${idl.IDLThrowsTypeName} can be referenced only in throwsTransformer. If you want to make method throwable, please add 'Throws' extended attribute to the method.`)
            }
        })
    })
}

class ThrowsTransformer extends IdlTransformer {
    visit(node: idl.IDLType): idl.IDLType
    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLParameter): idl.IDLParameter
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isMethod(node)) {
            if (!idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Throws)) {
                return this.visitEachChild(node)
            }
            if (idl.isContainerType(node.returnType) && node.returnType.containerKind === "Promise") {
                // Promises are already includes `throws` by default and do not need to have additional generation
                return this.visitEachChild(node)
            }
            return idl.createMethod(
                node.name,
                node.parameters,
                idl.createReferenceType(idl.IDLThrowsTypeName, [node.returnType]),
                {
                    isAsync: node.isAsync,
                    isFree: node.isFree,
                    isOptional: node.isOptional,
                    isStatic: node.isStatic,
                },
                idl.cloneNodeInitializer(node),
                node.typeParameters,
            )
        }
        if (idl.isCallback(node)) {
            if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Throws)) {
                return idl.createCallback(
                    node.name,
                    node.parameters.map(it => this.visit(it)),
                    idl.createReferenceType(idl.IDLThrowsTypeName, [node.returnType]),
                    idl.cloneNodeInitializer(node),
                    node.typeParameters,
                )
            }
        }
        return this.visitEachChild(node)
    }
}
