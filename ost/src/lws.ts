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
 * Enumeration of all AST node kinds in the Lightweight Syntax (LW) system.
 * Each value corresponds to a specific type of AST node used for declarations,
 * statements, expressions, and types.
 */
export enum LWKind {
  // Declaration node kinds
  /** Enum declaration (collection of named constants) */
  EnumDeclaration,
  /** Structure/record declaration (collection of named fields) */
  StructureDeclaration,
  /** Class declaration with fields, methods, and inheritance */
  ClassDeclaration,
  /** Namespace/module declaration for grouping declarations */
  NamespaceDeclaration,
  /** Type alias declaration */
  TypedefDeclaration,
  /** Function/method declaration */
  FunctionDeclaration,
  /** Top-level expression with a name (like a const declaration) */
  TopLevelExpression,

  // Statement node kinds
  /** Variable declaration statement (let/var/const) */
  DeclarationStatement,
  /** Block/compound statement (sequence of statements) */
  CompoundStatement,
  /** Expression evaluated as a statement */
  ExpressionStatement,
  /** Return statement */
  ReturnStatement,
  /** Loop statement (for/while) with init, condition, step */
  LoopStatement,
  /** Conditional if statement */
  IfStatement,
  /** Switch statement with cases */
  SwitchStatement,
  /** Break statement (used in switch cases and loops) */
  BreakStatement,
  /** Throw statement (used to throw an error) */
  ThrowStatement,
  /** Empty/no-op statement */
  NoneStatement,

  // Expression node kinds
  /** Variable reference expression */
  VariableExpression,
  /** Constant/literal expression (numbers, booleans) */
  ConstantExpression,
  /** String literal expression */
  StringExpression,
  /** Unary operation expression (e.g., -x, !x) */
  UnaryExpression,
  /** Binary operation expression (e.g., x + y, a && b) */
  BinaryExpression,
  /** Function/method call expression */
  CallExpression,
  /** Property/member access expression (obj.field or obj[index]) */
  AccessorExpression,
  /** Object/instance construction expression (new Class()) */
  ConstructorExpression,
  /** Type cast or instanceof check expression */
  CheckCastExpression,
  /** Lambda/arrow function expression */
  LambdaExpression,
  /** Type expression (type as value) */
  TypeExpression,
  /** Placeholder/hole expression for incomplete code */
  HoleExpression,

  // Type node kinds
  /** Value type (named type with optional type arguments) */
  ValueType,
  /** Functional type (function signature type) */
  FunctionalType,
  /** Placeholder/hole type for incomplete types */
  HoleType,
}

////////////////////////////////////////////////////////

/**
 * Descriptor for a generic type parameter.
 * Used in declarations that support generics (classes, functions, etc.).
 *
 * @example
 * ```typescript
 * // Generic descriptor for "T" in "class Container<T>"
 * const genericT: GenericDescriptor = { name: "T" };
 * ```
 */
export interface GenericDescriptor {
  /** Name of the generic type parameter (e.g., "T", "K", "V") */
  name: string
}

////////////////////////////////////////////////////////

/**
 * Kind of decorator that can be attached to AST nodes.
 * Decorators provide metadata, modifiers, or annotations to declarations and expressions.
 */
export enum DecoratorKind {
  /** Hint - metadata attached to expressions (e.g., ptrVal, asStruct) */
  Hint = "Hint",
  /** Modifier - language modifier (e.g., native, optional, private) */
  Modifier = "Modifier",

  /** Simple annotation (e.g., @Deprecated, @Override) */
  SimpleAnnotation = "Annotation",
  /** Macro invocation annotation (e.g., @SomeMacro(args)) */
  MacroInvocation = "MacroInvocation",
}

/**
 * Hint metadata attached to expressions.
 * Hints provide additional information about how expressions should be interpreted
 * or transformed during code generation.
 *
 * @example
 * ```typescript
 * // Pointer value hint
 * const ptrHint: Hint = { kind: DecoratorKind.Hint, name: "ptrVal" };
 *
 * // Static method hint with value
 * const staticHint: Hint = { kind: DecoratorKind.Hint, name: "staticMethod", value: "true" };
 * ```
 */
