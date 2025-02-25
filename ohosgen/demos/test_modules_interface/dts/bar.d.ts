import { IFooInt } from "./interfaces/foo";

declare namespace bar {
    function getIntWithFoo(x: number, foo: IFooInt): number;
}
