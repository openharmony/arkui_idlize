# Agent Reference: ohosgen Builders and Producers

## Overview

The `ohosgen` code generator transforms IDL interface definitions into TypeScript/ArkTS code using a **producer** system that maps IDL nodes to LW (Lightweight) AST declarations, which are then printed by language-specific printers.

## Features

Features determine:
- which producers are used for code generation
- initial set of IDL declarations to produce from
- import sources for unknown entities

There are currently two features:
- `--feature=ost` turns on OST based generation
- `--feature=arkui` adds ArkUI-specific producers that generate ArkUI components, peers, modifiers

### OST Feature

There are unit tests in `ohosgen/tests/ost`, use `npm run all:arkts` to run them.

### ArkUI Feature

There is minimal SDK subset (Blank component + CommonMethod + a few supporting files) in `ohosgen/arkui/subset`. Use:
- `npm run gen:subset` to generate ArkTS peers
- `npm run cc:subset` to compile native code (succeeds)
- `npm run compile:subset` to compile ArkTS code (currently fails)

## Builder Style Guidelines

### Always prefer fluent APIs

When constructing AST nodes, **always use the fluent builder API** (method chaining with `.$()` finalization) rather than constructing raw AST objects manually. Raw object literals with `kind: LWKind.*` fields are harder to read, error-prone, and require `as any` casts to satisfy the type system.

❌ **Avoid** — raw AST object construction:
```typescript
{
  kind: LWKind.SwitchStatement,
  selector: E.get(E.v('flagArray'), E.c(i)),
  cases: [
    { value: E.c(1), body: [S.e(E.call(E.get(E.v('this'), prop.name), [...])), S.e(E.v('break'))] },
  ],
  default: [S.e(E.call(E.get(E.v('this'), prop.name), [E.v('undefined')])), S.e(E.v('break'))]
} as any
```

✅ **Prefer** — fluent builder API:
```typescript
Builders.switch()
  .selector().access(E.c(i)).receiver('flagArray').$().$()
  .case(1)
    .call(prop.name).receiver('this').arg().access(fieldName).receiver('modifier').$().$().$()
    .break().$()
  .default([
    Builders.stmt().call(prop.name).receiver('this').arg('undefined').$().$(),
    S.break(),
  ]).$()
```

### Prefer advanced builders (`Builders`) over original ones (`E`, `S`)

Use the **advanced builder classes** from `Builders` (defined in `ost/src/builders/advanced.ts`) for all non-trivial constructs. The original factories (`E`, `S`, `T`) should only be used for the most primitive, leaf-level constructs:

**Use original builders (`E`, `S`, `T`) only for:**
- Constants and variable names: `E.c(42)`, `E.c(i)`, `E.v('name')`
- Simple type references: `T.c('ClassName')`, `Ts.prim.void`
- Break statements: `S.break()`

**Use advanced builders (`Builders`) for everything else:**
- Expressions: `Builders.expr().binary('+').left(1).right(2).$()` instead of `E.bin('+', E.c(1), E.c(2))`
- Statements: `Builders.stmt().call('f').arg(x).$().$()` instead of `S.e(E.call(E.v('f'), [x]))`
- Conditions: `.cond().binary('==').left().access(...).right(0).$().$()` instead of `.condition(E.bin('==', E.get(...), E.c(0)))`
- Assignments: `.binary('=').left().access('field').receiver('this').$().$().right(1).$()` instead of `.binary('=').left(E.get(E.v('this'), 'field')).right(E.c(1)).$()`
- Declarations, classes, functions, lambdas, switches, loops, if-statements — always use `Builders.*`

**Use `.methods()` with `.map()` instead of `forEach` loops:**

❌ **Avoid:**
```typescript
props.forEach((prop, i) => {
  classBuilder.method(prop.name)
    .param('value').type(propTypes[i]).$()
    .block().$().$()
})
```

✅ **Prefer:**
```typescript
classBuilder.methods(props.map((prop, i) =>
  Builders.func(prop.name)
    .param('value').type(propTypes[i]).$()
    .block().$().$()))
```

This keeps the entire class construction as a single fluent chain rather than breaking it into imperative mutation steps.

## Key Concepts

### Producers

