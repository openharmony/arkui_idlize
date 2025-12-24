# Code Formatters

## Table of Contents
- [Formatting System Overview](#formatting-system-overview)
- [TypeScriptFormatter](#typescriptformatter)
- [CppFormatter](#cppformatter)
- [LineLengthFormatter](#linelengthformatter)
- [Prettier Integration](#prettier-integration)
- [Clang-format Integration](#clang-format-integration)

## Formatting System Overview

The formatting system in CodeCheck Fixer uses a multi-level approach with formatter priority and fallback strategies.

### Formatter Hierarchy

```
Orchestrator
    │
    ├─→ TS/TSX: Prettier (primary) → ArkTS Formatter (fallback)
    ├─→ ETS: TypeScriptFormatter (basic) or LineLengthFormatter
    └─→ CPP: CppFormatter (basic) or clang-format (external)
```

### Formatter Selection Strategy

**In the `Orchestrator.formatFile()` method:**

```typescript
switch (extension) {
  case '.ts':
  case '.tsx':
    return this.formatPreferPrettier(filePath, content, extension);
  case '.ets':
    return this.formatTypeScript(content);
  case '.cpp':
  case '.hpp':
    return this.formatCpp(content);
  default:
    return content;  // No changes
}
```

**Priority for TS/TSX:**
1. Prettier (if successful)
2. ArkTS Formatter (fallback on Prettier error)

## TypeScriptFormatter

**Location:** `src/formatters/typescript-formatter.ts`

### Purpose

Basic formatter for TypeScript/ETS files that performs simple transformations without deep AST analysis.

### Features

1. Indentation normalization (tabs/spaces)
2. Quote formatting (single/double)
3. Semicolon addition/removal
4. Trailing comma formatting
5. Long line wrapping (simple word-wrap)
6. Trailing whitespace removal

### Interface

```typescript
class TypeScriptFormatter {
  private config: FormatterConfig;
  
  constructor(config: FormatterConfig);
  format(content: string): string;
  
  // Internal methods
  private normalizeIndentation(content: string): string;
  private formatQuotes(content: string): string;
  private formatSemicolons(content: string): string;
  private formatTrailingCommas(content: string): string;
  private wrapLongLines(content: string): string;
  private removeTrailingWhitespace(content: string): string;
}
```

### Formatting Methods

#### normalizeIndentation()

Normalizes indentation to a unified style according to configuration.

**Algorithm:**
1. Determines indentation unit (`\t` or `' '.repeat(tabSize)`)
2. Converts all tabs to spaces
3. Calculates indentation level (`Math.floor(spaces.length / tabSize)`)
4. Applies unified indentation

**Example:**
```typescript
// Before (mixed tabs and spaces):
	  function foo() {
    const x = 1;
  }

// After (4 spaces):
function foo() {
    const x = 1;
}
```

#### formatQuotes()

Replaces quotes according to the `quoteStyle` configuration.

**Limitations:**
- Does not handle escaped quotes correctly in all cases
- May conflict with strings containing opposite quote types

#### formatSemicolons()

Adds or removes semicolons at the end of lines.

**Addition logic:**
- Skips empty lines
- Skips lines ending with `{`, `}`, `;`
- Skips comments
- Skips control structures (`if`, `for`, `while`, `function`, `class`)

**Limitations:**
- Simplified analysis, may add `;` in inappropriate places
- Does not account for ASI (Automatic Semicolon Insertion) rules

#### formatTrailingCommas()

Adds or removes trailing commas in objects/arrays.

**Limitations:**
- Works through regular expressions
- May incorrectly modify string literals

#### wrapLongLines()

Simple word-wrap for long lines.

**Algorithm:**
- Splits line by spaces
- Collects words until reaching `maxLineLength`
- Moves remaining words to a new line

**Limitations:**
- Does not consider code syntax
- May break semantics
- Does not add correct indentation

### Usage

```typescript
const config: FormatterConfig = {
  tabSize: 4,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: true,
  maxLineLength: 120
};

const formatter = new TypeScriptFormatter(config);
const formatted = formatter.format(sourceCode);
```

### Limitations and Recommendations

**⚠️ Important:** TypeScriptFormatter does not guarantee preservation of code semantics. For production use, it is recommended to use:
- Prettier for TS/TSX
- LineLengthFormatter (libs/arkts_formatter) for ETS and complex cases

## CppFormatter

**Location:** `src/formatters/cpp-formatter.ts`

### Purpose

Basic formatter for C++ files that performs minimal transformations.

### Features

1. Indentation normalization
2. Trailing whitespace removal
3. Spacing normalization around operators

### Interface

```typescript
class CppFormatter {
  private config: FormatterConfig;
  
  constructor(config: FormatterConfig);
  format(content: string): string;
  
  private normalizeIndentation(content: string): string;
  private removeTrailingWhitespace(content: string): string;
  private normalizeSpacing(content: string): string;
}
```

### Formatting Methods

#### normalizeSpacing()

Normalizes spacing around operators.

**Handled operators:**
- Assignment: `=`
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`
- Delimiters: `,`, `;`

**Example:**
```cpp
// Before:
int x=5+3;
if(a==b&&c>d){

// After:
int x = 5 + 3;
if(a == b && c > d) {
```

**Limitations:**
- May incorrectly handle unary operators (`-x`, `*ptr`)
- Does not consider context (string literals, comments)

### Usage

```typescript
const config: FormatterConfig = {
  tabSize: 4,
  useTabs: false,
  maxLineLength: 120,
  /* other fields are ignored */
};

const formatter = new CppFormatter(config);
const formatted = formatter.format(cppCode);
```

### Recommendations

**⚠️ Important:** For production use, **clang-format** is recommended via the `cpp-format` CLI command.

CppFormatter is intended only for minimal fixes or fallback scenarios.

## LineLengthFormatter

**Location:** `libs/arkts_formatter/line-length-formatter.ts`

### Purpose

Advanced AST-based formatter for breaking long lines while preserving semantic equivalence.

### Key Features

1. **Single-pass formatting** — without AST reconstruction
2. **Result validation** — syntax and semantics checking
3. **ASI protection** — does not break Automatic Semicolon Insertion
4. **Formatting strategies** — pluggable strategies by priority
5. **Error rollback** — returns original code on invalid result

### Architecture

```
LineLengthFormatter
    ├─→ FormattingContext (Enhanced AST, config)
    ├─→ EnhancedASTFormattingStrategy
    ├─→ TransformationManager (applying changes)
    └─→ ResultValidator (validation)
```

### Interface

```typescript
class LineLengthFormatter {
  constructor(
    formatterConfig: FormatterConfig, 
    lineLengthConfig: LineLengthConfig
  );
  
  format(
    content: string, 
    contentType: ContentType, 
    providedContext?: FormattingContext
  ): string;
}
```

### Workflow Algorithm

1. **Context creation** (if not provided)
   - Build Enhanced AST once
   - Store configuration
   - Calculate indentation

2. **Apply formatting** (single-pass)
   - Traverse lines exceeding limit
   - Apply strategies by priority
   - Choose optimal break points
   - Maximum 5 breaks per line

3. **Comment post-processing**
   - Split long single-line comments
   - Simple regex-based approach

4. **Result validation**
   - Syntactic check (parsing)
   - Semantic equivalence (AST normalization)
   - Line length check
   - Regression check

5. **Rollback or return**
   - On successful validation — return result
   - On error — return original code

### EnhancedASTFormattingStrategy

**Location:** `libs/arkts_formatter/strategies/enhanced-ast-formatting-strategy.ts`

Main formatting strategy based on Enhanced AST.

**Supported constructs:**
- Union types (`A | B | C`)
- Type parameters (`<T, U, V>`)
- Function parameters
- Object literals
- Array literals
- Destructuring
- Imports/exports
- Logical and arithmetic expressions
- Method call chains

**Break point priorities:**
1. Semantic delimiters (`,`, `|`, `&`)
2. Low-priority operators (`||`, `&&`)
3. Assignment operators (`=`, `+=`, etc.)
4. Property access dots (`.`)
5. Brackets and quotes

### TransformationManager

**Purpose:** Apply changes to source text accounting for position shifts.

**Algorithm:**
1. Sort break points by position
2. Apply in reverse order (from end)
3. Account for shifts from adding line break characters

### ResultValidator

**Purpose:** Validate formatting results.

**Checks:**
1. **Syntactic validity**
   - Code must parse without errors

2. **Semantic equivalence**
   - Normalized ASTs must match
   - Normalization: remove whitespace, comments, positions

3. **Line length**
   - Modified lines must fit within limit
   - Small exceedance allowed for edge cases

4. **No regressions**
   - New long lines must not appear

### ASI Protection

The formatter **never** inserts a break after:
- `return`
- `throw`
- `break`
- `continue`
- `yield`

This prevents critical errors like:

```typescript
// Dangerous! ASI will insert `;` after return
return  // ← semicolon automatically added here
  { value: 42 };  // ← unreachable code!

// Correct:
return {
  value: 42
};
```

### Usage

```typescript
import { LineLengthFormatter } from 'libs/arkts_formatter';
import { ContentType } from 'libs/common/common-types';

const formatterConfig = {
  tabSize: 2,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: false,
  maxLineLength: 80
};

const lineLengthConfig = {
  maxLineLength: 80,
  ignoreUrls: true,
  ignoreStrings: false,
  ignoreComments: true,
  ignoreTemplateLiterals: true
};

const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);
const result = formatter.format(sourceCode, ContentType.TS);
```

### Performance

- **Single-pass formatting** — AST is built once
- **Result caching** — context reuse
- **Optimal data structures** — fast access to nodes by position

**Typical processing time:**
- 1000-line file: ~200-500ms
- 5000-line file: ~1-2s

## Prettier Integration

**Location:** `libs/prettier_formatter/`

### Purpose

Wrapper over `prettier/standalone` for TS/TSX formatting.

### Exported Functions

```typescript
// Format TypeScript
function formatTypeScript(
  content: string, 
  overrides?: FormatOverrides
): Promise<string>

// Format TSX
function formatTsx(
  content: string, 
  overrides?: FormatOverrides
): Promise<string>

// Universal function
function formatSourceCode(
  content: string, 
  language: 'typescript' | 'tsx',
  overrides?: FormatOverrides
): Promise<string>
```

### Configuration

```typescript
interface FormatOverrides {
  filePath?: string;                    // Path for diagnostics
  strictParsing?: boolean;              // Strict mode (throw on error)
  onFormattingError?: (error: Error) => void;  // Error callback
  prettierOptions?: {                   // Prettier options
    semi?: boolean;
    singleQuote?: boolean;
    trailingComma?: 'all' | 'none' | 'es5';
    useTabs?: boolean;
    tabWidth?: number;
    printWidth?: number;
  };
}
```

### Usage in Orchestrator

```typescript
private async formatWithPrettier(
  filePath: string,
  content: string,
  extension: string
): Promise<string> {
  const overrides = this.buildPrettierOverrides(filePath);
  if (extension === '.tsx') {
    return prettierFormatTsx(content, overrides);
  }
  return prettierFormatTypeScript(content, overrides);
}
```

**Fallback strategy:**
```typescript
try {
  return await this.formatWithPrettier(filePath, content, extension);
} catch (error) {
  console.warn(`Prettier failed, using ArkTS formatter fallback`);
  return this.formatWithArkTsFallback(content, extension);
}
```

### Limitations

- **Only TS/TSX** — ETS is not supported
- **Requires prettier/standalone** — increases bundle size
- **May not handle syntax errors**

## Clang-format Integration

**Location:** CLI command `cpp-format`, library `libs/clang_formatter/`

### Purpose

Format C++ files through external clang-format process with comprehensive statistics and progress tracking.

### CLI Interface

```bash
./run.sh cpp-format -c config.json -o ./out/fixed --verbose
./run.sh cpp-format -c config.json -l 100 --clang-format /path/to/clang-format
```

**Options:**
- `-c, --config <path>` — path to configuration file
- `-o, --output <path>` — output directory (default: `./out/fixed`)
- `-l, --max-length <number>` — maximum line length for statistics (default: 120)
- `--clang-format <path>` — explicit path to clang-format binary
- `-v, --verbose` — verbose output with version info and detailed progress

### Workflow Algorithm

1. **Determine clang-format path** (priority order):
   - User-specified path via `--clang-format` option
   - `$OHOS_DIR/prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format` (if OHOS_DIR set)
   - `<repoPath>/prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format`
   - System PATH via `which clang-format` (Linux/macOS)
   - System PATH via `where clang-format` (Windows)
   - Fallback to `clang-format` command

2. **Validate clang-format availability**
   - Run `clang-format --version` to verify accessibility
   - Display version info in verbose mode
   - Exit with clear error message if not available

3. **Find files**
   - Glob by `paths_for_check.cpp` from configuration
   - Filter by extensions: `.cpp`, `.cc`, `.cxx`, `.c++`, `.hpp`, `.h`
   - Display total count

4. **Format each file with progress tracking**
   ```bash
   clang-format -style=file -assume-filename=<file> < input > output
   ```
   
   **Progress display:**
   ```
   [1/42] src/core/parser.cpp ✓
   [2/42] src/utils/string_helper.cpp ⚠ 3 длинных
   [3/42] src/api/handler.cpp ✗ ошибка парсинга
   ```
   
   - Gray directory, white filename
   - Green ✓ for success without long lines
   - Yellow ⚠ for success with remaining long lines
   - Red ✗ for errors with short description

5. **Count long lines**
   - Before formatting (baseline)
   - After formatting (remaining)
   - Only for source files (skip `.h`, `.hpp` headers)
   - Generate CSV report with remaining long lines

6. **Save results**
   - In `outputDir` preserving directory structure
   - Detailed log to `cpp-format.log`
   - CSV report to `long_lines_cpp_remaining.csv`

### Statistics Output

After completion, displays comprehensive statistics:

```
══════════════════════════════════════════════════════════════════════
Статистика форматирования C++
══════════════════════════════════════════════════════════════════════
Всего файлов: 42
Успешно отформатировано: 40
Ошибок: 2
Длинных строк до: 156
Длинных строк после: 23
Исправлено: 133 (85.3%)
Время выполнения: 00:00:12.345
Выходная директория: ./out/fixed
Лог: ./out/fixed/cpp-format.log
══════════════════════════════════════════════════════════════════════

! Оставшиеся длинные строки сохранены в: ./out/fixed/long_lines_cpp_remaining.csv

✓ Форматирование C++ завершено
```

### Automatic Execution

When executing `line-length --fix` with `paths_for_check.cpp` section in config:
- C++ formatting automatically runs after TS/ETS processing
- Progress indicator with colored paths
- Validation of clang-format availability
- "Before/after" statistics collected
- Results included in summary report
- CSV report for remaining issues

### Error Handling

**Categorized error messages:**
- `ENOENT` → "clang-format не найден"
- `EACCES` → "нет прав доступа"
- Parse errors → "ошибка парсинга"
- Long messages → truncated to 50 chars

**Detailed logging:**
```
[OK] /path/to/file.cpp -> /path/to/out/file.cpp
[FAIL] /path/to/error.cpp
error: unexpected token at line 42
status: 1
stderr: ...detailed error output...
[STDERR] /path/to/warning.cpp
warning: file uses tabs instead of spaces
```

### CSV Report Format

`long_lines_cpp_remaining.csv`:
```csv
file,line,length
/out/fixed/src/parser.cpp,123,145
/out/fixed/src/utils.cpp,456,138
```

### Cross-Platform Support

- **Linux/macOS:** Uses `which` to find clang-format in PATH
- **Windows:** Uses `where` to find clang-format in PATH
- **All platforms:** Supports explicit path via `--clang-format`

### Performance Features

- Progress tracking with real-time updates
- Efficient file processing with buffering (100MB maxBuffer)
- Execution timer with HH:MM:SS.mmm format
- Minimal overhead for statistics collection

### Integration with Library

The CLI command uses the `libs/clang_formatter` library which provides:
- `formatCpp(code, filePath, options)` — format single code snippet
- `formatCppCode(options)` — format with full options control
- `ClangFormatError` — typed error handling
- Automatic clang-format path resolution
- Strict and non-strict parsing modes

## Formatter Comparison

| Formatter | Languages | AST-based | Validation | Recommendation |
|-----------|----------|-----------|------------|----------------|
| **LineLengthFormatter** | TS/TSX/ETS | ✅ | ✅ | **Primary** for line-length |
| **Prettier** | TS/TSX | ✅ | ✅ | **Primary** for TS/TSX |
| **TypeScriptFormatter** | TS/ETS | ❌ | ❌ | Basic/fallback |
| **CppFormatter** | C++ | ❌ | ❌ | Basic/fallback |
| **clang-format** | C++ | ✅ | ✅ | **Primary** for C++ |

## Best Practices

1. **Formatter selection:**
   - TS/TSX → Prettier (primary) → LineLengthFormatter (fallback)
   - ETS → LineLengthFormatter
   - C++ → clang-format

2. **Validation:**
   - Always verify results (dry-run first)
   - Use ResultValidator for semantic checking

3. **Performance:**
   - Reuse FormattingContext for multiple operations
   - Cache Enhanced AST

4. **Safety:**
   - Save to a separate directory (not in-place)
   - Verify results before committing

## Conclusion

The CodeCheck Fixer formatter system provides:
- Intelligent formatting with AST analysis
- Preservation of semantic equivalence
- Result validation
- Error rollback
- Integration with industry tools (Prettier, clang-format)

