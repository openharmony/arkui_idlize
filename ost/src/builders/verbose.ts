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

/**
 * Verbose builder functions for creating LW AST nodes with explicit names.
 * These builders are intended to be more readable than the original shorthand builders.
 * Use `ExpressionBuilders`, `StatementBuilders`, `TypeBuilders`, `createDeclarationBuilder`,
 * or the aliases `VE`, `VS`, `VT`, `VD`, `VDD` (mirroring original E, S, T, D, DD).
 */
import * as lw from '../lws'

export const ExpressionBuilders = {
  makeVariable: (name: string, hints: lw.Hint[] = []): lw.VariableExpression => ({
    kind: lw.LWKind.VariableExpression,
    name,
    hints,
  }),
  makeConstant: (value: string | number, hints: lw.Hint[] = []): lw.ConstantExpression => ({
    kind: lw.LWKind.ConstantExpression,
    value: value.toString(),
    hints,
  }),
  makeString: (value: string, hints: lw.Hint[] = []): lw.StringExpression => ({
    kind: lw.LWKind.StringExpression,
    value,
    hints,
  }),
  makeUnary: (op: string, expression: lw.LWExpression, hints: lw.Hint[] = []): lw.UnaryExpression => ({
    kind: lw.LWKind.UnaryExpression,
    expression,
    op,
    hints,
  }),
  makeBinary: (op: string, left: lw.LWExpression, right: lw.LWExpression, hints: lw.Hint[] = []): lw.BinaryExpression => ({
    kind: lw.LWKind.BinaryExpression,
    op,
    left,
    right,
    hints,
  }),
  makeCall: (callee: lw.LWExpression, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.CallExpression => ({
    kind: lw.LWKind.CallExpression,
    args,
    callee,
    typeArgs,
    hints,
  }),
  makeAccessor: (base: lw.LWExpression, accessor: string | lw.LWExpression, hints: lw.Hint[] = []): lw.AccessorExpression => ({
    kind: lw.LWKind.AccessorExpression,
    base,
    accessor,
    hints,
  }),
  makeConstructor: (name: string, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      name,
      typeArgs
    },
    hints,
  }),
  makeConstructorFromType: (type: lw.LWType, args: lw.LWExpression[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      type
    },
    hints,
  }),
  makeCast: (expression: lw.LWExpression, type: lw.LWType, hints: lw.Hint[] = []): lw.CheckCastExpression => ({
    kind: lw.LWKind.CheckCastExpression,
    expression,
    op: 'cast',
    type,
    hints,
  }),
  makeLambda: (parameters: lw.LambdaExpression['parameters'], body: lw.LWStatement, closure: string[] | undefined = undefined, hints: lw.Hint[] = []): lw.LambdaExpression => ({
    kind: lw.LWKind.LambdaExpression,
    parameters,
    body,
    closure,
    hints,
  }),
  makeType: (type: lw.LWType, hints: lw.Hint[] = []): lw.TypeExpression => ({
    kind: lw.LWKind.TypeExpression,
    type,
    hints,
  }),
  makeHole: (data: unknown): lw.HoleExpression => ({
    kind: lw.LWKind.HoleExpression,
    data,
    hints: [],
  })
}

export const StatementBuilders = {
  makeDeclaration: (varName: string, varType: lw.LWType, mutable: boolean, expression?: lw.LWExpression, isStatic?: boolean): lw.DeclarationStatement => ({
    kind: lw.LWKind.DeclarationStatement,
    varName,
    varType,
    mutable,
    static: isStatic ?? false,
    expression,
  }),
  makeBlock: (statements: lw.LWStatement[]): lw.CompoundStatement => ({
    kind: lw.LWKind.CompoundStatement,
    statements,
  }),
  makeExpression: (expression?: lw.LWExpression): lw.ExpressionStatement => ({
    kind: lw.LWKind.ExpressionStatement,
    expression,
  }),
  makeReturn: (expression?: lw.LWExpression): lw.ReturnStatement => ({
    kind: lw.LWKind.ReturnStatement,
    expression,
  }),
  makeLoop: (condition: lw.LWExpression, body: lw.LWStatement, init?: lw.LWStatement, step?: lw.LWStatement): lw.LoopStatement => ({
    kind: lw.LWKind.LoopStatement,
    init,
    step,
    condition,
    body,
  }),
  makeIf: (condition: lw.LWExpression, thenBody: lw.LWStatement, elseBody?: lw.LWStatement): lw.IfStatement => ({
    kind: lw.LWKind.IfStatement,
    condition,
    thenBody,
    elseBody,
  }),
  makeNone: (): lw.NoneStatement => ({
    kind: lw.LWKind.NoneStatement
  }),
}

export const TypeBuilders = {
  makeValueType: (name: string, ...args: lw.LWType[]): lw.ValueType => ({
    kind: lw.LWKind.ValueType,
    name,
    args,
  }),
  makeFunctionalType: (params: [name: string, type: lw.LWType][], returnType: lw.LWType): lw.FunctionalType => ({
    kind: lw.LWKind.FunctionalType,
    params: params.map(([name, type]) => ({ name, type })),
    returnType
  }),
  makeHoleType: (data: unknown): lw.HoleType => ({
    kind: lw.LWKind.HoleType,
    data,
  })
}

interface DeclarationBuilderOptions {
  generics?: lw.GenericDescriptor[]
  modifiers?: lw.Modifier[]
}

export const createDeclarationBuilder = ({ generics = [], modifiers = [] }: DeclarationBuilderOptions) => ({
  makeEnum: (name: string, members: lw.EnumDeclaration['members']): lw.EnumDeclaration => ({
    kind: lw.LWKind.EnumDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  makeStruct: (name: string, members: lw.StructureDeclaration['members']): lw.StructureDeclaration => ({
    kind: lw.LWKind.StructureDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  makeClass: (name: string, fields: lw.ClassDeclaration['fields'], methods: lw.FunctionDeclaration[], more?: lw.ClassDeclaration['oop']): lw.ClassDeclaration => ({
    kind: lw.LWKind.ClassDeclaration,
    generics,
    modifiers,
    name,
    fields,
    methods,
    oop: more
  }),
  makeNamespace: (name: string, members: lw.LWDeclaration[]): lw.NamespaceDeclaration => ({
    kind: lw.LWKind.NamespaceDeclaration,
    name,
    members,
  }),
  makeTypedef: (name: string, type: lw.LWType): lw.TypedefDeclaration => ({
    kind: lw.LWKind.TypedefDeclaration,
    generics,
    modifiers,
    name,
    type,
  }),
  makeFunction: (name: string, inputParameters: lw.FunctionDeclaration['parameters'] | { implicitThisType?: lw.LWType, parameters: lw.FunctionDeclaration['parameters'] }, returnType: lw.LWType, body?: lw.LWStatement, annotations: lw.Annotation[] = []): lw.FunctionDeclaration => {
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
  makeTopLevelExpression: (expression: lw.LWExpression): lw.TopLevelExpression => ({
    kind: lw.LWKind.TopLevelExpression,
    name: '$$TOP$$LEVEL$$EXPRESSION' + Date.now().toFixed(0) + (Math.random() * 1000000).toFixed(0),
    generics: [],
    expression,
  })
})

export const DefaultDeclarationBuilder = createDeclarationBuilder({})

export const VBuilders = {
  expression: ExpressionBuilders,
  statement: StatementBuilders,
  type: TypeBuilders,
  createDeclarationBuilder,
  DefaultDeclarationBuilder,
}
