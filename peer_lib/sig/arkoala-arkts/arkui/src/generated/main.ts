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
import { NativeModule, nativeModule } from "#components"
import { wrapCallback, callCallback } from "./CallbackRegistry"
import { assertEquals, assertThrows } from "./test_utils"
import { ArkButtonPeer } from "@arkoala/arkui/peers/ArkButtonPeer"
import { ArkColumnPeer } from "@arkoala/arkui/peers/ArkColumnPeer"
import { ArkUINodeType } from "@arkoala/arkui/peers/ArkUINodeType"
import { ButtonType, LabelStyle } from '@arkoala/arkui/ArkButtonInterfaces'
import { BlurOptions,
    SheetSize,
    BlurStyle,
    SheetType,
    SheetDismiss,
    DismissSheetAction,
    SpringBackAction,
    EdgeWidths,
    LocalizedEdgeWidths,
    EdgeColors,
    LocalizedEdgeColors,
    BorderStyle,
    ShadowOptions,
    ShadowStyle,
    SheetMode,
    Callback,
    SheetTitleOptions,
    SheetOptions,
    CustomBuilder,
    EdgeStyles,
    UIContext,
    ScrollSizeMode,
    Position,
    SheetKeyboardAvoidMode,
    Literal_Alignment_align,
    HoverModeAreaType } from "@arkoala/arkui/ArkCommonInterfaces"
import { Dimension,
    Length,
    ResourceColor,
    ResourceStr,
    Font,
    Position } from "@arkoala/arkui/ArkUnitsInterfaces"

import { Resource } from "./ArkResourceInterfaces"

import { Alignment, TextOverflow, TextHeightAdaptivePolicy } from "@arkoala/arkui/ArkEnumsInterfaces"

import { DeserializerBase } from "@arkoala/arkui/peers/DeserializerBase"
import { Deserializer } from "@arkoala/arkui/peers/Deserializer"
import { Serializer } from "@arkoala/arkui/peers/Serializer"
import { CallbackKind } from "@arkoala/arkui/peers/CallbackKind"
import { ResourceId } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "@arkoala/arkui/peers/CallbacksChecker"


const testString1000 = "One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand words One Thousand";

/*
V8:
backdropBlur: 1456ms for 5000000 iteration, 291ms per 1M iterations
widthAttributeString: 1006ms for 5000000 iteration, 201ms per 1M iterations


PANDA:
"backdropBlur: 3518ms for 5000000 iteration, 704ms per 5000000 iterations"
"widthAttributeString: 1380ms for 5000000 iteration, 276ms per 5000000 iterations"

JVM:
backdropBlur: 284ms for 5000000 iteration, 57ms per 1M iterations
widthAttributeString: 502ms for 5000000 iteration, 100ms per 1M iterations

*/

let hasTestErrors = false

export function getNativeLog(): string {
    let ptr = NativeModule._GetGroupedLog(1)
    let length = NativeModule._StringLength(ptr)
    let data = new byte[length]
    NativeModule._StringData(ptr, data, length)
    NativeModule._InvokeFinalizer(ptr, NativeModule._GetStringFinalizer())
    // TODO: better string decoding.
    let result = new StringBuilder()
    for (let i = 0; i < length; i++) {
        result.append(String.fromCharCode(data[i] as number))
    }
    return result.toString()
}