export interface Hint {
  kind: DecoratorKind.Hint,
  /** Name of the hint (e.g., "ptrVal", "asStruct", "staticMethod") */
  name: string
  /** Optional value associated with the hint */
  value?: string
}
/**
 * Language modifier attached to declarations.
 * Modifiers change the behavior or semantics of declarations (e.g., access control,
 * storage specifiers, language-specific attributes).
 *
 * @example
 * ```typescript
 * // Private access modifier
 * const privateMod: Modifier = { kind: DecoratorKind.Modifier, name: "private" };
 *
 * // Native modifier for foreign function interface
 * const nativeMod: Modifier = { kind: DecoratorKind.Modifier, name: "native" };
 * ```
 */
export interface Modifier {
  kind: DecoratorKind.Modifier,
  /** Name of the modifier (e.g., "private", "native", "optional", "static") */
  name: string
  /** Optional value associated with the modifier */
  value?: string
}

/**
 * Simple annotation/decorator attached to declarations.
 * Annotations provide metadata or attributes that don't require arguments.
 *
 * @example
 * ```typescript
 * // @Deprecated annotation
 * const deprecatedAnn: SimpleAnnotation = {
 *   kind: DecoratorKind.SimpleAnnotation,
 *   name: "Deprecated"
 * };
 *
 * // @Override annotation
 * const overrideAnn: SimpleAnnotation = {
 *   kind: DecoratorKind.SimpleAnnotation,
 *   name: "Override"
 * };
 * ```
 */
export interface SimpleAnnotation {
  kind: DecoratorKind.SimpleAnnotation,
  /** Name of the annotation (e.g., "Deprecated", "Override", "NonNull") */
  name: string
  /** Optional value associated with the annotation */
  value?: string
}
/**
 * Macro invocation annotation with arguments.
 * Used for annotations that take arguments (similar to macro invocations).
 *
 * @example
 * ```typescript
 * // @SomeMacro("arg1", 42, SomeType)
 * const macroAnn: MacroInvocation = {
 *   kind: DecoratorKind.MacroInvocation,
 *   name: "SomeMacro",
 *   args: ["arg1", E.c(42), T.c("SomeType")]
 * };
 * ```
 */
export interface MacroInvocation {
  kind: DecoratorKind.MacroInvocation,
  /** Name of the macro/annotation */
  name: string
  /** Arguments to the macro (strings, expressions, or types) */
  args: (string | LWExpression | LWType)[]
}
/**
 * Union type representing any kind of annotation (simple or macro invocation).
 * Annotations are decorators attached to declarations.
 */
export type Annotation =
  SimpleAnnotation
  | MacroInvocation

////////////////////////////////////////////////////////

/**
 * Enumeration declaration AST node.
 * Represents a named set of constant values.
 *
 * @example
 * ```typescript
 * // enum Color { Red = 0, Green = 1, Blue = 2 }
 * const colorEnum: EnumDeclaration = {
 *   kind: LWKind.EnumDeclaration,
 *   generics: [],
 *   modifiers: [],
 *   name: "Color",
 *   members: [
 *     { name: "Red", value: 0 },
 *     { name: "Green", value: 1 },
 *     { name: "Blue", value: 2 }
 *   ]
 * };
 * ```
 */
export interface EnumDeclaration {
  kind: LWKind.EnumDeclaration
  /** Generic type parameters (usually empty for enums) */
  generics: GenericDescriptor[]
  /** Modifiers (e.g., public, private, export) */
  modifiers: Modifier[]
  /** Name of the enum */
  name: string
  /** Enum members with optional values */
  members: {
    name: string
    value?: number | string
  }[]
}
/**
 * Structure/record declaration AST node.
 * Represents a collection of named fields (like a struct in C/C++ or record in other languages).
 *
 * @example
 * ```typescript
 * // struct Point { x: number, y: number }
 * const pointStruct: StructureDeclaration = {
 *   kind: LWKind.StructureDeclaration,
 *   generics: [],
 *   modifiers: [],
 *   name: "Point",
 *   members: [
 *     { name: "x", type: T.c("number") },
 *     { name: "y", type: T.c("number") }
 *   ]
 * };
 * ```
 */
