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
import { IdentityTransformer, lw, std } from "@idlizer/libohos";

class DepHunter extends IdentityTransformer {

    private scope: Set<string>[] = []

    constructor(
        private declarationName: string,
        private deps: Map<string, Set<string>>
    ) { super() }

    private addDep(to:string) {
        if (this.declarationName === to) {
            return
        }
        if (!this.deps.has(this.declarationName)) {
            this.deps.set(this.declarationName, new Set())
        }
        this.deps.get(this.declarationName)!.add(to)
    }
    private isLocal(name:string) {
        return !!this.scope.find(s => s.has(name))
    }

    goFunctionDeclaration(decl: lw.FunctionDeclaration): lw.FunctionDeclaration {
        this.scope.push(new Set(decl.parameters.map(param => param.name)))
        const r = super.goFunctionDeclaration(decl)
        this.scope.pop()
        return r
    }
    goCompoundStatement(stmt: lw.CompoundStatement): lw.CompoundStatement {
        this.scope.push(new Set())
        const r = super.goCompoundStatement(stmt)
        this.scope.pop()
        return r
    }
    goDeclarationStatement(stmt: lw.DeclarationStatement): lw.DeclarationStatement {
        this.scope.at(-1)?.add(stmt.varName)
        return super.goDeclarationStatement(stmt)
    }

    goValueType(type: lw.ValueType): lw.LWType {
        if (type.name.startsWith('@LW.')) {
            return type
        }
        if (type.name === std.names.types.pointer) {
            return type
        }
        this.addDep(type.name)
        return type
    }
    goVariableExpression(expr: lw.VariableExpression): lw.LWExpression {
        if (expr.name.startsWith('@')) {
            return expr
        }
        if (this.isLocal(expr.name)) {
            return expr
        }
        this.addDep(expr.name)
        return expr
    }
}

export function topSortDeclarations(decls:lw.LWDeclaration[]): lw.LWDeclaration[] {
    const deps = new Map<string, Set<string>>()
    const index = new Map<string, lw.LWDeclaration>()
    decls.forEach(decl => {
        index.set(decl.name, decl)
        deps.set(decl.name, new Set())
        new DepHunter(decl.name, deps).goDeclaration(decl)
    })

    deps.forEach(vals => {
        const shouldBeRemoved = new Set<string>()
        vals.forEach(val => {
            if (!deps.has(val)) {
                shouldBeRemoved.add(val)
            }
        })
        shouldBeRemoved.forEach(val => {
            vals.delete(val)
        })
    })

    const result: lw.LWDeclaration[] = []
    while (deps.size) {
        const removeKeys = new Set<string>()
        deps.forEach((vals, key) => {
            if (vals.size === 0) {
                result.push(index.get(key)!)
                removeKeys.add(key)
                return
            }
        })
        removeKeys.forEach(key => {
            deps.delete(key)
        })
        deps.forEach((vals) => {
            removeKeys.forEach(removed => {
                vals.delete(removed)
            })
        })
    }
    return result
}
