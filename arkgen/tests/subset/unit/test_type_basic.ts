/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import {toArray, toInt32, toStr} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/interop"
import {Serializer} from "@arkoala/arkui/peers/Serializer"

// Boolean

it('Should write boolean undefined', function () {
    let serializer = new Serializer()
    serializer.writeBoolean(undefined)
    assert.deepEqual(toArray(serializer), [RuntimeType.UNDEFINED])
});

it('Should write boolean false', function () {
    let serializer = new Serializer()
    serializer.writeBoolean(false)
    assert.deepEqual(toArray(serializer), [0])
});

it('Should write boolean false', function () {
    let serializer = new Serializer()
    serializer.writeBoolean(true)
    assert.deepEqual(toArray(serializer), [1])
});

// Number

it('Should write number undefined', function () {
    let serializer = new Serializer()
    serializer.writeNumber(undefined)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
});

it('Should write number 128', function () {
    let serializer = new Serializer()
    serializer.writeNumber(128)
    assert.deepEqual(toArray(serializer), [Tags.INT32, ...toInt32(128)])
});

it('Should write number 0x89ABCDEF', function () {
    let serializer = new Serializer()
    serializer.writeNumber(0x89ABCDEF)
    assert.deepEqual(toArray(serializer), [Tags.INT32, ...toInt32(0x89ABCDEF)])
});

// String

it('Should write string empty', function () {
    let serializer = new Serializer()
    serializer.writeString("")
    assert.deepEqual(toArray(serializer), [...toStr("")])
});

it('Should write string abc', function () {
    let serializer = new Serializer()
    serializer.writeString("abc")
    assert.deepEqual(toArray(serializer), [...toStr("abc")])
});