export interface StructureDeclaration {
  kind: LWKind.StructureDeclaration
  /** Generic type parameters */
  generics: GenericDescriptor[]
  /** Modifiers (e.g., public, packed, alignas) */
  modifiers: Modifier[]
  /** Name of the structure */
  name: string
  /** Structure fields */
  members: {
    /** Field name */
    name: string
    /** Field type */
    type: LWType
    /** Field-specific modifiers (e.g., readonly, mutable) */
    modifiers?: Modifier[]
  }[]
}
/**
 * Class declaration AST node.
 * Represents a class with fields, methods, and optional inheritance/implementation.
 *
 * @example
 * ```typescript
 * // class Person { name: string; age: number; greet(): string }
 * const personClass: ClassDeclaration = {
 *   kind: LWKind.ClassDeclaration,
 *   generics: [],
 *   modifiers: [],
 *   name: "Person",
 *   fields: [
 *     { name: "name", type: T.c("string") },
 *     { name: "age", type: T.c("number") }
 *   ],
 *   methods: [greetMethodDeclaration],
 *   oop: {
 *     base: T.c("BasePerson"),
 *     implementations: [T.c("Serializable")],
 *     kind: "class"
 *   }
 * };
 * ```
 */
export interface ClassDeclaration {
  kind: LWKind.ClassDeclaration
  /** Generic type parameters */
  generics: GenericDescriptor[]
  /** Class modifiers (e.g., public, abstract, final) */
  modifiers: Modifier[]
  /** Class name */
  name: string
  /** Class fields (instance variables) */
  fields: {
    /** Field name */
    name: string
    /** Field type */
    type: LWType
    /** Field modifiers (e.g., private, static, readonly) */
    modifiers?: Modifier[]
    /** Field initialization expression */
    expression?: LWExpression
  }[]
  /** Class methods */
  methods: FunctionDeclaration[]

  /** Object-oriented programming information (inheritance, interfaces) */
  oop?: {
    /** Base class type (for inheritance) */
    base?: LWType
    /** Implemented interface types */
    implementations?: LWType[]
    /** Whether this is a class or interface declaration */
    kind: 'interface' | 'class'
  }
}
/**
 * Namespace/module declaration AST node.
 * Groups related declarations under a common name.
 *
 * @example
 * ```typescript
 * // namespace MathUtils { function add(a: number, b: number): number }
 * const mathNamespace: NamespaceDeclaration = {
 *   kind: LWKind.NamespaceDeclaration,
 *   name: "MathUtils",
 *   members: [addFunctionDeclaration]
 * };
 * ```
 */
export interface NamespaceDeclaration {
  kind: LWKind.NamespaceDeclaration
  /** Namespace name */
  name: string
  /** Declarations contained within the namespace */
  members: LWDeclaration[]
}
/**
 * Type alias declaration AST node.
 * Creates a new name for an existing type.
 *
 * @example
 * ```typescript
 * // type StringOrNumber = string | number
 * const stringOrNumberType: TypedefDeclaration = {
 *   kind: LWKind.TypedefDeclaration,
 *   generics: [],
 *   modifiers: [],
 *   name: "StringOrNumber",
 *   type: Ts.union([T.c("string"), T.c("number")])
 * };
 * ```
 */
export interface TypedefDeclaration {
  kind: LWKind.TypedefDeclaration
  /** Generic type parameters */
  generics: GenericDescriptor[]
  /** Modifiers (e.g., export, public) */
  modifiers: Modifier[]
  /** Name of the type alias */
  name: string
  /** The type being aliased */
  type: LWType
}
/**
 * Function/method declaration AST node.
 * Represents a function with parameters, return type, and optional body.
 *
 * @example
 * ```typescript
 * // function add(a: number, b: number): number { return a + b; }
 * const addFunction: FunctionDeclaration = {
 *   kind: LWKind.FunctionDeclaration,
 *   generics: [],
 *   modifiers: [],
 *   annotations: [],
 *   name: "add",
 *   parameters: [
 *     { name: "a", type: T.c("number") },
 *     { name: "b", type: T.c("number") }
 *   ],
 *   returnType: T.c("number"),
 *   body: S.ret(E.bin("+", E.v("a"), E.v("b")))
 * };
 * ```
 */
