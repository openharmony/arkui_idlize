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

package org.koalaui.arkoala;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        long str = NativeModule._StringMake("Hello");
        System.out.println(NativeModule._StringLength(str));
        //Main.checkPerf(10*1000*1000);
        //NativeModule._StartGroupedLog(1);
        Main.checkPerf2(5*1000*1000);
        Main.checkPerf3(5*1000*1000);
        Main.checkPeers();
        //NativeModule._StopGroupedLog(1);
    }

    static void checkPerf(int count) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            NativeModule._TestPerfNumber(i);
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("NUMBER: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");

        start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            byte[] data = new byte[5];
            data[0] = 1;
            data[1] = (byte)(i >> 24);
            data[2] = (byte)(i >> 16);
            data[3] = (byte)(i >> 8);
            data[4] = (byte)(i >> 0);
            NativeModule._TestPerfNumberWithArray(data, data.length);
        }
        passed = System.currentTimeMillis() - start;
        System.out.println("ARRAY: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }

    static void checkPerf2(int count) {
        var peer = new ArkButtonPeer(ArkUINodeType.Root, null, 0);
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
        var peer = new ArkButtonPeer(ArkUINodeType.Root, null, 0);
        var testLength_10_lpx = new Ark_Length("10lpx");
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            peer.widthAttribute(testLength_10_lpx);
        }
        long passed = System.currentTimeMillis() - start;
        System.out.println("widthAttributeString: " + String.valueOf(passed) + "ms for " + count + " iteration, " + Math.round((double)passed / count * 1000000) + "ms per 1M iterations");
    }

    static void checkPeers() {
        // interface
        var buttonPeer = new ArkButtonPeer(ArkUINodeType.Root, null, 0);
        var labelStyle = new LabelStyle();
        labelStyle.maxLines = new Opt_Number(5);
        buttonPeer.labelStyleAttribute(labelStyle);
        System.out.println("Interface tests done");

        // union
        buttonPeer.fontColorAttribute(new Union_Ark_Color_double_String_Resource(5.5));
        buttonPeer.fontColorAttribute(new Union_Ark_Color_double_String_Resource(Ark_Color.White)); // +enum
        var resource = new Resource();
        resource.id = 10;
        resource.type = 2000;
        resource.moduleName = "module_name";
        resource.bundleName = "bundle_name";
        buttonPeer.fontColorAttribute(new Union_Ark_Color_double_String_Resource(resource)); // +import
        System.out.println("Union tests done");

        // enum
        buttonPeer.typeAttribute(Ark_ButtonType.Capsule);
        System.out.println("Enum tests done");

        // tuple
        var peer = new ArkTestPeer(ArkUINodeType.Root /* ArkUINodeType.Test */, null, 0);
        var options = new BlurOptions();
        options.grayscale = new Tuple_double_double(1.0, 2.0);
        peer.backdropBlurAttribute(42, options);
        var tuple1 = new Tuple_double_String_Ark_EnumDTS(5.5, "test", Ark_EnumDTS.ELEM_1);
        peer.testTupleNumberStringEnumAttribute(tuple1); // +enum
        System.out.println("Tuple tests done");

        // optional
        peer.someOptionalBoolAttribute(new Opt_Boolean(false));
        peer.someOptionalEnumAttribute(Ark_EnumDTS.ELEM_1); // +enum
        var optionalInterface = new OptionalTestInterface();
        optionalInterface.optNumber = new Opt_Number(10);
        peer.testOptionInterface_OptionalTestInterfaceAttribute(optionalInterface); // +interface
        System.out.println("Optional tests done");

        // array
        BooleanInterfaceDTS[] booleanInterface = { new BooleanInterfaceDTS(), new BooleanInterfaceDTS() };
        booleanInterface[0].valBool = true;
        peer.testBooleanInterfaceArrayAttribute(booleanInterface); // no interface
        peer.testBooleanInterfaceArrayRefAttribute(booleanInterface); // no interface
        var dragPreviewOptions = new DragPreviewOptions();
        Ark_DragPreviewMode[] modes = { Ark_DragPreviewMode.DISABLE_SCALE, Ark_DragPreviewMode.ENABLE_DEFAULT_RADIUS };
        dragPreviewOptions.mode = new Union_Ark_DragPreviewMode_Array_Ark_DragPreviewMode(modes);
        dragPreviewOptions.numberBadge = new Union_boolean_double(false);
        var dragInteractionOptions = new DragInteractionOptions();
        dragInteractionOptions.defaultAnimationBeforeLifting = new Opt_Boolean(true);
        buttonPeer.dragPreviewOptionsAttribute(dragPreviewOptions, dragInteractionOptions); // +interface +union
        System.out.println("Array tests done");

        // map
        var dataInfo = new NativeEmbedDataInfo();
        dataInfo.info = new NativeEmbedInfo();
        dataInfo.info.params = Map.of("k1", "v1", "k2", "v2");
        var webPeer = new ArkWebPeer(ArkUINodeType.Root /* ArkUINodeType.Web */, null, 0);
        webPeer.testMethodAttribute(dataInfo);
        System.out.println("Map tests done");
        var doubleStringMap = Map.of(1.0, "v1", 2.0, "v2");
        var unionWithMap = new Union_double_Map_Double_String(doubleStringMap);
        peer.testUnionWithMapAttribute(unionWithMap); // +union
        peer.testMapAttribute(doubleStringMap); // +map in peer method
    }
}

// Old: JS 167ms per 1M, Java 15 ms per 1M