import { nativeModule } from "@arkoala/arkui/NativeModule"
import { ArkCommonPeer } from "@arkoala/arkui/ArkCommonPeer"
import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"
import { testString1000 } from "@arkoala/arkui/main"
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
            nativeModule()._StartPerf(testName)
            testFunc()
            nativeModule()._EndPerf(testName)
        }
    }
    console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.TOTAL)))
    console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.AVERAGE)))
    console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.PEAK)))
    // console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.DETAILS)))
    console.log(withStringResult(nativeModule()._DumpPerf(DumpOptions.CLEAR)))
}

export function startPerformanceTest() {
    let peer = new ArkCommonPeer(ArkUINodeType.Common);
    RunPerformanceTest("idlize_widthAttribute_string1000", 1, 10000, () => {
        peer.widthAttribute(testString1000)
    });
    RunPerformanceTest("idlize_widthAttribute_number", 1, 10000, () => {
        peer.widthAttribute(100)
    });
    RunPerformanceTest("idlize_paddingAttribute", 1, 10000, () => {
        peer.paddingAttribute({ top: "10%", right: "10%", bottom: "10%", left: "10%" })
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
