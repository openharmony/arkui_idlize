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

export const E = {
  v: (name: string, hints: lw.Hint[] = []): lw.VariableExpression => ({
    kind: lw.LWKind.VariableExpression,
    name,
    hints,
  }),
  c: (value: string | number, hints: lw.Hint[] = []): lw.ConstantExpression => ({
    kind: lw.LWKind.ConstantExpression,
    value: value.toString(),
    hints,
  }),
  s: (value: string, hints: lw.Hint[] = []): lw.StringExpression => ({
    kind: lw.LWKind.StringExpression,
    value,
    hints,
  }),
  unary: (op: string, expression: lw.LWExpression, hints: lw.Hint[] = []): lw.UnaryExpression => ({
    kind: lw.LWKind.UnaryExpression,
    expression,
    op,
    hints,
  }),
  bin: (op: string, left: lw.LWExpression, right: lw.LWExpression, hints: lw.Hint[] = []): lw.BinaryExpression => ({
    kind: lw.LWKind.BinaryExpression,
    op,
    left,
    right,
    hints,
  }),
  call: (callee: lw.LWExpression, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.CallExpression => ({
    kind: lw.LWKind.CallExpression,
    args,
    callee,
    typeArgs,
    hints,
  }),
  get: (base: lw.LWExpression, accessor: string | lw.LWExpression, hints: lw.Hint[] = []): lw.AccessorExpression => ({
    kind: lw.LWKind.AccessorExpression,
    base,
    accessor,
    hints,
  }),
  instance: (name: string, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      name,
      typeArgs
    },
    hints,
  }),
  instance2: (type: lw.LWType, args: lw.LWExpression[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      type
    },
    hints,
  }),
  cast: (expression: lw.LWExpression, type: lw.LWType, hints: lw.Hint[] = []): lw.CheckCastExpression => ({
    kind: lw.LWKind.CheckCastExpression,
    expression,
    op: 'cast',
    type,
    hints,
  }),
  lambda: (parameters: lw.LambdaExpression['parameters'], body:lw.LWStatement, closure:string[] | undefined = undefined, hints: lw.Hint[] = []): lw.LambdaExpression => ({
    kind: lw.LWKind.LambdaExpression,
    parameters,
    body,
    closure,
    hints,
  }),
  type: (type: lw.LWType, hints: lw.Hint[] = []): lw.TypeExpression => ({
    kind: lw.LWKind.TypeExpression,
    type,
    hints,
  }),
  hole: (data: unknown): lw.HoleExpression => ({
    kind: lw.LWKind.HoleExpression,
    data,
    hints: [],
  })
}

export const S = {
  declaration: (varName: string, varType: lw.LWType, mutable: boolean, expression?: lw.LWExpression, isStatic?: boolean): lw.DeclarationStatement => ({
    kind: lw.LWKind.DeclarationStatement,
    varName,
    varType,
    mutable,
    static: isStatic ?? false,
    expression,
  }),
  block: (statements: lw.LWStatement[]): lw.CompoundStatement => ({
    kind: lw.LWKind.CompoundStatement,
    statements,
  }),
  e: (expression?: lw.LWExpression): lw.ExpressionStatement => ({
    kind: lw.LWKind.ExpressionStatement,
    expression,
  }),
  return: (expression?: lw.LWExpression): lw.ReturnStatement => ({
    kind: lw.LWKind.ReturnStatement,
    expression,
  }),
  loop: (condition: lw.LWExpression, body: lw.LWStatement, init?: lw.LWStatement, step?: lw.LWStatement): lw.LoopStatement => ({
    kind: lw.LWKind.LoopStatement,
    init,
    step,
    condition,
    body,
  }),
  if: (condition: lw.LWExpression, thenBody: lw.LWStatement, elseBody?: lw.LWStatement): lw.IfStatement => ({
    kind: lw.LWKind.IfStatement,
    condition,
    thenBody,
    elseBody,
  }),
  none: (): lw.NoneStatement => ({
    kind: lw.LWKind.NoneStatement
  }),
}

export const T = {
  c: (name: string, ...args: lw.LWType[]): lw.ValueType => ({
    kind: lw.LWKind.ValueType,
    name,
    args,
  }),
  fn: (params: [name: string, type: lw.LWType][], returnType: lw.LWType): lw.FunctionalType => ({
    kind: lw.LWKind.FunctionalType,
    params: params.map(([name, type]) => ({ name, type })),
    returnType
  }),
  hole: (data: unknown): lw.HoleType => ({
    kind: lw.LWKind.HoleType,
    data,
  })
}

interface DDOptions {
  generics?: lw.GenericDescriptor[]
  modifiers?: lw.Modifier[]
}

export const DD = ({ generics = [], modifiers = [] }: DDOptions) => ({
  enum: (name: string, members: lw.EnumDeclaration['members']): lw.EnumDeclaration => ({
    kind: lw.LWKind.EnumDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  struct: (name: string, members: lw.StructureDeclaration['members']): lw.StructureDeclaration => ({
    kind: lw.LWKind.StructureDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  class: (name: string, fields: lw.ClassDeclaration['fields'], methods: lw.FunctionDeclaration[], more?: lw.ClassDeclaration['oop']): lw.ClassDeclaration => ({
    kind: lw.LWKind.ClassDeclaration,
    generics,
    modifiers,
    name,
    fields,
    methods,
    oop: more
  }),
  ns: (name: string, members: lw.LWDeclaration[]): lw.NamespaceDeclaration => ({
    kind: lw.LWKind.NamespaceDeclaration,
    name,
    members,
  }),
  type: (name: string, type: lw.LWType): lw.TypedefDeclaration => ({
    kind: lw.LWKind.TypedefDeclaration,
    generics,
    modifiers,
    name,
    type,
  }),
  func: (name: string, inputParameters: lw.FunctionDeclaration['parameters'] | { implicitThisType?: lw.LWType, parameters: lw.FunctionDeclaration['parameters'] }, returnType: lw.LWType, body?: lw.LWStatement, annotations: lw.Annotation[] = []): lw.FunctionDeclaration => {
    const { implicitThisType, parameters } = 'parameters' in inputParameters ? inputParameters : { parameters: inputParameters, implicitThisType: undefined }
    return {
      kind: lw.LWKind.FunctionDeclaration,
      generics,
      modifiers,
      annotations,
      name,
      implicitThisType,
      parameters,
      returnType,
      body,
    }
  },
  expr: (expression: lw.LWExpression): lw.TopLevelExpression => ({
    kind: lw.LWKind.TopLevelExpression,
    name: '$$TOP$$LEVEL$$EXPRESSION' + Date.now().toFixed(0) + (Math.random() * 1000000).toFixed(0),
    generics: [],
    expression,
  })
})
export const D = DD({})

export const utils = {
  hasHint(node: lw.LWExpression, hint: string) {
    return node.hints.find(x => x.name === hint)
  },
  getHint(node: lw.LWExpression, hint: string) {
    return node.hints.find(x => x.name === hint)?.value
  }
}
