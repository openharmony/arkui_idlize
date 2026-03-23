# Tests for CodeCheck Fixer

This directory contains tests and test fixtures for the `codecheck-fixer` project.

## Structure

### Unit Tests (Mocha + Harness)

- `line-length-formatter.test.ts` — Line length formatter tests
- `expression-normalizer-fixtures.test.ts` — Expression normalizer tests  
- `prettier-based.test.ts` — Prettier formatter tests
- `format-fixtures.test.ts` — End-to-end formatting tests with fixtures

### Test Fixtures Structure

The `fixtures/` directory contains test files organized by type:

```
fixtures/
├── input/          # Source files for formatting tests
│   ├── ts/         # TypeScript test files
│   ├── ets/        # ArkTS/ETS test files
│   └── cpp/        # C++ test files
├── expected/       # Expected formatted output (committed to git)
│   ├── ts/
│   ├── ets/
│   └── cpp/
└── output/         # Actual test output (generated, not committed)
    ├── ts/
    ├── ets/
    └── cpp/
```

**Workflow:**
1. Add new test files to `input/` subdirectories
2. Run tests: `npm test` — generates `output/` files
3. Review output files manually
4. If satisfied, update expected: `./tests/scripts/update-expected.sh`
5. Commit updated `expected/` files

### Other Test Files

- `test-long-lines.ts` — File with long lines for testing

### Configuration and Scripts

- `scripts/register.js` — ts-node registration for running TypeScript tests
- `scripts/update-expected.sh` — Copy output files to expected after review
- `tsconfig.json` — TypeScript configuration for tests
- Use root `../config.json` for CLI integration tests

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

For integration checks, use the `run.sh` script with repository and path arguments:

```bash
# Check line length formatting
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated --fix -c config.json

# CLI help
./run.sh --help
./run.sh line-length --help
./run.sh analyze --help
./run.sh format --help
./run.sh fix --help
./run.sh cpp-format --help
```

#### Examples

**Dry-run (no fixes) with report:**

```bash
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --dry-run -r out/line-length-report.md -v
```

**Fix long lines:**

```bash
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --fix -o out/fixed --verbose
```

**General analysis:**

```bash
./run.sh analyze --repo /abs/repo --ts src --ets arkui/generated --cpp native/src -c config.json -o out/analysis.txt -v
```

**Auto-fixes:**

```bash
./run.sh fix --repo /abs/repo --ts src --ets arkui/generated -c config.json -o out/fixed -v
```

**Format code files:**

```bash
./run.sh format --repo /abs/repo --ts src --ets arkui/generated --cpp native/src -c config.json -o out/formatted -v
```

**C/C++ formatting:**

```bash
./run.sh cpp-format -c config.json --output out/formatted --verbose
./run.sh cpp-format -c config.json -l 100 --verbose  # Custom line length
```

## C++ Testing

### Quick Test with Fixtures

Run C++ formatting test on fixture files:

```bash
./run_test_single_real_cpp.sh
```

This script:
1. Builds the project
2. Formats C++ files from `tests/fixtures/input/cpp/`
3. Saves results to `tests/fixtures/output/cpp/`
4. Analyzes long lines (>120 chars)
5. Compares with expected results (if available)

### Fix and Update Expected

To format fixtures and update expected results:

```bash
./run_fix_cpp.sh
```

This script:
1. Formats C++ fixtures
2. Shows differences with input files
3. Prompts to update `tests/fixtures/expected/cpp/`
4. Provides git commands for committing

### C++ Test Fixtures

Located in `tests/fixtures/input/cpp/`:
- `long_lines.cpp` — File with long lines requiring reformatting
- `bad_formatting.cpp` — File with poor spacing and indentation
- `complex_template.cpp` — Complex C++ templates and SFINAE
- `simple_header.h` — Header file with include guards
- `comments_doc.cpp` — Various comment styles and documentation

### Adding New C++ Fixtures

1. Create input file:
   ```bash
   # Add your test file
   cat > tests/fixtures/input/cpp/my_test.cpp << 'EOF'
   // Your C++ code here
   EOF
   ```

2. Run formatting:
   ```bash
   ./run_test_single_real_cpp.sh
   ```

3. Review output:
   ```bash
   cat tests/fixtures/output/cpp/my_test.cpp
   ```

4. Update expected:
   ```bash
   ./run_fix_cpp.sh
   # Answer 'y' to update expected files
   ```

5. Commit:
   ```bash
   git add tests/fixtures/input/cpp/my_test.cpp
   git add tests/fixtures/expected/cpp/my_test.cpp
   git commit -s -m "test: add C++ formatting fixture my_test"
   ```

### C++ Test Configurations

- `tests/test_single_real_cpp.json` — Configuration for fixture tests
- `tests/test_fix_cpp.json` — Configuration for fix workflow

Both configs point to `tests/fixtures/input/cpp/` directory.

**Important notes:**
- All commands now require `--repo` to specify the repository root
- File paths are passed via type-specific flags: `--ts`, `--ets`, `--cpp`, or generic `--paths`
- Multiple paths can be space-separated or comma-separated
- Use the root `config.json` for configuration (contains only analysis/formatting settings)

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

## Fixtures Details

### Integration Test Fixtures (this directory)

Located in `tests/fixtures/`:
- `input/` — Source files for end-to-end formatting tests
- `expected/` — Expected formatted results (version controlled)
- `output/` — Generated during test runs (gitignored)

To add new test cases:
1. Add file to appropriate `input/` subdirectory (ts/ets/cpp)
2. Run `npm test` to generate initial output
3. Review the output in `fixtures/output/`
4. Run `./tests/scripts/update-expected.sh` to copy to expected
5. Commit the new input and expected files

### Library-specific Fixtures

Other fixtures for unit tests:
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
