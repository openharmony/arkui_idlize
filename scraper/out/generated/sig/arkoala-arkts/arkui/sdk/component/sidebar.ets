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
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
import { Resource } from "@global.resource"
import { CommonMethod, Bindable, DividerStyle, ArkCommonMethodStyle } from "./common"
import { Length, Dimension } from "./units"
export enum SideBarContainerType {
    EMBED = 0,
    Embed = 0,
    OVERLAY = 1,
    Overlay = 1,
    AUTO = 2
}
export enum SideBarPosition {
    START = 0,
    Start = 0,
    END = 1,
    End = 1
}
export declare interface ButtonIconOptions {
    shown: string | image.PixelMap | Resource;
    hidden: string | image.PixelMap | Resource;
    switching?: string | image.PixelMap | Resource;
}
export declare interface ButtonStyle {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    icons?: ButtonIconOptions;
}
export interface SideBarContainerAttribute extends CommonMethod {
    showSideBar(value: boolean | Bindable<boolean> | undefined): this {
        throw new Error("Unimplemented method showSideBar")
    }
    controlButton(value: ButtonStyle | undefined): this {
        throw new Error("Unimplemented method controlButton")
    }
    showControlButton(value: boolean | undefined): this {
        throw new Error("Unimplemented method showControlButton")
    }
    onChange(value: ((value: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    sideBarWidth(value: Length | Bindable<Length> | undefined): this {
        throw new Error("Unimplemented method sideBarWidth")
    }
    minSideBarWidth(value: number | undefined): this {
        throw new Error("Unimplemented method minSideBarWidth")
    }
    maxSideBarWidth(value: number | undefined): this {
        throw new Error("Unimplemented method maxSideBarWidth")
    }
    minSideBarWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method minSideBarWidth")
    }
    maxSideBarWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method maxSideBarWidth")
    }
    autoHide(value: boolean | undefined): this {
        throw new Error("Unimplemented method autoHide")
    }
    sideBarPosition(value: SideBarPosition | undefined): this {
        throw new Error("Unimplemented method sideBarPosition")
    }
    divider(value: DividerStyle | undefined): this {
        throw new Error("Unimplemented method divider")
    }
    minContentWidth(value: Dimension | undefined): this {
        throw new Error("Unimplemented method minContentWidth")
    }
    attributeModifier(value: AttributeModifier<SideBarContainerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSideBarContainerStyle extends ArkCommonMethodStyle implements SideBarContainerAttribute {
    showSideBar_value?: boolean | Bindable<boolean> | undefined
    controlButton_value?: ButtonStyle | undefined
    showControlButton_value?: boolean | undefined
    onChange_value?: ((value: boolean) => void) | undefined
    sideBarWidth_value?: Length | Bindable<Length> | undefined
    minSideBarWidth_value?: number | undefined
    maxSideBarWidth_value?: number | undefined
    autoHide_value?: boolean | undefined
    sideBarPosition_value?: SideBarPosition | undefined
    divider_value?: DividerStyle | undefined
    minContentWidth_value?: Dimension | undefined
    showSideBar(value: boolean | Bindable<boolean> | undefined): this {
        return this
    }
    controlButton(value: ButtonStyle | undefined): this {
        return this
    }
    showControlButton(value: boolean | undefined): this {
        return this
    }
    onChange(value: ((value: boolean) => void) | undefined): this {
        return this
    }
    sideBarWidth(value: Length | Bindable<Length> | undefined): this {
        return this
    }
    minSideBarWidth(value: number | undefined): this {
        return this
    }
    maxSideBarWidth(value: number | undefined): this {
        return this
    }
    minSideBarWidth(value: Length | undefined): this {
        return this
    }
    maxSideBarWidth(value: Length | undefined): this {
        return this
    }
    autoHide(value: boolean | undefined): this {
        return this
    }
    sideBarPosition(value: SideBarPosition | undefined): this {
        return this
    }
    divider(value: DividerStyle | undefined): this {
        return this
    }
    minContentWidth(value: Dimension | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SideBarContainerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function SideBarContainer(
    type?: SideBarContainerType,
    @memo
    content_?: () => void,
): SideBarContainerAttribute { throw new Error("")}
