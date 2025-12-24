# CodeCheck Fixer

A library and CLI tool for static analysis and automated formatting of TypeScript and C++ code. It ensures CI compliance by providing an API for application integration and a CLI for standalone use.

## Features

-   **Static Analysis**: In-depth analysis of TypeScript code using the TypeScript Compiler API to identify syntax errors, type issues, style violations, and best practice deviations.
-   **Auto-formatting**: Enforces a consistent code style across your entire codebase.
-   **Auto-fixing**: Automatically corrects some of the detected issues.
-   **CLI & API**: Use it as a standalone tool from the command line or integrate it into your existing projects as a library.
-   **Customizable**: Flexibly configure analysis and formatting rules via a `config.json` file.
-   **Reporting**: Generate and save detailed analysis reports.
-   **Line Length Checker**: A dedicated command to find and fix overly long lines of code with multiple configuration options.

## Tech Stack

-   **Language**: TypeScript
-   **Platform**: Node.js (>= 16.0.0)
-   **Core Dependencies**:
    -   `commander`: For creating the command-line interface.
    -   `chalk`: For colorizing terminal output.
    -   `ora`: For displaying spinners during long-running tasks.
    -   `glob`: For matching file paths using patterns.
-   **Development Tools**:
    -   `mocha` + `@koalaui/harness`: For unit testing.
    -   `eslint`: For linting the project's own codebase.
    -   TypeScript Compiler API: Used for both analysis and formatting.

## Installation

```bash
npm install codecheck-fixer
```

## Usage

### Command-Line Interface (CLI)

It is recommended to use the provided `run.sh` script, which automatically installs dependencies and builds the project if needed.

The script forwards all arguments to the CLI. Paths are now passed via CLI flags; the config file stores only analysis/formatting settings.

#### Path Options (available for all commands)

- `--repo <path>` — Repository root path (used as cwd for glob patterns)
- `--ts <paths...>` — TypeScript/TSX file or directory paths (space or comma separated)
- `--ets <paths...>` — ETS file or directory paths (space or comma separated)
- `--cpp <paths...>` — C/C++ file or directory paths (space or comma separated)
- `--paths <paths...>` — Untyped file or directory paths (space or comma separated)

**Note**: Multiple paths can be specified either space-separated or comma-separated:
```bash
--ts src apps/ui           # space-separated
--ts src,apps/ui           # comma-separated
--ets arkui/generated,src  # comma-separated
```

#### Available Commands

```bash
# Analyze code files for issues
./run.sh analyze --repo /abs/repo --ts src apps/ui --ets arkui/generated --cpp native/src -c config.json

# Format code files
./run.sh format --repo /abs/repo --ts src --ets arkui/generated --cpp native/src -c config.json --output out/formatted

# Automatically fix issues (TS/ETS only)
./run.sh fix --repo /abs/repo --ts src --ets arkui/generated -c config.json --output out/fixed

# Check and fix long lines (TS/ETS)
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated --fix -c config.json --output out/fixed

# Format C/C++ files using clang-format
./run.sh cpp-format --repo /abs/repo --cpp native/src -c config.json --output out/formatted
```

### Step-by-step guide (from clone to run)

1. Clone the repository

```bash
git clone https://gitcode.com/lobahmikhail/codecheck_fixer.git codecheck_fixer
cd codecheck_fixer
```

2. Install dependencies

```bash
npm install
# or
npm ci
```

3. Build the project

```bash
npm run build
```

4. Prepare a config (analysis/formatting only; paths are passed via CLI)

```json
{
  "description": "My Project",
  "repo_path": "/absolute/path/to/repo",
  "paths_for_check": {
    "ts": ["src/"],
    "ets": [],
    "cpp": []
  },
  "analysis": {
    "maxFileSize": 1048576
  },
  "formatting": {
    "tabSize": 4,
    "useTabs": false,
    "maxLineLength": 120
  }
}
```

**Note:** You can provide paths via CLI (`--repo`, `--ts`, `--ets`, `--cpp`) or in config, or both. CLI paths override config paths.

5. Run analysis (with report)

```bash
./run.sh analyze --repo /abs/repo --ts src --ets arkui/generated --cpp native/src -c config.json -o ./out/analysis_report.md --verbose
```

6. Run automatic fixes (real-world example)

```bash
./run.sh fix --repo /abs/repo --ts src --ets arkui/generated -c config.json --output ./out/fixed --verbose
```

7. Run line-length check (dry-run and fix)

```bash
# Dry-run (analysis only, creates report)
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --dry-run --verbose

# Apply fixes and write fixed files to out/fixed
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --fix --output ./out/fixed --verbose

# Custom max line length
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --fix --max-length 100

# Ignore specific content types
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --fix --ignore-urls --ignore-strings

# Ignore template literals
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --fix --ignore-templates

# Generate custom report
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated -c config.json --dry-run --report ./my-report.md
```