export function checkResult(name: string, test: () => void, expected: string) {
    NativeModule._StartGroupedLog(1)
    test()
    NativeModule._StopGroupedLog(1)
    const actual = getNativeLog()
    if (actual != expected) {
        console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${actual}"`)
        hasTestErrors = true
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

class LabelStyleImpl implements LabelStyle {
    _textOverflow: TextOverflow | undefined
    _maxLines: number | undefined
    _minFontSize: number | ResourceStr | undefined
    _maxFontSize: number | ResourceStr | undefined
    _heightAdaptivePolicy: TextHeightAdaptivePolicy | undefined
    _font: Font | undefined

    constructor(maxLines?: number) {
        this._maxLines = maxLines
    }

    get overflow(): TextOverflow | undefined {
        return this._textOverflow
    }
    set overflow(arg: TextOverflow | undefined) {
        this._textOverflow = arg
    }

    get maxLines(): number | undefined {
        return this._maxLines
    }
    set maxLines(arg: number | undefined) {
        this._maxLines = arg
    }

    get minFontSize(): number | ResourceStr | undefined {
        return this._minFontSize
    }
    set minFontSize(arg: number | ResourceStr | undefined) {
        this._minFontSize = arg
    }

    get maxFontSize(): number | ResourceStr | undefined {
        return this._maxFontSize
    }
    set maxFontSize(arg: number | ResourceStr | undefined) {
        this._maxFontSize = arg
    }

    get heightAdaptivePolicy(): TextHeightAdaptivePolicy | undefined {
        return this._heightAdaptivePolicy
    }
    set heightAdaptivePolicy(arg: TextHeightAdaptivePolicy | undefined) {
        this._heightAdaptivePolicy = arg
    }

    get font(): Font | undefined {
        return this._font
    }
    set font(arg: Font | undefined) {
        this._font = arg
    }
}

class SheetTitleOptionsImpl implements SheetTitleOptions {
    _title: ResourceStr
    _subtitle: ResourceStr | undefined

    constructor(title: ResourceStr) {
        this._title = title
    }

    get title(): ResourceStr {
        return this._title
    }
    set title(arg: ResourceStr) {
        this._title = arg
    }

    get subtitle(): ResourceStr | undefined {
        return this._subtitle
    }
    set subtitle(arg: ResourceStr | undefined) {
        this._subtitle = arg
    }
}
class SheetOptionsImpl implements SheetOptions {
    _height: SheetSize | Length|undefined;
    _dragBar: boolean|undefined;
    _maskColor: ResourceColor|undefined;
    _detents: [ SheetSize | Length, SheetSize | Length | undefined, SheetSize | Length | undefined ]|undefined;
    _blurStyle: BlurStyle|undefined;
    _showClose: boolean | Resource|undefined;
    _preferType: SheetType|undefined;
    _title: SheetTitleOptions | CustomBuilder|undefined;
    _shouldDismiss: Callback<SheetDismiss,void>|undefined;
    _onWillDismiss: Callback<DismissSheetAction,void>|undefined;
    _onWillSpringBackWhenDismiss: Callback<SpringBackAction,void>|undefined;
    _enableOutsideInteractive: boolean|undefined;
    _width: Dimension|undefined;
    _borderWidth: Dimension | EdgeWidths | LocalizedEdgeWidths|undefined;
    _borderColor: ResourceColor | EdgeColors | LocalizedEdgeColors|undefined;
    _borderStyle: BorderStyle | EdgeStyles|undefined;
    _shadow: ShadowOptions | ShadowStyle|undefined;
    _onHeightDidChange: Callback<number,void>|undefined;
    _mode: SheetMode|undefined;
    _scrollSizeMode: ScrollSizeMode|undefined;
    _onDetentsDidChange: Callback<number,void>|undefined;
    _onWidthDidChange: Callback<number,void>|undefined;
    _onTypeDidChange: Callback<SheetType,void>|undefined;
    _uiContext: UIContext|undefined;
    _keyboardAvoidMode: SheetKeyboardAvoidMode|undefined;
    _enableHoverMode: boolean|undefined;
    _hoverModeArea: HoverModeAreaType|undefined;
    _backgroundColor: ResourceColor|undefined;
    _onAppear: (() => void)|undefined;
    _onDisappear: (() => void)|undefined;
    _onWillAppear: (() => void)|undefined;
    _onWillDisappear: (() => void)|undefined;
    _offset?: Position;

    constructor(title?: SheetTitleOptions) {
        this._title = title
    }

    get title(): SheetTitleOptions | CustomBuilder| undefined {
        return this._title
    }
    set title(arg: SheetTitleOptions | CustomBuilder| undefined) {
        this._title = arg
    }

    get onWillDismiss(): Callback<DismissSheetAction, void>| undefined {
        return this._onWillDismiss
    }
    set onWillDismiss(arg: Callback<DismissSheetAction, void>| undefined) {
        this._onWillDismiss = arg
    }

    get detents(): [(SheetSize | Length), (SheetSize | Length) | undefined, (SheetSize | Length) | undefined] | undefined {
        return this._detents
    }
    set detents(arg: [(SheetSize | Length), (SheetSize | Length) | undefined, (SheetSize | Length) | undefined] | undefined) {
        this._detents = arg
    }

    get height(): SheetSize | Length| undefined {
        return this._height
    }
    set height(arg: SheetSize | Length| undefined) {
        this._height = arg
    }

    get dragBar(): boolean| undefined {
        return this._dragBar
    }
    set dragBar(arg: boolean| undefined) {
        this._dragBar = arg
    }

    get maskColor(): ResourceColor| undefined {
        return this._maskColor
    }
    set maskColor(arg: ResourceColor| undefined) {
        this._maskColor = arg
    }

    get blurStyle(): BlurStyle| undefined {
        return this._blurStyle
    }
    set blurStyle(arg: BlurStyle| undefined) {
        this._blurStyle = arg
    }

    get showClose(): boolean | Resource| undefined {
        return this._showClose
    }
    set showClose(arg: boolean | Resource| undefined) {
        this._showClose = arg
    }

    get preferType(): SheetType| undefined {
        return this._preferType
    }
    set preferType(arg: SheetType| undefined) {
        this._preferType = arg
    }

    get shouldDismiss(): ((sheetDismiss: SheetDismiss) => void) | undefined {
        return this._shouldDismiss
    }
    set shouldDismiss(arg: ((sheetDismiss: SheetDismiss) => void) | undefined) {
        this._shouldDismiss = arg
    }

    get onWillSpringBackWhenDismiss(): Callback<SpringBackAction, void>| undefined {
        return this._onWillSpringBackWhenDismiss
    }
    set onWillSpringBackWhenDismiss(arg: Callback<SpringBackAction, void>| undefined) {
        this._onWillSpringBackWhenDismiss = arg
    }

    get enableOutsideInteractive(): boolean| undefined {
        return this._enableOutsideInteractive
    }
    set enableOutsideInteractive(arg: boolean| undefined) {
        this._enableOutsideInteractive = arg
    }

    get width(): Dimension| undefined {
        return this._width
    }
    set width(arg: Dimension| undefined) {
        this._width = arg
    }

    get borderWidth(): Dimension | EdgeWidths | LocalizedEdgeWidths| undefined {
        return this._borderWidth
    }
    set borderWidth(arg: Dimension | EdgeWidths | LocalizedEdgeWidths| undefined) {
        this._borderWidth = arg
    }

    get borderColor(): ResourceColor | EdgeColors | LocalizedEdgeColors| undefined {
        return this._borderColor
    }
    set borderColor(arg: ResourceColor | EdgeColors | LocalizedEdgeColors| undefined) {
        this._borderColor = arg
    }

    get borderStyle(): BorderStyle | EdgeStyles| undefined {
        return this._borderStyle
    }
    set borderStyle(arg: BorderStyle | EdgeStyles| undefined) {
        this._borderStyle = arg
    }

    get shadow(): ShadowOptions | ShadowStyle| undefined {
        return this._shadow
    }
    set shadow(arg: ShadowOptions | ShadowStyle| undefined) {
        this._shadow = arg
    }

    get onHeightDidChange(): Callback<number, void>| undefined {
        return this._onHeightDidChange
    }
    set onHeightDidChange(arg: Callback<number, void>| undefined) {
        this._onHeightDidChange = arg
    }

    get mode(): SheetMode| undefined {
        return this._mode
    }
    set mode(arg: SheetMode| undefined) {
        this._mode = arg
    }

    get scrollSizeMode(): ScrollSizeMode| undefined {
        return this._scrollSizeMode
    }
    set scrollSizeMode(arg: ScrollSizeMode| undefined) {
        this._scrollSizeMode = arg
    }

    get onDetentsDidChange(): Callback<number, void>| undefined {
        return this._onDetentsDidChange
    }
    set onDetentsDidChange(arg: Callback<number, void>| undefined) {
        this._onDetentsDidChange = arg
    }

    get onWidthDidChange(): Callback<number, void>| undefined {
        return this._onWidthDidChange
    }
    set onWidthDidChange(arg: Callback<number, void>| undefined) {
        this._onWidthDidChange = arg
    }

    get onTypeDidChange(): Callback<SheetType, void>| undefined {
        return this._onTypeDidChange
    }
    set onTypeDidChange(arg: Callback<SheetType, void>| undefined) {
        this._onTypeDidChange = arg
    }

    get uiContext(): UIContext| undefined {
        return this._uiContext
    }
    set uiContext(arg: UIContext| undefined) {
        this._uiContext = arg
    }

    get enableHoverMode(): boolean | undefined {
        return this._enableHoverMode
    }
    set enableHoverMode(arg: boolean | undefined) {
        this._enableHoverMode = arg
    }

    get hoverModeArea(): HoverModeAreaType | undefined {
        return this._hoverModeArea
    }
    set hoverModeArea(arg: HoverModeAreaType | undefined) {
        this._hoverModeArea = arg
    }

    get backgroundColor(): ResourceColor | undefined {
        return this._backgroundColor
    }
    set backgroundColor(arg: ResourceColor | undefined) {
        this._backgroundColor = arg
    }

    get onAppear(): (() => void) | undefined {
        return this._onAppear
    }
    set onAppear(arg: (() => void) | undefined) {
        this._onAppear = arg
    }

    get onDisappear(): (() => void) | undefined {
        return this._onDisappear
    }
    set onDisappear(arg: (() => void) | undefined) {
        this._onDisappear = arg
    }

    get onWillAppear(): (() => void) | undefined {
        return this._onWillAppear
    }
    set onWillAppear(arg: (() => void) | undefined) {
        this._onWillAppear = arg
    }

    get onWillDisappear(): (() => void) | undefined {
        return this._onWillDisappear
    }
    set onWillDisappear(arg: (() => void) | undefined) {
        this._onWillDisappear = arg
    }

    get keyboardAvoidMode(): SheetKeyboardAvoidMode | undefined {
        return this._keyboardAvoidMode
    }
    set keyboardAvoidMode(arg: SheetKeyboardAvoidMode | undefined) {
        this._keyboardAvoidMode = arg
    }

    get offset(): Position | undefined {
        return this._offset
    }
    set offset(arg: Position | undefined) {
        this._offset = arg
    }
}

class BlurOptionsImpl implements BlurOptions {
    _grayscale: [number, number]

    constructor(grayscale: [number, number]) {
        this._grayscale = grayscale
    }

    get grayscale(): [number, number] {
        return this._grayscale
    }
    set grayscale(arg: [number, number]) {
        this._grayscale = arg
    }
}

function checkPerf2(count: number) {
    let peer = ArkButtonPeer.create(ArkUINodeType.Button)
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        peer.backdropBlurAttribute(i, i % 2 == 0 ? undefined : new BlurOptionsImpl([1, 2] as [number, number]))
    }
    let passed = Date.now() - start
    console.log(`backdropBlur: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1_000_000)}ms per 1M iterations`)
}

function checkPerf3(count: number) {
    let peer = ArkButtonPeer.create(ArkUINodeType.Button)
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        peer.widthAttribute(testString1000)
    }
    let passed = Date.now() - start
    console.log(`widthAttributeString: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1_000_000)}ms per 1M iterations`)
}

