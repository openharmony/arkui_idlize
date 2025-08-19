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
import { Bindable, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ResourceStr } from "./units"
import { Resource } from "@global.resource"
import { CustomBuilder } from "./builder"
import { ComponentContent } from "./../ComponentContent"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum RefreshStatus {
    INACTIVE = 0,
    Inactive = 0,
    DRAG = 1,
    Drag = 1,
    OVER_DRAG = 2,
    OverDrag = 2,
    REFRESH = 3,
    Refresh = 3,
    DONE = 4,
    Done = 4
}
export declare interface RefreshOptions {
    refreshing: boolean | Bindable<boolean>;
    promptText?: ResourceStr;
    builder?: CustomBuilder;
    refreshingContent?: ComponentContent;
}
export interface RefreshAttribute extends CommonMethod {
    onStateChange(value: ((state: RefreshStatus) => void) | undefined): this {
        throw new Error("Unimplemented method onStateChange")
    }
    onRefreshing(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onRefreshing")
    }
    refreshOffset(value: number | undefined): this {
        throw new Error("Unimplemented method refreshOffset")
    }
    pullToRefresh(value: boolean | undefined): this {
        throw new Error("Unimplemented method pullToRefresh")
    }
    onOffsetChange(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onOffsetChange")
    }
    pullDownRatio(value: number | undefined): this {
        throw new Error("Unimplemented method pullDownRatio")
    }
    attributeModifier(value: AttributeModifier<RefreshAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRefreshStyle extends ArkCommonMethodStyle implements RefreshAttribute {
    onStateChange_value?: ((state: RefreshStatus) => void) | undefined
    onRefreshing_value?: (() => void) | undefined
    refreshOffset_value?: number | undefined
    pullToRefresh_value?: boolean | undefined
    onOffsetChange_value?: ((value0: number) => void) | undefined
    pullDownRatio_value?: number | undefined
    attributeModifier_value?: AttributeModifier<RefreshAttribute> | AttributeModifier<CommonMethod> | undefined
    onStateChange(value: ((state: RefreshStatus) => void) | undefined): this {
        return this
    }
    onRefreshing(value: (() => void) | undefined): this {
        return this
    }
    refreshOffset(value: number | undefined): this {
        return this
    }
    pullToRefresh(value: boolean | undefined): this {
        return this
    }
    onOffsetChange(value: ((value0: number) => void) | undefined): this {
        return this
    }
    pullDownRatio(value: number | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<RefreshAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Refresh(
    value: RefreshOptions,
    @memo
    content_?: () => void,
): RefreshAttribute { throw new Error("")}
