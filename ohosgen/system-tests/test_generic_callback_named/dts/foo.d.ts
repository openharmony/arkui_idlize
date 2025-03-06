import { Callback } from "./interfaces/callback";

export class Foo {
    getValue(): number;
    call(cb: Callback<string>): void;
}
