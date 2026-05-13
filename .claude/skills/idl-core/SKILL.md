---
name: idl-core
description: Use when working with the idlize core module - parsing IDL files, understanding IDL AST nodes, generating code for multiple languages, or modifying LanguageWriters
---

# IDL Core Module

## Overview

The `core` module is an IDL (Interface Definition Language) compiler that parses `.idl` files and generates code for multiple target languages (TypeScript, ArkTS, C++, CangJie).

**Core principle:** IDL source → AST (Abstract Syntax Tree) → Language-specific code generation

## Key Directories

```
core/
├── reference/           # IDL specification docs
│   ├── IDL-spec.md     # Language syntax reference
│   └── namesResolving.md # Name resolution algorithm
├── src/
│   ├── idl/            # AST node types and utilities
│   ├── from-idl/       # Parser (IDL text → AST)
│   ├── LanguageWriters/ # Code generation base classes
│   ├── peer-generation/ # Peer library and type conversion
│   └── transformers/   # AST transformation utilities
```

## AST Node Types (idl/node.ts)

### Core Node Kinds (IDLKind enum)

| Kind | Description |
|------|-------------|
| `Interface` | Interface/class declaration |
| `Enum` | Enumeration type |
| `Typedef` | Type alias |
| `Callback` | Callback type declaration |
| `Method` | Method/function |
| `Property` | Interface property/attribute |
| `Parameter` | Function parameter |
| `Constructor` | Interface constructor |

### Type Nodes

| Kind | Description |
|------|-------------|
| `PrimitiveType` | void, boolean, i8-u64, f32-f64, String, buffer |
| `ContainerType` | sequence, record, Promise |
| `ReferenceType` | Named type reference |
| `UnionType` | Union of multiple types |
| `OptionalType` | Optional (nullable) type |

### Key Interfaces

```typescript
// File root
interface IDLFile {
    packageClause: string[]
    entries: IDLEntry[]
}

// Named declaration
interface IDLEntry extends IDLNode, IDLNamedNode {}

// Interface with members
interface IDLInterface extends IDLEntry {
    inheritance: IDLReferenceType[]
    constructors: IDLConstructor[]
    constants: IDLConstant[]
    properties: IDLProperty[]
    methods: IDLMethod[]
    callables: IDLCallable[]
}
```

## Supported Languages (Language.ts)

| Language | Extension | Notes |
|----------|-----------|-------|
| `Language.TS` | `.ts` | TypeScript |
| `Language.ARKTS` | `.ts` | ArkTS (HarmonyOS) |
| `Language.CPP` | `.cc` | C++ |
| `Language.CJ` | `.cj` | CangJie |

## Code Generation

### LanguageWriter Base Class

Abstract class in `LanguageWriters/LanguageWriter.ts` with key methods:

```typescript
abstract class LanguageWriter {
    // Core output
    writeClass(name, op, superClass?, interfaces?)
    writeInterface(name, op, superInterfaces?)
    writeEnum(name, members[], options)
    writeMethodDeclaration(name, signature, modifiers?)
    writeMethodImplementation(method, op)
    writeFieldDeclaration(name, type, modifiers, optional)

    // Expressions
    makeLambda(signature, body?)
    makeCast(value, node, options?)
    makeFunctionCall(name, params[])
    makeMethodCall(receiver, method, params[])
}
```

### Language-Specific Writers

Located in `LanguageWriters/writers/`:
- `TsLanguageWriter.ts` - TypeScript
- `ETSLanguageWriter.ts` - ArkTS
- `CppLanguageWriter.ts` - C++
- `CJLanguageWriter.ts` - CangJie

## Type Convertors

Convert IDL types to language-specific types via `ArgConvertors.ts`:

```typescript
// Common convertors
NumericConvertor    // Integer/float types
StringConvertor     // String type
BooleanConvertor    // Boolean type
ArrayConvertor      // sequence<T>
MapConvertor        // record<K, V>
OptionConvertor     // optional T
UnionConvertor      // (A or B or C)
EnumConvertor       // Enum types
InterfaceConvertor  // Interface types
```

## PeerLibrary

Main entry point in `peer-generation/PeerLibrary.ts`:

```typescript
class PeerLibrary {
    files: IDLFile[]
    language: Language

    // Type conversion
    mapType(type: IDLType): string
    typeConvertor(param, type, isOptional?): ArgConvertor

    // Reference resolution
    resolveTypeReference(type: IDLReferenceType): IDLEntry | undefined

    // Create writers
    createLanguageWriter(language?): LanguageWriter
    createTypeNameConvertor(language): IdlNameConvertor
}
```

## Parser Usage

Parse IDL files using `from-idl/parser.ts`:

```typescript
import { Parser } from "./from-idl/parser"

const parser = new Parser(idlContent, fileName)
const idlFile = parser.parseFile()
```

## Name Resolution

Algorithm in `resolveNamedNode.ts`:
1. Start from context namespace
2. Walk up parent chain looking for starting point
3. Match name segments down the subtree
4. Support imports and typedefs as projections

## Common Patterns

### Adding New Language Writer

1. Create `writers/XxxLanguageWriter.ts` extending `LanguageWriter`
2. Implement abstract methods
3. Add to `LanguageWriters/index.ts` factory
4. Add enum value to `Language.ts`

### Processing IDL Nodes

Use visitors from `idl/visitors.ts`:

```typescript
import * as idl from "./idl"

// Check node type
if (idl.isInterface(node)) { ... }
if (idl.isEnum(node)) { ... }
if (idl.isMethod(node)) { ... }

// Visit children
idl.forEachChild(node, child => { ... })
idl.visitChildren(node, visitor)
```

### Using Transformers

Transform AST with `transformers/IdlTransformer.ts`:

```typescript
class MyTransformer extends IdlTransformer {
    visit(node: IDLNode): IDLNode {
        // Transform node
        return this.visitEachChild(node)
    }
}
```

## Quick Reference

| Task | File/Module |
|------|-------------|
| Parse IDL | `from-idl/parser.ts` |
| AST types | `idl/node.ts` |
| Type guards | `idl/discriminators.ts` |
| Type builders | `idl/builders.ts` |
| Code generation | `LanguageWriters/LanguageWriter.ts` |
| Type conversion | `LanguageWriters/ArgConvertors.ts` |
| Name resolution | `resolveNamedNode.ts` |
| Library management | `peer-generation/PeerLibrary.ts` |
