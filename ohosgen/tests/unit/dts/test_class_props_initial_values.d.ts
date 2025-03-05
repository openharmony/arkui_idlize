declare class ClassWithPrimitivePropertyType {
    flag: boolean
    counter: number
    constructor(f: boolean, c: number)
}

declare class ClassWithComplexPropertyType {
    prop: ClassWithPrimitivePropertyType
}
