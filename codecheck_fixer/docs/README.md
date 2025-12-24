# CodeCheck Fixer - Project Documentation

## Welcome

This is the complete documentation for the **CodeCheck Fixer** project — a library and CLI tool for static analysis and automatic formatting of TypeScript and C++ code.

**Version:** 0.10.0  
**Update Date:** 2025-12-20  
**Documentation Language:** English

## Documentation Contents

### General Information

#### [00. Project Overview](00-OVERVIEW.md)
- Introduction and project goals
- Main features
- High-level architecture
- Technology stack
- Main usage scenarios
- Roadmap

**Audience:** All users and developers  
**Priority:** High

---

### Technical Documentation

#### [01. Architecture](01-ARCHITECTURE.md)
- General design principles
- Architectural layers
- Core system components
- Data flows
- Design patterns
- Component interactions

**Audience:** Developers, architects  
**Priority:** High

#### [02. Code Analyzers](02-ANALYZERS.md)
- BaseAnalyzer - base class
- TypeScriptAnalyzer - TS/TSX/ETS analysis
- LineLengthAnalyzer - long lines analysis
- CppAnalyzer - C++ stub
- Types and interfaces
- Extending analyzer system

**Audience:** Analyzer developers  
**Priority:** Medium

#### [03. Code Formatters](03-FORMATTERS.md)
- TypeScriptFormatter - basic TS formatter
- CppFormatter - basic C++ formatter
- LineLengthFormatter - AST-based formatter
- Prettier Integration
- Clang-format Integration
- Formatter comparison

**Audience:** Formatter developers  
**Priority:** Medium

#### [04. Libraries](04-LIBRARIES.md)
- arkts_enhanced_ast - enhanced AST
- arkts_formatter - AST formatter
- prettier_formatter - Prettier wrapper
- clang_formatter - clang-format wrapper
- common - common utilities
- Library dependencies

**Audience:** Library developers  
**Priority:** High

---

### User Guides

#### [05. CLI - Command Line Interface](05-CLI.md)
- Installation and execution
- Commands: analyze, format, line-length, cpp-format, fix
- Options and parameters
- Reports and logging
- CI/CD integration
- Best Practices

**Audience:** CLI users  
**Priority:** High

#### [06. Project Configuration](06-CONFIGURATION.md)
- Configuration file format
- Configuration sections
- Configuration examples
- CLI override settings
- Configuration validation
- Best Practices

**Audience:** All users  
**Priority:** High

---

### Development and Testing

#### [07. Testing and Code Quality](07-TESTING.md)
- Test infrastructure
- Running tests
- Fixtures
- Test types
- Quality metrics
- Best Practices

**Audience:** Developers, QA  
**Priority:** Medium

#### [08. Development Guide](08-DEVELOPMENT.md)
- Getting started
- Project structure
- Development workflow
- Code Style
- Adding new features
- Debugging and performance
- Versioning

**Audience:** Contributors  
**Priority:** High

#### [09. API Reference](09-API-REFERENCE.md)
- Core API (Orchestrator)
- Analyzers API
- Formatters API
- Libraries API
- Types
- Usage examples

**Audience:** API developers  
**Priority:** Medium

---

## Quick Start

### For Users

1. Read [00-OVERVIEW.md](00-OVERVIEW.md) for general understanding
2. Study [05-CLI.md](05-CLI.md) for working with command line
3. Configure project according to [06-CONFIGURATION.md](06-CONFIGURATION.md)
4. Run first analysis:
   ```bash
   ./run.sh analyze -c config.json -o report.md
   ```

### For Developers

1. Read [01-ARCHITECTURE.md](01-ARCHITECTURE.md) to understand architecture
2. Study [08-DEVELOPMENT.md](08-DEVELOPMENT.md) to setup environment
3. Familiarize yourself with [02-ANALYZERS.md](02-ANALYZERS.md), [03-FORMATTERS.md](03-FORMATTERS.md), [04-LIBRARIES.md](04-LIBRARIES.md)
4. Write your first test according to [07-TESTING.md](07-TESTING.md)

## Project Structure

```
codecheck_fixer/
├── src/                          # Source code
│   ├── core/                     # Core (Orchestrator, Coordinator)
│   ├── analyzers/                # Analyzers
│   ├── formatters/               # Formatters
│   ├── cli/                      # CLI
│   ├── reporting/                # Reports
│   └── types/                    # Types
├── libs/                         # Libraries
│   ├── arkts_enhanced_ast/       # Enhanced AST
│   ├── arkts_formatter/          # AST formatter
│   ├── prettier_formatter/       # Prettier wrapper
│   ├── clang_formatter/          # Clang-format wrapper
│   └── common/                   # Common utilities
├── tests/                        # Tests
├── docs/                         # Documentation (old)
├── .tmp/docs/                    # Documentation (current)
├── config.json                   # Configuration
├── package.json                  # NPM package
└── README.md                     # Main README
```

## Key Concepts

### Code Analysis
- **Static analysis** via TypeScript Compiler API
- **AST-contextual analysis** for accuracy
- **Configurable rules** via configuration

### Formatting
- **AST-based** — semantic preservation
- **Result validation** — equivalence checking
- **Fallback strategies** — graceful degradation

### Architecture
- **Modularity** — independent components
- **Extensibility** — Strategy pattern
- **Reliability** — rollback on errors

## Glossary

- **AST** — Abstract Syntax Tree
- **Enhanced AST** — extended AST with coordinates and tokens
- **Issue** — problem detected by analyzer
- **Orchestrator** — central operations coordinator
- **Fixer** — component for automatic fixes
- **Formatter** — component for code formatting
- **ContentType** — content type (TS/TSX/ETS/CPP)
- **Semantic equivalence** — semantic equivalence

## Useful Links

- **Repository:** Part of idlize project
- **TypeScript Compiler API:** https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- **Prettier:** https://prettier.io/
- **Jest:** https://jestjs.io/
- **Conventional Commits:** https://www.conventionalcommits.org/

## Questions and Support

For questions and suggestions:
1. Review the documentation
2. Check existing Issues
3. Create new Issue with detailed description

## Contributing

Contributions to the project are welcome! See [08-DEVELOPMENT.md](08-DEVELOPMENT.md) for details.

## License

MIT / Apache 2.0 (see LICENSE file)

---

**CodeCheck Fixer Development Team**  
Part of idlize project for HarmonyOS

