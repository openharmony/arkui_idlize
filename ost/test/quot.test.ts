/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { suite, test, assert } from "@koalaui/harness";
import { quot } from "../src/quot.js"
import { D, E, S, T, DD } from "../src/builders/index.js";
import { Md, Vs } from "../src/stdlib.js";
import { processNPrintTS } from "../src/printers/translators/typescript.js";

function jsonDeepEqual<T>(actual:T, expected:T): void {
    const actualJson = JSON.stringify(actual)
    const expectedJson = JSON.stringify(expected)
    assert.equal(actualJson, expectedJson, `"${actualJson}" != "${expectedJson}"`)
}

suite('Quot OST builder', () => {
    test('Quot expression', () => {
        jsonDeepEqual(
            quot.E`42`,
            E.c(42)
        )
        jsonDeepEqual(
            quot.E`($ (@self->x->toString) [])`,
            E.call(E.get(E.get(Vs.self, 'x'), 'toString'), [])
        )
        jsonDeepEqual(
            quot.E`(= (@self->x) x)`,
            E.bin('=', E.get(Vs.self, 'x'), E.v('x'))
        )
        jsonDeepEqual(
            quot.E`(= @self->0 x)`,
            E.bin('=', E.get(Vs.self, E.c(0)), E.v('x'))
        )
        jsonDeepEqual(
            quot.E`(+ 2.3 (* x 8))`,
            E.bin('+', E.c(2), E.bin('*', E.v('x'), E.c(8)))
        )
        jsonDeepEqual(
            quot.E`(- 1 2)`,
            E.bin('-', E.c(1), E.c(2))
        )
        jsonDeepEqual(
            quot.E`($ (x->foo) [1, y])`,
            E.call(E.get(E.v('x'), 'foo'), [E.c(1), E.v('y')])
        )
        jsonDeepEqual(
            quot.E`(new A [x, y])`,
            E.instance2(T.c('A'), [E.v('x'), E.v('y')])
        )
        jsonDeepEqual(
            quot.E`(static A)->foo`,
            E.get(E.type(T.c('A')), 'foo')
        )
        jsonDeepEqual(
            quot.E`(+ 1 2 3)`,
            E.bin('+', E.bin('+', E.c(1), E.c(2)), E.c(3))
        )
        jsonDeepEqual(
            quot.E`(+ "a" "b" "\\\\n")`,
            E.bin('+', E.bin('+', E.s('a'), E.s('b')), E.s('\\n'))
        )
        jsonDeepEqual(
            quot.E`"hello"`,
            E.s('hello')
        )
        jsonDeepEqual(
            quot.E`"quote \\\" inside"`,
            E.s('quote " inside')
        )
        jsonDeepEqual(
            quot.E`"backslash \\\\ inside"`,
            E.s('backslash \\ inside')
        )
    });
    test('Quot statement', () => {
        jsonDeepEqual(
            quot.S`{ 1; 2;\n return 3;\n\n }`,
            S.block([S.e(E.c(1)), S.e(E.c(2)), S.return(E.c(3))])
        )
        jsonDeepEqual(
            quot.S`var mut x: int = 42`,
            S.declaration('x', T.c('int'), true, E.c(42))
        )
        jsonDeepEqual(
            quot.S`var const x: int = 42`,
            S.declaration('x', T.c('int'), false, E.c(42))
        )
        jsonDeepEqual(
            quot.S`if condition then { s1 } else { s2 }`,
            S.if(E.v('condition'), S.block([S.e(E.v('s1'))]), S.block([S.e(E.v('s2'))]))
        )
        jsonDeepEqual(
            quot.S`while condition do { s1 }`,
            S.loop(E.v('condition'), S.block([S.e(E.v('s1'))]))
        )
    });
    test('Quot declaration', () => {
        jsonDeepEqual(
            quot.D`struct Point { x:int, y:int }`,
            D.struct('Point', [{ name: 'x', type: T.c('int') }, { name: 'y', type: T.c('int') }])
        )
        jsonDeepEqual(
            quot.D`class User { field private name:string, function static create(name:string = x): User { return (new User [name]) } }`,
            D.class('User',
                [{ name: 'name', type: T.c('string'), modifiers: [Md.private()] }],
                [DD({ modifiers: [Md.static()] }).func('create', [{ name: 'name', type: T.c('string'), expression: E.v('x') }], T.c('User'), S.block([S.return(E.instance2(T.c('User'), [E.v('name')]))]))]
            )
        )
        jsonDeepEqual(
            quot.D`function sum(x:int, y:int): int { return (+ x y) }`,
            D.func('sum', [{ name: 'x', type: T.c('int') }, { name: 'y', type: T.c('int') }], T.c('int'), S.block([S.return(E.bin('+', E.v('x'), E.v('y')))]))
        )
    });
    test('Quot type', () => {
        jsonDeepEqual(
            quot.T`A.B.C`,
            T.c('A.B.C')
        )
        jsonDeepEqual(
            quot.T`int`,
            T.c('int')
        )
        jsonDeepEqual(
            quot.T`A<B, C>`,
            T.c('A', T.c('B'), T.c('C'))
        )
        jsonDeepEqual(
            quot.T`(a:A, b:B) -> C`,
            T.fn([['a', T.c('A')], ['b', T.c('B')]], T.c('C'))
        )
    });
    test('Special parsers', () => {
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
    });
});

