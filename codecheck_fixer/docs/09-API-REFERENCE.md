# API Reference

## Table of Contents

- [Core API](#core-api)
- [Analyzers API](#analyzers-api)
- [Formatters API](#formatters-api)
- [Libraries API](#libraries-api)
- [Types](#types)

## Core API

### Orchestrator

Main class for coordinating all analysis and formatting operations.

#### Constructor

```typescript
constructor(projectConfig: ProjectConfig)
```

**Parameters:**
- `projectConfig: ProjectConfig` — project configuration

#### Methods

##### analyzeFiles()

```typescript
async analyzeFiles(filePaths: string[]): Promise<AnalysisResult[]>
```

Analyzes list of files.

**Parameters:**
- `filePaths: string[]` — file paths

**Returns:** `Promise<AnalysisResult[]>` — analysis results

##### analyzeProject()

```typescript
async analyzeProject(options: CliOptions): Promise<AnalysisResult[]>
```

Analyzes project according to CLI options.

**Parameters:**
- `options: CliOptions` — command line options

**Returns:** `Promise<AnalysisResult[]>` — analysis results

##### analyzeFileContent()

```typescript
async analyzeFileContent(filePath: string, content: string): Promise<AnalysisResult>
```

Analyzes file content.

**Parameters:**
- `filePath: string` — file path (for type detection)
- `content: string` — file content

**Returns:** `Promise<AnalysisResult>` — analysis result

##### formatFiles()

```typescript
async formatFiles(filePaths: string[], outputDir?: string): Promise<void>
```

Formats list of files.

**Parameters:**
- `filePaths: string[]` — file paths
- `outputDir?: string` — directory to save result

##### formatFile()

```typescript
async formatFile(filePath: string, content: string): Promise<string>
```

Formats file content.

**Parameters:**
- `filePath: string` — file path (for type detection)
- `content: string` — file content

**Returns:** `Promise<string>` — formatted content

##### analyzeAndFixLineLength()

```typescript
async analyzeAndFixLineLength(
  filePath: string, 
  content: string, 
  lineLengthConfig: LineLengthConfig
): Promise<{ result: AnalysisResult; fixedContent: string | null }>
```

Analyzes and fixes long lines.

**Parameters:**
- `filePath: string` — file path
- `content: string` — file content
- `lineLengthConfig: LineLengthConfig` — configuration

**Returns:** object with analysis result and fixed content (if available)

##### generateReport()

```typescript
generateReport(results: AnalysisResult[]): string
```

Generates Markdown report.

**Parameters:**
- `results: AnalysisResult[]` — analysis results

**Returns:** `string` — Markdown report

## Analyzers API

### BaseAnalyzer

Abstract base class for all analyzers.

#### Constructor

```typescript
constructor(config: AnalysisConfig)
```

#### Methods

##### analyze() (abstract)

```typescript
abstract analyze(content: string, contentType: ContentType): Promise<AnalysisResult>
```

Analyzes file content.

##### createIssue() (protected)

```typescript
protected createIssue(
  type: IssueType,
  severity: Severity,
  message: string,
  line: number,
  column: number,
  rule: string
): Issue
```

Creates Issue object.

### TypeScriptAnalyzer

TypeScript/TSX/ETS code analyzer.

#### Constructor

```typescript
constructor(config: AnalysisConfig)
```

#### Methods

##### analyze()

```typescript
async analyze(content: string, contentType: ContentType): Promise<AnalysisResult>
```

Analyzes TypeScript code.

### LineLengthAnalyzer

Long lines analyzer with AST context.

#### Constructor

```typescript
constructor(config: AnalysisConfig, lineLengthConfig: LineLengthConfig)
```

**Parameters:**
- `config: AnalysisConfig` — general configuration
- `lineLengthConfig: LineLengthConfig` — line length configuration

#### Methods

##### analyze()

```typescript
async analyze(content: string, contentType: ContentType): Promise<AnalysisResult>
```

Analyzes code for long lines.

## Formatters API

### LineLengthFormatter

AST-based formatter for breaking long lines.

#### Constructor

```typescript
constructor(formatterConfig: FormatterConfig, lineLengthConfig: LineLengthConfig)
```

**Parameters:**
- `formatterConfig: FormatterConfig` — formatter configuration
- `lineLengthConfig: LineLengthConfig` — line length configuration

#### Methods

##### format()

```typescript
format(content: string, contentType: ContentType, providedContext?: FormattingContext): string
```

Formats code with long line breaking.

**Parameters:**
- `content: string` — source code
- `contentType: ContentType` — content type
- `providedContext?: FormattingContext` — optional context (for reuse)

**Returns:** `string` — formatted code

### TypeScriptFormatter

Basic TypeScript formatter.

#### Constructor

```typescript
constructor(config: FormatterConfig)
```

#### Methods

##### format()

```typescript
format(content: string): string
```

Formats TypeScript code.

### CppFormatter

Basic C++ formatter.

#### Constructor

```typescript
constructor(config: FormatterConfig)
```

#### Methods

##### format()

```typescript
format(content: string): string
```

Formats C++ code.

## Libraries API

### arkts_enhanced_ast

#### createEnhancedASTWithQuery()

```typescript
function createEnhancedASTWithQuery(
  sourceFile: ts.SourceFile,
  options?: BuilderOptions
): EnhancedASTWithQuery
```

Creates Enhanced AST with Query API.

**Parameters:**
- `sourceFile: ts.SourceFile` — TypeScript SourceFile
- `options?: BuilderOptions` — build options

**Returns:** `EnhancedASTWithQuery` — Enhanced AST with query API

### prettier_formatter

#### formatTypeScript()

```typescript
async function formatTypeScript(
  content: string,
  overrides?: FormatOverrides
): Promise<string>
```

Formats TypeScript via Prettier.

#### formatTsx()

```typescript
async function formatTsx(
  content: string,
  overrides?: FormatOverrides
): Promise<string>
```

Formats TSX via Prettier.

### common

#### ContentTypeDetector.detectFileType()

```typescript
static detectFileType(filePath: string): ContentType
```

Detects file type by extension.

**Parameters:**
- `filePath: string` — file path

**Returns:** `ContentType` — content type

## Types

### ProjectConfig

```typescript
interface ProjectConfig {
  description: string;
  repoPath: string;
  pathsForCheck: string[];
  pathsForCheckByType?: PathsForCheckByType;
  analysis: AnalysisConfig;
  formatting: FormatterConfig;
}
```

### AnalysisConfig

```typescript
interface AnalysisConfig {
  rules: RuleConfig[];
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  timeout: number;
}
```

### FormatterConfig

```typescript
interface FormatterConfig {
  tabSize: number;
  useTabs: boolean;
  quoteStyle: 'single' | 'double';
  semicolons: boolean;
  trailingCommas: boolean;
  maxLineLength: number;
}
```

### LineLengthConfig

```typescript
interface LineLengthConfig {
  maxLineLength: number;
  ignoreUrls: boolean;
  ignoreStrings: boolean;
  ignoreComments: boolean;
  ignoreTemplateLiterals: boolean;
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  filePath?: string;
  issues: AnalysisIssue[];
  performance?: {
    analysisTime: number;
    memoryUsage: number;
  };
  metrics?: CodeMetrics;
  timestamp?: Date;
}
```

### AnalysisIssue

```typescript
interface AnalysisIssue {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  type: 'syntax' | 'style' | 'performance' | 'best-practice' | 'security' | 'custom';
  isFixable?: boolean;
  lineLength?: number;
}
```

### ContentType (enum)

```typescript
enum ContentType {
  TS = 'typescript',
  TSX = 'typescript-jsx',
  ARKTS = 'arkts',
  CPP = 'cpp, cc, cxx, c++, hpp, h',
  UNKNOWN = 'unknown'
}
```

### FormattingContext

```typescript
interface FormattingContext {
  config: FormatterConfig;
  lineLengthConfig: LineLengthConfig;
  enhancedAST: EnhancedASTWithQuery;
  fileName: string;
  indentUnit: string;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  metrics: {
    linesChanged: number;
    linesFixed: number;
    linesIntroduced: number;
  };
}
```

## Usage Examples

### Basic Analysis

```typescript
import { Orchestrator } from 'codecheck-fixer';

const config: ProjectConfig = {
  description: 'My Project',
  repoPath: '/path/to/repo',
  pathsForCheck: ['src/'],
  analysis: { /* ... */ },
  formatting: { /* ... */ }
};

const orchestrator = new Orchestrator(config);
const results = await orchestrator.analyzeFiles(['src/file.ts']);
console.log(orchestrator.generateReport(results));
```

### Formatting with Validation

```typescript
import { LineLengthFormatter, ResultValidator } from 'codecheck-fixer';
import { ContentType } from 'codecheck-fixer/libs/common';

const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);
const formatted = formatter.format(sourceCode, ContentType.TS);

const validation = ResultValidator.validate(sourceCode, formatted, context, 'file.ts');
if (validation.isValid) {
  console.log('Formatting successful');
} else {
  console.error('Validation failed:', validation.issues);
}
```

### Enhanced AST

```typescript
import { createEnhancedASTWithQuery } from 'codecheck-fixer/libs/arkts_enhanced_ast';
import * as ts from 'typescript';

const sourceFile = ts.createSourceFile('file.ts', code, ts.ScriptTarget.Latest, true);
const enhancedAST = createEnhancedASTWithQuery(sourceFile, {
  preserveComments: true,
  preserveWhitespace: false
});

const node = enhancedAST.query.findNodeAtPosition({ offset: 100, line: 5, column: 10 });
console.log('Node type:', ts.SyntaxKind[node.kind]);
```

## Conclusion

This reference covers the main CodeCheck Fixer APIs. For more detailed information, see the source code and JSDoc comments.