A **producer** is registered via `createProducer(selector, callback)` where:
- `selector` has `{ is, predicate, role }` — `is` is a type guard (e.g., `idl.isInterface`), `predicate` filters nodes, `role` is a string like `'managed'`, `'peer'`, `'component'`, `'native-module'`.
- The callback receives `(node, ctx)` and returns `{ continuation, declarations, trigger? }`.
- `continuation` is a `LWType` (usually `T.c(name)`) that other producers can reference via `expectType(ctx, node, role)`.
- `declarations` is an array of LW AST nodes (`ClassDeclaration`, `FunctionDeclaration`, etc.).
- `trigger` is an optional array of `OhosSeed` to trigger further production for child nodes.

### Roles

- `'managed'` — the high-level interface/modifier/component API (e.g., `BlankAttribute`, `BlankModifier`)
- `'peer'` — the native peer class (e.g., `BlankPeer`)
- `'component'` — the component implementation class (e.g., `BlankComponent`)
- `'native-module'` — native module function calls

### Cross-referencing between producers

- `expectType(ctx, node, role)` — resolves the LW type for a node in a given role. For example, `expectType(ctx, attrNode, 'peer')` returns the peer type for an attribute node.
- `expectExpr(ctx, node, role)` — resolves an LW expression for a node in a given role.

## LW AST Builders

All builders are accessed via the `Builders` namespace. The builder pattern uses method chaining with `.$()` to finalize/close a scope.

### Types (`T`, `Ts`)

```typescript
T.c('ClassName')                    // ValueType: named type
T.c('Generic', T.c('Arg'))         // Generic type with type argument
T.fn([['param', type]], retType)   // FunctionalType
Ts.prim.void                       // Primitive: void
Ts.prim.number                     // Primitive: number
Ts.prim.boolean                    // Primitive: boolean
Ts.prim.str                        // Primitive: string
Ts.prim.i32                        // Primitive: int
Ts.prim.pointer                    // Primitive: pointer (long)
Ts.prim.self                       // Self type (this)
Ts.optional(type)                  // type | undefined
```

### Expressions (`E`)

```typescript
E.c(42)                            // ConstantExpression (number)
E.c('someIdentifier')              // ConstantExpression (raw identifier/value)
E.c(-1)                            // Negative constant
E.s('string value')                // StringExpression (quoted string)
E.v('varName')                     // VariableExpression
E.v('TypeName', [Hs.isType()])     // Variable with type hint
E.get(expr, 'field')               // AccessorExpression: expr.field
E.get(expr, E.c(0))                // AccessorExpression: expr[0]
E.bin('==', left, right)           // BinaryExpression
E.bin('!=', left, right)
E.bin('=', left, right)            // Assignment
E.call(funcExpr, [args])           // CallExpression
E.call(funcExpr, [args], [typeArgs]) // Generic call
E.instance('ClassName', [args])    // ConstructorExpression: new ClassName(args)
E.cast(expr, type)                 // CheckCastExpression: (expr as type)
E.lambda(params, bodyStmt)         // LambdaExpression: (params) => body
```

### Statements (`S`)

```typescript
S.e(expr)                          // ExpressionStatement
S.return(expr)                     // ReturnStatement (for function bodies)
S.declaration(name, type, const, initExpr) // DeclarationStatement (const name: type = init)
S.if(condition, thenStmt)          // IfStatement
S.block([stmts])                   // CompoundStatement: { stmts }
S.break()                          // BreakStatement
```

**Note:** There is no `S.throw()`. Use `S.e(E.v('throw new Error("message")'))` to emit a throw statement, or use `.unimplemented()` in a block builder for the common "Not implemented" stub pattern.

### Class Builder

```typescript
Builders.class('Name')
  .interface()                     // Makes it an interface declaration
  .extends(parentType)             // Extends a parent class/interface
  .implements(interfaceType)       // Implements an interface (can chain multiple)
  .fields(fieldsArray)             // Set class fields
  .ctor()                          // Start constructor builder
    .param('name').type(type).$()  // Constructor parameter
    .block()                       // Constructor body
      .call('super').arg(...).$()  // Call super
      .$().$()                     // Close block, close ctor
  .method('name')                  // Start method builder
    .static()                      // Make method static
    .param('name').type(type).$()  // Method parameter
    .returns(type)                 // Return type
    .block()                       // Method body
      // ... statements ...
      .$().$()                     // Close block, close method
  .$()                             // Finalize class → ClassDeclaration
```

