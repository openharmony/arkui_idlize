# Test Setup

This directory contains TypeScript tests for the OST library.

## Structure

- `tsconfig.json` - TypeScript configuration for tests (extends main tsconfig)
- `test-utils.ts` - Simple assertion utilities without external dependencies
- `*.test.ts` - Test files for different parts of the library
- `builders/` - Builder-specific test files
- `run-all.ts` - Test runner that discovers and runs all compiled test files

## Running Tests

### Using npm scripts:
```bash
npm test                    # Compile and run all tests
npm run test:compile       # Compile tests only
npm run test:run          # Run compiled tests (requires compilation first)
```

### Manual compilation and execution:
```bash
# Compile tests
npx tsc -b test/tsconfig.json

# Run specific test file
node --enable-source-maps build/test/test/builders/builders-original.test.js

# Run all tests using the test runner
node --enable-source-maps build/test/test/run-all.js
```

## Writing Tests

1. Create a new `.test.ts` file in an appropriate subdirectory (e.g., `builders/` for builder tests)
2. Import the necessary modules from `../src` (adjust relative path based on subdirectory depth, e.g., `../../src` for files in `builders/`)
3. Use the assertion utilities from `./test-utils`:
   - `assert(condition, message?)`
   - `assertEquals(actual, expected, message?)`
   - `assertThrows(fn, message?)`
   - `describe(name, tests)` - Create a test suite
   - `runTestSuite(suite)` - Run a test suite
4. Make the test file self-executing (call `process.exit(0)` on success, `process.exit(1)` on failure)

Example (test file in `test/builders/` subdirectory):
```typescript
import { E, T } from '../../src/builders/original';  // Note: '../../src' because file is in builders/
import { assertEquals, describe, runTestSuite } from '../test-utils';  // '../' because test-utils is one level up

const tests = describe('My Tests', [
  {
    name: 'test something',
    fn: () => {
      assertEquals(E.c(42).value, '42');
    }
  }
]);

const passed = runTestSuite(tests);
process.exit(passed ? 0 : 1);
```

## Notes

- No external test frameworks are used
- Tests are written in TypeScript and compiled to JavaScript
- The test runner uses Node.js built-in modules only
- Source maps are enabled for better error reporting