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

package org.koalaui.arkoala;

public class ForeignFunctions {
    static long foreignContext = 0;
    static void enter(long context) {
        foreignContext = context;
    }
    static void leave() {
        foreignContext = 0;
    }

    static int setTimeout(Runnable code, int delay) {
        if (ForeignFunctions.foreignContext == 0) throw new Error("null foreign VM context");
        Serializer serializer = Serializer.hold();
        serializer.writeInt32(1);
        serializer.holdAndWriteCallback(code);
        serializer.writeInt32(delay);
        int rv = InteropNativeModule._CallForeignVM(ForeignFunctions.foreignContext, 3, serializer.asArray(), serializer.length());
        serializer.release();
        return rv;
    }
}