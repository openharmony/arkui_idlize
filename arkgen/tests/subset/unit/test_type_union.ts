import {strict as assert} from 'assert';

import {toArray, toInt32, toStr} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/interop"
import {Serializer} from "@arkoala/arkui/peers/Serializer"

it('Should write union false', function () {
    let serializer = new Serializer()
    serializer.writeUnionInterfaceDTS({unionProp: false})
    assert.deepEqual(toArray(serializer), [RuntimeType.BOOLEAN, 0])
});

it('Should write union true', function () {
    let serializer = new Serializer()
    serializer.writeUnionInterfaceDTS({unionProp: true})
    assert.deepEqual(toArray(serializer), [RuntimeType.BOOLEAN, 1])
});

it('Should write union 0', function () {
    let serializer = new Serializer()
    serializer.writeUnionInterfaceDTS({unionProp: 0})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.NUMBER, Tags.INT32, ...toInt32(0)])
});

it('Should write union 31', function () {
    let serializer = new Serializer()
    serializer.writeUnionInterfaceDTS({unionProp: 31})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.NUMBER, Tags.INT32, ...toInt32(31)])
});

it('Should write union -17', function () {
    let serializer = new Serializer()
    serializer.writeUnionInterfaceDTS({unionProp: -17})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.NUMBER, Tags.INT32, ...toInt32(-17)])
});

it('Should write union optional undefined', function () {
    let serializer = new Serializer()
    serializer.writeUnionOptionalInterfaceDTS({unionProp: undefined})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.UNDEFINED])
});

it('Should write union optional string empty', function () {
    let serializer = new Serializer()
    serializer.writeUnionOptionalInterfaceDTS({unionProp: ""})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.STRING, ...toStr("")])
});

it('Should write union optional string abc', function () {
    let serializer = new Serializer()
    serializer.writeUnionOptionalInterfaceDTS({unionProp: "abc"})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.STRING, ...toStr("abc")])
});
