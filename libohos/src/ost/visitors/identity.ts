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
import * as lw from '../lws'

function over<T, U>(x:T|undefined, f:(x:T) => U): U|undefined {
  if (x === undefined) {
    return undefined
  }
  return f(x)
}

export class IdentityTransformer {
  goEnumDeclaration(decl: lw.EnumDeclaration): lw.EnumDeclaration {
    return {
      kind: decl.kind,
      generics: decl.generics,
      modifiers: decl.modifiers,
      name: decl.name,
      members: decl.members.map(m => ({
        name: m.name,
        value: m.value
      })),
    }
  }
  goStructureDeclaration(decl:lw.StructureDeclaration): lw.StructureDeclaration {
    return {
      kind: decl.kind,
      generics: decl.generics,
      modifiers: decl.modifiers,
      name: decl.name,
      members: decl.members.map(m => ({
        name: m.name,
        type: this.goType(m.type),
        modifiers: m.modifiers
      })),
    }
  }
  goClassDeclaration(decl:lw.ClassDeclaration): lw.ClassDeclaration {
    return {
      kind: decl.kind,
      generics: decl.generics,
      modifiers: decl.modifiers,
      name: decl.name,
      fields: decl.fields.map(f => ({
        name: f.name,
        type: this.goType(f.type),
        modifiers: f.modifiers
      })),
      methods: decl.methods.map(m => this.goFunctionDeclaration(m)),
      oop: over(decl.oop, oop => ({
        kind: oop.kind,
        base: over(oop.base, b => this.goType(b)),
        implementations: oop.implementations?.map(imp => this.goType(imp))
      }))
    }
  }
  goNamespaceDeclaration(decl:lw.NamespaceDeclaration): lw.NamespaceDeclaration {
    return {
      kind: decl.kind,
      name: decl.name,
      members: decl.members.map(m => this.goDeclaration(m))
    }
  }
  goTypedefDeclaration(decl:lw.TypedefDeclaration): lw.TypedefDeclaration {
    return {
      kind: decl.kind,
      generics: decl.generics,
      modifiers: decl.modifiers,
      name: decl.name,
      type: this.goType(decl.type)
    }
  }
  goFunctionDeclaration(decl:lw.FunctionDeclaration): lw.FunctionDeclaration {
    return {
      kind: decl.kind,
      generics: decl.generics,
      modifiers: decl.modifiers,
      annotations: decl.annotations.map(ann => this.goAnnotation(ann)),
      name: decl.name,
      parameters: decl.parameters.map(p => ({
        name: p.name,
        type: this.goType(p.type)
      })),
      returnType: this.goType(decl.returnType),
      body: decl.body ? this.goStatement(decl.body) : undefined
    }
  }
  goDeclaration(decl:lw.LWDeclaration): lw.LWDeclaration {
    switch (decl.kind) {
      case lw.LWKind.EnumDeclaration: return this.goEnumDeclaration(decl)
      case lw.LWKind.StructureDeclaration: return this.goStructureDeclaration(decl)
      case lw.LWKind.ClassDeclaration: return this.goClassDeclaration(decl)
      case lw.LWKind.NamespaceDeclaration: return this.goNamespaceDeclaration(decl)
      case lw.LWKind.TypedefDeclaration: return this.goTypedefDeclaration(decl)
      case lw.LWKind.FunctionDeclaration: return this.goFunctionDeclaration(decl)
    }
  }

  goDeclarationStatement(stmt:lw.DeclarationStatement): lw.DeclarationStatement {
    return {
      kind: stmt.kind,
      mutable: stmt.mutable,
      static: stmt.static,
      varName: stmt.varName,
      varType: this.goType(stmt.varType),
      expression: over(stmt.expression, e => this.goExpression(e))
    }
  }
  goCompoundStatement(stmt:lw.CompoundStatement): lw.CompoundStatement {
    return {
      kind: stmt.kind,
      statements: stmt.statements.map(s => this.goStatement(s))
    }
  }
  goExpressionStatement(stmt:lw.ExpressionStatement): lw.ExpressionStatement {
    return {
      kind: stmt.kind,
      expression: over(stmt.expression, e => this.goExpression(e))
    }
  }
  goReturnStatement(stmt:lw.ReturnStatement): lw.ReturnStatement {
    return {
      kind: stmt.kind,
      expression: over(stmt.expression, e => this.goExpression(e))
    }
  }
  goLoopStatement(stmt:lw.LoopStatement): lw.LoopStatement {
    return {
      kind: stmt.kind,
      init: over(stmt.init, i => this.goStatement(i)),
      step: over(stmt.step, s => this.goStatement(s)),
      condition: this.goExpression(stmt.condition),
      body: this.goStatement(stmt.body)
    }
  }
  goIfStatement(stmt:lw.IfStatement): lw.IfStatement {
    return {
      kind: stmt.kind,
      condition: this.goExpression(stmt.condition),
      thenBody: this.goStatement(stmt.thenBody),
      elseBody: over(stmt.elseBody, eb => this.goStatement(eb))
    }
  }
  goSwitchStatement(stmt: lw.SwitchStatement): lw.SwitchStatement {
    return {
      kind: stmt.kind,
      selector: this.goExpression(stmt.selector),
      cases: stmt.cases.map(c => ({
        value: this.goConstantExpression(c.value),
        body: c.body.map(s => this.goStatement(s))
      })),
      default: stmt.default.map(s => this.goStatement(s))
    }
  }
  goNoneStatement(stmt:lw.NoneStatement): lw.NoneStatement {
    return {
      kind: stmt.kind,
    }
  }
  goStatement(stmt:lw.LWStatement): lw.LWStatement {
    switch (stmt.kind) {
      case lw.LWKind.DeclarationStatement: return this.goDeclarationStatement(stmt)
      case lw.LWKind.CompoundStatement: return this.goCompoundStatement(stmt)
      case lw.LWKind.ExpressionStatement: return this.goExpressionStatement(stmt)
      case lw.LWKind.ReturnStatement: return this.goReturnStatement(stmt)
      case lw.LWKind.LoopStatement: return this.goLoopStatement(stmt)
      case lw.LWKind.IfStatement: return this.goIfStatement(stmt)
      case lw.LWKind.SwitchStatement: return this.goSwitchStatement(stmt)
      case lw.LWKind.NoneStatement: return this.goNoneStatement(stmt)
    }
  }

