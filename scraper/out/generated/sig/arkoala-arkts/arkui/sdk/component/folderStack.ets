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
import { default as window } from "@ohos.window"
import { FoldStatus, Alignment, AppRotation } from "./enums"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export type WindowStatusType = window.WindowStatusType;
export declare interface FolderStackOptions {
    upperItems?: Array<string>;
}
export declare interface OnFoldStatusChangeInfo {
    foldStatus: FoldStatus;
}
export type OnFoldStatusChangeCallback = (event: OnFoldStatusChangeInfo) => void;
export type OnHoverStatusChangeCallback = (param: HoverEventParam) => void;
export interface FolderStackAttribute extends CommonMethod {
    alignContent(value: Alignment | undefined): this {
        throw new Error("Unimplemented method alignContent")
    }
    onFolderStateChange(value: OnFoldStatusChangeCallback | undefined): this {
        throw new Error("Unimplemented method onFolderStateChange")
    }
    onHoverStatusChange(value: OnHoverStatusChangeCallback | undefined): this {
        throw new Error("Unimplemented method onHoverStatusChange")
    }
    enableAnimation(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAnimation")
    }
    autoHalfFold(value: boolean | undefined): this {
        throw new Error("Unimplemented method autoHalfFold")
    }
    attributeModifier(value: AttributeModifier<FolderStackAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkFolderStackStyle extends ArkCommonMethodStyle implements FolderStackAttribute {
    alignContent_value?: Alignment | undefined
    onFolderStateChange_value?: OnFoldStatusChangeCallback | undefined
    onHoverStatusChange_value?: OnHoverStatusChangeCallback | undefined
    enableAnimation_value?: boolean | undefined
    autoHalfFold_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<FolderStackAttribute> | AttributeModifier<CommonMethod> | undefined
    alignContent(value: Alignment | undefined): this {
        return this
    }
    onFolderStateChange(value: OnFoldStatusChangeCallback | undefined): this {
        return this
    }
    onHoverStatusChange(value: OnHoverStatusChangeCallback | undefined): this {
        return this
    }
    enableAnimation(value: boolean | undefined): this {
        return this
    }
    autoHalfFold(value: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<FolderStackAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface HoverEventParam {
    foldStatus: FoldStatus;
    isHoverMode: boolean;
    appRotation: AppRotation;
    windowStatusType: window.WindowStatusType;
}

@memo
@ComponentBuilder
export function FolderStack(
    options?: FolderStackOptions,
    @memo
    content_?: () => void,
): FolderStackAttribute { throw new Error("")}
