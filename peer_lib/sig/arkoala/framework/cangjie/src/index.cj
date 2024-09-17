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
import std.collection.*

func checkPerf(count: Int64) {
    var start = DateTime.now().nanosecond
    for (i in 0..count) {
        NativeModule._TestPerfNumber(Int32(i))
    }
    var passed = DateTime.now().nanosecond - start
    println("NUMBER: ${Float64(passed) / 1000000.0}ms for ${count} iteration, ${round(Float64(passed) / Float64(count))}ms per 1M iterations")

    start = DateTime.now().nanosecond
    for (i in 0..count) {
        var data = ArrayList<UInt8>()
        data.append(1)
        data.append(UInt8((i >> 0 ) & (0xff)))
        data.append(UInt8((i >> 8 ) & (0xff)))
        data.append(UInt8((i >> 16 ) & (0xff)))
        data.append(UInt8((i >> 24 ) & (0xff)))
        NativeModule._TestPerfNumberWithArray(data, Int32(data.size))
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

func checkPerf3(count: Int32): Unit {
    var peer = ArkButtonPeer.create(ArkUINodeType.Button, None<ComponentBase>, 0)
    var testLength_10_lpx = Ark_Length("10lpx")
    let start = DateTime.now().nanosecond
    for (i in 0..count) {
        peer.widthAttribute(testLength_10_lpx);
    }
    let passed = DateTime.now().nanosecond - start;
    println("widthAttributeString: ${passed} ms for ${count} iteration")
}


main(): Unit {
    checkPerf(5 * 1000 * 1000)
    checkPerf2(100)
    checkPerf3(100)
}