# CLI - Command Line Interface

## Overview

CodeCheck Fixer provides a powerful CLI for all code analysis and formatting operations.

## Installation and Execution

### Via run.sh script (recommended)

```bash
./run.sh <command> [options]
```

The script automatically:
- Installs dependencies (if needed)
- Builds the project (if needed)
- Runs the CLI

### Direct execution

```bash
npm install
npm run build
node dist/src/cli/index.js <command> [options]
```

## Commands

### analyze - Static Analysis

Analyzes files and generates a problem report.

**Syntax:**
```bash
./run.sh analyze --repo /path/to/repo --ts src/ --ets generated/ -c config.json [options]
```

**Path Options:**
- `--repo <path>` - repository root path (required or from config)
- `--ts <paths...>` - TypeScript/TSX paths (comma or space separated)
- `--ets <paths...>` - ETS paths (comma or space separated)
- `--cpp <paths...>` - C/C++ paths (comma or space separated)
- `--paths <paths...>` - untyped file/dir paths (comma or space separated)

**Other Options:**
- `-c, --config <path>` - path to configuration file (required)
- `-o, --output <path>` - file to save report
- `-v, --verbose` - verbose output
- `-q, --quiet` - minimal output
- `--line-length <number>` - maximum line length (default: 120)
- `--ignore-urls` - ignore lines with URLs
- `--ignore-strings` - ignore string literals
- `--ignore-comments` - ignore comments

**Examples:**
```bash
# Basic analysis with paths from CLI
./run.sh analyze --repo /abs/repo --ts src/ --ets generated/ -c config.json

# Analysis with paths from config only
./run.sh analyze -c config.json

# Analysis with report
./run.sh analyze --repo /abs/repo --ts src/ -c config.json -o report.md --verbose

# Analysis with custom settings
./run.sh analyze --repo /abs/repo --ts src/ -c config.json --line-length 100 --ignore-urls
```

**Result:**
- Console output: number of files, found issues
- Report file (if `-o` specified): detailed Markdown report

### format - Formatting

Formats files according to configuration.

**Syntax:**
```bash
./run.sh format --repo /path/to/repo --ts src/ --ets generated/ -c config.json -o ./out/fixed [options]
```

**Path Options:**
- `--repo <path>` - repository root path (required or from config)
- `--ts <paths...>` - TypeScript/TSX paths
- `--ets <paths...>` - ETS paths
- `--cpp <paths...>` - C/C++ paths
- `--paths <paths...>` - untyped paths

**Other Options:**
- `-c, --config <path>` - path to configuration (required)
- `-o, --output <path>` - directory for formatted files (required)
- `-v, --verbose` - verbose output
- `-q, --quiet` - minimal output

**Examples:**
```bash
# Format with paths from CLI
./run.sh format --repo /abs/repo --ts src/ --ets generated/ -c config.json -o ./formatted --verbose

# Format with paths from config
./run.sh format -c config.json -o ./formatted --verbose
```

**Result:**
- Formatted files in `outputDir`
- Directory structure is preserved

### line-length - Check/Fix Long Lines

Specialized command for working with long lines.

**Syntax:**
```bash
./run.sh line-length --repo /path/to/repo --ts src/ --ets generated/ -c config.json [options]
```

**Path Options:**
- `--repo <path>` - repository root path (required or from config)
- `--ts <paths...>` - TypeScript/TSX paths
- `--ets <paths...>` - ETS paths
- `--cpp <paths...>` - C/C++ paths
- `--paths <paths...>` - untyped paths

**Other Options:**
- `-c, --config <path>` - path to configuration (required)
- `-o, --output <path>` - directory for fixed files (default: `./out/fixed`)
- `-r, --report <path>` - file for report
- `--fix` - apply fixes (otherwise analysis only)
- `--dry-run` - analysis only without changes (default)
- `-l, --max-length <number>` - maximum line length
- `--ignore-urls` - ignore lines with URLs
- `--ignore-strings` - ignore string literals
- `--ignore-comments` - ignore comments
- `--ignore-templates` - ignore template literals
- `-v, --verbose` - verbose output
- `-q, --quiet` - minimal output

