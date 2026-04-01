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

package external.lib

class ExternalStringEnum private constructor(public val ordinal: Int, public val value: String) {
    companion object {
        val E1: ExternalStringEnum = ExternalStringEnum(0, "e1")
        val E2: ExternalStringEnum = ExternalStringEnum(1, "e2")
        val values: Map<Int, ExternalStringEnum> = mapOf(0 to E1, 1 to E2)
    }
}

interface ExternalModuleDataInterface {
    var count: Double
}

interface ExternalType {
    var nativePointer: Long
}

interface ImportedHookValue {
    var count: Double
}

interface ExternalClass {
    var ptr: Long
    fun externalMethod(value: Double): Boolean
}

class hookns {
    interface NSExternalType {
        var nsNativePointer: Long
    }

    class subhookns {
        interface SubNSExternalType {
            var subnsNativePointer: Long
        }
    }
}