### Class Fields

Fields are an array of objects:
```typescript
const fields: ClassDeclaration['fields'] = [
  { name: 'fieldName', type: someType },                    // Uninitialized
  { name: 'fieldName', type: someType, expression: initExpr }, // With initializer
]
```

### Function Builder

```typescript
Builders.func('name')
  .param('name').type(type).$()
  .returns(type)
  .annotation('memo')              // Add decorator
  .block()
    // ... statements ...
    .$().$()                       // Close block, close func → FunctionDeclaration
```

### Lambda Builder

```typescript
Builders.lambda()
  .param('name').type(type).$()
  .body()                          // Returns a StatementBuilder
    .block()                       // For block body
      // ... statements ...
      .$().$().$()                 // Close block, close body, close lambda
    .call('func').$().$().$()     // For expression body (single call)
```

### Block Builder (Statement Builder)

Inside `.block()`:
```typescript
.decl('name').value(expr).$().$()           // const name = expr
.call('func').arg(expr).$()                 // func(expr)
.call('method').receiver('obj').arg(...).$() // obj.method(...)
.call('method').receiver().access('field').receiver('this').$().$().arg(...).$()
                                             // this.field.method(...)
.binary('=').left(expr).right(expr).$()     // left = right
.if()
  .condition(expr)
  .then().block().$().$()
  .else().block().$().$()
  .$()
.return().value('varName').$()              // return varName
.return().value(expr).$()                   // return expr
.return().cast(type).value().access('f').receiver('this').$().$().$().$()
                                             // return (this.f as type)
.return().ctor('ClassName').$().$()         // return new ClassName()
.break()                                    // break (in switch/loop)
.unimplemented()                            // throw new Error("Not implemented")
.statements([stmt1, stmt2, ...])            // Add raw LWStatement array
```

### Switch Builder

Use `Builders.switch()` to create switch statements with the fluent builder API:

```typescript
Builders.switch()
  .selector().var('x').$()         // switch (x)
  .case(0)                         // case 0:
    .call('handleZero').$()        //   handleZero()
    .break()                       //   break; — also finalizes the case
  .case(1, 2)                 // case 1: case 2: (fall-through)
    .call('handleSmall').$()       //   handleSmall()
    .break()                       //   break;
  .default([S.e(E.call(E.v('handleOther'), []))])  // default: handleOther()
  .$()                             // Finalize → SwitchStatement
```

You can also construct switch statements inside blocks:
```typescript
.block()
  .switch()
    .selector().var('flag').$()
    .case(1).return().value('one').$().$()   // case 1: return 'one'
    .case(2).return().value('two').$().$()   // case 2: return 'two'
    .$()
  .$()
```

## IDL Node Access

### Common IDL operations

```typescript
idl.getFQName(node)                // Get fully qualified name of an IDL node
idl.isInterface(node)              // Type guard for IDLInterface
idl.hasExtAttribute(node, attr)    // Check for extended attributes
idl.IDLExtendedAttributes.Component // Extended attribute constants
idl.createConstructor(params, ret) // Create a constructor IDL node
idl.createParameter(name, type)    // Create a parameter IDL node
idl.createPrimitiveType('i32')     // Create a primitive type
```

### IDLInterface properties

```typescript
node.name                          // Interface name (e.g., 'BlankAttribute')
node.inheritance                   // Array of parent type references (IDLReferenceType[])
node.properties                    // Array of IDLProperty
```

### IDLReferenceType

The `inheritance` array contains `IDLReferenceType` nodes. To get the name:
```typescript
(node.inheritance[0] as idl.IDLReferenceType).name  // e.g., 'CommonMethod'
```

**Warning:** `idl.getFQName()` does NOT work on `IDLReferenceType` nodes — it throws "Can not calculate own name for node ReferenceType". Use `.name` directly.

### IDLProperty

```typescript
prop.name                          // Property name
prop.type                          // Property type (IDLType)
```

## Naming Conventions

