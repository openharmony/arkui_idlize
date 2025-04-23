export namespace test_bigint {

    interface BigIntParams {
        prime: bigint
    }
    export function test(num: bigint): bigint;
    export function test_negative(num: bigint): bigint;
    export function test_params(params: BigIntParams): BigIntParams;
    export function test_params_negative(params: BigIntParams): BigIntParams;
}
