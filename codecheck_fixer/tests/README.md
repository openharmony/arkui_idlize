# Tests for CodeCheck Fixer

This directory contains all the tests for the `codecheck-fixer` project.

## Structure

-   `long-lines-test.ts`: A file specifically designed to test the line length formatter. It includes various long lines of code, comments, and complex function signatures.
-   `test-config.json`: A dedicated configuration file used for running tests in isolation, pointing only to the test files.
-   `enhanced_ast/`: Tools for working with Enhanced AST (see [enhanced_ast/README.md](enhanced_ast/README.md))
    -   `test-tokens.ts` - tokenizer debugging (hybrid AST+CST v0.6.0)
    -   `ast_viewer/` - AST structure visualization

## Running Tests

For integration-like checks you can use the main `run.sh` script with a custom test configuration:

```bash
./run.sh line-length --fix -c tests/test-config.json
```

This command will execute the line length fixer on the test files and place the output in the `out/` directory.

### Integration runs via run.sh (CLI)

Note: `run.sh` is a thin wrapper around the CLI (`dist/src/cli/index.js`). It does not run Jest unit tests. Use it for integration/regression runs of the analyzer/formatter.

- **CLI help and command help**

```bash
./run.sh --help
./run.sh line-length --help
```

- **Dry‑run (no fixes) with report**

```bash
./run.sh line-length -c tests/test-config.json --dry-run -r out/line-length-report.md -v
```

- **Fix long lines and write output**

```bash
./run.sh line-length -c tests/test-config.json --fix -o out/fixed --verbose
```

- **General analysis without fixing**

```bash
./run.sh analyze -c tests/test-config.json -o out/analysis.txt -v
```

- **Auto‑fixes (format by config)**

```bash
./run.sh fix -c tests/test-config.json -o out/fixed -v
```

- **Paths/patterns**
  - Taken from `tests/test-config.json`, section `paths_for_check`.
  - Typed keys supported: `ts`, `ets`, `cpp` (e.g., `paths_for_check.ts: ["src"]`).

### Unit tests (Jest + ts-jest)

Run all unit tests:

```bash
./run_unit_tests.sh
```

Targeted runs by keys:

```bash
# Line-length formatter
./run_unit_tests.sh llf

# Expression normalizer
./run_unit_tests.sh normalizer

# Specific test file (array-literal)
./run_unit_tests.sh array-literal

# Multiple keys
./run_unit_tests.sh -k llf,normalizer

# Filter by test name
./run_unit_tests.sh -t "Equivalent pairs"
```

Get all available keys and examples:

```bash
./run_unit_tests.sh --help
```

Supported keys at the moment:

- `llf`, `line-length`, `line-length-formatter` — directory `tests/unittests/line-length-formatter`
- `normalizer`, `expr`, `expression-normalizer` — directory `tests/unittests/expression-normalizer`
- `array-literal` — file `tests/unittests/line-length-formatter/array-literal.test.ts`
- Any other string is treated as a file glob suffix: `**/*<string>*.test.ts`

## Debug Tools

### Tokenizer Testing

```bash
# Run tokenizer test
npx ts-node tests/enhanced_ast/test-tokens.ts
```

### AST Visualization

```bash
# Enhanced AST viewer
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "export class Test {}"

# Standard AST viewer
npx ts-node tools/ast_viewer/standard-ast-viewer.ts path/to/file.ts
```

Detailed documentation for visualization tools is available in [tools/ast_viewer/README.md](../tools/ast_viewer/README.md).