```typescript
managedName(fqName)                // Convert FQ IDL name to managed name
// e.g., 'arkui.component.blank.BlankAttribute' → 'BlankAttribute'
```

Common patterns:
- Attribute: `BlankAttribute` (from IDL interface name)
- Modifier: `BlankModifier` (replace `Attribute` suffix with `Modifier`)
- Peer: `BlankPeer` (replace `Attribute` suffix with `Peer`)
- Component: `BlankComponent` (replace `Attribute` suffix with `Component`)

## Build & Test Commands

```bash
npm run compile -C ohosgen          # Compile (tsc + rollup)
npm run gen:subset -C ohosgen/arkui # Generate subset output
```

Output goes to: `ohosgen/arkui/subset/out/generated/arkts/`

## Printer Limitations

1. **No semicolons:** The printer generally omits semicolons after expression statements.
2. **Lambda bodies:** A lambda with `S.return(expr)` body prints `() => return expr`. Use `S.e(expr)` for expression-body lambdas: `() => expr`.

## Producer Architecture

### Where producers live

Producers are defined in two locations:

1. **`ohosgen/src/arkui/`** — ArkUI-specific producers for component attributes, peers, and components.
2. **`libohos/src/ostgen/producers/`** — General-purpose producers shared across generators, split into:
   - `managed/` — producers for the managed (TypeScript/ArkTS) side
   - `native/` — producers for the native (C API) side
   - `components/` — shared helper components (argConvertor, serializer logic)

### Producer inventory

#### ArkUI producers (`ohosgen/src/arkui/`)

| Producer | File | IDL Node Type | Role | Purpose |
|----------|------|---------------|------|---------|
| `attributeProducer` | `managed/attribute.ts` | Interface (with `Component` ext-attr or root) | `managed` | Generates attribute interface, implementation function, and modifier class |
| `peerProducer` | `managed/attribute.ts` | Interface (same predicate) | `peer` | Generates the peer class that wraps native node |
| `componentProducer` | `managed/attribute.ts` | Interface (same predicate) | `component` | Generates the component class that implements the attribute interface |
| `propertyProducer` | `managed/property.ts` | Property | `peer` | Generates per-property setter on the peer, plus interface/component method stubs |
| `interfaceProducer` | `managed/interface.ts` | Interface (with `ComponentInterface` ext-attr) | `managed` | Generates type reference and triggers callable processing |
| `optionsProducer` | `managed/callable.ts` | Callable | `peer` | Generates `setXxxOptions` methods for component interfaces |

#### Managed producers (`libohos/src/ostgen/producers/managed/`)

| Producer | File | IDL Node Type | Role | Purpose |
|----------|------|---------------|------|---------|
| `enumProducer` | `enum.ts` | Enum | `managed` | Generates enum declaration |
| `functionProducer` | `function.ts` | Method | `managed` | Generates method with serialization and native module call |
| `constructorProducer` | `function.ts` | Constructor | `managed` | Generates constructor that calls native module |
| `structureProducer` | `structure.ts` | Interface | `managed` | Generates class/interface; for materialized interfaces, triggers methods and constructors |
| `primitiveProducer` | `primitives.ts` | PrimitiveType | *(any)* | Maps IDL primitive types to LW types |
| `referenceProducer` | `references.ts` | ReferenceType | *(any)* | Resolves reference to its declaration and delegates |
| `optionalProducer` | `optional.ts` | OptionalType | *(any)* | Wraps inner type in `Ts.optional()` |
| `containerProducer` | `containers.ts` | ContainerType | *(any)* | Handles sequences (arrays) and records (maps) |
| `unionProducer` | `union.ts` | UnionType | *(any)* | Produces union of member types |
| `callbackProducer` | `callback.ts` | Callback | `managed` | Generates callback type alias and deserialization function |
| `typedefProducer` | `typedef.ts` | Typedef | `managed` | Generates type alias |
| `nativeModuleFunctionProducer` | `nativeModule.ts` | Method | `native-module` | Generates native module method declaration and interop bridge |
| `nativeModuleConstructorProducer` | `nativeModule.ts` | Constructor | `native-module` | Generates native module constructor and interop bridge |
| `nativeModuleMaterializedProducer` | `nativeModule.ts` | Interface | `native-module` | Delegates to `nativeModuleFunctionProducer` for the finalizer |
| `serializerProducer` | `serializer.ts` | Interface | `managed-serde` | Generates serializer/deserializer class for data interfaces |

