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
import { Resource } from "@global.resource"
import { ResourceColor } from "./units"
import { Color, FontWeight } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum SymbolRenderingStrategy {
    SINGLE = 0,
    MULTIPLE_COLOR = 1,
    MULTIPLE_OPACITY = 2
}
export enum SymbolEffectStrategy {
    NONE = 0,
    SCALE = 1,
    HIERARCHICAL = 2
}
export enum EffectDirection {
    DOWN = 0,
    UP = 1
}
export enum EffectScope {
    LAYER = 0,
    WHOLE = 1
}
export enum EffectFillStyle {
    CUMULATIVE = 0,
    ITERATIVE = 1
}
export declare class SymbolEffect {
    constructor()
}
export declare class ScaleSymbolEffect extends SymbolEffect {
    constructor(scope: EffectScope | undefined, direction: EffectDirection | undefined)
    scope?: EffectScope | undefined;
    direction?: EffectDirection | undefined;
}
export declare class HierarchicalSymbolEffect extends SymbolEffect {
    constructor(fillStyle: EffectFillStyle | undefined)
    fillStyle?: EffectFillStyle | undefined;
}
export declare class AppearSymbolEffect extends SymbolEffect {
    constructor(scope: EffectScope | undefined)
    scope?: EffectScope | undefined;
}
export declare class DisappearSymbolEffect extends SymbolEffect {
    constructor(scope: EffectScope | undefined)
    scope?: EffectScope | undefined;
}
export declare class BounceSymbolEffect extends SymbolEffect {
    constructor(scope: EffectScope | undefined, direction: EffectDirection | undefined)
    scope?: EffectScope | undefined;
    direction?: EffectDirection | undefined;
}
export declare class ReplaceSymbolEffect extends SymbolEffect {
    constructor(scope: EffectScope | undefined)
    scope?: EffectScope | undefined;
}
export declare class PulseSymbolEffect extends SymbolEffect {
    constructor()
}
export interface SymbolGlyphAttribute extends CommonMethod {
    fontSize(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    fontColor(value: Array<ResourceColor> | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    effectStrategy(value: SymbolEffectStrategy | undefined): this {
        throw new Error("Unimplemented method effectStrategy")
    }
    renderingStrategy(value: SymbolRenderingStrategy | undefined): this {
        throw new Error("Unimplemented method renderingStrategy")
    }
    minFontScale(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method minFontScale")
    }
    maxFontScale(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method maxFontScale")
    }
    symbolEffect(symbolEffect: SymbolEffect | undefined, triggerValue?: boolean | number): this {
        throw new Error("Unimplemented method symbolEffect")
    }
    attributeModifier(value: AttributeModifier<SymbolGlyphAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSymbolGlyphStyle extends ArkCommonMethodStyle implements SymbolGlyphAttribute {
    fontSize_value?: number | string | Resource | undefined
    fontColor_value?: Array<ResourceColor> | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    effectStrategy_value?: SymbolEffectStrategy | undefined
    renderingStrategy_value?: SymbolRenderingStrategy | undefined
    minFontScale_value?: number | Resource | undefined
    maxFontScale_value?: number | Resource | undefined
    attributeModifier_value?: AttributeModifier<SymbolGlyphAttribute> | AttributeModifier<CommonMethod> | undefined
    fontSize(value: number | string | Resource | undefined): this {
        return this
    }
    fontColor(value: Array<ResourceColor> | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    effectStrategy(value: SymbolEffectStrategy | undefined): this {
        return this
    }
    renderingStrategy(value: SymbolRenderingStrategy | undefined): this {
        return this
    }
    minFontScale(value: number | Resource | undefined): this {
        return this
    }
    maxFontScale(value: number | Resource | undefined): this {
        return this
    }
    symbolEffect(symbolEffect: SymbolEffect | undefined, triggerValue?: boolean | number): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SymbolGlyphAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function SymbolGlyph(
    value?: Resource,
    @memo
    content_?: () => void,
): SymbolGlyphAttribute { throw new Error("")}
