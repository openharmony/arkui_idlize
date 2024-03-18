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
import { float32, int32 } from "./types"

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

enum Tags {
    UNDEFINED = 1,
    INT32 = 2,
    FLOAT32 = 3,
    STRING = 4,
    LENGTH = 5,
    RESOURCE = 6,
}

export function withLength(valueLength: Length|undefined, body: (value: float32, unit: int32, resource: int32) => void) {
    let type = runtimeType(valueLength)
    let value = 0
    let unit = 1 // vp
    let resource = 0
    switch (type) {
        case RuntimeType.UNDEFINED:
            value = 0
            unit = 0
            break
        case RuntimeType.NUMBER:
            value = valueLength as float32
            break
        case RuntimeType.STRING:
            let valueStr = valueLength as string
            // TODO: faster parse.
            if (valueStr.endsWith("vp")) {
                unit = 1 // vp
                value = Number(valueStr.substring(0, valueStr.length - 2))
            } else if (valueStr.endsWith("%")) {
                unit = 3 // percent
                value = Number(valueStr.substring(0, valueStr.length - 1))
            } else if (valueStr.endsWith("lpx")) {
                unit = 4 // lpx
                value = Number(valueStr.substring(0, valueStr.length - 3))
            } else if (valueStr.endsWith("px")) {
                unit = 0 // px
                value = Number(valueStr.substring(0, valueStr.length - 2))
            }
            break
        case RuntimeType.OBJECT:
            resource = (valueLength as Resource).id
            break
    }
    body(value, unit, resource)
}


export function withLengthArray(valueLength: Length|undefined, body: (valuePtr: Uint32Array) => void) {
    withLength(valueLength, (value, unit, resource) => {
        let array = new Uint32Array(3)
        array[0] = value
        array[1] = unit
        array[2] = resource
        body(array)
    })
}

let textEncoder = new TextEncoder()

export class Serializer {
    private position = 0
    private buffer: ArrayBuffer
    private view: DataView
    constructor(expectedSize: int32) {
        this.buffer = new ArrayBuffer(expectedSize)
        this.view = new DataView(this.buffer)
    }
    asArray(): Uint8Array {
        return new Uint8Array(this.buffer)
    }
    length(): int32 {
        return this.position
    }
    private checkCapacity(value: int32) {
    }
    writeNumber(value: number|undefined) {
        this.checkCapacity(5)
        if (value == undefined) {
            this.view.setInt8(this.position, Tags.UNDEFINED)
            this.position++
            return
        }
        if (value == Math.round(value)) {
            this.view.setInt8(this.position, Tags.INT32)
            this.view.setInt32(this.position + 1, value)
            this.position += 5
            return
        }
        this.view.setInt8(this.position, Tags.FLOAT32)
        this.view.setFloat32(this.position + 1, value)
        this.position += 5
    }
    writeInt8(value: int32) {
        this.checkCapacity(1)
        this.view.setInt8(this.position, value)
        this.position += 1
    }
    writeInt32(value: int32) {
        this.checkCapacity(4)
        this.view.setInt32(this.position, value)
        this.position += 4
    }
    writeFloat32(value: float32) {
        this.checkCapacity(4)
        this.view.setFloat32(this.position, value)
        this.position += 4
    }
    writeBoolean(value: boolean|undefined) {
        this.checkCapacity(1)
        this.view.setInt8(this.position, value == undefined ? 2 : +value)
        this.position++
    }
    writeFunction(value: object) {
        throw new Error("Functions not yet supported")
    }
    writeString(value: string|undefined) {
        if (value == undefined) {
            this.checkCapacity(1)
            this.view.setInt8(this.position, Tags.UNDEFINED)
            this.position++
        }
        let encoded = textEncoder.encode(value)
        this.checkCapacity(5 + encoded.length)
        this.view.setInt8(this.position, Tags.STRING)
        this.view.setInt32(this.position + 1, encoded.length)
        new Uint8Array(this.view.buffer, this.position + 5).set(encoded)
        this.position += 5 + encoded.length
    }
    writeUndefined() {
        this.view.setInt8(this.position, Tags.UNDEFINED)
        this.position++
    }
    writeAny(value: any) {
        throw new Error("How to write any?")
    }
    writeResource(value: Resource) {
        this.writeInt32(value.id)
        this.writeString(value.bundleName)
        this.writeString(value.moduleName)
    }
    // Length is an important common case.
    writeLength(value: Length|undefined) {
        this.checkCapacity(1)
        let valueType = runtimeType(value)
        this.writeInt8(valueType)
        this.position++
        if (valueType != RuntimeType.UNDEFINED) {
            withLength(value, (value, unit, resource) => {
                this.writeFloat32(value)
                this.writeInt32(unit)
                this.writeInt32(resource)
            })
        }
    }
    writeRectangle(value: Rectangle) {
        this.writeLength(value.x)
        this.writeLength(value.y)
        this.writeLength(value.width)
        this.writeLength(value.height)
    }
    writePosition(value: Position) {
        this.writeLength(value.x)
        this.writeLength(value.y)
    }
    // TODO: two LabelStyle: in tab_content.d.ts and button.d.ts.
    writeLabelStyle(value: LabelStyle) {}
    writeSizeOptions(value: SizeOptions) {
        this.writeLength(value.width)
        this.writeLength(value.height)
    }
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
    writeSpringMotion(value: SpringMotion) {}
    writeScriptItem(value: ScriptItem) {}
    writeInputCounterOptions(value: InputCounterOptions) {}
    writeResizableOptions(value: ResizableOptions) {}
    writeCurrentDayStyle(value: CurrentDayStyle) {}
    writeEdgeEffectOptions(value: EdgeEffectOptions) {}
    writeImageAnalyzerConfig(value: ImageAnalyzerConfig) {}
    writeChainAnimationOptions(value: ChainAnimationOptions) {}
    writePointLightStyle(value: PointLightStyle) {}
}