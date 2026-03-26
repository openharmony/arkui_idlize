/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import * as fs from 'fs'
import * as path from 'path'
import { assert, suite, test } from "@koalaui/harness"
import { needsResponseFile, createResponseFile, expandResponseFile } from "../src/inputPaths"

suite("Response file utilities", () => {

  test("needsResponseFile returns false for small args", () => {
    const smallArgs = ['node', 'script.js', '--input-files', 'file1.idl,file2.idl']
    assert.isFalse(needsResponseFile(smallArgs))
  })

  test("needsResponseFile returns true for large args", () => {
    // Create a large string > 128KB (threshold is 131,072 characters)
    const largeFile = '/path/to/file/'.repeat(10000)
    const largeArgs = ['node', 'script.js', '--input-files', largeFile]
    assert.isTrue(needsResponseFile(largeArgs))
  })

  test("createResponseFile creates valid file", () => {
    const files = ['/path/to/file1.idl', '/path/to/file2.idl', '/path/to/file3.idl']
    const responsePath = createResponseFile(files)

    // File should exist
    assert.isTrue(fs.existsSync(responsePath))

    // Content should be newline-separated
    const content = fs.readFileSync(responsePath, 'utf-8')
    assert.equal(content, files.join('\n'))

    // Cleanup
    fs.rmSync(path.dirname(responsePath), { recursive: true })
  })

  test("expandResponseFile reads back correct list", () => {
    const files = ['/path/to/file1.idl', '/path/to/file2.idl']
    const responsePath = createResponseFile(files)

    const readBack = expandResponseFile(responsePath)
    assert.deepEqual(readBack, files)

    // Cleanup
    fs.rmSync(path.dirname(responsePath), { recursive: true })
  })

  test("Round-trip: files in equals files out", () => {
    const files = ['/a/b/c.idl', '/d/e/f.ets', '/g/h/i.d.ts']
    const responsePath = createResponseFile(files)
    const readBack = expandResponseFile(responsePath)

    assert.deepEqual(readBack, files)

    // Cleanup
    fs.rmSync(path.dirname(responsePath), { recursive: true })
  })

  test("createResponseFile rejects paths with newlines", () => {
    const filesWithNewline = ['/path/to/file1.idl', '/path/with\nnewline/file2.idl']

    assert.throws(() => {
      createResponseFile(filesWithNewline)
    }, /File path contains newline character/)
  })

  test("expandResponseFile handles empty file", () => {
    const files: string[] = []
    const responsePath = createResponseFile(files)

    const readBack = expandResponseFile(responsePath)
    assert.deepEqual(readBack, [])

    // Cleanup
    fs.rmSync(path.dirname(responsePath), { recursive: true })
  })

  test("createResponseFile uses custom output directory", () => {
    const files = ['/path/to/file1.idl', '/path/to/file2.idl']
    const customDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'idlize-test-'))

    const responsePath = createResponseFile(files, customDir)

    // Response file should be inside the custom directory
    assert.isTrue(responsePath.startsWith(customDir), `Expected ${responsePath} to start with ${customDir}`)

    // Verify content
    const readBack = expandResponseFile(responsePath)
    assert.deepEqual(readBack, files)

    // Cleanup
    fs.rmSync(customDir, { recursive: true })
  })

})