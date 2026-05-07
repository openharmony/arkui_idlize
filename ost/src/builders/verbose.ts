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
import * as lw from '../lws.js'

export const ExpressionBuilders = {
  /**
   * Create a variable expression (reference to a variable by name).
   *
   * @param name - Variable name
   * @param hints - Optional hints for the variable (e.g., pointer, static)
   * @returns VariableExpression node
   */
  makeVariable: (name: string, hints: lw.Hint[] = []): lw.VariableExpression => ({
    kind: lw.LWKind.VariableExpression,
    name,
    hints,
  }),
  /**
   * Create a constant expression (numeric or string literal).
   *
   * @param value - Constant value (string or number)
   * @param hints - Optional hints for the constant
   * @returns ConstantExpression node
   */
  makeConstant: (value: string | number, hints: lw.Hint[] = []): lw.ConstantExpression => ({
    kind: lw.LWKind.ConstantExpression,
    value: value.toString(),
    hints,
  }),
  /**
   * Create a string literal expression.
   *
   * @param value - String value
   * @param hints - Optional hints for the string
   * @returns StringExpression node
   */
  makeString: (value: string, hints: lw.Hint[] = []): lw.StringExpression => ({
    kind: lw.LWKind.StringExpression,
    value,
    hints,
  }),
  /**
   * Create a unary expression (e.g., -x, !y, ~z).
   *
   * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
   * @param expression - Operand expression
   * @param hints - Optional hints for the unary operation
   * @returns UnaryExpression node
   */
  makeUnary: (op: string, expression: lw.LWExpression, hints: lw.Hint[] = []): lw.UnaryExpression => ({
    kind: lw.LWKind.UnaryExpression,
    expression,
    op,
    hints,
  }),
  /**
   * Create a binary expression (e.g., x + y, a && b, c == d).
   *
   * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
   * @param left - Left-hand side expression
   * @param right - Right-hand side expression
   * @param hints - Optional hints for the binary operation
   * @returns BinaryExpression node
   */
  makeBinary: (op: string, left: lw.LWExpression, right: lw.LWExpression, hints: lw.Hint[] = []): lw.BinaryExpression => ({
    kind: lw.LWKind.BinaryExpression,
    op,
    left,
    right,
    hints,
  }),
  /**
   * Create a function call expression.
   *
   * @param callee - Function expression (or variable name)
   * @param args - Array of argument expressions
   * @param typeArgs - Optional array of type arguments (generics)
   * @param hints - Optional hints for the call
   * @returns CallExpression node
   */
  makeCall: (callee: lw.LWExpression, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.CallExpression => ({
    kind: lw.LWKind.CallExpression,
    args,
    callee,
    typeArgs,
    hints,
  }),
  /**
   * Create an accessor expression (property/member access or index access).
   *
   * @param base - Base expression (object/array)
   * @param accessor - Property name or index expression
   * @param hints - Optional hints for the accessor
   * @returns AccessorExpression node
   */
  makeAccessor: (base: lw.LWExpression, accessor: string | lw.LWExpression, hints: lw.Hint[] = []): lw.AccessorExpression => ({
    kind: lw.LWKind.AccessorExpression,
    base,
    accessor,
    hints,
  }),
  /**
   * Create a constructor expression (new instance) from a type name.
   *
   * @param name - Type/class name
   * @param args - Array of constructor arguments
   * @param typeArgs - Optional array of type arguments (generics)
   * @param hints - Optional hints for the constructor
   * @returns ConstructorExpression node
   */
  makeConstructor: (name: string, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      name,
      typeArgs
    },
    hints,
  }),
  /**
   * Create a constructor expression (new instance) from a type object.
   *
   * @param type - Type object
   * @param args - Array of constructor arguments
   * @param hints - Optional hints for the constructor
   * @returns ConstructorExpression node
   */
  makeConstructorFromType: (type: lw.LWType, args: lw.LWExpression[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      type
    },
    hints,
  }),
  /**
   * Create a type cast expression ((Type)expr).
   *
   * @param expression - Expression to cast
   * @param type - Target type
   * @param hints - Optional hints for the cast
   * @returns CheckCastExpression node
   */
  makeCast: (expression: lw.LWExpression, type: lw.LWType, hints: lw.Hint[] = []): lw.CheckCastExpression => ({
    kind: lw.LWKind.CheckCastExpression,
    expression,
    op: 'cast',
    type,
    hints,
  }),
  /**
   * Create a lambda expression (anonymous function).
   *
   * @param parameters - Array of parameter descriptors (name and type)
   * @param body - Function body statement
   * @param closure - Optional array of captured variable names
   * @param hints - Optional hints for the lambda
   * @returns LambdaExpression node
   */
  makeLambda: (parameters: lw.LambdaExpression['parameters'], body: lw.LWStatement, closure: string[] | undefined = undefined, hints: lw.Hint[] = []): lw.LambdaExpression => ({
    kind: lw.LWKind.LambdaExpression,
    parameters,
    body,
    closure,
    hints,
  }),
  /**
   * Create a type expression (reference to a type).
   *
   * @param type - Type object
   * @param hints - Optional hints for the type expression
   * @returns TypeExpression node
   */
  makeType: (type: lw.LWType, hints: lw.Hint[] = []): lw.TypeExpression => ({
    kind: lw.LWKind.TypeExpression,
    type,
    hints,
  }),
  /**
   * Create a hole expression (placeholder for incomplete code).
   *
   * @param data - Arbitrary data associated with the hole
   * @returns HoleExpression node
   */
  makeHole: (data: unknown): lw.HoleExpression => ({
    kind: lw.LWKind.HoleExpression,
    data,
    hints: [],
  })
}

