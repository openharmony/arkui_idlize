export interface ShortValue {}
export interface VeryVeryLongValue1 {}
export interface VeryVeryLongValue2 {}
export interface VeryVeryLongValue3 {}
export interface VeryVeryLongValue4 {}
export interface VeryVeryLongValue5 {}
export interface VeryVeryLongValue6 {}
export interface VeryVeryLongValue7 {}

export interface Iface {
    foo6(cb: (value: ShortValue) => void)
    foo1(cb: (value: VeryVeryLongValue1) => void)
    foo2(cb: (value: VeryVeryLongValue1 | VeryVeryLongValue2) => void)
    foo3(cb: (value: VeryVeryLongValue1 | VeryVeryLongValue2 | VeryVeryLongValue3) => void)
    foo4(cb: (value: VeryVeryLongValue1 | VeryVeryLongValue2 | VeryVeryLongValue3 | VeryVeryLongValue4) => void)
    foo5(cb: (value: VeryVeryLongValue1 | VeryVeryLongValue2 | VeryVeryLongValue3 | VeryVeryLongValue4 | VeryVeryLongValue5) => void)
    get getterSuggestor(): (value: VeryVeryLongValue1 | VeryVeryLongValue2 | VeryVeryLongValue3 | VeryVeryLongValue4 | VeryVeryLongValue5) => void
    set setterSuggestor(cb: (value: VeryVeryLongValue1 | VeryVeryLongValue2 | VeryVeryLongValue3 | VeryVeryLongValue4 | VeryVeryLongValue5) => void)
    static staticSuggestor(cb: (value: VeryVeryLongValue1 | VeryVeryLongValue2 | VeryVeryLongValue3 | VeryVeryLongValue4 | VeryVeryLongValue5) => void)
    tupleSuggestor(value: [VeryVeryLongValue1, VeryVeryLongValue1, VeryVeryLongValue1, VeryVeryLongValue1, VeryVeryLongValue1])
}