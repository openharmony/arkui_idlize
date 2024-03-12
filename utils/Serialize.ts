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
import { int32 } from "./types"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER,
    STRING,
    OBJECT,
    BOOLEAN,
    UNDEFINED
}

export function runtimeType(value: any): int32 {
    let type = typeof value
    if (type == "number") return RuntimeType.NUMBER
    if (type == "string") return RuntimeType.STRING
    if (type == "undefined") return RuntimeType.UNDEFINED
    if (type == "object") return RuntimeType.OBJECT
    if (type == "boolean") return RuntimeType.BOOLEAN
    throw new Error("bug: " + value)
}

export function enumToInt32<T>(value: T): int32 {
    return value as unknown as int32
}

export function functionToInt32<T>(value: T): int32 {
    return 42
}

export class Serializer {
    constructor(expectedSize: int32) {}

    asArray(): Uint8Array {
        return new Uint8Array(0)
    }
    length(): int32 {
        return 0
    }
    writeNumber(value: number|undefined) {}
    writeInt32(value: int32) {}
    writeBoolean(value: boolean|undefined) {}
    writeFunction(value: object) {}
    writeString(value: string|undefined) {}
    writeResource(value: Resource) {}
    writeUndefined() {}
    writeAny(value: any) {}
    writeRectangle(value: Rectangle) {}
    writePosition(value: Position) {}
    writeLabelStyle(value: LabelStyle) {}
    writeSizeOptions(value: SizeOptions) {}
    writeConstraintSizeOptions(value: ConstraintSizeOptions) {}
    writeBorderOptions(value: BorderOptions) {}
    writeBorderImageOption(value: BorderImageOption) {}
    writeAnimateParam(value: AnimateParam) {}
    writeTransitionOptions(value: TransitionOptions) {}
    writeLinearGradientBlurOptions(value: LinearGradientBlurOptions) {}
    writeClickEffect(value: ClickEffect) {}
    writeTranslateOptions(value: TranslateOptions) {}
    writeScaleOptions(value: ScaleOptions) {}
    writeRotateOptions(value: RotateOptions) {}
    writesharedTransitionOptions(value: sharedTransitionOptions) {}
    writeAlignRuleOption(value: AlignRuleOption) {}
    writeMotionPathOptions(value: MotionPathOptions) {}
    writeShadowOptions(value: ShadowOptions) {}
    writePopupOptions(value: PopupOptions) {}
    writeMenuOptions(value: MenuOptions) {}
    writeContextMenuOptions(value: ContextMenuOptions) {}
    writeContentCoverOptions(value: ContentCoverOptions) {}
    writeStateStyles(value: StateStyles) {}
    writePixelStretchEffectOptions(value: PixelStretchEffectOptions) {}
    writeSheetOptions(value: SheetOptions) {}
    writeBackgroundBlurStyleOptions(value: BackgroundBlurStyleOptions) {}
    writeForegroundBlurStyleOptions(value: ForegroundBlurStyleOptions) {}
    writeTapGestureInterface(value: TapGestureInterface) {}
    writeCircleAttribute(value: CircleAttribute) {}
    writeWebController(value: WebController) {}
    writeWebMediaOptions(value: WebMediaOptions) {}
    writeNestedScrollOptions(value: NestedScrollOptions) {}
    writeCaretStyle(value: CaretStyle) {}
    writeFont(value: Font) {}
    writePasswordIcon(value: PasswordIcon) {}
    writeDividerStyle(value: DividerStyle) {}
    writeButtonStyle(value: ButtonStyle) {}
    writeSliderBlockStyle(value: SliderBlockStyle) {}
    writePickerTextStyle(value: PickerTextStyle) {}
    writeIconOptions(value: IconOptions|undefined) {}
    writeDotIndicator(value: DotIndicator) {}
    writeSelectionMenuOptions(value: SelectionMenuOptions) {}
    writeIndicatorStyle(value: IndicatorStyle) {}
    writeBarGridColumnOptions(value: BarGridColumnOptions) {}
    writeGridColColumnOption(value: GridColColumnOption) {}
    writeSearchButtonOptions(value: SearchButtonOptions) {}
    writeArrowStyle(value: ArrowStyle) {}
    writeToolbarItem(value: ToolbarItem) {}
    writeScrollSnapOptions(value: ScrollSnapOptions) {}
    writeICurve(value: ICurve) {}
    writeColumnSplitDividerStyle(value: ColumnSplitDividerStyle) {}
    writeRadioStyle(value: RadioStyle) {}
    writeSwipeActionOptions(value: SwipeActionOptions) {}
    writeImageFrameInfo(value: ImageFrameInfo) {}
    writeColorFilter(value: ColorFilter) {}
    writeNavigationMenuItem(value: NavigationMenuItem) {}
    writeMarkStyle(value: MarkStyle) {}
    writeDataPanelShadowOptions(value: DataPanelShadowOptions) {}
}