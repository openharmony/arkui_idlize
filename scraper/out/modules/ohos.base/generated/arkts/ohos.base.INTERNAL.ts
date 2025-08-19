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

import { int32, float32, int64, unsafeCast } from "@koalaui/common"
import { BusinessError } from "./base"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, registerApiEventHandler, ResourceHolder, KInt, KStringPtr, wrapSystemCallback, KLong, KBoolean, KFloat, KDouble, KUInt, KNativePointer, KInt32ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, loadNativeModuleLibrary } from "@koalaui/interop"
export enum CallbackKind {
    Kind_EMPTY_Callback = -1
}
export class BusinessError_serializer {
    public static write(buffer: SerializerBase, value: BusinessError): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForMessage  = value.message
        valueSerializer.writeString(valueHolderForMessage)
        const valueHolderForStack  = value.stack
        if (valueHolderForStack !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForStackTmpValue  = valueHolderForStack!
            valueSerializer.writeString(valueHolderForStackTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForCode  = value.code
        valueSerializer.writeNumber(valueHolderForCode)
    }
    public static read(buffer: DeserializerBase): BusinessError {
        let valueDeserializer : DeserializerBase = buffer
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const messageTmpResult : string = (valueDeserializer.readString() as string)
        const stackTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let stackTmpBuf : string | undefined
        if ((stackTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            stackTmpBuf = (valueDeserializer.readString() as string)
        }
        const stackTmpResult : string | undefined = stackTmpBuf
        const codeTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : BusinessError = ({name: nameTmpResult, message: messageTmpResult, stack: stackTmpResult, code: codeTmpResult} as BusinessError)
        return value
    }
}
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind : int32 = thisDeserializer.readInt32()
    throw new Error("Unknown callback kind")
}
export function registerOhosBaseApiHandler(): void {
    registerApiEventHandler(10, deserializeAndCallCallback)
}
export class OHOS_BASENativeModule {
    static {
        loadNativeModuleLibrary("OHOS_BASENativeModule")
    }
}
export class TypeChecker {
    static typeInstanceOf<T>(value: Object, prop: string): boolean {
        return value instanceof T
    }
    static typeCast<T>(value: Object): T {
        return value as T
    }
    static isNativeBuffer(value: Object): boolean {
        return value instanceof ArrayBuffer
    }
    static isBusinessError(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean): boolean {
        return value instanceof BusinessError
    }
}
