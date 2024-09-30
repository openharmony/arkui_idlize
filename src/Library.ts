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

import { Language } from "./util"

export interface Library<FileType> {
    language: Language
    files: FileType[]
    findFileByOriginalFilename(filename: string): FileType | undefined 
}

class PrimitiveType {
    constructor(protected name: string, public isPointer = false) { }
    getText(): string { return this.name }
    static OptionalPrefix = "Opt_"
    static Prefix = ""
    static String = new PrimitiveType(`${PrimitiveType.Prefix}String`, true)
    static Number = new PrimitiveType(`${PrimitiveType.Prefix}Number`, true)
    static Int32 = new PrimitiveType(`${PrimitiveType.Prefix}Int32`)
    static Tag = new PrimitiveType(`${PrimitiveType.Prefix}Tag`)
    static RuntimeType = new PrimitiveType(`${PrimitiveType.Prefix}RuntimeType`)
    static Boolean = new PrimitiveType(`${PrimitiveType.Prefix}Boolean`)
    static Function = new PrimitiveType(`${PrimitiveType.Prefix}Function`, false)
    static Materialized = new PrimitiveType(`${PrimitiveType.Prefix}Materialized`, true)
    static Undefined = new PrimitiveType(`${PrimitiveType.Prefix}Undefined`)
    static NativePointer = new PrimitiveType(`${PrimitiveType.Prefix}NativePointer`)
    static ObjectHandle = new PrimitiveType(`${PrimitiveType.Prefix}ObjectHandle`)
    static Length = new PrimitiveType(`${PrimitiveType.Prefix}Length`, true)
    static CustomObject = new PrimitiveType(`${PrimitiveType.Prefix}CustomObject`, true)
}

export class ArkPrimitiveType extends PrimitiveType {
    static Prefix = "Ark_"
    static String = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}String`, true)
    static Number = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Number`, true)
    static Int32 = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Int32`)
    static Tag = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Tag`)
    static RuntimeType = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}RuntimeType`)
    static Boolean = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Boolean`)
    static Function = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Function`, false)
    static Materialized = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Materialized`, true)
    static Undefined = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Undefined`)
    static NativePointer = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}NativePointer`)
    static ObjectHandle = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}ObjectHandle`)
    static Length = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}Length`, true)
    static CustomObject = new ArkPrimitiveType(`${ArkPrimitiveType.Prefix}CustomObject`, true)
    static UndefinedTag = "ARK_TAG_UNDEFINED"
    static UndefinedRuntime = "ARK_RUNTIME_UNDEFINED"
    static ObjectTag = "ARK_TAG_OBJECT"
    static OptionalPrefix = "Opt_"
}

export interface Library<FileType> {
    language: Language
    files: FileType[]
    findFileByOriginalFilename(filename: string): FileType | undefined 
}
