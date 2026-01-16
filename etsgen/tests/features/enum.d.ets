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

export enum BinaryEnum {
    Value0 = 0b0,
    Value1 = 0B1,
    Value101 = 0b101,
    Value1001 = 0B1001,
}

export enum HexEnum {
    Value0 = 0x0,
    Value1 = 0X1,
    ValueAB = 0xAB,
    ValueCD = 0XCD,
    ValueFFFFFFFF = 0xFFFFFFFF,
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