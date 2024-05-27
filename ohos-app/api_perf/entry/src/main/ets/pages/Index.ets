import { NodeController, FrameNode } from '@ohos.arkui.node';
import { startPerformanceTest, RunPerformanceTest } from '../idlize/test_performance';
import { TEST_COUNT, CALL_COUNT, testString1000, testLength_10_percent, testLength_number100, testNumber100 } from '../idlize/test_data'

function startFrameNodePerformanceTest(node: FrameNode) {
  RunPerformanceTest("frameNode_restoreId_testNumber100", TEST_COUNT, CALL_COUNT, () => {
    node.commonAttribute.restoreId(testNumber100)
  })
  RunPerformanceTest("frameNode_key_testString1000", TEST_COUNT, CALL_COUNT, () => {
    node.commonAttribute.key(testString1000)
  })
  RunPerformanceTest("frameNode_width_testLength_10_percent", TEST_COUNT, CALL_COUNT, () => {
    node.commonAttribute.width(testLength_10_percent)
  })
  RunPerformanceTest("frameNode_width_testLength_number100", TEST_COUNT, CALL_COUNT, () => {
    node.commonAttribute.width(testLength_number100)
  })
  RunPerformanceTest("frameNode_padding", TEST_COUNT, CALL_COUNT, () => {
    node.commonAttribute.padding({
      top: testLength_10_percent, right: testLength_10_percent,
      bottom: testLength_10_percent, left: testLength_10_percent
    })
  })
  RunPerformanceTest("frameNode_backgroundBlurStyle", TEST_COUNT, CALL_COUNT, () => {
    node.commonAttribute.backgroundBlurStyle(0, {
      colorMode: 0,
      adaptiveColor: 0,
      scale: 1,
      blurOptions: {
        grayscale: [1, 1]
      }
    })
  })
}

class MyNodeController extends NodeController {
  private rootNode: FrameNode | null = null;

  makeNode(uiContext: UIContext): FrameNode | null {
    this.rootNode = new FrameNode(uiContext);
    const renderNode = this.rootNode.getRenderNode();
    if (renderNode !== null) {
      renderNode.size = { width: 100, height: 100 };
      renderNode.backgroundColor = 0XFFFF0000;
    }
    startPerformanceTest()
    startFrameNodePerformanceTest(this.rootNode)

    return this.rootNode;
  }
}

@Entry
@Component
struct Index {
  private myNodeController: MyNodeController = new MyNodeController();

  build() {
    Row() {
      NodeContainer(this.myNodeController)
    }
  }
}