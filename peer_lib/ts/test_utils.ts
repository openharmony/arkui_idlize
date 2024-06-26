import { nativeModule } from "@koalaui/arkoala"
import { withStringResult } from "@koalaui/interop"

export const TEST_GROUP_LOG = 1
export const CALL_GROUP_LOG = 2

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

export function startNativeLog(group: number) {
    nativeModule()._StartGroupedLog(group)
}

export function stopNativeLog(group: number) {
    nativeModule()._StopGroupedLog(group)
}

export function getNativeLog(group: number = TEST_GROUP_LOG): string {
    return withStringResult(nativeModule()._GetGroupedLog(group))!
}

export function checkResult(name: string, test: () => void, expected: string) {
    startNativeLog(TEST_GROUP_LOG)
    test()
    stopNativeLog(TEST_GROUP_LOG)
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