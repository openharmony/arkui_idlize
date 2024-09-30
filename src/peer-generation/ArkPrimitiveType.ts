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

export class ArkPrimitiveType {
    constructor(protected name: string, public isPointer = false) { }
    getText(): string { return ArkPrimitiveType.Prefix + this.name }
    static Prefix = "Ark_"
    static String = new ArkPrimitiveType(`String`, true)
    static Number = new ArkPrimitiveType(`Number`, true)
    static Int32 = new ArkPrimitiveType(`Int32`)
    static RuntimeType = new ArkPrimitiveType(`RuntimeType`)
    static Boolean = new ArkPrimitiveType(`Boolean`)
    static Function = new ArkPrimitiveType(`Function`, false)
    static Undefined = new ArkPrimitiveType(`Undefined`)
    static NativePointer = new ArkPrimitiveType(`NativePointer`)

    static Tag = new ArkPrimitiveType(`Tag`)
    static Materialized = new ArkPrimitiveType(`Materialized`, true)
    static ObjectHandle = new ArkPrimitiveType(`ObjectHandle`)
    static Length = new ArkPrimitiveType(`Length`, true)
    static CustomObject = new ArkPrimitiveType(`CustomObject`, true)
    
    static UndefinedTag = "ARK_TAG_UNDEFINED"
    static UndefinedRuntime = "ARK_RUNTIME_UNDEFINED"
    static ObjectTag = "ARK_TAG_OBJECT"
    static OptionalPrefix = "Opt_"
}