import { Callback } from "./interfaces/callback";

export type Callback<T> = (value: T) => void

export class Foo {
    getX(): number;
    callCB(y: number, cb: Callback<number>): void;
    callCBVoid(cb: Callback<void>): void;
}