**Examples:**
```bash
# Analysis only (dry-run) with paths from CLI
./run.sh line-length --repo /abs/repo --ts src/ --ets generated/ -c config.json --dry-run --verbose

# Analysis only with paths from config
./run.sh line-length -c config.json --dry-run --verbose

# Analysis with report
./run.sh line-length --repo /abs/repo --ts src/ -c config.json --dry-run --report ./my-report.md

# Apply fixes
./run.sh line-length --fix --repo /abs/repo --ts src/ --ets generated/ -c config.json -o ./out/fixed --verbose

# Custom line length
./run.sh line-length --fix --repo /abs/repo --ts src/ -c config.json --max-length 100

# Ignore specific content
./run.sh line-length --fix --repo /abs/repo --ts src/ -c config.json --ignore-urls --ignore-strings
```

**Result:**
- `--dry-run`: report with found issues
- `--fix`: fixed files in `outputDir` + SUMMARY.md

### cpp-format - C++ Formatting

Formats C++ files via clang-format.

**Syntax:**
```bash
./run.sh cpp-format --repo /path/to/repo --cpp native/ -c config.json [options]
```

**Path Options:**
- `--repo <path>` - repository root path (required or from config)
- `--cpp <paths...>` - C/C++ paths

**Other Options:**
- `-c, --config <path>` - path to configuration (required)
- `-o, --output <path>` - directory for formatted files
- `--clang-format <path>` - path to clang-format binary
- `-v, --verbose` - verbose output

**Examples:**
```bash
# Standard run with paths from CLI
./run.sh cpp-format --repo /abs/repo --cpp native/src/ -c config.json -o ./out/fixed

# Standard run with paths from config
./run.sh cpp-format -c config.json -o ./out/fixed

# With custom clang-format
./run.sh cpp-format --repo /abs/repo --cpp native/ -c config.json --clang-format /path/to/clang-format
```

**Result:**
- Formatted C++ files in `outputDir`
- Formatting log: `outputDir/cpp-format.log`

**Note:** When running `line-length --fix` with C++ paths in configuration, cpp-format runs automatically.

### fix - Comprehensive Fixing

Synonym for `line-length --fix` command for convenience.

**Syntax:**
```bash
./run.sh fix --repo /path/to/repo --ts src/ --ets generated/ -c config.json -o ./out/fixed [options]
```

**Path Options:**
- `--repo <path>` - repository root path (required or from config)
- `--ts <paths...>` - TypeScript/TSX paths
- `--ets <paths...>` - ETS paths
- `--cpp <paths...>` - C/C++ paths
- `--paths <paths...>` - untyped paths

**Other Options:**
- `-c, --config <path>` - path to configuration (required)
- `-o, --output <path>` - directory for fixed files (default: `./out/fixed`)
- `-v, --verbose` - verbose output
- `-q, --quiet` - minimal output

## Configuration File

See [06-CONFIGURATION.md](06-CONFIGURATION.md) for complete configuration format description.

**Minimal configuration:**
```json
{
  "repo_path": "/absolute/path/to/repo",
  "paths_for_check": {
    "ts": ["src/"],
    "ets": ["generated/"],
    "cpp": ["native/"]
  }
}
```

**Note:** Paths can be provided via CLI flags (`--repo`, `--ts`, `--ets`, `--cpp`, `--paths`), which override config paths. This allows flexible usage:
- Use config for default paths
- Override via CLI for specific runs
- Use CLI-only without config paths

## Output and Logging

### Output Levels

**Normal mode:**
- File processing progress
- Number of issues found
- Execution time

**Verbose (`-v, --verbose`):**
- Detailed information about each file
- Search paths
- Issue diagnostics

**Quiet (`-q, --quiet`):**
- Critical errors only
- Minimal output

### Progress Format (line-length)

```
[42/150] path/to/file.ts … cases: 5 (0.8s, cases: 5, fixed: 3)
```

