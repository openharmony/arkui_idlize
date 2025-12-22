# Tests for CodeCheck Fixer

This directory contains tests and test fixtures for the `codecheck-fixer` project.

## Structure

### Unit Tests (Mocha + Harness)

- `line-length-formatter.test.ts` — Line length formatter tests
- `expression-normalizer-fixtures.test.ts` — Expression normalizer tests  
- `prettier-based.test.ts` — Prettier formatter tests

### Integration Test Fixtures

- `fixtures/` — Test files for CLI integration testing
- `test-long-lines.ts` — File with long lines for testing
- `test_*.json` — Configuration files for various test scenarios

### Configuration

- `scripts/register.js` — ts-node registration for running TypeScript tests
- `tsconfig.json` — TypeScript configuration for tests

## Running Tests

### Unit Tests

```bash
npm test
```

Or directly with Mocha:

```bash
npx mocha
```

### Integration Tests via CLI

For integration checks, use the `run.sh` script with configuration files:

```bash
# Check line length formatting
./run.sh line-length --fix -c tests/test-config.json

# CLI help
./run.sh --help
./run.sh line-length --help
```

#### Examples

**Dry-run (no fixes) with report:**

```bash
./run.sh line-length -c tests/test-config.json --dry-run -r out/line-length-report.md -v
```

**Fix long lines:**

```bash
./run.sh line-length -c tests/test-config.json --fix -o out/fixed --verbose
```

**General analysis:**

```bash
./run.sh analyze -c tests/test-config.json -o out/analysis.txt -v
```

**Auto-fixes:**

```bash
./run.sh fix -c tests/test-config.json -o out/fixed -v
```

## Test System

The project uses:
- **Mocha** — test runner (compatible with the `core` module of idlize project)
- **@koalaui/harness** — test utilities library (`suite`, `test`, `assert`)
- **ts-node** — run TypeScript tests directly

### Test API

```typescript
import { assert, suite, test } from '@koalaui/harness';

suite('My Test Suite', () => {
  test('should do something', () => {
    assert.equal(1 + 1, 2);
  });
  
  test('async test', async () => {
    const result = await someAsyncFunction();
    assert(result);
  });
});
```

Main assertion methods:
- `assert(condition, message?)` — basic assertion
- `assert.equal(actual, expected)` — equality check
- `assert.notEqual(actual, expected)` — inequality check  
- `assert.throws(fn, error?)` — exception testing

## Fixtures

Fixtures for unit tests are located in:
- `../libs/arkts_formatter/tests/fixtures/fixtures/*.json` — JSON fixtures for formatter
- `../libs/arkts_formatter/tests/expression-normalizer/fixtures/pairs.json` — pairs for normalizer
- `../libs/prettier_formatter/tests/fixtures/**/*` — fixtures for Prettier

## Debug Tools

### Tokenizer Testing

```bash
npx ts-node tests/enhanced_ast/test-tokens.ts
```

### AST Visualization

```bash
# Enhanced AST viewer
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "export class Test {}"

# Standard AST viewer  
npx ts-node tools/ast_viewer/standard-ast-viewer.ts path/to/file.ts
```

Detailed documentation: [tools/ast_viewer/README.md](../tools/ast_viewer/README.md)
