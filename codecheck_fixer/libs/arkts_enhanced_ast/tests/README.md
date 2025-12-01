# Enhanced AST Module Tests

This folder contains tests and tools for the Enhanced AST module.

## Files

### `test-tokens.ts`
Debug tool for testing the tokenizer and Enhanced AST with syntax tokens (hybrid AST+CST architecture v0.6.0).

**Usage:**
```bash
# From project root
npx ts-node libs/arkts_enhanced_ast/tests/test-tokens.ts
```

**Features:**
- Creates Enhanced AST with syntax tokens
- Displays node statistics
- Shows token structure and semantic separators
- Useful for debugging the tokenizer

### `tools/ast_viewer/`
Tools for visualizing AST structures (see [`tools/ast_viewer/README.md`](../../tools/ast_viewer/README.md)).

**Available viewers:**
- **Standard AST Viewer** - TypeScript compiler AST visualization
- **Enhanced AST Viewer** - Enhanced AST with syntax tokens visualization

## Notes

### Source File Reconstruction

With the hybrid AST+CST architecture (v0.6.0+), source file reconstruction from Enhanced AST is trivial:
- Each node contains `syntaxTokens` array with exact text of all tokens
- Reconstruction = concatenation of `token.text` in order
- Validation lives alongside tokenizer-focused tests (`test-tokens.ts`) and integration scenarios inside `tests/unittests/line-length-formatter`