function checkButton() {
    let peer = ArkButtonPeer.create(ArkUINodeType.Button)

    checkResult("width", () => peer.widthAttribute("42%"),
        "width({.type=2, .value=42, .unit=3, .resource=0})")
    const resource: Resource = { id: 43, bundleName: "MyApp", moduleName: "MyApp" }
    checkResult("height", () => peer.heightAttribute(resource),
        "height({.type=3, .value=0, .unit=1, .resource=43})")
    checkResult("height", () => peer.heightAttribute(44),
        "height({.type=1, .value=44, .unit=1, .resource=0})")
    const builder: CustomBuilder = () => { return new Object() }
    const options: Literal_Alignment_align = { align: Alignment.of(4) }
    checkResult("background", () => peer.backgroundAttribute(builder, options),
        "background({.resource={.resourceId=100, .hold=0, .release=0}, .call=0}, {.tag=ARK_TAG_OBJECT, .value={.align={.tag=ARK_TAG_OBJECT, .value=Ark_Alignment(4)}}})")
    checkResult("type", () => peer.typeAttribute(ButtonType.of(1)), "type(Ark_ButtonType(1))")
    checkResult("labelStyle", () => peer.labelStyleAttribute(new LabelStyleImpl(3)),
         "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=3}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute(new LabelStyleImpl()),
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
}

function checkCallback() {
    const id1 = wrapCallback((args: byte[], length: int) => 2024)
    const id2 = wrapCallback((args: byte[], length: int) => 2025)

    assertEquals("Call callback 1", 2024, callCallback(id1, [], 0))
    assertEquals("Call callback 2", 2025, callCallback(id2, [], 0))
    assertThrows("Call disposed callback 1", () => { callCallback(id1, [], 0) })
    assertThrows("Call callback 0", () => { callCallback(0, [2, 4, 6, 8], 4) })
}

function createDefaultWriteCallback(kind: CallbackKind, callback: object) {
    return (serializer: Serializer) => {
        return serializer.holdAndWriteCallback(callback,
            nativeModule()._TestGetManagedHolder(),
            nativeModule()._TestGetManagedReleaser(),
            nativeModule()._TestGetManagedCaller(kind.value),
        )
    }
}

function enqueueCallback(
    writeCallback: (serializer: Serializer) => ResourceId,
    readAndCallCallback: (deserializer: Deserializer) => void,
) {
    const serializer = Serializer.hold()
    const resourceId = writeCallback(serializer)
    /* imitate libace holding resource */
    nativeModule()._HoldArkoalaResource(resourceId)
    /* libace stored resource somewhere */
    const buffer = new byte[serializer.length()]
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = serializer.asArray()[i]
    }
    serializer.release()

    /* libace calls stored callback */
    const deserializer = new Deserializer(buffer, buffer.length)
    readAndCallCallback(deserializer)
    /* libace released resource */
    nativeModule()._ReleaseArkoalaResource(resourceId)
}

