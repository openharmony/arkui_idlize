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

import { withStringResult, InteropNativeModule } from "@koalaui/interop"

export const TEST_GROUP_LOG = 1
export const CALL_GROUP_LOG = 2

export let reportTestFailures: boolean = true

let failedTestsCount = 0

export function setReportTestFailures(report: boolean) {
    reportTestFailures = report
}

export function checkTestFailures() {
    if (reportTestFailures) {
        if (!failedTestsCount) {
            console.log(`all tests passed`)
        } else {
            console.log(`failed tests: ${failedTestsCount}`)
            process.exit(1)
        }
    }
}

export function startNativeTest(testName: string, group: number) {
    InteropNativeModule._AppendGroupedLog(group, `void TEST_${testName}() {\n`)
}

export function stopNativeTest(group: number) {
    InteropNativeModule._AppendGroupedLog(group, `}\n`)
}

export function startNativeLog(group: number) {
    InteropNativeModule._StartGroupedLog(group)
}

export function stopNativeLog(group: number) {
    InteropNativeModule._StopGroupedLog(group)
}

export function getNativeLog(group: number): string {
    return withStringResult(InteropNativeModule._GetGroupedLog(group))!
}

export function checkResult(name: string, test: () => void, expected: string) {
    startNativeLog(TEST_GROUP_LOG)
    test()
    stopNativeLog(TEST_GROUP_LOG)
    const out = getNativeLog(TEST_GROUP_LOG)
    // remove out comments like /* some text */
    const actual = out.replace(/\s?\/\*.*?\*\//g, "")
        .replaceAll(" \n", "")
    if (reportTestFailures) {
        if (actual !== expected) {
            failedTestsCount++
            console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${actual}"`)
            console.log(`output: ${out}`)
        } else {
            console.log(`TEST ${name} PASS`)
        }
    }
}

export function assertTrue(name: string, value: boolean) {
    if (!value) {
        failedTestsCount++
        console.log(`TEST ${name} FAIL:\n  EXPECTED value is not true.`)
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

export function assertEquals(name: string, expected: any, actual: any) {
    if (expected != actual ) {
        failedTestsCount++
        console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${actual}"`)
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

export function assertThrows(name: string, fn: () => void) {
    let caught = false
    try {
        fn()
    } catch (e) {
        caught = true
    }
    if (!caught) {
        failedTestsCount++
        console.log(`TEST ${name} FAIL:\n  No exception thrown`)
    } else {
        console.log(`TEST ${name} PASS`)
    }
}