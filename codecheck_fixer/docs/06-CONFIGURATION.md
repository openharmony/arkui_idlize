# Project Configuration

## Overview

CodeCheck Fixer uses JSON configuration to customize all aspects of analysis and formatting.

## Configuration File Format

### Full Schema

```json
{
  "description": "Project description",
  "repo_path": "/absolute/path/to/repository",
  "paths_for_check": {
    "ts": ["src/", "lib/"],
    "ets": ["frameworks/arkui/generated"],
    "cpp": ["native/src/", "native/include/"]
  },
  "analysis": {
    "rules": [
      { "name": "syntax_errors", "enabled": true, "severity": "error" },
      { "name": "type_errors", "enabled": true, "severity": "error" },
      { "name": "style_violations", "enabled": true, "severity": "warning" }
    ],
    "includePatterns": ["**/*.ts", "**/*.tsx", "**/*.cpp"],
    "excludePatterns": ["node_modules/**", "dist/**", "build/**"],
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

## Configuration Sections

### Main Settings

#### description
**Type:** `string` (optional)

Project description for reports.

#### repo_path
**Type:** `string` (required)

Absolute path to repository root. All relative paths in `paths_for_check` are calculated from it.

**Note:** Can be overridden via CLI flag `--repo <path>`.

**Example:**
```json
"repo_path": "/home/user/projects/my-app"
```

#### paths_for_check
**Type:** `object` (required)

**⚠️ Important:** Must be an object grouped by file types. Array not supported.

**Note:** Paths can also be provided via CLI flags: `--ts`, `--ets`, `--cpp`, `--paths`. CLI paths override config paths.

**Structure:**
```json
"paths_for_check": {
  "ts": string[],     // TypeScript files
  "ets": string[],    // ArkTS (ETS) files
  "cpp": string[]     // C++ files
}
```

**Rules:**
- Paths can be directories or specific files
- Relative paths calculated from `repo_path`
- Nested directories supported
- Empty array `[]` allowed for each type

**Example:**
```json
"paths_for_check": {
  "ts": [
    "src/",
    "lib/utils/",
    "tests/unit/"
  ],
  "ets": [
    "frameworks/arkui/ace_engine/generated/"
  ],
  "cpp": [
    "native/src/",
    "native/include/",
    "jni/"
  ]
}
```

### analysis Section

Static analysis settings.

#### rules
**Type:** `array` (optional)

Analysis rules. **Note:** In current implementation doesn't affect rule selection, used for future extension.

**Rule Structure:**
```json
{
  "name": "rule_name",
  "enabled": boolean,
  "severity": "error" | "warning" | "info" | "hint",
  "options": {}  // Optional
}
```

**Standard Rules:**
- `syntax_errors` - syntax errors
- `type_errors` - type errors
- `style_violations` - style violations
- `best_practices` - best practices violations

#### includePatterns
**Type:** `string[]` (optional)

Glob patterns for files to include in analysis.

**⚠️ Note:** Not used in current implementation. File selection determined by `paths_for_check`.

#### excludePatterns
**Type:** `string[]` (optional, default: `["node_modules/**", "dist/**", "build/**"]`)

Patterns to exclude files from analysis.

**Important:** Used in `Orchestrator.shouldAnalyzeFile()` as substring check, not glob-matching.

**Examples:**
```json
"excludePatterns": [
  "node_modules/**",
  "dist/**",
  "build/**",
  "vendor/**",
  "*.test.ts",
  "*.spec.ts"
]
```

#### maxFileSize
**Type:** `number` (optional, default: `1048576` = 1MB)

Maximum file size in bytes. Files larger than this are skipped.

**Recommendations:**
- 1MB for regular projects
- 5MB for projects with large generated files

#### timeout
**Type:** `number` (optional, default: `30000` = 30 seconds)

File analysis timeout in milliseconds.

**⚠️ Note:** Not applied in current implementation.

### formatting Section

Code formatting settings.

#### tabSize
**Type:** `number` (default: `4`)

Tab size in spaces. Used for:
- Indent normalization
- Nesting level calculation
- Adding indentation on line breaks

**Recommendations:**
- `2` - for TypeScript/JavaScript (popular standard)
- `4` - for C++, many other languages

#### useTabs
**Type:** `boolean` (default: `false`)

Use tabs instead of spaces for indentation.

**Note:** Prettier and some other formatters may ignore this setting in favor of their own configuration.

#### quoteStyle
**Type:** `"single" | "double"` (default: `"single"`)

Quote style for string literals.

**⚠️ Limitation:** TypeScriptFormatter may incorrectly handle quote replacement. Prettier recommended.

#### semicolons
**Type:** `boolean` (default: `true`)

Require semicolons at statement ends.

**⚠️ Limitation:** TypeScriptFormatter has simplified semicolon addition logic. Prettier recommended.

#### trailingCommas
**Type:** `boolean` (default: `true`)

Add trailing commas in objects and arrays.

**⚠️ Limitation:** TypeScriptFormatter may incorrectly handle trailing commas. Prettier recommended.

#### maxLineLength
**Type:** `number` (default: `120`)

Maximum line length in characters.

**Used In:**
- LineLengthAnalyzer - for detecting long lines
- LineLengthFormatter - for breaking long lines
- Prettier - as `printWidth`

**Recommendations:**
- `80` - classic standard
- `100` - compromise
- `120` - modern standard
- `140` - for wide displays

## Configuration Examples

### Minimal Configuration

```json
{
  "repo_path": "/path/to/repo",
  "paths_for_check": {
    "ts": ["src/"]
  }
}
```

### TypeScript Project Configuration

```json
{
  "description": "My TypeScript Project",
  "repo_path": "/home/user/projects/my-ts-app",
  "paths_for_check": {
    "ts": ["src/", "lib/", "tests/"]
  },
  "analysis": {
    "excludePatterns": ["node_modules/**", "dist/**", "coverage/**"],
    "maxFileSize": 2097152
  },
  "formatting": {
    "tabSize": 2,
    "useTabs": false,
    "quoteStyle": "single",
    "semicolons": true,
    "trailingCommas": true,
    "maxLineLength": 100
  }
}
```

### HarmonyOS (ArkTS) Project Configuration

```json
{
  "description": "HarmonyOS ArkUI Project",
  "repo_path": "/data/projects/harmonyos-app",
  "paths_for_check": {
    "ts": ["src/main/ets/pages/", "src/main/ets/common/"],
    "ets": ["frameworks/arkui/ace_engine/generated/"],
    "cpp": []
  },
  "analysis": {
    "excludePatterns": ["node_modules/**", "build/**", "oh_modules/**"],
    "maxFileSize": 1048576
  },
  "formatting": {
    "tabSize": 2,
    "useTabs": false,
    "maxLineLength": 120
  }
}
```

### Mixed Project Configuration (TS + C++)

```json
{
  "description": "Mixed TypeScript and C++ Project",
  "repo_path": "/opt/projects/native-app",
  "paths_for_check": {
    "ts": ["src/typescript/", "bindings/"],
    "cpp": ["src/native/", "include/"]
  },
  "analysis": {
    "excludePatterns": ["node_modules/**", "build/**", "dist/**", "vendor/**"],
    "maxFileSize": 5242880
  },
  "formatting": {
    "tabSize": 4,
    "useTabs": false,
    "maxLineLength": 120
  }
}
```

### Strict Checking Configuration

```json
{
  "description": "Strict Quality Control",
  "repo_path": "/projects/enterprise-app",
  "paths_for_check": {
    "ts": ["src/", "lib/"],
    "ets": ["generated/"]
  },
  "analysis": {
    "rules": [
      { "name": "syntax_errors", "enabled": true, "severity": "error" },
      { "name": "type_errors", "enabled": true, "severity": "error" },
      { "name": "style_violations", "enabled": true, "severity": "error" },
      { "name": "best_practices", "enabled": true, "severity": "warning" }
    ],
    "excludePatterns": ["node_modules/**", "dist/**"],
    "maxFileSize": 524288,
    "timeout": 60000
  },
  "formatting": {
    "tabSize": 2,
    "useTabs": false,
    "quoteStyle": "single",
    "semicolons": true,
    "trailingCommas": true,
    "maxLineLength": 80
  }
}
```

## Overriding Settings via CLI

Configuration paths and some settings can be overridden via CLI options:

### Path Overrides

```bash
# Override all paths via CLI (config paths ignored)
./run.sh analyze --repo /abs/repo --ts src/ lib/ --ets generated/ -c config.json

