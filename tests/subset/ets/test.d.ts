declare interface TupleInterfaceDTS {

    tuple: [number, boolean]
}

declare interface OptionInterfaceDTS {

    tuple: [boolean?, number?]
}

declare class ClassDTS extends CommonMethod<ClassDTS> {

    testTuple(value: TupleInterfaceDTS)

    testOption(value: OptionInterfaceDTS)
}