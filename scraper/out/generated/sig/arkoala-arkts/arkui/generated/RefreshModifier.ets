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

import { RefreshAttribute, ArkRefreshPeer, RefreshStatus } from "./component/refresh"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
export class RefreshModifierInternal {
    public static fromPtr(ptr: KPointer): RefreshModifier {
        return new RefreshModifier(ptr)
    }
}
export class RefreshModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, RefreshModifier.getFinalizer())
    }
    constructor() {
        this(RefreshModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._RefreshModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._RefreshModifier_getFinalizer()
    }
}
export class RefreshModifier extends CommonMethodModifier implements RefreshAttribute,AttributeModifier<RefreshAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: RefreshAttribute): void { }
    applyPressedAttribute(instance: RefreshAttribute): void { }
    applyFocusedAttribute(instance: RefreshAttribute): void { }
    applyDisabledAttribute(instance: RefreshAttribute): void { }
    applySelectedAttribute(instance: RefreshAttribute): void { }
    _onStateChange_0_flag: object = AttributeUpdaterFlag.INITIAL
    _onStateChange_0_0value?: ((state: RefreshStatus) => void) | undefined
    _onRefreshing_0_flag: object = AttributeUpdaterFlag.INITIAL
    _onRefreshing_0_0value?: (() => void) | undefined
    _refreshOffset_0_flag: object = AttributeUpdaterFlag.INITIAL
    _refreshOffset_0_0value?: number | undefined
    _pullToRefresh_0_flag: object = AttributeUpdaterFlag.INITIAL
    _pullToRefresh_0_0value?: boolean | undefined
    _onOffsetChange_0_flag: object = AttributeUpdaterFlag.INITIAL
    _onOffsetChange_0_0value?: ((value0: number) => void) | undefined
    _pullDownRatio_0_flag: object = AttributeUpdaterFlag.INITIAL
    _pullDownRatio_0_0value?: number | undefined
    applyModifierPatch(peer: ArkRefreshPeer): void {
        super.applyModifierPatch(peer)
        if (this._onStateChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onStateChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnStateChangeAttribute((this._onStateChange_0_0value as ((state: RefreshStatus) => void) | undefined));
                    this._onStateChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onStateChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onStateChange_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnStateChangeAttribute((undefined as ((state: RefreshStatus) => void) | undefined));
                }
            }
        }
        if (this._onRefreshing_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onRefreshing_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnRefreshingAttribute((this._onRefreshing_0_0value as (() => void) | undefined));
                    this._onRefreshing_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onRefreshing_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onRefreshing_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnRefreshingAttribute((undefined as (() => void) | undefined));
                }
            }
        }
        if (this._refreshOffset_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._refreshOffset_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRefreshOffsetAttribute((this._refreshOffset_0_0value as number | undefined));
                    this._refreshOffset_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._refreshOffset_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._refreshOffset_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRefreshOffsetAttribute((undefined as number | undefined));
                }
            }
        }
        if (this._pullToRefresh_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._pullToRefresh_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setPullToRefreshAttribute((this._pullToRefresh_0_0value as boolean | undefined));
                    this._pullToRefresh_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._pullToRefresh_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._pullToRefresh_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setPullToRefreshAttribute((undefined as boolean | undefined));
                }
            }
        }
        if (this._onOffsetChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onOffsetChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnOffsetChangeAttribute((this._onOffsetChange_0_0value as ((value0: number) => void) | undefined));
                    this._onOffsetChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onOffsetChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onOffsetChange_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnOffsetChangeAttribute((undefined as ((value0: number) => void) | undefined));
                }
            }
        }
        if (this._pullDownRatio_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._pullDownRatio_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setPullDownRatioAttribute((this._pullDownRatio_0_0value as number | undefined));
                    this._pullDownRatio_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._pullDownRatio_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._pullDownRatio_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setPullDownRatioAttribute((undefined as number | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: RefreshModifier): void {
        super.mergeModifier(modifier)
        if (modifier._onStateChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._onStateChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.onStateChange(modifier._onStateChange_0_0value);
                    break;
                }
                default: {
                    this.onStateChange((undefined as ((state: RefreshStatus) => void) | undefined));
                }
            }
        }
        if (modifier._onRefreshing_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._onRefreshing_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.onRefreshing(modifier._onRefreshing_0_0value);
                    break;
                }
                default: {
                    this.onRefreshing((undefined as (() => void) | undefined));
                }
            }
        }
        if (modifier._refreshOffset_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._refreshOffset_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.refreshOffset(modifier._refreshOffset_0_0value);
                    break;
                }
                default: {
                    this.refreshOffset((undefined as number | undefined));
                }
            }
        }
        if (modifier._pullToRefresh_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._pullToRefresh_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.pullToRefresh(modifier._pullToRefresh_0_0value);
                    break;
                }
                default: {
                    this.pullToRefresh((undefined as boolean | undefined));
                }
            }
        }
        if (modifier._onOffsetChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._onOffsetChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.onOffsetChange(modifier._onOffsetChange_0_0value);
                    break;
                }
                default: {
                    this.onOffsetChange((undefined as ((value0: number) => void) | undefined));
                }
            }
        }
        if (modifier._pullDownRatio_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._pullDownRatio_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.pullDownRatio(modifier._pullDownRatio_0_0value);
                    break;
                }
                default: {
                    this.pullDownRatio((undefined as number | undefined));
                }
            }
        }
    }
    onStateChange(value: ((state: RefreshStatus) => void) | undefined): this {
        if (((this._onStateChange_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._onStateChange_0_flag = AttributeUpdaterFlag.UPDATE
            this._onStateChange_0_0value = value
        } else
        {
            this._onStateChange_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    onRefreshing(value: (() => void) | undefined): this {
        if (((this._onRefreshing_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._onRefreshing_0_flag = AttributeUpdaterFlag.UPDATE
            this._onRefreshing_0_0value = value
        } else
        {
            this._onRefreshing_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    refreshOffset(value: number | undefined): this {
        if (((this._refreshOffset_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._refreshOffset_0_0value) !== (value)))
        {
            this._refreshOffset_0_flag = AttributeUpdaterFlag.UPDATE
            this._refreshOffset_0_0value = value
        } else
        {
            this._refreshOffset_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    pullToRefresh(value: boolean | undefined): this {
        if (((this._pullToRefresh_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._pullToRefresh_0_0value) !== (value)))
        {
            this._pullToRefresh_0_flag = AttributeUpdaterFlag.UPDATE
            this._pullToRefresh_0_0value = value
        } else
        {
            this._pullToRefresh_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    onOffsetChange(value: ((value0: number) => void) | undefined): this {
        if (((this._onOffsetChange_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._onOffsetChange_0_flag = AttributeUpdaterFlag.UPDATE
            this._onOffsetChange_0_0value = value
        } else
        {
            this._onOffsetChange_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    pullDownRatio(value: number | undefined): this {
        if (((this._pullDownRatio_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._pullDownRatio_0_0value) !== (value)))
        {
            this._pullDownRatio_0_flag = AttributeUpdaterFlag.UPDATE
            this._pullDownRatio_0_0value = value
        } else
        {
            this._pullDownRatio_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<RefreshAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class RefreshModifier_serializer {
    public static write(buffer: SerializerBase, value: RefreshModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): RefreshModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return RefreshModifierInternal.fromPtr(ptr)
    }
}
