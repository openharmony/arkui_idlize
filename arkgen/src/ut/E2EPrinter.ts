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

import { PeerLibrary } from '@idlizer/core'
import { LibaceInstall } from '../ArkoalaInstall.js'
import { AceTypesTs } from './AceTypes.js'
import { printTsFixtures, Target } from './E2EFixturesPrinter.js'
import { printTsSuites } from './E2ESuitesPrint.js'

export function printEndToEndTests(
    peerLibrary: PeerLibrary, libace: LibaceInstall, target: Target, aceTypesJson?: string
): void {
    console.info("\n\nE2E TEST GENERATION IS STARTING\n")
    const aceTypes = new AceTypesTs(aceTypesJson)
    const enums = printTsSuites(aceTypes, peerLibrary, libace, target)
    printTsFixtures(aceTypes, enums, peerLibrary, libace, target)
}
