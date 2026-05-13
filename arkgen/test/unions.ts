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
import { Language } from "@idlizer/core"
import { IDLInterface } from '@idlizer/core/idl'
import { createLanguageWriter } from '../src/peer-generation/LanguageWriters'
import { withDataFrom } from "./test-util"

suite("Unions", () => {
    withDataFrom("unions.idl", data => {
        test("Union discrimination", () => {
            const writer = createLanguageWriter(Language.TS, data.peerLibrary)
            const testCases: IDLInterface = data.lookup("TestCases")
            testCases.properties.forEach(f =>
                writer.writeStatement(data.peerLibrary.typeConvertor("", f.type).convertorSerialize("", "", writer))
            )
        })
    })
})
