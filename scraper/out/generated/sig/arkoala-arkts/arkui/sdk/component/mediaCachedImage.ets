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
import { ImageAttribute, ArkImageStyle } from "./image"
import { AttributeModifier, extractors, AttributeUpdater } from "./../handwritten"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { default as image } from "@ohos.multimedia.image"
import { ResourceStr } from "./units"
import { Resource } from "@global.resource"
import { DrawableDescriptor } from "@ohos.arkui.drawableDescriptor"
export declare interface ASTCResource {
    sources: Array<string>;
    column: number;
}
export interface MediaCachedImageAttribute extends ImageAttribute {
    attributeModifier(value: AttributeModifier<MediaCachedImageAttribute> | AttributeModifier<ImageAttribute> | AttributeModifier<CommonMethod> | undefined): this
}
export class ArkMediaCachedImageStyle extends ArkImageStyle implements MediaCachedImageAttribute {
    attributeModifier_value?: AttributeModifier<MediaCachedImageAttribute> | AttributeModifier<CommonMethod> | undefined
    public attributeModifier(value: AttributeModifier<MediaCachedImageAttribute> | AttributeModifier<ImageAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function MediaCachedImage(
    src: image.PixelMap | ResourceStr | DrawableDescriptor | ASTCResource,
    @memo
    content_?: () => void,
): MediaCachedImageAttribute { throw new Error("")}
