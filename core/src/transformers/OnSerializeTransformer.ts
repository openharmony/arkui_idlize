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
import * as idl from "../idl"
import { IdlTransformer } from "./IdlTransformer"


export function transformOnSerializeTransformer(
    files: idl.IDLFile[],
    destinationGetter: (node: idl.IDLNode) => string | undefined,
): idl.IDLFile[] {
    const transformer = new TransformOnSerializeTransformer(destinationGetter)
    return files.map(it => transformer.visit(it)).map(idl.linkParentBack)
}

class TransformOnSerializeTransformer extends IdlTransformer {
    constructor(private destinationGetter: (node: idl.IDLNode) => string | undefined) {
        super()
    }

    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isInterface(node) || idl.isEnum(node) || idl.isTypedef(node) || idl.isCallback(node)) {
            const destination = this.destinationGetter(node)
            if (!destination) return this.visitEachChild(node)
            const nodeInitializer = idl.cloneNodeInitializer(node)
            nodeInitializer.extendedAttributes = (nodeInitializer.extendedAttributes ?? [])
                .filter(it => it.name !== idl.IDLExtendedAttributes.TransformOnSerialize)
                .concat({ name: idl.IDLExtendedAttributes.TransformOnSerialize, value: destination })
            if (idl.isInterface(node)) return idl.createInterface(
                node.name,
                node.subkind,
                node.inheritance,
                node.constructors,
                node.constants,
                node.properties,
                node.methods,
                node.callables,
                node.typeParameters,
                nodeInitializer,
            )
            if (idl.isEnum(node)) return idl.createEnum(
                node.name,
                node.elements,
                nodeInitializer
            )
            if (idl.isTypedef(node)) return idl.createTypedef(
                node.name,
                node.type,
                node.typeParameters,
                nodeInitializer,
            )
            if (idl.isCallback(node)) return idl.createCallback(
                node.name,
                node.parameters,
                node.returnType,
                nodeInitializer,
                node.typeParameters,
            )
        }
        return this.visitEachChild(node)
    }
}