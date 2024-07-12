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
import { NativeModule } from "./NativeModule"
import { ArkButtonPeer } from "@arkoala/arkui/peers/ArkButtonPeer"
import { ArkUINodeType } from "@arkoala/arkui/peers/ArkUINodeType"
import { ButtonType } from '@arkoala/arkui/ArkButtonInterfaces'

import {LabelStyle,
        TextOverflow,
        ResourceStr,
        TextHeightAdaptivePolicy,
        Font,
        SheetOptions,
        SheetTitleOptions,
        CustomBuilder,
        SheetSize,
        Length,
        ResourceColor,
        BlurStyle,
        SheetType,
        Resource,
        SheetDismiss,
        DismissSheetAction,
        SpringBackAction,
        Dimension,
        EdgeWidths,
        LocalizedEdgeWidths,
        EdgeColors,
        LocalizedEdgeColors,
        BorderStyle,
        EdgeStyles,
        ShadowOptions,
        ShadowStyle,
        SheetMode,
        UIContext,
        Callback,
        BlurOptions } from "./dts-exports"

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
function checkPerf(count: number) {
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        NativeModule._TestPerfNumber(i)
    }
    let passed = Date.now() - start
    console.log(`NUMBER: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)

    start = Date.now()
    for (let i = 0; i < count; i++) {
        let data = new byte[5]
        data[0] = 1
        data[1] = (i >> 24) as byte
        data[2] = (i >> 16) as byte
        data[3] = (i >> 8) as byte
        data[4] = (i >> 0) as byte
        NativeModule._TestPerfNumberWithArray(data, data.length)
    }
    passed = Date.now() - start
    console.log(`ARRAY: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

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
        console.log(`output: ${actual}`)
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
    _title: SheetTitleOptions | CustomBuilder| undefined
    _detents: [(SheetSize | Length | undefined), (SheetSize | Length | undefined), (SheetSize | Length | undefined)] | undefined
    _height: SheetSize | Length| undefined
    _dragBar: boolean| undefined
    _maskColor: ResourceColor| undefined
    _blurStyle: BlurStyle| undefined
    _showClose: boolean | Resource| undefined
    _preferType: SheetType| undefined
    _shouldDismiss: ((sheetDismiss: SheetDismiss) => void) | undefined
    _onWillDismiss: Callback<DismissSheetAction>| undefined
    _onWillSpringBackWhenDismiss: Callback<SpringBackAction>| undefined
    _enableOutsideInteractive: boolean| undefined
    _width: Dimension| undefined
    _borderWidth: Dimension | EdgeWidths | LocalizedEdgeWidths| undefined
    _borderColor: ResourceColor | EdgeColors | LocalizedEdgeColors| undefined
    _borderStyle: BorderStyle | EdgeStyles| undefined
    _shadow: ShadowOptions | ShadowStyle| undefined
    _onHeightDidChange: Callback<number>| undefined
    _mode: SheetMode| undefined
    _onDetentsDidChange: Callback<number>| undefined
    _onWidthDidChange: Callback<number>| undefined
    _onTypeDidChange: Callback<int>| undefined
    _uiContext: UIContext| undefined
    _backgroundColor: ResourceColor | undefined
    _onAppear: (() => void) | undefined
    _onDisappear: (() => void) | undefined
    _onWillAppear: (() => void) | undefined
    _onWillDisappear: (() => void) | undefined

    constructor(title?: SheetTitleOptions) {
        this._title = title
    }

    get title(): SheetTitleOptions | CustomBuilder| undefined {
        return this._title
    }
    set title(arg: SheetTitleOptions | CustomBuilder| undefined) {
        this._title = arg
    }

    get onWillDismiss(): Callback<DismissSheetAction>| undefined {
        return this._onWillDismiss
    }
    set onWillDismiss(arg: Callback<DismissSheetAction>| undefined) {
        this._onWillDismiss = arg
    }

    get detents(): [(SheetSize | Length | undefined), (SheetSize | Length | undefined), (SheetSize | Length | undefined)] | undefined {
        return this._detents
    }
    set detents(arg: [(SheetSize | Length | undefined), (SheetSize | Length | undefined), (SheetSize | Length | undefined)] | undefined) {
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

    get onWillSpringBackWhenDismiss(): Callback<SpringBackAction>| undefined {
        return this._onWillSpringBackWhenDismiss
    }
    set onWillSpringBackWhenDismiss(arg: Callback<SpringBackAction>| undefined) {
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

    get onHeightDidChange(): Callback<number>| undefined {
        return this._onHeightDidChange
    }
    set onHeightDidChange(arg: Callback<number>| undefined) {
        this._onHeightDidChange = arg
    }

    get mode(): SheetMode| undefined {
        return this._mode
    }
    set mode(arg: SheetMode| undefined) {
        this._mode = arg
    }

    get onDetentsDidChange(): Callback<number>| undefined {
        return this._onDetentsDidChange
    }
    set onDetentsDidChange(arg: Callback<number>| undefined) {
        this._onDetentsDidChange = arg
    }

    get onWidthDidChange(): Callback<number>| undefined {
        return this._onWidthDidChange
    }
    set onWidthDidChange(arg: Callback<number>| undefined) {
        this._onWidthDidChange = arg
    }

    get onTypeDidChange(): Callback<int>| undefined {
        return this._onTypeDidChange
    }
    set onTypeDidChange(arg: Callback<int>| undefined) {
        this._onTypeDidChange = arg
    }

    get uiContext(): UIContext| undefined {
        return this._uiContext
    }
    set uiContext(arg: UIContext| undefined) {
        this._uiContext = arg
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
    let peer = new ArkButtonPeer(ArkUINodeType.Button)
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        let data: byte[]
        if ( i % 2 == 0) {
            data = new byte[2]
            data[0] = 1
            data[1] = 2
        } else {
            data = new byte[0]
        }
        peer.backdropBlurAttribute(i, i % 2 == 0 ? undefined : new BlurOptionsImpl([1, 2] as [number, number]))
    }
    let passed = Date.now() - start
    console.log(`backdropBlur: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1_000_000)}ms per 1M iterations`)
}

function checkPerf3(count: number) {
    let peer = new ArkButtonPeer(ArkUINodeType.Button)
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        peer.widthAttribute(testString1000)
    }
    let passed = Date.now() - start
    console.log(`widthAttributeString: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1_000_000)}ms per 1M iterations`)
}

function checkButton() {
    let data = new byte[5]
    data[0] = 42
    checkResult("TestPerfNumberWithArray",
        () => NativeModule._TestPerfNumberWithArray(data, data.length),
        "TestPerfNumberWithArray(42, 5)")
    let peer = new ArkButtonPeer(ArkUINodeType.Button)
    checkResult("width", () => peer.widthAttribute("42%"),
        "width({.type=1, .value=42.000000, .unit=3, .resource=0})")
    checkResult("type", () => peer.typeAttribute(ButtonType.of(1)), "type(1)")
    checkResult("labelStyle", () => peer.labelStyleAttribute(new LabelStyleImpl(3)),
         "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=3}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute(new LabelStyleImpl()),
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
/*
    checkResult("height", () => peer.heightAttribute({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height(Length {value=0.000000, unit=vp, resource=43})")
*/
    checkResult("bindSheet", () =>
        peer.bindSheetAttribute(false, () => {}, new SheetOptionsImpl(new SheetTitleOptionsImpl("My App"))),
        "bindSheet(false, {.selector=0, .value0={.id=42}}, {.tag=ARK_TAG_OBJECT, .value={.backgroundColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .onAppear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onDisappear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillAppear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillDisappear={.tag=ARK_TAG_UNDEFINED, .value={}}, .height={.tag=ARK_TAG_UNDEFINED, .value={}}, .dragBar={.tag=ARK_TAG_UNDEFINED, .value={}}, .maskColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .detents={.tag=ARK_TAG_UNDEFINED, .value={}}, .blurStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .showClose={.tag=ARK_TAG_UNDEFINED, .value={}}, .preferType={.tag=ARK_TAG_UNDEFINED, .value={}}, .title={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.title={.selector=0, .value0={.chars=\"My App\", .length=6}}, .subtitle={.tag=ARK_TAG_UNDEFINED, .value={}}}}}, .shouldDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillSpringBackWhenDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .enableOutsideInteractive={.tag=ARK_TAG_UNDEFINED, .value={}}, .width={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderWidth={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .shadow={.tag=ARK_TAG_UNDEFINED, .value={}}, .onHeightDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .onDetentsDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWidthDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .onTypeDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .uiContext={.tag=ARK_TAG_UNDEFINED, .value={}}}})"
    )
}

export function main(): void {
    checkPerf(5 * 1000 * 1000)
    checkPerf2(5 * 1000 * 1000)
    checkPerf3(5 * 1000 * 1000)

    checkButton()
}