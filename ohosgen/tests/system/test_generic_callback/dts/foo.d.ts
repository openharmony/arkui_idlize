import { Callback } from "./interfaces/callback";

export class Foo {
    getX(): number;
    callCB(y: number, cb: Callback<number>): void;
}