export const StatementBuilders = {
  /**
   * Create a variable declaration statement.
   *
   * @param varName - Variable name
   * @param varType - Variable type
   * @param mutable - Whether the variable is mutable (non-const)
   * @param expression - Optional initial value expression
   * @param isStatic - Whether the variable is static (class-level)
   * @returns DeclarationStatement node
   */
  makeDeclaration: (varName: string, varType: lw.LWType, mutable: boolean, expression?: lw.LWExpression, isStatic?: boolean): lw.DeclarationStatement => ({
    kind: lw.LWKind.DeclarationStatement,
    varName,
    varType,
    mutable,
    static: isStatic ?? false,
    expression,
  }),
  /**
   * Create a block/compound statement (sequence of statements).
   *
   * @param statements - Array of statements
   * @returns CompoundStatement node
   */
  makeBlock: (statements: lw.LWStatement[]): lw.CompoundStatement => ({
    kind: lw.LWKind.CompoundStatement,
    statements,
  }),
  /**
   * Create an expression statement (expression used as a statement).
   *
   * @param expression - Optional expression (empty statement if omitted)
   * @returns ExpressionStatement node
   */
  makeExpression: (expression?: lw.LWExpression): lw.ExpressionStatement => ({
    kind: lw.LWKind.ExpressionStatement,
    expression,
  }),
  /**
   * Create a return statement.
   *
   * @param expression - Optional return value expression (void return if omitted)
   * @returns ReturnStatement node
   */
  makeReturn: (expression?: lw.LWExpression): lw.ReturnStatement => ({
    kind: lw.LWKind.ReturnStatement,
    expression,
  }),
  /**
   * Create a loop statement (for/while).
   *
   * @param condition - Loop condition expression
   * @param body - Loop body statement
   * @param init - Optional initialization statement (for loops)
   * @param step - Optional step statement (for loops)
   * @returns LoopStatement node
   */
  makeLoop: (condition: lw.LWExpression, body: lw.LWStatement, init?: lw.LWStatement, step?: lw.LWStatement): lw.LoopStatement => ({
    kind: lw.LWKind.LoopStatement,
    init,
    step,
    condition,
    body,
  }),
  /**
   * Create an if statement (conditional).
   *
   * @param condition - Condition expression
   * @param thenBody - Then branch statement
   * @param elseBody - Optional else branch statement
   * @returns IfStatement node
   */
  makeIf: (condition: lw.LWExpression, thenBody: lw.LWStatement, elseBody?: lw.LWStatement): lw.IfStatement => ({
    kind: lw.LWKind.IfStatement,
    condition,
    thenBody,
    elseBody,
  }),
  /**
   * Create a none/empty statement (placeholder).
   *
   * @returns NoneStatement node
   */
  makeNone: (): lw.NoneStatement => ({
    kind: lw.LWKind.NoneStatement
  }),
}

