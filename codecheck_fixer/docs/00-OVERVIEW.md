# CodeCheck Fixer - Project Overview

## Documentation Version
Project Version: 0.10.0

## Introduction

**CodeCheck Fixer** is a comprehensive library and CLI tool for static analysis and automatic formatting of TypeScript and C++ code. The project is designed to ensure codebase compliance with CI/CD standards and automate code quality checking processes.

## Project Goals

The main goal of the project is to provide a unified solution for:
- **Static analysis** of TypeScript/ETS and C++ code
- **Automatic formatting** with semantic equivalence preservation
- **Detection and fixing** of coding standard violations
- **CI/CD integration** for automated quality checks
- **Ensuring uniformity** of code style in large projects

## Key Features

### 1. Static Analysis
- Syntax error analysis via TypeScript Compiler API
- Type checking and potential issue detection
- Style violation and best practices detection
- Specialized long line analysis with AST context

### 2. Automatic Formatting
- Intelligent formatting of TypeScript/ETS files
- C++ formatting through clang-format integration
- Automatic long line fixes with semantic preservation
- Support for various coding styles through configuration

### 3. CLI and API
- Powerful command-line interface
- Programmatic API for integration into other tools
- Flexible configuration via JSON files
- Detailed analysis result reports

### 4. Multi-Language Support
- **TypeScript** (.ts) — full support
- **TSX** (.tsx) — full JSX syntax support
- **ArkTS/ETS** (.ets) — specialized HarmonyOS support
- **C++** (.cpp, .hpp, .h) — formatting via clang-format

## Project Architecture

### Directory Structure

```
codecheck_fixer/
├── src/                          # Main application source code
│   ├── core/                     # System core
│   │   ├── orchestrator.ts       # All operations orchestrator
│   │   ├── analyzer.ts           # Base analyzer class
│   │   └── coordinator.ts        # Fix coordinator
│   ├── analyzers/                # Code analyzers
│   │   ├── typescript-analyzer.ts
│   │   ├── cpp-analyzer.ts
│   │   └── line-length-analyzer.ts
│   ├── formatters/               # Code formatters
│   │   ├── typescript-formatter.ts
│   │   └── cpp-formatter.ts
│   ├── cli/                      # Command-line interface
│   │   └── index.ts              # CLI entry point
│   ├── reporting/                # Report generation
│   │   └── summary.ts
│   └── types/                    # TypeScript types
│       └── index.ts
├── libs/                         # Independent libraries
│   ├── arkts_enhanced_ast/       # Enhanced AST with tokens
│   ├── arkts_formatter/          # AST-based formatter for ArkTS
│   ├── prettier_formatter/       # Prettier wrapper
│   ├── clang_formatter/          # clang-format wrapper
│   └── common/                   # Common utilities
├── tests/                        # Integration tests
├── tools/                        # Helper tools
├── scripts/                      # Automation scripts
├── docs/                         # Technical documentation
└── config.json                   # Default configuration
```

### Key Components

#### 1. Orchestrator
Central component coordinating all operations:
- Configuration loading and validation
- File discovery and filtering
- Analyzer and formatter execution
- Report generation

#### 2. Analyzers
Specialized components for code analysis:
- **TypeScriptAnalyzer** — TS/TSX/ETS analysis via Compiler API
- **CppAnalyzer** — stub for future C++ analysis
- **LineLengthAnalyzer** — deep long line analysis with AST

#### 3. Formatters
Components for code formatting:
- **TypeScriptFormatter** — basic TS formatting
- **CppFormatter** — basic C++ formatting
- **LineLengthFormatter** — intelligent long line fixing

#### 4. Libraries
Independent modules with specific functionality:
- **arkts_enhanced_ast** — building enhanced AST with coordinates
- **arkts_formatter** — AST-based formatting with validation
- **prettier_formatter** — alternative formatting via Prettier
- **common** — common types and utilities

## Technology Stack

### Core Technologies
- **TypeScript 5.3+** — main development language
- **Node.js 16+** — execution platform
- **TypeScript Compiler API** — TypeScript parsing and analysis
- **Jest** — testing framework

### Dependencies
- **commander** — CLI interface building
- **chalk** — colored terminal output
- **ora** — progress indicators
- **glob** — pattern-based file search
- **prettier** — alternative formatter (optional)

### Development Tools
- **ESLint** — code linting
- **ts-jest** — TypeScript testing
- **clang-format** — C++ formatting (external)

