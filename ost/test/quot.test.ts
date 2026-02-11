import { assertEquals, describe, runTestSuite } from "./test-utils.js";
import { quot } from "../src/quot.js"
import { D, E, S, T } from "../src/builders/index.js";
import { Md, Vs } from "../src/stdlib.js";
import { processNPrintTS } from "../src/printers/translators/typescript.js";

const quotTest = describe('Quot OST builder', [
    {
        name: 'Quot expression',
        fn: () => {
            assertEquals(
                quot.E`42`,
                E.c(42)
            )
            assertEquals(
                quot.E`(= (@self->x) x)`,
                E.bin('=', E.get(Vs.self, 'x'), E.v('x'))
            )
            assertEquals(
                quot.E`(+ 2 (* x 8))`,
                E.bin('+', E.c(2), E.bin('*', E.v('x'), E.c(8)))
            )
            assertEquals(
                quot.E`($ (x->foo) [1, y])`,
                E.call(E.get(E.v('x'), 'foo'), [E.c(1), E.v('y')])
            )
            assertEquals(
                quot.E`(new A [x, y])`,
                E.instance2(T.c('A'), [E.v('x'), E.v('y')])
            )
            assertEquals(
                quot.E`(static A)->foo`,
                E.get(E.type(T.c('A')), 'foo')
            )
        }
    },
    {
        name: 'Quot statement',
        fn: () => {
            assertEquals(
                quot.S`{ 1; 2;\n return 3;\n\n }`,
                S.block([S.e(E.c(1)), S.e(E.c(2)), S.return(E.c(3))])
            )
            assertEquals(
                quot.S`var mut x: int = 42`,
                S.declaration('x', T.c('int'), true, E.c(42))
            )
            assertEquals(
                quot.S`var const x: int = 42`,
                S.declaration('x', T.c('int'), false, E.c(42))
            )
            assertEquals(
                quot.S`if condition then { s1 } else { s2 }`,
                S.if(E.v('condition'), S.block([S.e(E.v('s1'))]), S.block([S.e(E.v('s2'))]))
            )
            assertEquals(
                quot.S`while condition do { s1 }`,
                S.loop(E.v('condition'), S.block([S.e(E.v('s1'))]))
            )
        }
    },
    {
        name: 'Quot declaration',
        fn: () => {
            assertEquals(
                quot.D`struct Point { x:int, y:int }`,
                D.struct('Point', [{ name: 'x', type: T.c('int') }, { name: 'y', type: T.c('int') }])
            )
            assertEquals(
                quot.D`class User { field private name:string, function static create(name:string): User { return (new User [name]) } }`,
                D.class('User',
                    [{ name: 'name', type: T.c('string'), modifiers: [Md.private()] }],
                    [D.func('create', [{ name: 'name', type: T.c('string') }], T.c('User'), S.block([S.return(E.instance2(T.c('User'), [E.v('name')]))]))]
                )
            )
            assertEquals(
                quot.D`function sum(x:int, y:int): int { return (+ x y) }`,
                D.func('sum', [{ name: 'x', type: T.c('int') }, { name: 'y', type: T.c('int') }], T.c('int'), S.block([S.return(E.bin('+', E.v('x'), E.v('y')))]))
            )
        }
    },
    {
        name: 'Quot type',
        fn: () => {
            assertEquals(
                quot.T`A.B.C`,
                T.c('A.B.C')
            )
            assertEquals(
                quot.T`int`,
                T.c('int')
            )
            assertEquals(
                quot.T`A<B, C>`,
                T.c('A', T.c('B'), T.c('C'))
            )
            assertEquals(
                quot.T`(a:A, b:B) -> C`,
                T.fn([['a', T.c('A')], ['b', T.c('B')]], T.c('C'))
            )
        }
    },
    {
        name: 'Special parsers',
        fn: () => {
            const decl = D.class('FontStyle.FontStyle', [], [])
            quot.appendField(decl)`
                field static BOLD:FontStyle.FontStyle =
                    (new FontStyle.FontStyle [
                        (static FontWeight.FontWeight)->BOLD,
                        (static FontWidth.FontWidth)->NORMAL,
                        (static FontSlant.FontSlant)->UPRIGHT
                    ])
            `
            quot.appendMethod(decl)`
                function intersects(other: Rect.Rect): boolean {
                return (! (
                    (|| (<= @self->right other->left)
                    (|| (>= @self->left other->right)
                    (|| (<= @self->bottom other->top)
                        (>= @self->top other->bottom)
                )))))
                }
            `
            console.log(processNPrintTS(decl, '', new Set()))
        }
    }
])

// Run test suite
console.log('Running tests for quot builder...\n');

const allPassed = runTestSuite(quotTest);

console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed.'));
process.exit(allPassed ? 0 : 1);
