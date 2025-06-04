export enum EnumWithoutInitializers {
    Value1,
    Value2,
}

export enum NumberEnum {
    Value1 = 0,
    Value2 = 1,
    Value3 = 3,
    Value4 = 8,
    Value5,
    Value6 = 13,
}

export enum StringEnum {
    Value1 = "one",
    Value2 = "two",
    Value2 = "three",
}

export namespace ns {
    export enum EnumInNamespace {
        Value1 = "one",
        Value2 = "two",
        Value2 = "three",
    }
}