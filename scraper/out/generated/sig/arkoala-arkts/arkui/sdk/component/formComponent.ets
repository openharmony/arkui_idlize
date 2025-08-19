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
import { Want } from "@ohos.app.ability.Want"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { Visibility } from "./enums"
import { VoidCallback } from "./units"
export enum FormDimension {
    DIMENSION_1_2 = 0,
    Dimension_1_2 = 0,
    DIMENSION_2_2 = 1,
    Dimension_2_2 = 1,
    DIMENSION_2_4 = 2,
    Dimension_2_4 = 2,
    DIMENSION_4_4 = 3,
    Dimension_4_4 = 3,
    DIMENSION_1_1 = 6,
    DIMENSION_6_4 = 7,
    DIMENSION_2_3 = 8,
    DIMENSION_3_3 = 9
}
export enum FormRenderingMode {
    FULL_COLOR = 0,
    SINGLE_COLOR = 1
}
export enum FormShape {
    RECT = 1,
    CIRCLE = 2
}
export declare interface FormInfo {
    id: int64 | string;
    name: string;
    bundle: string;
    ability: string;
    module: string;
    dimension?: FormDimension;
    temporary?: boolean;
    want?: Want;
    renderingMode?: FormRenderingMode;
    shape?: FormShape;
}
export declare interface FormCallbackInfo {
    id: int64;
    idString: string;
}
export declare interface FormSize {
    width: double;
    height: double;
}
export declare interface ErrorInformation {
    errcode: int32;
    msg: string;
}
export interface FormComponentAttribute extends CommonMethod {
    size(value: FormSize | undefined): this
    moduleName(value: string | undefined): this {
        throw new Error("Unimplemented method moduleName")
    }
    dimension(value: FormDimension | undefined): this {
        throw new Error("Unimplemented method dimension")
    }
    allowUpdate(value: boolean | undefined): this {
        throw new Error("Unimplemented method allowUpdate")
    }
    visibility(value: Visibility | undefined): this
    onAcquired(value: ((value0: FormCallbackInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onAcquired")
    }
    onError(value: ((value0: ErrorInformation) => void) | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    onRouter(value: ((value0: Object) => void) | undefined): this {
        throw new Error("Unimplemented method onRouter")
    }
    onUninstall(value: ((value0: FormCallbackInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onUninstall")
    }
    onLoad(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onLoad")
    }
    onUpdate(value: ((value0: FormCallbackInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onUpdate")
    }
    attributeModifier(value: AttributeModifier<FormComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkFormComponentStyle extends ArkCommonMethodStyle implements FormComponentAttribute {
    size_value?: FormSize | undefined
    moduleName_value?: string | undefined
    dimension_value?: FormDimension | undefined
    allowUpdate_value?: boolean | undefined
    visibility_value?: Visibility | undefined
    onAcquired_value?: ((value0: FormCallbackInfo) => void) | undefined
    onError_value?: ((value0: ErrorInformation) => void) | undefined
    onRouter_value?: ((value0: Object) => void) | undefined
    onUninstall_value?: ((value0: FormCallbackInfo) => void) | undefined
    onLoad_value?: VoidCallback | undefined
    onUpdate_value?: ((value0: FormCallbackInfo) => void) | undefined
    attributeModifier_value?: AttributeModifier<FormComponentAttribute> | AttributeModifier<CommonMethod> | undefined
    size(value: FormSize | undefined): this {
        return this
    }
    moduleName(value: string | undefined): this {
        return this
    }
    dimension(value: FormDimension | undefined): this {
        return this
    }
    allowUpdate(value: boolean | undefined): this {
        return this
    }
    visibility(value: Visibility | undefined): this {
        return this
    }
    onAcquired(value: ((value0: FormCallbackInfo) => void) | undefined): this {
        return this
    }
    onError(value: ((value0: ErrorInformation) => void) | undefined): this {
        return this
    }
    onRouter(value: ((value0: Object) => void) | undefined): this {
        return this
    }
    onUninstall(value: ((value0: FormCallbackInfo) => void) | undefined): this {
        return this
    }
    onLoad(value: VoidCallback | undefined): this {
        return this
    }
    onUpdate(value: ((value0: FormCallbackInfo) => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<FormComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function FormComponent(
    value: FormInfo,
    @memo
    content_?: () => void,
): FormComponentAttribute { throw new Error("")}
