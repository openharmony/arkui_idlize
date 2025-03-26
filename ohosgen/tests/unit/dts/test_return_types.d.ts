
interface test_ret_A { field: number }
interface test_ret_B { action(): number }

declare namespace test_return_types {

    ///

    function returnNothing(): void
    function returnNumber(): number
    function returnBoolean(): boolean
    function returnBitInt(): bigint
    function returnString(): string
    function returnInterface(): test_ret_A
    function returnMaterialized(): test_ret_B
    function returnNumberArray(): number[]
    function returnStringArray(): string[]
    function returnInterfaceArray(): test_ret_A[]
    function returnMaterializedArray(): test_ret_B[]
}
