# Test Fixtures for Code Formatting

This directory contains fixture files for testing various formatting scenarios. Each file focuses on a specific code construct or pattern.

## Fixture Files

### Basic Constructs
- **`function-call.ts`** - Function calls with multiple arguments, nested calls, method chaining
- **`object-literal.ts`** - Object literals, nested objects, methods, computed properties, spread
- **`array-literal.ts`** - Arrays, nested arrays, object arrays, spread operator
- **`assignment.ts`** - Variable assignments, destructuring, multiple declarations

### TypeScript-Specific
- **`union-type.ts`** - Union types, intersection types, generic unions
- **`type-assertion.ts`** - Type assertions (`as`, angle-bracket), `satisfies` operator
- **`import.ts`** - Import statements, named/default/type imports, re-exports
- **`class-declaration.ts`** - Class declarations, inheritance, generics, decorators

### Expressions
- **`logical-expression.ts`** - AND/OR/Nullish operators, ternary, complex conditions
- **`for-loop.ts`** - For/for-in/for-of loops, async iterations

### Critical Cases (ASI)
- **`return-statement.ts`** - Return statements (ASI-critical: no break after `return`)
- **`throw-statement.ts`** - Throw statements (ASI-critical: no break after `throw`)
- **`template-literal.ts`** - Template literals (MUST NOT format: breaks semantics)

### Documentation
- **`comment.ts`** - Single-line, block, JSDoc, multi-line comments

### UI Frameworks
- **`jsx-tsx.tsx`** - JSX/TSX elements, props, children, conditional rendering

## Fixture Structure

Each fixture file contains:
- `original` - Code that exceeds line length limit (needs formatting)
- `expected` - Properly formatted code that meets line length requirements

Multiple scenarios per construct:
- Simple cases
- Nested/complex cases
- Edge cases
- Critical cases (ASI, semantic changes)

## Usage

These fixtures can be used for:
1. **Unit testing** - Verify formatting strategies work correctly
2. **Regression testing** - Ensure fixes don't break existing functionality
3. **Documentation** - Examples of expected formatting behavior
4. **Validation** - Test that semantic equivalence is preserved

## Important Notes

### ASI (Automatic Semicolon Insertion) Cases

**NEVER break line immediately after:**
- `return` - `return\n{ }` becomes `return; { }` (returns `undefined`)
- `throw` - `throw\nError()` becomes `throw; Error()` (throws nothing, executes Error())

**Correct approach:** Break INSIDE the expression, not between keyword and expression.

### Template Literals

**NEVER format template literals:**
- Any whitespace inside `${}` becomes part of the string
- Line breaks change the runtime value
- Indentation is preserved in output

### Semantic Preservation

All formatting must preserve semantic equivalence:
- Whitespace normalization: newlines → empty string, spaces → single space (where needed)
- No changes to AST structure
- No changes to runtime behavior

## Testing Guidelines

When adding new fixtures:
1. Include clear comments explaining the scenario
2. Mark critical cases (ASI, templates) explicitly
3. Provide both simple and complex examples
4. Test edge cases and boundary conditions
5. Verify semantic equivalence after formatting

