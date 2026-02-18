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
import { ReferenceResolver } from "../peer-generation/ReferenceResolver.js"
import { IdlTransformer } from "./IdlTransformer.js"

export function fqnTransformer(corpus: idl.IDLFile[], resolver: ReferenceResolver): idl.IDLFile[] {
    const transformer = new FqnTransformer(resolver)
    return corpus.map(file => transformer.visit(file)).map(idl.linkParentBack)
}

class FqnTransformer extends IdlTransformer {
    constructor(protected resolver: ReferenceResolver) {
        super()
    }

    visit<T extends idl.IDLNode>(node: T): T
    visit(node: idl.IDLNode): idl.IDLNode {
        const defaultGenericReferenceAttribute = node.extendedAttributes?.find(a => a.name === idl.IDLExtendedAttributes.TypeParametersDefaults)
        if (defaultGenericReferenceAttribute && defaultGenericReferenceAttribute.typesValue) {
            const fqVisited = defaultGenericReferenceAttribute.typesValue.map(type => {
                const tmpType = idl.clone(type)
                tmpType.parent = node
                return this.visit(tmpType)
            })
            defaultGenericReferenceAttribute.typesValue = fqVisited
            return this.visitEachChild(node)
        }
        if (idl.isReferenceType(node)) {
            const resolved = this.resolver.resolveTypeReference(node)
            if (resolved === undefined) {
                this.resolver.resolveTypeReference(node)
                throw new Error("Can not expand FQN for " + idl.DebugUtils.debugPrintType(node))
            }
            return idl.createReferenceType(
                idl.getFQName(resolved),
                node.typeArguments?.map(it => this.visit(it) as idl.IDLType),
                idl.cloneNodeInitializer(node),
            )
        }
        return this.visitEachChild(node)
    }
}
