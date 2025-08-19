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
import { VoidCallback } from "./units"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface PluginComponentTemplate {
    source: string | undefined;
    bundleName: string | undefined;
}
export type RecordData = Object | undefined;
export declare interface PluginComponentOptions {
    template: PluginComponentTemplate;
    data: RecordData;
}
export declare interface PluginErrorData {
    errcode: int32;
    msg: string;
}
export type PluginErrorCallback = (info: PluginErrorData) => void;
export interface PluginComponentAttribute extends CommonMethod {
    onComplete(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onComplete")
    }
    onError(value: PluginErrorCallback | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    attributeModifier(value: AttributeModifier<PluginComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkPluginComponentStyle extends ArkCommonMethodStyle implements PluginComponentAttribute {
    onComplete_value?: VoidCallback | undefined
    onError_value?: PluginErrorCallback | undefined
    attributeModifier_value?: AttributeModifier<PluginComponentAttribute> | AttributeModifier<CommonMethod> | undefined
    onComplete(value: VoidCallback | undefined): this {
        return this
    }
    onError(value: PluginErrorCallback | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<PluginComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function PluginComponent(
    options: PluginComponentOptions,
    @memo
    content_?: () => void,
): PluginComponentAttribute { throw new Error("")}
