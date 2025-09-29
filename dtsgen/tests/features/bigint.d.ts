export interface InterfaceWithBigInt {
    prop: BigInt
}

export class ClassWithBigInt {
    prop: BigInt
    method(value: BigInt): BigInt
}