# Mix CLI and config: CLI paths for ts, config paths for ets/cpp
./run.sh analyze --repo /abs/repo --ts src/ -c config.json

# Use only config paths
./run.sh analyze -c config.json
```

**Priority:** CLI paths > Config paths

### Other Overrides

```bash
# Override maxLineLength
./run.sh line-length --repo /abs/repo --ts src/ -c config.json --max-length 100

# Add ignores
./run.sh line-length --repo /abs/repo --ts src/ -c config.json --ignore-urls --ignore-strings --ignore-comments
```

## Configuration Validation

CLI automatically validates configuration on load:

### Required Fields
- `repo_path` - must exist
- `paths_for_check` - must be object (not array)
- `paths_for_check.*` - each value must be string array

### Checks
- `repo_path` - must be absolute path
- `paths_for_check` - at least one type must have non-empty array
- JSON syntax must be valid

### Error Messages

**Invalid JSON:**
```
Error: Invalid JSON in config file: Unexpected token } in JSON
```

**Wrong paths_for_check format:**
```
Error: Invalid config: "paths_for_check" must be an object grouped by file types
```

**Empty configuration:**
```
Error: Invalid config: paths_for_check is empty. Provide at least one path.
```

## Default Values

If sections are missing from configuration, defaults are used:

```typescript
const defaultAnalysisConfig = {
  rules: [
    { name: 'syntax_errors', enabled: true, severity: 'error' },
    { name: 'type_errors', enabled: true, severity: 'error' },
    { name: 'style_violations', enabled: true, severity: 'warning' },
    { name: 'best_practices', enabled: true, severity: 'warning' }
  ],
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.cpp', '**/*.hpp'],
  excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
  maxFileSize: 1048576,  // 1MB
  timeout: 30000         // 30s
};

const defaultFormatterConfig = {
  tabSize: 4,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: true,
  maxLineLength: 120
};
```

## Best Practices

1. **Use absolute paths for repo_path**
   ```json
   "repo_path": "/absolute/path/to/repo"
   ```

2. **Group paths logically**
   ```json
   "paths_for_check": {
     "ts": ["src/", "lib/", "tests/"]
   }
   ```

3. **Use CLI flags for flexibility**
   ```bash
   # Quick check of specific directory
   ./run.sh analyze --repo /abs/repo --ts src/specific-module/ -c config.json
   
   # CI/CD with dynamic paths
   ./run.sh analyze --repo $WORKSPACE --ts $CHANGED_DIRS -c config.json
   ```

4. **Exclude unnecessary directories**
   ```json
   "excludePatterns": ["node_modules/**", "dist/**", "coverage/**"]
   ```

5. **Adjust maxFileSize for project**
   - 1MB for regular projects
   - More for projects with generated files

6. **Unify coding style**
   - Choose one indentation system (spaces or tabs)
   - Fix indent size
   - Define maxLineLength for project

7. **Store configuration in repository**
   ```bash
   git add config.json
   git commit -m "Add codecheck configuration"
   ```

8. **Create profiles for different environments**
   ```
   config.dev.json
   config.ci.json
   config.strict.json
   ```

## Conclusion

CodeCheck Fixer configuration provides:
- Flexible customization of all analysis aspects
- Support for multiple file types
- Load-time validation
- Reasonable defaults
- CLI override capability