8. Format C/C++ files

```bash
# Format C/C++ files to output directory
./run.sh cpp-format --repo /abs/repo --cpp native/src -c config.json --output ./out/formatted --verbose

# Use custom clang-format binary
./run.sh cpp-format --repo /abs/repo --cpp native/src --clang-format /path/to/clang-format
```

**Notes:**
- The `out/` directory is created automatically when saving reports or fixed files.
- ETS files are handled by the TypeScript analyzer/formatter.
- Lines that cannot be safely shortened (e.g., due to extremely long identifiers + indentation) are reported as warnings with diagnostic details (indent, longestToken).
- For `line-length` command: if `--fix` is specified, files are written to the output directory; in dry-run mode (default), only analysis is performed and a report is generated.

### Temporary helper scripts

For repeatable checks with pinned configs, the repo includes helper scripts:

```bash
# Real-world single-run check for ETS files
./run_test_single_real_ets.sh

# Real-world single-run check for C++ files
./run_test_single_real_cpp.sh

# Debug mode check with fixtures
./run_test_for_debug.sh

# Line length check and fix (via main CLI) - requires repo and paths arguments
./run.sh line-length --repo /abs/repo --ts src --ets arkui/generated --fix --verbose -c config.json

# Unit tests
npm test  # or npx mocha
```

**Helper script requirements:**
- `run_test_single_real_ets.sh` — requires `REPO_ROOT` and `ETS_PATHS` to be configured in the script
- `run_test_single_real_cpp.sh` — requires `REPO_ROOT` and `CPP_PATHS` to be configured in the script
- `run_test_for_debug.sh` — uses fixtures from `tests/fixtures/`

Artifacts:
- Fixed files are written under `out/fixed/`
- Summary report: `out/fixed/summary.md` (generated by `line-length` with `--fix`)
- Remaining long lines report (CSV): `out/fixed/long_lines.csv` (if post-processing scripts are run)
- C++ format log: `out/fixed/cpp-format.log` (if C++ paths are configured in `line-length --fix`)

### Manual Build and Execution

If you prefer to build and run the application without the `run.sh` helper script, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Build the Project:**
    This command compiles the TypeScript code from `src/` into JavaScript in the `dist/` directory.
    ```bash
    npm run build
    ```

3.  **Run the CLI:**
    After a successful build, you can run the CLI directly using Node.js:
    ```bash
    node dist/src/cli/index.js analyze
    node dist/src/cli/index.js line-length --fix
    ```

### API

You can also integrate `codecheck-fixer` into your own projects:

```typescript
import { Orchestrator } from 'codecheck-fixer';

// Load your configuration
const config = { /* ... */ }; 
const orchestrator = new Orchestrator(config);

// Analyze files
const results = await orchestrator.analyzeFiles(['src/my-file.ts']);

// Generate a report
console.log(orchestrator.generateReport(results));
```

## Configuration

Create a `config.json` file in your project root to customize the behavior.

**Important:** The config stores analysis and formatting settings. Repository path and file paths can be provided via CLI flags (`--repo`, `--ts`, `--ets`, `--cpp`) or in config. CLI paths override config paths.

```json
{
  "description": "My Project",
  "repo_path": "/absolute/path/to/repo",
  "paths_for_check": {
    "ts": ["src/", "lib/", "tests/"],
    "ets": ["frameworks/arkui/generated/"],
    "cpp": ["native/src/"]
  },
  "analysis": {
    "rules": [
      { "name": "syntax_errors", "enabled": true, "severity": "error" },
      { "name": "type_errors", "enabled": true, "severity": "error" },
      { "name": "style_violations", "enabled": true, "severity": "warning" }
    ],
    "includePatterns": ["**/*.ts", "**/*.tsx"],
    "excludePatterns": ["node_modules/**", "dist/**"],
    "maxFileSize": 1048576,
    "timeout": 30000
  },
  "formatting": {
    "tabSize": 4,
    "useTabs": false,
    "quoteStyle": "single",
    "semicolons": true,
    "trailingCommas": true,
    "maxLineLength": 120
  }
}
```

**Configuration notes:**
- Pass repo and file paths via CLI: `--repo <path> --ts <...> --ets <...> --cpp <...>` or `--paths <...>`
- Paths in config are used if CLI paths not provided
- CLI paths override config paths for flexibility
- ETS files are handled by the TypeScript analyzer/formatter
- When saving reports or fixed files, the `out/` directory is created automatically
- `excludePatterns` are matched as substrings in file paths (not glob patterns)

## Supported Languages

-   **TypeScript**: Full support using the TypeScript Compiler API.
-   **C++**: Basic support (currently in development).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0. See `LICENSE` for details.