export interface FunctionDeclaration {
  kind: LWKind.FunctionDeclaration
  /** Generic type parameters */
  generics: GenericDescriptor[]
  /** Function modifiers (e.g., static, async, public) */
  modifiers: Modifier[]
  /** Function annotations/decorators */
  annotations: Annotation[]
  /** Function name */
  name: string
  /** Implicit 'this' parameter type for methods */
  implicitThisType?: LWType
  /** Function parameters */
  parameters: {
    /** Parameter name */
    name: string
    /** Parameter type */
    type: LWType
    modifiers?: Modifier[]
    /** Parameter optional default expression (has limited support) */
    expression?: LWExpression
  }[]
  /** Function return type */
  returnType: LWType
  /** Function body (optional for declarations) */
  body?: LWStatement
}
/**
 * Top-level expression declaration AST node.
 * Represents a named expression at the top level (like a const declaration).
 *
 * @example
 * ```typescript
 * // const MAX_SIZE = 100
 * const maxSizeDecl: TopLevelExpression = {
 *   kind: LWKind.TopLevelExpression,
 *   name: "MAX_SIZE",
 *   generics: [],
 *   expression: E.c(100)
 * };
 * ```
 */
export interface TopLevelExpression {
  kind: LWKind.TopLevelExpression
  /** Name of the expression */
  name: string
  /** Generic type parameters (usually empty) */
  generics: GenericDescriptor[]
  /** The expression value */
  expression: LWExpression
  /** Optional type annotation */
  type?: LWType
}
/**
 * Union type representing any declaration AST node.
 * Declarations introduce new names into a scope.
 */
export type LWDeclaration =
  | EnumDeclaration
  | StructureDeclaration
  | ClassDeclaration
  | NamespaceDeclaration
  | TypedefDeclaration
  | FunctionDeclaration
  | TopLevelExpression

/**
 * Variable declaration statement AST node.
 * Represents a variable declaration (let, var, const in various languages).
 *
 * @example
 * ```typescript
 * // let x: number = 42
 * const letStatement: DeclarationStatement = {
 *   kind: LWKind.DeclarationStatement,
 *   varName: "x",
 *   varType: T.c("number"),
 *   mutable: true,
 *   static: false,
 *   expression: E.c(42)
 * };
 * ```
 */
export interface DeclarationStatement {
  kind: LWKind.DeclarationStatement
  /** Variable name */
  varName: string
  /** Variable type */
  varType: LWType
  /** Whether the variable is mutable (true for let/var, false for const) */
  mutable: boolean
  /** Whether the variable is static (class-level) */
  static: boolean
  /** Optional initializer expression */
  expression?: LWExpression
}
/**
 * Compound/block statement AST node.
 * Represents a sequence of statements enclosed in braces {}.
 *
 * @example
 * ```typescript
 * // { let x = 1; let y = 2; return x + y; }
 * const block: CompoundStatement = {
 *   kind: LWKind.CompoundStatement,
 *   statements: [
 *     S.decl("x", T.c("number"), true, false, E.c(1)),
 *     S.decl("y", T.c("number"), true, false, E.c(2)),
 *     S.ret(E.bin("+", E.v("x"), E.v("y")))
 *   ]
 * };
 * ```
 */
export interface CompoundStatement {
  kind: LWKind.CompoundStatement
  /** Statements contained within the block */
  statements: LWStatement[]
}
/**
 * Expression statement AST node.
 * Represents an expression evaluated for its side effects.
 *
 * @example
 * ```typescript
 * // x = 42;
 * const assignStmt: ExpressionStatement = {
 *   kind: LWKind.ExpressionStatement,
 *   expression: E.bin("=", E.v("x"), E.c(42))
 * };
 * ```
 */
export interface ExpressionStatement {
  kind: LWKind.ExpressionStatement
  /** The expression to evaluate (optional for empty statements) */
  expression?: LWExpression
}
/**
 * Return statement AST node.
 * Represents a return statement with optional return value.
 *
 * @example
 * ```typescript
 * // return x + y;
 * const returnStmt: ReturnStatement = {
 *   kind: LWKind.ReturnStatement,
 *   expression: E.bin("+", E.v("x"), E.v("y"))
 * };
 * ```
 */
export interface ReturnStatement {
  kind: LWKind.ReturnStatement
  /** Optional expression to return (void return if undefined) */
  expression?: LWExpression
}
/**
 * Loop statement AST node.
 * Represents a loop with initialization, condition, step, and body.
 * Can represent for-loops, while-loops, or do-while loops depending on which parts are present.
 *
 * @example
 * ```typescript
 * // for (let i = 0; i < 10; i++) { print(i); }
 * const forLoop: LoopStatement = {
 *   kind: LWKind.LoopStatement,
 *   init: S.decl("i", T.c("number"), true, false, E.c(0)),
 *   condition: E.bin("<", E.v("i"), E.c(10)),
 *   step: S.expr(E.unary("++", E.v("i"))),
 *   body: S.expr(E.call(Vs.print, [E.v("i")]))
 * };
 * ```
 */