## Main Usage Scenarios

### 1. Project Analysis
```bash
./run.sh analyze -c config.json -o report.md --verbose
```
Performs full project analysis and generates a report.

### 2. Code Formatting
```bash
./run.sh format -c config.json -o ./out/fixed --verbose
```
Formats files according to configuration.

### 3. Long Line Check
```bash
./run.sh line-length -c config.json --dry-run --verbose
```
Analyzes long lines without applying changes.

### 4. Automatic Fixing
```bash
./run.sh line-length --fix -c config.json -o ./out/fixed --verbose
```
Automatically fixes long lines with semantic preservation.

### 5. C++ Formatting
```bash
./run.sh cpp-format -c config.json -o ./out/fixed --verbose
```
Formats C++ files via clang-format.

## Integration into idlize Project

CodeCheck Fixer is integrated into the larger **idlize** project (interface generator for HarmonyOS) and performs the following functions:

1. **Generated code validation** — checking TypeScript/ETS files after generation
2. **Automatic formatting** — bringing generated code to project standards
3. **Quality assurance** — checking compliance with style rules
4. **CI/CD integration** — automatic checks in pipelines

## Project Configuration

The project uses JSON configuration with strict format:

```json
{
  "description": "Project description",
  "repo_path": "/absolute/path/to/repo",
  "paths_for_check": {
    "ts": ["src/", "lib/"],
    "ets": ["frameworks/arkui/generated"],
    "cpp": ["native/src/"]
  },
  "analysis": {
    "maxFileSize": 1048576,
    "excludePatterns": ["node_modules/**", "dist/**"]
  },
  "formatting": {
    "tabSize": 4,
    "useTabs": false,
    "maxLineLength": 120
  }
}
```

## Design Principles

### 1. Modularity
- Clear separation into core, analyzers, formatters, and libraries
- Independent modules with minimal coupling
- Ability to use libraries separately

### 2. Extensibility
- Strategy pattern for various formatting strategies
- Base classes for creating new analyzers
- Plugin architecture for adding functionality

### 3. Reliability
- Formatting result validation
- Change rollback on errors
- Code semantic equivalence preservation

### 4. Performance
- Single-pass formatting
- AST analysis result caching
- Parallel file processing (planned)

### 5. Usability
- Intuitive CLI interface
- Detailed error messages
- Flexible configuration
- Built-in help

## Code Quality

### Static Typing
- Strict TypeScript mode (strict: true)
- Full type coverage
- Use of enums and union types

### Testing
- Unit tests for libraries
- Integration tests for CLI
- Fixtures for regression testing
- Semantic equivalence validation

### Documentation
- JSDoc comments for public APIs
- README for each library
- Technical architecture documentation
- Usage examples

## Limitations and Known Issues

### Current Limitations
1. **C++ analysis** — full analyzer not yet implemented, using clang-format
2. **Template literals** — not formatted to preserve semantics
3. **Comments** — handled conservatively
4. **Large files** — file size limit (1MB by default)

### Known Issues
1. Some complex expressions may not be automatically fixable
2. Long identifiers with large indentation cannot be split
3. Formatting may conflict with some IDE plugins

## Roadmap

### Near-term Plans
- [ ] Full C++ analyzer implementation
- [ ] Performance optimization for large files
- [ ] AST result caching
- [ ] Parallel file processing
- [ ] Eliminate multi-pass processing in some places

### Long-term Plans
- [ ] Language Server Protocol (LSP) integration
- [ ] Custom formatting rules support
- [ ] Advanced codebase analytics

## Related Documentation

- [01-ARCHITECTURE.md](01-ARCHITECTURE.md) — Detailed architecture
- [02-ANALYZERS.md](02-ANALYZERS.md) — Analyzers documentation
- [03-FORMATTERS.md](03-FORMATTERS.md) — Formatters documentation
- [04-LIBRARIES.md](04-LIBRARIES.md) — Libraries documentation
- [05-CLI.md](05-CLI.md) — CLI guide
- [06-CONFIGURATION.md](06-CONFIGURATION.md) — Project configuration
- [07-TESTING.md](07-TESTING.md) — Testing
- [08-DEVELOPMENT.md](08-DEVELOPMENT.md) — Developer guide
- [09-API-REFERENCE.md](09-API-REFERENCE.md) — API reference
