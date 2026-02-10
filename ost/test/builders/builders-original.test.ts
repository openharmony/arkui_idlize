import { E, S, T, D } from '../../src/builders/original';
import { LWKind } from '../../src/lws';
import { assertEquals, describe, runTestSuite } from '../test-utils';

// Test Expression builders (E)
const expressionTests = describe('Expression Builders (E)', [
  {
    name: 'E.c creates ConstantExpression',
    fn: () => {
      const expr = E.c(42);
      assertEquals(expr.kind, LWKind.ConstantExpression);
      assertEquals(expr.value, '42');
    }
  },
  {
    name: 'E.v creates VariableExpression',
    fn: () => {
      const expr = E.v('x');
      assertEquals(expr.kind, LWKind.VariableExpression);
      assertEquals(expr.name, 'x');
    }
  },
  {
    name: 'E.bin creates BinaryExpression',
    fn: () => {
      const left = E.v('x');
      const right = E.v('y');
      const expr = E.bin('+', left, right);
      assertEquals(expr.kind, LWKind.BinaryExpression);
      assertEquals(expr.op, '+');
      assertEquals(expr.left, left);
      assertEquals(expr.right, right);
    }
  },
  {
    name: 'E.unary creates UnaryExpression',
    fn: () => {
      const operand = E.v('x');
      const expr = E.unary('-', operand);
      assertEquals(expr.kind, LWKind.UnaryExpression);
      assertEquals(expr.op, '-');
      assertEquals(expr.expression, operand);
    }
  },
  {
    name: 'E.call creates CallExpression with string callee',
    fn: () => {
      const args = [E.c(1), E.c(2)];
      const expr = E.call(E.v('add'), args); // callee must be expression, not string
      assertEquals(expr.kind, LWKind.CallExpression);
      assertEquals((expr.callee as any).name, 'add');
      assertEquals(expr.args, args);
    }
  }
]);

// Test Statement builders (S)
const statementTests = describe('Statement Builders (S)', [
  {
    name: 'S.declaration creates DeclarationStatement',
    fn: () => {
      const stmt = S.declaration('x', T.c('number'), true, E.c(42));
      assertEquals(stmt.kind, LWKind.DeclarationStatement);
      assertEquals(stmt.varName, 'x');
      assertEquals(stmt.varType.kind, LWKind.ValueType);
      assertEquals((stmt.varType as any).name, 'number');
      assertEquals(stmt.mutable, true);
      assertEquals((stmt.expression as any).value, '42');
    }
  },
  {
    name: 'S.block creates CompoundStatement',
    fn: () => {
      const stmts = [S.e(E.v('x')), S.return(E.c(1))];
      const block = S.block(stmts);
      assertEquals(block.kind, LWKind.CompoundStatement);
      assertEquals(block.statements, stmts);
    }
  },
  {
    name: 'S.return creates ReturnStatement',
    fn: () => {
      const stmt = S.return(E.c(42));
      assertEquals(stmt.kind, LWKind.ReturnStatement);
      assertEquals((stmt.expression as any).value, '42');
    }
  },
  {
    name: 'S.return creates void ReturnStatement',
    fn: () => {
      const stmt = S.return();
      assertEquals(stmt.kind, LWKind.ReturnStatement);
      assertEquals(stmt.expression, undefined);
    }
  }
]);

// Test Type builders (T)
const typeTests = describe('Type Builders (T)', [
  {
    name: 'T.c creates ValueType',
    fn: () => {
      const type = T.c('string');
      assertEquals(type.kind, LWKind.ValueType);
      assertEquals(type.name, 'string');
    }
  },
  {
    name: 'T.fn creates FunctionalType',
    fn: () => {
      const params: [string, any][] = [['x', T.c('number')], ['y', T.c('number')]];
      const type = T.fn(params, T.c('number'));
      assertEquals(type.kind, LWKind.FunctionalType);
      assertEquals(type.params.length, 2);
      assertEquals(type.params[0].name, 'x');
      assertEquals(type.returnType.kind, LWKind.ValueType);
    }
  }
]);

// Test Declaration builders (D)
const declarationTests = describe('Declaration Builders (D)', [
  {
    name: 'D.func creates FunctionDeclaration',
    fn: () => {
      const func = D.func(
        'add',
        [{ name: 'x', type: T.c('number') }, { name: 'y', type: T.c('number') }],
        T.c('number'),
        S.return(E.bin('+', E.v('x'), E.v('y')))
      );
      assertEquals(func.kind, LWKind.FunctionDeclaration);
      assertEquals(func.name, 'add');
      assertEquals(func.parameters.length, 2);
      assertEquals(func.returnType.kind, LWKind.ValueType);
      assertEquals(func.body!.kind, LWKind.ReturnStatement);
    }
  },
  {
    name: 'D.struct creates StructureDeclaration',
    fn: () => {
      const members = [
        { name: 'x', type: T.c('number') },
        { name: 'y', type: T.c('number') }
      ];
      const struct = D.struct('Point', members);
      assertEquals(struct.kind, LWKind.StructureDeclaration);
      assertEquals(struct.name, 'Point');
      assertEquals(struct.members, members);
    }
  },
  {
    name: 'D.enum creates EnumDeclaration',
    fn: () => {
      const members = [
        { name: 'Red', value: 0 },
        { name: 'Green', value: 1 }
      ];
      const enumDecl = D.enum('Color', members);
      assertEquals(enumDecl.kind, LWKind.EnumDeclaration);
      assertEquals(enumDecl.name, 'Color');
      assertEquals(enumDecl.members, members);
    }
  }
]);

// Run all test suites
console.log('Running tests for original builders...\n');

const suites = [expressionTests, statementTests, typeTests, declarationTests];
let allPassed = true;

for (const suite of suites) {
  const passed = runTestSuite(suite);
  if (!passed) {
    allPassed = false;
  }
}

console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed.'));
process.exit(allPassed ? 0 : 1);