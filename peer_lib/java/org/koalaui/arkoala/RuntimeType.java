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

enum RuntimeType {
    UNEXPECTED((byte) -1),
    NUMBER((byte) 1),
    STRING((byte) 2),
    OBJECT((byte) 3),
    BOOLEAN((byte) 4),
    UNDEFINED((byte) 5),
    BIGINT((byte) 6),
    FUNCTION((byte) 7),
    SYMBOL((byte) 8);
    public final byte value;
    RuntimeType(byte value) {
        this.value = value;
    }
}
