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
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum ToolBarItemPlacement {
    TOP_BAR_LEADING = 0,
    TOP_BAR_TRAILING = 1
}
export declare interface ToolBarItemOptions {
    placement?: ToolBarItemPlacement;
}
export interface ToolBarItemAttribute {
    attributeModifier(value: AttributeModifier<ToolBarItemAttribute> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkToolBarItemStyle implements ToolBarItemAttribute {
    public attributeModifier(value: AttributeModifier<ToolBarItemAttribute> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function ToolBarItem(
    options?: ToolBarItemOptions,
    @memo
    content_?: () => void,
): ToolBarItemAttribute { throw new Error("")}
