import { Builders } from '../../src/builders/advanced.js';
import { T } from '../../src/builders/original.js';
import { LWKind } from '../../src/lws.js';
import { suite, test, assert } from "@koalaui/harness";

// Test Advanced Builders - simplified tests that compile
suite('Advanced Builders (Builders)', () => {
    test('Builders.expr().const() creates ConstantExpression', () => {
      const expr = Builders.expr()
        .const(42)
        .$() as any;
      assert.equal(expr.kind, LWKind.ConstantExpression);
      assert.equal(expr.value, '42');
    });
    test('Builders.expr().var() creates VariableExpression', () => {
      const expr = Builders.expr()
        .var('x')
        .$() as any;
      assert.equal(expr.kind, LWKind.VariableExpression);
      assert.equal(expr.name, 'x');
    });
    test('Builders.stmt().decl() creates DeclarationStatement', () => {
      const stmt = Builders.stmt()
        .decl('x', T.c('number'))
        .mutable()
        .value(42)
        .$()  // returns StatementBuilder
        .$() as any; // returns DeclarationStatement
      assert.equal(stmt.kind, LWKind.DeclarationStatement);
      assert.equal(stmt.varName, 'x');
      assert.equal(stmt.varType.kind, LWKind.ValueType);
      assert.equal(stmt.mutable, true);
      assert.equal((stmt.expression as any).value, '42');
    });
    test('Builders.func() creates FunctionDeclaration', () => {
      // Simple function without parameters for now
      const func = Builders.func('test')
        .returns(T.c('void'))
        .$() as any;
      assert.equal(func.kind, LWKind.FunctionDeclaration);
      assert.equal(func.name, 'test');
      assert.equal(func.returnType.kind, LWKind.ValueType);
    });
    test('Builders.struct() creates StructureDeclaration', () => {
      const struct = Builders.struct('Point')
        .field('x').type(T.c('number')).$()
        .field('y').type(T.c('number')).$()
        .$() as any;
      assert.equal(struct.kind, LWKind.StructureDeclaration);
      assert.equal(struct.name, 'Point');
      assert.equal(struct.members.length, 2);
      assert.equal(struct.members[0].name, 'x');
      assert.equal(struct.members[0].type.kind, LWKind.ValueType);
    });
    test('Builders.enum() creates EnumDeclaration', () => {
      const enumDecl = Builders.enum('Color')
        .member('Red', 0)
        .member('Green', 1)
        .member('Blue', 2)
        .$() as any;
      assert.equal(enumDecl.kind, LWKind.EnumDeclaration);
      assert.equal(enumDecl.name, 'Color');
      assert.equal(enumDecl.members.length, 3);
      assert.equal(enumDecl.members[0].name, 'Red');
      assert.equal(enumDecl.members[0].value, 0);
    });
  }
);
