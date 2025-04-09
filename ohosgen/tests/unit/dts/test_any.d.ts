
export namespace test_any {
    export interface WithAny {
        field: any
        normal: number
    }
    export function test(x:WithAny, f:(x:any) => void):void
}
