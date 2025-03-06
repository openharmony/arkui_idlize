import { pullEvents, init } from "./compat";
import * as huks from '../../generated/arkts/GlobalScope';

function mainBody() {
    console.log('Starting demo: huks');
    huks.fooVoidVoid();
    huks.fooVoidNumber(100);
    console.log(`fooNumberVoid() = ${huks.fooNumberVoid()}`);
    console.log(`fooNumberNumber(200) = ${huks.fooNumberNumber(200)}`);

    console.log(`---- Begin: fooResultNumber(300) ----`);
    huks.fooResultNumber(300);
    console.log(`---- Begin: fooNumberOptions({}) ----`);
    huks.fooNumberOptions({});
    console.log(`---- Begin: generateKeyItemSync("ASDF", {}) ----`);
    huks.generateKeyItemSync("ASDF", {});

    console.log('All cases done.');
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
