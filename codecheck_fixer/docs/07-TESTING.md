# Testing and Code Quality

## Overview

CodeCheck Fixer uses a comprehensive approach to quality assurance through unit tests, integration tests, and result validation.

## Test Infrastructure

### Tools Used

- **Jest** - main testing framework
- **ts-jest** - TypeScript support in Jest
- **Fixtures** - pre-made test cases in JSON

### Test Structure

```
codecheck_fixer/
├── libs/
│   ├── arkts_formatter/tests/
│   │   ├── line-length-formatter.test.ts
│   │   ├── expression-normalizer/
│   │   └── fixtures/
│   ├── prettier_formatter/tests/
│   │   ├── prettier-based.test.ts
│   │   └── fixtures/
│   └── arkts_enhanced_ast/tests/
│       └── ...
├── tests/                        # Integration tests
│   ├── fixtures/
│   ├── test_condition.json
│   ├── test_single_real_cpp.json
│   └── test_single_real_ets.json
└── jest.config.cjs               # Jest configuration
```

## Running Tests

### All Tests

```bash
npm test
```

### Library Unit Tests

```bash
npm run test:unit
```

Equivalent to:
```bash
jest --config ./jest.config.cjs libs/
```

### Specific Library Tests

```bash
# arkts_formatter
npm test libs/arkts_formatter/tests

# prettier_formatter
npm test libs/prettier_formatter/tests
```

### Tests with Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm test -- --watch
```

## Jest Configuration

**File:** `jest.config.cjs`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/libs/arkts_formatter/tests',
    '<rootDir>/libs/prettier_formatter/tests',
    '<rootDir>/tests'
  ],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  collectCoverage: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'CommonJS',
        esModuleInterop: true,
        moduleResolution: 'Node',
        resolveJsonModule: true,
        skipLibCheck: true
      },
      isolatedModules: true,
      diagnostics: true
    }]
  }
};
```

### Settings

- `preset: 'ts-jest'` - TypeScript support
- `testEnvironment: 'node'` - tests run in Node.js environment
- `moduleNameMapper` - path aliases (`@/` → `src/`)
- `isolatedModules: true` - isolated module compilation

## Fixtures

### Fixture Format

**JSON structure:**

```json
{
  "equivalent": [
    {
      "description": "Test description",
      "original": "source code",
      "expected": "expected result"
    }
  ],
  "notEquivalent": [
    {
      "description": "Negative test",
      "original": "source code",
      "expected": "expected result (should not match)"
    }
  ]
}
```

### Using Fixtures

```typescript
import * as fs from 'fs';
import * as path from 'path';

describe('Formatter Tests', () => {
  const fixturesPath = path.join(__dirname, 'fixtures', 'test-cases.json');
  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
  
  fixtures.equivalent.forEach((fixture: any) => {
    it(fixture.description, () => {
      const result = formatter.format(fixture.original);
      expect(result).toBe(fixture.expected);
    });
  });
});
```

### Creating Fixtures

1. **Create JSON file** in `tests/fixtures/`
2. **Add test cases** to `equivalent` or `notEquivalent` section
3. **Use in tests** via `JSON.parse()`

**Example:**

```json
{
  "equivalent": [
    {
      "description": "Union type wrapping",
      "original": "type MyType = VeryLongTypeA | VeryLongTypeB | VeryLongTypeC | VeryLongTypeD;",
      "expected": "type MyType = VeryLongTypeA\n  | VeryLongTypeB\n  | VeryLongTypeC\n  | VeryLongTypeD;"
    }
  ]
}
```

## Test Types

### 1. Unit Tests

Test individual components in isolation.

**Example:**

```typescript
describe('LineLengthAnalyzer', () => {
  it('should detect long lines', async () => {
    const config: AnalysisConfig = { /* ... */ };
    const lineLengthConfig: LineLengthConfig = {
      maxLineLength: 80,
      ignoreUrls: false,
      ignoreStrings: false,
      ignoreComments: false,
      ignoreTemplateLiterals: false
    };
    
    const analyzer = new LineLengthAnalyzer(config, lineLengthConfig);
    const content = 'const x = "this is a very long string that exceeds eighty characters and should be detected";';
    
    const result = await analyzer.analyze(content, ContentType.TS);
    
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].rule).toBe('line-length');
  });
});
```

### 2. Integration Tests

Test component interactions.

**Example:**

```typescript
describe('Orchestrator Integration', () => {
  it('should analyze and format file end-to-end', async () => {
    const config: ProjectConfig = loadConfig('test-config.json');
    const orchestrator = new Orchestrator(config);
    
    const analysisResult = await orchestrator.analyzeFileContent('test.ts', testCode);
    expect(analysisResult.issues.length).toBeGreaterThan(0);
    
    const formatted = await orchestrator.formatFile('test.ts', testCode);
    expect(formatted).not.toBe(testCode);
    expect(formatted.length).toBeLessThan(testCode.length);
  });
});
```

