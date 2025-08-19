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

import { RenderNode_serializer, RenderNode, RenderNodeInternal } from "./RenderNode"
import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { Vector2_serializer, Size_serializer, Edges_serializer, SizeT_serializer, Vector2, Size, Edges, SizeT } from "./Graphics"
import { UIGestureEvent_serializer, UIGestureEvent, extractors } from "#handwritten"
import { CommonMethod_serializer, UICommonEvent, UICommonEventInternal, CommonMethod, CustomProperty } from "./component/common"
import { UIContext } from "@ohos.arkui.UIContext"
import { ComponentContent, ComponentContentInternal } from "./ComponentContent"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { GlobalScope } from "./framework/GlobalScope"
import { BlankAttribute } from "./component/blank"
import { ColumnOptions_serializer, ColumnOptionsV2_serializer, ColumnAttribute, ColumnOptions, ColumnOptionsV2 } from "./component/column"
import { DividerAttribute } from "./component/divider"
import { FlexOptions_serializer, FlexAttribute, FlexOptions } from "./component/flex"
import { FlowItemAttribute } from "./component/flowItem"
import { GridColOptions_serializer, GridColAttribute, GridColOptions } from "./component/gridCol"
import { Scroller_serializer, Scroller, ScrollerInternal, ScrollAttribute } from "./component/scroll"
import { GridLayoutOptions_serializer, GridAttribute, GridLayoutOptions } from "./component/grid"
import { GridItemOptions_serializer, GridItemAttribute, GridItemOptions } from "./component/gridItem"
import { GridRowOptions_serializer, GridRowAttribute, GridRowOptions } from "./component/gridRow"
import { ListOptions_serializer, ListAttribute, ListOptions } from "./component/list"
import { ListItemOptions_serializer, ListItemAttribute, ListItemOptions } from "./component/listItem"
import { ListItemGroupOptions_serializer, ListItemGroupAttribute, ListItemGroupOptions } from "./component/listItemGroup"
import { MarqueeOptions_serializer, MarqueeAttribute, MarqueeOptions } from "./component/marquee"
import { RelativeContainerAttribute } from "./component/relativeContainer"
import { RowOptions_serializer, RowOptionsV2_serializer, RowAttribute, RowOptions, RowOptionsV2 } from "./component/row"
import { SearchOptions_serializer, SearchAttribute, SearchOptions } from "./component/search"
import { StackOptions_serializer, StackAttribute, StackOptions } from "./component/stack"
import { SwiperController_serializer, SwiperAttribute, SwiperController, SwiperControllerInternal } from "./component/swiper"
import { Resource_serializer } from "./framework/resource"
import { SymbolGlyphAttribute } from "./component/symbolglyph"
import { Resource } from "@global.resource"
import { TextAreaOptions_serializer, TextAreaAttribute, TextAreaOptions } from "./component/textArea"
import { TextOptions_serializer, TextAttribute, TextOptions } from "./component/text"
import { TextInputOptions_serializer, TextInputAttribute, TextInputOptions } from "./component/textInput"
import { WaterFlowOptions_serializer, WaterFlowAttribute, WaterFlowOptions } from "./component/waterFlow"
import { XComponentParameters_serializer, XComponentOptions_serializer, NativeXComponentParameters_serializer, XComponentAttribute, XComponentParameters, XComponentOptions, NativeXComponentParameters } from "./component/xcomponent"
export class FrameNodeInternal {
    public static fromPtr(ptr: KPointer): FrameNode {
        return new FrameNode(false, ptr)
    }
}
export class FrameNode implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get commonEvent(): UICommonEvent {
        return this.getCommonEvent()
    }
    set commonEvent(commonEvent: UICommonEvent) {
        this.setCommonEvent(commonEvent)
    }
    get gestureEvent(): UIGestureEvent {
        return this.getGestureEvent()
    }
    set gestureEvent(gestureEvent: UIGestureEvent) {
        this.setGestureEvent(gestureEvent)
    }
    get commonAttribute(): CommonMethod {
        return this.getCommonAttribute()
    }
    set commonAttribute(commonAttribute: CommonMethod) {
        this.setCommonAttribute(commonAttribute)
    }
    constructor(_0: boolean, peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, FrameNode.getFinalizer())
    }
    constructor(uiContext: UIContext) {
        this(false, FrameNode.construct(uiContext))
    }
    static construct(uiContext: UIContext): KPointer {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_construct(extractors.toUIContextPtr(uiContext))
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._FrameNode_getFinalizer()
    }
    public getRenderNode(): RenderNode | undefined {
        return this.getRenderNode_serialize()
    }
    public isModifiable(): boolean {
        return this.isModifiable_serialize()
    }
    public appendChild(node: FrameNode): void {
        const node_casted = node as (FrameNode)
        this.appendChild_serialize(node_casted)
        return
    }
    public insertChildAfter(child: FrameNode, sibling: FrameNode | undefined): void {
        const child_casted = child as (FrameNode)
        const sibling_casted = sibling as (FrameNode | undefined)
        this.insertChildAfter_serialize(child_casted, sibling_casted)
        return
    }
    public removeChild(node: FrameNode): void {
        const node_casted = node as (FrameNode)
        this.removeChild_serialize(node_casted)
        return
    }
    public clearChildren(): void {
        this.clearChildren_serialize()
        return
    }
    public getChild(index: number, expandMode?: ExpandMode): FrameNode | undefined {
        const index_casted = index as (number)
        const expandMode_casted = expandMode as (ExpandMode | undefined)
        return this.getChild_serialize(index_casted, expandMode_casted)
    }
    public getFirstChildIndexWithoutExpand(): number {
        return this.getFirstChildIndexWithoutExpand_serialize()
    }
    public getLastChildIndexWithoutExpand(): number {
        return this.getLastChildIndexWithoutExpand_serialize()
    }
    public getFirstChild(): FrameNode | undefined {
        return this.getFirstChild_serialize()
    }
    public getNextSibling(): FrameNode | undefined {
        return this.getNextSibling_serialize()
    }
    public getPreviousSibling(): FrameNode | undefined {
        return this.getPreviousSibling_serialize()
    }
    public getParent(): FrameNode | undefined {
        return this.getParent_serialize()
    }
    public getChildrenCount(): number {
        return this.getChildrenCount_serialize()
    }
    public moveTo(targetParent: FrameNode, index?: number): void {
        const targetParent_casted = targetParent as (FrameNode)
        const index_casted = index as (number | undefined)
        this.moveTo_serialize(targetParent_casted, index_casted)
        return
    }
    public dispose(): void {
        this.dispose_serialize()
        return
    }
    public getPositionToWindow(): Vector2 {
        return this.getPositionToWindow_serialize()
    }
    public isDisposed(): boolean {
        return this.isDisposed_serialize()
    }
    public getPositionToParent(): Vector2 {
        return this.getPositionToParent_serialize()
    }
    public getMeasuredSize(): Size {
        return this.getMeasuredSize_serialize()
    }
    public getLayoutPosition(): Vector2 {
        return this.getLayoutPosition_serialize()
    }
    public getUserConfigBorderWidth(): Edges {
        return this.getUserConfigBorderWidth_serialize()
    }
    public getUserConfigPadding(): Edges {
        return this.getUserConfigPadding_serialize()
    }
    public getUserConfigMargin(): Edges {
        return this.getUserConfigMargin_serialize()
    }
    public getUserConfigSize(): SizeT {
        return this.getUserConfigSize_serialize()
    }
    public getId(): string {
        return this.getId_serialize()
    }
    public getUniqueId(): number {
        return this.getUniqueId_serialize()
    }
    public getNodeType(): string {
        return this.getNodeType_serialize()
    }
    public getOpacity(): number {
        return this.getOpacity_serialize()
    }
    public isVisible(): boolean {
        return this.isVisible_serialize()
    }
    public isClipToFrame(): boolean {
        return this.isClipToFrame_serialize()
    }
    public isAttached(): boolean {
        return this.isAttached_serialize()
    }
    public getInspectorInfo(): Object {
        return this.getInspectorInfo_serialize()
    }
    public getCustomProperty(name: string): CustomProperty {
        const name_casted = name as (string)
        return this.getCustomProperty_serialize(name_casted)
    }
    public onMeasure(constraint: LayoutConstraint): void {
        const constraint_casted = constraint as (LayoutConstraint)
        this.onMeasure_serialize(constraint_casted)
        return
    }
    public onLayout(position: Vector2): void {
        const position_casted = position as (Vector2)
        this.onLayout_serialize(position_casted)
        return
    }
    public setMeasuredSize(size: Size): void {
        const size_casted = size as (Size)
        this.setMeasuredSize_serialize(size_casted)
        return
    }
    public setLayoutPosition(position: Vector2): void {
        const position_casted = position as (Vector2)
        this.setLayoutPosition_serialize(position_casted)
        return
    }
    public measure(constraint: LayoutConstraint): void {
        const constraint_casted = constraint as (LayoutConstraint)
        this.measure_serialize(constraint_casted)
        return
    }
    public layout(position: Vector2): void {
        const position_casted = position as (Vector2)
        this.layout_serialize(position_casted)
        return
    }
    public setNeedsLayout(): void {
        this.setNeedsLayout_serialize()
        return
    }
    public invalidate(): void {
        this.invalidate_serialize()
        return
    }
    public getPositionToScreen(): Vector2 {
        return this.getPositionToScreen_serialize()
    }
    public getGlobalPositionOnDisplay(): Vector2 {
        return this.getGlobalPositionOnDisplay_serialize()
    }
    public getPositionToWindowWithTransform(): Vector2 {
        return this.getPositionToWindowWithTransform_serialize()
    }
    public getPositionToParentWithTransform(): Vector2 {
        return this.getPositionToParentWithTransform_serialize()
    }
    public getPositionToScreenWithTransform(): Vector2 {
        return this.getPositionToScreenWithTransform_serialize()
    }
    public disposeTree(): void {
        this.disposeTree_serialize()
        return
    }
    public addComponentContent<T>(content: ComponentContent<T>): void {
        const content_casted = content as (ComponentContent<T>)
        this.addComponentContent_serialize(content_casted)
        return
    }
    public setCrossLanguageOptions(value: CrossLanguageOptions): void {
        const value_casted = value as (CrossLanguageOptions)
        this.setCrossLanguageOptions_serialize(value_casted)
        return
    }
    public getCrossLanguageOptions(): CrossLanguageOptions {
        return this.getCrossLanguageOptions_serialize()
    }
    public recycle(): void {
        this.recycle_serialize()
        return
    }
    public reuse(): void {
        this.reuse_serialize()
        return
    }
    public isTransferred(): boolean {
        return this.isTransferred_serialize()
    }
    private getCommonEvent(): UICommonEvent {
        return this.getCommonEvent_serialize()
    }
    private setCommonEvent(commonEvent: UICommonEvent): void {
        const commonEvent_casted = commonEvent as (UICommonEvent)
        this.setCommonEvent_serialize(commonEvent_casted)
        return
    }
    private getGestureEvent(): UIGestureEvent {
        return this.getGestureEvent_serialize()
    }
    private setGestureEvent(gestureEvent: UIGestureEvent): void {
        const gestureEvent_casted = gestureEvent as (UIGestureEvent)
        this.setGestureEvent_serialize(gestureEvent_casted)
        return
    }
    private getCommonAttribute(): CommonMethod {
        return this.getCommonAttribute_serialize()
    }
    private setCommonAttribute(commonAttribute: CommonMethod): void {
        const commonAttribute_casted = commonAttribute as (CommonMethod)
        this.setCommonAttribute_serialize(commonAttribute_casted)
        return
    }
    getRenderNode_serialize(): RenderNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getRenderNode(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : RenderNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (RenderNode_serializer.read(retvalDeserializer) as RenderNode)
        }
        const returnResult : RenderNode | undefined = buffer
        return returnResult
    }
    isModifiable_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_isModifiable(this.peer!.ptr)
        return retval
    }
    appendChild_serialize(node: FrameNode): void {
        ArkUIGeneratedNativeModule._FrameNode_appendChild(this.peer!.ptr, toPeerPtr(node))
    }
    insertChildAfter_serialize(child: FrameNode, sibling: FrameNode | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (sibling !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const siblingTmpValue  = sibling!
            FrameNode_serializer.write(thisSerializer, siblingTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        ArkUIGeneratedNativeModule._FrameNode_insertChildAfter(this.peer!.ptr, toPeerPtr(child), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    removeChild_serialize(node: FrameNode): void {
        ArkUIGeneratedNativeModule._FrameNode_removeChild(this.peer!.ptr, toPeerPtr(node))
    }
    clearChildren_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_clearChildren(this.peer!.ptr)
    }
    getChild_serialize(index: number, expandMode?: ExpandMode): FrameNode | undefined {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (expandMode !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const expandModeTmpValue  = (expandMode as ExpandMode)
            thisSerializer.writeInt32(expandModeTmpValue.valueOf())
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getChild(this.peer!.ptr, index, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    getFirstChildIndexWithoutExpand_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getFirstChildIndexWithoutExpand(this.peer!.ptr)
        return retval
    }
    getLastChildIndexWithoutExpand_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getLastChildIndexWithoutExpand(this.peer!.ptr)
        return retval
    }
    getFirstChild_serialize(): FrameNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getFirstChild(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    getNextSibling_serialize(): FrameNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getNextSibling(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    getPreviousSibling_serialize(): FrameNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPreviousSibling(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    getParent_serialize(): FrameNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getParent(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    getChildrenCount_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getChildrenCount(this.peer!.ptr)
        return retval
    }
    moveTo_serialize(targetParent: FrameNode, index?: number): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (index !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const indexTmpValue  = index!
            thisSerializer.writeNumber(indexTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        ArkUIGeneratedNativeModule._FrameNode_moveTo(this.peer!.ptr, toPeerPtr(targetParent), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    dispose_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_dispose(this.peer!.ptr)
    }
    getPositionToWindow_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPositionToWindow(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    isDisposed_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_isDisposed(this.peer!.ptr)
        return retval
    }
    getPositionToParent_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPositionToParent(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    getMeasuredSize_serialize(): Size {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getMeasuredSize(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Size = Size_serializer.read(retvalDeserializer)
        return returnResult
    }
    getLayoutPosition_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getLayoutPosition(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    getUserConfigBorderWidth_serialize(): Edges {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getUserConfigBorderWidth(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Edges = Edges_serializer.read(retvalDeserializer)
        return returnResult
    }
    getUserConfigPadding_serialize(): Edges {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getUserConfigPadding(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Edges = Edges_serializer.read(retvalDeserializer)
        return returnResult
    }
    getUserConfigMargin_serialize(): Edges {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getUserConfigMargin(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Edges = Edges_serializer.read(retvalDeserializer)
        return returnResult
    }
    getUserConfigSize_serialize(): SizeT {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getUserConfigSize(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : SizeT = SizeT_serializer.read(retvalDeserializer)
        return returnResult
    }
    getId_serialize(): string {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getId(this.peer!.ptr)
        return retval
    }
    getUniqueId_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getUniqueId(this.peer!.ptr)
        return retval
    }
    getNodeType_serialize(): string {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getNodeType(this.peer!.ptr)
        return retval
    }
    getOpacity_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getOpacity(this.peer!.ptr)
        return retval
    }
    isVisible_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_isVisible(this.peer!.ptr)
        return retval
    }
    isClipToFrame_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_isClipToFrame(this.peer!.ptr)
        return retval
    }
    isAttached_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_isAttached(this.peer!.ptr)
        return retval
    }
    getInspectorInfo_serialize(): Object {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getInspectorInfo(this.peer!.ptr)
        return retval
    }
    getCustomProperty_serialize(name: string): CustomProperty {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getCustomProperty(this.peer!.ptr, name)
        throw new Error("Object deserialization is not implemented.")
    }
    onMeasure_serialize(constraint: LayoutConstraint): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        LayoutConstraint_serializer.write(thisSerializer, constraint)
        ArkUIGeneratedNativeModule._FrameNode_onMeasure(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onLayout_serialize(position: Vector2): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Vector2_serializer.write(thisSerializer, position)
        ArkUIGeneratedNativeModule._FrameNode_onLayout(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setMeasuredSize_serialize(size: Size): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Size_serializer.write(thisSerializer, size)
        ArkUIGeneratedNativeModule._FrameNode_setMeasuredSize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setLayoutPosition_serialize(position: Vector2): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Vector2_serializer.write(thisSerializer, position)
        ArkUIGeneratedNativeModule._FrameNode_setLayoutPosition(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    measure_serialize(constraint: LayoutConstraint): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        LayoutConstraint_serializer.write(thisSerializer, constraint)
        ArkUIGeneratedNativeModule._FrameNode_measure(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    layout_serialize(position: Vector2): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Vector2_serializer.write(thisSerializer, position)
        ArkUIGeneratedNativeModule._FrameNode_layout(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setNeedsLayout_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_setNeedsLayout(this.peer!.ptr)
    }
    invalidate_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_invalidate(this.peer!.ptr)
    }
    getPositionToScreen_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPositionToScreen(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    getGlobalPositionOnDisplay_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getGlobalPositionOnDisplay(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    getPositionToWindowWithTransform_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPositionToWindowWithTransform(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    getPositionToParentWithTransform_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPositionToParentWithTransform(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    getPositionToScreenWithTransform_serialize(): Vector2 {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getPositionToScreenWithTransform(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Vector2 = Vector2_serializer.read(retvalDeserializer)
        return returnResult
    }
    disposeTree_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_disposeTree(this.peer!.ptr)
    }
    addComponentContent_serialize<T>(content: ComponentContent<T>): void {
        ArkUIGeneratedNativeModule._FrameNode_addComponentContent(this.peer!.ptr, toPeerPtr(content))
    }
    setCrossLanguageOptions_serialize(value: CrossLanguageOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        CrossLanguageOptions_serializer.write(thisSerializer, value)
        ArkUIGeneratedNativeModule._FrameNode_setCrossLanguageOptions(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getCrossLanguageOptions_serialize(): CrossLanguageOptions {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getCrossLanguageOptions(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : CrossLanguageOptions = CrossLanguageOptions_serializer.read(retvalDeserializer)
        return returnResult
    }
    recycle_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_recycle(this.peer!.ptr)
    }
    reuse_serialize(): void {
        ArkUIGeneratedNativeModule._FrameNode_reuse(this.peer!.ptr)
    }
    isTransferred_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_isTransferred(this.peer!.ptr)
        return retval
    }
    private getCommonEvent_serialize(): UICommonEvent {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getCommonEvent(this.peer!.ptr)
        const obj : UICommonEvent = UICommonEventInternal.fromPtr(retval)
        return obj
    }
    private setCommonEvent_serialize(commonEvent: UICommonEvent): void {
        ArkUIGeneratedNativeModule._FrameNode_setCommonEvent(this.peer!.ptr, toPeerPtr(commonEvent))
    }
    private getGestureEvent_serialize(): UIGestureEvent {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getGestureEvent(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : UIGestureEvent = UIGestureEvent_serializer.read(retvalDeserializer)
        return returnResult
    }
    private setGestureEvent_serialize(gestureEvent: UIGestureEvent): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        UIGestureEvent_serializer.write(thisSerializer, gestureEvent)
        ArkUIGeneratedNativeModule._FrameNode_setGestureEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getCommonAttribute_serialize(): CommonMethod {
        const retval  = ArkUIGeneratedNativeModule._FrameNode_getCommonAttribute(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setCommonAttribute_serialize(commonAttribute: CommonMethod): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        CommonMethod_serializer.write(thisSerializer, commonAttribute)
        ArkUIGeneratedNativeModule._FrameNode_setCommonAttribute(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export class NodeAdapterInternal {
    public static fromPtr(ptr: KPointer): NodeAdapter {
        return new NodeAdapter(ptr)
    }
}
export class NodeAdapter implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get totalNodeCount(): number {
        return this.getTotalNodeCount()
    }
    set totalNodeCount(totalNodeCount: number) {
        this.setTotalNodeCount(totalNodeCount)
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, NodeAdapter.getFinalizer())
    }
    constructor() {
        this(NodeAdapter.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._NodeAdapter_getFinalizer()
    }
    static attachNodeAdapter_serialize(adapter: NodeAdapter, node: FrameNode): boolean {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_attachNodeAdapter(toPeerPtr(adapter), toPeerPtr(node))
        return retval
    }
    static detachNodeAdapter_serialize(node: FrameNode): void {
        ArkUIGeneratedNativeModule._NodeAdapter_detachNodeAdapter(toPeerPtr(node))
    }
    public dispose(): void {
        this.dispose_serialize()
        return
    }
    public isDisposed(): boolean {
        return this.isDisposed_serialize()
    }
    public reloadAllItems(): void {
        this.reloadAllItems_serialize()
        return
    }
    public reloadItem(start: number, count: number): void {
        const start_casted = start as (number)
        const count_casted = count as (number)
        this.reloadItem_serialize(start_casted, count_casted)
        return
    }
    public removeItem(start: number, count: number): void {
        const start_casted = start as (number)
        const count_casted = count as (number)
        this.removeItem_serialize(start_casted, count_casted)
        return
    }
    public insertItem(start: number, count: number): void {
        const start_casted = start as (number)
        const count_casted = count as (number)
        this.insertItem_serialize(start_casted, count_casted)
        return
    }
    public moveItem(from: number, to: number): void {
        const from_casted = from as (number)
        const to_casted = to as (number)
        this.moveItem_serialize(from_casted, to_casted)
        return
    }
    public getAllAvailableItems(): Array<FrameNode> {
        return this.getAllAvailableItems_serialize()
    }
    public onAttachToNode(target: FrameNode): void {
        const target_casted = target as (FrameNode)
        this.onAttachToNode_serialize(target_casted)
        return
    }
    public onDetachFromNode(): void {
        this.onDetachFromNode_serialize()
        return
    }
    public onGetChildId(index: number): number {
        const index_casted = index as (number)
        return this.onGetChildId_serialize(index_casted)
    }
    public onCreateChild(index: number): FrameNode {
        const index_casted = index as (number)
        return this.onCreateChild_serialize(index_casted)
    }
    public onDisposeChild(id: number, node: FrameNode): void {
        const id_casted = id as (number)
        const node_casted = node as (FrameNode)
        this.onDisposeChild_serialize(id_casted, node_casted)
        return
    }
    public onUpdateChild(id: number, node: FrameNode): void {
        const id_casted = id as (number)
        const node_casted = node as (FrameNode)
        this.onUpdateChild_serialize(id_casted, node_casted)
        return
    }
    public static attachNodeAdapter(adapter: NodeAdapter, node: FrameNode): boolean {
        const adapter_casted = adapter as (NodeAdapter)
        const node_casted = node as (FrameNode)
        return NodeAdapter.attachNodeAdapter_serialize(adapter_casted, node_casted)
    }
    public static detachNodeAdapter(node: FrameNode): void {
        const node_casted = node as (FrameNode)
        NodeAdapter.detachNodeAdapter_serialize(node_casted)
        return
    }
    private getTotalNodeCount(): number {
        return this.getTotalNodeCount_serialize()
    }
    private setTotalNodeCount(totalNodeCount: number): void {
        const totalNodeCount_casted = totalNodeCount as (number)
        this.setTotalNodeCount_serialize(totalNodeCount_casted)
        return
    }
    dispose_serialize(): void {
        ArkUIGeneratedNativeModule._NodeAdapter_dispose(this.peer!.ptr)
    }
    isDisposed_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_isDisposed(this.peer!.ptr)
        return retval
    }
    reloadAllItems_serialize(): void {
        ArkUIGeneratedNativeModule._NodeAdapter_reloadAllItems(this.peer!.ptr)
    }
    reloadItem_serialize(start: number, count: number): void {
        ArkUIGeneratedNativeModule._NodeAdapter_reloadItem(this.peer!.ptr, start, count)
    }
    removeItem_serialize(start: number, count: number): void {
        ArkUIGeneratedNativeModule._NodeAdapter_removeItem(this.peer!.ptr, start, count)
    }
    insertItem_serialize(start: number, count: number): void {
        ArkUIGeneratedNativeModule._NodeAdapter_insertItem(this.peer!.ptr, start, count)
    }
    moveItem_serialize(from: number, to: number): void {
        ArkUIGeneratedNativeModule._NodeAdapter_moveItem(this.peer!.ptr, from, to)
    }
    getAllAvailableItems_serialize(): Array<FrameNode> {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_getAllAvailableItems(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const bufferLength : int32 = retvalDeserializer.readInt32()
        let buffer : Array<FrameNode> = new Array<FrameNode>(bufferLength)
        for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
            buffer[bufferBufCounterI] = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : Array<FrameNode> = buffer
        return returnResult
    }
    onAttachToNode_serialize(target: FrameNode): void {
        ArkUIGeneratedNativeModule._NodeAdapter_onAttachToNode(this.peer!.ptr, toPeerPtr(target))
    }
    onDetachFromNode_serialize(): void {
        ArkUIGeneratedNativeModule._NodeAdapter_onDetachFromNode(this.peer!.ptr)
    }
    onGetChildId_serialize(index: number): number {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_onGetChildId(this.peer!.ptr, index)
        return retval
    }
    onCreateChild_serialize(index: number): FrameNode {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_onCreateChild(this.peer!.ptr, index)
        const obj : FrameNode = FrameNodeInternal.fromPtr(retval)
        return obj
    }
    onDisposeChild_serialize(id: number, node: FrameNode): void {
        ArkUIGeneratedNativeModule._NodeAdapter_onDisposeChild(this.peer!.ptr, id, toPeerPtr(node))
    }
    onUpdateChild_serialize(id: number, node: FrameNode): void {
        ArkUIGeneratedNativeModule._NodeAdapter_onUpdateChild(this.peer!.ptr, id, toPeerPtr(node))
    }
    private getTotalNodeCount_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._NodeAdapter_getTotalNodeCount(this.peer!.ptr)
        return retval
    }
    private setTotalNodeCount_serialize(totalNodeCount: number): void {
        ArkUIGeneratedNativeModule._NodeAdapter_setTotalNodeCount(this.peer!.ptr, totalNodeCount)
    }
}
export interface LayoutConstraint {
    maxSize: Size;
    minSize: Size;
    percentReference: Size;
}
export interface CrossLanguageOptions {
    attributeSetting?: boolean;
}
export enum ExpandMode {
    NOT_EXPAND = 0,
    EXPAND = 1,
    LAZY_EXPAND = 2
}
export class CrossLanguageOptions_serializer {
    public static write(buffer: SerializerBase, value: CrossLanguageOptions): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForAttributeSetting  = value.attributeSetting
        if (valueHolderForAttributeSetting !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForAttributeSettingTmpValue  = valueHolderForAttributeSetting!
            valueSerializer.writeBoolean(valueHolderForAttributeSettingTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): CrossLanguageOptions {
        let valueDeserializer : DeserializerBase = buffer
        const attributeSettingTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let attributeSettingTmpBuf : boolean | undefined
        if ((attributeSettingTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            attributeSettingTmpBuf = valueDeserializer.readBoolean()
        }
        const attributeSettingTmpResult : boolean | undefined = attributeSettingTmpBuf
        let value : CrossLanguageOptions = ({attributeSetting: attributeSettingTmpResult} as CrossLanguageOptions)
        return value
    }
}
export class FrameNode_serializer {
    public static write(buffer: SerializerBase, value: FrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): FrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return FrameNodeInternal.fromPtr(ptr)
    }
}
export class LayoutConstraint_serializer {
    public static write(buffer: SerializerBase, value: LayoutConstraint): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForMaxSize  = value.maxSize
        Size_serializer.write(valueSerializer, valueHolderForMaxSize)
        const valueHolderForMinSize  = value.minSize
        Size_serializer.write(valueSerializer, valueHolderForMinSize)
        const valueHolderForPercentReference  = value.percentReference
        Size_serializer.write(valueSerializer, valueHolderForPercentReference)
    }
    public static read(buffer: DeserializerBase): LayoutConstraint {
        let valueDeserializer : DeserializerBase = buffer
        const maxSizeTmpResult : Size = Size_serializer.read(valueDeserializer)
        const minSizeTmpResult : Size = Size_serializer.read(valueDeserializer)
        const percentReferenceTmpResult : Size = Size_serializer.read(valueDeserializer)
        let value : LayoutConstraint = ({maxSize: maxSizeTmpResult, minSize: minSizeTmpResult, percentReference: percentReferenceTmpResult} as LayoutConstraint)
        return value
    }
}
export class NodeAdapter_serializer {
    public static write(buffer: SerializerBase, value: NodeAdapter): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): NodeAdapter {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return NodeAdapterInternal.fromPtr(ptr)
    }
}
export class typeNode_BlankFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.BlankFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.BlankFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.BlankFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_ColumnFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.ColumnFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.ColumnFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.ColumnFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_DividerFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.DividerFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.DividerFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.DividerFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_FlexFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.FlexFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.FlexFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.FlexFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_FlowItemFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.FlowItemFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.FlowItemFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.FlowItemFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_GridColFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.GridColFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.GridColFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.GridColFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_GridFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.GridFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.GridFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.GridFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_GridItemFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.GridItemFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.GridItemFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.GridItemFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_GridRowFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.GridRowFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.GridRowFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.GridRowFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_ListFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.ListFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.ListFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.ListFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_ListItemFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.ListItemFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.ListItemFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.ListItemFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_ListItemGroupFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.ListItemGroupFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.ListItemGroupFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.ListItemGroupFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_MarqueeFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.MarqueeFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.MarqueeFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.MarqueeFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_RelativeContainerFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.RelativeContainerFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.RelativeContainerFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.RelativeContainerFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_RowFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.RowFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.RowFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.RowFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_ScrollFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.ScrollFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.ScrollFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.ScrollFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_SearchFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.SearchFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.SearchFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.SearchFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_StackFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.StackFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.StackFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.StackFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_SwiperFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.SwiperFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.SwiperFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.SwiperFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_SymbolGlyphFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.SymbolGlyphFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.SymbolGlyphFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.SymbolGlyphFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_TextAreaFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.TextAreaFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.TextAreaFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.TextAreaFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_TextFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.TextFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.TextFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.TextFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_TextInputFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.TextInputFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.TextInputFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.TextInputFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_WaterFlowFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.WaterFlowFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.WaterFlowFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.WaterFlowFrameNodeInternal.fromPtr(ptr)
    }
}
export class typeNode_XComponentFrameNode_serializer {
    public static write(buffer: SerializerBase, value: typeNode.XComponentFrameNode): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): typeNode.XComponentFrameNode {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return typeNode.XComponentFrameNodeInternal.fromPtr(ptr)
    }
}
export class TypedFrameNodeInternal {
    public static fromPtr<T>(ptr: KPointer): TypedFrameNode<T> {
        return new TypedFrameNode<T>(ptr)
    }
}
export class TypedFrameNode<T> extends FrameNode implements MaterializedBase {
    get attribute_(): T {
        return this.getAttribute_()
    }
    set attribute_(attribute_: T) {
        this.setAttribute_(attribute_)
    }
    constructor(peerPtr: KPointer) {
        super(false, peerPtr)
    }
    constructor() {
        this(TypedFrameNode.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._TypedFrameNode_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._TypedFrameNode_getFinalizer()
    }
    private getAttribute_(): T {
        return this.getAttribute__serialize()
    }
    private setAttribute_(attribute_: T): void {
        const attribute__casted = attribute_ as (T)
        this.setAttribute__serialize(attribute__casted)
        return
    }
    private getAttribute__serialize(): T {
        const retval  = ArkUIGeneratedNativeModule._TypedFrameNode_getAttribute_(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setAttribute__serialize(attribute_: T): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('T', (attribute_ as Object))
        ArkUIGeneratedNativeModule._TypedFrameNode_setAttribute_(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export namespace typeNode {
    export type Column = typeNode.ColumnFrameNode;
    export type Row = typeNode.RowFrameNode;
    export type Stack = typeNode.StackFrameNode;
    export type GridRow = typeNode.GridRowFrameNode;
    export type GridCol = typeNode.GridColFrameNode;
    export type Flex = typeNode.FlexFrameNode;
    export type RelativeContainer = typeNode.RelativeContainerFrameNode;
    export type Divider = typeNode.DividerFrameNode;
    export type Blank = typeNode.BlankFrameNode;
    export type List = typeNode.ListFrameNode;
    export type ListItem = typeNode.ListItemFrameNode;
    export type ListItemGroup = typeNode.ListItemGroupFrameNode;
    export type Scroll = typeNode.ScrollFrameNode;
    export type Grid = typeNode.GridFrameNode;
    export type GridItem = typeNode.GridItemFrameNode;
    export type WaterFlow = typeNode.WaterFlowFrameNode;
    export type FlowItem = typeNode.FlowItemFrameNode;
    export type Text = typeNode.TextFrameNode;
    export type Search = typeNode.SearchFrameNode;
    export type TextInput = typeNode.TextInputFrameNode;
    export type TextArea = typeNode.TextAreaFrameNode;
    export type SymbolGlyph = typeNode.SymbolGlyphFrameNode;
    export type Marquee = typeNode.MarqueeFrameNode;
    export type Swiper = typeNode.SwiperFrameNode;
    export type XComponent = typeNode.XComponentFrameNode;
    export function createNode(context: UIContext, nodeType: string): Column {
        return GlobalScope.typeNode_createColumnNode(context, nodeType)
    }
    export class BlankFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.BlankFrameNode {
            return new typeNode.BlankFrameNode(ptr)
        }
    }
    export class BlankFrameNode extends TypedFrameNode<arkui.component.blank.BlankAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(BlankFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_BlankFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_BlankFrameNode_getFinalizer()
        }
        public initialize(min?: number | string): BlankAttribute {
            const min_casted = min as (number | string | undefined)
            return this.initialize_serialize(min_casted)
        }
        initialize_serialize(min?: number | string): BlankAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (min !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const minTmpValue  = min!
                if (minTmpValue instanceof number) {
                    thisSerializer.writeInt8((0).toChar())
                    const minTmpValueForIdx0  = minTmpValue as number
                    thisSerializer.writeNumber(minTmpValueForIdx0)
                } else if (minTmpValue instanceof string) {
                    thisSerializer.writeInt8((1).toChar())
                    const minTmpValueForIdx1  = minTmpValue as string
                    thisSerializer.writeString(minTmpValueForIdx1)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_BlankFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class ColumnFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.ColumnFrameNode {
            return new typeNode.ColumnFrameNode(ptr)
        }
    }
    export class ColumnFrameNode extends TypedFrameNode<arkui.component.column.ColumnAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(ColumnFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_ColumnFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_ColumnFrameNode_getFinalizer()
        }
        public initialize(options?: ColumnOptions | ColumnOptionsV2): ColumnAttribute {
            const options_casted = options as (ColumnOptions | ColumnOptionsV2 | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: ColumnOptions | ColumnOptionsV2): ColumnAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                if (optionsTmpValue instanceof ColumnOptions) {
                    thisSerializer.writeInt8((0).toChar())
                    const optionsTmpValueForIdx0  = optionsTmpValue as ColumnOptions
                    ColumnOptions_serializer.write(thisSerializer, optionsTmpValueForIdx0)
                } else if (optionsTmpValue instanceof ColumnOptionsV2) {
                    thisSerializer.writeInt8((1).toChar())
                    const optionsTmpValueForIdx1  = optionsTmpValue as ColumnOptionsV2
                    ColumnOptionsV2_serializer.write(thisSerializer, optionsTmpValueForIdx1)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_ColumnFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class DividerFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.DividerFrameNode {
            return new typeNode.DividerFrameNode(ptr)
        }
    }
    export class DividerFrameNode extends TypedFrameNode<arkui.component.divider.DividerAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(DividerFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_DividerFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_DividerFrameNode_getFinalizer()
        }
        public initialize(): DividerAttribute {
            return this.initialize_serialize()
        }
        initialize_serialize(): DividerAttribute {
            const retval  = ArkUIGeneratedNativeModule._typeNode_DividerFrameNode_initialize(this.peer!.ptr)
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class FlexFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.FlexFrameNode {
            return new typeNode.FlexFrameNode(ptr)
        }
    }
    export class FlexFrameNode extends TypedFrameNode<arkui.component.flex.FlexAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(FlexFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_FlexFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_FlexFrameNode_getFinalizer()
        }
        public initialize(value?: FlexOptions): FlexAttribute {
            const value_casted = value as (FlexOptions | undefined)
            return this.initialize_serialize(value_casted)
        }
        initialize_serialize(value?: FlexOptions): FlexAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                FlexOptions_serializer.write(thisSerializer, valueTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_FlexFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class FlowItemFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.FlowItemFrameNode {
            return new typeNode.FlowItemFrameNode(ptr)
        }
    }
    export class FlowItemFrameNode extends TypedFrameNode<arkui.component.flowItem.FlowItemAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(FlowItemFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_FlowItemFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_FlowItemFrameNode_getFinalizer()
        }
        public initialize(): FlowItemAttribute {
            return this.initialize_serialize()
        }
        initialize_serialize(): FlowItemAttribute {
            const retval  = ArkUIGeneratedNativeModule._typeNode_FlowItemFrameNode_initialize(this.peer!.ptr)
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class GridColFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.GridColFrameNode {
            return new typeNode.GridColFrameNode(ptr)
        }
    }
    export class GridColFrameNode extends TypedFrameNode<arkui.component.gridCol.GridColAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(GridColFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridColFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_GridColFrameNode_getFinalizer()
        }
        public initialize(options?: GridColOptions): GridColAttribute {
            const options_casted = options as (GridColOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: GridColOptions): GridColAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                GridColOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridColFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class GridFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.GridFrameNode {
            return new typeNode.GridFrameNode(ptr)
        }
    }
    export class GridFrameNode extends TypedFrameNode<arkui.component.grid.GridAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(GridFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_GridFrameNode_getFinalizer()
        }
        public initialize(scroller?: Scroller, layoutOptions?: GridLayoutOptions): GridAttribute {
            const scroller_casted = scroller as (Scroller | undefined)
            const layoutOptions_casted = layoutOptions as (GridLayoutOptions | undefined)
            return this.initialize_serialize(scroller_casted, layoutOptions_casted)
        }
        initialize_serialize(scroller?: Scroller, layoutOptions?: GridLayoutOptions): GridAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (scroller !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const scrollerTmpValue  = scroller!
                Scroller_serializer.write(thisSerializer, scrollerTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (layoutOptions !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const layoutOptionsTmpValue  = layoutOptions!
                GridLayoutOptions_serializer.write(thisSerializer, layoutOptionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class GridItemFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.GridItemFrameNode {
            return new typeNode.GridItemFrameNode(ptr)
        }
    }
    export class GridItemFrameNode extends TypedFrameNode<arkui.component.gridItem.GridItemAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(GridItemFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridItemFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_GridItemFrameNode_getFinalizer()
        }
        public initialize(options?: GridItemOptions): GridItemAttribute {
            const options_casted = options as (GridItemOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: GridItemOptions): GridItemAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                GridItemOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridItemFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class GridRowFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.GridRowFrameNode {
            return new typeNode.GridRowFrameNode(ptr)
        }
    }
    export class GridRowFrameNode extends TypedFrameNode<arkui.component.gridRow.GridRowAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(GridRowFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridRowFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_GridRowFrameNode_getFinalizer()
        }
        public initialize(options?: GridRowOptions): GridRowAttribute {
            const options_casted = options as (GridRowOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: GridRowOptions): GridRowAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                GridRowOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_GridRowFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class ListFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.ListFrameNode {
            return new typeNode.ListFrameNode(ptr)
        }
    }
    export class ListFrameNode extends TypedFrameNode<arkui.component.list.ListAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(ListFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_ListFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_ListFrameNode_getFinalizer()
        }
        public initialize(options?: ListOptions): ListAttribute {
            const options_casted = options as (ListOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: ListOptions): ListAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                ListOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_ListFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class ListItemFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.ListItemFrameNode {
            return new typeNode.ListItemFrameNode(ptr)
        }
    }
    export class ListItemFrameNode extends TypedFrameNode<arkui.component.listItem.ListItemAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(ListItemFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_ListItemFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_ListItemFrameNode_getFinalizer()
        }
        public initialize(options?: ListItemOptions): ListItemAttribute {
            const options_casted = options as (ListItemOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: ListItemOptions): ListItemAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                ListItemOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_ListItemFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class ListItemGroupFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.ListItemGroupFrameNode {
            return new typeNode.ListItemGroupFrameNode(ptr)
        }
    }
    export class ListItemGroupFrameNode extends TypedFrameNode<arkui.component.listItemGroup.ListItemGroupAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(ListItemGroupFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_ListItemGroupFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_ListItemGroupFrameNode_getFinalizer()
        }
        public initialize(options?: ListItemGroupOptions): ListItemGroupAttribute {
            const options_casted = options as (ListItemGroupOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: ListItemGroupOptions): ListItemGroupAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                ListItemGroupOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_ListItemGroupFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class MarqueeFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.MarqueeFrameNode {
            return new typeNode.MarqueeFrameNode(ptr)
        }
    }
    export class MarqueeFrameNode extends TypedFrameNode<arkui.component.marquee.MarqueeAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(MarqueeFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_MarqueeFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_MarqueeFrameNode_getFinalizer()
        }
        public initialize(value: MarqueeOptions): MarqueeAttribute {
            const value_casted = value as (MarqueeOptions)
            return this.initialize_serialize(value_casted)
        }
        initialize_serialize(value: MarqueeOptions): MarqueeAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            MarqueeOptions_serializer.write(thisSerializer, value)
            const retval  = ArkUIGeneratedNativeModule._typeNode_MarqueeFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class RelativeContainerFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.RelativeContainerFrameNode {
            return new typeNode.RelativeContainerFrameNode(ptr)
        }
    }
    export class RelativeContainerFrameNode extends TypedFrameNode<arkui.component.relativeContainer.RelativeContainerAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(RelativeContainerFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_RelativeContainerFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_RelativeContainerFrameNode_getFinalizer()
        }
        public initialize(): RelativeContainerAttribute {
            return this.initialize_serialize()
        }
        initialize_serialize(): RelativeContainerAttribute {
            const retval  = ArkUIGeneratedNativeModule._typeNode_RelativeContainerFrameNode_initialize(this.peer!.ptr)
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class RowFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.RowFrameNode {
            return new typeNode.RowFrameNode(ptr)
        }
    }
    export class RowFrameNode extends TypedFrameNode<arkui.component.row.RowAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(RowFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_RowFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_RowFrameNode_getFinalizer()
        }
        public initialize(options?: RowOptions | RowOptionsV2): RowAttribute {
            const options_casted = options as (RowOptions | RowOptionsV2 | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: RowOptions | RowOptionsV2): RowAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                if (optionsTmpValue instanceof RowOptions) {
                    thisSerializer.writeInt8((0).toChar())
                    const optionsTmpValueForIdx0  = optionsTmpValue as RowOptions
                    RowOptions_serializer.write(thisSerializer, optionsTmpValueForIdx0)
                } else if (optionsTmpValue instanceof RowOptionsV2) {
                    thisSerializer.writeInt8((1).toChar())
                    const optionsTmpValueForIdx1  = optionsTmpValue as RowOptionsV2
                    RowOptionsV2_serializer.write(thisSerializer, optionsTmpValueForIdx1)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_RowFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class ScrollFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.ScrollFrameNode {
            return new typeNode.ScrollFrameNode(ptr)
        }
    }
    export class ScrollFrameNode extends TypedFrameNode<arkui.component.scroll.ScrollAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(ScrollFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_ScrollFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_ScrollFrameNode_getFinalizer()
        }
        public initialize(scroller?: Scroller): ScrollAttribute {
            const scroller_casted = scroller as (Scroller | undefined)
            return this.initialize_serialize(scroller_casted)
        }
        initialize_serialize(scroller?: Scroller): ScrollAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (scroller !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const scrollerTmpValue  = scroller!
                Scroller_serializer.write(thisSerializer, scrollerTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_ScrollFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class SearchFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.SearchFrameNode {
            return new typeNode.SearchFrameNode(ptr)
        }
    }
    export class SearchFrameNode extends TypedFrameNode<arkui.component.search.SearchAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(SearchFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_SearchFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_SearchFrameNode_getFinalizer()
        }
        public initialize(value?: SearchOptions): SearchAttribute {
            const value_casted = value as (SearchOptions | undefined)
            return this.initialize_serialize(value_casted)
        }
        initialize_serialize(value?: SearchOptions): SearchAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                SearchOptions_serializer.write(thisSerializer, valueTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_SearchFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class StackFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.StackFrameNode {
            return new typeNode.StackFrameNode(ptr)
        }
    }
    export class StackFrameNode extends TypedFrameNode<arkui.component.stack.StackAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(StackFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_StackFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_StackFrameNode_getFinalizer()
        }
        public initialize(options?: StackOptions): StackAttribute {
            const options_casted = options as (StackOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: StackOptions): StackAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                StackOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_StackFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class SwiperFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.SwiperFrameNode {
            return new typeNode.SwiperFrameNode(ptr)
        }
    }
    export class SwiperFrameNode extends TypedFrameNode<arkui.component.swiper.SwiperAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(SwiperFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_SwiperFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_SwiperFrameNode_getFinalizer()
        }
        public initialize(controller?: SwiperController): SwiperAttribute {
            const controller_casted = controller as (SwiperController | undefined)
            return this.initialize_serialize(controller_casted)
        }
        initialize_serialize(controller?: SwiperController): SwiperAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (controller !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const controllerTmpValue  = controller!
                SwiperController_serializer.write(thisSerializer, controllerTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_SwiperFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class SymbolGlyphFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.SymbolGlyphFrameNode {
            return new typeNode.SymbolGlyphFrameNode(ptr)
        }
    }
    export class SymbolGlyphFrameNode extends TypedFrameNode<arkui.component.symbolglyph.SymbolGlyphAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(SymbolGlyphFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_SymbolGlyphFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_SymbolGlyphFrameNode_getFinalizer()
        }
        public initialize(value?: Resource): SymbolGlyphAttribute {
            const value_casted = value as (Resource | undefined)
            return this.initialize_serialize(value_casted)
        }
        initialize_serialize(value?: Resource): SymbolGlyphAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                Resource_serializer.write(thisSerializer, valueTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_SymbolGlyphFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class TextAreaFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.TextAreaFrameNode {
            return new typeNode.TextAreaFrameNode(ptr)
        }
    }
    export class TextAreaFrameNode extends TypedFrameNode<arkui.component.textArea.TextAreaAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(TextAreaFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_TextAreaFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_TextAreaFrameNode_getFinalizer()
        }
        public initialize(value?: TextAreaOptions): TextAreaAttribute {
            const value_casted = value as (TextAreaOptions | undefined)
            return this.initialize_serialize(value_casted)
        }
        initialize_serialize(value?: TextAreaOptions): TextAreaAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                TextAreaOptions_serializer.write(thisSerializer, valueTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_TextAreaFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class TextFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.TextFrameNode {
            return new typeNode.TextFrameNode(ptr)
        }
    }
    export class TextFrameNode extends TypedFrameNode<arkui.component.text.TextAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(TextFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_TextFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_TextFrameNode_getFinalizer()
        }
        public initialize(content?: string | Resource, value?: TextOptions): TextAttribute {
            const content_casted = content as (string | Resource | undefined)
            const value_casted = value as (TextOptions | undefined)
            return this.initialize_serialize(content_casted, value_casted)
        }
        initialize_serialize(content?: string | Resource, value?: TextOptions): TextAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (content !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const contentTmpValue  = content!
                if (contentTmpValue instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const contentTmpValueForIdx0  = contentTmpValue as string
                    thisSerializer.writeString(contentTmpValueForIdx0)
                } else if (contentTmpValue instanceof Resource) {
                    thisSerializer.writeInt8((1).toChar())
                    const contentTmpValueForIdx1  = contentTmpValue as Resource
                    Resource_serializer.write(thisSerializer, contentTmpValueForIdx1)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                TextOptions_serializer.write(thisSerializer, valueTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_TextFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class TextInputFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.TextInputFrameNode {
            return new typeNode.TextInputFrameNode(ptr)
        }
    }
    export class TextInputFrameNode extends TypedFrameNode<arkui.component.textInput.TextInputAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(TextInputFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_TextInputFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_TextInputFrameNode_getFinalizer()
        }
        public initialize(value?: TextInputOptions): TextInputAttribute {
            const value_casted = value as (TextInputOptions | undefined)
            return this.initialize_serialize(value_casted)
        }
        initialize_serialize(value?: TextInputOptions): TextInputAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                TextInputOptions_serializer.write(thisSerializer, valueTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_TextInputFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class WaterFlowFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.WaterFlowFrameNode {
            return new typeNode.WaterFlowFrameNode(ptr)
        }
    }
    export class WaterFlowFrameNode extends TypedFrameNode<arkui.component.waterFlow.WaterFlowAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(WaterFlowFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_WaterFlowFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_WaterFlowFrameNode_getFinalizer()
        }
        public initialize(options?: WaterFlowOptions): WaterFlowAttribute {
            const options_casted = options as (WaterFlowOptions | undefined)
            return this.initialize_serialize(options_casted)
        }
        initialize_serialize(options?: WaterFlowOptions): WaterFlowAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                WaterFlowOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = ArkUIGeneratedNativeModule._typeNode_WaterFlowFrameNode_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export class XComponentFrameNodeInternal {
        public static fromPtr(ptr: KPointer): typeNode.XComponentFrameNode {
            return new typeNode.XComponentFrameNode(ptr)
        }
    }
    export class XComponentFrameNode extends TypedFrameNode<arkui.component.xcomponent.XComponentAttribute> implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(XComponentFrameNode.construct())
        }
        static construct(): KPointer {
            const retval  = ArkUIGeneratedNativeModule._typeNode_XComponentFrameNode_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return ArkUIGeneratedNativeModule._typeNode_XComponentFrameNode_getFinalizer()
        }
        public initialize(value: XComponentParameters): XComponentAttribute {
            const value_casted = value as (XComponentParameters)
            return this.initialize0_serialize(value_casted)
        }
        public initialize(value: XComponentOptions): XComponentAttribute {
            const value_casted = value as (XComponentOptions)
            return this.initialize1_serialize(value_casted)
        }
        public initialize(params: NativeXComponentParameters): XComponentAttribute {
            const params_casted = params as (NativeXComponentParameters)
            return this.initialize2_serialize(params_casted)
        }
        initialize0_serialize(value: XComponentParameters): XComponentAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            XComponentParameters_serializer.write(thisSerializer, value)
            const retval  = ArkUIGeneratedNativeModule._typeNode_XComponentFrameNode_initialize0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
        initialize1_serialize(value: XComponentOptions): XComponentAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            XComponentOptions_serializer.write(thisSerializer, value)
            const retval  = ArkUIGeneratedNativeModule._typeNode_XComponentFrameNode_initialize1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
        initialize2_serialize(params: NativeXComponentParameters): XComponentAttribute {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            NativeXComponentParameters_serializer.write(thisSerializer, params)
            const retval  = ArkUIGeneratedNativeModule._typeNode_XComponentFrameNode_initialize2(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            throw new Error("Object deserialization is not implemented.")
        }
    }
}
