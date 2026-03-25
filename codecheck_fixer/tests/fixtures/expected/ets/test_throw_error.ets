/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

// Test file for throw Error breaking
function test() {
    if (condition1) {
        if (condition2) {
            if (condition3) {
                // This line is 135 characters with REAL 16-space indent (4 levels * 4 spaces)
throw new Error( 'One of the branches for minFontSizeTmpBuf_BufU has to be chosen through deserialisation. .........' )
            }
        }
    }
}

