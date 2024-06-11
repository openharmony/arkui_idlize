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
        Main.checkPerf(10*1000*1000);
        //NativeModule._StartGroupedLog(1);
        Main.checkSerializerPerf(10*1000*1000);
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

    static void checkSerializerPerf(int count) {
        var options = new TestOptions(
            "Some test string",
            12345.678f
        );
        long ptr = 0;

        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            Serializer serializer = SerializerBase.get(Serializer::createSerializer, 0);
            serializer.writeTestOptions(options);
            NativeModule._TestAttribute_testMethod(ptr, serializer.asArray(), serializer.length());
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("SERIALIZER: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }
}

// Old: JS 167ms per 1M, Java 15 ms per 1M