# Enhanced AST Building Process for Formatting

## Overview

This document describes the Enhanced AST architecture - a hybrid structure that combines semantic information from TypeScript AST with syntax tokens (CST). This architecture is necessary for safe TypeScript/JavaScript code formatting.

> Update (November 2025): token-level breakability flags are removed.  
> Formatters now rely on lazy semantic separator descriptors  
> (`libs/arkts_enhanced_ast/syntactic-separators.ts`, `getSemanticSeparators()`).

## The Formatting Task: Semantics + Syntax

### Two Aspects of Formatting

Code formatting requires simultaneous understanding of two levels:

```
┌───────────────────────────────────────────────────────────────────┐
│                   FORMATTING = AST + CST                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  AST (SEMANTICS) - "WHAT and WHERE"                               │
│  ├─ Understanding code MEANING                                    │
│  ├─ Block structure (class, method, parameters)                  │
│  ├─ Hierarchy and nesting                                         │
│  ├─ Semantic relationships                                        │
│  └─ DECISION: which blocks to split into separate lines          │
│                                                                    │
│  CST (SYNTAX) - "HOW to split"                                    │
│  ├─ Precise positions of all tokens                               │
│  ├─ Keywords, brackets, operators                                 │
│  ├─ Safe line breaking rules                                      │
│  ├─ ASI problem protection                                        │
│  └─ EXECUTION: how exactly to insert line breaks                  │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

**Separation of concerns:**
1. **AST** - understands code meaning in blocks and decides which blocks to split across lines
2. **CST** - provides the splitting itself, offering syntactic information
3. **Formatter** - combines AST and CST for safe formatting

## Conceptual Foundations: AST vs CST vs Tokens

Before diving into the details of Enhanced AST construction, it's important to understand the fundamental principles of how TypeScript AST works.

### Three Levels of Code Representation

#### 1. Lexical Level (Tokens/Lexemes)

This is a sequence of individual tokens - the minimal units of the language:

```typescript
export | class | MyClass | { | private | field | : | string | ; | }
  ↑       ↑        ↑       ↑     ↑        ↑      ↑     ↑      ↑   ↑
token1  token2  token3  token4 token5  token6  token7 token8...
```

Each token is an indivisible unit: keyword, identifier, operator, bracket.

#### 2. Concrete Syntax Tree (CST)

A tree where **each token** is represented as a node:

```
ClassDeclarationSyntax
├── ExportKeyword "export"
├── WhitespaceTrivia " "
├── ClassKeyword "class"          ← separate node!
├── WhitespaceTrivia " "
├── Identifier "MyClass"
├── WhitespaceTrivia " "
├── OpenBrace "{"
├── PropertyDeclaration
│   ├── PrivateKeyword "private"
│   └── ...
└── CloseBrace "}"
```

**Advantage**: Complete source code representation, easy to reconstruct text.
**Disadvantage**: Redundancy, large tree size, difficult to analyze semantics.

#### 3. Abstract Syntax Tree (AST)

A tree containing only **semantically significant** nodes:

```
ClassDeclaration
├── modifiers: [ExportKeyword]
├── name: Identifier "MyClass"
└── members: [PropertyDeclaration]
    ├── modifiers: [PrivateKeyword]
    ├── name: Identifier "field"
    └── type: StringKeyword
```

**Advantage**: Compactness, semantic clarity, convenient analysis.
**Disadvantage**: Loss of formatting information (spaces, comments).

### What did TypeScript Choose?

**TypeScript uses AST**, where syntactic markers (`class`, `interface`, `{`, `}`) **are not separate nodes**.

### Why is `class` Not a Node in TypeScript AST?

The `class` keyword is a **syntactic marker** that tells the parser "a class declaration is starting now". But in AST it's not needed because:

1. **Node type is already known**: `node.kind === ts.SyntaxKind.ClassDeclaration`
2. **Keyword is redundant**: we already know it's a class from the node type
3. **AST describes structure, not text**: AST is a semantic tree of the program

#### Analogy with XML/DOM

In XML:
```xml
<person name="John">...</person>
```

In DOM tree:
- `<` and `>` are **not nodes**, they are XML syntax
- `person` is the **element name** (node property)
- `name="John"` is an **attribute** (node property)

Similarly in TypeScript:
```typescript
export class MyClass { }
```

In AST:
- `class` is **not a node**, it's a syntactic marker (like `<` in XML)
- `ClassDeclaration` is the **node type** (like `Element` in DOM)
- `MyClass` is the **class name** (node's `name` property)

### What is Trivia in TypeScript?

**Trivia** - "insignificant" elements between AST nodes:
- Spaces and tabs
- Line breaks
- Comments
- **Syntactic markers** (keywords `class`, `interface`, brackets `{`, `}`)

TypeScript preserves trivia in the source file but doesn't include it in the AST structure. Methods for accessing trivia:

```typescript
node.getFullStart()  // start with leading trivia
node.getStart()      // start without trivia
node.getEnd()        // end of node
```

### Example: Where Elements are Located in AST?

Source code:
```typescript
"export class MyClass { field: string; }"
 0         1         2         3         4
 0123456789012345678901234567890123456789012...
