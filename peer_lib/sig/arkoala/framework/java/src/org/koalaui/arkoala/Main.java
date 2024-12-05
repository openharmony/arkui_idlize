/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

package org.koalaui.arkoala;

import java.time.Duration;
import java.util.Date;
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        perfTests();
        peerTests();
        checkIncrementalTree();
        checkNodeAPI();
        checkComponents();

        TestUtils.checkTestFailures();
    }

    static void perfTests() {
        System.out.println("\nJava performance tests");
        checkPerf2(5*1000*1000);
        checkPerf3(5*1000*1000);
        System.out.println();
    }

    static void checkPerf2(int count) {
        var peer = ArkButtonPeer.create(null, 0);
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            if (i % 2 == 0) {
                peer.backdropBlurAttribute(i, null);
            }
            else {
                BlurOptions options = new BlurOptions();
                options.grayscale = new Tuple_double_double(1.0, 2.0);
                peer.backdropBlurAttribute(i, options);
            }
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("backdropBlur: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }

    static void checkPerf3(int count) {
        var peer = ArkButtonPeer.create(null, 0);
        var testLength_10_lpx = new Ark_Length("10lpx");
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            peer.widthAttribute(testLength_10_lpx);
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("widthAttributeString: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }

    static void peerTests() {
        System.out.println("Java peer tests");

        // interface
        var buttonPeer = ArkButtonPeer.create(null, 0);
        var labelStyle = new LabelStyle();
        labelStyle.maxLines = new Opt_Number(5);
        TestUtils.checkResult("[Interface + Optional] ButtonPeer.labelStyle",
            () -> { buttonPeer.labelStyleAttribute(labelStyle); },
            "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=5}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})");

        // union
        labelStyle.maxLines = null;
        labelStyle.font = new Font();
        labelStyle.font.weight = new Union_FontWeight_double_String("param");
        TestUtils.checkResult("[Union] ButtonPeer.labelStyle",
            () -> { buttonPeer.labelStyleAttribute(labelStyle); },
            "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_OBJECT, .value={.size={.tag=ARK_TAG_UNDEFINED, .value={}}, .weight={.tag=ARK_TAG_OBJECT, .value={.selector=2, .value2={.chars=\"param\", .length=5}}}, .family={.tag=ARK_TAG_UNDEFINED, .value={}}, .style={.tag=ARK_TAG_UNDEFINED, .value={}}}}})");
        labelStyle.font.weight = new Union_FontWeight_double_String(FontWeight.BOLD);
        TestUtils.checkResult("[Union + Enum] ButtonPeer.labelStyle",
            () -> { buttonPeer.labelStyleAttribute(labelStyle); },
            "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_OBJECT, .value={.size={.tag=ARK_TAG_UNDEFINED, .value={}}, .weight={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0=Ark_FontWeight(4)}}, .family={.tag=ARK_TAG_UNDEFINED, .value={}}, .style={.tag=ARK_TAG_UNDEFINED, .value={}}}}})");
        var resource = new Resource();
        resource.id = 10;
        resource.type = 2000;
        resource.moduleName = "module_name";
        resource.bundleName = "bundle_name";
        labelStyle.font.weight = null;
        labelStyle.font.family = new Union_String_Resource(resource);
        TestUtils.checkResult("[Union + Resource] ButtonPeer.labelStyle",
            () -> { buttonPeer.labelStyleAttribute(labelStyle); },
            "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_OBJECT, .value={.size={.tag=ARK_TAG_UNDEFINED, .value={}}, .weight={.tag=ARK_TAG_UNDEFINED, .value={}}, .family={.tag=ARK_TAG_OBJECT, .value={.selector=1, .value1={.bundleName={.chars=\"bundle_name\", .length=11}, .moduleName={.chars=\"module_name\", .length=11}, .id={.tag=102, .i32=10}, .params={.tag=ARK_TAG_UNDEFINED, .value={}}, .type={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=2000}}}}}, .style={.tag=ARK_TAG_UNDEFINED, .value={}}}}})"
            );

        // tuple
        var peer = ArkTestPeer.create(null, 0);
        var options = new BlurOptions();
        options.grayscale = new Tuple_double_double(1.0, 2.0);
        TestUtils.checkResult("[Tuple] TestPeer.backdropBlur",
            () -> { peer.backdropBlurAttribute(42, options); },
            "backdropBlur({.tag=102, .i32=42}, {.tag=ARK_TAG_OBJECT, .value={.grayscale={.value0={.tag=102, .i32=1}, .value1={.tag=102, .i32=2}}}})");
        var tuple1 = new Tuple_double_String_EnumDTS(5.5, "test", EnumDTS.ELEM_1);
        TestUtils.checkResult("[Tuple + Enum] TestPeer.testTupleNumberStringEnum",
            () -> { peer.testTupleNumberStringEnumAttribute(tuple1); },
            "testTupleNumberStringEnum({.value0={.tag=103, .f32=5.5}, .value1={.chars=\"test\", .length=4}, .value2=Ark_EnumDTS(1)})");

        // optional
        var listPeer = ArkListPeer.create(null, 0);
        TestUtils.checkResult("[Optional] ListPeer.someOptional",
            () -> { listPeer.someOptionalAttribute(new Opt_Boolean(false)); },
            "someOptional({.tag=ARK_TAG_OBJECT, .value=false})");

        // enum
        TestUtils.checkResult("[Enum] ButtonPeer.type", () -> { buttonPeer.typeAttribute(ButtonType.CAPSULE); }, "type(Ark_ButtonType(0))");
        var sheetOptions = new SheetOptions();
        sheetOptions.mode = SheetMode.EMBEDDED;
        TestUtils.checkResult("[Enum + Interface] ButtonPeer.bindSheet",
            () -> { buttonPeer.bindSheetAttribute(false, sheetOptions); },
            "bindSheet(false, {.tag=ARK_TAG_OBJECT, .value={.backgroundColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .height={.tag=ARK_TAG_UNDEFINED, .value={}}, .dragBar={.tag=ARK_TAG_UNDEFINED, .value={}}, .maskColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .detents={.tag=ARK_TAG_UNDEFINED, .value={}}, .blurStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .showClose={.tag=ARK_TAG_UNDEFINED, .value={}}, .preferType={.tag=ARK_TAG_UNDEFINED, .value={}}, .title={.tag=ARK_TAG_UNDEFINED, .value={}}, .enableOutsideInteractive={.tag=ARK_TAG_UNDEFINED, .value={}}, .width={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderWidth={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .shadow={.tag=ARK_TAG_UNDEFINED, .value={}}, .mode={.tag=ARK_TAG_OBJECT, .value=Ark_SheetMode(1)}, .uiContext={.tag=ARK_TAG_UNDEFINED, .value={}}}})");

        // array
        BooleanInterfaceDTS[] booleanInterface = { new BooleanInterfaceDTS(), new BooleanInterfaceDTS() };
        booleanInterface[0].valBool = true;
        TestUtils.checkResult("[Array] TestPeer.testBooleanInterfaceArray",
            () -> { peer.testBooleanInterfaceArrayAttribute(booleanInterface); },
            "testBooleanInterfaceArray({.array=allocArray<Ark_BooleanInterfaceDTS, 2>({{{.valBool=true}, {.valBool=false}}}), .length=2})");
        TestUtils.checkResult("[Array] TestPeer.testBooleanInterfaceArrayRef",
            () -> { peer.testBooleanInterfaceArrayRefAttribute(booleanInterface); },
            "testBooleanInterfaceArrayRef({.array=allocArray<Ark_BooleanInterfaceDTS, 2>({{{.valBool=true}, {.valBool=false}}}), .length=2})");
        var dragPreviewOptions = new DragPreviewOptions();
        DragPreviewMode[] modes = { DragPreviewMode.DISABLE_SCALE, DragPreviewMode.ENABLE_DEFAULT_RADIUS };
        dragPreviewOptions.mode = new Union_DragPreviewMode_Array_DragPreviewMode(modes);
        dragPreviewOptions.numberBadge = new Union_boolean_double(false);
        var dragInteractionOptions = new DragInteractionOptions();
        dragInteractionOptions.defaultAnimationBeforeLifting = new Opt_Boolean(true);
        // this test is expected to fail in case of generation from d.ts
        TestUtils.checkResult("[Array + Interface + Union] ButtonPeer.dragPreviewOptions",
            () -> { buttonPeer.dragPreviewOptionsAttribute(dragPreviewOptions, dragInteractionOptions); },
            "dragPreviewOptions({.mode={.tag=ARK_TAG_OBJECT, .value={.selector=1, .value1={.array=allocArray<Ark_DragPreviewMode, 2>({{Ark_DragPreviewMode(2), Ark_DragPreviewMode(4)}}), .length=2}}}, .numberBadge={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0=false}}}, {.tag=ARK_TAG_OBJECT, .value={.isMultiSelectionEnabled={.tag=ARK_TAG_UNDEFINED, .value={}}, .defaultAnimationBeforeLifting={.tag=ARK_TAG_OBJECT, .value=true}}})");

        // map
        var dataInfo = new NativeEmbedDataInfo();
        dataInfo.info = new NativeEmbedInfo();
        dataInfo.info.params = new TreeMap<String, String>(Map.of("k1", "v1", "k2", "v2"));
        var webPeer = ArkWebPeer.create(null, 0);
        TestUtils.checkResult("[Map] WebPeer.testMethod",
            () -> { webPeer.testMethodAttribute(dataInfo); },
            "testMethod({.info={.tag=ARK_TAG_OBJECT, .value={.params={.tag=ARK_TAG_OBJECT, .value={{.chars=\"k1\", .length=2}: {.chars=\"v1\", .length=2}, {.chars=\"k2\", .length=2}: {.chars=\"v2\", .length=2}}}}}})");
        var doubleStringMap = new TreeMap<Double, String>(Map.of(1.0, "v1", 2.0, "v2"));
        var unionWithMap = new Union_double_Map_Double_String(doubleStringMap);
        TestUtils.checkResult("[Map + Union] TestPeer.testUnionWithMap",
            () -> { peer.testUnionWithMapAttribute(unionWithMap); },
            "testUnionWithMap({.selector=1, .value1={{.tag=102, .i32=1}: {.chars=\"v1\", .length=2}, {.tag=102, .i32=2}: {.chars=\"v2\", .length=2}}})");
        TestUtils.checkResult("[Map] TestPeer.testMap",
            () -> { peer.testMapAttribute(doubleStringMap); },
            "testMap({{.tag=102, .i32=1}: {.chars=\"v1\", .length=2}, {.tag=102, .i32=2}: {.chars=\"v2\", .length=2}})");

        // materialized classes
        TestUtils.checkResult("[Materialized] ctor",
            () -> { new ClassWithConstructorAndAllOptionalParamsDTS(new Opt_Number(10), null); },
            "new ClassWithConstructorAndAllOptionalParamsDTS({.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=10}}, {.tag=ARK_TAG_UNDEFINED, .value={}})[return (ClassWithConstructorAndAllOptionalParamsDTSPeer*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]"
            );
        TestUtils.checkResult("[Materialized] of",
            () -> { ClassWithConstructorAndAllOptionalParamsDTS.of(null, "test"); },
            "of({.tag=ARK_TAG_UNDEFINED, .value={}}, {.tag=ARK_TAG_OBJECT, .value={.chars=\"test\", .length=4}})[return (void*) 300]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]"
            );
        var classCtor = new ClassWithConstructorAndAllOptionalParamsDTS(new Opt_Number(10), null);
        var classOf = ClassWithConstructorAndAllOptionalParamsDTS.of(null, "test");
        TestUtils.checkResult("[Materialized] method",
            () -> { classOf.method(new Opt_Boolean(false), null); },
            "method({.tag=ARK_TAG_OBJECT, .value=false}, {.tag=ARK_TAG_UNDEFINED, .value={}})");
        TestUtils.checkResult("[Materialized] TestPeer.testClassWithConstructorAndAllOptionalParams(ctor)",
            () -> { peer.testClassWithConstructorAndAllOptionalParamsAttribute(classCtor); },
            "testClassWithConstructorAndAllOptionalParams(\"Materialized 0x64\")");
        TestUtils.checkResult("[Materialized] TestPeer.testClassWithConstructorAndAllOptionalParams(of)",
            () -> { peer.testClassWithConstructorAndAllOptionalParamsAttribute(classOf); },
            "testClassWithConstructorAndAllOptionalParams(\"Materialized 0x12c\")");

        var startDate = new Date();
        var endDate = new Date();
        var datePickerOptions = new DatePickerOptionsTest();
        datePickerOptions.start = startDate;
        datePickerOptions.end = endDate;
        TestUtils.checkResult("[Date] TestPeer.testDateCustomObject",
            () -> { peer.testDateCustomObjectAttribute(datePickerOptions); },
            String.format("testDateCustomObject({.start={.tag=ARK_TAG_OBJECT, .value=%d}, .end={.tag=ARK_TAG_OBJECT, .value=%d}})", startDate.getTime(), endDate.getTime()));

        // builder classes
        var len = new Ark_Length("10lpx");
        var indicator = DotIndicator.dot().right(len).left(len).itemWidth(len);
        var swiperPeer = ArkSwiperPeer.create(null, 0);
        TestUtils.checkResult("[Builder] SwiperPeer.indicator",
            () -> { swiperPeer.indicatorAttribute(indicator); },
            "indicator({._left={.tag=ARK_TAG_OBJECT, .value={.type=2, .value=10, .unit=4, .resource=0}}, ._top={.tag=ARK_TAG_UNDEFINED, .value={}}, ._right={.tag=ARK_TAG_OBJECT, .value={.type=2, .value=10, .unit=4, .resource=0}}, ._bottom={.tag=ARK_TAG_UNDEFINED, .value={}}, ._start={.tag=ARK_TAG_UNDEFINED, .value={}}, ._end={.tag=ARK_TAG_UNDEFINED, .value={}}, ._itemWidth={.tag=ARK_TAG_OBJECT, .value={.type=2, .value=10, .unit=4, .resource=0}}, ._itemHeight={.tag=ARK_TAG_UNDEFINED, .value={}}})");

        System.out.println();
    }

    static void checkIncrementalTree() {
        System.out.println("Java IncremerntalTree tests");

        var root = ArkButtonPeer.create(null, 0);
        var child1 = ArkWebPeer.create(null, 0);
        child1.incrementalUpdateDone(root);
        var child2 = ArkColumnPeer.create(null, 0);
        child2.incrementalUpdateDone(root);
        var child3 = ArkSwiperPeer.create(null, 0);
        child3.incrementalUpdateDone(root);
        var child4 = ArkWebPeer.create(null, 0);
        child4.incrementalUpdateDone(child2);
        System.out.println(root.toHierarchy());

        child2.dispose();
        System.out.println(root.toHierarchy());

        System.out.println();
    }

    static void checkNodeAPI() {
        System.out.println("Java TreeNode tests");

        var root = ArkColumnPeer.create(null, 0);
        var child1 = ArkButtonPeer.create(null, 0);
        var child2 = ArkBlankPeer.create(null, 0);
        var child3 = ArkListPeer.create(null, 0);
        var child4 = ArkWebPeer.create(null, 0);
        var child5 = ArkWebPeer.create(null, 0);

        TestUtils.checkResult("BasicNodeAPI addChild", () -> root.peer.addChild(child1.peer),
            String.format("addChild(0x%d, 0x%d)markDirty(0x%d, 32)", root.peer.ptr, child1.peer.ptr, root.peer.ptr, root.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI insertChildAfter", () -> root.peer.insertChildAfter(child4.peer, child1.peer),
            String.format("insertChildAfter(0x%d, 0x%d, 0x%d)markDirty(0x%d, 32)", root.peer.ptr, child4.peer.ptr, child1.peer.ptr, root.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI insertChildBefore", () -> root.peer.insertChildBefore(child3.peer, child4.peer),
            String.format("insertChildBefore(0x%d, 0x%d, 0x%d)markDirty(0x%d, 32)", root.peer.ptr, child3.peer.ptr, child4.peer.ptr, root.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI insertChildAt", () -> root.peer.insertChildAt(child2.peer, 1),
            String.format("insertChildAt(0x%d, 0x%d, %d)markDirty(0x%d, 32)", root.peer.ptr, child2.peer.ptr, 1, root.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI insertChildAfter (empty tree case)", () -> child4.peer.insertChildAfter(child5.peer, null),
            String.format("insertChildAfter(0x%d, 0x%d, 0x%d)markDirty(0x%d, 32)", child4.peer.ptr, child5.peer.ptr, 0, child4.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI removeChild", () -> root.peer.removeChild(child2.peer),
            String.format("removeChild(0x%d, 0x%d)markDirty(0x%d, 32)", root.peer.ptr, child2.peer.ptr, root.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI dispose", () -> child2.peer.dispose(),
            String.format("disposeNode(0x%d)", child2.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI dumpTree", () -> root.peer.dumpTree(),
            String.format("dumpTreeNode(0x%d)", root.peer.ptr));
        TestUtils.checkResult("BasicNodeAPI measureLayoutAndDraw", () -> NativeModule._MeasureLayoutAndDraw(root.peer.ptr),
            String.format("measureLayoutAndDraw(0x%d)", root.peer.ptr));

        System.out.println();
    }

    static void checkComponents() {
        System.out.println("Java Components tests");

        class ArkSideBarContainerComponentTest extends ArkSideBarContainerComponent {
            protected boolean checkPriority(String name) {
                return true;
            }
        }

        var component = new ArkSideBarContainerComponentTest();
        var peer = ArkSideBarContainerPeer.create(component, 0);
        component.setPeer(peer);
        TestUtils.checkResult("ArkSideBarContainerComponent method overloads",
            () -> component.minSideBarWidth(10.0).minSideBarWidth(new Ark_Length("10lpx")),
            "minSideBarWidth({.tag=102, .i32=10})minSideBarWidth({.type=2, .value=10, .unit=4, .resource=0})");

        System.out.println();
    }
}

// Old: JS 167ms per 1M, Java 15 ms per 1M
