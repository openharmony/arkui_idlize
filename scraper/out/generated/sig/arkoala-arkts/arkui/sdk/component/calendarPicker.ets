/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { Resource } from "@global.resource"
import { DateRange, CommonMethod, PickerTextStyle, BlurStyle, BackgroundBlurStyleOptions, BackgroundEffectOptions, PickerDialogButtonStyle, ShadowOptions, ShadowStyle, HoverModeAreaType, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
import { Offset, VoidCallback, ResourceColor } from "./units"
import { Color } from "./enums"
export enum CalendarAlign {
    START = 0,
    CENTER = 1,
    END = 2
}
export declare interface CalendarOptions {
    hintRadius?: number | Resource;
    selected?: Date;
    start?: Date;
    end?: Date;
    disabledDateRange?: Array<DateRange>;
}
export interface CalendarPickerAttribute extends CommonMethod {
    textStyle(value: PickerTextStyle | undefined): this {
        throw new Error("Unimplemented method textStyle")
    }
    onChange(value: ((value0: Date) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    markToday(value: boolean | undefined): this {
        throw new Error("Unimplemented method markToday")
    }
    edgeAlign(alignType: CalendarAlign | undefined, offset?: Offset): this {
        throw new Error("Unimplemented method edgeAlign")
    }
    attributeModifier(value: AttributeModifier<CalendarPickerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCalendarPickerStyle extends ArkCommonMethodStyle implements CalendarPickerAttribute {
    textStyle_value?: PickerTextStyle | undefined
    onChange_value?: ((value0: Date) => void) | undefined
    markToday_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<CalendarPickerAttribute> | AttributeModifier<CommonMethod> | undefined
    textStyle(value: PickerTextStyle | undefined): this {
        return this
    }
    onChange(value: ((value0: Date) => void) | undefined): this {
        return this
    }
    markToday(value: boolean | undefined): this {
        return this
    }
    edgeAlign(alignType: CalendarAlign | undefined, offset?: Offset): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CalendarPickerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface CalendarDialogOptions extends CalendarOptions {
    onAccept?: ((value0: Date) => void);
    onCancel?: VoidCallback;
    onChange?: ((value0: Date) => void);
    backgroundColor?: ResourceColor;
    backgroundBlurStyle?: BlurStyle;
    backgroundBlurStyleOptions?: BackgroundBlurStyleOptions;
    backgroundEffect?: BackgroundEffectOptions;
    acceptButtonStyle?: PickerDialogButtonStyle;
    cancelButtonStyle?: PickerDialogButtonStyle;
    onDidAppear?: VoidCallback;
    onDidDisappear?: VoidCallback;
    onWillAppear?: VoidCallback;
    onWillDisappear?: VoidCallback;
    shadow?: ShadowOptions | ShadowStyle;
    enableHoverMode?: boolean;
    hoverModeArea?: HoverModeAreaType;
    markToday?: boolean;
}
export declare class CalendarPickerDialog {
    constructor()
    static show(options?: CalendarDialogOptions): void
}

@memo
@ComponentBuilder
export function CalendarPicker(
    options?: CalendarOptions,
    @memo
    content_?: () => void,
): CalendarPickerAttribute { throw new Error("")}