```

Positions in TypeScript AST:

| Element | Positions | Type in AST | Role |
|---------|----------|-------------|------|
| `export` | 0-6 | `ExportKeyword` | Node (modifier) |
| ` ` | 6-7 | trivia | Space (not a node) |
| `class` | 7-12 | trivia | **Syntactic marker (not a node!)** |
| ` ` | 12-13 | trivia | Space (not a node) |
| `MyClass` | 13-20 | `Identifier` | Node (class name) |
| ` ` | 20-21 | trivia | Space (not a node) |
| `{` | 21-22 | trivia | **Syntactic marker (not a node!)** |

**Key takeaway**: The `class` keyword is between positions 7-12, but **is not an AST node**. It's part of trivia between the `ExportKeyword` (0-6) and `Identifier` (13-20) nodes.

### TypeScript AST Philosophy: Minimalism

TypeScript builds a **minimal** AST containing only semantically significant information:

| Code Element | Semantic Significance | Representation in AST |
|--------------|----------------------|----------------------|
| `export` | Yes - affects visibility | `ExportKeyword` node |
| `class` | No - type known from node | Part of trivia |
| `MyClass` | Yes - unique name | `Identifier` node |
| `{` | No - body start is obvious | Part of trivia |
| `private` | Yes - affects access | `PrivateKeyword` node |
| `field` | Yes - property name | `Identifier` node |
| `:` | No - type relation is obvious | Part of trivia |
| `string` | Yes - data type | `StringKeyword` node |
| `;` | No - end is obvious | Part of trivia |
| `}` | No - body end is obvious | Part of trivia |

### TypeScript AST Problem: Loss of Formatting

When traversing AST with standard methods (`ts.forEachChild`), we get only nodes, **losing all trivia**:

```typescript
ts.forEachChild(classDecl, (child) => {
  // We get: ExportKeyword, Identifier, PropertyDeclaration
  // We lose: " class ", " { ", " } "
});
```

**Result**: Cannot accurately reconstruct original text, spaces, comments, formatting are lost.

### Solution: Enhanced AST

Enhanced AST **preserves trivia** through a `syntaxTokens` array attached to every node. Tokens carry both lexical text and surrounding whitespace/comments, so the tree can reconstruct the original source without any auxiliary structures.

```typescript
ExportKeyword {
  text: "export",
  syntaxTokens: [
    { text: "export", tsKind: ts.SyntaxKind.ExportKeyword,
    { text: " ", tsKind: ts.SyntaxKind.WhitespaceTrivia }
  ]
}

Identifier {
  text: "MyClass",
  syntaxTokens: [
    { text: " ", tsKind: ts.SyntaxKind.WhitespaceTrivia },
    { text: "MyClass", tsKind: ts.SyntaxKind.Identifier,
    { text: " ", tsKind: ts.SyntaxKind.WhitespaceTrivia },
    { text: "{", tsKind: ts.SyntaxKind.OpenBraceToken }
  ]
}

PropertyDeclaration {
  text: "private field: string;",
  syntaxTokens: [
    { text: "private", tsKind: ts.SyntaxKind.PrivateKeyword },
    { text: " ", tsKind: ts.SyntaxKind.WhitespaceTrivia },
    { text: "field", tsKind: ts.SyntaxKind.Identifier },
    { text: ":", tsKind: ts.SyntaxKind.ColonToken },
    { text: " string", tsKind: ts.SyntaxKind.Identifier },
    { text: ";\n", tsKind: ts.SyntaxKind.SemicolonToken }
  ]
}
```

**Benefit:** restoring the original source boils down to concatenating `token.text` in order.

### Reconstructing Source Text

```typescript
function reconstructText(node: EnhancedASTNode): string {
  let result = '';

  // Tokens already include both the node body and its leading/trailing trivia
  for (const token of node.syntaxTokens) {
    result += token.text;
  }

  for (const child of node.children) {
    result += reconstructText(child);
  }

  return result;
}
```

For `export class MyClass { ... }` the tokens preserve the exact sequence: `"export"`, a space, the `class` keyword, the class name, braces, and so on — identical to the original source.

### Conclusions

1. **AST ≠ CST:** TypeScript uses an abstract syntax tree without explicit punctuation nodes.
2. **Trivia lives in tokens:** spaces, comments, and keywords become first-class tokens.
3. **Enhanced AST = AST + Tokens:** we keep the TypeScript AST structure and augment it with tokens for 100% reconstruction.

## Token Preservation: Formatting as a Syntactic Task

### Critical Nature of Correct Formatting

> **KEY FACT:** Systematic testing of all possible line breaks showed that **TypeScript is extremely tolerant** of formatting. Out of dozens of tested cases, syntax errors occur **only in 4 specific situations**. Most line breaks between keywords, modifiers, operators compile without problems.

Incorrect TypeScript/JavaScript code formatting can lead to **three categories of problems**:
1. **Syntax errors** - code doesn't compile (**very rare: 4 cases out of 30+ tested**)
2. **Semantic changes** - code compiles but works incorrectly (**main threat: ASI**)
3. **Structure understanding issues** - hierarchy needed for correct formatting (**always relevant**)

#### Category 1: Syntax Errors (RARE: 4 out of 30+ tested cases)

##### 1.1. Split: `interface` + line break + name

```typescript
// ✅ CORRECT
interface MyInterface {}

// ❌ SYNTAX ERROR
interface
MyInterface {}
// Error: Unknown keyword or identifier. Did you mean 'interface'?
```

**Verified:** TypeScript compiler produces an error.

##### 1.2. Split: `namespace` + line break + name

```typescript
// ✅ CORRECT
namespace MyNamespace {}

// ❌ SYNTAX ERROR
namespace
MyNamespace {}
// Error: Unknown keyword or identifier. Did you mean 'namespace'?
```

**Verified:** TypeScript compiler produces an error.

##### 1.3. Split: `type` + line break + name

```typescript
// ✅ CORRECT
type MyType = string;

// ❌ SYNTAX ERROR
type
MyType = string;
// Error: Cannot find name 'type'
```

**Verified:** TypeScript compiler produces an error.

##### 1.4. Split: `async` + line break + `function`

```typescript
// ✅ CORRECT
async function myFunc() {}

// ❌ SYNTAX ERROR
async
function myFunc() {}
// Error: Cannot find name 'async'
```

**Verified:** TypeScript compiler produces an error.

**Important:** These are **all** the syntax errors found during systematic line break testing. The other dozens of tested cases (export/class, class/Name, extends, generics, operators, etc.) compile without errors.

#### Category 2: Semantic Changes (MAIN THREAT: ASI)

**This is the main problem!** Code compiles but doesn't work as expected.

> **Automatic Semicolon Insertion (ASI)** - a JavaScript/TypeScript mechanism that automatically inserts semicolons in certain places. This can **drastically change** program logic without any compiler warnings.

##### 2.1. Return statement + new line → return undefined

**The most common and dangerous error!**

```javascript
// ✅ CORRECT - returns object
function getConfig() {
  return {
    host: "localhost",
    port: 3000
  };
}

// ❌ DISASTER - returns undefined!
function getConfig() {
  return
  {
    host: "localhost",
    port: 3000
  };
}
// ASI inserts semicolon: return; {...}

console.log(getConfig()); // undefined ❌
// Program doesn't crash, but configuration is not applied!
```

**Verified:**
```javascript
function test1() { return { value: 1 }; }
function test2() { return\n{ value: 1 }; }

console.log(test1()); // { value: 1 }
console.log(test2()); // undefined
```

**Real scenario:** Function returns settings, but due to line break returns `undefined`. Application uses `undefined` as configuration → crashes with unclear error.

##### 2.2. Variable + new line + `[` → indexing

```javascript
// ✅ CORRECT
const matrix = [[1, 2], [3, 4]];
const firstRow = matrix[0];
console.log(firstRow); // [1, 2]

// ❌ DISASTER - attempt to index a number!
const sum = 10 + 20
[1, 2].forEach(x => console.log(x));
// Interpreted as: sum = (10 + 20)[1, 2]
// Error: Cannot read property 'forEach' of undefined
```

**Verified:**
```javascript
const x = 42
[1, 2, 3].forEach(n => console.log(n));
// Error: Cannot read properties of undefined (reading 'forEach')
```

**Real scenario:** Calculation on one line, array on the next. JavaScript tries to access `42[1,2,3]`, which gives `undefined`, then `.forEach()` on `undefined` → Runtime Error.

##### 2.3. String + new line + `` ` `` → tagged template

```javascript
// ✅ CORRECT
const userName = "Alice";
const greeting = `Hello, ${userName}!`;
console.log(greeting); // "Hello, Alice!"

// ❌ DISASTER - attempt to call string as function!
const message = "Processing"
`${userName}`;
// Interpreted as: message`${userName}` (tagged template literal)
// Error: "Processing" is not a function
```

**Verified:**
```javascript
const str = "Hello"
`World`;
// Error: "Hello" is not a function
```

**Real scenario:** Multi-line code with template strings. JavaScript interprets as tagged template literal → calling string as function → Runtime Error.

##### 2.4. Number + new line + unary operator → binary operation

```javascript
// ✅ CORRECT - unary minus
const temperature = 25;
const negative = -temperature;
console.log(negative); // -25

// ❌ ERROR - becomes subtraction!
const baseValue = 100
-temperature;
// Interpreted as: baseValue = 100 - temperature = 75
console.log(baseValue); // 75 (expected 100!)
```

**Verified:**
```javascript
const x = 5;
const z = 10
-x;
console.log(z); // 5, not 10!
```

**Real scenario:** Variable initialized with value, negative number on next line. JavaScript combines into one expression → wrong value → logical error in calculations.

##### 2.5. Arrow function + new line + `{` → code block instead of object

```typescript
// ✅ CORRECT - returns object
const createUser = (name: string) => ({ name, role: "user" });
console.log(createUser("Bob")); // { name: "Bob", role: "user" }

// ❌ ERROR - code block with label!
const createUser = (name: string) => {
  name: "user"  // This is label name:, NOT object property!
};
console.log(createUser("Bob")); // undefined
```

**Verified:**
```javascript
const fn1 = () => ({ value: 42 });
const fn2 = () => { value: 42 };

console.log(fn1()); // { value: 42 }
console.log(fn2()); // undefined
```

**Real scenario:** Function should return object, but curly braces are interpreted as code block. `name: "user"` becomes a label. Function returns `undefined` → errors when accessing properties.

##### 2.6. Postfix increment + new line + expression

```javascript
// ✅ CORRECT
let counter = 5;
counter++;
const result = counter; // 6

// ⚠️ UNEXPECTED BEHAVIOR
let counter = 5
++counter  // This is prefix increment of next line!
console.log(counter); // 6, but may not be what was expected
```

**Verified:**
```javascript
let a = 5
++a; // Works, but new statement
console.log(a); // 6
```

**Real scenario:** Less dangerous, but can be confusing. Postfix operator applies to previous line, prefix - to current.

##### 2.7. Expression + new line + `(` → function call

```javascript
// ✅ CORRECT
const result = getValue();
(someArray).forEach(x => console.log(x));

// ❌ ERROR - attempt to call number as function!
const result = getValue()
(someArray).forEach(x => console.log(x));
// Interpreted as: result = getValue()(someArray)
// Error: getValue() is not a function (if getValue doesn't return function)
```

**Real scenario:** After function call, expression in parentheses on next line. JavaScript interprets as curried function call → Runtime Error.

##### 2.8. ⚠️ CRITICAL: Line Breaks Inside Template Literals (runtime value change)

**Discovery Date:** 2025-10-29

**Problem:** Inserting line breaks inside `${}` expressions in template literals **changes code semantics** - the newline and indentation become part of the resulting string at runtime.

```typescript
// ✅ CORRECT (original)
throw new Error(`The type mismatches when use the key '${key}' in storage, '${transferTypeName(ttype.getName())}' vs. '${typeName}'`);

// ❌ CRITICAL ERROR (after incorrect formatting):
throw new Error(`The type mismatches when use the key '${key}' in storage, '${transferTypeName(
    ttype.getName())}' vs. '${typeName}'`);

// Result at runtime (with newline and indentation inside the string):
// "The type mismatches when use the key '...' in storage, '...
//     ...' vs. '...'"
//                      ^^^^ newline + indentation became part of the string!
```

**Verified:** Real case from `src/stateManagement/storage/persistenceV2.ts` (line 234).

**Why this happens:**
- Template literals preserve **all** characters, including newlines and spaces
- Expression inside `${}` can contain function calls with parameters
- Formatter sees long line and tries to break it to comply with `maxLineLength`
- Inserting break inside `${}` **changes string value** at runtime

**Solution in code:**

In `EnhancedASTFormattingStrategy.findBreakableTokens()` added check:

```typescript
// CRITICAL: DON'T break inside template literals - it changes semantics!
if (node.kind === ts.SyntaxKind.TemplateSpan ||
    node.kind === ts.SyntaxKind.TemplateExpression ||
    node.kind === ts.SyntaxKind.TemplateMiddle ||
    node.kind === ts.SyntaxKind.TemplateTail) {
  return []; // Empty array - NO break points
}
```

**Fixed in:** v0.6.3

**Affected AST nodes:**
- `TemplateSpan` - expression inside `${...}`
- `TemplateExpression` - full template literal with substitutions
- `TemplateMiddle` - middle part of template with multiple `${}`
- `TemplateTail` - final part of template

**Files with this issue:**
- `src/stateManagement/storage/persistenceV2.ts` (line 234)
- `generated/framework/peers/CallbackDeserializeCall.ets` (multiple cases)

**Real scenario:** Code generator creates long error messages with interpolation. After formatting, error message contains unexpected newlines and indentation, which complicates log parsing and debugging.

##### ASI Problems Summary

| Pattern | Expectation | Reality (ASI) | Consequence |
|---------|------------|---------------|-------------|
| `return\n{` | Return object | `return;` + block | Returns `undefined` |
| `42\n[array]` | Two statements | `42[array]` | `undefined.forEach()` → Error |
| `"str"\n\`template\`` | Two statements | Tagged template | String is not a function → Error |
| `10\n-x` | 10 and -x separately | `10 - x` | Wrong value |
| `() => {\n name: X }` | Return object | Block with label | Returns `undefined` |
| `getValue()\n(array)` | Two statements | `getValue()(array)` | Not a function → Error |
| `\`...\${fn(\n arg)}\`` | Template literal | String with `\n` and spaces | String value changed at runtime |

**Conclusion:** ASI problems are **much more dangerous** than syntax errors because:
1. ✅ Code compiles without warnings
2. ❌ Program works incorrectly
3. ❌ Errors appear only at runtime
4. ❌ Cause is hard to find (code looks correct)

**Verified:** All examples executed in Node.js, results confirmed.

#### Category 3: Problems with Priorities and Nesting

These cases **compile and work**, but require understanding hierarchy for correct formatting.

##### 3.1. Arithmetic operator priorities

```typescript
const result = a + b * c;
```

Flat tokens:
```
Identifier "a"
PlusToken "+"
Identifier "b"
AsteriskToken "*"
Identifier "c"
```

**Problem:** Can't see that `*` has **higher priority**! Expression executes as `a + (b * c)`, not `(a + b) * c`.

When formatting need to know:
- Can break after `+` (low priority)
- Can't break inside `b * c` (would break priority expression)

**Solution:** Need AST hierarchy:
```
BinaryExpression (+)
├── Identifier "a"
└── BinaryExpression (*)    ← nested expression!
    ├── Identifier "b"
    └── Identifier "c"
```

##### 3.2. Ternary operator (pairing of `?` and `:`)

```typescript
const result = condition ? trueValue : falseValue;
```

Flat tokens:
```
Identifier "condition"
QuestionToken "?"
Identifier "trueValue"
ColonToken ":"
Identifier "falseValue"
```

**Problem:** Can't see that `?` and `:` are **paired**! Can't break line only after `?` without breaking after `:`.

**Solution:** Need structure:
```
ConditionalExpression
├── condition: condition
├── whenTrue: trueValue
└── whenFalse: falseValue
```

##### 3.3. Nested function calls

```typescript
func1(arg1, func2(arg2, func3(arg3)), arg4);
```

Flat tokens - can't see **nesting levels**!

```
Identifier "func1"
OpenParen "("
Identifier "arg1"
Comma ","
Identifier "func2"
OpenParen "("
Identifier "arg2"
Comma ","
Identifier "func3"
OpenParen "("
...
```

**Problem:**
- Which brackets are paired?
- Which commas at which level?
- Where can we break lines?

**Solution:** Need hierarchy:
```
CallExpression func1
├── arg1
├── CallExpression func2      ← nested level!
│   ├── arg2
│   └── CallExpression func3  ← even deeper!
│       └── arg3
└── arg4
```

##### 3.4. Method chains

```typescript
obj.method1().method2().method3().method4();
```

All dots are the same in tokens, but it's a **chain**!

**Problem:** Need to format all chain links uniformly:

```typescript
obj
  .method1()
  .method2()
  .method3()
  .method4();
```

Without understanding it's a chain, impossible to format correctly.

##### 3.5. Nested generics

```typescript
Map<string, Array<Promise<Result<T>>>>
```

Flat tokens:
```
Identifier "Map"
LessThanToken "<"
Identifier "string"
Comma ","
Identifier "Array"
LessThanToken "<"
Identifier "Promise"
LessThanToken "<"
Identifier "Result"
LessThanToken "<"
Identifier "T"
GreaterThanToken ">"
GreaterThanToken ">"
GreaterThanToken ">"
GreaterThanToken ">"
```

**Problem:** Can't see:
- Which `<` and `>` are paired
- At what nesting level each parameter is
- Where we can break lines

**Solution:** Need hierarchy:
```
TypeReference Map
├── TypeParameter: string
└── TypeParameter: Array
    └── TypeParameter: Promise
        └── TypeParameter: Result
            └── TypeParameter: T
```

#### Summary Table of Critical Formatting Cases

> **Key fact:** TypeScript is extremely tolerant to line breaks. Systematic testing showed that problems occur only in **10 specific cases**. These cases need to be known and avoided.

| Category | Specific Case | Syntax Error? | Semantic Change (ASI)? | Criticality |
|-----------|---------------|---------------|----------------------|-------------|
| **Syntax Errors** | `interface\nName` | ❌ YES | - | 🔴 Critical |
| | `namespace\nName` | ❌ YES | - | 🔴 Critical |
| | `type\nName` | ❌ YES | - | 🔴 Critical |
| | `async\nfunction` | ❌ YES | - | 🔴 Critical |
| **ASI: Semantic Changes** | `return\n{` | ✅ Compiles | ❌ return undefined | 🔴🔴🔴 MAXIMUM |
| | `value\n[array]` | ✅ Compiles | ❌ indexing → Error | 🔴🔴 High |
| | `string\n\`template\`` | ✅ Compiles | ❌ tagged template → Error | 🔴🔴 High |
| | `number\n-x` | ✅ Compiles | ❌ subtraction instead of unary | 🔴 Critical |
| | `() => {\nname: X}` | ✅ Compiles | ❌ label instead of object | 🔴 Critical |
| | `getValue()\n(array)` | ✅ Compiles | ❌ curried call → Error | 🟡 Medium |

**All other tested cases** (30+) compile correctly and don't change semantics: `export\nclass`, `class\nName`, `extends\nBase`, `static\nmethod`, breaks in generics, types, parameters, operators, etc.

#### Conclusions on Formatting Criticality

**1. 🔴 Syntax Errors (4 cases) - rare but critical:**
- `interface\nName`, `namespace\nName`, `type\nName`, `async\nfunction`
- Code **doesn't compile**
- Easily detected at compilation stage
- Rarely encountered in practice

**2. 🔴🔴🔴 ASI problems (6 cases) - MAIN THREAT:**
- **Especially dangerous:** `return\n{` → returns `undefined` instead of object
- Code **compiles without warnings**
- Program **works incorrectly**
- Errors appear only at **runtime**
- **Very difficult** to catch and debug

**3. ⚠️ Hierarchy always necessary:**
- Even for cases without errors, need AST hierarchy
- Operator priorities: `a + b * c`
- Pairing of constructs: `<...>`, `{...}`, `(...)`
- Nesting levels: calls, generics, method chains
- Without hierarchy impossible to format **readably and correctly**

**4. 🎯 Main conclusion:**

```
┌────────────────────────────────────────────────────────────────┐
│  10 CRITICAL CASES out of 40+ tested                           │
│  ✅ TypeScript tolerant to most line breaks                    │
├────────────────────────────────────────────────────────────────┤
│  ASI - MAIN THREAT (6 cases)                                   │
│  ❌ Code compiles but works incorrectly                        │
│  ❌ return\n{ - most dangerous (returns undefined)            │
│  ❌ value\n[, string\n`, number\n- - runtime errors           │
├────────────────────────────────────────────────────────────────┤
│  AST HIERARCHY - ALWAYS NECESSARY                              │
│  ⚠️  Even for "safe" line breaks                               │
│  ⚠️  Priorities, nesting, pairing, readability                 │
└────────────────────────────────────────────────────────────────┘
```

**For safe formatting need:**
1. **Tokens** - for syntactic markers and determining safe break points
2. **AST hierarchy** - for nesting, priorities, pairing of constructs
3. **ASI rules** - special handling of 6 critical patterns: `return\n{`, `\n[`, `\n\``, `\n-`, `\n(`, `=> {\n`
4. **Context rules** - for readability: method chains, conditional expressions, nested structures

## Enhanced AST Architecture: Hybrid AST + CST Structure

### Concept

Enhanced AST combines semantic hierarchy of TypeScript AST with flat list of syntax tokens for each node.

**Enhanced AST Node (semantics)** contains **Syntax Tokens (CST parts)**:

```
┌─────────────────────────────────────┐
│   Enhanced AST Node (semantics)     │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  Syntax Tokens (syntax)        │ │
│  │                                │ │
│  │  [token1, token2, ..., tokenN] │ │
│  │     ↓       ↓            ↓     │ │
│  │  keyword  space       brace    │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Using TypeScript Built-in Scanner

TypeScript Compiler API provides `ts.createScanner()` - ready-made tokenizer:

```typescript
const scanner = ts.createScanner(
  ts.ScriptTarget.Latest,
  false,  // skipTrivia = false (include spaces/comments)
  ts.LanguageVariant.Standard,
  sourceCode
);

let token: ts.SyntaxKind;
while ((token = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
  const start = scanner.getTokenPos();    // token start
  const end = scanner.getTextPos();       // token end
  const text = scanner.getTokenText();    // token text
  const kind = ts.SyntaxKind[token];      // token type
}
```

#### Tokenization Example

```typescript
"export class MyClass { private field: string; }"
```

Scanner produces:

```
ExportKeyword    [0-6]   "export"
WhitespaceTrivia [6-7]   " "
ClassKeyword     [7-12]  "class"          ← separate token!
WhitespaceTrivia [12-13] " "
Identifier       [13-20] "MyClass"
WhitespaceTrivia [20-21] " "
OpenBraceToken   [21-22] "{"              ← opening brace!
WhitespaceTrivia [22-23] " "
PrivateKeyword   [23-30] "private"
WhitespaceTrivia [30-31] " "
Identifier       [31-36] "field"
ColonToken       [36-37] ":"
WhitespaceTrivia [37-38] " "
StringKeyword    [38-44] "string"
SemicolonToken   [44-45] ";"
WhitespaceTrivia [45-46] " "
CloseBraceToken  [46-47] "}"              ← closing brace!
```

**Built-in scanner advantages:**
- ✅ Full TypeScript syntax compliance
- ✅ Supports all constructs (JSX, decorators, etc.)
- ✅ Comment handling
- ✅ Optimized performance
- ✅ No need to write own parser

### New Data Structure

#### Syntax Token

```typescript
interface SyntaxToken {
  /** Token type */
  type: SyntaxTokenType;

  /** Token text */
  text: string;

  /** Position in source file */
  position: SourcePosition;

  /** Can line break BEFORE this token */

  /** Can line break AFTER this token */

  /** Link to semantic node (if any) */
  semanticNode?: EnhancedASTNode;

  /** Original SyntaxKind from TypeScript */
  tsKind: ts.SyntaxKind;
}

enum SyntaxTokenType {
  // Keywords
  KEYWORD,              // class, interface, extends, implements, etc.

  // Identifiers and literals
  IDENTIFIER,           // variable, class, function names
  STRING_LITERAL,       // "text", 'text'
  NUMBER_LITERAL,       // 42, 3.14

  // Braces
  OPEN_BRACE,           // {
  CLOSE_BRACE,          // }
  OPEN_PAREN,           // (
  CLOSE_PAREN,          // )
  OPEN_BRACKET,         // [
  CLOSE_BRACKET,        // ]

  // Punctuation
  COMMA,                // ,
  SEMICOLON,            // ;
  COLON,                // :
  DOT,                  // .

  // Operators
  ARROW,                // =>
  EQUALS,               // =
  PLUS,                 // +
  MINUS,                // -
  ASTERISK,             // *
  SLASH,                // /
  SPREAD,               // ...
  QUESTION,             // ?
  EXCLAMATION,          // !

  // Whitespace and formatting
  WHITESPACE,           // spaces, tabs
  NEWLINE,              // \n, \r\n

  // Comments
  LINE_COMMENT,         // //
  BLOCK_COMMENT,        // /* */

  // Semantic node (reference to E-AST node)
  SEMANTIC_NODE         // Identifier, PropertyDeclaration, etc.
}
```

#### Updated EnhancedASTNode

```typescript
interface EnhancedASTNode {
  // ===== Existing fields =====

  /** Original TypeScript node */
  originalNode: ts.Node;

  /** Node type (from TypeScript SyntaxKind) */
  kind: ts.SyntaxKind;

  /** Full node range in source file */
  fullRange: SourceRange;

  /** Range of node content only (without leading/trailing trivia) */
  contentRange: SourceRange;

  /** Source text of node */
  text: string;

  /** Child nodes */
  children: EnhancedASTNode[];

  /** Node modifiers (export, async, static, etc.) */
  modifiers?: EnhancedASTNode[];

  /** TypeScript node flags */
  nodeFlags?: ts.NodeFlags;

  /** Parent node */
  parent?: EnhancedASTNode;

  /** Additional metadata for formatting */
  metadata: NodeMetadata;

  /**
   * Ordered array of syntax tokens
   * belonging to this node (including leading/trailing trivia)
   */
  syntaxTokens: SyntaxToken[];
}
```

### Semantic Separators

Until November 2025 line breaking relied on heuristic flags (`breakableBefore/After`) attached to every token. The rule tables quickly became unmanageable, so the flags were removed in favour of semantic separator descriptors.

#### Categories

- **Sequence** — commas and semicolons separating items.
- **Structural** — brackets and braces that define scopes.
- **Type** — union/intersection operators (`|`, `&`) and type annotations (`:`).
- **Logical** — `&&`, `||`, `??`.
- **Operational** — arithmetic, comparison and assignment operators, arrow functions (`=>`).

Each descriptor carries the token reference, category, role, preferred break side (`before`, `after`, `both`) and priority. Helpers live in `libs/arkts_enhanced_ast/syntactic-separators.ts`.

#### Lazy cache

- `getSemanticSeparators(node)` calculates separators once and stores them inside `EnhancedASTNode.semanticSeparators`.
- `resetSemanticSeparators(node)` clears the cache if the node is rebuilt.
- `collectSyntacticSeparators(tokens)` classifies arbitrary token arrays.

### Example: line analysis with separators

For `const result = buildQuery(user, filters && extra, options);` the formatter does the following:

1. Enhanced AST produces `syntaxTokens` with trivia.
2. `getSemanticSeparators(callExpression)` yields: a comma (Sequence), logical `&&` (Logical) and the opening parenthesis (Structural).
3. Separators are sorted by `priority`: the comma is considered first, then the logical operator, the parenthesis acts as a fallback.
4. Breaks are inserted after the comma; if the line is still long a secondary break appears before `&&`.

### Benefits of the new model

- **Predictable rules.** Explicit categories replace dozens of ad-hoc exceptions.
- **Extensibility.** Supporting new operators means extending the classifier, not touching formatter heuristics.
- **Performance.** Separators are cached per node and reused by iterative formatting passes.
- **Unified pipeline.** TypeScript, ETS and ArkTS share the same API.

### Updated Enhanced AST pipeline

1. Build the regular TypeScript AST (`ts.createSourceFile`).
2. Tokenise with the scanner, keeping trivia but no breakability flags.
3. Store tokens on each node and expose lazy semantic separators.
4. Return `EnhancedASTWithQuery` with `getSemanticSeparators()` and navigation helpers.
5. Formatter strategies consume separators to choose the safest breakpoints.

