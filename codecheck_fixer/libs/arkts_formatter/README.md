# Library `arkts_formatter`

This library provides a line length formatting system for TypeScript and ArkTS (ETS) code using enhanced AST analysis.

## Purpose

- **AST-based formatting**: Intelligent line breaking with syntax structure awareness
- **ArkTS/ETS support**: Specialized processing for ArkTS files (HarmonyOS)
- **Semantic equivalence**: Guaranteed code semantics preservation after formatting
- **Single-pass formatting**: Efficient processing without AST rebuilding
- **Result validation**: Automatic syntax correctness and semantic equivalence checking

> ⚠️ **Important.** This library is the main formatting engine for the project. It uses the enhanced AST (`libs/arkts_enhanced_ast`) for precise code structure analysis and safe break point determination.

## Architecture

### Core Components

1. **LineLengthFormatter** - main formatter class
   - Manages formatting process
   - Coordinates strategies and validators
   - Ensures single-pass formatting

2. **EnhancedASTFormattingStrategy** - enhanced AST-based formatting strategy
   - Analyzes code syntax structure
   - Determines optimal break points
   - Considers construct priorities

3. **ResultValidator** - result validator
   - Checks syntax correctness
   - Validates semantic equivalence
   - Ensures rollback on errors

4. **TransformationManager** - transformation manager
   - Manages change application
   - Handles position conflicts
   - Ensures correct line break application

5. **ContentTypeDetector** - file type detector
   - Determines file type (TS/TSX/ArkTS) from file extension (.ts/.tsx/.ets)

### Strategy Pattern

The library uses the **Strategy** pattern for formatting:

```typescript
interface FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;
  getPriority(): number;
}
```

Each strategy evaluates whether it can process a line and applies appropriate formatting. Strategies are sorted by priority.

## Features

### ✅ Supported Constructs

- Class declarations with multiple interfaces
- Long function parameter lists
- Object literals
- Arrays
- Destructuring (objects and arrays)
- Union types
- Imports
- Logical expressions
- Arithmetic expressions
- Method chaining
- JSX/TSX elements

### 🛡️ ASI (Automatic Semicolon Insertion) Protection

The formatter **never** inserts a line break after:
- `return`
- `throw`
- `break`
- `continue`
- `yield`

This prevents critical errors related to automatic semicolon insertion.

### 🔍 Validation

Each formatting result undergoes validation:

1. **Syntax validation** - code must parse without errors
2. **Semantic equivalence** - normalized code must be identical to original
3. **Line length check** - modified lines must fit within limit
4. **Regression check** - changes must not degrade code

## Usage

### Basic Usage

```typescript
import { LineLengthFormatter } from 'libs/arkts_formatter';
import type { LineLengthConfig } from 'libs/arkts_formatter';

// Formatter configuration
const formatterConfig = {
  tabSize: 2,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: false,
  maxLineLength: 80
};

// Line length configuration
const lineLengthConfig: LineLengthConfig = {
  maxLineLength: 80,
  ignoreUrls: false,
  ignoreStrings: false,
  ignoreComments: false,
  ignoreTemplateLiterals: true
};

const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);

// Format code (option 1: by path)
const formattedByPath = formatter.format(sourceCode, 'file.ts');

// Format code (option 2: no path, explicit type)
const formattedByType = formatter.format(sourceCode, ContentType.TS);
```

### Using Utilities

```typescript
import { 
  getLineInfo,
  isNodeLong,
  containsUrl,
  isComment,
  ResultValidator 
} from 'libs/arkts_formatter';

// Analyze line
const lineInfo = getLineInfo(line, 0, 80);
console.log(`Line exceeds limit: ${lineInfo.exceedsLimit}`);

// Check for URL
if (containsUrl(line)) {
  // Skip formatting lines with URLs
}

// Validate result
const validation = ResultValidator.validate(
  originalCode,
  formattedCode,
  context,
  'file.ts'
);

if (validation.isValid) {
  console.log('Formatting passed validation');
}
```

### Working with File Types

```typescript
import { ContentTypeDetector, ContentType } from 'libs/arkts_formatter';

const fileType = ContentTypeDetector.detectFileType('MyComponent.ets');

if (fileType === ContentType.ARKTS) {
  console.log('ArkTS file detected');
}
```

## Testing

### Test Structure

Tests are located in the `tests/` directory:

