// @ts-nocheck

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

export function setColumnsGapAttribute(value: Length | undefined): void {
    const thisSerializer: SerializerBase = SerializerBase.hold()
    if (value !== undefined) {
        thisSerializer.writeInt8(RuntimeType.OBJECT)
        const valueTmpValue = value!
        if (valueTmpValue instanceof string) {
            thisSerializer.writeInt8((0).toChar())
            const valueTmpValueForIdx0 = valueTmpValue as string
            thisSerializer.writeString(valueTmpValueForIdx0)
        } else if (valueTmpValue instanceof double) {
            thisSerializer.writeInt8((1).toChar())
            const valueTmpValueForIdx1 = valueTmpValue as double
            thisSerializer.writeFloat64(valueTmpValueForIdx1)
        } else if (valueTmpValue instanceof Resource) {
            thisSerializer.writeInt8((2).toChar())
            const valueTmpValueForIdx2 = valueTmpValue as Resource
            Resource_serializer.write(thisSerializer, valueTmpValueForIdx2)
        }
    } else {
        thisSerializer.writeInt8(RuntimeType.UNDEFINED)
    }
    ArkUIGeneratedNativeModule._GridAttribute_setColumnsGap(
        this.peer.ptr,
        thisSerializer.asBuffer(),
        thisSerializer.length(),
    )
    thisSerializer.release()
}
