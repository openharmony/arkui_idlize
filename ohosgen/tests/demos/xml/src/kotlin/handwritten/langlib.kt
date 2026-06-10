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

package langlib;

import koalaui.interop.SerializerBase
import koalaui.interop.DeserializerBase

public interface DataView_ {
}

private class DataView_Impl : DataView_ {
}

public class DataView__serializer {

    companion object {

        public fun write(buffer: SerializerBase, value: DataView_) {
            // Improve: serialize DataView
        }
        public fun  read(buffer: DeserializerBase): DataView_ {
            // Improve: deserialize DataView
            return DataView_Impl()
        }
    }
}

