
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

declare class ClassDTS extends CommonMethod<ClassDTS> {

    testUnionOptional(value: UnionOptionalInterfaceDTS)

    testArray(value: Array<number>)
}

declare class TestAttribute extends CommonMethod<TestAttribute> {

    testBoolean(value: boolean): TestAttribute;

    testNumber(value: number): TestAttribute;

    testArray(value: [number]): TestAttribute;

    testString(value: string): TestAttribute;

    testUnion(val: boolean | string): TestAttribute

    testUnionUndefined(val: number | undefined): TestAttribute

    testTuple(value: [number, string]): TestAttribute;

    testTupleOptional(value: [number?, string?]): TestAttribute;

    testMixed(v1: number, v2: boolean, v3: string): TestAttribute;

    testBooleanInterface(value: BooleanInterfaceDTS): Attribute

    testNumberInterface(value: NumberInterfaceDTS): Attribute

    testStringInterface(value: StringInterfaceDTS)

    testEnum(value: EnumDTS)

    testUnionInterface(value: UnionInterfaceDTS)

    testUnionOptional(value: UnionOptionalInterfaceDTS)

    testTupleInterface(value: TupleInterfaceDTS)

    testOptionInterface(value: OptionInterfaceDTS)

    testInterfaceMixed(v1: UnionInterfaceDTS, v2: number, v3: TupleInterfaceDTS)
}