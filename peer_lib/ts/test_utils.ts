import {nativeModule} from "./NativeModule"
import { withStringResult } from "./Interop"

const TEST_GROUP_LOG = 1

export let reportTestFailures: boolean = true

let failedTestsCount = 0

export function setReportTestFailures(report: boolean) {
    reportTestFailures = report
}

export function checkTestFailures() {
    if (reportTestFailures && failedTestsCount > 0) {
        console.log(`failed tests: ${failedTestsCount}`)
        process.exit(1)
    }
}

export function clearNativeLog() {
    nativeModule()._ClearGroupedLog(TEST_GROUP_LOG)
}

export function getNativeLog(): string {
    return withStringResult(nativeModule()._GetGroupedLog(TEST_GROUP_LOG))!
}

export function checkResult(name: string, test: () => void, expected: string) {
    clearNativeLog()
    test()
    const out = getNativeLog()
    // remove out comments like /* some text */
    const actual =  out.replace(/\s?\/\*.*?\*\//g, "");
    if (reportTestFailures) {
        if (actual != expected) {
            failedTestsCount++
            console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${actual}"`)
            console.log(`output: ${out}`)
        } else {
            console.log(`TEST ${name} PASS`)
        }
    }
}