### 3. Validation Tests

Verify semantic preservation after formatting.

**Example:**

```typescript
describe('ResultValidator', () => {
  it('should validate semantic equivalence', () => {
    const original = 'const x = 1 + 2 + 3;';
    const formatted = 'const x = 1 +\n  2 +\n  3;';
    
    const validation = ResultValidator.validate(
      original,
      formatted,
      context,
      'test.ts'
    );
    
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
  
  it('should detect semantic changes', () => {
    const original = 'return { value: 42 };';
    const formatted = 'return\n{ value: 42 };'; // ASI breaks this!
    
    const validation = ResultValidator.validate(
      original,
      formatted,
      context,
      'test.ts'
    );
    
    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
  });
});
```

### 4. Regression Tests

Use real code examples to prevent regressions.

**Configurations for regression tests:**
- `tests/test_single_real_ets.json` - real ETS file
- `tests/test_single_real_cpp.json` - real C++ file

**Execution:**

```bash
./run_test_single_real_ets.sh
./run_test_single_real_cpp.sh
```

## Quality Metrics

### Code Coverage

**Execution:**

```bash
npm test -- --coverage
```

**Report:**

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   78.45 |    65.23 |   81.92 |   79.12 |
 analyzers            |   85.67 |    72.45 |   88.33 |   86.21 |
  typescript-analyzer |   92.15 |    81.25 |   95.00 |   93.45 |
  line-length-analyzer|   89.34 |    75.67 |   91.11 |   90.23 |
 formatters           |   72.89 |    58.12 |   76.45 |   74.67 |
  ...                 |   ...   |    ...   |   ...   |   ...   |
----------------------|---------|----------|---------|---------|
```

### Coverage Goals

- **Critical components** (analyzers, validators): > 85%
- **Formatters**: > 70%
- **Utilities**: > 80%
- **Overall coverage**: > 75%

## Code Quality

### TypeScript Strictness

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint

**Execution:**

```bash
npm run lint
```

**Configuration:** `.eslintrc.json` (if available)

### Prettier

**Execution:**

```bash
npm run format
```

## Testing Best Practices

### 1. Test Edge Cases

```typescript
describe('Edge cases', () => {
  it('should handle empty string', () => {
    const result = formatter.format('');
    expect(result).toBe('');
  });
  
  it('should handle very long lines', () => {
    const veryLongLine = 'const x = ' + '"a".repeat(10000);';
    const result = formatter.format(veryLongLine);
    expect(result.split('\n').length).toBeGreaterThan(1);
  });
  
  it('should handle unicode', () => {
    const unicode = 'const emoji = "test";';
    const result = formatter.format(unicode);
    expect(result).toContain('test');
  });
});
```

### 2. Use Descriptive Names

```typescript
// Not recommended
it('test1', () => { /* ... */ });

// Recommended
it('should wrap long union types with proper indentation', () => { /* ... */ });
```

### 3. Group Related Tests

```typescript
describe('LineLengthFormatter', () => {
  describe('Union types', () => {
    it('should wrap simple unions');
    it('should wrap nested unions');
    it('should preserve type parameters');
  });
  
  describe('Function parameters', () => {
    it('should wrap long parameter lists');
    it('should preserve default values');
  });
});
```

### 4. Use beforeEach/afterEach

```typescript
describe('Formatter with context', () => {
  let formatter: LineLengthFormatter;
  let config: FormatterConfig;
  
  beforeEach(() => {
    config = {
      tabSize: 2,
      useTabs: false,
      maxLineLength: 80,
      /* ... */
    };
    formatter = new LineLengthFormatter(config, lineLengthConfig);
  });
  
  it('test case 1', () => { /* ... */ });
  it('test case 2', () => { /* ... */ });
});
```

### 5. Check for Errors

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    formatter.format(null as any);
  }).toThrow('Invalid input');
});

it('should handle parse errors gracefully', async () => {
  const invalidCode = 'const x = {{{';
  const result = await orchestrator.formatFile('test.ts', invalidCode);
  expect(result).toBe(invalidCode); // Fallback to original
});
```

## Continuous Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### GitLab CI

```yaml
test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run build
    - npm test -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Troubleshooting

### Tests Fail Due to Timeout

```bash
# Increase timeout
npm test -- --testTimeout=30000
```

### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

### Path Issues

```typescript
// Use absolute paths in tests
const fixturesPath = path.join(__dirname, 'fixtures', 'test.json');
```

## Conclusion

Testing in CodeCheck Fixer provides:
- High coverage of critical components
- Regression testing on real examples
- Semantic equivalence validation
- CI/CD pipeline integration
- Continuous quality control

