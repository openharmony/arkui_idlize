import { Builders } from '../../src/builders/advanced.js';
import { T } from '../../src/builders/original.js';
import { LWKind } from '../../src/lws.js';
import { assertEquals, describe, runTestSuite } from '../test-utils.js';

// Test Advanced Builders - simplified tests that compile
const advancedTests = describe('Advanced Builders (Builders)', [
  {
    name: 'Builders.expr().const() creates ConstantExpression',
    fn: () => {
      const expr = Builders.expr()
        .const(42)
        .$() as any;
      assertEquals(expr.kind, LWKind.ConstantExpression);
      assertEquals(expr.value, '42');
    }
  },
  {
    name: 'Builders.expr().var() creates VariableExpression',
    fn: () => {
      const expr = Builders.expr()
        .var('x')
        .$() as any;
      assertEquals(expr.kind, LWKind.VariableExpression);
      assertEquals(expr.name, 'x');
    }
  },
  {
    name: 'Builders.stmt().decl() creates DeclarationStatement',
    fn: () => {
      const stmt = Builders.stmt()
        .decl('x', T.c('number'))
        .mutable()
        .value(42)
        .$()  // returns StatementBuilder
        .$() as any; // returns DeclarationStatement
      assertEquals(stmt.kind, LWKind.DeclarationStatement);
      assertEquals(stmt.varName, 'x');
      assertEquals(stmt.varType.kind, LWKind.ValueType);
      assertEquals(stmt.mutable, true);
      assertEquals((stmt.expression as any).value, '42');
    }
  },
  {
    name: 'Builders.func() creates FunctionDeclaration',
    fn: () => {
      // Simple function without parameters for now
      const func = Builders.func('test')
        .returns(T.c('void'))
        .$() as any;
      assertEquals(func.kind, LWKind.FunctionDeclaration);
      assertEquals(func.name, 'test');
      assertEquals(func.returnType.kind, LWKind.ValueType);
    }
  },
  {
    name: 'Builders.struct() creates StructureDeclaration',
    fn: () => {
      const struct = Builders.struct('Point')
        .field('x').type(T.c('number')).$()
        .field('y').type(T.c('number')).$()
        .$() as any;
      assertEquals(struct.kind, LWKind.StructureDeclaration);
      assertEquals(struct.name, 'Point');
      assertEquals(struct.members.length, 2);
      assertEquals(struct.members[0].name, 'x');
      assertEquals(struct.members[0].type.kind, LWKind.ValueType);
    }
  },
  {
    name: 'Builders.enum() creates EnumDeclaration',
    fn: () => {
      const enumDecl = Builders.enum('Color')
        .member('Red', 0)
        .member('Green', 1)
        .member('Blue', 2)
        .$() as any;
      assertEquals(enumDecl.kind, LWKind.EnumDeclaration);
      assertEquals(enumDecl.name, 'Color');
      assertEquals(enumDecl.members.length, 3);
      assertEquals(enumDecl.members[0].name, 'Red');
      assertEquals(enumDecl.members[0].value, 0);
    }
  }
]);

// Run test suite
console.log('Running tests for advanced builders...\n');

const allPassed = runTestSuite(advancedTests);

console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed.'));
process.exit(allPassed ? 0 : 1);