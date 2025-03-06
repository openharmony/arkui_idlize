import { BarInt } from "./bar";
import { BazInt } from "./baz";
import { FooInt } from "./foo";

declare namespace qux {
    function getIntWithFoo(foo: FooInt): number;
    function getIntWithBar(bar: BarInt, offset: number): number;
    function getIntWithBaz(baz: BazInt, offset: number, message: string): number;
}
