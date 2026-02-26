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

package handwritten

import koalaui.interop.KPointer
import koalaui.interop.MaterializedBaseTag

import external.lib.ExternalType
import external.lib.ImportedHookValue
import external.lib.ExternalClass
import external.lib.hookns

import external.lib.sdk.SDKExternalType

import test_inheritance.BaseGesture
import test_inheritance.DerivedGesture1
import test_inheritance.DerivedGesture2
import test_inheritance.GestureType
import test_inheritance.getBaseGestureType

import test_transform.TransformSrcC
import test_transform.TransformDstC
import test_transform.TransformSrcI
import test_transform.TransformDstI
import handwritten.TransformSrcCallbackC
import test_transform.TransformDstCallbackC
import test_transform.TransformSrcCallbackI
import test_transform.TransformDstCallbackI
import test_transform.WithOptional
import test_transform.TransformMeToWithOptional

class ExternalClassImpl: ExternalClass {
    override var ptr: Long

    constructor(ptr: Long) {
        this.ptr = ptr
    }
    override fun externalMethod(value: Double): Boolean {
        return true
    }
}

class extractors { companion object {
    fun toExternalTypePtr(value: ExternalType): Long {
        return value.nativePointer
    }

    fun fromExternalTypePtr(ptr: Long): ExternalType {
        val result = object: ExternalType { override var nativePointer = ptr }
        return result
    }

    fun toHooknsNSExternalTypePtr(value: hookns.NSExternalType): Long {
        return value.nsNativePointer
    }

    fun fromHooknsNSExternalTypePtr(ptr: Long): hookns.NSExternalType {
        val result = object: hookns.NSExternalType { override var nsNativePointer = ptr }
        return result
    }

    fun toHooknsSubhooknsSubNSExternalTypePtr(value: hookns.subhookns.SubNSExternalType): Long {
        return value.subnsNativePointer
    }

    fun fromHooknsSubhooknsSubNSExternalTypePtr(ptr: Long): hookns.subhookns.SubNSExternalType {
        val result = object: hookns.subhookns.SubNSExternalType { override var subnsNativePointer = ptr }
        return result
    }

    fun toImportedHookValuePtr(value: ImportedHookValue): Long {
        return 12.toLong()
    }

    fun fromImportedHookValuePtr(value: Long): ImportedHookValue {
        val result = object: ImportedHookValue { override var count = 22.0 }
        return result
    }

    fun toExternalClassPtr(value: ExternalClass): Long {
        return value.ptr
    }

    fun fromExternalClassPtr(ptr: Long): ExternalClass {
        return ExternalClassImpl(ptr)
    }

    fun toSDKExternalTypePtr(value: SDKExternalType): Long {
        return value.sdkNativePointer
    }

    fun fromSDKExternalTypePtr(ptr: Long): SDKExternalType {
        val result = object: SDKExternalType { override var sdkNativePointer = ptr }
        return result
    }

    fun deserialize_test_inheritance_BaseGesture(ptr: KPointer): BaseGesture {
        val gestureType = getBaseGestureType(ptr)
        when (gestureType) {
            GestureType.First -> return DerivedGesture1(MaterializedBaseTag.NOP, ptr)
            else -> return DerivedGesture2(MaterializedBaseTag.NOP, ptr)
        }
    }

    fun transform_OH_UNIT_TransformSrcI_to_OH_UNIT_TransformDstI(fromI: TransformSrcI): TransformDstI {
        val result = object : TransformDstI {
            override var state = if (fromI.flag) 1.0 else 0.0
        }
        return result
    }

    fun transform_OH_UNIT_TransformDstI_to_OH_UNIT_TransformSrcI(toI: TransformDstI): TransformSrcI {
        val result = object: TransformSrcI {
            override var flag = toI.state > 0.0
        }
        return result
    }

    fun transform_OH_UNIT_TransformSrcC_to_OH_UNIT_TransformDstC(fromC: TransformSrcC): TransformDstC {
        val result = TransformDstC()
        result.state = if (fromC.flag) 1.0 else 0.0
        return result
    }

    fun transform_OH_UNIT_TransformDstC_to_OH_UNIT_TransformSrcC(toC: TransformDstC): TransformSrcC {
        val result = TransformSrcC()
        result.flag = toC.state > 0.0
        return result
    }

    fun transform_OH_UNIT_TransformSrcCallbackI_to_UNIT_TransformDstCallbackI(comp: TransformSrcCallbackI): TransformDstCallbackI {
        if (comp.flag) {
            return { value: Boolean -> !value }
        }
        else {
            return { value: Boolean -> value }
        }
    }

    fun transform_UNIT_TransformDstCallbackI_to_OH_UNIT_TransformSrcCallbackI(callback: TransformDstCallbackI): TransformSrcCallbackI {
        val result = object: TransformSrcCallbackI {
            override var flag = callback(true)
        }
        return result
    }

    fun transform_OH_UNIT_TransformSrcCallbackC_to_UNIT_TransformDstCallbackC(comp: TransformSrcCallbackC): TransformDstCallbackC {
        if (comp.flag) {
            return { value: Boolean -> !value }
        }
        else {
            return { value: Boolean -> value }
        }
    }

    fun transform_UNIT_TransformDstCallbackC_to_OH_UNIT_TransformSrcCallbackC(callback: TransformDstCallbackC): TransformSrcCallbackC {
        val result = object: TransformSrcCallbackC() {
            override var flag = callback(true)
        }
        return result
    }

    fun transform_OH_UNIT_TransformMeToWithOptional_to_Opt_String(from: TransformMeToWithOptional): WithOptional {
        return ""
    }

    fun transform_Opt_String_to_OH_UNIT_TransformMeToWithOptional(from: WithOptional): TransformMeToWithOptional {
        return TransformMeToWithOptional.create0("")
    }
} }
