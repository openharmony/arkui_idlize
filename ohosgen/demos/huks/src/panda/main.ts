import { fooNumberNumber, fooNumberOptions, fooNumberVoid, fooResultNumber, fooVoidNumber, fooVoidVoid, generateKeyItemSync } from "../../generated/arkts/GlobalScope";
import { pullEvents, init } from "./compat";

function mainBody() {
    console.log('Starting demo: huks');
    fooVoidVoid();
    fooVoidNumber(100);
    console.log(`huks.fooNumberVoid() = ${fooNumberVoid()}`);
    console.log(`huks.fooNumberNumber(200) = ${fooNumberNumber(200)}`);

    console.log(`---- Begin: huks.fooResultNumber(300) ----`);
    fooResultNumber(300);
    console.log(`---- Begin: huks.fooNumberOptions({}) ----`);
    fooNumberOptions({});
    console.log(`---- Begin: huks.generateKeyItemSync("ASDF", {}) ----`);
    generateKeyItemSync("ASDF", {});

    console.log('All cases done.');
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
