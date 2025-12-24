# CodeCheck Fixer Architecture

## Table of Contents
- [General Principles](#general-principles)
- [Architectural Layers](#architectural-layers)
- [System Core](#system-core)
- [Data Flows](#data-flows)
- [Design Patterns](#design-patterns)
- [Component Interactions](#component-interactions)

## General Principles

### Architectural Approach

CodeCheck Fixer is built on the following principles:

1. **Modularity** — each component performs a single well-defined function
2. **Loose Coupling** — minimal dependencies between modules
3. **High Cohesion** — logically related code resides in a single module
4. **Extensibility** — ease of adding new features
5. **Dependency Inversion** — dependency on abstractions, not concrete implementations

### Key Architectural Decisions

#### 1. Multi-layered Architecture
```
┌─────────────────────────────────────┐
│         CLI Layer (cli/)            │  ← User Interface
├─────────────────────────────────────┤
│      Core Layer (core/)             │  ← Business Logic
├─────────────────────────────────────┤
│  Analyzers & Formatters Layer       │  ← Code Processing
├─────────────────────────────────────┤
│      Libraries Layer (libs/)        │  ← Low-level Logic
├─────────────────────────────────────┤
│   TypeScript Compiler API / Tools   │  ← External Dependencies
└─────────────────────────────────────┘
```

#### 2. Strategy Pattern for Formatting
Different formatting strategies are applied depending on code context.

#### 3. Template Method Pattern in Analyzers
Base class defines the general analysis algorithm, concrete analyzers implement details.

#### 4. Coordinator Pattern for Complex Operations
Coordinator manages the sequence of actions during file fixing.

## Architectural Layers

### Layer 1: CLI (Command-Line Interface)

**Location:** `src/cli/`

**Purpose:** Providing command-line interface for the user

**Components:**
- `index.ts` — CLI entry point, command processing

**Responsibilities:**
- Parsing command-line arguments
- Loading and validating configuration
- Orchestrator initialization
- Formatted output of results
- User-level error handling

**Commands:**
- `analyze` — static analysis
- `format` — code formatting
- `line-length` — checking/fixing long lines
- `cpp-format` — C++ formatting via clang-format
- `fix` — comprehensive fixing (synonym for line-length --fix)

### Layer 2: Core (System Core)

**Location:** `src/core/`

**Purpose:** Central business logic, coordination of all operations

**Components:**

#### Orchestrator

**File:** `orchestrator.ts`

**Role:** Main coordinator for all analysis and formatting operations

**Main Methods:**
```typescript
class Orchestrator {
  // File analysis
  async analyzeFiles(filePaths: string[]): Promise<AnalysisResult[]>
  async analyzeProject(options: CliOptions): Promise<AnalysisResult[]>
  async analyzeFileContent(filePath: string, content: string): Promise<AnalysisResult>
  
  // File formatting
  async formatFiles(filePaths: string[], outputDir?: string): Promise<void>
  async formatFile(filePath: string, content: string): Promise<string>
  
  // Specialized operations
  async analyzeAndFixLineLength(filePath: string, content: string, config: LineLengthConfig)
  async analyzeLineLength(filePath: string, content: string, config: any): Promise<AnalysisResult>
  async formatLineLength(filePath: string, content: string, config: any): Promise<string>
  
  // Report generation
  generateReport(results: AnalysisResult[]): string
}
```

**Operating Logic:**
1. Receives requests from CLI
2. Determines file types by extension
3. Selects appropriate analyzer/formatter
4. Coordinates processing
5. Aggregates results
6. Generates reports

**Features:**
- Uses formatter priority strategy: Prettier → ArkTS formatter (fallback)
- Handles exceptions and logs errors
- Filters files by size and excludePatterns
- Supports various output modes (verbose, quiet)

#### BaseAnalyzer (Base Analyzer)
**File:** `analyzer.ts`

**Role:** Abstract base class for all analyzers

**Structure:**
```typescript
abstract class BaseAnalyzer {
  protected config: AnalysisConfig;
  
  constructor(config: AnalysisConfig)
  
  // Abstract method for implementation in descendants
  abstract analyze(content: string, contentType: ContentType): Promise<AnalysisResult>
  
  // Helper methods
  protected createIssue(type, severity, message, line, column, rule): Issue
  protected calculateMetrics(content: string): CodeMetrics
}
```

**Provides:**
- Unified interface for all analyzers
- Base methods for creating Issues
- Code metrics calculation (stubs for future implementations)

#### FixCoordinator (Fix Coordinator)
**File:** `coordinator.ts`

**Role:** Coordination of file fixing process with progress and logging

**Main Methods:**
```typescript
class FixCoordinator {
  constructor(orchestrator: Orchestrator, filePaths: string[], options: FixOptions)
  
  async run(): Promise<void>  // Main processing method
  
  // Getting results for external reports
  getAnalysisResults(): AnalysisResult[]
  getChangeLog(): ChangeLogEntry[]
}
```

**Functions:**
- Sequential file processing with progress bar
- Caching long line counts for quick preview
- Applying fixes and saving to output directory
- Collecting "before/after" metrics for reports
- Support for user interruption (Ctrl+C)

**Operating Algorithm:**
1. Filter files by extension (.ts, .ets)
2. Count long lines (fast pass)
3. Analysis and fixing via Orchestrator
4. Apply changes (if --fix)
5. Collect statistics for report
6. Real-time progress output

### Layer 3: Analyzers & Formatters (Analysis and Formatting)

**Location:** `src/analyzers/`, `src/formatters/`

**Purpose:** Specialized components for analyzing and formatting various languages

#### Analyzers (src/analyzers/)

**TypeScriptAnalyzer** (`typescript-analyzer.ts`)
- Syntax and type analysis via TypeScript Compiler API
- Detection of `any` usage
- Checking naming conventions
- Compilation error diagnostics

**CppAnalyzer** (`cpp-analyzer.ts`)
- Stub for future implementation
- Returns empty problem list

**LineLengthAnalyzer** (`line-length-analyzer.ts`)
- Deep AST analysis of long lines
- Determining problem fixability
- Context consideration (comments, URLs, strings)
- Diagnostics of non-fixability reasons

#### Formatters (src/formatters/)

**TypeScriptFormatter** (`typescript-formatter.ts`)
- Basic TypeScript formatting
- Indentation normalization
- Quote and semicolon formatting
- Trailing commas handling

**CppFormatter** (`cpp-formatter.ts`)
- Basic indentation normalization
- Trailing whitespace removal
- Operator spacing normalization

### Layer 4: Libraries

**Location:** `libs/`

**Purpose:** Independent reusable modules with clearly defined functionality

#### arkts_enhanced_ast
**Purpose:** Building enhanced AST with coordinates and tokens

**Key Components:**
- `EnhancedASTBuilder` — building Enhanced AST
- `EnhancedASTQuery` — queries to AST by coordinates
- `SyntaxTokenizer` — tokenization with position preservation
- `SyntacticSeparators` — determining semantic separators

**Export:**
```typescript
function createEnhancedASTWithQuery(
  sourceFile: ts.SourceFile, 
  options?: BuilderOptions
): EnhancedASTWithQuery
```

#### arkts_formatter
**Purpose:** AST-based long line formatting

**Key Components:**
- `LineLengthFormatter` — main formatter class
- `EnhancedASTFormattingStrategy` — AST formatting strategy
- `TransformationManager` — managing change application
- `ResultValidator` — result validation
- `LocalRegionValidator` — local change validation

**Export:**
```typescript
class LineLengthFormatter {
  format(content: string, filePathOrType: string | ContentType): string
}
```

#### prettier_formatter
**Purpose:** Prettier wrapper for TS/TSX formatting

**Key Components:**
- `formatTypeScript()` — formatting .ts files
- `formatTsx()` — formatting .tsx files
- `formatSourceCode()` — universal function

**Features:**
- Uses prettier/standalone
- StrictParsing support for strict error control
- onFormattingError callback for error handling

#### clang_formatter
**Purpose:** clang-format wrapper for C++

**Key Components:**
- `formatCpp()` — C++ formatting via external process

#### common
**Purpose:** Common types and utilities

**Components:**
- `ContentType` enum — content types (TS/TSX/ARKTS/CPP)
- `ContentTypeDetector` — type detection by file extension
- `cancellation.ts` — cancellation token for interrupting operations

### Layer 5: Reporting

**Location:** `src/reporting/`

**Purpose:** Report and summary generation

**Components:**
- `summary.ts` — markdown report generation

**Functions:**
```typescript
function generateSummaryMd(data: SummaryData): string
function writeSummary(dir: string, markdown: string, filename?: string): void
```

**Report Format:**
- General processing statistics
- Before/after metrics for TS/ETS
- Before/after metrics for C++
- Remaining issues list (sample)

## Data Flows

### Code Analysis Flow

```
┌─────────┐
│   CLI   │ analyze --repo /repo --ts src/ --ets gen/ -c config.json
└────┬────┘
     │
     ↓
┌────────────────┐
│  Orchestrator  │ loads configuration, merges CLI paths
└────┬───────────┘
     │
     ├─→ determines files by patterns (glob) from CLI/config paths
     │
     ├─→ filters by type and size
     │
     ↓
┌─────────────────┐
│ TypeScriptAnalyzer │ for .ts/.tsx/.ets
│  or CppAnalyzer    │ for .cpp/.hpp
└────┬────────────┘
     │
     ├─→ creates SourceFile (TypeScript Compiler API)
     │
     ├─→ gets diagnostics (syntax/type errors)
     │
     ├─→ traverses AST (style checks)
     │
     ↓
┌────────────────┐
│ AnalysisResult │ list of Issues
└────┬───────────┘
     │
     ↓
┌───────────────┐
│ Report.md     │ report in Markdown
└───────────────┘
```

### Formatting Flow (format)

```
┌─────────┐
│   CLI   │ format --repo /repo --ts src/ --ets gen/ -c config.json -o ./out/fixed
└────┬────┘
     │
     ↓
┌────────────────┐
│  Orchestrator  │
└────┬───────────┘
     │
     ├─→ collects file list from CLI/config paths
     │
     ├─→ for each file:
     │
     ↓
┌──────────────────────┐
│  formatFile()        │
└────┬─────────────────┘
     │
     ├─→ determines extension (.ts/.tsx/.ets/.cpp)
     │
     ├─→ for .ts/.tsx: tries Prettier
     │     ├─→ success → returns result
     │     └─→ error → fallback to ArkTS formatter
     │
     ├─→ for .ets: uses TypeScriptFormatter (basic)
     │
     └─→ for .cpp: uses CppFormatter (basic)
     
     ↓
┌─────────────────┐
│ Saving          │ to outputDir with structure preservation
└─────────────────┘
```

### Long Line Fixing Flow (line-length --fix)

```
┌─────────┐
│   CLI   │ line-length --fix --repo /repo --ts src/ --ets gen/ -c config.json
└────┬────┘
     │
     ↓
┌─────────────────┐
│  Orchestrator   │
└────┬────────────┘
     │
     ├─→ creates FixCoordinator
     │
     ↓
┌──────────────────┐
│ FixCoordinator   │
└────┬─────────────┘
     │
     ├─→ for each file:
     │   │
     │   ├─→ prepareFileForProcessing()
     │   │   └─→ quick long line count (for UI)
     │   │
     │   ├─→ orchestrator.analyzeAndFixLineLength()
     │   │   │
     │   │   ├─→ LineLengthAnalyzer.analyze()
     │   │   │   └─→ creates EnhancedAST
     │   │   │       └─→ analyzes each line with AST context
     │   │   │
     │   │   └─→ LineLengthFormatter.format()
     │   │       └─→ applies formatting strategy
     │   │           └─→ validates result (ResultValidator)
     │   │
     │   └─→ applyFixes() — saving to outputDir
     │
     ↓
┌──────────────────┐
│ generateSummaryMd│ SUMMARY.md generation
└──────────────────┘
```

### C++ Formatting Flow (cpp-format)

```
┌─────────┐
│   CLI   │ cpp-format --repo /repo --cpp native/ -c config.json
└────┬────┘
     │
     ↓
┌────────────────┐
│  glob C++ files│ by CLI paths or config paths_for_check.cpp
└────┬───────────┘
     │
     ↓
┌──────────────────────────┐
│ for each .cpp/.hpp:      │
│                          │
│ spawnSync('clang-format')│
│   --style=file           │
│   -assume-filename=...   │
└────┬─────────────────────┘
     │
     ↓
┌────────────────┐
│ Saving         │ to outputDir
└────────────────┘
```

## Design Patterns

### 1. Strategy

**Application:** Code formatting

**Implementation:**
```typescript
interface FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;
  getPriority(): number;
}

class EnhancedASTFormattingStrategy implements FormattingStrategy {
  // AST-based strategy implementation
}
```

**Advantages:**
- Easy to add new formatting strategies
- Strategies can be combined and sorted by priority
- Isolation of formatting algorithms

### 2. Template Method

**Application:** Base class for analyzers

**Implementation:**
```typescript
abstract class BaseAnalyzer {
  // Common algorithm
  async analyzeProject(files: string[]): Promise<AnalysisResult[]> {
    const results = [];
    for (const file of files) {
      const content = readFile(file);
      const result = await this.analyze(content);  // ← abstract method
      results.push(result);
    }
    return results;
  }
  
  // Abstract method for concrete analyzers
  abstract analyze(content: string): Promise<AnalysisResult>;
}
```

**Advantages:**
- Reuse of common logic
- Clear contract for descendants
- Simplification of adding new analyzers

### 3. Facade

**Application:** Orchestrator as facade for the entire system

**Implementation:**
```typescript
class Orchestrator {
  // Hides complexity of analyzer, formatter, coordinator interactions
  async analyzeProject(options: CliOptions): Promise<AnalysisResult[]> {
    // Internal complexity is hidden
  }
}
```

**Advantages:**
- Simplified interface for CLI
- Encapsulation of complex logic
- Single point of access to functionality

### 4. Coordinator

**Application:** FixCoordinator for complex operations

**Implementation:**
```typescript
class FixCoordinator {
  // Coordinates sequence of operations:
  // 1. File preparation
  // 2. Analysis
  // 3. Applying fixes
  // 4. Statistics collection
  // 5. Report generation
}
```

**Advantages:**
- Managing complex scenarios
- Separation of responsibilities
- Convenient testing

### 5. Builder

**Application:** EnhancedASTBuilder

**Implementation:**
```typescript
class EnhancedASTBuilder {
  build(sourceFile: ts.SourceFile): EnhancedAST {
    // Step-by-step Enhanced AST construction
    // 1. Tree traversal
    // 2. Adding coordinates
    // 3. Tokenization
    // 4. Creating indices
  }
}
```

**Advantages:**
- Step-by-step construction of complex object
- Isolation of construction logic
- Component reuse

## Component Interactions

### Dependency Diagram

```
┌──────────────────────────────────────────────────┐
│                    CLI Layer                     │
│                  (src/cli/)                      │
└───────────────────┬──────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────┐
│                 Core Layer                       │
│                (src/core/)                       │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐│
│  │Orchestrator│  │Analyzer  │  │FixCoordinator││
│  └────────────┘  └──────────┘  └──────────────┘│
└─────┬─────────────────┬──────────────┬──────────┘
      │                 │              │
      ↓                 ↓              ↓
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│  Analyzers   │  │  Formatters  │  │  Reporting  │
│(src/analyzers│  │(src/formatters│  │(src/reporting│
└──────┬───────┘  └──────┬───────┘  └─────────────┘
       │                 │
       ↓                 ↓
┌──────────────────────────────────────────────────┐
│              Libraries Layer                     │
│                 (libs/)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │enhanced │  │formatter│  │prettier │         │
│  │  ast    │  │  arkts  │  │formatter│         │
│  └─────────┘  └─────────┘  └─────────┘         │
└──────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│         External Dependencies                    │
│  TypeScript Compiler API, clang-format, etc.    │
└──────────────────────────────────────────────────┘
```

### Interaction Rules

1. **CLI depends only on Core** — direct access only to Orchestrator
2. **Core coordinates Analyzers and Formatters** — but doesn't depend on concrete implementations
3. **Analyzers and Formatters use Libraries** — for low-level logic
4. **Libraries are independent of each other** — can be used separately
5. **No circular dependencies** — strict hierarchy

## Scalability and Extensibility

### Adding a New Analyzer

1. Create a class inheriting from `BaseAnalyzer`
2. Implement the `analyze()` method
3. Register in `Orchestrator.analyzeFileContent()`

### Adding a New Formatter

1. Create a class with a `format()` method
2. Add formatter selection in `Orchestrator.formatFile()`

### Adding a New CLI Command

1. Add `.command()` in `src/cli/index.ts`
2. Implement `.action()` handler
3. Use existing Orchestrator methods

## Security and Reliability

### Input Validation
- Checking file existence
- JSON configuration validation
- File extension verification
- File size limitation

### Error Handling
- Try-catch blocks at CLI level
- Error logging to console
- Graceful degradation (fallback to basic formatter)
- Rollback of changes on validation errors

### Code Corruption Protection
- Syntax validation after formatting
- Semantic equivalence checking
- Dry-run mode by default
- Saving to separate directory (not in-place)

## Performance

### Optimizations
- Single-pass formatting without AST recreation
- Long line count caching
- Lazy Enhanced AST creation (only when needed)
- Using TypeScript Compiler API without full type checking

### Bottlenecks
- AST construction for large files
- Result validation (re-parsing)
- Traversing all project files

### Optimization Plans
- Parallel file processing (Worker Threads)
- AST result caching between runs
- Incremental analysis (only changed files)

## Conclusion

CodeCheck Fixer architecture ensures:
- Modularity and extensibility
- Clear separation of responsibilities
- Component reuse
- Testing simplicity
- Reliability and fault tolerance

