import { pullEvents, init, Foo } from "./compat";
// import { Callback } from "../../dts/interfaces/callback";

function mainBody() {
    console.log('Starting demo: test_generic_callback');
    const cb /* : Callback<number> */ = (x: number) => {
        console.log(`Callback invoked From TS: x = ${x}`);
    };
    const foo = new Foo();
    console.log(`foo.getX() = ${foo.getX()}`);
    foo.callCB(42, cb);
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