Components:
- `[42/150]` - file number / total files
- `path/to/file.ts` - relative path (directory in gray)
- `cases: 5` - number of long lines
- `0.8s` - file processing time
- `fixed: 3` - number of fixed lines

### Color Output

- 🔵 Blue - information
- 🟢 Green - success
- 🟡 Yellow - warning
- 🔴 Red - error
- ⚪ Gray - auxiliary information

## Reports

### Analysis Report (analyze)

**Format:** Markdown

**Structure:**
```markdown
# Code Analysis Report

Generated: 2025-12-10T12:00:00.000Z
Files analyzed: 150

Total issues found: 342

## Issues by Type
- syntax_error: 5
- style_violation: 300
- best_practice: 37

## Issues by Severity
- error: 5
- warning: 337

## Detailed Issues

### path/to/file.ts
- [ERROR] Cannot find name 'x' (ts(2304))
  Line 42, Column 15
...
```

### Summary (SUMMARY.md)

**Created:** After `line-length --fix` or `fix`

**Format:** Markdown

**Structure:**
```markdown
# CodeCheck Fixer Summary

- Files processed: 150
- Total issues detected: 342

## Line length results

### TypeScript / ETS
- Files with issues before: 85
- Baseline long lines (before): 234
- Remaining long lines (after): 12

#### Sample of remaining long lines (TS/ETS)
- path/to/file.ts:42 — TS/ETS line length 125
...

### C/C++
- Files formatted: 45
- Baseline long lines (before): 78
- Remaining long lines (after): 3

#### Sample of remaining long lines (C/C++)
- path/to/file.cpp:150
...
```

## Error Handling

### Error Types

1. **Configuration errors**
   - File not found
   - Invalid JSON
   - Missing required fields

2. **Execution errors**
   - File cannot be read
   - Parse error
   - Formatting error

3. **System errors**
   - Insufficient memory
   - No access permissions
   - External tool not found (clang-format)

### Handling

- Errors are output to `stderr`
- Exit code: `1` on error, `0` on success
- Graceful degradation: fallback to basic formatters

## Execution Interruption

**Ctrl+C** — graceful interruption:
- `SIGINT` signal is handled
- Current operation stops
- Partial results are saved (if possible)
- Message displayed: "Operation cancelled by user"

## CI/CD Integration

### Pipeline Check

```yaml
# .gitlab-ci.yml
codecheck:
  script:
    - cd codecheck_fixer
    - npm install
    - npm run build
    - ./run.sh analyze -c config.json -o report.md
  artifacts:
    paths:
      - codecheck_fixer/report.md
    when: always
```

### Automatic Fixing

```bash
# In pre-commit hook
cd codecheck_fixer
./run.sh line-length --fix -c config.json -o ../out/fixed
# Copy fixed files back (optional)
```

## Performance

### Optimization

1. **File filtering** - use `excludePatterns` in configuration
2. **File size** - set `maxFileSize` for large files
3. **Dry-run first** - check result before applying
4. **Caching** - context is reused within a single command

### Typical Execution Time

- 100 TS/ETS files: ~30-60 seconds
- 1000 TS/ETS files: ~5-10 minutes
- 100 C++ files: ~10-20 seconds (depends on clang-format)

## Best Practices

1. **Always use dry-run first**
   ```bash
   ./run.sh line-length -c config.json --dry-run
   ```

2. **Check result before committing**
   ```bash
   git diff out/fixed/
   ```

3. **Save reports**
   ```bash
   ./run.sh analyze -c config.json -o reports/$(date +%Y%m%d).md
   ```

4. **Use verbose for debugging**
   ```bash
   ./run.sh line-length --fix -c config.json --verbose 2>&1 | tee debug.log
   ```

5. **Configure ignores**
   ```bash
   ./run.sh line-length -c config.json --ignore-urls --ignore-comments
   ```

## Conclusion

CodeCheck Fixer CLI provides:
- Intuitive interface
- Rich configuration options
- Detailed reports
- Proper error handling
- CI/CD integration

