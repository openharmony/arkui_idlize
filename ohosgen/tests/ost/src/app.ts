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


import {
    int64,
    checkEQ,
    UnitTestsuite,
} from "#compat"

import {
    PlainEnum,
    IntEnum,
    LongEnum,
    LegacyEnum,
    StringEnum,
    checkPlainEnum,
    checkIntEnum,
    checkLongEnum,
    checkLegacyEnum,
    checkStringEnum,
} from "#compat"

import {
    checkOSTSequence,
    getOSTSequenceBoolean,
    getOSTSequenceInt,
} from "#compat"

import {
    getOSTMapIntString,
    checkOSTMapIntInt,
    checkOSTMapBooleanString,
} from "#compat"

import {
    getOSTFunctionBooleanIntString
} from "#compat"

import {
    getOSTErrorBooleanInt,
    checkOSTErrorIntBoolean,
} from "#compat"

import {
    checkCallbackIntVoid,
    getCallbackIntVoid,
    getCallbackIntInt,
    checkCallbackBooleanIntString,
    getCallbackBooleanIntString,
} from "#compat"

import {
    getOSTAsyncInt,
    getOSTPromiseVoid,
    getOSTPromiseInt,
    getOSTPromiseBooleanIntString,
} from "#compat"

import { BOOL_TRUE, BOOL_FALSE, NUM_INT, NUM_NEGATIVE, STR_HELLO, STR_EMPTY } from "#compat"
import { negateBoolean, incrementInt, doubleNumber, reverseString, reverseBuffer, negateBigInt } from "#compat"
import { DataClass } from "#compat"
import { GenericBox, GenericBox2, Unbox, unboxBoolean, unboxString, unboxBox, unboxStringNumber, unboxBoxStringBoxNumber } from "#compat"
import { outer } from "#compat"
import { TestOptional, sumOptionalAttributes, idOrZero } from "#compat"
import { MultiCtors, MultiMethods } from "#compat"
import { UnionInterface, checkUnionInterface, checkUnionArg, checkGenericUnion } from "#compat"
import { BaseGesture, DerivedGesture1, DerivedGesture2, GestureType, getBaseGestureType } from "#compat"
import { Materialized, StaticMaterialized } from "#compat"

export function assertEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    checkEQ(value1, value2, comment)
}

function checkConstants() {
    assertEQ(true, BOOL_TRUE)
    assertEQ(false, BOOL_FALSE)
    assertEQ(42, NUM_INT)
    assertEQ(-17, NUM_NEGATIVE)
    assertEQ("hello", STR_HELLO)
    assertEQ("", STR_EMPTY)
}

function checkPrimitives() {
    // boolean negation
    assertEQ(false, negateBoolean(true))
    assertEQ(true, negateBoolean(false))

    // integer increment
    assertEQ(1, incrementInt(0))
    assertEQ(0, incrementInt(-1))
    assertEQ(43, incrementInt(42))

    // number doubling
    assertEQ(10, doubleNumber(5))
    assertEQ(-6, doubleNumber(-3))
    assertEQ(0, doubleNumber(0))

    // string reversal
    assertEQ("olleh", reverseString("hello"))
    assertEQ("", reverseString(""))
    assertEQ("a", reverseString("a"))

    // buffer reversal
    const buf = new ArrayBuffer(3)
    const view = new Uint8Array(buf)
    view[0] = 1
    view[1] = 2
    view[2] = 3
    const reversed = reverseBuffer(buf)
    const revView = new Uint8Array(reversed)
    assertEQ(3, revView.length)
    assertEQ(3, revView[0])
    assertEQ(2, revView[1])
    assertEQ(1, revView[2])

    // i64 negation
    assertEQ(-42 as int64, negateBigInt(42 as int64))
    assertEQ(0 as int64, negateBigInt(0 as int64))
    assertEQ(0xcaffeebabe, negateBigInt(-0xcaffeebabe))
}

function checkEnum() {
    // PlainEnum
    assertEQ(1, PlainEnum.E2)
    assertEQ(PlainEnum.E2, checkPlainEnum(PlainEnum.E3, 2))

    // IntEnum
    assertEQ(1, IntEnum.E1)
    assertEQ(IntEnum.E3, checkIntEnum(IntEnum.E1, 1))

    // LongEnum
    assertEQ(LongEnum.NEG, checkLongEnum(LongEnum.POS))

    // LegacyEnum
    assertEQ(0, LegacyEnum.FIRST)
    assertEQ(0, LegacyEnum.first)
    assertEQ(LegacyEnum.SECOND, checkLegacyEnum(LegacyEnum.FIRST, 0))

    // StringEnum
    assertEQ("two", StringEnum.S2)
    assertEQ(StringEnum.S2, checkStringEnum(StringEnum.S1, "one"))
}

