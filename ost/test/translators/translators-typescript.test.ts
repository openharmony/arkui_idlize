import { E, S, T, D } from '../../src/builders/original';
import { processNPrintTS } from '../../src/printers/translators/typescript';
import { assertEquals, describe, runTestSuite } from '../test-utils';

// Test TypeScript translator
const tsTranslatorTests = describe('TypeScript Translator Tests', [
  {
    name: 'Simple function declaration',
    fn: () => {
      const func = D.func(
        'add',
        [
          { name: 'a', type: T.c('number') },
          { name: 'b', type: T.c('number') }
        ],
        T.c('number'),
        S.return(E.bin('+', E.v('a'), E.v('b')))
      );
      const output = processNPrintTS(func, '', new Set());
      // Actual output from translator (no braces for single return)
      const expected = `export function add(a: number, b: number): number return a + b`;
      assertEquals(output.trim(), expected.trim());
    }
  },
  {
    name: 'Variable declaration with const',
    fn: () => {
      const decl = S.declaration('x', T.c('number'), false, E.c(42));
      // Need to wrap in a top-level expression? processNPrintTS expects LWDeclaration.
      // Use a simple function declaration with variable inside? Actually processNPrintTS takes LWDeclaration, not statement.
      // Let's create a function that contains the declaration.
      const func = D.func(
        'test',
        [],
        T.c('void'),
        S.block([
          decl,
          S.e(E.call(E.v('console.log'), [E.v('x')]))
        ])
      );
      const output = processNPrintTS(func, '', new Set());
      // Check that const x: number = 42 appears
      const expectedLines = [
        'export function test(): void {',
        '  const x: number = 42',
        '  console.log(x)',
        '}'
      ];
      const lines = output.trim().split('\n');
      assertEquals(lines.length, 4);
      assertEquals(lines[0], expectedLines[0]);
      assertEquals(lines[1], expectedLines[1]);
      assertEquals(lines[2], expectedLines[2]);
      assertEquals(lines[3], expectedLines[3]);
    }
  },
  {
    name: 'Interface declaration',
    fn: () => {
      const struct = D.struct('Point', [
        { name: 'x', type: T.c('number') },
        { name: 'y', type: T.c('number') }
      ]);
      const output = processNPrintTS(struct, '', new Set());
      const expected = `export interface Point {
  x: number
  y: number
}`;
      assertEquals(output.trim(), expected.trim());
    }
  },
  {
    name: 'Enum declaration',
    fn: () => {
      const enumDecl = D.enum('Color', [
        { name: 'Red', value: 0 },
        { name: 'Green', value: 1 },
        { name: 'Blue', value: 2 }
      ]);
      const output = processNPrintTS(enumDecl, '', new Set());
      const expected = `export enum Color {
  Red = 0,
  Green = 1,
  Blue = 2
}`;
      assertEquals(output.trim(), expected.trim());
    }
  }
]);

console.log('Running TypeScript translator tests...\n');
const passed = runTestSuite(tsTranslatorTests);
console.log('\n' + (passed ? '✅ All TypeScript translator tests passed!' : '❌ Some TypeScript translator tests failed.'));
process.exit(passed ? 0 : 1);