export interface LoopStatement {
  kind: LWKind.LoopStatement
  /** Optional initialization statement (e.g., let i = 0) */
  init?: LWStatement
  /** Optional step statement (e.g., i++) */
  step?: LWStatement
  /** Loop condition expression (e.g., i < 10) */
  condition: LWExpression
  /** Loop body statement */
  body: LWStatement
}
/**
 * If statement AST node.
 * Represents a conditional statement with optional else branch.
 *
 * @example
 * ```typescript
 * // if (x > 0) { return "positive"; } else { return "non-positive"; }
 * const ifStmt: IfStatement = {
 *   kind: LWKind.IfStatement,
 *   condition: E.bin(">", E.v("x"), E.c(0)),
 *   thenBody: S.ret(E.s("positive")),
 *   elseBody: S.ret(E.s("non-positive"))
 * };
 * ```
 */
export interface IfStatement {
  kind: LWKind.IfStatement
  /** Condition expression */
  condition: LWExpression
  /** Statement to execute if condition is true */
  thenBody: LWStatement
  /** Optional statement to execute if condition is false */
  elseBody?: LWStatement
}
/**
 * Switch statement AST node.
 * Represents a switch statement with cases and default block.
 *
 * @example
 * ```typescript
 * // switch (x) { case 1: print("one"); break; default: print("other"); }
 * const switchStmt: SwitchStatement = {
 *   kind: LWKind.SwitchStatement,
 *   selector: E.v("x"),
 *   cases: [
 *     {
 *       value: E.c(1),
 *       body: [S.expr(E.call(Vs.print, [E.s("one")])), S.break()]
 *     }
 *   ],
 *   default: [S.expr(E.call(Vs.print, [E.s("other")]))]
 * };
 * ```
 */
export interface SwitchStatement {
  kind: LWKind.SwitchStatement
  /** Selector expression (the value being switched on) */
  selector: LWExpression
  /** Case clauses with constant values and statement bodies */
  cases: { value: ConstantExpression | ConstantExpression[], body: LWStatement[] }[]
  /** Default case statements */
  default?: LWStatement[]
}
/**
 * Break statement AST node.
 * Represents a break statement used to exit switch cases or loops.
 *
 * @example
 * ```typescript
 * // break;
 * const breakStmt: BreakStatement = {
 *   kind: LWKind.BreakStatement
 * };
 * ```
 */
export interface BreakStatement {
  kind: LWKind.BreakStatement
}
/**
 * ThrowStatement statement AST node.
 * Represents a throw statement which is used to throw an error.
 *
 * @example
 * ```typescript
 * // throw Error("Message")
 * ```
 */
export interface ThrowStatement {
  kind: LWKind.ThrowStatement
  /** Error expression (the value to be thrown) */
  error: LWExpression
}
/**
 * Empty/no-op statement AST node.
 * Represents a statement that does nothing (e.g., a single semicolon).
 *
 * @example
 * ```typescript
 * // ;
 * const emptyStmt: NoneStatement = {
 *   kind: LWKind.NoneStatement
 * };
 * ```
 */
export interface NoneStatement {
  kind: LWKind.NoneStatement
}
/**
 * Union type representing any statement AST node.
 * Statements are executable units of code.
 */
export type LWStatement =
  DeclarationStatement
  | CompoundStatement
  | ExpressionStatement
  | ReturnStatement
  | LoopStatement
  | IfStatement
  | SwitchStatement
  | BreakStatement
  | ThrowStatement
  | NoneStatement

/**
 * Variable reference expression AST node.
 * Represents a reference to a variable by name.
 *
 * @example
 * ```typescript
 * // x
 * const varExpr: VariableExpression = {
 *   kind: LWKind.VariableExpression,
 *   name: "x",
 *   hints: []
 * };
 *
 * // this.property (with ptrVal hint)
 * const thisExpr: VariableExpression = {
 *   kind: LWKind.VariableExpression,
 *   name: "this",
 *   hints: [Hs.ptrVal()]
 * };
 * ```
 */
