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
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { Color } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export interface HyperlinkAttribute extends CommonMethod {
    color(value: Color | number | string | Resource | undefined): this {
        throw new Error("Unimplemented method color")
    }
    attributeModifier(value: AttributeModifier<HyperlinkAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkHyperlinkStyle extends ArkCommonMethodStyle implements HyperlinkAttribute {
    color_value?: Color | number | string | Resource | undefined
    attributeModifier_value?: AttributeModifier<HyperlinkAttribute> | AttributeModifier<CommonMethod> | undefined
    color(value: Color | number | string | Resource | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<HyperlinkAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Hyperlink(
    address: string | Resource, content?: string | Resource,
    @memo
    content_?: () => void,
): HyperlinkAttribute { throw new Error("")}
