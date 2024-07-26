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

import java.util.Map;

public interface Ark_Object {
    public static RuntimeType getRuntimeType(Ark_Object object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return object.getRuntimeType();
    }

    public static RuntimeType getRuntimeType(String object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return RuntimeType.STRING;
    }

    public static RuntimeType getRuntimeType(double[] object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return RuntimeType.OBJECT;
    }

    public static RuntimeType getRuntimeType(boolean[] object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return RuntimeType.OBJECT;
    }

    public static RuntimeType getRuntimeType(Object[] object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return RuntimeType.OBJECT;
    }

    public static RuntimeType getRuntimeType(Map<?, ?> object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return RuntimeType.OBJECT;
    }

    public RuntimeType getRuntimeType();
}
