
export interface test_ret_A { field: number }
export interface test_ret_B { action(): number }

export namespace test_return_types {

    ///

    export function returnNothing(): void
    export function returnNumber(): number
    export function returnBoolean(): boolean
    export function returnBitInt(): bigint
    export function returnString(): string
    export function returnInterface(): test_ret_A
    export function returnMaterialized(): test_ret_B
    export function returnNumberArray(): number[]
    export function returnStringArray(): string[]
    export function returnInterfaceArray(): test_ret_A[]
    export function returnMaterializedArray(): test_ret_B[]
}
