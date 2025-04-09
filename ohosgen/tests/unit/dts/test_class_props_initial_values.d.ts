export class ClassWithPrimitivePropertyType {
    flag: boolean
    counter: number
    constructor(f: boolean, c: number)
}

export class ClassWithComplexPropertyType {
    prop: ClassWithPrimitivePropertyType
}
