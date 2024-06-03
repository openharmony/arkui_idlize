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

import { IndentedPrinter } from "../IndentedPrinter";
import { Language } from "../util";
import { writeCommonComponent } from "./ComponentsPrinter";
import { makeStructCommon } from "./FileGenerators";
import { createLanguageWriter } from "./LanguageWriters";
import { PeerLibrary } from "./PeerLibrary";

export function printStructCommon(peerLibrary: PeerLibrary): string {
    const writer = createLanguageWriter(new IndentedPrinter(), Language.TS)
    writer.pushIndent()
    writeCommonComponent(peerLibrary, writer)
    writer.popIndent()
    return makeStructCommon(
        writer.getOutput().join('\n'),
        peerLibrary.customComponentMethods,
    )
}