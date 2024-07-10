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

package org.koalaui.arkoala;

public class Main {
    public static void main(String[] args) {
        long str = NativeModule._StringMake("Hello");
        System.out.println(NativeModule._StringLength(str));
        //Main.checkPerf(10*1000*1000);
        //NativeModule._StartGroupedLog(1);
        Main.checkPerf2(5*1000*1000);
        Main.checkPerf3(5*1000*1000);
        Main.checkPeers();
        //NativeModule._StopGroupedLog(1);
    }

    static void checkPerf(int count) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            NativeModule._TestPerfNumber(i);
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("NUMBER: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");

        start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            byte[] data = new byte[5];
            data[0] = 1;
            data[1] = (byte)(i >> 24);
            data[2] = (byte)(i >> 16);
            data[3] = (byte)(i >> 8);
            data[4] = (byte)(i >> 0);
            NativeModule._TestPerfNumberWithArray(data, data.length);
        }
        passed = System.currentTimeMillis() - start;
        System.out.println("ARRAY: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }

    static void checkPerf2(int count) {
        var peer = new ArkButtonPeer(ArkUINodeType.Root, null, 0);
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            if (i % 2 == 0) {
                peer.backdropBlurAttribute(i, null);
            }
            else {
                BlurOptions options = new BlurOptions();
                options.grayscale = new Tuple_double_double(1.0, 2.0);
                peer.backdropBlurAttribute(i, options);
            }
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("backdropBlur: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }
    
    static void checkPerf3(int count) {
        var peer = new ArkButtonPeer(ArkUINodeType.Root, null, 0);
        var testLength_10_lpx = new Ark_Length("10lpx");
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            peer.widthAttribute(testLength_10_lpx);
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("widthAttributeString: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }

    static void checkPeers() {
        var peer = new ArkTestPeer(ArkUINodeType.Root /* ArkUINodeType.Test */, null, 0);
        var boolInterface = new BooleanInterfaceDTS();
        boolInterface.valBool = true;
        peer.testBooleanInterfaceAttribute(boolInterface);

        var options = new BlurOptions();
        options.grayscale = new Tuple_double_double(1.0, 2.0);
        peer.backdropBlurAttribute(42, options);

        var blankPeer = new ArkBlankPeer(ArkUINodeType.Root, null, 0);
        var color = new Union_double_String("white");
        blankPeer.colorAttribute(color);
        var min = new Union_double_String(10);
        blankPeer._setBlankOptionsAttribute(min);
        // var attrs = new ArkBlankAttributes();
        // attrs.color = new Union_double_String("black");
        // blankPeer.applyAttributes(attrs);
    }
}

// Old: JS 167ms per 1M, Java 15 ms per 1M