# Development Guide

## Introduction

This guide is intended for developers who wish to contribute to the CodeCheck Fixer project or use its components in their own projects.

## Getting Started

### Cloning the Repository

```bash
git clone <repository-url>
cd idlize/codecheck_fixer
```

### Installing Dependencies

```bash
npm install
```

### Building the Project

```bash
npm run build
```

The compilation result is placed in `dist/`.

### Running in Development Mode

```bash
npm run dev
```

Runs the TypeScript compiler in watch mode.

## Project Structure

See [01-ARCHITECTURE.md](01-ARCHITECTURE.md) for a detailed architecture description.

**Quick Overview:**

```
codecheck_fixer/
├── src/              # Application source code
│   ├── core/         # Core (Orchestrator, Analyzer, Coordinator)
│   ├── analyzers/    # Code analyzers
│   ├── formatters/   # Code formatters
│   ├── cli/          # Command interface
│   ├── reporting/    # Report generation
│   └── types/        # TypeScript types
├── libs/             # Independent libraries
│   ├── arkts_enhanced_ast/
│   ├── arkts_formatter/
│   ├── prettier_formatter/
│   ├── clang_formatter/
│   └── common/
├── tests/            # Tests
├── docs/             # Documentation
├── tools/            # Helper tools
└── scripts/          # Automation scripts
```

## Development Workflow

### 1. Create New Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Development

