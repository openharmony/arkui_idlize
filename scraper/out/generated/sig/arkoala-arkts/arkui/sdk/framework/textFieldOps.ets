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
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { ResourceStr, Length, Padding, LocalizedPadding, BorderOptions, EdgeWidths, LocalizedEdgeWidths, ResourceColor, EdgeColors, LocalizedEdgeColors, EdgeStyles, BorderRadiuses, LocalizedBorderRadiuses } from "./../component/units"
import { Resource } from "@global.resource"
import { LayoutPolicy } from "./../component/common"
import { Color, BorderStyle } from "./../component/enums"
export type TextFieldValueCallback = (value: ResourceStr) => void;
export declare class TextFieldOps {
    static registerTextFieldValueCallback(node: KPointer, value: ResourceStr, callback_: TextFieldValueCallback): KPointer
    static textFieldOpsSetWidth(node: KPointer, value?: Length | LayoutPolicy): KPointer
    static textFieldOpsSetHeight(node: KPointer, value?: Length | LayoutPolicy): KPointer
    static textFieldOpsSetPadding(node: KPointer, value?: Padding | Length | LocalizedPadding): KPointer
    static textFieldOpsSetMargin(node: KPointer, value?: Padding | Length | LocalizedPadding): KPointer
    static textFieldOpsSetBorder(node: KPointer, value?: BorderOptions): KPointer
    static textFieldOpsSetBorderWidth(node: KPointer, value?: Length | EdgeWidths | LocalizedEdgeWidths): KPointer
    static textFieldOpsSetBorderColor(node: KPointer, value?: ResourceColor | EdgeColors | LocalizedEdgeColors): KPointer
    static textFieldOpsSetBorderStyle(node: KPointer, value?: BorderStyle | EdgeStyles): KPointer
    static textFieldOpsSetBorderRadius(node: KPointer, value?: Length | BorderRadiuses | LocalizedBorderRadiuses): KPointer
    static textFieldOpsSetBackgroundColor(node: KPointer, value?: ResourceColor): KPointer
}
