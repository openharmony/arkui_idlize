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

declare interface OptionInterfaceDTS {

    tuple: [boolean?, number?]
}

declare interface ArrayRefNumberInterfaceDTS {

    tuple: Array<number>
}

declare interface ArrayRefTuplesInterfaceDTS {

    tuple: Array<[boolean, number]>
}

declare class ClassDTS {

    valBoolean: boolean
}

// Non materialized class
declare class ClassWithConstructorDTS {

    constructor(valNumber: number, valString: string)
}

// Non materialized class
declare class ClassWithConstructorAndFieldsDTS {

    valNumber: number
    valBoolean: boolean

    constructor(valNumber: number, valBoolean: boolean)
}

// Materialized class
declare class ClassWithConstructorAndMethodsDTS {

    constructor(valNumber: number, valString: string)

    method(valNumber: number, valString: string): void
}

// Materialized class
declare class ClassWithConstructorAndStaticMethodsDTS {

    constructor(valNumber: number, valString: string)

    static of(valNumber: number, valString: string): ClassWithConstructorAndStaticMethodsDTS
}

// Materialized class
declare class ClassWithConstructorAndFieldsAndMethodsDTS {

    valNumber: number
    valBoolean: boolean

    constructor(valNumber: number, valBoolean: boolean)

    method(valNumber: number, valString: string): void
}


// Materialized class
declare class ClassWithConstructorAndWithoutParamsDTS {

    constructor()

    static of(): ClassWithConstructorAndWithoutParamsDTS

    method(): void
}

// Materialized class
declare class ClassWithConstructorAndNonOptionalParamsDTS {

    constructor(valNumber: number, valString: string)

    static of(valNumber: number, valString: string): ClassWithConstructorAndNonOptionalParamsDTS

    method(valBoolean: boolean, valString: string): void
}

// Materialized class
declare class ClassWithConstructorAndSomeOptionalParamsDTS {

    constructor(valNumber: number, valString?: string)

    static of(valNumber: number, valString?: string): ClassWithConstructorAndSomeOptionalParamsDTS

    method(valBoolean: boolean, valString?: string): void
}

// Materialized class
declare class ClassWithConstructorAndAllOptionalParamsDTS {

    constructor(valNumber?: number, valString?: string)

    static of(valNumber?: number, valString?: string): ClassWithConstructorAndAllOptionalParamsDTS

    method(valBoolean?: boolean, valString?: string): void
}

declare interface Test1Interface { 
    (): Test1Attribute
}
declare const Test1: Test1Interface

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
declare class Test1Attribute extends CommonMethod<Test1Attribute> {

    // basic types
    testBoolean(value: boolean): Test1Attribute;

    testNumber(value: number): Test1Attribute;

    testString(value: string): Test1Attribute;

    testEnum(value: EnumDTS): Test1Attribute

    testFunction(value: (a: number) => boolean): Test1Attribute;

    testBasicMix(v1: number, v2: string, v3: number): Test1Attribute

    // undefined

    testBooleanUndefined(value: boolean | undefined): Test1Attribute;

    testNumberUndefined(value: number | undefined): Test1Attribute;

    testStringUndefined(value: string | undefined): Test1Attribute;

    testEnumUndefined(value: EnumDTS | undefined): Test1Attribute;

    testFunctionUndefined(value: (a: number) => boolean | undefined): Test1Attribute;

    // union

    testUnionNumberEnum(val: number | EnumDTS): Test1Attribute

    testUnionBooleanString(val: boolean | string): Test1Attribute

    testUnionStringNumber(val: string | number): Test1Attribute

    testUnionBooleanStringNumberUndefined(val: boolean | string | number | undefined): Test1Attribute

    testUnionWithGenericArray(value: number | Array<string>): Test1Attribute;

    testUnionWithArrayType(value: number | string[]): Test1Attribute;

    // array

    testBooleanArray(value: boolean[]): Test1Attribute;

