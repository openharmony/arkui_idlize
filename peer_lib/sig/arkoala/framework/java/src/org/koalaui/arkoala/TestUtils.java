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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

package org.koalaui.arkoala;

public class TestUtils {

    public static final int TEST_GROUP_LOG = 1;
    public static final int CALL_GROUP_LOG = 2;
    public static boolean reportTestFailures = true;
    public static int failedTestsCount = 0;

    public static String getNativeString(long ptr) {
        int length = NativeModule._StringLength(ptr);
        byte[] bytes = new byte[length];
        NativeModule._StringData(ptr, bytes, length);
        return new String(bytes);
    }

    public static void checkResult(String name, Runnable test, String expected) {
        NativeModule._StartGroupedLog(TEST_GROUP_LOG);
        test.run();
        NativeModule._StopGroupedLog(TEST_GROUP_LOG);
        String out = getNativeString(NativeModule._GetGroupedLog(TEST_GROUP_LOG));
        // remove out comments like /* some text */
        String actual = out.replaceAll("\\s?\\/\\*.*?\\*\\/", "").replaceAll(" \n", "");
        if (reportTestFailures) {
            if (actual.equals(expected)) {
                System.out.println(String.format("TEST %s PASS", name));
            } else {
                failedTestsCount++;
                System.out.println(String.format("TEST %s FAIL:\n  EXPECTED %s\n  ACTUAL   %s", name, expected, actual));
                System.out.println(String.format("output: %s", out));
            }
        }
    }

    public static void checkTestFailures() {
        if (reportTestFailures && failedTestsCount > 0) {
            System.out.println(String.format("failed tests: %d", failedTestsCount));
            System.exit(1);
        }
    }
}
