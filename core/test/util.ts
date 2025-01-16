import { assert } from "chai"
import { capitalize } from "../src/util"

test("capitalize", () => {
    assert.equal(capitalize("wabi"), "Wabi")
    assert.equal(capitalize("WAKA"), "WAKA")
    assert.equal(capitalize("wAaM"), "WAaM")
})
