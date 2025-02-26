import { huks } from "../../generated/arkts/OHHuksMaterialized";
import { pullEvents, init } from "./compat";

function mainBody() {
    console.log('Starting demo: huks');
    huks.fooVoidVoid();
    huks.fooVoidNumber(100);
    console.log(`huks.fooNumberVoid() = ${huks.fooNumberVoid()}`);
    console.log(`huks.fooNumberNumber(200) = ${huks.fooNumberNumber(200)}`);

    console.log(`---- Begin: huks.fooResultNumber(300) ----`);
    huks.fooResultNumber(300);
    console.log(`---- Begin: huks.fooNumberOptions({}) ----`);
    huks.fooNumberOptions({});
    console.log(`---- Begin: huks.generateKeyItemSync("ASDF", {}) ----`);
    huks.generateKeyItemSync("ASDF", {});

    console.log('All cases done.');
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
