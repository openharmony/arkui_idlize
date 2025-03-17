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

import { ImportFeature } from "../../ImportsCollector"
import { LanguageWriter, PeerLibrary } from "@idlizer/core"
import { TargetFile } from "../TargetFile"
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./Java"

export function printJavaImports(printer: LanguageWriter, imports: ImportFeature[]) {
    if (imports.length == 0) {
        return
    }
    imports
        .filter(it => it.module === "")  // ignore imports from local package
        .forEach(it => printer.print(`import ${it.feature};`))
    printer.print('')
}
