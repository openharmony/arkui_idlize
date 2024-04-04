
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

declare interface TupleInterfaceDTS {

    tuple: [number, boolean]
}

declare interface OptionInterfaceDTS {

    tuple: [boolean?, number?]
}

declare class ClassDTS extends CommonMethod<ClassDTS> {

    testBoolean(value: BooleanInterfaceDTS)

    testNumber(value: NumberInterfaceDTS)

    testEnum(value: EnumDTS)

    testTuple(value: TupleInterfaceDTS)

    testOption(value: OptionInterfaceDTS)
}