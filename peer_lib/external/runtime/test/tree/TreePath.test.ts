/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import { assert } from "chai"
import { TreePath } from "../../src/tree/TreePath"

suite("TreePath", () => {

    let root = new TreePath("root")

    test("root path is root", () => assert(root.root === root))
    test("root path depth", () => assert.equal(root.depth, 0))
    test("root path has undefined parent", () => assert(root.parent === undefined))
    test("root path to string", () => assert.equal(root.toString(), "/root"))

    let parent = root.child("parent")
    let current = parent.child("node")

    test("tree path has root", () => assert(current.root === root))
    test("tree path has parent", () => assert(current.parent === parent))
    test("tree path depth", () => assert.equal(current.depth, 2))
    test("tree path parent depth", () => assert.equal(current.parent?.depth, 1))
    test("tree path to string", () => assert.equal(current.toString(), "/root/parent/node"))

    let sibling = parent.child("sibling")

    test("siblings has the same parents", () => assert(current.parent === sibling.parent))
})