export interface VariableExpression {
  kind: LWKind.VariableExpression
  /** Variable name */
  name: string
  /** Hints providing metadata about the variable */
  hints: Hint[]
}
/**
 * Constant/literal expression AST node.
 * Represents a constant value (number, boolean, etc.).
 *
 * @example
 * ```typescript
 * // 42
 * const numExpr: ConstantExpression = {
 *   kind: LWKind.ConstantExpression,
 *   value: "42",
 *   hints: []
 * };
 *
 * // true
 * const boolExpr: ConstantExpression = {
 *   kind: LWKind.ConstantExpression,
 *   value: "true",
 *   hints: []
 * };
 * ```
 */
export interface ConstantExpression {
  kind: LWKind.ConstantExpression
  /** String representation of the constant value */
  value: string
  /** Hints providing metadata about the constant */
  hints: Hint[]
}
/**
 * String literal expression AST node.
 * Represents a string literal value.
 *
 * @example
 * ```typescript
 * // "Hello, world!"
 * const strExpr: StringExpression = {
 *   kind: LWKind.StringExpression,
 *   value: "Hello, world!",
 *   hints: []
 * };
 * ```
 */
export interface StringExpression {
  kind: LWKind.StringExpression
  /** String value (without quotes) */
  value: string
  /** Hints providing metadata about the string */
  hints: Hint[]
}
/**
 * Unary operation expression AST node.
 * Represents a unary operation applied to an expression.
 *
 * @example
 * ```typescript
 * // -x
 * const negExpr: UnaryExpression = {
 *   kind: LWKind.UnaryExpression,
 *   op: "-",
 *   expression: E.v("x"),
 *   hints: []
 * };
 *
 * // !isReady
 * const notExpr: UnaryExpression = {
 *   kind: LWKind.UnaryExpression,
 *   op: "!",
 *   expression: E.v("isReady"),
 *   hints: []
 * };
 * ```
 */
export interface UnaryExpression {
  kind: LWKind.UnaryExpression
  /** Operand expression */
  expression: LWExpression
  /** Unary operator (e.g., "-", "!", "~", "++", "--") */
  op: string
  /** Hints providing metadata about the expression */
  hints: Hint[]
}
/**
 * Binary operation expression AST node.
 * Represents a binary operation applied to two expressions.
 *
 * @example
 * ```typescript
 * // x + y
 * const addExpr: BinaryExpression = {
 *   kind: LWKind.BinaryExpression,
 *   op: "+",
 *   left: E.v("x"),
 *   right: E.v("y"),
 *   hints: []
 * };
 *
 * // a && b
 * const andExpr: BinaryExpression = {
 *   kind: LWKind.BinaryExpression,
 *   op: "&&",
 *   left: E.v("a"),
 *   right: E.v("b"),
 *   hints: []
 * };
 * ```
 */
export interface BinaryExpression {
  kind: LWKind.BinaryExpression
  /** Left operand expression */
  left: LWExpression
  /** Binary operator (e.g., "+", "-", "*", "/", "&&", "||", "==", "<") */
  op: string
  /** Right operand expression */
  right: LWExpression
  /** Hints providing metadata about the expression */
  hints: Hint[]
}
/**
 * Function/method call expression AST node.
 * Represents a call to a function or method with arguments.
 *
 * @example
 * ```typescript
 * // add(1, 2)
 * const callExpr: CallExpression = {
 *   kind: LWKind.CallExpression,
 *   callee: E.v("add"),
 *   args: [E.c(1), E.c(2)],
 *   hints: []
 * };
 *
 * // Math.max<number>(x, y)
 * const genericCall: CallExpression = {
 *   kind: LWKind.CallExpression,
 *   callee: E.get(E.v("Math"), "max"),
 *   args: [E.v("x"), E.v("y")],
 *   typeArgs: [T.c("number")],
 *   hints: []
 * };
 * ```
 */
export interface CallExpression {
  kind: LWKind.CallExpression
  /** Expression representing the function to call */
  callee: LWExpression
  /** Argument expressions */
  args: LWExpression[]
  /** Optional type arguments for generic function calls */
  typeArgs?: LWType[]
  /** Hints providing metadata about the call */
  hints: Hint[]
}
/**
 * Property/member access expression AST node.
 * Represents access to a property or element of an object/array.
 *
 * @example
 * ```typescript
 * // obj.property
 * const propAccess: AccessorExpression = {
 *   kind: LWKind.AccessorExpression,
 *   base: E.v("obj"),
 *   accessor: "property",
 *   hints: []
 * };
 *
 * // array[index]
 * const indexAccess: AccessorExpression = {
 *   kind: LWKind.AccessorExpression,
 *   base: E.v("array"),
 *   accessor: E.v("index"),
 *   hints: []
 * };
 * ```
 */
