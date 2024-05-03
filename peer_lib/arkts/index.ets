/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { NativeModule } from "./NativeModule" 

/*
V8:
NUMBER: 111.8373319990933ms for 1000000 iteration, 112ms per 1M iterations
ARRAY: 955.3288690000772ms for 1000000 iteration, 955ms per 1M iterations

PANDA:
"NUMBER: 1317ms for 10000000 iteration, 132ms per 1M iterations"
"ARRAY: 4264ms for 10000000 iteration, 426ms per 1M iterations"

JVM:
NUMBER: 162ms for 10000000 iteration, 16ms per 1M iterations
ARRAY: 241ms for 10000000 iteration, 24ms per 1M iterations
*/
function checkPerf(count: number) {
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        NativeModule._TestPerfNumber(i)
    }
    let passed = Date.now() - start
    console.log(`NUMBER: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)

    start = Date.now()
    for (let i = 0; i < count; i++) {
        let data = new byte[5]
        data[0] = 1
        data[1] = (i >> 24) as byte
        data[2] = (i >> 16) as byte
        data[3] = (i >> 8) as byte
        data[4] = (i >> 0) as byte
        NativeModule._TestPerfNumberWithArray(data, data.length)
    }
    passed = Date.now() - start
    console.log(`ARRAY: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

export function main(): void {
    checkPerf(100000)
}