function checkSequence() {
    assertEQ(0, checkOSTSequence([]))
    assertEQ(3, checkOSTSequence([3, 2, -7]))
    assertEQ(5, checkOSTSequence([3, -1, 4, 10, -7]))

    const seqBoolean = getOSTSequenceBoolean()
    assertEQ(2, seqBoolean.length)
    assertEQ(false, seqBoolean[0])
    assertEQ(true, seqBoolean[1])

    const seqInt = getOSTSequenceInt()
    assertEQ(3, seqInt.length)
    assertEQ(3, seqInt[0])
    assertEQ(5, seqInt[1])
    assertEQ(7, seqInt[2])
}

function checkMap() {
    const mapIntString = getOSTMapIntString()
    assertEQ("11", mapIntString.get(1))
    assertEQ("55", mapIntString.get(5))

    const mapIntInt = new Map<int, int>()
    mapIntInt.set(3, 33)
    mapIntInt.set(7, 77)
    checkOSTMapIntInt(mapIntInt)

    const mapBooleanString = new Map<boolean, string>()
    mapBooleanString.set(true, "true")
    mapBooleanString.set(false, "false")
    checkOSTMapBooleanString(mapBooleanString)
}

function checkFunction() {
    assertEQ("7", getOSTFunctionBooleanIntString(false, 2))
    assertEQ("15", getOSTFunctionBooleanIntString(true, 3))
}

function checkError() {
    assertEQ(17, getOSTErrorBooleanInt(false))

    let isError = false
    try {
        getOSTErrorBooleanInt(true)
    } catch(e) {
        isError = true
        assertEQ("Error: Error from getOSTErrorBooleanInt", `${e}`)
    }
    assertEQ(true, isError)

    checkOSTErrorIntBoolean(5, false)

    isError = false
    try {
        checkOSTErrorIntBoolean(7, true)
    } catch(e) {
        isError = true
        assertEQ("Error: Error from checkOSTErrorIntBoolean", `${e}`)
    }
    assertEQ(true, isError)
}

function checkCallback() {

    checkCallbackIntVoid((value: int) => {
        assertEQ(9, value)
    })

    const cbIntVoid = getCallbackIntVoid()
    cbIntVoid(2)

    const cbIntInt = getCallbackIntInt()
    assertEQ(9, cbIntInt(3))
    assertEQ(15, cbIntInt(5))

    checkCallbackBooleanIntString((flag: boolean, x: int): string => {
        assertEQ(true, flag)
        assertEQ(12, x)
        return "abc"
    })

    const cbBooleanIntString = getCallbackBooleanIntString()
    assertEQ('8', cbBooleanIntString(false, 3))
    assertEQ('20', cbBooleanIntString(true, 4))
}

function checkPromise() {
    getOSTAsyncInt()
        .then((value: int) => {
            console.log(`[App] getOSTAsyncInt value: ${value}`)
            assertEQ(7, value)
        })
    getOSTPromiseVoid()
        .then(() => {
            console.log(`[App] getOSTPromiseVoid`)
        })
    getOSTPromiseInt()
        .then((value: int) => {
            console.log(`[App] getOSTPromiseInt value: ${value}`)
            assertEQ(7, value)
        })
    getOSTPromiseBooleanIntString(true, 9)
        .then((value: string) => {
            console.log(`[App] getOSTPromiseBooleanIntString value: ${value}`)
            assertEQ("hello", value)
        })
}

function checkDataClass() {
    const instance = new DataClass()
    checkEQ(false, instance.booleanProp)
    checkEQ(0, instance.numericProp)
    checkEQ('', instance.stringProp)

    const obj = instance.objectProp
    checkEQ(false, obj.booleanValue)
    checkEQ(0, obj.numberValue)
    checkEQ('', obj.stringValue)

    const tuple = instance.tupleProp
    checkEQ(false, tuple[0])
    checkEQ(0, tuple[1])
    checkEQ('', tuple[2])
}

function checkGenerics() {
    assertEQ(true, unboxBoolean({value: true}))
    assertEQ("x y", unboxString({value: "x y"}))
    const box = unboxBox({value: {value: 16}})
    assertEQ(16, box.value)

    const in1: GenericBox2<String, number> = { value1: "choo choo", value2: -128 }
    const out1 = unboxStringNumber(in1)
    assertEQ(-128, out1.numberValue)
    assertEQ("choo choo", out1.stringValue)

    const in2: GenericBox2<GenericBox<String>, GenericBox<number>> = {
        value1: { value: "-100"},
        value2: { value: -100 },
    }
    const out2 = unboxBoxStringBoxNumber(in2)
    assertEQ(-100, out2.numberValue)
    assertEQ("-100", out2.stringValue)
}

