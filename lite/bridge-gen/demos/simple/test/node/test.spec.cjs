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

const { NameDotSpace } = require("../../bundled/npm")

function test() {
    // const v1 = NameDotSpace.genNewPosition(1)
    // const v2 = NameDotSpace.genNewPosition(2)
    // const v3 = NameDotSpace.genNewPosition(3)
    // const v4 = NameDotSpace.genNewPosition(4)
    // const n1 = { name: "N1", position: v1 }
    // const n2 = { name: "N2", position: v2 }
    // const n3 = { name: "N3", position: v3 }
    // const n4 = { name: "N4", position: v4 }


    const x = NameDotSpace.add3(
        { x: 1, y: 10, z: -5 },
        { x: 10, y: -2, z: 4 }
    )
    console.log(x)
}
test()
