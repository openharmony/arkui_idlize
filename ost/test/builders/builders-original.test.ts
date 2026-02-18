import { E, S, T, D } from '../../src/builders/original.js';
import { LWKind } from '../../src/lws.js';
import { suite, test, assert } from "@koalaui/harness";

// Test Expression builders (E)
suite('Expression Builders (E)', () => {
    test('E.c creates ConstantExpression', () => {
      const expr = E.c(42);
      assert.equal(expr.kind, LWKind.ConstantExpression);
      assert.equal(expr.value, '42');
    });
    test('E.v creates VariableExpression', () => {
      const expr = E.v('x');
      assert.equal(expr.kind, LWKind.VariableExpression);
      assert.equal(expr.name, 'x');
    });
    test('E.bin creates BinaryExpression', () => {
      const left = E.v('x');
      const right = E.v('y');
      const expr = E.bin('+', left, right);
      assert.equal(expr.kind, LWKind.BinaryExpression);
      assert.equal(expr.op, '+');
      assert.equal(expr.left, left);
      assert.equal(expr.right, right);
    });
    test('E.unary creates UnaryExpression', () => {
      const operand = E.v('x');
      const expr = E.unary('-', operand);
      assert.equal(expr.kind, LWKind.UnaryExpression);
      assert.equal(expr.op, '-');
      assert.equal(expr.expression, operand);
    });
    test('E.call creates CallExpression with string callee', () => {
      const args = [E.c(1), E.c(2)];
      const expr = E.call(E.v('add'), args); // callee must be expression, not string
      assert.equal(expr.kind, LWKind.CallExpression);
      assert.equal((expr.callee as any).name, 'add');
      assert.equal(expr.args, args);
    });
  }
);

// Test Statement builders (S)
suite('Statement Builders (S)', () => {
    test('S.declaration creates DeclarationStatement', () => {
      const stmt = S.declaration('x', T.c('number'), true, E.c(42));
      assert.equal(stmt.kind, LWKind.DeclarationStatement);
      assert.equal(stmt.varName, 'x');
      assert.equal(stmt.varType.kind, LWKind.ValueType);
      assert.equal((stmt.varType as any).name, 'number');
      assert.equal(stmt.mutable, true);
      assert.equal((stmt.expression as any).value, '42');
    });
    test('S.block creates CompoundStatement', () => {
      const stmts = [S.e(E.v('x')), S.return(E.c(1))];
      const block = S.block(stmts);
      assert.equal(block.kind, LWKind.CompoundStatement);
      assert.equal(block.statements, stmts);
    });
    test('S.return creates ReturnStatement', () => {
      const stmt = S.return(E.c(42));
      assert.equal(stmt.kind, LWKind.ReturnStatement);
      assert.equal((stmt.expression as any).value, '42');
    });
    test('S.return creates void ReturnStatement', () => {
      const stmt = S.return();
      assert.equal(stmt.kind, LWKind.ReturnStatement);
      assert.equal(stmt.expression, undefined);
    });
  }
);

// Test Type builders (T)
suite('Type Builders (T)', () => {
    test('T.c creates ValueType', () => {
      const type = T.c('string');
      assert.equal(type.kind, LWKind.ValueType);
      assert.equal(type.name, 'string');
    });
    test('T.fn creates FunctionalType', () => {
      const params: [string, any][] = [['x', T.c('number')], ['y', T.c('number')]];
      const type = T.fn(params, T.c('number'));
      assert.equal(type.kind, LWKind.FunctionalType);
      assert.equal(type.params.length, 2);
      assert.equal(type.params[0].name, 'x');
      assert.equal(type.returnType.kind, LWKind.ValueType);
    });
  }
);

// Test Declaration builders (D)
suite('Declaration Builders (D)', () => {
    test('D.func creates FunctionDeclaration', () => {
      const func = D.func(
        'add',
        [{ name: 'x', type: T.c('number') }, { name: 'y', type: T.c('number') }],
        T.c('number'),
        S.return(E.bin('+', E.v('x'), E.v('y')))
      );
      assert.equal(func.kind, LWKind.FunctionDeclaration);
      assert.equal(func.name, 'add');
      assert.equal(func.parameters.length, 2);
      assert.equal(func.returnType.kind, LWKind.ValueType);
      assert.equal(func.body!.kind, LWKind.ReturnStatement);
    });
    test('D.struct creates StructureDeclaration', () => {
      const members = [
        { name: 'x', type: T.c('number') },
        { name: 'y', type: T.c('number') }
      ];
      const struct = D.struct('Point', members);
      assert.equal(struct.kind, LWKind.StructureDeclaration);
      assert.equal(struct.name, 'Point');
      assert.equal(struct.members, members);
    });
    test('D.enum creates EnumDeclaration', () => {
      const members = [
        { name: 'Red', value: 0 },
        { name: 'Green', value: 1 }
      ];
      const enumDecl = D.enum('Color', members);
      assert.equal(enumDecl.kind, LWKind.EnumDeclaration);
      assert.equal(enumDecl.name, 'Color');
      assert.equal(enumDecl.members, members);
    });
  }
);

