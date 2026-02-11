/**
 * Simple assertion utility for tests without external dependencies.
 */

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * Assert that a condition is true.
 * @param condition - Condition to check
 * @param message - Error message if assertion fails
 */
export function assert(condition: boolean, message: string = 'Assertion failed'): void {
  if (!condition) {
    throw new AssertionError(message);
  }
}

/**
 * Assert that two values are deeply equal (simple implementation).
 * @param actual - Actual value
 * @param expected - Expected value
 * @param message - Error message if values differ
 */
export function assertEquals<T>(actual: T, expected: T, message: string = `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new AssertionError(message);
  }
}

/**
 * Assert that a function throws an error.
 * @param fn - Function that should throw
 * @param message - Error message if function doesn't throw
 */
export function assertThrows(fn: () => void, message: string = 'Expected function to throw'): void {
  try {
    fn();
    throw new AssertionError(message);
  } catch (error) {
    // Expected behavior - function threw an error
  }
}

/**
 * Test suite utility for organizing tests.
 */
export interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    fn: () => void;
  }>;
}

/**
 * Create a test suite.
 */
export function describe(name: string, tests: Array<{ name: string; fn: () => void }>): TestSuite {
  return { name, tests };
}

/**
 * Run a test suite and report results.
 */
export function runTestSuite(suite: TestSuite): boolean {
  console.log(`\nRunning test suite: ${suite.name}`);
  let passed = 0;
  let failed = 0;

  for (const test of suite.tests) {
    try {
      test.fn();
      console.log(`  ✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}`);
      console.log(`    ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} ✅, ${failed} ❌`);
  return failed === 0;
}