function checkNamespaces() {
    const data: outer.OuterData = { value: 5 }
    assertEQ(5, outer.inner.getValue(data))

    const data2: outer.OuterData = { value: -10 }
    assertEQ(-10, outer.inner.getValue(data2))
}

function checkOptional() {
    // idOrZero with no argument
    assertEQ(0, idOrZero())
    // idOrZero with argument
    assertEQ(42, idOrZero(42))

    // sumOptionalAttributes without optional field
    const t1: TestOptional = { value: 10 }
    assertEQ(10, sumOptionalAttributes(t1))

    // sumOptionalAttributes with optional field
    const t2: TestOptional = { value: 10, optValue: 5 }
    assertEQ(15, sumOptionalAttributes(t2))
}

function checkUnion() {
    assertEQ(0, checkUnionArg("hello"))
    assertEQ(1, checkUnionArg(PlainEnum.E1))

    assertEQ(0, checkUnionInterface({ prop: "test" }))
    assertEQ(1, checkUnionInterface({ prop: PlainEnum.E2 }))

    assertEQ(0, checkGenericUnion("plain value"))
    const box: GenericBox<string> = { value: "boxed value" }
    assertEQ(1, checkGenericUnion(box))
    const box2: GenericBox<UnionInterface> = { value: { prop: "boxed interface" } }
    assertEQ(2, checkGenericUnion(box2))
}

function checkOverrides() {
    // Construct with name
    const c1 = new MultiCtors("Alice")
    assertEQ("Alice", c1.name)
    assertEQ(0, c1.age)

    // Construct with age
    const c2 = new MultiCtors(25)
    assertEQ("", c2.name)
    assertEQ(25, c2.age)

    // Construct with name and age
    const c3 = new MultiCtors("Bob", 30)
    assertEQ("Bob", c3.name)
    assertEQ(30, c3.age)

    // Test setters
    c3.name = "Charlie"
    assertEQ("Charlie", c3.name)
    c3.age = 35
    assertEQ(35, c3.age)

    const mm = new MultiMethods()
    assertEQ(8, mm.valueOf(8))
    assertEQ(1, mm.valueOf("8"))
    assertEQ(12, mm.valueOf(9, "ark"))
}

function checkMaterialized() {
    // Materialized class with constructor, readonly and readwrite attributes
    const m = new Materialized("hello")
    assertEQ("hello", m.readOnly)  // readOnly = string from constructor
    assertEQ(14, m.readWrite)      // always 14 no matter what
    m.readWrite = 999              // no-op setter
    assertEQ(14, m.readWrite)      // still 14

    const m2 = new Materialized("")
    assertEQ("", m2.readOnly)

    // StaticMaterialized with static reverse method
    assertEQ("olleh", StaticMaterialized.reverse("hello"))
    assertEQ("", StaticMaterialized.reverse(""))
    assertEQ("a", StaticMaterialized.reverse("a"))
}

function checkHandwrittenDeserializer() {
  const gesture = BaseGesture.createGesture2()
  assertEQ(gesture.getType(), GestureType.Second)
  assertEQ(gesture instanceof DerivedGesture2, true)
}

export function run() {

    const suite = new UnitTestsuite("idlize ost tests")
    suite.addTest("checkConstants", checkConstants)
    suite.addTest("checkPrimitives", checkPrimitives)
    suite.addTest("checkEnum", checkEnum)
    suite.addTest("checkSequence", checkSequence)
    suite.addTest("checkMap", checkMap)
    suite.addTest("checkFunction", checkFunction)
    suite.addTest("checkError", checkError)
    suite.addTest("checkCallback", checkCallback)
    suite.addTest("checkPromise", checkPromise)
    suite.addTest("checkDataClass", checkDataClass)
    suite.addTest("checkGenerics", checkGenerics)
    suite.addTest("checkNamespace", checkNamespaces)
    suite.addTest("checkOptional", checkOptional)
    suite.addTest("checkUnion", checkUnion)
    suite.addTest("checkOverride", checkOverrides)
    suite.addTest("checkMaterialized", checkMaterialized)
    suite.addTest("checkHandwrittenDeserializer", checkHandwrittenDeserializer)
    return suite.run()
}
