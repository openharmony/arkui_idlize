import { pullEvents, init } from "./compat";
import { Foo, FooResult } from '../../generated/arkts';

function mainBody() {
    const foo: Foo = new Foo();
    const props = foo.getProps();
    console.log('foo.getProps() done. Let props be the result:');
    for (const kvPair of props.entries()) {
        console.log(`  props["${kvPair[0]}"] = ${kvPair[1]}`);
    }

    const res = foo.getResult();
    console.log(`foo.getResult() done with res.index = ${res.index}. Let res be the result:`);
    for (const kvPair of res.props.entries()) {
        console.log(`  res.props["${kvPair[0]}"] = ${kvPair[1]}`);
    }
}

export function main() {
    init();
    mainBody();
    pullEvents();
}