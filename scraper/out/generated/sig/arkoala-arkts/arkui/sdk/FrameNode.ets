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
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { Size, Vector2, Edges, SizeT } from "./Graphics"
import { UICommonEvent, CommonMethod, CustomProperty } from "./component/common"
import { UIGestureEvent, extractors } from "./handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { RenderNode } from "./RenderNode"
import { ComponentContent } from "./ComponentContent"
import { ColumnAttribute, ColumnOptions, ColumnOptionsV2 } from "./component/column"
import { RowAttribute, RowOptions, RowOptionsV2 } from "./component/row"
import { StackAttribute, StackOptions } from "./component/stack"
import { GridRowAttribute, GridRowOptions } from "./component/gridRow"
import { GridColAttribute, GridColOptions } from "./component/gridCol"
import { FlexAttribute, FlexOptions } from "./component/flex"
import { RelativeContainerAttribute } from "./component/relativeContainer"
import { DividerAttribute } from "./component/divider"
import { BlankAttribute } from "./component/blank"
import { ListAttribute, ListOptions } from "./component/list"
import { ListItemAttribute, ListItemOptions } from "./component/listItem"
import { ListItemGroupAttribute, ListItemGroupOptions } from "./component/listItemGroup"
import { ScrollAttribute, Scroller } from "./component/scroll"
import { GridAttribute, GridLayoutOptions } from "./component/grid"
import { GridItemAttribute, GridItemOptions } from "./component/gridItem"
import { WaterFlowAttribute, WaterFlowOptions } from "./component/waterFlow"
import { FlowItemAttribute } from "./component/flowItem"
import { TextAttribute, TextOptions } from "./component/text"
import { Resource } from "@global.resource"
import { SearchAttribute, SearchOptions } from "./component/search"
import { TextInputAttribute, TextInputOptions } from "./component/textInput"
import { TextAreaAttribute, TextAreaOptions } from "./component/textArea"
import { SymbolGlyphAttribute } from "./component/symbolglyph"
import { MarqueeAttribute, MarqueeOptions } from "./component/marquee"
import { SwiperAttribute, SwiperController } from "./component/swiper"
import { XComponentAttribute, XComponentParameters, XComponentOptions, NativeXComponentParameters } from "./component/xcomponent"
export declare interface LayoutConstraint {
    maxSize: Size;
    minSize: Size;
    percentReference: Size;
}
export declare interface CrossLanguageOptions {
    attributeSetting?: boolean;
}
export enum ExpandMode {
    NOT_EXPAND = 0,
    EXPAND = 1,
    LAZY_EXPAND = 2
}
export declare class FrameNode {
    constructor(uiContext: UIContext)
    get commonEvent():UICommonEvent;
    get gestureEvent():UIGestureEvent;
    get commonAttribute():CommonMethod;
    getRenderNode(): RenderNode | undefined
    isModifiable(): boolean
    appendChild(node: FrameNode): void
    insertChildAfter(child: FrameNode, sibling: FrameNode | undefined): void
    removeChild(node: FrameNode): void
    clearChildren(): void
    getChild(index: number, expandMode?: ExpandMode | undefined): FrameNode | undefined
    getFirstChildIndexWithoutExpand(): number
    getLastChildIndexWithoutExpand(): number
    getFirstChild(): FrameNode | undefined
    getNextSibling(): FrameNode | undefined
    getPreviousSibling(): FrameNode | undefined
    getParent(): FrameNode | undefined
    getChildrenCount(): number
    moveTo(targetParent: FrameNode, index?: number): void
    dispose(): void
    getPositionToWindow(): Vector2
    isDisposed(): boolean
    getPositionToParent(): Vector2
    getMeasuredSize(): Size
    getLayoutPosition(): Vector2
    getUserConfigBorderWidth(): Edges
    getUserConfigPadding(): Edges
    getUserConfigMargin(): Edges
    getUserConfigSize(): SizeT
    getId(): string
    getUniqueId(): number
    getNodeType(): string
    getOpacity(): number
    isVisible(): boolean
    isClipToFrame(): boolean
    isAttached(): boolean
    getInspectorInfo(): Object
    getCustomProperty(name: string): CustomProperty
    onMeasure(constraint: LayoutConstraint): void
    onLayout(position: Vector2): void
    setMeasuredSize(size: Size): void
    setLayoutPosition(position: Vector2): void
    measure(constraint: LayoutConstraint): void
    layout(position: Vector2): void
    setNeedsLayout(): void
    invalidate(): void
    getPositionToScreen(): Vector2
    getGlobalPositionOnDisplay(): Vector2
    getPositionToWindowWithTransform(): Vector2
    getPositionToParentWithTransform(): Vector2
    getPositionToScreenWithTransform(): Vector2
    disposeTree(): void
    addComponentContent<T = void>(content: ComponentContent<T>): void
    setCrossLanguageOptions(value: CrossLanguageOptions): void
    getCrossLanguageOptions(): CrossLanguageOptions
    recycle(): void
    reuse(): void
    isTransferred(): boolean
}
export declare abstract class TypedFrameNode<T = void> extends FrameNode {
    constructor()
    get attribute_():T;
}
export declare class NodeAdapter {
    constructor()
    set totalNodeCount(val:number);
    get totalNodeCount():number;
    dispose(): void
    isDisposed(): boolean
    reloadAllItems(): void
    reloadItem(start: number, count: number): void
    removeItem(start: number, count: number): void
    insertItem(start: number, count: number): void
    moveItem(from: number, to: number): void
    getAllAvailableItems(): Array<FrameNode>
    onAttachToNode(target: FrameNode): void
    onDetachFromNode(): void
    onGetChildId(index: number): number
    onCreateChild(index: number): FrameNode
    onDisposeChild(id: number, node: FrameNode): void
    onUpdateChild(id: number, node: FrameNode): void
    static attachNodeAdapter(adapter: NodeAdapter, node: FrameNode): boolean
    static detachNodeAdapter(node: FrameNode): void
}
export declare namespace typeNode {
    export abstract class ColumnFrameNode extends TypedFrameNode<ColumnAttribute> {
        constructor()
        initialize(options?: ColumnOptions | ColumnOptionsV2): ColumnAttribute
    }
    export type Column = typeNode.ColumnFrameNode;
    export abstract class RowFrameNode extends TypedFrameNode<RowAttribute> {
        constructor()
        initialize(options?: RowOptions | RowOptionsV2): RowAttribute
    }
    export type Row = typeNode.RowFrameNode;
    export abstract class StackFrameNode extends TypedFrameNode<StackAttribute> {
        constructor()
        initialize(options?: StackOptions): StackAttribute
    }
    export type Stack = typeNode.StackFrameNode;
    export abstract class GridRowFrameNode extends TypedFrameNode<GridRowAttribute> {
        constructor()
        initialize(options?: GridRowOptions): GridRowAttribute
    }
    export type GridRow = typeNode.GridRowFrameNode;
    export abstract class GridColFrameNode extends TypedFrameNode<GridColAttribute> {
        constructor()
        initialize(options?: GridColOptions): GridColAttribute
    }
    export type GridCol = typeNode.GridColFrameNode;
    export abstract class FlexFrameNode extends TypedFrameNode<FlexAttribute> {
        constructor()
        initialize(value?: FlexOptions): FlexAttribute
    }
    export type Flex = typeNode.FlexFrameNode;
    export abstract class RelativeContainerFrameNode extends TypedFrameNode<RelativeContainerAttribute> {
        constructor()
        initialize(): RelativeContainerAttribute
    }
    export type RelativeContainer = typeNode.RelativeContainerFrameNode;
    export abstract class DividerFrameNode extends TypedFrameNode<DividerAttribute> {
        constructor()
        initialize(): DividerAttribute
    }
    export type Divider = typeNode.DividerFrameNode;
    export abstract class BlankFrameNode extends TypedFrameNode<BlankAttribute> {
        constructor()
        initialize(min?: number | string): BlankAttribute
    }
    export type Blank = typeNode.BlankFrameNode;
    export abstract class ListFrameNode extends TypedFrameNode<ListAttribute> {
        constructor()
        initialize(options?: ListOptions): ListAttribute
    }
    export type List = typeNode.ListFrameNode;
    export abstract class ListItemFrameNode extends TypedFrameNode<ListItemAttribute> {
        constructor()
        initialize(options?: ListItemOptions): ListItemAttribute
    }
    export type ListItem = typeNode.ListItemFrameNode;
    export abstract class ListItemGroupFrameNode extends TypedFrameNode<ListItemGroupAttribute> {
        constructor()
        initialize(options?: ListItemGroupOptions): ListItemGroupAttribute
    }
    export type ListItemGroup = typeNode.ListItemGroupFrameNode;
    export abstract class ScrollFrameNode extends TypedFrameNode<ScrollAttribute> {
        constructor()
        initialize(scroller?: Scroller): ScrollAttribute
    }
    export type Scroll = typeNode.ScrollFrameNode;
    export abstract class GridFrameNode extends TypedFrameNode<GridAttribute> {
        constructor()
        initialize(scroller?: Scroller, layoutOptions?: GridLayoutOptions): GridAttribute
    }
    export type Grid = typeNode.GridFrameNode;
    export abstract class GridItemFrameNode extends TypedFrameNode<GridItemAttribute> {
        constructor()
        initialize(options?: GridItemOptions): GridItemAttribute
    }
    export type GridItem = typeNode.GridItemFrameNode;
    export abstract class WaterFlowFrameNode extends TypedFrameNode<WaterFlowAttribute> {
        constructor()
        initialize(options?: WaterFlowOptions): WaterFlowAttribute
    }
    export type WaterFlow = typeNode.WaterFlowFrameNode;
    export abstract class FlowItemFrameNode extends TypedFrameNode<FlowItemAttribute> {
        constructor()
        initialize(): FlowItemAttribute
    }
    export type FlowItem = typeNode.FlowItemFrameNode;
    export abstract class TextFrameNode extends TypedFrameNode<TextAttribute> {
        constructor()
        initialize(content?: string | Resource, value?: TextOptions): TextAttribute
    }
    export type Text = typeNode.TextFrameNode;
    export abstract class SearchFrameNode extends TypedFrameNode<SearchAttribute> {
        constructor()
        initialize(value?: SearchOptions): SearchAttribute
    }
    export type Search = typeNode.SearchFrameNode;
    export abstract class TextInputFrameNode extends TypedFrameNode<TextInputAttribute> {
        constructor()
        initialize(value?: TextInputOptions): TextInputAttribute
    }
    export type TextInput = typeNode.TextInputFrameNode;
    export abstract class TextAreaFrameNode extends TypedFrameNode<TextAreaAttribute> {
        constructor()
        initialize(value?: TextAreaOptions): TextAreaAttribute
    }
    export type TextArea = typeNode.TextAreaFrameNode;
    export abstract class SymbolGlyphFrameNode extends TypedFrameNode<SymbolGlyphAttribute> {
        constructor()
        initialize(value?: Resource): SymbolGlyphAttribute
    }
    export type SymbolGlyph = typeNode.SymbolGlyphFrameNode;
    export abstract class MarqueeFrameNode extends TypedFrameNode<MarqueeAttribute> {
        constructor()
        initialize(value: MarqueeOptions): MarqueeAttribute
    }
    export type Marquee = typeNode.MarqueeFrameNode;
    export abstract class SwiperFrameNode extends TypedFrameNode<SwiperAttribute> {
        constructor()
        initialize(controller?: SwiperController): SwiperAttribute
    }
    export type Swiper = typeNode.SwiperFrameNode;
    export abstract class XComponentFrameNode extends TypedFrameNode<XComponentAttribute> {
        constructor()
        initialize(value: XComponentParameters): XComponentAttribute
        initialize(value: XComponentOptions): XComponentAttribute
        initialize(params: NativeXComponentParameters): XComponentAttribute
    }
    export type XComponent = typeNode.XComponentFrameNode;
}
