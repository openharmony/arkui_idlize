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
import { ResourceColor, Length } from "./units"
import { Color } from "./enums"
import { Resource } from "@global.resource"
import { MultiShadowOptions, CommonConfiguration, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum DataPanelType {
    LINE = 0,
    Line = 0,
    CIRCLE = 1,
    Circle = 1
}
export declare interface ColorStop {
    color: ResourceColor;
    offset: Length;
}
export declare class LinearGradient {
    constructor(colorStops: Array<ColorStop>)
}
export declare interface DataPanelShadowOptions extends MultiShadowOptions {
    colors?: Array<ResourceColor | LinearGradient>;
}
export declare interface DataPanelOptions {
    values: Array<number>;
    max?: number;
    type?: DataPanelType;
}
export declare interface DataPanelConfiguration extends CommonConfiguration<DataPanelConfiguration> {
    values: Array<number>;
    maxValue: number;
}
export interface DataPanelAttribute extends CommonMethod {
    closeEffect(value: boolean | undefined): this {
        throw new Error("Unimplemented method closeEffect")
    }
    valueColors(value: Array<ResourceColor | LinearGradient> | undefined): this {
        throw new Error("Unimplemented method valueColors")
    }
    trackBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method trackBackgroundColor")
    }
    strokeWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method strokeWidth")
    }
    trackShadow(value: DataPanelShadowOptions | undefined): this {
        throw new Error("Unimplemented method trackShadow")
    }
    contentModifier(value: ContentModifier<DataPanelConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    attributeModifier(value: AttributeModifier<DataPanelAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkDataPanelStyle extends ArkCommonMethodStyle implements DataPanelAttribute {
    closeEffect_value?: boolean | undefined
    valueColors_value?: Array<ResourceColor | LinearGradient> | undefined
    trackBackgroundColor_value?: ResourceColor | undefined
    strokeWidth_value?: Length | undefined
    trackShadow_value?: DataPanelShadowOptions | undefined
    contentModifier_value?: ContentModifier<DataPanelConfiguration> | undefined
    attributeModifier_value?: AttributeModifier<DataPanelAttribute> | AttributeModifier<CommonMethod> | undefined
    closeEffect(value: boolean | undefined): this {
        return this
    }
    valueColors(value: Array<ResourceColor | LinearGradient> | undefined): this {
        return this
    }
    trackBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    strokeWidth(value: Length | undefined): this {
        return this
    }
    trackShadow(value: DataPanelShadowOptions | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<DataPanelConfiguration> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<DataPanelAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function DataPanel(
    options: DataPanelOptions,
    @memo
    content_?: () => void,
): DataPanelAttribute { throw new Error("")}