export interface AccessorExpression {
  kind: LWKind.AccessorExpression
  /** Base object/array expression */
  base: LWExpression
  /** Accessor: property name string or index expression */
  accessor: string | LWExpression
  /** Hints providing metadata about the access */
  hints: Hint[]
}
/**
 * Object/instance construction expression AST node.
 * Represents creation of a new instance (new operator).
 *
 * @example
 * ```typescript
 * // new Date()
 * const dateConstructor: ConstructorExpression = {
 *   kind: LWKind.ConstructorExpression,
 *   data: { name: "Date" },
 *   args: [],
 *   hints: []
 * };
 *
 * // new Array<number>(10)
 * const arrayConstructor: ConstructorExpression = {
 *   kind: LWKind.ConstructorExpression,
 *   data: { name: "Array", typeArgs: [T.c("number")] },
 *   args: [E.c(10)],
 *   hints: []
 * };
 *
 * // new (Type)() - using type directly
 * const typeConstructor: ConstructorExpression = {
 *   kind: LWKind.ConstructorExpression,
 *   data: { type: T.c("SomeType") },
 *   args: [],
 *   hints: []
 * };
 * ```
 */
export interface ConstructorExpression {
  kind: LWKind.ConstructorExpression
  /** Constructor information: either a named type with optional type arguments, or a type directly */
  data: {
    name: string
    typeArgs?: LWType[]
  } | {
    type: LWType
  }
  /** Arguments to pass to the constructor */
  args: LWExpression[]
  /** Hints providing metadata about the construction */
  hints: Hint[]
}
/**
 * Type cast or instanceof check expression AST node.
 * Represents either a type cast (conversion) or an instanceof check.
 *
 * @example
 * ```typescript
 * // (string)value
 * const castExpr: CheckCastExpression = {
 *   kind: LWKind.CheckCastExpression,
 *   op: "cast",
 *   expression: E.v("value"),
 *   type: T.c("string"),
 *   hints: []
 * };
 *
 * // obj instanceof MyClass
 * const instanceofExpr: CheckCastExpression = {
 *   kind: LWKind.CheckCastExpression,
 *   op: "instanceof",
 *   expression: E.v("obj"),
 *   type: T.c("MyClass"),
 *   hints: []
 * };
 * ```
 */
export interface CheckCastExpression {
  kind: LWKind.CheckCastExpression
  /** Operation: "cast" for type casts, "instanceof" for type checks */
  op: 'cast' | 'instanceof'
  /** Expression being cast or checked */
  expression: LWExpression
  /** Target type for cast or check */
  type: LWType
  /** Hints providing metadata about the cast/check */
  hints: Hint[]
}
/**
 * Lambda/arrow function expression AST node.
 * Represents an anonymous function expression.
 *
 * @example
 * ```typescript
 * // (x: number, y: number) => x + y
 * const lambdaExpr: LambdaExpression = {
 *   kind: LWKind.LambdaExpression,
 *   parameters: [
 *     { name: "x", type: T.c("number") },
 *     { name: "y", type: T.c("number") }
 *   ],
 *   body: S.ret(E.bin("+", E.v("x"), E.v("y"))),
 *   hints: []
 * };
 *
 * // () => { console.log("hello"); }
 * const voidLambda: LambdaExpression = {
 *   kind: LWKind.LambdaExpression,
 *   parameters: [],
 *   body: S.expr(E.call(E.v("console.log"), [E.s("hello")])),
 *   closure: ["someVar"],
 *   hints: []
 * };
 * ```
 */
export interface LambdaExpression {
  kind: LWKind.LambdaExpression
  /** Function parameters */
  parameters: {
    name: string
    type: LWType
  }[]
  /** Function body statement */
  body: LWStatement
  /** Optional list of variable names captured from outer scope (closure) */
  closure?: string[]
  /** Hints providing metadata about the lambda */
  hints: Hint[]
}
/**
 * Type expression AST node.
 * Represents a type used as a value (e.g., in typeof expressions or type guards).
 *
 * @example
 * ```typescript
 * // typeof MyClass
 * const typeExpr: TypeExpression = {
 *   kind: LWKind.TypeExpression,
 *   type: T.c("MyClass"),
 *   hints: []
 * };
 * ```
 */
