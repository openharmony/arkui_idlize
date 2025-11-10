import * as path from 'path'

import { assert, suite, test } from "@koalaui/harness"
import { parseIDLFile, parseIDLFileNew, compareParsingResults } from "../src/from-idl/deserialize"
import { toIDLString } from "../src/idl"
import { DiagnosticMessageGroup } from "../src/diagnosticmessages"

const idlDirPath = './test/idls/'

function checkIdlFile(fname: string): void {
  const astTree1 = parseIDLFile(path.join(idlDirPath, fname))  // parse source.idl into tree1
  const tmp = toIDLString(astTree1, {})
  if (process.argv.includes('--show-dump')) {
    const title = '=== ' + fname + ' ==='
    console.log(title)
    console.log(tmp)
    console.log('='.repeat(title.length))
  }
  const astTree2 = parseIDLFileNew("", tmp)              // parse string into tree2
  const res = compareParsingResults(astTree1, astTree2)  // compare trees
  assert(res, "during testing " + fname)
}

suite("IDL parser test suite", () => {

  test("Test IDL callbacks", () => {
    checkIdlFile("cb-1.idl")
  })

  test("Test IDL comments", () => {
    checkIdlFile("cmt-1.idl")
  })

  test("Test IDL consts", () => {
    checkIdlFile("const-1.idl")
  })

  test("Test IDL number dictionary", () => {
    checkIdlFile("dict-1.idl")
  })

  test("Test IDL string dictionary", () => {
    checkIdlFile("dict-2.idl")
  })

  test("Test IDL empty interface", () => {
    checkIdlFile("iface-1.idl")
  })

  test("Test IDL interface with methods", () => {
    checkIdlFile("iface-2.idl")
  })

  test("Test IDL interface with different methods", () => {
    checkIdlFile("iface-3.idl")
  })

  test("Test IDL interface with attribute", () => {
    checkIdlFile("iface-4.idl")
  })

  test("Test IDL complex interface", () => {
    checkIdlFile("iface-5.idl")
  })

  test("Test IDL interface inheritance", () => {
    checkIdlFile("iface-6.idl")
  })

  test("Test IDL interface with constructor", () => {
    checkIdlFile("iface-7.idl")
  })

  test("Test IDL interface with static method", () => {
    checkIdlFile("iface-8.idl")
  })

  test("Test IDL imports", () => {
    checkIdlFile("import-1.idl")
  })

  test("Test IDL interface in namespace", () => {
    checkIdlFile("nmspc-1.idl")
  })

  test("Test IDL package declaration", () => {
    checkIdlFile("pkg-1.idl")
  })

  test("Test IDL package names with dots", () => {
    checkIdlFile("pkg-2.idl")
  })

  test("Test IDL sequence declaration", () => {
    checkIdlFile("seq-1.idl")
  })

  test("Test IDL typedef declaration", () => {
    checkIdlFile("typedef-1.idl")
  })

  test("Test IDL deep generic references", () => {
    checkIdlFile("gen-1.idl")
  })
})

suite("IDL parser error processing suite", () => {

  test("Test IDL without semicolon", () => {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    assert.throws(function () {
      parseIDLFile(path.join(idlDirPath, "err_no_semicolon.idl"))
    });
    const errCount = DiagnosticMessageGroup.allGroupsEntries.length - previousDiagnosticsCount
    assert.notEqual(errCount, 0, "Should have error description")
  })

  test("Test IDL duplicate args", () => {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    assert.throws(function () {
      parseIDLFile(path.join(idlDirPath, "err_duplicate_args.idl"))
    });
    const errCount = DiagnosticMessageGroup.allGroupsEntries.length - previousDiagnosticsCount
    assert.notEqual(errCount, 0, "Should have error description")
  })

  test("Test IDL duplicate static", () => {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    assert.throws(function () {
      parseIDLFile(path.join(idlDirPath, "err_duplicate_static.idl"))
    });
    const errCount = DiagnosticMessageGroup.allGroupsEntries.length - previousDiagnosticsCount
    assert.notEqual(errCount, 0, "Should have error description")
  })

})
