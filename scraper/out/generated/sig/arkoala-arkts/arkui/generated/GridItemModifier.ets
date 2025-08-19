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

import { GridItemAttribute, ArkGridItemPeer } from "./component/gridItem"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod, Bindable } from "./component/common"
export class GridItemModifierInternal {
    public static fromPtr(ptr: KPointer): GridItemModifier {
        return new GridItemModifier(ptr)
    }
}
export class GridItemModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, GridItemModifier.getFinalizer())
    }
    constructor() {
        this(GridItemModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._GridItemModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._GridItemModifier_getFinalizer()
    }
}
export class GridItemModifier extends CommonMethodModifier implements GridItemAttribute,AttributeModifier<GridItemAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: GridItemAttribute): void { }
    applyPressedAttribute(instance: GridItemAttribute): void { }
    applyFocusedAttribute(instance: GridItemAttribute): void { }
    applyDisabledAttribute(instance: GridItemAttribute): void { }
    applySelectedAttribute(instance: GridItemAttribute): void { }
    _rowStart_0_flag: object = AttributeUpdaterFlag.INITIAL
    _rowStart_0_0value?: number | undefined
    _rowEnd_0_flag: object = AttributeUpdaterFlag.INITIAL
    _rowEnd_0_0value?: number | undefined
    _columnStart_0_flag: object = AttributeUpdaterFlag.INITIAL
    _columnStart_0_0value?: number | undefined
    _columnEnd_0_flag: object = AttributeUpdaterFlag.INITIAL
    _columnEnd_0_0value?: number | undefined
    _selectable_0_flag: object = AttributeUpdaterFlag.INITIAL
    _selectable_0_0value?: boolean | undefined
    _selected_0_flag: object = AttributeUpdaterFlag.INITIAL
    _selected_0_0value?: boolean | Bindable<boolean> | undefined
    _onSelect_0_flag: object = AttributeUpdaterFlag.INITIAL
    _onSelect_0_0value?: ((isSelected: boolean) => void) | undefined
    applyModifierPatch(peer: ArkGridItemPeer): void {
        super.applyModifierPatch(peer)
        if (this._rowStart_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._rowStart_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRowStartAttribute((this._rowStart_0_0value as number | undefined));
                    this._rowStart_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._rowStart_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._rowStart_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRowStartAttribute((undefined as number | undefined));
                }
            }
        }
        if (this._rowEnd_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._rowEnd_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRowEndAttribute((this._rowEnd_0_0value as number | undefined));
                    this._rowEnd_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._rowEnd_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._rowEnd_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRowEndAttribute((undefined as number | undefined));
                }
            }
        }
        if (this._columnStart_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._columnStart_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setColumnStartAttribute((this._columnStart_0_0value as number | undefined));
                    this._columnStart_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._columnStart_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._columnStart_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setColumnStartAttribute((undefined as number | undefined));
                }
            }
        }
        if (this._columnEnd_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._columnEnd_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setColumnEndAttribute((this._columnEnd_0_0value as number | undefined));
                    this._columnEnd_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._columnEnd_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._columnEnd_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setColumnEndAttribute((undefined as number | undefined));
                }
            }
        }
        if (this._selectable_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._selectable_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSelectableAttribute((this._selectable_0_0value as boolean | undefined));
                    this._selectable_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._selectable_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._selectable_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSelectableAttribute((undefined as boolean | undefined));
                }
            }
        }
        if (this._selected_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._selected_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSelectedAttribute((this._selected_0_0value as boolean | Bindable<boolean> | undefined));
                    this._selected_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._selected_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._selected_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSelectedAttribute((undefined as boolean | Bindable<boolean> | undefined));
                }
            }
        }
        if (this._onSelect_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onSelect_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnSelectAttribute((this._onSelect_0_0value as ((isSelected: boolean) => void) | undefined));
                    this._onSelect_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onSelect_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onSelect_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnSelectAttribute((undefined as ((isSelected: boolean) => void) | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: GridItemModifier): void {
        super.mergeModifier(modifier)
        if (modifier._rowStart_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._rowStart_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.rowStart(modifier._rowStart_0_0value);
                    break;
                }
                default: {
                    this.rowStart((undefined as number | undefined));
                }
            }
        }
        if (modifier._rowEnd_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._rowEnd_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.rowEnd(modifier._rowEnd_0_0value);
                    break;
                }
                default: {
                    this.rowEnd((undefined as number | undefined));
                }
            }
        }
        if (modifier._columnStart_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._columnStart_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.columnStart(modifier._columnStart_0_0value);
                    break;
                }
                default: {
                    this.columnStart((undefined as number | undefined));
                }
            }
        }
        if (modifier._columnEnd_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._columnEnd_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.columnEnd(modifier._columnEnd_0_0value);
                    break;
                }
                default: {
                    this.columnEnd((undefined as number | undefined));
                }
            }
        }
        if (modifier._selectable_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._selectable_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.selectable(modifier._selectable_0_0value);
                    break;
                }
                default: {
                    this.selectable((undefined as boolean | undefined));
                }
            }
        }
        if (modifier._selected_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._selected_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.selected(modifier._selected_0_0value);
                    break;
                }
                default: {
                    this.selected((undefined as boolean | Bindable<boolean> | undefined));
                }
            }
        }
        if (modifier._onSelect_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._onSelect_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.onSelect(modifier._onSelect_0_0value);
                    break;
                }
                default: {
                    this.onSelect((undefined as ((isSelected: boolean) => void) | undefined));
                }
            }
        }
    }
    rowStart(value: number | undefined): this {
        if (((this._rowStart_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._rowStart_0_0value) !== (value)))
        {
            this._rowStart_0_flag = AttributeUpdaterFlag.UPDATE
            this._rowStart_0_0value = value
        } else
        {
            this._rowStart_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    rowEnd(value: number | undefined): this {
        if (((this._rowEnd_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._rowEnd_0_0value) !== (value)))
        {
            this._rowEnd_0_flag = AttributeUpdaterFlag.UPDATE
            this._rowEnd_0_0value = value
        } else
        {
            this._rowEnd_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    columnStart(value: number | undefined): this {
        if (((this._columnStart_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._columnStart_0_0value) !== (value)))
        {
            this._columnStart_0_flag = AttributeUpdaterFlag.UPDATE
            this._columnStart_0_0value = value
        } else
        {
            this._columnStart_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    columnEnd(value: number | undefined): this {
        if (((this._columnEnd_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._columnEnd_0_0value) !== (value)))
        {
            this._columnEnd_0_flag = AttributeUpdaterFlag.UPDATE
            this._columnEnd_0_0value = value
        } else
        {
            this._columnEnd_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    selectable(value: boolean | undefined): this {
        if (((this._selectable_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._selectable_0_0value) !== (value)))
        {
            this._selectable_0_flag = AttributeUpdaterFlag.UPDATE
            this._selectable_0_0value = value
        } else
        {
            this._selectable_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    selected(value: boolean | Bindable<boolean> | undefined): this {
        if (((this._selected_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._selected_0_flag = AttributeUpdaterFlag.UPDATE
            this._selected_0_0value = value
        } else
        {
            this._selected_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    onSelect(value: ((isSelected: boolean) => void) | undefined): this {
        if (((this._onSelect_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._onSelect_0_flag = AttributeUpdaterFlag.UPDATE
            this._onSelect_0_0value = value
        } else
        {
            this._onSelect_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<GridItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class GridItemModifier_serializer {
    public static write(buffer: SerializerBase, value: GridItemModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): GridItemModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return GridItemModifierInternal.fromPtr(ptr)
    }
}
