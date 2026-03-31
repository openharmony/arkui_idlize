/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

package internal.INTERNAL

import koalaui.interop.KBoolean
import koalaui.interop.KByte
import koalaui.interop.KInt
import koalaui.interop.KLong
import koalaui.interop.KFloat
import koalaui.interop.KDouble
import koalaui.interop.KUInt
import koalaui.interop.KStringPtr
import koalaui.interop.KPointer
import koalaui.interop.KNativePointer
import koalaui.interop.pointer
import koalaui.interop.KUint8ArrayPtr
import koalaui.interop.KInt32ArrayPtr
import koalaui.interop.KFloat32ArrayPtr
import koalaui.interop.KInteropReturnBuffer
import koalaui.interop.KSerializerBuffer
import koalaui.interop.registerApiEventHandler
import koalaui.interop.ResourceHolder
import koalaui.interop.DeserializerBase
import koalaui.interop.SerializerBase
import koalaui.interop.CallbackResource
import koalaui.interop.InteropNativeModule
import koalaui.interop.RuntimeType
import koalaui.interop.NativeBuffer
import kotlinx.cinterop.*
public open class CallbackKind {
    companion object {
        public val Kind_EMPTY_Callback: Any = CallbackKind(-1)
    }
    public val value: Int?
    constructor(arg0: Int) {
        this.value = arg0
    }
}
public open class INTERNALNativeModule {
    companion object {
    }
}
public fun deserializeAndCallCallback(thisDeserializer: DeserializerBase): Unit {
    val kind: Int = thisDeserializer.readInt32()
    when (kind) {
        else -> error("Unknown callback kind")
    }
}
public fun registerInternalApiHandler(): Unit {
    registerApiEventHandler(0, ::deserializeAndCallCallback)
}
