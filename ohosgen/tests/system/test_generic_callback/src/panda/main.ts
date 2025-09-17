import { pullEvents, init, Foo, Callback } from "./compat";
// import { Callback } from "../../dts/interfaces/callback";

function mainBody() {
    console.log('Starting demo: test_generic_callback');
    const cb: Callback<number> = (x: number) => {
        console.log(`Callback invoked From TS: x = ${x}`);
    };
    const cbVoid: Callback<void> = (x: undefined) => {
        console.log(`Void callback invoked From TS: x = ${x}`);
    };
    const foo = new Foo();
    console.log(`foo.getX() = ${foo.getX()}`);

    foo.callCB(42, cb);
    foo.callCBVoid(cbVoid)
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
