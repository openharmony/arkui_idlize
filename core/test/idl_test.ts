import * as path from 'path'
import * as fs from 'node:fs'

import { assert, suite, test } from "@koalaui/harness"
import { parseIDLFile, parseIDLFileNew, compareParsingResults } from "../src/from-idl/deserialize"
import { toIDLString } from "../src/idl"
import { DiagnosticMessageGroup } from "../src/diagnosticmessages"

const idlDirPath = './test/idls/'
const buildDirPath = './test/build/'

function assertFilesEquals(fname1: string, fname2: string) {
  const content1 = fs.readFileSync(fname1, { encoding: 'utf-8' })
  const content2 = fs.readFileSync(fname2, { encoding: 'utf-8' })
  assert(content1.trim() === content2.trim(), `files ${fname1} and ${fname2} are not equals`)
}

function checkIdlFile(fname: string): void {
  const parsedFile = parseIDLFile(path.join(idlDirPath, fname))
  fs.mkdirSync(path.dirname(path.join(buildDirPath, fname)), { recursive: true })
  fs.writeFileSync(path.join(buildDirPath, fname), toIDLString(parsedFile, {}))
  assertFilesEquals(path.join(idlDirPath, fname), path.join(buildDirPath, fname))
}

suite("IDL parser test suite", () => {

  test("Test IDL callbacks", () => {
    checkIdlFile("golden/cb-1.idl")
  })

  test("Test IDL consts", () => {
    checkIdlFile("golden/const-1.idl")
  })

  test("Test IDL number enum", () => {
    checkIdlFile("golden/enum-1.idl")
  })

  test("Test IDL string enum", () => {
    checkIdlFile("golden/enum-2.idl")
  })

  test("Test IDL empty interface", () => {
    checkIdlFile("golden/iface-1.idl")
  })

  test("Test IDL interface with methods", () => {
    checkIdlFile("golden/iface-2.idl")
  })

  test("Test IDL interface with different methods", () => {
    checkIdlFile("golden/iface-3.idl")
  })

  test("Test IDL interface with attribute", () => {
    checkIdlFile("golden/iface-4.idl")
  })

  test("Test IDL complex interface", () => {
    checkIdlFile("golden/iface-5.idl")
  })

  test("Test IDL interface inheritance", () => {
    checkIdlFile("golden/iface-6.idl")
  })

  test("Test IDL interface with constructor", () => {
    checkIdlFile("golden/iface-7.idl")
  })

  test("Test IDL interface with static method", () => {
    checkIdlFile("golden/iface-8.idl")
  })

  test("Test IDL imports", () => {
    checkIdlFile("golden/import-1.idl")
  })

  test("Test IDL interface in namespace", () => {
    checkIdlFile("golden/nmspc-1.idl")
  })

  test("Test IDL package declaration", () => {
    checkIdlFile("golden/pkg-1.idl")
  })

  test("Test IDL package names with dots", () => {
    checkIdlFile("golden/pkg-2.idl")
  })

  test("Test IDL sequence declaration", () => {
    checkIdlFile("golden/seq-1.idl")
  })

  test("Test IDL primitives", () => {
    checkIdlFile("golden/primitives.idl")
  })

  test("Test IDL typedef declaration", () => {
    checkIdlFile("golden/typedef-1.idl")
  })

  test("Test IDL deep generic references", () => {
    checkIdlFile("golden/gen-1.idl")
  })
})

suite("IDL parser error processing suite", () => {

  test("Test IDL without semicolon", () => {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    assert.throws(function () {
      parseIDLFile(path.join(idlDirPath, "err_no_semicolon.idl"), undefined, true)
    });
    const errCount = DiagnosticMessageGroup.allGroupsEntries.length - previousDiagnosticsCount
    assert.notEqual(errCount, 0, "Should have error description")
  })

  test("Test IDL duplicate args", () => {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    assert.throws(function () {
      parseIDLFile(path.join(idlDirPath, "err_duplicate_args.idl"), undefined, true)
    });
    const errCount = DiagnosticMessageGroup.allGroupsEntries.length - previousDiagnosticsCount
    assert.notEqual(errCount, 0, "Should have error description")
  })

  test("Test IDL duplicate static", () => {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    assert.throws(function () {
      parseIDLFile(path.join(idlDirPath, "err_duplicate_static.idl"), undefined, true)
    });
    const errCount = DiagnosticMessageGroup.allGroupsEntries.length - previousDiagnosticsCount
    assert.notEqual(errCount, 0, "Should have error description")
  })

})
