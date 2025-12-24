# Libraries

## Table of Contents
- [Libraries Overview](#libraries-overview)
- [arkts_enhanced_ast](#arkts_enhanced_ast)
- [arkts_formatter](#arkts_formatter)
- [prettier_formatter](#prettier_formatter)
- [clang_formatter](#clang_formatter)
- [common](#common)

## Libraries Overview

Libraries (`libs/`) are independent reusable modules with clearly defined functionality. They can be used both within CodeCheck Fixer and in other projects.

### Development Principles

1. **Independence** — each library is self-sufficient
2. **Single Responsibility** — one library = one task
3. **Minimal Dependencies** — only necessary external packages
4. **Testability** — unit tests for each library
5. **Documentation** — README in each library

### Structure

```
libs/
├── arkts_enhanced_ast/       # Enhanced AST with coordinates
│   ├── enhanced-ast-builder.ts
│   ├── enhanced-ast-query.ts
│   ├── enhanced-ast-types.ts
│   ├── syntactic-separators.ts
│   ├── syntax-tokenizer.ts
│   ├── tests/
│   └── index.ts
├── arkts_formatter/          # AST-based formatter
│   ├── line-length-formatter.ts
│   ├── transformation-manager.ts
│   ├── result-validator.ts
│   ├── strategies/
│   ├── tests/
│   ├── README_RU.md
│   └── index.ts
├── prettier_formatter/       # Prettier wrapper
│   ├── formatter.ts
│   ├── tests/
│   ├── README_RU.md
│   └── index.ts
├── clang_formatter/          # Clang-format wrapper
│   ├── formatter.ts
│   ├── README.md
│   └── index.ts
└── common/                   # Common utilities
    ├── common-types.ts
    ├── content-type-detector.ts
    └── cancellation.ts
```

## arkts_enhanced_ast

**Location:** `libs/arkts_enhanced_ast/`

### Purpose

Building Enhanced AST with additional metadata:
- Precise coordinates (line, column, offset) for all nodes
- Syntactic tokens with positions
- Semantic delimiters
- Coordinate-based query API

### Key Components

#### EnhancedASTBuilder

**File:** `enhanced-ast-builder.ts`

**Purpose:** Build Enhanced AST from standard TypeScript AST.

**Algorithm:**
1. Traverse standard AST (TypeScript Compiler API)
2. Add coordinates to each node
3. Tokenization via SyntaxTokenizer
4. Identify semantic delimiters
5. Build indexes for fast search

**Interface:**
```typescript
class EnhancedASTBuilder {
  build(sourceFile: ts.SourceFile, options: BuilderOptions): EnhancedAST;
}

interface BuilderOptions {
  preserveComments?: boolean;     // Preserve comments
  preserveWhitespace?: boolean;   // Preserve whitespace
  enableDiagnostics?: boolean;    // Enable diagnostics
}
```

#### EnhancedASTQuery

**File:** `enhanced-ast-query.ts`

**Purpose:** API for querying Enhanced AST by coordinates.

**Methods:**
```typescript
class EnhancedASTQuery {
  // Find minimal node covering the range
  findMinimalCoveringNode(range: Range): EnhancedNode | null;
  
  // Find all nodes in range
  findNodesInRange(range: Range): EnhancedNode[];
  
  // Find node at specific position
  findNodeAtPosition(position: Position): EnhancedNode | null;
  
  // Get node parent
  getParent(node: EnhancedNode): EnhancedNode | null;
  
  // Get node children
  getChildren(node: EnhancedNode): EnhancedNode[];
}

interface Range {
  start: Position;
  end: Position;
}

interface Position {
  offset: number;   // Absolute position in file
  line: number;     // Line number (0-based)
  column: number;   // Column number (0-based)
}
```

#### SyntaxTokenizer

**File:** `syntax-tokenizer.ts`

**Purpose:** Code tokenization while preserving each token's position.

**Token types:**
```typescript
enum SyntaxTokenType {
  KEYWORD,           // keywords (if, const, function, etc.)
  IDENTIFIER,        // variable/function identifiers
  OPERATOR,          // operators (+, -, *, /, ==, etc.)
  PUNCTUATION,       // punctuation marks (,, ;, :, etc.)
  STRING_LITERAL,    // string literals
  NUMBER_LITERAL,    // numeric literals
  COMMENT,           // comments
  WHITESPACE,        // spaces, tabs
  NEWLINE,           // line breaks
  TEMPLATE_LITERAL,  // template strings
  JSX_TAG,           // JSX tags
  OTHER              // other
}

interface SyntaxToken {
  type: SyntaxTokenType;
  text: string;
  position: Position;
  length: number;
}
```

#### SyntacticSeparators

**File:** `syntactic-separators.ts`

**Purpose:** Identify semantic delimiters — points where lines can be safely broken.

**Separator types:**
```typescript
enum SeparatorType {
  COMMA,             // comma
  PIPE,              // pipe (union types)
  AMPERSAND,         // ampersand (intersection types)
  LOGICAL_OR,        // ||
  LOGICAL_AND,       // &&
  DOT,               // . (property access)
  ARROW,             // =>
  ASSIGNMENT,        // =, +=, -=, etc.
  OPEN_PAREN,        // (
  CLOSE_PAREN,       // )
  OPEN_BRACE,        // {
  CLOSE_BRACE,       // }
  SEMICOLON,         // ;
  COLON              // :
}

interface SemanticSeparator {
  type: SeparatorType;
  position: Position;
  priority: number;       // Breaking priority (higher = more important)
  safe: boolean;          // Is it safe to break after this separator
}
```

**Priorities:**
1. **High (10-15):** commas, pipes, ampersands
2. **Medium (5-9):** logical operators, assignments
3. **Low (1-4):** access dots, brackets

### Enhanced Node Structure

```typescript
interface EnhancedNode {
  originalNode: ts.Node;                  // Original TypeScript node
  kind: ts.SyntaxKind;                    // Node type
  position: Position;                     // Start position
  end: Position;                          // End position
  syntaxTokens: SyntaxToken[];            // Node tokens
  semanticSeparators: SemanticSeparator[]; // Semantic delimiters
  parent?: EnhancedNode;                  // Parent
  children: EnhancedNode[];               // Children
  metadata: {                             // Metadata
    isLongLine?: boolean;
    complexity?: number;
    [key: string]: any;
  };
}
```

### Usage API

```typescript
import { createEnhancedASTWithQuery } from 'libs/arkts_enhanced_ast';
import * as ts from 'typescript';

// Create SourceFile
const sourceFile = ts.createSourceFile(
  'example.ts',
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

// Build Enhanced AST
const enhancedAST = createEnhancedASTWithQuery(sourceFile, {
  preserveComments: true,
  preserveWhitespace: false,
  enableDiagnostics: false
});

// Use Query API
const node = enhancedAST.query.findNodeAtPosition({
  offset: 150,
  line: 10,
  column: 5
});

if (node) {
  console.log(`Node type: ${ts.SyntaxKind[node.kind]}`);
  console.log(`Tokens: ${node.syntaxTokens.length}`);
  console.log(`Separators: ${node.semanticSeparators.length}`);
}
```

### Usage in Project

Enhanced AST is used in:
1. **LineLengthAnalyzer** — to determine line AST context
2. **LineLengthFormatter** — to find safe break points
3. **EnhancedASTFormattingStrategy** — for AST-based formatting

## arkts_formatter

**Location:** `libs/arkts_formatter/`

**Documentation:** `libs/arkts_formatter/README_RU.md`

### Purpose

AST-based formatter for breaking long lines with semantic equivalence validation.

### Key Components

#### LineLengthFormatter

Main formatter class. See [03-FORMATTERS.md](03-FORMATTERS.md#linelengthformatter) for details.

#### TransformationManager

**File:** `transformation-manager.ts`

**Purpose:** Manage applying transformations (line breaks) to source text.

**Algorithm:**
1. Sort break points by position
2. Apply in reverse order (from end of file)
3. Account for position shifts from previous insertions
4. Add correct indentation on new lines

**Interface:**
```typescript
class TransformationManager {
  applyTransformations(
    content: string,
    breakpoints: LineBreakInsertion[]
  ): TransformationResult;
}

interface TransformationResult {
  result: string;           // Transformed text
  appliedBreaks: number;    // Number of applied breaks
  skippedBreaks: number;    // Number of skipped breaks
}
```

#### ResultValidator

**File:** `result-validator.ts`

**Purpose:** Validate formatting results.

**Checks:**
1. **Syntactic validity** — code parses without errors
2. **Semantic equivalence** — AST matches after normalization
3. **Line length** — modified lines fit within limit
4. **No regressions** — no new long lines

**Interface:**
```typescript
class ResultValidator {
  static validate(
    original: string,
    formatted: string,
    context: FormattingContext,
    fileName: string
  ): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  metrics: {
    linesChanged: number;
    linesFixed: number;
    linesIntroduced: number;
  };
}

interface ValidationIssue {
  type: 'syntax' | 'semantic' | 'length' | 'regression';
  message: string;
  line?: number;
  severity: 'error' | 'warning';
}
```

#### EnhancedASTFormattingStrategy

**File:** `strategies/enhanced-ast-formatting-strategy.ts`

**Purpose:** Formatting strategy based on Enhanced AST.

**Supported constructs:**
- Union types (`A | B | C`)
- Type parameters (`<T, U, V>`)
- Function parameters
- Object literals
- Array literals
- Destructuring
- Imports/exports
- Logical expressions
- Arithmetic expressions
- Method call chains

**Interface:**
```typescript
class EnhancedASTFormattingStrategy implements FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;
  getPriority(): number; // Returns 100 (high priority)
}

interface FormatterResult {
  success: boolean;
  lineBreaks: LineBreakInsertion[];
  reason?: string;  // Failure reason
}
```

### Utilities

**File:** `utils.ts`

```typescript
// Get line information
function getLineInfo(line: string, lineIndex: number, maxLength: number): LineInfo;

// Get line indent
function getIndent(line: string): string;

// Get indent unit from configuration
function getIndentUnit(config: FormatterConfig): string;

// Get indent for AST node
function getIndentForNode(node: EnhancedNode, config: FormatterConfig): string;

// Check if node is long
function isNodeLong(node: EnhancedNode, maxLength: number): boolean;

// Split by top-level commas
function splitByTopLevelCommas(text: string): string[];

// Check for URL presence
function containsUrl(text: string): boolean;

// Check if it's a comment
function isComment(line: string): boolean;
```

### Types

**File:** `types.ts`

```typescript
export interface FormattingContext {
  config: FormatterConfig;
  lineLengthConfig: LineLengthConfig;
  enhancedAST: EnhancedASTWithQuery;
  fileName: string;
  indentUnit: string;
}

export interface LineBreakInsertion {
  position: number;            // Insertion position
  indent: string;              // Indent for new line
  priority: number;            // Break point priority
  reason: string;              // Break reason (for debugging)
}

export interface FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;
  getPriority(): number;
}
```

## prettier_formatter

**Location:** `libs/prettier_formatter/`

**Documentation:** `libs/prettier_formatter/README_RU.md`

### Purpose

Minimal wrapper over `prettier/standalone` for TS/TSX formatting.

### API

```typescript
// Format TypeScript
export async function formatTypeScript(
  content: string,
  overrides?: FormatOverrides
): Promise<string>

// Format TSX
export async function formatTsx(
  content: string,
  overrides?: FormatOverrides
): Promise<string>

// Universal function
export async function formatSourceCode(
  content: string,
  language: 'typescript' | 'tsx',
  overrides?: FormatOverrides
): Promise<string>
```

### Configuration

```typescript
interface FormatOverrides {
  filePath?: string;
  strictParsing?: boolean;              // throw on parse error
  onFormattingError?: (error: Error) => void;
  prettierOptions?: {
    semi?: boolean;
    singleQuote?: boolean;
    trailingComma?: 'all' | 'none' | 'es5';
    useTabs?: boolean;
    tabWidth?: number;
    printWidth?: number;
  };
}
```

### Internal Implementation

Uses:
- `prettier/standalone` — core prettier
- `prettier/parser-typescript` — TypeScript parser
- `prettier/parser-babel` — for TSX (via Babel)

### Error Handling

**strictParsing = false (default):**
- Returns original code on parse error
- Calls `onFormattingError` callback if provided

**strictParsing = true:**
- Throws exception on parse error
- Useful for strict CI/CD checks

### Testing

**Tests:** `libs/prettier_formatter/tests/prettier-based.test.ts`

**Fixtures:** `libs/prettier_formatter/tests/fixtures/`

**Run:**
```bash
cd libs/prettier_formatter
npm test
```

### format-file Utility

**Location:** `tools/prettier_formatter/format-file.ts`

**Purpose:** CLI utility for formatting individual files.

**Usage:**
```bash
npx ts-node tools/prettier_formatter/format-file.ts --file path/to/file.tsx
npx ts-node tools/prettier_formatter/format-file.ts --file path/to/file.tsx --strict
```

## clang_formatter

**Location:** `libs/clang_formatter/`

### Purpose

Wrapper over external `clang-format` tool for C++ formatting.

### API

```typescript
export async function formatCpp(
  content: string,
  filePath: string,
  options?: ClangFormatOptions
): Promise<string>

interface ClangFormatOptions {
  clangFormatPath?: string;   // Path to clang-format binary
  style?: string;             // Formatting style (default: 'file')
  cwd?: string;               // Working directory
}
```

### Algorithm

1. Determine `clang-format` path
   - Check `$OHOS_DIR/prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format`
   - Fallback to system `clang-format`

2. Run via `execFileSync` or `spawnSync`
   ```bash
   clang-format -style=file -assume-filename=<file>
   ```

3. Pass content via stdin, receive via stdout

4. Handle stderr errors

### Usage in CLI

Integrated into `cpp-format` command:
```bash
./run.sh cpp-format -c config.json -o ./out/fixed
```

See [05-CLI.md](05-CLI.md#cpp-format) for details.

## common

**Location:** `libs/common/`

### Purpose

Common types and utilities used throughout the project.

### Components

#### common-types.ts

**Enum ContentType:**
```typescript
enum ContentType {
  TS = 'typescript',
  TSX = 'typescript-jsx',
  ARKTS = 'arkts',
  CPP = 'cpp, cc, cxx, c++, hpp, h',
  UNKNOWN = 'unknown'
}
```

#### content-type-detector.ts

**Class ContentTypeDetector:**
```typescript
class ContentTypeDetector {
  static detectFileType(filePath: string): ContentType;
}
```

**Algorithm:**
- Extracts file extension
- Maps to ContentType enum
- Returns UNKNOWN for unknown extensions

**Example:**
```typescript
ContentTypeDetector.detectFileType('example.ts');    // ContentType.TS
ContentTypeDetector.detectFileType('App.tsx');       // ContentType.TSX
ContentTypeDetector.detectFileType('MyView.ets');    // ContentType.ARKTS
ContentTypeDetector.detectFileType('utils.cpp');     // ContentType.CPP
ContentTypeDetector.detectFileType('README.md');     // ContentType.UNKNOWN
```

#### cancellation.ts

**Class CancellationToken:**
```typescript
class CancellationToken {
  private cancelled: boolean = false;
  
  cancel(): void;
  isCancelled(): boolean;
  reset(): void;
}

export const cancellationToken = new CancellationToken();
```

**Purpose:** Support interruption of long operations (Ctrl+C).

**Usage:**
```typescript
import { cancellationToken } from 'libs/common/cancellation';

for (const file of files) {
  if (cancellationToken.isCancelled()) {
    console.log('Operation cancelled by user');
    break;
  }
  // Process file
}
```

**Process integration:**
```typescript
process.on('SIGINT', () => {
  cancellationToken.cancel();
  console.log('\nCancelling...');
});
```

## Library Dependencies

```
arkts_formatter
    ├─→ arkts_enhanced_ast (for Enhanced AST)
    ├─→ common (for ContentType)
    └─→ typescript (for parsing)

arkts_enhanced_ast
    └─→ typescript (for AST)

prettier_formatter
    ├─→ prettier/standalone
    └─→ prettier/parser-typescript

clang_formatter
    └─→ (external clang-format process)

common
    └─→ (no dependencies)
```

## Library Reusability

All libraries can be used independently:

```typescript
// In other projects
import { createEnhancedASTWithQuery } from 'path/to/libs/arkts_enhanced_ast';
import { LineLengthFormatter } from 'path/to/libs/arkts_formatter';
import { formatTypeScript } from 'path/to/libs/prettier_formatter';
```

## Library Testing

Run unit tests for all libraries:
```bash
npm run test:unit
```

Run tests for a specific library:
```bash
npm test libs/arkts_formatter/tests
npm test libs/prettier_formatter/tests
```

## Conclusion

CodeCheck Fixer libraries provide:
- Independent reusable modules
- Clear separation of responsibilities
- Full test coverage
- Detailed documentation
- Ability to use in other projects

