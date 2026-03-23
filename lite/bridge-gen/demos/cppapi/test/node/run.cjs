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

const { Point, Printer } = require('../../bundled/npm')

function main() {
    const p1 = Point.create(42, 42)
    const p2 = Point.create(1, 2)

    const printer = Printer.createPrinter()
    printer.print("X: " + (p1.x() + p2.x()) + ", " + (p1.y() + p2.y()))
}
main()
