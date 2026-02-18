import { assert, test } from "@koalaui/harness"
import { capitalize } from "../src/util.js"

test("capitalize", () => {
    assert.equal(capitalize("wabi"), "Wabi")
    assert.equal(capitalize("WAKA"), "WAKA")
    assert.equal(capitalize("wAaM"), "WAaM")
})