```
libs/arkts_formatter/tests/
├── line-length-formatter.test.ts         # Main formatter tests
├── expression-normalizer/                # Expression normalizer tests
│   ├── normalizer-fixtures.test.ts
│   └── fixtures/
│       └── pairs.json
├── example-fixture-usage.test.ts         # Fixture usage examples
└── fixtures/                             # Test fixtures
    └── fixtures/
        ├── *.json                        # JSON test cases
        ├── README.md
        └── USAGE_RU.md
```

### Quick Start

Run only this library's tests:

```bash
# From project root
npm test libs/arkts_formatter/tests

# Or run all unit tests
npm run test:unit
```

### Fixture Structure

Fixtures are represented in JSON format:

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

## Configuration

### FormatterConfig

Main formatter configuration:

```typescript
interface FormatterConfig {
  tabSize: number;              // Tab size (usually 2 or 4)
  useTabs: boolean;             // Use tabs instead of spaces
  quoteStyle: 'single' | 'double';  // Quote style
  semicolons: boolean;          // Require semicolons
  trailingCommas: boolean;      // Trailing commas
  maxLineLength: number;        // Maximum line length
}
```

### LineLengthConfig

Specific configuration for line length checking:

```typescript
interface LineLengthConfig {
  maxLineLength: number;           // Maximum line length
  ignoreUrls: boolean;             // Ignore lines with URLs
  ignoreStrings: boolean;          // Ignore string literals
  ignoreComments: boolean;         // Ignore comments
  ignoreTemplateLiterals: boolean; // Ignore template literals
}
```

## Exported Types and Functions

### Main Classes

- `LineLengthFormatter` - main formatter class
- `EnhancedASTFormattingStrategy` - AST formatting strategy
- `ResultValidator` - result validator
- `TransformationManager` - transformation manager
- `ContentTypeDetector` - file type detector

### Types

- `FormattingContext` - formatting context
- `FormatterResult` - formatting result
- `FormattingStrategy` - strategy interface
- `TransformationResult` - transformation result
- `LineBreakInsertion` - line break information
- `ValidationResult` - validation result
- `ValidationIssue` - validation issue

### Utilities

- `getLineInfo()` - get line information
- `getIndent()` - get line indent
- `getIndentUnit()` - get indent unit
- `getIndentForNode()` - get indent for AST node
- `extractLineForNode()` - extract line for node
- `isNodeLong()` - check if node is long
- `splitByTopLevelCommas()` - split by top-level commas
- `containsUrl()` - check for URL presence
- `isComment()` - check if line is a comment

## Limitations

- **Template literals**: Not formatted to preserve semantics (whitespace is significant)
- **Comments**: Handled conservatively to avoid information loss
- **Regular expressions**: Not modified
- **Lines with URLs**: May be ignored depending on configuration

## Dependencies

The library depends on:

- `libs/arkts_enhanced_ast` - enhanced AST with coordinates and tokens
- `typescript` - TypeScript compiler for parsing

## Integration

The library is integrated into the main `codecheck_fixer` project and used for:

1. Formatting long lines during static analysis
2. Automatically fixing line length violations
3. Ensuring compliance with CI/CD code standards

## Development

### Adding a New Strategy

1. Create a class implementing `FormattingStrategy`
2. Define logic in `canHandle()` and `format()` methods
3. Set priority in `getPriority()`
4. Add strategy to `LineLengthFormatter` constructor

```typescript
export class MyFormattingStrategy implements FormattingStrategy {
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean {
    // Check logic
    return true;
  }

  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult {
    // Formatting logic
    return {
      lineBreaks: [...],
      success: true
    };
  }

  getPriority(): number {
    return 100; // Priority
  }
}
```

### Debugging

To debug the formatter:

```typescript
// Enable verbose output
const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);

// Format with path specified (for better diagnostics)
const result = formatter.format(code, 'debug.ts');
```

## Roadmap

- [ ] Add AST analysis result caching
- [ ] Performance optimization for large files
- [ ] Support for custom formatting rules
- [ ] LSP integration for real-time formatting
- [ ] Enhanced JSX/TSX support

## See Also

- [libs/arkts_enhanced_ast](../arkts_enhanced_ast/README.md) - enhanced AST
- [libs/prettier_formatter](../prettier_formatter/README.md) - alternative formatter
- [docs/enhanced-ast-building-process.md](../../docs/enhanced-ast-building-process.md) - AST building process

