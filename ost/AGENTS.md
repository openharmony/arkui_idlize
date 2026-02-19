# OST (Output Syntax Tree) - Project Overview

OST is a TypeScript library for building Abstract Syntax Trees (ASTs) and generating code in multiple programming languages. It provides a type-safe, extensible framework for cross-language code generation, part of the "idlizer" ecosystem.

## Table of Contents

- [Project Structure](#project-structure)
- [AST Node Types (LWKind)](#ast-node-types-lwkind)
- [Builder Patterns](#builder-patterns)
  - [Original Builders](#1-original-builders-srcbuildersoriginalts)
  - [Advanced Builders](#2-advanced-builders-srcbuildersadvancedts)
  - [Verbose Builders](#3-verbose-builders-srcbuildersverbosets)
- [Language Translators](#language-translators)
- [Visitor Pattern](#visitor-pattern)
- [Standard Library](#standard-library)
- [Build and Development](#build-and-development)
- [License](#license)
- [Project Context](#project-context)

## Project Structure

```
ost/
├── src/
│   ├── builders/          # AST builder patterns
│   │   ├── original.ts    # Basic factory functions (E, S, T, D, DD)
│   │   ├── advanced.ts    # Fluent builder pattern (Builders class)
│   │   └── verbose.ts     # Verbose builder functions
│   ├── printers/          # Code generation
│   │   ├── translators/   # Language-specific generators
│   │   │   ├── typescript.ts
│   │   │   ├── cxx.ts
│   │   │   ├── java.ts
│   │   │   ├── arkts.ts
│   │   │   └── cangjie.ts
│   │   ├── indent.ts     # Indentation-aware printer
│   │   └── dump.ts       # Debugging/dumping printer
│   ├── visitors/         # Visitor pattern implementation
│   │   └── identity.ts   # Identity transformer base class
│   ├── lws.ts           # Core AST node definitions (LW = "Lightweight" syntax)
│   ├── stdlib.ts        # Standard library definitions
│   └── index.ts         # Main entry point exports
├── package.json         # npm configuration
├── tsconfig.json       # TypeScript compiler configuration
└── BUILD.gn            # GN build system configuration
```

## AST Node Types (LWKind)

The AST is defined in `src/lws.ts` with the `LWKind` enum containing 50+ node types:

```typescript
export enum LWKind {
  // Declarations
  EnumDeclaration,
  StructureDeclaration,
  ClassDeclaration,
  NamespaceDeclaration,
  TypedefDeclaration,
  FunctionDeclaration,
  TopLevelExpression,

  // Statements
  DeclarationStatement,
  CompoundStatement,
  ExpressionStatement,
  ReturnStatement,
  LoopStatement,
  IfStatement,
  SwitchStatement,
  NoneStatement,

  // Expressions
  VariableExpression,
  ConstantExpression,
  StringExpression,
  UnaryExpression,
  BinaryExpression,
  CallExpression,
  AccessorExpression,
  ConstructorExpression,
  CheckCastExpression,
  LambdaExpression,
  TypeExpression,
  HoleExpression,

  // Types
  ValueType,
  FunctionalType,
  HoleType,
}
```

### Node Interfaces

- **Declarations**: `EnumDeclaration`, `StructureDeclaration`, `ClassDeclaration`, etc.
- **Statements**: `DeclarationStatement`, `CompoundStatement`, `ReturnStatement`, etc.
- **Expressions**: `VariableExpression`, `BinaryExpression`, `CallExpression`, etc.
- **Types**: `ValueType`, `FunctionalType`, `HoleType`

### Decorator System

Three types of decorators:

1. **Hints**: Metadata for expressions (`ptrVal`, `asStruct`, `staticMethod`, etc.)
2. **Modifiers**: Language modifiers (`native`, `optional`, `private`, `static`, etc.)
3. **Annotations**: Decorators/attributes for declarations

## Builder Patterns

OST provides three builder patterns for constructing AST nodes:

### 1. Original Builders (`src/builders/original.ts`)

Basic factory functions:

```typescript
import { E, S, T, D, DD } from '@idlizer/ost';

// Expressions
const expr = E.bin('+', E.v('x'), E.c(42));
const call = E.call(E.v('foo'), [E.v('arg')]);
const access = E.get(E.v('obj'), 'property');

// Statements
const stmt = S.ret(E.v('result'));

// Types
const type = T.c('string');
const ptrType = T.ptr(T.c('int'));

// Declarations
const func = D.func('main', [], T.void(), S.block([]));
```

### 2. Advanced Builders (`src/builders/advanced.ts`)

Fluent interface with method chaining:

```typescript
import { Builders } from '@idlizer/ost';

const expr = Builders.expr()
  .binary('+')
  .left(1)
  .right(2)
  .$();

const func = Builders.func()
  .name('calculate')
  .param('x', T.number())
  .returns(T.number())
  .body(b => b.ret(b.expr().binary('*').left('x').right(2).$()))
  .$();
```

### 3. Verbose Builders (`src/builders/verbose.ts`)

Explicitly named functions:

```typescript
import { ExpressionBuilders, StatementBuilders } from '@idlizer/ost';

const expr = ExpressionBuilders.makeBinaryExpression('+',
  ExpressionBuilders.makeVariable('x'),
  ExpressionBuilders.makeConstant(42)
);
```

## Language Translators

OST can generate code in multiple languages:

### Available Translators

- **TypeScript**: `processNPrintTS` (`src/printers/translators/typescript.ts`)
- **C++**: `processNPrintCXX` (`src/printers/translators/cxx.ts`)
- **Java**: `processNPrintJava` (`src/printers/translators/java.ts`)
- **ArkTS**: `processNPrintArkTS` (`src/printers/translators/arkts.ts`) - Huawei's TypeScript variant
- **Cangjie**: `processNPrintCJ` (`src/printers/translators/cangjie.ts`)
- **Debug Dump**: `dumpToString` (`src/printers/dump.ts`) - Human-readable AST format

### Usage Example

```typescript
import { processNPrintTS, processNPrintCXX, dumpToString } from '@idlizer/ost';
import { E, S, D, T } from '@idlizer/ost';

// Create a simple function AST
const func = D.func(
  'add',
  [{ name: 'a', type: T.number() }, { name: 'b', type: T.number() }],
  T.number(),
  S.ret(E.bin('+', E.v('a'), E.v('b')))
);

// Generate TypeScript code
const tsCode = processNPrintTS(func, 'myModule', new Set());
console.log(tsCode);
// Output: function add(a: number, b: number): number { return a + b; }

// Generate C++ code
const cxxCode = processNPrintCXX(func, 'myModule', new Set());
console.log(cxxCode);

// Debug the AST
const debugOutput = dumpToString(func);
console.log(debugOutput);
```

## Visitor Pattern

The `IdentityTransformer` class (`src/visitors/identity.ts`) provides a base visitor for AST transformations:

```typescript
import { IdentityTransformer } from '@idlizer/ost';

class MyTransformer extends IdentityTransformer {
  override goVariableExpression(expr: VariableExpression): VariableExpression {
    // Transform variable expressions
    if (expr.name === 'oldName') {
      return { ...expr, name: 'newName' };
    }
    return super.goVariableExpression(expr);
  }
}

const transformer = new MyTransformer();
const transformedAst = transformer.goDeclaration(myAst);
```

## Standard Library

The standard library (`src/stdlib.ts`) provides several exported objects for common operations:

### Exported Objects

```typescript
import { std, Hs, Md, Vs, Op, Ts } from '@idlizer/ost';
```

- **`std`**: Contains `names` object with categorized constants for types, variables, hints, modifiers, etc.
- **`Hs`**: Hint constructors (`Hs.ptrVal()`, `Hs.asStruct()`, `Hs.staticMethod()`, etc.)
- **`Md`**: Modifier constructors (`Md.native()`, `Md.optional()`, `Md.private()`, etc.)
- **`Vs`**: Special variable references (`Vs.self`, `Vs.base`, `Vs.null`, `Vs.print`)
- **`Op`**: Operation constants (`Op.add`, `Op.sub`, `Op.eq`, `Op.neq`, etc.)
- **`Ts`**: Type constructors (`Ts.ptr()`, `Ts.optional()`, `Ts.array()`, etc.)

### Type Names
```typescript
@LW.Bigint      // bigint type
@LW.String      // string type
@LW.Void        // void type
@LW.Number      // number type
@LW.Boolean     // boolean type
// ... and many more (see std.names.types)
```

### Special Variables
```typescript
@self           // this/self reference (Vs.self)
@base           // super/base reference (Vs.base)
@null           // null literal (Vs.null)
@print          // print/console.log (Vs.print)
```

### Operations
```typescript
Op.add          // addition operator
Op.sub          // subtraction operator
Op.eq           // equality operator
// ... etc. (see std.names.operations)
```

### Type Constructors
```typescript
Ts.ptr()        // pointer type constructor
Ts.optional()   // optional type constructor
Ts.array()      // array type constructor
Ts.union()      // union type constructor
Ts.map()        // map type constructor
```

### Usage Example
```typescript
import { Hs, Md, Ts, Op } from '@idlizer/ost';

// Create a pointer type with optional modifier
const pointerType = Ts.ptr(Ts.prim.number);
const optionalType = Ts.optional(Ts.prim.string);

// Add hints and modifiers to expressions
const hint = Hs.ptrVal();        // ptrVal hint
const modifier = Md.native();    // native modifier

// Use operation constants
const binaryExpr = E.bin(Op.add, leftExpr, rightExpr);
```

## Build and Development

### Installation

```bash
npm install @idlizer/ost
```

### Building from Source

```bash
npm run clean      # Clean build directory
npm run compile    # Compile TypeScript to JavaScript
```

### Development Commands

```bash
# Compile the project
npm run compile:self

# Clean build artifacts
npm run clean
```

### Dependencies

- **TypeScript**: 4.9.5
- **Node.js**: >= 18
- **npm**: >= 8

## License

Copyright (c) 2024 Huawei Device Co., Ltd.
Licensed under the Apache License, Version 2.0.

## Key Features

1. **Type-safe AST construction** with TypeScript interfaces
2. **Multiple builder patterns** for different use cases
3. **Cross-language code generation** (TypeScript, C++, Java, ArkTS, Cangjie)
4. **Visitor pattern** for AST transformations
5. **Decorator system** for metadata and language features
6. **Standard library** with common types and operations
7. **Debug utilities** for AST inspection

## Example: Creating a Simple Class

```typescript
import { Builders } from '@idlizer/ost';

const personClass = Builders.class()
  .name('Person')
  .field('name', T.string())
  .field('age', T.number())
  .method('greet')
  .returns(T.string())
  .body(b => b.ret(b.expr().string(`Hello, my name is ${b.expr().get('this').get('name').$()}`)))
  .$()
  .$();

// Generate TypeScript code
const tsCode = processNPrintTS(personClass, 'example', new Set());
console.log(tsCode);
```

This would generate:
```typescript
class Person {
  name: string;
  age: number;

  greet(): string {
    return `Hello, my name is ${this.name}`;
  }
}
```

## Project Context

OST is part of the "idlize" ecosystem for generating cross-language bindings and interfaces. It's particularly useful for:

- Generating TypeScript definitions from C++/Java code
- Creating cross-language API bindings
- Code generation tools and DSLs
- Educational tools for AST manipulation and code generation

## Recent Development

- **Version**: 2.2.2+devel
- **Recent focus**: Added multiple builder modes, FixedArray generation
- **Branch**: `ik/more-builders` (active development)