export interface TypeExpression {
  kind: LWKind.TypeExpression
  /** The type being used as a value */
  type: LWType
  /** Hints providing metadata about the type expression */
  hints: Hint[]
}
/**
 * Placeholder/hole expression AST node.
 * Represents an incomplete or placeholder expression (used during incremental construction
 * or as a placeholder for code generation).
 *
 * @example
 * ```typescript
 * // Placeholder for an expression to be filled later
 * const holeExpr: HoleExpression = {
 *   kind: LWKind.HoleExpression,
 *   data: { description: "expression to be determined" },
 *   hints: []
 * };
 * ```
 */
export interface HoleExpression {
  kind: LWKind.HoleExpression
  /** Arbitrary data associated with the hole (type and structure determined by usage) */
  readonly data: unknown
  /** Hints providing metadata about the hole */
  hints: Hint[]
}
/**
 * Union type representing any expression AST node.
 * Expressions produce values when evaluated.
 */
export type LWExpression =
  VariableExpression
  | ConstantExpression
  | StringExpression
  | UnaryExpression
  | BinaryExpression
  | CallExpression
  | AccessorExpression
  | ConstructorExpression
  | CheckCastExpression
  | LambdaExpression
  | TypeExpression
  | HoleExpression

/**
 * Value type AST node.
 * Represents a named type with optional type arguments.
 *
 * @example
 * ```typescript
 * // number
 * const numberType: ValueType = {
 *   kind: LWKind.ValueType,
 *   name: "number",
 *   args: []
 * };
 *
 * // Array<string>
 * const arrayType: ValueType = {
 *   kind: LWKind.ValueType,
 *   name: "Array",
 *   args: [T.c("string")]
 * };
 *
 * // Map<string, number>
 * const mapType: ValueType = {
 *   kind: LWKind.ValueType,
 *   name: "Map",
 *   args: [T.c("string"), T.c("number")]
 * };
 * ```
 */
export interface ValueType {
  kind: LWKind.ValueType
  /** Type name (e.g., "number", "string", "Array", "Map") */
  name: string
  /** Type arguments for generic types */
  args: LWType[]
}
/**
 * Functional type AST node.
 * Represents a function type (signature).
 *
 * @example
 * ```typescript
 * // (x: number, y: number) => number
 * const funcType: FunctionalType = {
 *   kind: LWKind.FunctionalType,
 *   params: [
 *     { name: "x", type: T.c("number") },
 *     { name: "y", type: T.c("number") }
 *   ],
 *   returnType: T.c("number")
 * };
 *
 * // () => void
 * const voidFuncType: FunctionalType = {
 *   kind: LWKind.FunctionalType,
 *   params: [],
 *   returnType: T.c("void")
 * };
 * ```
 */
export interface FunctionalType {
  kind: LWKind.FunctionalType
  /** Function parameters with names and types */
  params: {
    name: string
    type: LWType
  }[]
  /** Function return type */
  returnType: LWType
}
/**
 * Placeholder/hole type AST node.
 * Represents an incomplete or placeholder type (used during incremental construction
 * or as a placeholder for type inference).
 *
 * @example
 * ```typescript
 * // Placeholder for a type to be inferred
 * const holeType: HoleType = {
 *   kind: LWKind.HoleType,
 *   data: { description: "type to be inferred" }
 * };
 * ```
 */
export interface HoleType {
  kind: LWKind.HoleType
  /** Arbitrary data associated with the type hole (type and structure determined by usage) */
  readonly data: unknown
}

/**
 * Union type representing any type AST node.
 * Types describe the shape or classification of values.
 */
export type LWType =
  ValueType
  | FunctionalType
  | HoleType

/**
 * Program chunk AST node.
 * Represents a complete unit of code with package name and declarations.
 * Used as the top-level container for generated code.
 *
 * @example
 * ```typescript
 * // A complete module/package
 * const program: LWProgramChunk = {
 *   package: "com.example.mymodule",
 *   traits: ["Serializable", "Cloneable"],
 *   meta: "Generated by OST",
 *   declarations: [classDecl, functionDecl, enumDecl]
 * };
 * ```
 */
export interface LWProgramChunk {
  /** Package/module name */
  package: string
  /** Traits/interfaces implemented by this package (conceptual) */
  traits: string[] // think about it
  /** Metadata string (e.g., generation info, comments) */
  meta: string // and about it
  /** Top-level declarations in the package */
  declarations: LWDeclaration[]
}
