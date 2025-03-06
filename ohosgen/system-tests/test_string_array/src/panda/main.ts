import { pullEvents, init, Foo, FooResult } from "./compat";

function mainBody() {
    console.log('Starting demo: test_string_array');
    const foo: Foo = new Foo();
    console.log(`foo.getString() = ${foo.getString()}`);

    const resObj = foo.getResult();
    console.log(`foo.getResult() done. Let resObj be the result:`);
    console.log(`  resObj.index = ${resObj.index}`);
    console.log(`  resObj.title = ${resObj.title}`);
    console.log(`  resObj.list:`);
    for (let i = 0; i < resObj.list.length; i++) {
        console.log(`    resObj.list[${i}] = ${resObj.list[i]}`);
    }

    const strList = foo.getStringList();
    console.log(`foo.getStringList() done. Let strList be the result:`);
    for (let i = 0; i < strList.length; i++) {
        console.log(`  strList[${i}] = ${strList[i]}`);
    }
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
