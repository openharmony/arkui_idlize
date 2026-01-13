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

import { ClassDeclaration, FunctionDeclaration, IdentityTransformer, LWDeclaration, LWType, Md, std, ValueType } from "@idlizer/ost";

class DeclarationMaker extends IdentityTransformer {
    goClassDeclaration(decl: ClassDeclaration): ClassDeclaration {
        const mapped = super.goClassDeclaration(decl)
        mapped.modifiers =mapped.modifiers.concat(Md.declare())
        mapped.methods = mapped.methods.flatMap(method => {
            if (method.name === std.names.members.staticCtor) {
                return []
            }
            if (method.modifiers.find(x => x.name === std.names.modifiers.private)) {
                return []
            }
            method.modifiers = method.modifiers.filter(m => m.name !== std.names.modifiers.declare)
            return [method]
        })
        mapped.fields = mapped.fields.flatMap(field => {
            if (field.modifiers?.find(x => x.name === std.names.modifiers.private)) {
                return []
            }
            return [field]
        })
        return mapped
    }
    goFunctionDeclaration(decl: FunctionDeclaration): FunctionDeclaration {
        return {
            kind: decl.kind,
            annotations: decl.annotations.slice(),
            generics: decl.generics.slice(),
            modifiers: decl.modifiers.slice().concat([Md.declare()]),
            name: decl.name,
            parameters: decl.parameters.map(param => ({
                name: param.name,
                type: this.goType(param.type),
            })),
            returnType: this.goType(decl.returnType),
            body: undefined,
            implicitThisType: decl.implicitThisType ? this.goType(decl.implicitThisType) : undefined
        }
    }
}

class CollectTypeNames extends IdentityTransformer {
    constructor(
        private collection: Set<string>
    ) { super() }

    goValueType(type: ValueType): LWType {
        this.collection.add(type.name)
        return super.goValueType(type)
    }
}

export function makeDeclaration(decl:LWDeclaration, nameCollection:Set<string>): LWDeclaration {
    const mapped = new DeclarationMaker().goDeclaration(decl)
    new CollectTypeNames(nameCollection).goDeclaration(mapped)
    return mapped
}
