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

export class Language {
    public static TS = new Language("TS", ".ts")
    public static ARKTS = new Language("ArkTS", ".ts") // using .ts for ArkTS until we get rit of tsc preprocessing
    public static JAVA = new Language("Java", ".java")
    public static CPP = new Language("C++", ".cc")
    public static CJ = new Language("CangJie", ".cj")
    public static KOTLIN = new Language("Kotlin", ".kt")

    private constructor(public name: string, public extension: string) {}

    toString(): string {
        return this.name
    }

    get directory() {
        return this.name.toLowerCase()
    }

    static fromString(name: string): Language {
        switch (name) {
            case "arkts": return Language.ARKTS
            case "java": return Language.JAVA
            case "ts": return Language.TS
            case "cangjie": return Language.CJ
            case "cpp": return Language.CPP
            case "kotlin": return Language.KOTLIN
            default: throw new Error(`Unsupported language ${name}`)
        }
    }
}