Make changes following [Code Style](#code-style).

### 3. Run Tests

```bash
npm test
npm run test:unit
```

### 4. Check Linting

```bash
npm run lint
```

### 5. Format Code

```bash
npm run format
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/).

### 7. Push and Create Pull Request

```bash
git push origin feature/my-new-feature
```

Create a Pull Request in the repository.

## Code Style

### TypeScript

- **Strict mode** — always enabled
- **Naming:**
  - Classes/Interfaces: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private fields: `_camelCase` (optional)
- **Indentation:** 2 or 4 spaces (according to project)
- **Quotes:** `'single'` (preferred)
- **Semicolons:** required

### Examples

**Recommended style:**

```typescript
export class MyAnalyzer extends BaseAnalyzer {
  private readonly config: AnalysisConfig;
  
  constructor(config: AnalysisConfig) {
    super(config);
    this.config = config;
  }
  
  async analyze(content: string, contentType: ContentType): Promise<AnalysisResult> {
    const issues: AnalysisIssue[] = [];
    // ...
    return { issues };
  }
}
```

**Not recommended:**

```typescript
class myAnalyzer {
  config
  
  constructor(c) {
    this.config = c
  }
  
  analyze(content) {
    var issues = []
    return issues
  }
}
```

### Comments

- **JSDoc** for public APIs
- **Inline comments** for complex logic
- **TODO comments** with author name

```typescript
/**
 * Analyzes file content for long lines.
 * 
 * @param content - Source code of the file
 * @param contentType - Content type (TS/TSX/ETS)
 * @returns Analysis result with list of issues
 */
async analyze(content: string, contentType: ContentType): Promise<AnalysisResult> {
  // TODO(username): Optimize for large files
  const issues: AnalysisIssue[] = [];
  // ...
}
```

## Adding New Features

### Adding a New Analyzer

1. **Create file** in `src/analyzers/`

```typescript
// src/analyzers/my-new-analyzer.ts
import { BaseAnalyzer } from '../core/analyzer';
import { ContentType } from '../../libs/common/common-types';
import { AnalysisResult, AnalysisIssue, AnalysisConfig } from '../types';

export class MyNewAnalyzer extends BaseAnalyzer {
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

2. **Export** in `src/index.ts`

```typescript
export { MyNewAnalyzer } from './analyzers/my-new-analyzer';
```

3. **Register** in `Orchestrator`

```typescript
// src/core/orchestrator.ts
import { MyNewAnalyzer } from '../analyzers/my-new-analyzer';

// In analyzeFileContent() method
case '.myext':
  return this.analyzeMyNew(filePath, content);

private async analyzeMyNew(filePath: string, content: string): Promise<AnalysisResult> {
  const analyzer = new MyNewAnalyzer(this.analysisConfig);
  const contentType = ContentTypeDetector.detectFileType(filePath);
  const res = await analyzer.analyze(content, contentType);
  return { ...res, filePath };
}
```

4. **Add tests**

```typescript
// src/analyzers/__tests__/my-new-analyzer.test.ts
import { MyNewAnalyzer } from '../my-new-analyzer';

describe('MyNewAnalyzer', () => {
  it('should detect issues', async () => {
    const config: AnalysisConfig = { /* ... */ };
    const analyzer = new MyNewAnalyzer(config);
    const result = await analyzer.analyze(testCode, ContentType.UNKNOWN);
    
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
```

### Adding a New Library

1. **Create directory** in `libs/`

```
libs/my_new_lib/
├── index.ts
├── README.md
├── tests/
│   └── my-lib.test.ts
└── <source files>
```

2. **Implement functionality**

```typescript
// libs/my_new_lib/index.ts
export class MyNewLib {
  // ...
}
```

3. **Add README**

```markdown
# my_new_lib

Library description...

## API

...

## Usage

...
```

4. **Add tests**

```typescript
// libs/my_new_lib/tests/my-lib.test.ts
import { MyNewLib } from '../index';

describe('MyNewLib', () => {
  it('should work correctly', () => {
    // ...
  });
});
```

5. **Update jest.config.cjs**

```javascript
roots: [
  // ...
  '<rootDir>/libs/my_new_lib/tests'
]
```

### Adding a New CLI Command

1. **Add command** in `src/cli/index.ts`

```typescript
program
  .command('my-command')
  .description('Description of my command')
  .option('-c, --config <path>', 'Path to config')
  .option('--my-option', 'My custom option')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config);
      const orchestrator = new Orchestrator(config);
      
      // Your logic
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });
```

2. **Update documentation** `05-CLI.md`

## Debugging

### VS Code

**launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/dist/src/cli/index.js",
      "args": ["analyze", "-c", "config.json"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

Use `console.log` / `console.error` for debugging:

```typescript
if (options.verbose) {
  console.log('Processing file:', filePath);
  console.log('Issues found:', issues.length);
}
```

### Breakpoints

Use `debugger;` statement:

```typescript
function complexLogic() {
  debugger; // Will stop here when debugging
  // ...
}
```

## Performance

### Profiling

```bash
node --prof dist/src/cli/index.js analyze -c config.json
node --prof-process isolate-*.log > profile.txt
```

### Time Measurement

```typescript
console.time('operation');
// Your code
console.timeEnd('operation');
```

### Optimization

- **Avoid unnecessary AST builds** — reuse context
- **Cache results** — where possible
- **Use streams** for large files
- **Lazy loading** — load libraries on demand

## Versioning

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x) — breaking changes
- **MINOR** (x.1.x) — new functionality (backward compatible)
- **PATCH** (x.x.1) — bug fixes

### Updating Version

```bash
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

### Changelog

Maintain `CHANGELOG.md`:

```markdown
# Changelog

## [1.1.0] - 2025-12-10

### Added
- New analyzer for ...
- Support for ...

### Fixed
- Bug in ...

### Changed
- Improved performance of ...
```

## Documentation

### Updating Documentation

When adding new features, update the relevant documents:

- **00-OVERVIEW.md** — general overview
- **01-ARCHITECTURE.md** — architectural changes
- **02-ANALYZERS.md** — new analyzers
- **03-FORMATTERS.md** — new formatters
- **04-LIBRARIES.md** — new libraries
- **05-CLI.md** — new CLI commands
- **09-API-REFERENCE.md** — API changes

### Generate API Documentation (optional)

```bash
npm install --save-dev typedoc
npx typedoc --out docs/api src/index.ts
```

## Best Practices

### 1. Follow SOLID Principles

- **Single Responsibility** — one class = one responsibility
- **Open/Closed** — open for extension, closed for modification
- **Liskov Substitution** — subclasses replace parents
- **Interface Segregation** — many specialized interfaces
- **Dependency Inversion** — depend on abstractions

### 2. Use TypeScript Types

```typescript
// Not recommended
function process(data: any) {
  return data.value;
}

// Recommended
interface Data {
  value: string;
}

function process(data: Data): string {
  return data.value;
}
```

### 3. Handle Errors

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to perform operation');
}
```

### 4. Write Tests

Every new feature should have tests.

### 5. Document API

Public methods and classes should have JSDoc comments.

### 6. Use Path Aliases

```typescript
// Not recommended
import { BaseAnalyzer } from '../../../core/analyzer';

// Recommended
import { BaseAnalyzer } from '@/core/analyzer';
```

### 7. Avoid Circular Dependencies

Use dependency inversion or dependency injection.

## Useful Commands

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run CLI
npm start -- analyze -c config.json

# Tests
npm test
npm run test:unit

# Linting
npm run lint

# Formatting
npm run format

# Clean
npm run clean

# Full rebuild
npm run clean && npm run build
```

## Troubleshooting

### TypeScript Compilation Errors

```bash
# Check tsconfig.json
npx tsc --noEmit

# Clean and rebuild
npm run clean && npm run build
```

### Dependency Issues

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Path Conflicts

Check `tsconfig.json` → `paths` and `jest.config.cjs` → `moduleNameMapper`.

## Contributing

### Process

1. Fork the repository
2. Create feature branch
3. Commit changes (following Conventional Commits)
4. Push to fork
5. Create Pull Request
6. Wait for code review

### Code Review Checklist

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New tests added (if needed)
- [ ] Documentation updated
- [ ] No lint errors
- [ ] Commit messages are correct

## Conclusion

Following this guide ensures:
- Codebase consistency
- Development quality
- Maintenance convenience
- Fast onboarding of new developers

