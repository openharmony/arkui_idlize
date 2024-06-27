/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import { observableProxy } from "@koalaui/arkui-common";
import { ObservableHandler } from "@koalaui/runtime";
import { propDeepCopy } from "language"
import { assert } from "chai"

suite("@Prop deep copy", () => {
    test("Complex object", () => {
        const initialNumber = 15
        const changedNumber = 25
        class A extends Set {
            private foo() {
                return initialNumber
            }
        }
        const object: any = new A()
        object.add(initialNumber)
        object.dynamicProperty = { nested: initialNumber }

        const copy = propDeepCopy(object)

        assert.equal(object.dynamicProperty.nested, copy.dynamicProperty.nested)
        assert.equal(object.has(initialNumber), copy.has(initialNumber))
        assert.equal(object.foo(), copy.foo())

        copy.delete(initialNumber)
        copy.dynamicProperty.nested = changedNumber
        copy.foo = () => { return changedNumber }

        assert.notEqual(object.dynamicProperty.nested, copy.dynamicProperty.nested)
        assert.notEqual(object.has(initialNumber), copy.has(initialNumber))
        assert.notEqual(object.foo(), copy.foo())
    })

    test("number", () => {
        const num: any = 15
        let copy = propDeepCopy(num)
        assert.equal(num, copy)

        copy += 1
        assert.notEqual(num, copy)
    })

    test("Date", () => {
        const date: Date = new Date("2023-01-01T12:00:00.000Z")
        date.setTime(date.getTime() + 5)

        const copy = propDeepCopy(date)
        assert.equal(date.getTime(), copy.getTime())

        copy.setHours(12)
        assert.notEqual(date.getTime(), copy.getTime())
    })

    test("__memo_state_observable_handler__", () => {
        const proxy = observableProxy({})
        const copy = propDeepCopy(proxy)

        assert.notEqual(proxy, copy)
        assert.isFalse(copy.hasOwnProperty('__memo_state_observable_handler__'))
        assert.notEqual(ObservableHandler.find(proxy), undefined)
        assert.equal(ObservableHandler.find(copy), undefined)
    })

    class A {
        num = 1

        constructor(num: number = 1) {
            this.num = num
        }

        inc() {
            this.incOriginal()
        }

        incOriginal() {
            this.num += 1
        }
    }

    test("Mutating method", () => {
        const a: any = new A()
        a.originalInc = a.inc

        a['inc'] = function (this, ...args: any[]) {
            this.originalInc(...args)
        }

        const propCopy = propDeepCopy(a)

        propCopy.inc()

        assert.equal(a.num, 1)
        assert.equal(propCopy.num, 2)
    })

    test("Observable proxy", () => {
        const proxy = observableProxy(new A())
        const copy = propDeepCopy(proxy)

        copy.inc()

        assert.equal(proxy.num, 1)
        assert.equal(copy.num, 2)

        proxy.inc()

        assert.equal(proxy.num, 2)
        assert.equal(copy.num, 2)
    })

    test("Date observable proxy", () => {
        const proxy = observableProxy(new Date())
        const copy = propDeepCopy(proxy)

        copy.setTime(copy.getTime() + 8504040)
        assert.isTrue(proxy.getTime() < copy.getTime())
        assert.isFalse(copy.hasOwnProperty('__memo_state_observable_handler__'))

        const observedDeepCopy = observableProxy(copy)
        observedDeepCopy.setTime(12)
        assert.isTrue(copy.getTime() == observedDeepCopy.getTime())
    })

    test("Array observable proxy", () => {
        const proxy = observableProxy([1,2,3])
        const copy = propDeepCopy(proxy)

        copy.push(15)
        assert.isTrue(proxy.length < copy.length)

        const observedDeepCopy = observableProxy(copy)
        observedDeepCopy.push(15)
        assert.isTrue(copy.length < observedDeepCopy.length)
    })

    test("Primitive type terminates", () => {
        propDeepCopy(observableProxy("hello"))
    })
})
