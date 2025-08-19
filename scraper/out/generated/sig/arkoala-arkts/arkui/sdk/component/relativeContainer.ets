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
import { Dimension } from "./units"
import { Resource } from "@global.resource"
import { Axis } from "./enums"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface GuideLinePosition {
    start?: Dimension;
    end?: Dimension;
}
export declare interface GuideLineStyle {
    id: string;
    direction: Axis;
    position: GuideLinePosition;
}
export enum BarrierDirection {
    LEFT = 0,
    RIGHT = 1,
    TOP = 2,
    BOTTOM = 3
}
export enum LocalizedBarrierDirection {
    START = 0,
    END = 1,
    TOP = 2,
    BOTTOM = 3
}
export declare interface BarrierStyle {
    id: string;
    direction: BarrierDirection;
    referencedId: Array<string>;
}
export declare interface LocalizedBarrierStyle {
    id: string;
    localizedDirection: LocalizedBarrierDirection;
    referencedId: Array<string>;
}
export interface RelativeContainerAttribute extends CommonMethod {
    guideLine(value: Array<GuideLineStyle> | undefined): this {
        throw new Error("Unimplemented method guideLine")
    }
    barrier(value: Array<BarrierStyle> | undefined): this {
        throw new Error("Unimplemented method barrier")
    }
    attributeModifier(value: AttributeModifier<RelativeContainerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRelativeContainerStyle extends ArkCommonMethodStyle implements RelativeContainerAttribute {
    guideLine_value?: Array<GuideLineStyle> | undefined
    barrier_value?: Array<BarrierStyle> | undefined
    attributeModifier_value?: AttributeModifier<RelativeContainerAttribute> | AttributeModifier<CommonMethod> | undefined
    guideLine(value: Array<GuideLineStyle> | undefined): this {
        return this
    }
    barrier(value: Array<BarrierStyle> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<RelativeContainerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function RelativeContainer(
    
    @memo
    content_?: () => void,
): RelativeContainerAttribute { throw new Error("")}
