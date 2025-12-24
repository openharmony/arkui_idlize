# Code Analyzers

## Table of Contents
- [Analysis System Overview](#analysis-system-overview)
- [BaseAnalyzer](#baseanalyzer)
- [TypeScriptAnalyzer](#typescriptanalyzer)
- [LineLengthAnalyzer](#linelengthanalyzer)
- [CppAnalyzer](#cppanalyzer)
- [Types and Interfaces](#types-and-interfaces)
- [System Extension](#system-extension)

## Analysis System Overview

The code analysis system in CodeCheck Fixer is built on a class hierarchy with a base abstract class `BaseAnalyzer`, defining a common interface for all analyzers.

### Analyzer Architecture

```
                    ┌──────────────┐
                    │BaseAnalyzer  │ (abstract)
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┬──────────────┐
            │              │              │              │
    ┌───────▼──────┐  ┌───▼──────┐  ┌───▼──────┐  ┌────▼────┐
    │TypeScript    │  │LineLength│  │Cpp       │  │Future   │
    │Analyzer      │  │Analyzer  │  │Analyzer  │  │Analyzers│
    └──────────────┘  └──────────┘  └──────────┘  └─────────┘
```

### Operating Principles

1. **Unified Interface** — all analyzers implement the `analyze()` method
2. **Independence** — each analyzer works autonomously
3. **Content Typing** — analyzers receive content type (TS/TSX/ETS/CPP)
4. **Standard Result** — all return `AnalysisResult`

## BaseAnalyzer

**Location:** `src/core/analyzer.ts`

### Purpose

Base abstract class defining the contract for all analyzers and providing common utilities.

### Interface

```typescript
abstract class BaseAnalyzer {
  protected config: AnalysisConfig;
  
  constructor(config: AnalysisConfig);
  
  // Main analysis method (abstract)
  abstract analyze(
    content: string, 
    contentType: ContentType
  ): Promise<AnalysisResult>;
  
  // Helper methods
  protected createIssue(
    type: IssueType,
    severity: Severity,
    message: string,
    line: number,
    column: number,
    rule: string
  ): Issue;
  
  protected calculateMetrics(content: string): CodeMetrics;
}
```

### Configuration (AnalysisConfig)

```typescript
interface AnalysisConfig {
  rules: RuleConfig[];           // Analysis rules
  includePatterns: string[];     // Include patterns
  excludePatterns: string[];     // Exclude patterns
  maxFileSize: number;           // Maximum file size (bytes)
  timeout: number;               // Analysis timeout (ms)
}
```

### Methods

#### createIssue()

Creates an Issue object with standard fields.

**Parameters:**
- `type` — issue type (IssueType enum)
- `severity` — severity level (Severity enum)
- `message` — issue description
- `line` — line number (1-based)
- `column` — column number (1-based)
- `rule` — rule identifier

**Returns:** `Issue`

#### calculateMetrics()

Calculates code metrics (partially implemented).

**Parameters:**
- `content` — source code

**Returns:** `CodeMetrics`
- `linesOfCode` — lines of code (excluding empty and comments)
- `cyclomaticComplexity` — cyclomatic complexity (stub)
- `maintainabilityIndex` — maintainability index (stub)
- `technicalDebt` — technical debt (stub)

### Example Descendant Implementation

```typescript
class MyAnalyzer extends BaseAnalyzer {
  async analyze(content: string, contentType: ContentType): Promise<AnalysisResult> {
    const issues: AnalysisIssue[] = [];
    
    // Analysis logic
    if (someCondition) {
      issues.push(this.createIssue(
        IssueType.STYLE_VIOLATION,
        Severity.WARNING,
        'Style violation',
        10,
        5,
        'my-rule'
      ));
    }
    
    return {
      issues,
      metrics: this.calculateMetrics(content)
    };
  }
}
```

## TypeScriptAnalyzer

**Location:** `src/analyzers/typescript-analyzer.ts`

### Purpose

Analysis of TypeScript/TSX/ETS code using TypeScript Compiler API.

### Capabilities

1. **Syntax Analysis** — detecting syntax errors
2. **Type Analysis** — checking type errors
3. **Style Checking** — detecting coding style violations
4. **Best Practices** — checking for `any` usage, naming conventions

### Implementation

```typescript
class TypeScriptAnalyzer extends BaseAnalyzer {
  constructor(config: AnalysisConfig);
  
  async analyze(
    content: string, 
    contentType: ContentType
  ): Promise<AnalysisResult>;
  
  // Internal methods
  private createProgram(filePath: string, content: string): ts.Program;
  private visitNode(node: ts.Node, issues: AnalysisIssue[]): void;
  private mapDiagnosticSeverity(category: ts.DiagnosticCategory): Severity;
}
```

### Operating Algorithm

1. **Creating SourceFile**
   ```typescript
   const sourceFile = ts.createSourceFile(
     virtualFile,
     content,
     ts.ScriptTarget.ES2020,
     true
   );
   ```

2. **Creating Program**
   ```typescript
   const program = this.createProgram(virtualFile, content);
   ```

3. **Getting Diagnostics**
   ```typescript
   const diagnostics = ts.getPreEmitDiagnostics(program);
   ```

4. **Processing Compiler API Diagnostics**
   - Extracting error position
   - Formatting message
   - Mapping severity
   - Creating Issue

5. **Additional AST Traversal**
   - Checking for `any` usage
   - Checking naming conventions (leading underscore)
   - Extensible rule system

### Checked Rules

#### 1. TypeScript Compiler Diagnostics

All standard TypeScript compiler errors and warnings:
- Syntax errors
- Type mismatches
- Unused variables
- Unreachable code
- And others (see TypeScript diagnostics)

**Rule Format:** `ts(${diagnostic.code})`

**Examples:**
- `ts(2304)` — Cannot find name 'X'
- `ts(2322)` — Type 'X' is not assignable to type 'Y'
- `ts(7006)` — Parameter 'X' implicitly has an 'any' type

#### 2. no-any

Warns about using the `any` type.

**Severity:** warning  
**Type:** best-practice

**Detection:**
```typescript
if (ts.isTypeNode(node) && node.kind === ts.SyntaxKind.AnyKeyword) {
  issues.push({
    rule: 'no-any',
    message: 'Avoid using the "any" type',
    line: line + 1,
    column: character + 1,
    severity: 'warning',
    type: 'best-practice'
  });
}
```

**Problematic Code Example:**
```typescript
function process(data: any) {  // ← violation
  return data;
}
```

#### 3. no-leading-underscore

Warns about variables starting with an underscore.

**Severity:** warning  
**Type:** style

**Detection:**
```typescript
if (ts.isVariableDeclaration(node) && node.name.getText().startsWith('_')) {
  issues.push({
    rule: 'no-leading-underscore',
    message: 'Variable names should not start with an underscore',
    line: line + 1,
    column: character + 1,
    severity: 'warning',
    type: 'style'
  });
}
```

**Problematic Code Example:**
```typescript
const _privateVar = 42;  // ← violation
```

### Analysis Result

```typescript
interface AnalysisResult {
  issues: AnalysisIssue[];
  performance?: {
    analysisTime: number;
    memoryUsage: number;
  };
  metrics?: CodeMetrics;
  timestamp?: Date;
}
```

### Usage Example

```typescript
const config: AnalysisConfig = {
  rules: [],
  includePatterns: ['**/*.ts'],
  excludePatterns: ['node_modules/**'],
  maxFileSize: 1048576,
  timeout: 30000
};

const analyzer = new TypeScriptAnalyzer(config);
const result = await analyzer.analyze(sourceCode, ContentType.TS);

console.log(`Found ${result.issues.length} issues`);
result.issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.message} at line ${issue.line}`);
});
```

### Limitations

1. **Does not perform full type checking** — uses simplified CompilerHost
2. **No access to node_modules** — analyzes only provided content
3. **Virtual file system** — file exists only in memory

### Extension

To add new AST traversal rules:

1. Add check in the `visitNode()` method
2. Define trigger condition
3. Create Issue via base method
4. Document the rule

**Example:**
```typescript
private visitNode(node: ts.Node, issues: AnalysisIssue[]): void {
  // New rule: check for console.log
  if (ts.isCallExpression(node)) {
    const expr = node.expression;
    if (ts.isPropertyAccessExpression(expr) &&
        expr.expression.getText() === 'console' &&
        expr.name.text === 'log') {
      const sourceFile = node.getSourceFile();
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      issues.push({
        rule: 'no-console-log',
        message: 'Avoid using console.log in production code',
        line: line + 1,
        column: character + 1,
        severity: 'warning',
        type: 'best-practice'
      });
    }
  }
  
  // Recursive traversal
  ts.forEachChild(node, (child) => this.visitNode(child, issues));
}
```

## LineLengthAnalyzer

**Location:** `src/analyzers/line-length-analyzer.ts`

### Purpose

Specialized analyzer for detecting and classifying long code lines with deep AST context analysis.

### Features

1. **AST-context analysis** — uses Enhanced AST to understand code structure
2. **Fixability determination** — assesses whether the problem can be automatically fixed
3. **Cause diagnostics** — explains why a line cannot be fixed
4. **Ignore support** — supports ignoring URLs, strings, comments

### Configuration

```typescript
interface LineLengthConfig {
  maxLineLength: number;           // Maximum line length (default 120)
  ignoreUrls: boolean;             // Ignore lines with URLs
  ignoreStrings: boolean;          // Ignore string literals
  ignoreComments: boolean;         // Ignore comments
  ignoreTemplateLiterals: boolean; // Ignore template literals
}
```

### Implementation

```typescript
class LineLengthAnalyzer extends BaseAnalyzer {
  private lineLengthConfig: LineLengthConfig;
  private sourceFile: ts.SourceFile;
  private enhancedAST: EnhancedASTWithQuery;
  
  constructor(config: AnalysisConfig, lineLengthConfig: LineLengthConfig);
  
  async analyze(
    content: string, 
    contentType: ContentType
  ): Promise<AnalysisResult>;
  
  // Internal methods
  private getAstContextForLine(lineNumber: number): ts.Node | null;
  private shouldIgnoreLine(line: string, lineNumber: number, astContext: ts.Node | null): boolean;
  private isLinePotentiallyFixable(line: string, lineIndex: number, astContext: ts.Node | null): boolean;
  private getLeadingIndentLength(line: string): number;
  private getLongestTokenLengthOnLine(lineIndex: number): number;
}
```

### Operating Algorithm

1. **Creating SourceFile and Enhanced AST**
   ```typescript
   this.sourceFile = ts.createSourceFile(virtualFile, content, ts.ScriptTarget.Latest, true);
   this.enhancedAST = createEnhancedASTWithQuery(this.sourceFile, {
     preserveComments: true,
     preserveWhitespace: false,
     enableDiagnostics: false
   });
   ```

2. **Analyzing Each Line**
   ```typescript
   const lines = content.split('\n');
   lines.forEach((line, i) => {
     if (line.length > this.lineLengthConfig.maxLineLength) {
       // Line analysis
     }
   });
   ```

3. **Getting AST Context**
   - Determining line position in file
   - Finding minimal covering AST node
   - Using Enhanced AST Query API

4. **Checking for Ignoring**
   - Checking for URL (regex)
   - Checking for string literals (AST + fallback)
   - Checking for comments (AST + fallback)
   - Checking for template literals (AST + fallback)

5. **Fixability Assessment**
   - Heuristic analysis of breakpoint presence
   - Checking for "unbreakable" tokens
   - Calculating indent length and longest token

6. **Creating Issue**
   - Standard message for fixable
   - Extended diagnostics for unfixable

### Fixability Determination

A line is considered **fixable** if:

1. It is a comment (`//`, `/*`, `*`)
2. Contains separators:
   - Commas or vertical bars (union types)
   - `as` (type assertion)
   - Parentheses `()` (calls/parameters)
   - Curly braces `{}` (objects)
   - `+` operator (concatenation)
   - Colon with type `:\s*\S`
   - `extends` or `implements`

3. **AND** the sum of indent and longest token does not exceed the limit

A line is **not fixable** if:
- Single very long identifier + indent >= maxLineLength
- No safe breakpoints available

### Issue Format

**Fixable issue:**
```typescript
{
  rule: 'line-length',
  message: 'Line 42 length 135 exceeds maximum length of 120',
  line: 42,
  column: 1,
  severity: 'warning',
  type: 'style',
  isFixable: true,
  lineLength: 135
}
```

**Unfixable issue:**
```typescript
{
  rule: 'line-length',
  message: 'Line 42 length 135 exceeds maximum length of 120 (no safe breakpoints; indent=8, longestToken=115) — consider shortening identifiers or refactoring expression formatting',
  line: 42,
  column: 1,
  severity: 'warning',
  type: 'style',
  isFixable: false,
  lineLength: 135
}
```

### Context Analysis Methods

#### getAstContextForLine()

Returns the minimal AST node fully covering the specified line.

**Uses:** Enhanced AST Query API (`findMinimalCoveringNode`)

**Returns:** `ts.Node | null`

#### shouldIgnoreLine()

Checks whether the line should be ignored according to configuration.

**Logic:**
1. Empty lines — ignore
2. If `ignoreUrls` and contains URL — ignore
3. If AST context available:
   - `ignoreStrings` + `ts.isStringLiteral()` — ignore
   - `ignoreTemplateLiterals` + `ts.isTemplateLiteral()` — ignore
   - `ignoreComments` + `ts.isJSDoc()` — ignore
4. Fallback to text analysis:
   - `isStringLiteral()` — check by quotes
   - `isComment()` — check by `//`, `/*`, `*`
   - `isTemplateLiteral()` — check by backticks

#### isLinePotentiallyFixable()

Assesses the possibility of automatic fixing.

**Heuristics:**
- Comments are always fixable (wrapping)
- Presence of `,`, `|`, `as`, `()`, `{}`, `+`, `:`, `extends`, `implements` — signs of fixability
- Exceeding limit due to one token — unfixable

#### getLongestTokenLengthOnLine()

Calculates the length of the longest token on the line.

**Uses:** Enhanced AST tokens from `node.syntaxTokens`

**Ignores:** Whitespace and Newline tokens

**Returns:** `number` (length in characters)

### Usage Example

```typescript
const analysisConfig: AnalysisConfig = { /* ... */ };
const lineLengthConfig: LineLengthConfig = {
  maxLineLength: 120,
  ignoreUrls: true,
  ignoreStrings: false,
  ignoreComments: true,
  ignoreTemplateLiterals: true
};

const analyzer = new LineLengthAnalyzer(analysisConfig, lineLengthConfig);
const result = await analyzer.analyze(sourceCode, ContentType.TS);

const fixableIssues = result.issues.filter(issue => issue.isFixable);
const unfixableIssues = result.issues.filter(issue => !issue.isFixable);

console.log(`Fixable: ${fixableIssues.length}, Unfixable: ${unfixableIssues.length}`);
```

### Formatter Integration

LineLengthAnalyzer is tightly integrated with `LineLengthFormatter`:

```typescript
// In Orchestrator
const { result, fixedContent } = await this.orchestrator.analyzeAndFixLineLength(
  filePath, 
  content, 
  lineLengthConfig
);

if (result.issues.length > 0 && fixedContent) {
  // Apply fixes
}
```

## CppAnalyzer

**Location:** `src/analyzers/cpp-analyzer.ts`

### Purpose

Analyzer for C++ code (current implementation is a stub).

### Status

**⚠️ Stub** — full C++ analysis is not yet implemented.

### Implementation

```typescript
class CppAnalyzer extends BaseAnalyzer {
  constructor(config: AnalysisConfig);
  
  async analyze(
    _content: string, 
    _contentType: ContentType
  ): Promise<AnalysisResult> {
    return { issues: [] };  // Empty result
  }
}
```

### Future Plans

Possible development directions:
1. Integration with clang-tidy for static analysis
2. Parsing via libclang
3. C++ coding style checking
4. Security analysis (memory leaks, buffer overflows)

## Types and Interfaces

### AnalysisResult

```typescript
interface AnalysisResult {
  filePath?: string;              // File path (optional)
  issues: AnalysisIssue[];        // Issue list
  performance?: {                 // Performance metrics
    analysisTime: number;
    memoryUsage: number;
  };
  metrics?: CodeMetrics;          // Code metrics
  timestamp?: Date;               // Analysis time
}
```

### AnalysisIssue

```typescript
interface AnalysisIssue {
  rule: string;                   // Rule identifier
  message: string;                // Issue description
  line: number;                   // Line number (1-based)
  column: number;                 // Column number (1-based)
  severity: 'error' | 'warning' | 'info';
  type: 'syntax' | 'style' | 'performance' | 'best-practice' | 'security' | 'custom';
  isFixable?: boolean;            // Can be automatically fixed
  lineLength?: number;            // Line length (for line-length)
}
```

### IssueType

```typescript
enum IssueType {
  SYNTAX_ERROR = 'syntax_error',
  STYLE_VIOLATION = 'style_violation',
  TYPE_ERROR = 'type_error',
  PERFORMANCE_ISSUE = 'performance_issue',
  SECURITY_ISSUE = 'security_issue',
  BEST_PRACTICE = 'best_practice'
}
```

### Severity

```typescript
enum Severity {
  ERROR = 'error',       // Critical error
  WARNING = 'warning',   // Warning
  INFO = 'info',         // Information
  HINT = 'hint'          // Hint
}
```

### CodeMetrics

```typescript
interface CodeMetrics {
  linesOfCode: number;          // Lines of code
  cyclomaticComplexity: number; // Cyclomatic complexity
  maintainabilityIndex: number; // Maintainability index
  technicalDebt: number;        // Technical debt (minutes)
  testCoverage?: number;        // Test coverage (%)
}
```

## System Extension

### Adding a New Analyzer

1. **Create a class inheriting from BaseAnalyzer**

```typescript
import { BaseAnalyzer } from '../core/analyzer';
import { ContentType } from '../../libs/common/common-types';
import { AnalysisResult, AnalysisIssue, AnalysisConfig } from '../types';

export class MyCustomAnalyzer extends BaseAnalyzer {
  constructor(config: AnalysisConfig) {
    super(config);
  }
  
  async analyze(content: string, contentType: ContentType): Promise<AnalysisResult> {
    const issues: AnalysisIssue[] = [];
    
    // Your analysis logic
    
    return { issues };
  }
}
```

2. **Register in Orchestrator**

In `src/core/orchestrator.ts`, method `analyzeFileContent()`:

```typescript
async analyzeFileContent(filePath: string, content: string): Promise<AnalysisResult> {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    // ... existing cases
    case '.custom':
      return this.analyzeCustom(filePath, content);
    default:
      return { filePath, issues: [] };
  }
}

private async analyzeCustom(filePath: string, content: string): Promise<AnalysisResult> {
  const analyzer = new MyCustomAnalyzer(this.analysisConfig);
  const contentType = ContentTypeDetector.detectFileType(filePath);
  const res = await analyzer.analyze(content, contentType);
  return { ...res, filePath };
}
```

3. **Add Tests**

```typescript
describe('MyCustomAnalyzer', () => {
  it('should detect custom issues', async () => {
    const config: AnalysisConfig = { /* ... */ };
    const analyzer = new MyCustomAnalyzer(config);
    const result = await analyzer.analyze(testCode, ContentType.UNKNOWN);
    
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
```

### Best Practices

1. **Use ContentType** — always consider content type
2. **Add diagnostics** — detailed error messages
3. **Handle exceptions** — don't crash entire analysis due to one error
4. **Document rules** — describe what and why is being checked
5. **Test edge cases** — boundary cases, incorrect syntax

## Conclusion

The CodeCheck Fixer analyzer system provides:
- Deep TypeScript/ETS code analysis
- Specialized long line analysis
- Extensible architecture
- Standardized results
- Integration with TypeScript Compiler API

