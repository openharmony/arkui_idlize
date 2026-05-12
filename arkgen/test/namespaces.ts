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
import { createReferenceType, isEnum, isEnumMember } from "@idlizer/core"
import { withDataFrom } from "./test-util"
import { assert } from "chai"

suite("Reference resolution", () => {
    withDataFrom("namespaces.idl", data => {
        test("Toplevel declaration lookup", () => {
            const ref = createReferenceType("Size")
            const decl = data.peerLibrary.resolveTypeReference(ref)
            assert(decl && isEnum(decl))
            assert(decl.elements.every(e => !e.name.includes("BUBBLE")))
        })

        test("Namespace lookup", () => {
            const nsRef = createReferenceType("Bubble.Size")
            const decl = data.peerLibrary.resolveTypeReference(nsRef)
            assert(decl && isEnum(decl))
            assert(decl.elements.every(e => e.name.endsWith("_BUBBLE")))
        })

        test("Enum member lookup", () => {
            const enumRef = createReferenceType("Size.LIL")
            const decl = data.peerLibrary.resolveTypeReference(enumRef)
            assert(decl && isEnumMember(decl))
            assert.equal(decl.name, "LIL")
        })
    })
})
