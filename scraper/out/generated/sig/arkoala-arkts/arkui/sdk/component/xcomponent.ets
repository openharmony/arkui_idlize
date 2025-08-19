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
import { ImageAnalyzerConfig, ImageAIOptions } from "./imageCommon"
import { XComponentType } from "./enums"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { VoidCallback } from "./units"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface SurfaceRect {
    offsetX?: double;
    offsetY?: double;
    surfaceWidth: double;
    surfaceHeight: double;
}
export type NativeXComponentPointer = int64;
export declare interface SurfaceRotationOptions {
    lock?: boolean;
}
export declare class XComponentController {
    constructor()
    onSurfaceCreated: ((surfaceId: string) => void);
    onSurfaceChanged: ((surfaceId: string,rect: SurfaceRect) => void);
    onSurfaceDestroyed: ((surfaceId: string) => void);
    getXComponentSurfaceId(): string
    setXComponentSurfaceRect(rect: SurfaceRect): void
    getXComponentSurfaceRect(): SurfaceRect
    setXComponentSurfaceRotation(rotationOptions: SurfaceRotationOptions): void
    getXComponentSurfaceRotation(): SurfaceRotationOptions
    startImageAnalyzer(config: ImageAnalyzerConfig): Promise<void>
    stopImageAnalyzer(): void
}
export declare interface XComponentOptions {
    type: XComponentType;
    controller: XComponentController;
    imageAIOptions?: ImageAIOptions;
    screenId?: int64;
}
export declare interface NativeXComponentParameters {
    type: XComponentType;
    imageAIOptions?: ImageAIOptions;
}
export interface XComponentAttribute extends CommonMethod {
    onLoad(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onLoad")
    }
    onDestroy(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onDestroy")
    }
    enableAnalyzer(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAnalyzer")
    }
    enableSecure(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableSecure")
    }
    hdrBrightness(value: double | undefined): this {
        throw new Error("Unimplemented method hdrBrightness")
    }
    attributeModifier(value: AttributeModifier<XComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkXComponentStyle extends ArkCommonMethodStyle implements XComponentAttribute {
    onLoad_value?: VoidCallback | undefined
    onDestroy_value?: VoidCallback | undefined
    enableAnalyzer_value?: boolean | undefined
    enableSecure_value?: boolean | undefined
    hdrBrightness_value?: double | undefined
    attributeModifier_value?: AttributeModifier<XComponentAttribute> | AttributeModifier<CommonMethod> | undefined
    onLoad(value: VoidCallback | undefined): this {
        return this
    }
    onDestroy(value: VoidCallback | undefined): this {
        return this
    }
    enableAnalyzer(value: boolean | undefined): this {
        return this
    }
    enableSecure(value: boolean | undefined): this {
        return this
    }
    hdrBrightness(value: double | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<XComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface XComponentParameters {
    id: string;
    type: XComponentType;
    nativeXComponentHandler: ((value0: NativeXComponentPointer) => void);
    controller?: XComponentController;
}

@memo
@ComponentBuilder
export function XComponent(
    params: XComponentParameters | XComponentOptions | NativeXComponentParameters,
    @memo
    content_?: () => void,
): XComponentAttribute { throw new Error("")}
