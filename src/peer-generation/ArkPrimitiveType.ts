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

export class PrimitiveType {
    constructor(protected name: string, public isPointer = false) { }
    getText(): string { return PrimitiveType.Prefix + this.name }
    static Prefix = "Ark_"
    static String = new PrimitiveType(`String`, true)
    static Number = new PrimitiveType(`Number`, true)
    static Int32 = new PrimitiveType(`Int32`)
    static RuntimeType = new PrimitiveType(`RuntimeType`)
    static Boolean = new PrimitiveType(`Boolean`)
    static Function = new PrimitiveType(`Function`, false)
    static Undefined = new PrimitiveType(`Undefined`)
    static Void = new PrimitiveType(`Void`)
    static NativePointer = new PrimitiveType(`NativePointer`)

    static Tag = new PrimitiveType(`Tag`)
    static Materialized = new PrimitiveType(`Materialized`, true)
    static ObjectHandle = new PrimitiveType(`ObjectHandle`)
    static Length = new PrimitiveType(`Length`, true)
    static CustomObject = new PrimitiveType(`CustomObject`, true)

    static UndefinedTag = "ARK_TAG_UNDEFINED"
    static UndefinedRuntime = "ARK_RUNTIME_UNDEFINED"
    static ObjectTag = "ARK_TAG_OBJECT"
    static OptionalPrefix = "Opt_"
}