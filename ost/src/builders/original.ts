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

import * as lw from '../lws.js'

/**
 * Original builder functions for constructing AST nodes.
 *
 * This module provides simple factory functions for creating AST nodes:
 * - `E`: Expression builders
 * - `S`: Statement builders
 * - `T`: Type builders
 * - `D` / `DD`: Declaration builders
 * - `utils`: Utility functions
 *
 * These are the original, low-level builders that directly create AST nodes.
 * For a more fluent API, see the advanced builders (`Builders` class).
 * For explicitly named functions, see the verbose builders.
 *
 * @example
 * ```typescript
 * import { E, S, T, D } from '@idlizer/ost';
 *
 * // Create a simple function
 * const addFunc = D.func(
 *   'add',
 *   [
 *     { name: 'a', type: T.c('number') },
 *     { name: 'b', type: T.c('number') }
 *   ],
 *   T.c('number'),
 *   S.return(E.bin('+', E.v('a'), E.v('b')))
 * );
 * ```
 */

/**
 * Expression builder functions.
 *
 * Provides factory functions for creating all types of expression AST nodes.
 * Each function returns a fully-formed expression node.
 */
export const E = {
  /**
   * Create a variable reference expression.
   *
   * @param name - Variable name
   * @param hints - Optional hints/metadata
   * @returns VariableExpression node
   *
   * @example
   * ```typescript
   * // x
   * const varExpr = E.v('x');
   *
   * // this (with ptrVal hint)
   * const thisExpr = E.v('this', [Hs.ptrVal()]);
   * ```
   */
  v: (name: string, hints: lw.Hint[] = []): lw.VariableExpression => ({
    kind: lw.LWKind.VariableExpression,
    name,
    hints,
  }),
  /**
   * Create a constant/literal expression.
   *
   * @param value - Constant value (string or number)
   * @param hints - Optional hints/metadata
   * @returns ConstantExpression node
   *
   * @example
   * ```typescript
   * // 42
   * const numExpr = E.c(42);
   *
   * // 3.14
   * const floatExpr = E.c(3.14);
   *
   * // true (as string)
   * const boolExpr = E.c('true');
   * ```
   */
  c: (value: string | number, hints: lw.Hint[] = []): lw.ConstantExpression => ({
    kind: lw.LWKind.ConstantExpression,
    value: value.toString(),
    hints,
  }),
  /**
   * Create a string literal expression.
   *
   * @param value - String value (without quotes)
   * @param hints - Optional hints/metadata
   * @returns StringExpression node
   *
   * @example
   * ```typescript
   * // "Hello, world!"
   * const strExpr = E.s('Hello, world!');
   * ```
   */
  s: (value: string, hints: lw.Hint[] = []): lw.StringExpression => ({
    kind: lw.LWKind.StringExpression,
    value,
    hints,
  }),
  /**
   * Create a unary operation expression.
   *
   * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
   * @param expression - Operand expression
   * @param hints - Optional hints/metadata
   * @returns UnaryExpression node
   *
   * @example
   * ```typescript
   * // -x
   * const negExpr = E.unary('-', E.v('x'));
   *
   * // !isReady
   * const notExpr = E.unary('!', E.v('isReady'));
   * ```
   */
  unary: (op: string, expression: lw.LWExpression, hints: lw.Hint[] = []): lw.UnaryExpression => ({
    kind: lw.LWKind.UnaryExpression,
    expression,
    op,
    hints,
  }),
  /**
   * Create a binary operation expression.
   *
   * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
   * @param left - Left operand expression
   * @param right - Right operand expression
   * @param hints - Optional hints/metadata
   * @returns BinaryExpression node
   *
   * @example
   * ```typescript
   * // x + y
   * const addExpr = E.bin('+', E.v('x'), E.v('y'));
   *
   * // a && b
   * const andExpr = E.bin('&&', E.v('a'), E.v('b'));
   * ```
   */
  bin: (op: string, left: lw.LWExpression, right: lw.LWExpression, hints: lw.Hint[] = []): lw.BinaryExpression => ({
    kind: lw.LWKind.BinaryExpression,
    op,
    left,
    right,
    hints,
  }),
  /**
   * Create a function/method call expression.
   *
   * @param callee - Expression representing the function to call
   * @param args - Argument expressions
   * @param typeArgs - Optional type arguments for generic calls
   * @param hints - Optional hints/metadata
   * @returns CallExpression node
   *
   * @example
   * ```typescript
   * // add(1, 2)
   * const callExpr = E.call(E.v('add'), [E.c(1), E.c(2)]);
   *
   * // Math.max<number>(x, y)
   * const genericCall = E.call(
   *   E.get(E.v('Math'), 'max'),
   *   [E.v('x'), E.v('y')],
   *   [T.c('number')]
   * );
   * ```
   */
  call: (callee: lw.LWExpression, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.CallExpression => ({
    kind: lw.LWKind.CallExpression,
    args,
    callee,
    typeArgs,
    hints,
  }),
  /**
   * Create a property/member access expression.
   *
   * @param base - Base object/array expression
   * @param accessor - Property name string or index expression
   * @param hints - Optional hints/metadata
   * @returns AccessorExpression node
   *
   * @example
   * ```typescript
   * // obj.property
   * const propAccess = E.get(E.v('obj'), 'property');
   *
   * // array[index]
   * const indexAccess = E.get(E.v('array'), E.v('index'));
   * ```
   */
  get: (base: lw.LWExpression, accessor: string | lw.LWExpression, hints: lw.Hint[] = []): lw.AccessorExpression => ({
    kind: lw.LWKind.AccessorExpression,
    base,
    accessor,
    hints,
  }),
  /**
   * Create a constructor expression with a type name.
   *
   * @param name - Type/class name
   * @param args - Constructor arguments
   * @param typeArgs - Optional type arguments for generic types
   * @param hints - Optional hints/metadata
   * @returns ConstructorExpression node
   *
   * @example
   * ```typescript
   * // new Date()
   * const dateConstructor = E.instance('Date', []);
   *
   * // new Array<number>(10)
   * const arrayConstructor = E.instance('Array', [E.c(10)], [T.c('number')]);
   * ```
   */
  instance: (name: string, args: lw.LWExpression[], typeArgs?: lw.LWType[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      name,
      typeArgs
    },
    hints,
  }),
  /**
   * Create a constructor expression with a type directly.
   * Alternative to `instance()` that takes a type node instead of a name.
   *
   * @param type - Type node
   * @param args - Constructor arguments
   * @param hints - Optional hints/metadata
   * @returns ConstructorExpression node
   *
   * @example
   * ```typescript
   * // new (SomeType)()
   * const typeConstructor = E.instance2(T.c('SomeType'), []);
   * ```
   */
  instance2: (type: lw.LWType, args: lw.LWExpression[], hints: lw.Hint[] = []): lw.ConstructorExpression => ({
    kind: lw.LWKind.ConstructorExpression,
    args,
    data: {
      type
    },
    hints,
  }),
  /**
   * Create a type cast expression.
   *
   * @param expression - Expression to cast
   * @param type - Target type
   * @param hints - Optional hints/metadata
   * @returns CheckCastExpression node with op: 'cast'
   *
   * @example
   * ```typescript
   * // (string)value
   * const castExpr = E.cast(E.v('value'), T.c('string'));
   * ```
   */
  cast: (expression: lw.LWExpression, type: lw.LWType, hints: lw.Hint[] = []): lw.CheckCastExpression => ({
    kind: lw.LWKind.CheckCastExpression,
    expression,
    op: 'cast',
    type,
    hints,
  }),
  /**
   * Create a lambda/arrow function expression.
   *
   * @param parameters - Function parameters (array of {name, type})
   * @param body - Function body statement
   * @param closure - Optional list of variable names captured from outer scope
   * @param hints - Optional hints/metadata
   * @returns LambdaExpression node
   *
   * @example
   * ```typescript
   * // (x: number, y: number) => x + y
   * const lambdaExpr = E.lambda(
   *   [
   *     { name: 'x', type: T.c('number') },
   *     { name: 'y', type: T.c('number') }
   *   ],
   *   S.return(E.bin('+', E.v('x'), E.v('y')))
   * );
   * ```
   */
  lambda: (parameters: lw.LambdaExpression['parameters'], body:lw.LWStatement, closure:string[] | undefined = undefined, hints: lw.Hint[] = []): lw.LambdaExpression => ({
    kind: lw.LWKind.LambdaExpression,
    parameters,
    body,
    closure,
    hints,
  }),
  /**
   * Create a type expression (type used as a value).
   *
   * @param type - Type node
   * @param hints - Optional hints/metadata
   * @returns TypeExpression node
   *
   * @example
   * ```typescript
   * // typeof MyClass
   * const typeExpr = E.type(T.c('MyClass'));
   * ```
   */
  type: (type: lw.LWType, hints: lw.Hint[] = []): lw.TypeExpression => ({
    kind: lw.LWKind.TypeExpression,
    type,
    hints,
  }),
  /**
   * Create a placeholder/hole expression.
   * Used for incomplete code during incremental construction.
   *
   * @param data - Arbitrary data associated with the hole
   * @returns HoleExpression node
   *
   * @example
   * ```typescript
   * // Placeholder for an expression
   * const holeExpr = E.hole({ description: 'expression to be filled' });
   * ```
   */
  hole: (data: unknown): lw.HoleExpression => ({
    kind: lw.LWKind.HoleExpression,
    data,
    hints: [],
  })
}

