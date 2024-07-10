/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare interface TestInterface { 
    (): TestAttribute
}

declare interface LengthInterface { 
    str: string
    len: Length
    optLen?: Length
}

declare const Test: TestInterface

declare enum EnumDTS {
    ELEM_0 = 0,
    ELEM_1 = 1,
    ELEM_2 = 2,
}

declare interface BooleanInterfaceDTS {
    valBool: boolean
}

declare interface NumberInterfaceDTS {
    valNumber: number
}

declare interface StringInterfaceDTS {
    valString: string
}

declare interface UnionInterfaceDTS {

    unionProp: number | boolean
}

declare interface UnionOptionalInterfaceDTS {

    unionProp: string | undefined
}

declare interface TupleInterfaceDTS {

    tuple: [number, boolean]
}

declare interface TestTupleUnionInterfaceDTS {
    tuple: [number | boolean, number | StringInterfaceDTS]
}

declare interface OptionInterfaceDTS {

    tuple: [boolean?, number?]
}

declare interface OptionalTestInterface {
    optNumber?: number
    optString?: string
}

// declare interface ArrayRefNumberInterfaceDTS {

//     tuple: Array<number>
// }

// declare interface ArrayRefTuplesInterfaceDTS {

//     tuple: Array<[boolean, number]>
// }

declare class ClassDTS {
    valBoolean: boolean
}

// // Non materialized class
// declare class ClassWithConstructorDTS {

//     constructor(valNumber: number, valString: string)
// }

// // Non materialized class
// declare class ClassWithConstructorAndFieldsDTS {

//     valNumber: number
//     valBoolean: boolean

//     constructor(valNumber: number, valBoolean: boolean)
// }

// // Materialized class
// declare class ClassWithConstructorAndMethodsDTS {

//     constructor(valNumber: number, valString: string)

//     method(valNumber: number, valString: string): void
// }

// // Materialized class
// declare class ClassWithConstructorAndStaticMethodsDTS {

//     constructor(valNumber: number, valString: string)

//     static of(valNumber: number, valString: string): ClassWithConstructorAndStaticMethodsDTS
// }

// // Materialized class
// declare class ClassWithConstructorAndFieldsAndMethodsDTS {

//     valNumber: number
//     valBoolean: boolean

//     constructor(valNumber: number, valBoolean: boolean)

//     method(valNumber: number, valString: string): void
// }


// // Materialized class
// declare class ClassWithConstructorAndWithoutParamsDTS {

//     constructor()

//     static of(): ClassWithConstructorAndWithoutParamsDTS

//     method(): void
// }

// // Materialized class
// declare class ClassWithConstructorAndNonOptionalParamsDTS {

//     constructor(valNumber: number, valString: string)

//     static of(valNumber: number, valString: string): ClassWithConstructorAndNonOptionalParamsDTS

//     method(valBoolean: boolean, valString: string): void
// }

// // Materialized class
// declare class ClassWithConstructorAndSomeOptionalParamsDTS {

//     constructor(valNumber: number, valString?: string)

//     static of(valNumber: number, valString?: string): ClassWithConstructorAndSomeOptionalParamsDTS

//     method(valBoolean: boolean, valString?: string): void
// }

// // Materialized class
// declare class ClassWithConstructorAndAllOptionalParamsDTS {

//     constructor(valNumber?: number, valString?: string)

//     static of(valNumber?: number, valString?: string): ClassWithConstructorAndAllOptionalParamsDTS

//     method(valBoolean?: boolean, valString?: string): void
// }

// basic types:
// - boolean
// - number
// - string,
// - enum
// - function
//
// type | undefined    // undefined
// type1 | type2       // union
// type[]              // array
// [type1, type2]      // tuple
// [type1?, type2?]    // tuple optional
// [type1 | type2, (type3 | type 4)?]    // tuple union
// Array<type> // ArrayRef type
// Array<[type1, type2]> // ArrayRef tuple

declare class TestAttribute extends CommonMethod<TestAttribute> {

    // basic types
    testBoolean(value: boolean): TestAttribute;

    testNumber(value: number): TestAttribute;

    testString(value: string): TestAttribute;

    // testEnum(value: EnumDTS): TestAttribute

    //testFunction(value: (a: number) => boolean): TestAttribute;

    testBasicMix(v1: number, v2: string, v3: number): TestAttribute

    // undefined

    testBooleanUndefined(value: boolean | undefined): TestAttribute;

    testNumberUndefined(value: number | undefined): TestAttribute;

    testStringUndefined(value: string | undefined): TestAttribute;