function checkTwoSidesCallback() {
    nativeModule()._TestSetArkoalaCallbackCaller()

    let callResult1 = "NOT_CALLED"
    let callResult2 = 0
    const call2Count = 100

    enqueueCallback(
        createDefaultWriteCallback(CallbackKind.Kind_Callback_Number_Void, (value: number): void => {
            callResult1 = `CALLED, value=${value}`
        }),
        (deserializer) => {
            const callback = deserializer.readCallback_Number_Void()
            callback(194)
        },
    )
    for (let i = 0; i < call2Count; i++) {
        enqueueCallback(
            createDefaultWriteCallback(CallbackKind.Kind_Callback_Void, (): void => {
                callResult2++
            }),
            (deserializer) => {
                const callback = deserializer.readCallback_Void()
                callback()
            },
        )
    }

    assertEquals("Callback 1 enqueued", "NOT_CALLED", callResult1)
    assertEquals(`Callback 2 enqueued ${call2Count} times`, 0, callResult2)
    checkArkoalaCallbacks()
    assertEquals("Callback 1 read&called", "CALLED, value=194", callResult1)
    assertEquals(`Callback 2 read&called ${call2Count} times`, call2Count, callResult2)
}

function checkNativeCallback() {
    const id1 = wrapCallback((args: byte[], length: int): int => {
        return 123456
    })
    assertEquals("NativeCallback without args", 123456, nativeModule()._TestCallIntNoArgs(id1))
    assertThrows("NativeCallback without args called again", () => { callCallback(id1, [], 0) })
    assertThrows("NativeCallback without args called again from native", () => { nativeModule()._TestCallIntNoArgs(id1) })

    const id2 = wrapCallback((args: byte[], length: int): int => {
        const buf = new ArrayBuffer(length)
        const view = new DataView(buf)
        const args32 = new Int32Array(buf)
        for (let i = 0; i < length; i++) {
            view.setUint8(i, args[i]);
        }
        let sum: int = 0
        for (let i = 0; i < args32.length; i++) {
            sum += args32[i]
        }
        return sum
    })
    const arr2: int[] = [100, 200, 300, -1000]
    assertEquals("NativeCallback Int32Array sum", -400, nativeModule()._TestCallIntIntArraySum(id2, arr2, arr2.length))

    const id3 = wrapCallback((args: byte[], length: int): int => {
        const buf = new ArrayBuffer(length)
        const view = new DataView(buf)
        const args32 = new Int32Array(buf)
        for (let i = 0; i < length; i++) {
            view.setUint8(i, args[i]);
        }
        for (let i = 1; i < args32.length; i++) {
            args32[i] += args32[i - 1]
        }
        for (let i = 0; i < length; i++) {
            args[i] = view.getUint8(i) as byte
        }
        return 0
    })
    const arr3: int[] = [100, 200, 300, -1000]
    nativeModule()._TestCallVoidIntArrayPrefixSum(id3, arr3, arr3.length)
    assertEquals("NativeCallback Int32Array PrefixSum [0]", 100, arr3[0])
    assertEquals("NativeCallback Int32Array PrefixSum [1]", 300, arr3[1])
    assertEquals("NativeCallback Int32Array PrefixSum [2]", 600, arr3[2])
    assertEquals("NativeCallback Int32Array PrefixSum [3]", -400, arr3[3])

    const start = Date.now()
    const id4 = wrapCallback((args: byte[], length: int): int => {
        const buf = new ArrayBuffer(length)
        const view = new DataView(buf)
        const args32 = new Int32Array(buf)
        for (let i = 0; i < length; i++) {
            view.setUint8(i, args[i]);
        }
        args32[1]++
        for (let i = 0; i < length; i++) {
            args[i] = view.getUint8(i) as byte
        }
        if (args32[0] + args32[1] < args32[2]) {
            return nativeModule()._TestCallIntRecursiveCallback(id3 + 1, args, args.length)
        }
        return 1
    }, false)
    assertEquals("NativeCallback prepare recursive callback test", id4, id3 + 1)
    const depth = 500
    const count = 100
    for (let i = 0; i < count; i++) {
        const length = 12
        const args = new byte[length]
        const buf = new ArrayBuffer(length)
        const view = new DataView(buf)
        const args32 = new Int32Array(buf)
        args32[2] = depth
        for (let i = 0; i < length; i++) {
            args[i] = view.getUint8(i) as byte
        }
        nativeModule()._TestCallIntRecursiveCallback(id4, args, args.length)
        for (let i = 0; i < length; i++) {
            view.setUint8(i, args[i]);
        }
        if (i == 0) {
            assertEquals("NativeCallback Recursive [0]", Math.ceil(depth / 2), args32[0])
            assertEquals("NativeCallback Recursive [1]", Math.floor(depth / 2), args32[1])
        }
    }
    const passed = Date.now() - start
    console.log(`recursive native callback: ${Math.round(passed)}ms for ${depth * count} callbacks, ${Math.round(passed / (depth * count) * 1000000)}ms per 1M callbacks`)

    const id5 = wrapCallback((args: byte[], length: int): int => {
        let sum: int = 0
        for (let i = 0; i < args.length; i++) {
            sum += args[i]
        }
        return sum
    }, false)
    nativeModule()._TestCallIntMemory(id5, 1000)
}