/**
 * Statement builder functions.
 *
 * Provides factory functions for creating all types of statement AST nodes.
 * Each function returns a fully-formed statement node.
 */
export const S = {
  /**
   * Create a variable declaration statement.
   *
   * @param varName - Variable name
   * @param varType - Variable type
   * @param mutable - Whether the variable is mutable (true for let/var, false for const)
   * @param expression - Optional initializer expression
   * @param isStatic - Whether the variable is static (class-level)
   * @returns DeclarationStatement node
   *
   * @example
   * ```typescript
   * // let x: number = 42
   * const letStmt = S.declaration('x', T.c('number'), true, E.c(42));
   *
   * // const PI: number = 3.14
   * const constStmt = S.declaration('PI', T.c('number'), false, E.c(3.14));
   * ```
   */
  declaration: (varName: string, varType: lw.LWType, mutable: boolean, expression?: lw.LWExpression, isStatic?: boolean): lw.DeclarationStatement => ({
    kind: lw.LWKind.DeclarationStatement,
    varName,
    varType,
    mutable,
    static: isStatic ?? false,
    expression,
  }),
  /**
   * Create a compound/block statement.
   *
   * @param statements - Array of statements in the block
   * @returns CompoundStatement node
   *
   * @example
   * ```typescript
   * // { let x = 1; let y = 2; return x + y; }
   * const blockStmt = S.block([
   *   S.declaration('x', T.c('number'), true, E.c(1)),
   *   S.declaration('y', T.c('number'), true, E.c(2)),
   *   S.return(E.bin('+', E.v('x'), E.v('y')))
   * ]);
   * ```
   */
  block: (statements: lw.LWStatement[]): lw.CompoundStatement => ({
    kind: lw.LWKind.CompoundStatement,
    statements,
  }),
  /**
   * Create an expression statement.
   *
   * @param expression - Expression to evaluate (optional for empty statement)
   * @returns ExpressionStatement node
   *
   * @example
   * ```typescript
   * // x = 42;
   * const exprStmt = S.e(E.bin('=', E.v('x'), E.c(42)));
   *
   * // ; (empty statement)
   * const emptyStmt = S.e();
   * ```
   */
  e: (expression?: lw.LWExpression): lw.ExpressionStatement => ({
    kind: lw.LWKind.ExpressionStatement,
    expression,
  }),
  /**
   * Create a return statement.
   *
   * @param expression - Optional expression to return (void return if undefined)
   * @returns ReturnStatement node
   *
   * @example
   * ```typescript
   * // return x + y;
   * const returnStmt = S.return(E.bin('+', E.v('x'), E.v('y')));
   *
   * // return; (void return)
   * const voidReturn = S.return();
   * ```
   */
  return: (expression?: lw.LWExpression): lw.ReturnStatement => ({
    kind: lw.LWKind.ReturnStatement,
    expression,
  }),
  /**
   * Create a loop statement.
   *
   * @param condition - Loop condition expression
   * @param body - Loop body statement
   * @param init - Optional initialization statement (e.g., let i = 0)
   * @param step - Optional step statement (e.g., i++)
   * @returns LoopStatement node
   *
   * @example
   * ```typescript
   * // for (let i = 0; i < 10; i++) { print(i); }
   * const forLoop = S.loop(
   *   E.bin('<', E.v('i'), E.c(10)),
   *   S.e(E.call(Vs.print, [E.v('i')])),
   *   S.declaration('i', T.c('number'), true, E.c(0)),
   *   S.e(E.unary('++', E.v('i')))
   * );
   *
   * // while (x > 0) { x--; }
   * const whileLoop = S.loop(
   *   E.bin('>', E.v('x'), E.c(0)),
   *   S.e(E.unary('--', E.v('x')))
   * );
   * ```
   */
  loop: (condition: lw.LWExpression, body: lw.LWStatement, init?: lw.LWStatement, step?: lw.LWStatement): lw.LoopStatement => ({
    kind: lw.LWKind.LoopStatement,
    init,
    step,
    condition,
    body,
  }),
  /**
   * Create an if statement.
   *
   * @param condition - Condition expression
   * @param thenBody - Statement to execute if condition is true
   * @param elseBody - Optional statement to execute if condition is false
   * @returns IfStatement node
   *
   * @example
   * ```typescript
   * // if (x > 0) { return "positive"; } else { return "non-positive"; }
   * const ifStmt = S.if(
   *   E.bin('>', E.v('x'), E.c(0)),
   *   S.return(E.s('positive')),
   *   S.return(E.s('non-positive'))
   * );
   * ```
   */
  if: (condition: lw.LWExpression, thenBody: lw.LWStatement, elseBody?: lw.LWStatement): lw.IfStatement => ({
    kind: lw.LWKind.IfStatement,
    condition,
    thenBody,
    elseBody,
  }),
  /**
   * Create an empty/no-op statement.
   *
   * @returns NoneStatement node
   *
   * @example
   * ```typescript
   * // ;
   * const emptyStmt = S.none();
   * ```
   */
  /**
   * Create a break statement.
   *
   * @returns BreakStatement node
   *
   * @example
   * ```typescript
   * // break;
   * const breakStmt = S.break();
   * ```
   */
  break: (): lw.BreakStatement => ({
    kind: lw.LWKind.BreakStatement
  }),
  none: (): lw.NoneStatement => ({
    kind: lw.LWKind.NoneStatement
  }),
}

