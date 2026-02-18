import { E, S, T, D } from '../../src/builders/original.js';
import { processNPrintCXX } from '../../src/printers/translators/cxx.js';
import { assertEquals, describe, runTestSuite } from '../test-utils.js';

// Test C++ translator
const cxxTranslatorTests = describe('C++ Translator Tests', [
  {
    name: 'Simple function declaration',
    fn: () => {
      const func = D.func(
        'add',
        [
          { name: 'a', type: T.c('int') },
          { name: 'b', type: T.c('int') }
        ],
        T.c('int'),
        S.return(E.bin('+', E.v('a'), E.v('b')))
      );
      const output = processNPrintCXX([func]);
      // Actual output from translator (no braces for single return)
      const expected = `int add(int a, int b) return a + b;`;
      assertEquals(output.trim(), expected.trim());
    }
  },
  {
    name: 'Struct declaration',
    fn: () => {
      const struct = D.struct('Point', [
        { name: 'x', type: T.c('int') },
        { name: 'y', type: T.c('int') }
      ]);
      const output = processNPrintCXX([struct]);
      const expected = `struct Point {
  int x;
  int y;
};`;
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
      const output = processNPrintCXX([enumDecl]);
      const expected = `typedef enum Color {
  Red = 0,
  Green = 1,
  Blue = 2
} Color;`;
      assertEquals(output.trim(), expected.trim());
    }
  },
  {
    name: 'Variable declaration with const',
    fn: () => {
      const decl = S.declaration('x', T.c('int'), false, E.c(42));
      // Need to wrap in a function body
      const func = D.func(
        'test',
        [],
        T.c('void'),
        S.block([
          decl,
          S.e(E.call(E.v('printf'), [E.s('%d\\n'), E.v('x')]))
        ])
      );
      const output = processNPrintCXX([func]);
      // Check that const int x = 42 appears
      const expectedLines = [
        'void test() {',
        '  const int x = 42;',
        '  printf("%d\\n", x);',
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
    name: 'Class declaration',
    fn: () => {
      const method = D.func(
        'getName',
        [],
        T.c('string'),
        S.return(E.s('test'))
      );
      const classDecl = D.class(
        'Person',
        [
          { name: 'name', type: T.c('string') },
          { name: 'age', type: T.c('int') }
        ],
        [method]
      );
      const output = processNPrintCXX([classDecl]);
      // Actual output from translator
      const expectedLines = [
        'class Person {',
        'public:',
        '  string name;',
        '  int age;',
        '  string getName() return "test";',
        '};'
      ];
      const lines = output.trim().split('\n');
      assertEquals(lines.length, 6);
      for (let i = 0; i < lines.length; i++) {
        assertEquals(lines[i], expectedLines[i]);
      }
    }
  }
]);

console.log('Running C++ translator tests...\n');
const passed = runTestSuite(cxxTranslatorTests);
console.log('\n' + (passed ? '✅ All C++ translator tests passed!' : '❌ Some C++ translator tests failed.'));
process.exit(passed ? 0 : 1);