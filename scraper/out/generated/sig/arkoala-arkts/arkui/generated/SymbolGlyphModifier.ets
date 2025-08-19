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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { Resource_serializer } from "./framework/resource"
import { SymbolGlyphAttribute, ArkSymbolGlyphPeer, SymbolEffectStrategy, SymbolRenderingStrategy, SymbolEffect } from "./component/symbolglyph"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { Resource } from "@global.resource"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
import { ResourceColor } from "./component/units"
import { Color, FontWeight } from "./component/enums"
export class SymbolGlyphModifierInternal {
    public static fromPtr(ptr: KPointer): SymbolGlyphModifier {
        return new SymbolGlyphModifier(false, ptr)
    }
}
export class SymbolGlyphModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(_0: boolean, peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, SymbolGlyphModifier.getFinalizer())
    }
    constructor(src?: Resource) {
        this(false, SymbolGlyphModifier.construct(src))
    }
    static construct(src?: Resource): KPointer {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (src !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const srcTmpValue  = src!
            Resource_serializer.write(thisSerializer, srcTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = ArkUIGeneratedNativeModule._SymbolGlyphModifier_construct(thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._SymbolGlyphModifier_getFinalizer()
    }
}
export class SymbolGlyphModifier extends CommonMethodModifier implements SymbolGlyphAttribute,AttributeModifier<SymbolGlyphAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: SymbolGlyphAttribute): void { }
    applyPressedAttribute(instance: SymbolGlyphAttribute): void { }
    applyFocusedAttribute(instance: SymbolGlyphAttribute): void { }
    applyDisabledAttribute(instance: SymbolGlyphAttribute): void { }
    applySelectedAttribute(instance: SymbolGlyphAttribute): void { }
    _fontSize_0_flag: object = AttributeUpdaterFlag.INITIAL
    _fontSize_0_0value?: number | string | Resource | undefined
    _fontColor_0_flag: object = AttributeUpdaterFlag.INITIAL
    _fontColor_0_0value?: Array<ResourceColor> | undefined
    _fontWeight_0_flag: object = AttributeUpdaterFlag.INITIAL
    _fontWeight_0_0value?: number | FontWeight | string | undefined
    _effectStrategy_0_flag: object = AttributeUpdaterFlag.INITIAL
    _effectStrategy_0_0value?: SymbolEffectStrategy | undefined
    _renderingStrategy_0_flag: object = AttributeUpdaterFlag.INITIAL
    _renderingStrategy_0_0value?: SymbolRenderingStrategy | undefined
    _minFontScale_0_flag: object = AttributeUpdaterFlag.INITIAL
    _minFontScale_0_0value?: number | Resource | undefined
    _maxFontScale_0_flag: object = AttributeUpdaterFlag.INITIAL
    _maxFontScale_0_0value?: number | Resource | undefined
    _symbolEffect_0_flag: object = AttributeUpdaterFlag.INITIAL
    _symbolEffect_0_0value?: SymbolEffect | undefined
    _symbolEffect_0_1value?: boolean | number | undefined
    applyModifierPatch(peer: ArkSymbolGlyphPeer): void {
        super.applyModifierPatch(peer)
        if (this._fontSize_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._fontSize_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setFontSizeAttribute((this._fontSize_0_0value as number | string | Resource | undefined));
                    this._fontSize_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._fontSize_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._fontSize_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setFontSizeAttribute((undefined as number | string | Resource | undefined));
                }
            }
        }
        if (this._fontColor_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._fontColor_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setFontColorAttribute((this._fontColor_0_0value as Array<ResourceColor> | undefined));
                    this._fontColor_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._fontColor_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._fontColor_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setFontColorAttribute((undefined as Array<ResourceColor> | undefined));
                }
            }
        }
        if (this._fontWeight_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._fontWeight_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setFontWeightAttribute((this._fontWeight_0_0value as number | FontWeight | string | undefined));
                    this._fontWeight_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._fontWeight_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._fontWeight_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setFontWeightAttribute((undefined as number | FontWeight | string | undefined));
                }
            }
        }
        if (this._effectStrategy_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._effectStrategy_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setEffectStrategyAttribute((this._effectStrategy_0_0value as SymbolEffectStrategy | undefined));
                    this._effectStrategy_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._effectStrategy_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._effectStrategy_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setEffectStrategyAttribute((undefined as SymbolEffectStrategy | undefined));
                }
            }
        }
        if (this._renderingStrategy_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._renderingStrategy_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRenderingStrategyAttribute((this._renderingStrategy_0_0value as SymbolRenderingStrategy | undefined));
                    this._renderingStrategy_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._renderingStrategy_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._renderingStrategy_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRenderingStrategyAttribute((undefined as SymbolRenderingStrategy | undefined));
                }
            }
        }
        if (this._minFontScale_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._minFontScale_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setMinFontScaleAttribute((this._minFontScale_0_0value as number | Resource | undefined));
                    this._minFontScale_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._minFontScale_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._minFontScale_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setMinFontScaleAttribute((undefined as number | Resource | undefined));
                }
            }
        }
        if (this._maxFontScale_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._maxFontScale_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setMaxFontScaleAttribute((this._maxFontScale_0_0value as number | Resource | undefined));
                    this._maxFontScale_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._maxFontScale_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._maxFontScale_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setMaxFontScaleAttribute((undefined as number | Resource | undefined));
                }
            }
        }
        if (this._symbolEffect_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._symbolEffect_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSymbolEffectAttribute((this._symbolEffect_0_0value as SymbolEffect | undefined), (this._symbolEffect_0_1value as boolean | number | undefined));
                    this._symbolEffect_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._symbolEffect_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._symbolEffect_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSymbolEffectAttribute((undefined as SymbolEffect | undefined), (undefined as boolean | number | undefined | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: SymbolGlyphModifier): void {
        super.mergeModifier(modifier)
        if (modifier._fontSize_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._fontSize_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.fontSize(modifier._fontSize_0_0value);
                    break;
                }
                default: {
                    this.fontSize((undefined as number | string | Resource | undefined));
                }
            }
        }
        if (modifier._fontColor_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._fontColor_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.fontColor(modifier._fontColor_0_0value);
                    break;
                }
                default: {
                    this.fontColor((undefined as Array<ResourceColor> | undefined));
                }
            }
        }
        if (modifier._fontWeight_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._fontWeight_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.fontWeight(modifier._fontWeight_0_0value);
                    break;
                }
                default: {
                    this.fontWeight((undefined as number | FontWeight | string | undefined));
                }
            }
        }
        if (modifier._effectStrategy_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._effectStrategy_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.effectStrategy(modifier._effectStrategy_0_0value);
                    break;
                }
                default: {
                    this.effectStrategy((undefined as SymbolEffectStrategy | undefined));
                }
            }
        }
        if (modifier._renderingStrategy_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._renderingStrategy_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.renderingStrategy(modifier._renderingStrategy_0_0value);
                    break;
                }
                default: {
                    this.renderingStrategy((undefined as SymbolRenderingStrategy | undefined));
                }
            }
        }
        if (modifier._minFontScale_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._minFontScale_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.minFontScale(modifier._minFontScale_0_0value);
                    break;
                }
                default: {
                    this.minFontScale((undefined as number | Resource | undefined));
                }
            }
        }
        if (modifier._maxFontScale_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._maxFontScale_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.maxFontScale(modifier._maxFontScale_0_0value);
                    break;
                }
                default: {
                    this.maxFontScale((undefined as number | Resource | undefined));
                }
            }
        }
        if (modifier._symbolEffect_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._symbolEffect_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.symbolEffect(modifier._symbolEffect_0_0value, modifier._symbolEffect_0_1value);
                    break;
                }
                default: {
                    this.symbolEffect((undefined as SymbolEffect | undefined), (undefined as boolean | number | undefined | undefined));
                }
            }
        }
    }
    fontSize(value: number | string | Resource | undefined): this {
        if (((this._fontSize_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._fontSize_0_flag = AttributeUpdaterFlag.UPDATE
            this._fontSize_0_0value = value
        } else
        {
            this._fontSize_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    fontColor(value: Array<ResourceColor> | undefined): this {
        if (((this._fontColor_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._fontColor_0_flag = AttributeUpdaterFlag.UPDATE
            this._fontColor_0_0value = value
        } else
        {
            this._fontColor_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        if (((this._fontWeight_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._fontWeight_0_flag = AttributeUpdaterFlag.UPDATE
            this._fontWeight_0_0value = value
        } else
        {
            this._fontWeight_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    effectStrategy(value: SymbolEffectStrategy | undefined): this {
        if (((this._effectStrategy_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._effectStrategy_0_flag = AttributeUpdaterFlag.UPDATE
            this._effectStrategy_0_0value = value
        } else
        {
            this._effectStrategy_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    renderingStrategy(value: SymbolRenderingStrategy | undefined): this {
        if (((this._renderingStrategy_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._renderingStrategy_0_flag = AttributeUpdaterFlag.UPDATE
            this._renderingStrategy_0_0value = value
        } else
        {
            this._renderingStrategy_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    minFontScale(value: number | Resource | undefined): this {
        if (((this._minFontScale_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._minFontScale_0_flag = AttributeUpdaterFlag.UPDATE
            this._minFontScale_0_0value = value
        } else
        {
            this._minFontScale_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    maxFontScale(value: number | Resource | undefined): this {
        if (((this._maxFontScale_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._maxFontScale_0_flag = AttributeUpdaterFlag.UPDATE
            this._maxFontScale_0_0value = value
        } else
        {
            this._maxFontScale_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    symbolEffect(symbolEffect: SymbolEffect | undefined, triggerValue?: boolean | number): this {
        if (((this._symbolEffect_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true) || ((this._symbolEffect_0_1value) !== (triggerValue)))
        {
            this._symbolEffect_0_flag = AttributeUpdaterFlag.UPDATE
            this._symbolEffect_0_0value = symbolEffect
            this._symbolEffect_0_1value = triggerValue
        } else
        {
            this._symbolEffect_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<SymbolGlyphAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class SymbolGlyphModifier_serializer {
    public static write(buffer: SerializerBase, value: SymbolGlyphModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): SymbolGlyphModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return SymbolGlyphModifierInternal.fromPtr(ptr)
    }
}