#### Native producers (`libohos/src/ostgen/producers/native/`)

| Producer | File | IDL Node Type | Role | Purpose |
|----------|------|---------------|------|---------|
| `enumProducer` | `enum.ts` | Enum | `capi` | Generates C API enum |
| `structureProducer` | `structure.ts` | Interface | `capi` | Generates C struct or opaque pointer type |
| `callbackProducer` | `callback.ts` | Callback | `capi` | Generates C callback struct and bridge functions |
| `functionProducer` | `function.ts` | Method | `capi` | Generates C API function pointer in modifier struct |
| `constructorProducer` | `function.ts` | Constructor | `capi` | Generates C API constructor function pointer |
| `serializerProducer` | `serializer.ts` | Interface | `native-serde` | Generates native serializer/deserializer |

### How producers call each other

Producers form a call graph through three mechanisms:

#### 1. `expectType(ctx, node, role)` — type resolution

A producer calls `expectType` to obtain the LW type that another producer generates for a given IDL node and role. The engine finds the matching producer (by IDL node type guard + predicate + role) and returns its `continuation` type. This is the most common inter-producer call.

**Example:** `attributeProducer` calls `expectType(ctx, node, 'peer')` to get the peer type, which causes `peerProducer` to run and return `T.c('BlankPeer')`.

#### 2. `expectExpr(ctx, node, role)` — expression resolution

Similar to `expectType`, but returns an LW expression instead of a type. Used when a producer needs a callable expression from another producer.

**Example:** `functionProducer` calls `expectExpr(ctx, method, 'native-module')` to get the native module function expression, which causes `nativeModuleFunctionProducer` to run.

#### 3. `trigger` — child node processing

A producer can return a `trigger` array of `OhosSeed(node, role)` objects. The engine will process each seed, finding and running the appropriate producer. This is used to cascade processing to child nodes.

**Example:** `attributeProducer` returns `trigger: node.properties.map(it => new OhosSeed(it, 'peer'))`, which causes `propertyProducer` to run for each property.

### Key call patterns

- **ArkUI attribute → peer → native module → C API:** The `attributeProducer` (managed) triggers `propertyProducer` (peer) via `trigger`. The `propertyProducer` calls `functionProducer` (managed) via `expectExpr`. The `functionProducer` calls `nativeModuleFunctionProducer` (native-module) via `expectExpr`. The `nativeModuleFunctionProducer` calls native `functionProducer` (capi) via `expectExpr`.

- **ArkUI attribute ↔ component ↔ peer:** The `attributeProducer`, `componentProducer`, and `peerProducer` cross-reference each other via `expectType` with roles `managed`, `component`, and `peer`.

- **Materialized interfaces:** The `structureProducer` detects materialized interfaces and triggers `functionProducer` and `constructorProducer` for all methods/constructors via `trigger`.

- **Type resolution chain:** When any producer calls `expectType` on a type, the engine dispatches through `referenceProducer` → resolved declaration's producer (e.g., `structureProducer`, `enumProducer`), or directly to `primitiveProducer`, `containerProducer`, `unionProducer`, `optionalProducer` for non-reference types.

### Call graph visualization

The file `producers_call_graph.dot` in the workspace root contains a Graphviz DOT graph of all inter-producer calls. Render it with:

```bash
dot -Tsvg producers_call_graph.dot -o producers_call_graph.svg
```

## Imports Available from `@idlizer/libohos`

Re-exports everything from `@idlizer/ost`, plus its own utilities:
- `T, Ts, E, S, Hs` — type/expression/statement/hint factories
- `LWType, LWExpression, LWKind` — AST node types and kind enum
- `Builders` — builder namespace
- `ClassDeclaration, FunctionDeclaration` — declaration types
- `managedName, createProducer, expectExpr, expectType` — producer utilities
- `OhosSeed, OhosProducerContext` — producer context types

From `@idlizer/core`:
- `isDefined, isRoot, capitalize` — utility functions

From `@idlizer/core/idl`:
- `idl.*` — IDL node types and utilities
