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

package idlize

import std.time.DateTime
import std.math.round

func checkPerf(count: Int64) {
    var start = DateTime.now().nanosecond
    for (i in 0..count) {
        NativeModule._TestPerfNumber(Int32(i))
    }
    var passed = DateTime.now().nanosecond - start
    println("NUMBER: ${Float64(passed) / 1000000.0}ms for ${count} iteration, ${round(Float64(passed) / Float64(count))}ms per 1M iterations")

    start = DateTime.now().nanosecond
    for (i in 0..count) {
        var data = Array<?Int8>(5, item: 0)
        data[0] = 1
        data[1] = (i >> 24) as Int8
        data[2] = (i >> 16) as Int8
        data[3] = (i >> 8) as Int8
        data[4] = (i >> 0) as Int8
        // NativeModule._TestPerfNumberWithArray(data, data.length)
    }
    passed = DateTime.now().nanosecond - start
    println("ARRAY: ${Float64(passed) / 1000000.0}ms for ${count} iteration, ${Int32(round(Float64(passed) / Float64(count)))}ms per 1M iterations")
}

func checkPerf2(count: Int64) {
        var peer = ArkBlankPeer.create(ArkUINodeType.Root, None<ComponentBase>, 0)
        var start = DateTime.now().nanosecond
        for (i in 0..count) {
            if (i % 2 == 0) {
                peer.backdropBlurAttribute(Float64(i), Option.None)
            }
            else {
                let options: BlurOptions = BlurOptions(Tuple_Float64_Float64(1.0, 2.0))                
                peer.backdropBlurAttribute(Float64(i), options);
            }
        }
        var passed = DateTime.now().nanosecond - start;
        println("backdropBlur: ${passed} ns for ${count} iteration,  ${Int32(round(Float64(passed) / Float64(count)))} ms per 1M iterations");
    }


main(): Unit {
    checkPerf(5 * 1000 * 1000)
    checkPerf2(1)
}