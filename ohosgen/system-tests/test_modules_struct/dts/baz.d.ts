import { BarInt } from "./bar";
import { FooInt } from "./foo";

declare namespace baz {
    function getIntWithFoo(foo: FooInt): number;
    function getIntWithBar(bar: BarInt): number;
}
