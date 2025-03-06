import { FooInt } from "./foo";

declare namespace bar {
    function getIntWithFoo(foo: FooInt): number;
}
