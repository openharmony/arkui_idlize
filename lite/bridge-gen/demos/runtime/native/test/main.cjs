/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

const { RawMemory, SerializerBase } = require("../bundled/npm");

function simple() {
    const memory = RawMemory.allocate();
    const encoder = SerializerBase.use(memory);
    encoder.writeInt32(1);
    encoder.writeInt32(2);
    encoder.writeInt32(3);
    encoder.writeInt32(4);
    encoder.writeInt32(5);
    encoder.writeUInt8(100);
    encoder.writeString("HELLO STRING");
    const decoder = encoder.swap();
    console.log("=>", decoder.readInt32()); // 1
    console.log("=>", decoder.readInt32()); // 2
    console.log("=>", decoder.readInt32()); // 3
    console.log("=>", decoder.readInt32()); // 4
    console.log("=>", decoder.readInt32()); // 5
    console.log("=>", decoder.readUInt8()); // 100
    console.log("=>", decoder.readString()); // HELLO STRING
    memory.free();
}
function stack() {
    const m1 = RawMemory.allocate();
    const m2 = RawMemory.allocate();
    const m3 = RawMemory.allocate();
    for (const mem of [m1, m2, m3]) {
        const encoder = SerializerBase.use(mem);
        for (let i = 1; i < 10; ++i) {
            encoder.writeInt32(i);
        }
        encoder.writeInt32(0);
        const decoder = encoder.swap();
        while (true) {
            const item = decoder.readInt32();
            if (item == 0) {
                break;
            }
            console.log('=>', item);
        }
    }
    m3.free();
    m2.free();
    m1.free();
}

function test(f) {
    console.log('__', f.name);
    f();
}
function main() {
    test(simple);
    test(stack);
}
main();
