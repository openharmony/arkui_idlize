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

import { FunctionDeclaration, IdentityTransformer, LWExpression, VariableExpression, Vs } from "@idlizer/libohos";

class Replacer extends IdentityTransformer {
    private substitution: Map<string, LWExpression> = new Map()

    goVariableExpression(expr: VariableExpression): LWExpression {
        if (this.substitution.has(expr.name)) {
            return this.substitution.get(expr.name)!
        }
        return super.goVariableExpression(expr)
    }

    goFunctionDeclaration(decl: FunctionDeclaration): FunctionDeclaration {
        if (decl.parameters.length === 0) {
            return decl
        }
        const first = decl.parameters[0]
        this.substitution.set(first.name , Vs.self)

        const clone = super.goFunctionDeclaration(decl)
        clone.parameters.shift()
        clone.implicitThisType = first.type
        return clone
    }
}

/**
 * Takes first argument and replaces it to `this`
 */
export function functionToMethod(func:FunctionDeclaration):FunctionDeclaration {
    return new Replacer().goFunctionDeclaration(func)
}