    testNumberArray(value: number[]): Test1Attribute;

    testStringArray(value: string[]): Test1Attribute;

    testEnumArray(value: EnumDTS[]): Test1Attribute

    // TBD: array of functions
    // testFunctionArray(value: ((a: number) => boolean)[]): Test1Attribute;

    testArrayMix(v1: number[], v2: string[], v3: EnumDTS[]): Test1Attribute;

    // TBD: array of functions
    //testArrayMix(v1: number[], v2: string[], v3: EnumDTS[], v4: ((a: number) => string)[]): Test1Attribute;

    // tuple

    testTupleBooleanNumber(value: [boolean, number]): Test1Attribute;

    testTupleNumberStringEnum(value: [number, string, EnumDTS]): Test1Attribute;

    // tuple optional

    testTupleOptional(value: [number, string, boolean, EnumDTS]): Test1Attribute;

    // tuple union

    testTupleUnion(value: [(number | string), (boolean | EnumDTS), (string | EnumDTS | boolean)]): Test1Attribute;

    // Array<Type>

    testArrayRefBoolean(value: Array<boolean>): Test1Attribute

    testArrayRefNumber(value: Array<number>): Test1Attribute

    // testArrayTuple(value: Array<[number, boolean]>): Test1Attribute

    // interface

    testBooleanInterface(value: BooleanInterfaceDTS): Test1Attribute

    testNumberInterface(value: NumberInterfaceDTS): Test1Attribute

    testStringInterface(value: StringInterfaceDTS): Test1Attribute

    testUnionInterface(value: UnionInterfaceDTS): Test1Attribute

    testUnionOptional(value: UnionOptionalInterfaceDTS): Test1Attribute

    testTupleInterface(value: TupleInterfaceDTS): Test1Attribute

    testOptionInterface(value: OptionInterfaceDTS): Test1Attribute

    testArrayRefNumberInterface(value: ArrayRefNumberInterfaceDTS): Test1Attribute

    // testArrayRefTupleInterface(value: ArrayRefTuplesInterfaceDTS)


    // Boolean Interface

    testBooleanInterfaceOption(value?: BooleanInterfaceDTS): Test1Attribute
    // leads to es2panda segmentation fault
    // testBooleanInterfaceTuple(value: [BooleanInterfaceDTS]): Test1Attribute

    testBooleanInterfaceArray(value: BooleanInterfaceDTS[]): Test1Attribute

    testBooleanInterfaceArrayRef(value: Array<BooleanInterfaceDTS>): Test1Attribute

    testInterfaceMixed(v1: UnionInterfaceDTS, v2: number, v3: TupleInterfaceDTS): Test1Attribute

    // Class

    testClass(value: ClassDTS): Test1Attribute

    testClassWithConstructor(value: ClassWithConstructorDTS): Test1Attribute

    testClassWithConstructorAndFields(value: ClassWithConstructorAndFieldsDTS): Test1Attribute

    // Materialized class

    testClassWithConstructorAndMethods(value: ClassWithConstructorAndMethodsDTS): Test1Attribute

    testClassWithConstructorAndStaticMethods(value: ClassWithConstructorAndStaticMethodsDTS): Test1Attribute

    testClassWithConstructorAndFieldsAndMethods(value: ClassWithConstructorAndFieldsAndMethodsDTS): Test1Attribute

    testClassWithConstructorAndNonOptionalParams(value: ClassWithConstructorAndNonOptionalParamsDTS): Test1Attribute

    testClassWithConstructorAndSomeOptionalParams(value: ClassWithConstructorAndSomeOptionalParamsDTS): Test1Attribute

    testClassWithConstructorAndAllOptionalParams(value: ClassWithConstructorAndAllOptionalParamsDTS): Test1Attribute

    testClassWithConstructorAndWithoutParams(value: ClassWithConstructorAndWithoutParamsDTS): Test1Attribute
}