  goVariableExpression(expr:lw.VariableExpression): lw.LWExpression {
    return {
      kind: expr.kind,
      name: expr.name,
      hints: expr.hints,
    }
  }
  goConstantExpression(expr:lw.ConstantExpression): lw.ConstantExpression {
    return {
      kind: expr.kind,
      value: expr.value,
      hints: expr.hints,
    }
  }
  goStringExpression(expr:lw.StringExpression): lw.StringExpression {
    return {
      kind: expr.kind,
      value: expr.value,
      hints: expr.hints,
    }
  }
  goUnaryExpression(expr:lw.UnaryExpression): lw.UnaryExpression {
    return {
      kind: expr.kind,
      op: expr.op,
      expression: this.goExpression(expr.expression),
      hints: expr.hints,
    }
  }
  goBinaryExpression(expr:lw.BinaryExpression): lw.BinaryExpression {
    return {
      kind: expr.kind,
      op: expr.op,
      left: this.goExpression(expr.left),
      right: this.goExpression(expr.right),
      hints: expr.hints,
    }
  }
  goCallExpression(expr:lw.CallExpression): lw.CallExpression {
    return {
      kind: expr.kind,
      callee: this.goExpression(expr.callee),
      args: expr.args.map(a => this.goExpression(a)),
      typeArgs: expr.typeArgs?.map(t => this.goType(t)),
      hints: expr.hints,
    }
  }
  goAccessorExpression(expr:lw.AccessorExpression): lw.AccessorExpression {
    return {
      kind: expr.kind,
      accessor: typeof expr.accessor === 'string' ? expr.accessor : this.goExpression(expr.accessor),
      base: this.goExpression(expr.base),
      hints: expr.hints,
    }
  }
  goConstructorExpression(expr:lw.ConstructorExpression): lw.ConstructorExpression {
    return {
      kind: expr.kind,
      name: expr.name,
      args: expr.args.map(a => this.goExpression(a)),
      typeArgs: expr.typeArgs?.map(t => this.goType(t)),
      hints: expr.hints,
    }
  }
  goCastExpression(expr:lw.CheckCastExpression): lw.CheckCastExpression {
    return {
      kind: expr.kind,
      op: expr.op,
      expression: this.goExpression(expr.expression),
      type: this.goType(expr.type),
      hints: expr.hints,
    }
  }
  goExpression(expr:lw.LWExpression): lw.LWExpression {
    switch (expr.kind) {
      case lw.LWKind.VariableExpression: return this.goVariableExpression(expr)
      case lw.LWKind.ConstantExpression: return this.goConstantExpression(expr)
      case lw.LWKind.StringExpression: return this.goStringExpression(expr)
      case lw.LWKind.UnaryExpression: return this.goUnaryExpression(expr)
      case lw.LWKind.BinaryExpression: return this.goBinaryExpression(expr)
      case lw.LWKind.CallExpression: return this.goCallExpression(expr)
      case lw.LWKind.AccessorExpression: return this.goAccessorExpression(expr)
      case lw.LWKind.ConstructorExpression: return this.goConstructorExpression(expr)
      case lw.LWKind.CheckCastExpression: return this.goCastExpression(expr)
    }
  }

  goValueType(type:lw.ValueType): lw.LWType {
    return {
      kind: type.kind,
      name: type.name,
      args: type.args.map(t => this.goType(t)),
    }
  }
  goFunctionalType(type:lw.FunctionalType): lw.LWType {
    return {
      kind: type.kind,
      params: type.params.map(p => ({
        name: p.name,
        type: this.goType(p.type)
      })),
      returnType: this.goType(type.returnType)
    }
  }
  goType(type:lw.LWType): lw.LWType {
    switch (type.kind) {
      case lw.LWKind.ValueType: return this.goValueType(type)
      case lw.LWKind.FunctionalType: return this.goFunctionalType(type)
    }
  }
  goAnnotation(annotation:lw.Annotation): lw.Annotation {
    switch (annotation.kind) {
      case lw.DecoratorKind.SimpleAnnotation: return annotation
      case lw.DecoratorKind.MacroCall: return {
        kind: annotation.kind,
        name: annotation.name,
        args: annotation.args.map(arg => typeof arg === 'string' ? arg : this.goType(arg))
      }
    }
  }
}

export function transformer(...trans: IdentityTransformer[]) {
  return (input:lw.LWDeclaration[]) => {
    for (let tr of trans) {
      input = input.map(x => tr.goDeclaration(x))
    }
    return input
  }
}
