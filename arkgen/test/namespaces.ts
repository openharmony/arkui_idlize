import { createReferenceType, isEnum, isEnumMember } from "@idlize/core"
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