/**
 * Type builder functions.
 *
 * Provides factory functions for creating all types of type AST nodes.
 * Each function returns a fully-formed type node.
 */
export const T = {
  /**
   * Create a value type (named type with optional type arguments).
   *
   * @param name - Type name (e.g., "number", "string", "Array", "Map")
   * @param args - Optional type arguments for generic types
   * @returns ValueType node
   *
   * @example
   * ```typescript
   * // number
   * const numberType = T.c('number');
   *
   * // Array<string>
   * const arrayType = T.c('Array', T.c('string'));
   *
   * // Map<string, number>
   * const mapType = T.c('Map', T.c('string'), T.c('number'));
   * ```
   */
  c: (name: string, ...args: lw.LWType[]): lw.ValueType => ({
    kind: lw.LWKind.ValueType,
    name,
    args,
  }),
  /**
   * Create a functional type (function signature).
   *
   * @param params - Array of [name, type] tuples for parameters
   * @param returnType - Function return type
   * @returns FunctionalType node
   *
   * @example
   * ```typescript
   * // (x: number, y: number) => number
   * const funcType = T.fn(
   *   [['x', T.c('number')], ['y', T.c('number')]],
   *   T.c('number')
   * );
   *
   * // () => void
   * const voidFuncType = T.fn([], T.c('void'));
   * ```
   */
  fn: (params: {name: string, type: lw.LWType}[], returnType: lw.LWType): lw.FunctionalType => ({
    kind: lw.LWKind.FunctionalType,
    params: params,
    returnType
  }),
  /**
   * Create a placeholder/hole type.
   * Used for incomplete types during incremental construction.
   *
   * @param data - Arbitrary data associated with the type hole
   * @returns HoleType node
   *
   * @example
   * ```typescript
   * // Placeholder for a type to be inferred
   * const holeType = T.hole({ description: 'type to be inferred' });
   * ```
   */
  hole: (data: unknown): lw.HoleType => ({
    kind: lw.LWKind.HoleType,
    data,
  })
}

