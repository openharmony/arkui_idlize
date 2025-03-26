
declare namespace test_any {
    interface WithAny {
        field: any
        normal: number
    }
    function test(x:WithAny, f:(x:any) => void):void
}
