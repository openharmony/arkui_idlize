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
    -   `jest`: For testing.
    -   `eslint`: For linting the project's own codebase.
    -   TypeScript Compiler API: Used for both analysis and formatting.

## Installation

```bash
npm install codecheck-fixer
```

## Usage

### Command-Line Interface (CLI)

It is recommended to use the provided `run.sh` script, which automatically installs dependencies and builds the project if needed.

The script forwards all arguments to the CLI. The CLI uses the `paths_for_check` property from your `config.json` file, specified as a nested object by file types (strict, required). ETS files are processed with the TypeScript analyzers/formatters.

```bash
# Analyze files defined in config.json
./run.sh analyze -c config.json

# Format files defined in config.json
./run.sh format -c config.json

# Automatically fix issues in files from config.json
./run.sh fix -c config.json

# Check and fix long lines in files from config.json
./run.sh line-length --fix -c config.json
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

4. Prepare a config (strict format, grouped by file types)

```json
{
  "repo_path": "/absolute/path/to/your/repo",
  "paths_for_check": {
    "ts": ["src"],
    "ets": ["foundation/arkui/ace_engine/.../arkui/generated"],
    "cpp": ["native/src"]
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

5. Run analysis (with report)

```bash
./run.sh analyze -c tests/test_real_config.json -o ./out/analysis_report.md --verbose
```

6. Run automatic fixes (real-world example)

```bash
./run.sh fix -c tests/test_real_config.json --output ./out/fixed --verbose
```

7. Run line-length check (dry-run and fix)

```bash
# Dry-run (analysis only, creates report)
./run.sh line-length -c tests/test_real_config.json --dry-run --verbose

# Apply fixes and write fixed files to out/fixed
./run.sh line-length -c tests/test_real_config.json --fix --output ./out/fixed --verbose

# Custom max line length
./run.sh line-length -c config.json --fix --max-length 100

# Ignore specific content types
./run.sh line-length -c config.json --fix --ignore-urls --ignore-strings

# Generate custom report
./run.sh line-length -c config.json --dry-run --report ./my-report.md
```

Notes:
- The `out/` directory is created automatically when saving reports or fixed files.
- ETS files are handled by the TypeScript analyzer/formatter.
- Lines that cannot be safely shortened (e.g., due to extremely long identifiers + indentation) are reported as warnings with diagnostic details (indent, longestToken).

### Temporary helper scripts

For repeatable checks with pinned configs, the repo includes helper scripts:

```bash
# Real-world single-run check for ETS files
./run_test_single_real_ets.sh

# Real-world single-run check for C++ files
./run_test_single_real_cpp.sh

# Line length check and fix (via main CLI)
./run.sh line-length --fix --verbose -c config.json

# Unit tests
./run_unit_tests.sh

# Test harness examples
./run_test.sh
./run_test0.sh
```

Artifacts:
- Fixed files are written under `out/fixed/`
- Change log: `out/fixed/fix-log.md`
- Remaining long lines report (CSV): `out/fixed/long_lines.csv`
- Aggregated summary (optional): `line-length-issues.md`

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

Preferred nested-by-type format (strict):

```json
{
  "description": "My Project",
  "repo_path": "./",
  "paths_for_check": {
    "ts": ["frameworks/ts/src", "apps/ui/src"],
    "ets": ["frameworks/arkui/generated"],
    "cpp": ["native/src"]
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

Notes:
- ETS files are handled by the TypeScript analyzer/formatter.
- When saving reports or fixed files, the `out/` directory is created automatically.

## Supported Languages

-   **TypeScript**: Full support using the TypeScript Compiler API.
-   **C++**: Basic support (currently in development).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0. See `LICENSE` for details.