function checkNodeAPI() {
    console.log("TreeNode tests")

    const root = ArkColumnPeer.create(ArkUINodeType.Column, undefined, 0)
    const child1 = ArkButtonPeer.create(ArkUINodeType.Button, undefined, 0)
    const child2 = ArkButtonPeer.create(ArkUINodeType.Blank, undefined, 0)
    const child3 = ArkButtonPeer.create(ArkUINodeType.List, undefined, 0)
    const child4 = ArkButtonPeer.create(ArkUINodeType.Web, undefined, 0)
    const child5 = ArkButtonPeer.create(ArkUINodeType.Web, undefined, 0)

    checkResult("BasicNodeAPI addChild", () => root.peer.addChild(child1.peer),
        `addChild(0x${root.peer.ptr}, 0x${child1.peer.ptr})markDirty(0x${root.peer.ptr}, 32)`)
    checkResult("BasicNodeAPI insertChildAfter", () => root.peer.insertChildAfter(child4.peer, child1.peer),
        `insertChildAfter(0x${root.peer.ptr}, 0x${child4.peer.ptr}, 0x${child1.peer.ptr})markDirty(0x${root.peer.ptr}, 32)`)
    checkResult("BasicNodeAPI insertChildBefore", () => root.peer.insertChildBefore(child3.peer, child4.peer),
        `insertChildBefore(0x${root.peer.ptr}, 0x${child3.peer.ptr}, 0x${child4.peer.ptr})markDirty(0x${root.peer.ptr}, 32)`)
    checkResult("BasicNodeAPI insertChildAt", () => root.peer.insertChildAt(child2.peer, 1),
        `insertChildAt(0x${root.peer.ptr}, 0x${child2.peer.ptr}, 1)markDirty(0x${root.peer.ptr}, 32)`)
    checkResult("BasicNodeAPI insertChildAfter (empty tree case)", () => child4.peer.insertChildAfter(child5.peer, undefined),
        `insertChildAfter(0x${child4.peer.ptr}, 0x${child5.peer.ptr}, 0x0)markDirty(0x${child4.peer.ptr}, 32)`)
    checkResult("BasicNodeAPI removeChild", () => root.peer.removeChild(child2.peer),
        `removeChild(0x${root.peer.ptr}, 0x${child2.peer.ptr})markDirty(0x${root.peer.ptr}, 32)`)
    checkResult("BasicNodeAPI dispose", () => child2.peer.dispose(),
        `disposeNode(0x${child2.peer.ptr})`)
    checkResult("BasicNodeAPI dumpTree", () => root.peer.dumpTree(),
        `dumpTreeNode(0x${root.peer.ptr})`)
    checkResult("BasicNodeAPI measureLayoutAndDraw", () => NativeModule._MeasureLayoutAndDraw(root.peer.ptr),
        `measureLayoutAndDraw(0x${root.peer.ptr})`)
}

export function main(): void {
	// TODO: enable tests after fixing issues with arm64 panda
	// https://rnd-gitlab-msc.huawei.com/rus-os-team/virtual-machines-and-tools/panda/-/issues/20899
	// https://rnd-gitlab-msc.huawei.com/rus-os-team/virtual-machines-and-tools/panda/-/issues/20908
    // checkPerf2(5 * 1000 * 1000)
    checkPerf3(5 * 1000 * 1000)

    checkButton()

    checkCallback()
    checkNativeCallback()

    checkNodeAPI()
    checkTwoSidesCallback()

    if (hasTestErrors) {
        throw new Error("Tests failed!")
    }
}