/**
 * Options for declaration builders (DD).
 * Allows setting default generics and modifiers for declarations.
 */
interface DDOptions {
  /** Default generic type parameters for declarations */
  generics?: lw.GenericDescriptor[]
  /** Default modifiers for declarations */
  modifiers?: lw.Modifier[]
}

/**
 * Declaration builder factory with configurable defaults.
 * Creates a set of declaration builder functions with shared generics and modifiers.
 *
 * @param options - Configuration options with default generics and modifiers
 * @returns Object containing declaration builder functions
 *
 * @example
 * ```typescript
 * // Create builders with default generics and modifiers
 * const builders = DD({
 *   generics: [{ name: 'T' }],
 *   modifiers: [Md.public()]
 * });
 *
 * // Use the builders with defaults applied
 * const genericClass = builders.class('Container', [...], [...]);
 * ```
 */
export const DD = ({ generics = [], modifiers = [] }: DDOptions) => ({
  /**
   * Create an enum declaration with configured defaults.
   *
   * @param name - Enum name
   * @param members - Enum members with optional values
   * @returns EnumDeclaration node
   *
   * @example
   * ```typescript
   * // enum Color { Red = 0, Green = 1, Blue = 2 }
   * const colorEnum = DD({}).enum('Color', [
   *   { name: 'Red', value: 0 },
   *   { name: 'Green', value: 1 },
   *   { name: 'Blue', value: 2 }
   * ]);
   * ```
   */
  enum: (name: string, members: lw.EnumDeclaration['members']): lw.EnumDeclaration => ({
    kind: lw.LWKind.EnumDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  /**
   * Create a structure declaration with configured defaults.
   *
   * @param name - Structure name
   * @param members - Structure fields
   * @returns StructureDeclaration node
   *
   * @example
   * ```typescript
   * // struct Point { x: number, y: number }
   * const pointStruct = DD({}).struct('Point', [
   *   { name: 'x', type: T.c('number') },
   *   { name: 'y', type: T.c('number') }
   * ]);
   * ```
   */
  struct: (name: string, members: lw.StructureDeclaration['members']): lw.StructureDeclaration => ({
    kind: lw.LWKind.StructureDeclaration,
    generics,
    modifiers,
    name,
    members,
  }),
  /**
   * Create a class declaration with configured defaults.
   *
   * @param name - Class name
   * @param fields - Class fields (instance variables)
   * @param methods - Class methods
   * @param more - Optional OOP information (inheritance, interfaces)
   * @returns ClassDeclaration node
   *
   * @example
   * ```typescript
   * // class Person { name: string; age: number; }
   * const personClass = DD({}).class('Person',
   *   [
   *     { name: 'name', type: T.c('string') },
   *     { name: 'age', type: T.c('number') }
   *   ],
   *   [greetMethod]
   * );
   * ```
   */
  class: (name: string, fields: lw.ClassDeclaration['fields'], methods: lw.FunctionDeclaration[], more?: lw.ClassDeclaration['oop']): lw.ClassDeclaration => ({
    kind: lw.LWKind.ClassDeclaration,
    generics,
    modifiers,
    name,
    fields,
    methods,
    oop: more
  }),
  /**
   * Create a namespace declaration with configured defaults.
   *
   * @param name - Namespace name
   * @param members - Declarations contained within the namespace
   * @returns NamespaceDeclaration node
   *
   * @example
   * ```typescript
   * // namespace MathUtils { function add(a: number, b: number): number }
   * const mathNamespace = DD({}).ns('MathUtils', [addFunction]);
   * ```
   */
  ns: (name: string, members: lw.LWDeclaration[], hints: lw.Hint[] = []): lw.NamespaceDeclaration => ({
    kind: lw.LWKind.NamespaceDeclaration,
    name,
    members,
    hints,
  }),
  /**
   * Create a type alias declaration with configured defaults.
   *
   * @param name - Type alias name
   * @param type - The type being aliased
   * @returns TypedefDeclaration node
   *
   * @example
   * ```typescript
   * // type StringOrNumber = string | number
   * const stringOrNumberType = DD({}).type(
   *   'StringOrNumber',
   *   Ts.union([T.c('string'), T.c('number')])
   * );
   * ```
   */
  type: (name: string, type: lw.LWType): lw.TypedefDeclaration => ({
    kind: lw.LWKind.TypedefDeclaration,
    generics,
    modifiers,
    name,
    type,
  }),
  /**
   * Create a function/method declaration with configured defaults.
   *
   * @param name - Function name
   * @param inputParameters - Either an array of parameters or an object with implicitThisType and parameters
   * @param returnType - Function return type
   * @param body - Optional function body
   * @param annotations - Function annotations/decorators
   * @returns FunctionDeclaration node
   *
   * @example
   * ```typescript
   * // function add(a: number, b: number): number { return a + b; }
   * const addFunction = DD({}).func(
   *   'add',
   *   [
   *     { name: 'a', type: T.c('number') },
   *     { name: 'b', type: T.c('number') }
   *   ],
   *   T.c('number'),
   *   S.return(E.bin('+', E.v('a'), E.v('b')))
   * );
   *
   * // Method with implicit 'this' type
   * const method = DD({}).func(
   *   'getName',
   *   { implicitThisType: T.c('Person'), parameters: [] },
   *   T.c('string'),
   *   S.return(E.get(E.v('this'), 'name'))
   * );
   * ```
   */
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
  /**
   * Create a top-level expression declaration with configured defaults.
   * Generates a unique name for the expression.
   *
   * @param expression - The expression value
   * @returns TopLevelExpression node with a generated unique name
   *
   * @example
   * ```typescript
   * // const $$TOP$$LEVEL$$EXPRESSION123456 = 42
   * const topLevelExpr = DD({}).expr(E.c(42));
   * ```
   */
  expr: (expression: lw.LWExpression): lw.TopLevelExpression => ({
    kind: lw.LWKind.TopLevelExpression,
    name: '$$TOP$$LEVEL$$EXPRESSION' + Date.now().toFixed(0) + (Math.random() * 1000000).toFixed(0),
    generics: [],
    expression,
  })
})

/**
 * Default declaration builders with empty generics and modifiers.
 * Shortcut for `DD({})` - provides declaration builders without default configuration.
 *
 * @example
 * ```typescript
 * // function add(a: number, b: number): number
 * const addFunc = D.func(
 *   'add',
 *   [
 *     { name: 'a', type: T.c('number') },
 *     { name: 'b', type: T.c('number') }
 *   ],
 *   T.c('number')
 * );
 * ```
 */
export const D = DD({})

/**
 * Utility functions for working with AST nodes.
 */
export const utils = {
  /**
   * Check if an expression has a specific hint.
   *
   * @param node - Expression node
   * @param hint - Hint name to check for
   * @returns The hint object if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const expr = E.v('this', [Hs.ptrVal()]);
   * const hasPtrVal = utils.hasHint(expr, 'ptrVal'); // returns the hint object
   * ```
   */
  hasHint(node: lw.LWExpression | lw.NamespaceDeclaration, hint: string) {
    return node.hints.find(x => x.name === hint)
  },
  /**
   * Get the value of a specific hint from an expression.
   *
   * @param node - Expression node
   * @param hint - Hint name to get value for
   * @returns The hint value if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const expr = E.v('x', [{ kind: DecoratorKind.Hint, name: 'custom', value: '123' }]);
   * const hintValue = utils.getHint(expr, 'custom'); // returns '123'
   * ```
   */
  getHint(node: lw.LWExpression, hint: string) {
    return node.hints.find(x => x.name === hint)?.value
  }
}
