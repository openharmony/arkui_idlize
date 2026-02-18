/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {strict as assert} from 'assert';

import {toArray, toInt32} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/interop"
import {Serializer} from "@arkoala/arkui/peers/Serializer"

it('Should write tuple [0, false]', function () {
    let serializer = new Serializer()
    serializer.writeTupleInterfaceDTS({tuple: [0, false]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, Tags.INT32, ...toInt32(0), 0])
});

it('Should write tuple [0, true]', function () {
    let serializer = new Serializer()
    serializer.writeTupleInterfaceDTS({tuple: [0, true]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, Tags.INT32, ...toInt32(0), 1])
});

it('Should write tuple [10, false]', function () {
    let serializer = new Serializer()
    serializer.writeTupleInterfaceDTS({tuple: [10, false]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, Tags.INT32, ...toInt32(10), 0])
});

it('Should write tuple with optional values [undefined, undefined]', function () {
    let serializer = new Serializer()
    serializer.writeOptionInterfaceDTS({tuple: [undefined, undefined]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, RuntimeType.UNDEFINED, RuntimeType.UNDEFINED])
});

it('Should write tuple with optional values [false, undefined]', function () {
    let serializer = new Serializer()
    serializer.writeOptionInterfaceDTS({tuple: [false, undefined]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, RuntimeType.BOOLEAN, 0, RuntimeType.UNDEFINED])
});

it('Should write tuple with optional values [undefined, 11]', function () {
    let serializer = new Serializer()
    serializer.writeOptionInterfaceDTS({tuple: [undefined, 11]})
    // console.log(`golden: ${[Tags.OBJECT, RuntimeType.OBJECT, RuntimeType.UNDEFINED, RuntimeType.NUMBER, ...toInt32(11)]}`)
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, RuntimeType.UNDEFINED, RuntimeType.NUMBER, Tags.INT32, ...toInt32(11)])
});

it('Should write tuple with optional values [false, 0]', function () {
    let serializer = new Serializer()
    serializer.writeOptionInterfaceDTS({tuple: [false, 0]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, RuntimeType.BOOLEAN, 0, RuntimeType.NUMBER, Tags.INT32, ...toInt32(0)])
});

it('Should write tuple with optional values [true, 12]', function () {
    let serializer = new Serializer()
    serializer.writeOptionInterfaceDTS({tuple: [true, 12]})
    assert.deepEqual(toArray(serializer),
        [RuntimeType.OBJECT, RuntimeType.BOOLEAN, 1, RuntimeType.NUMBER, Tags.INT32, ...toInt32(12)])
});