    // testEnumUndefined(value: EnumDTS | undefined): TestAttribute;

    // testFunctionUndefined(value: (a: number) => boolean | undefined): TestAttribute;

    // union

    // testUnionNumberEnum(val: number | EnumDTS): TestAttribute

    testUnionBooleanString(val: boolean | string): TestAttribute

    testUnionStringNumber(val: string | number): TestAttribute

    testUnionBooleanStringNumberUndefined(val: boolean | string | number | undefined): TestAttribute

    // // array

    // testBooleanArray(value: boolean[]): TestAttribute;

    // testNumberArray(value: number[]): TestAttribute;

    // testStringArray(value: string[]): TestAttribute;

    // testEnumArray(value: EnumDTS[]): TestAttribute

    // // TBD: array of functions
    // // testFunctionArray(value: ((a: number) => boolean)[]): TestAttribute;

    // testArrayMix(v1: number[], v2: string[], v3: EnumDTS[]): TestAttribute;

    // // TBD: array of functions
    // //testArrayMix(v1: number[], v2: string[], v3: EnumDTS[], v4: ((a: number) => string)[]): TestAttribute;

    // tuple

    testTupleBooleanNumber(value: [boolean, number]): TestAttribute;

    // testTupleNumberStringEnum(value: [number, string, EnumDTS]): TestAttribute;

    // // tuple optional

    // testTupleOptional(value: [number, string, boolean, EnumDTS]): TestAttribute;

    // // tuple union

    // testTupleUnion(value: [(number | string), (boolean | EnumDTS), (string | EnumDTS | boolean)]): TestAttribute;

    // // Array<Type>

    // testArrayRefBoolean(value: Array<boolean>): TestAttribute

    // testArrayRefNumber(value: Array<number>): TestAttribute

    // // testArrayTuple(value: Array<[number, boolean]>): TestAttribute

    // // interface

    testBooleanInterface(value: BooleanInterfaceDTS): TestAttribute

    testNumberInterface(value: NumberInterfaceDTS): TestAttribute

    testStringInterface(value: StringInterfaceDTS): TestAttribute

    testUnionInterface(value: UnionInterfaceDTS): TestAttribute

    testUnionOptional(value: UnionOptionalInterfaceDTS): TestAttribute

    testTupleInterface(value: TupleInterfaceDTS): TestAttribute

    testTupleInterface(value: TestTupleUnionInterfaceDTS): TestAttribute

    testOptionInterface(value: OptionInterfaceDTS): TestAttribute

    testOptionInterface(value: OptionalTestInterface): TestAttribute

    // testArrayRefNumberInterface(value: ArrayRefNumberInterfaceDTS): TestAttribute

    // // testArrayRefTupleInterface(value: ArrayRefTuplesInterfaceDTS)


    // // Boolean Interface

    testBooleanInterfaceOption(value?: BooleanInterfaceDTS): TestAttribute

    // testBooleanInterfaceTuple(value: [BooleanInterfaceDTS]): TestAttribute

    // testBooleanInterfaceArray(value: BooleanInterfaceDTS[]): TestAttribute

    // testBooleanInterfaceArrayRef(value: Array<BooleanInterfaceDTS>): TestAttribute

    testInterfaceMixed(v1: UnionInterfaceDTS, v2: number, v3: TupleInterfaceDTS): TestAttribute

    testLen(val: LengthInterface): TestAttribute

    // // Class

    testClass(value: ClassDTS): TestAttribute

    // testClassWithConstructor(value: ClassWithConstructorDTS): TestAttribute

    // testClassWithConstructorAndFields(value: ClassWithConstructorAndFieldsDTS): TestAttribute

    // // Materialized class

    // testClassWithConstructorAndMethods(value: ClassWithConstructorAndMethodsDTS): TestAttribute

    // testClassWithConstructorAndStaticMethods(value: ClassWithConstructorAndStaticMethodsDTS): TestAttribute

    // testClassWithConstructorAndFieldsAndMethods(value: ClassWithConstructorAndFieldsAndMethodsDTS): TestAttribute

    // testClassWithConstructorAndNonOptionalParams(value: ClassWithConstructorAndNonOptionalParamsDTS): TestAttribute

    // testClassWithConstructorAndSomeOptionalParams(value: ClassWithConstructorAndSomeOptionalParamsDTS): TestAttribute

    // testClassWithConstructorAndAllOptionalParams(value: ClassWithConstructorAndAllOptionalParamsDTS): TestAttribute

    // testClassWithConstructorAndWithoutParams(value: ClassWithConstructorAndWithoutParamsDTS): TestAttribute
}
