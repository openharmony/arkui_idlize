import { nativeModule } from "@arkoala/arkui/NativeModule"
import { ArkCommonPeer } from "@arkoala/arkui/ArkCommonPeer"
import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"
import { ArkTestPeer } from "@arkoala/arkui/ArkTestPeer"
import {
    testString10, testString100, testString1000, testString5000, testString10000, testLength_10_percent,
    testLength_number100, testNumber100
} from "@arkoala/arkui/test_data"
import { withStringResult } from "@koalaui/interop"

enum DumpOptions {
    TOTAL = 0,
    AVERAGE,
    PEAK,
    DETAILS,
    CLEAR
}

export function RunPerformanceTest(testName: string, testCnt: number, callCnt: number, testFunc: () => void) {
    for (let i = 0; i < testCnt; ++i) {
        for (let j = 0; j < callCnt; ++j) {
            nativeModule()._StartPerf("perf_counter_self_cost")
            // do nothing ===> perf_counter_self_cost about 0.838 us.
            nativeModule()._EndPerf("perf_counter_self_cost")
            nativeModule()._StartPerf(testName)
            testFunc()
            nativeModule()._EndPerf(testName)
        }
    }
    console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.AVERAGE)))
    console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.CLEAR)))
}

export function startPerformanceTest() {
    let peer = new ArkCommonPeer(ArkUINodeType.Common);
    RunPerformanceTest("idlize_restoreIdAttribute_testNumber100", 1, 10000, () => {
        peer.restoreIdAttribute(testNumber100)
    });
    RunPerformanceTest("idlize_keyAttribute_testString1000", 1, 10000, () => {
        peer.keyAttribute(testString1000)
    });
    RunPerformanceTest("idlize_widthAttribute_testLength_10_percent", 1, 10000, () => {
        peer.widthAttribute(testLength_10_percent)
    });
    RunPerformanceTest("idlize_widthAttribute_testLength_number100", 1, 10000, () => {
        peer.widthAttribute(testLength_number100)
    });
    RunPerformanceTest("idlize_paddingAttribute", 1, 10000, () => {
        peer.paddingAttribute({
            top: testLength_10_percent, right: testLength_10_percent,
            bottom: testLength_10_percent, left: testLength_10_percent
        })
    });
    RunPerformanceTest("idlize_backgroundBlurStyleAttribute", 1, 10000, () => {
        peer.backgroundBlurStyleAttribute(0, {
            colorMode: 0,
            adaptiveColor: 0,
            scale: 1,
            blurOptions: {
                grayscale: [1, 1]
            }
        })
    });
}
