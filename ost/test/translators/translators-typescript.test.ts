import { E, S, T, D } from '../../src/builders/original.js';
import { processNPrintTS } from '../../src/printers/translators/typescript.js';
import { suite, test, assert } from "@koalaui/harness";

// Test TypeScript translator
suite('TypeScript Translator Tests', () => {
    test('Simple function declaration', () => {
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
      assert.equal(output.trim(), expected.trim());
    });
    test('Variable declaration with const', () => {
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
      assert.equal(lines.length, 4);
      assert.equal(lines[0], expectedLines[0]);
      assert.equal(lines[1], expectedLines[1]);
      assert.equal(lines[2], expectedLines[2]);
      assert.equal(lines[3], expectedLines[3]);
    });
    test('Interface declaration', () => {
      const struct = D.struct('Point', [
        { name: 'x', type: T.c('number') },
        { name: 'y', type: T.c('number') }
      ]);
      const output = processNPrintTS(struct, '', new Set());
      const expected = `export interface Point {
  x: number
  y: number
}`;
      assert.equal(output.trim(), expected.trim());
    });
    test('Enum declaration', () => {
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
      assert.equal(output.trim(), expected.trim());
    });
    test('Function with default parameters', () => {
      const fnWithParams = D.func('foo', [{ name: 'x', type: T.c('int'), expression: E.c(42) }], T.c('void'), S.block([]))
      const output = processNPrintTS(fnWithParams, '', new Set())
      const expected = `export function foo(x: int = 42): void {\n  \n}`
      assert.equal(output.trim(), expected.trim())
    });
});