export const TypeBuilders = {
  /**
   * Create a value type (named type with optional type arguments).
   *
   * @param name - Type name
   * @param args - Optional type arguments (generics)
   * @returns ValueType node
   */
  makeValueType: (name: string, ...args: lw.LWType[]): lw.ValueType => ({
    kind: lw.LWKind.ValueType,
    name,
    args,
  }),
  /**
   * Create a functional type (function signature).
   *
   * @param params - Array of parameter descriptors (name and type)
   * @param returnType - Return type
   * @returns FunctionalType node
   */
  makeFunctionalType: (params: [name: string, type: lw.LWType][], returnType: lw.LWType): lw.FunctionalType => ({
    kind: lw.LWKind.FunctionalType,
    params: params.map(([name, type]) => ({ name, type })),
    returnType
  }),
  /**
   * Create a hole type (placeholder for incomplete type).
   *
   * @param data - Arbitrary data associated with the hole
   * @returns HoleType node
   */
  makeHoleType: (data: unknown): lw.HoleType => ({
    kind: lw.LWKind.HoleType,
    data,
  })
}

/**
 * Options for creating a declaration builder.
 */
interface DeclarationBuilderOptions {
  generics?: lw.GenericDescriptor[]
  modifiers?: lw.Modifier[]
}

/**
 * Create a declaration builder with shared generics and modifiers.
 * Returns an object with methods for creating various declaration nodes.
 *
 * @param options - Builder options
 * @param options.generics - Generic type descriptors to apply to all declarations
 * @param options.modifiers - Modifiers to apply to all declarations
 * @returns Declaration builder object
 */
export const createDeclarationBuilder = ({ generics = [], modifiers = [] }: DeclarationBuilderOptions) => ({
  /**
   * Create an enum declaration.
   *
   * @param name - Enum name
   * @param members - Array of enum members (name and optional value)
   * @returns EnumDeclaration node
   */
  makeEnum: (name: string, members: lw.EnumDeclaration['members']): lw.EnumDeclaration => ({
    kind: lw.LWKind.EnumDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  /**
   * Create a structure declaration.
   *
   * @param name - Structure name
   * @param members - Array of structure members (name, type, and optional modifiers)
   * @returns StructureDeclaration node
   */
  makeStruct: (name: string, members: lw.StructureDeclaration['members']): lw.StructureDeclaration => ({
    kind: lw.LWKind.StructureDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  /**
   * Create a class declaration.
   *
   * @param name - Class name
   * @param fields - Array of class fields (name, type, and optional modifiers)
   * @param methods - Array of method declarations
   * @param more - Optional OOP metadata (base class, interfaces, kind)
   * @returns ClassDeclaration node
   */
  makeClass: (name: string, fields: lw.ClassDeclaration['fields'], methods: lw.FunctionDeclaration[], more?: lw.ClassDeclaration['oop']): lw.ClassDeclaration => ({
    kind: lw.LWKind.ClassDeclaration,
    generics,
    modifiers,
    name,
    fields,
    methods,
    oop: more
  }),
  /**
   * Create a namespace declaration.
   *
   * @param name - Namespace name
   * @param members - Array of declarations inside the namespace
   * @returns NamespaceDeclaration node
   */
  makeNamespace: (name: string, members: lw.LWDeclaration[], hints: lw.Hint[]): lw.NamespaceDeclaration => ({
    kind: lw.LWKind.NamespaceDeclaration,
    name,
    members,
    hints,
  }),
  /**
   * Create a type alias declaration.
   *
   * @param name - Type alias name
   * @param type - Underlying type
   * @returns TypedefDeclaration node
   */
  makeTypedef: (name: string, type: lw.LWType): lw.TypedefDeclaration => ({
    kind: lw.LWKind.TypedefDeclaration,
    generics,
    modifiers,
    name,
    type,
  }),
  /**
   * Create a function declaration.
   *
   * @param name - Function name
   * @param inputParameters - Either an array of parameters or an object with `implicitThisType` and `parameters`
   * @param returnType - Function return type
   * @param body - Optional function body statement
   * @param annotations - Optional annotations (decorators)
   * @returns FunctionDeclaration node
   */
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
  /**
   * Create a top-level expression declaration (wrapper for standalone expressions).
   * Generates a unique name for the declaration.
   *
   * @param expression - Expression to wrap
   * @returns TopLevelExpression node
   */
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
