/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs'

const libaceHeader = "out/ts-peers/generated/libace/generated/interface/arkoala_api_generated.h"
const arkoalaHeader = "out/ts-peers/generated/sig/arkoala-arkts/framework/native/src/generated/arkoala_api_generated.h"

const libaceContent = fs.readFileSync(libaceHeader).toString()
const arkoalaContent = fs.readFileSync(arkoalaHeader).toString()

if (libaceContent != arkoalaContent) {
    console.log(libaceHeader)
    console.log(arkoalaHeader)
    throw new Error("Arkoala and libace headers differ!")
}

