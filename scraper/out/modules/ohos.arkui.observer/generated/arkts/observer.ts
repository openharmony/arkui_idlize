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

import { extractors } from "#handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { TypeChecker, OHOS_ARKUI_OBSERVERNativeModule, UIContext_serializer } from "./ohos.arkui.observer.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default uiObserver
export namespace uiObserver {
    export class DensityInfoInternal {
        public static fromPtr(ptr: KPointer): uiObserver.DensityInfo {
            return new uiObserver.DensityInfo(ptr)
        }
    }
    export class DensityInfo implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get context(): UIContext {
            return this.getContext()
        }
        set context(context: UIContext) {
            this.setContext(context)
        }
        get density(): number {
            return this.getDensity()
        }
        set density(density: number) {
            this.setDensity(density)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, DensityInfo.getFinalizer())
        }
        constructor() {
            this(DensityInfo.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_DensityInfo_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_ARKUI_OBSERVERNativeModule._uiObserver_DensityInfo_getFinalizer()
        }
        private getContext(): UIContext {
            return this.getContext_serialize()
        }
        private setContext(context: UIContext): void {
            const context_casted = context as (UIContext)
            this.setContext_serialize(context_casted)
            return
        }
        private getDensity(): number {
            return this.getDensity_serialize()
        }
        private setDensity(density: number): void {
            const density_casted = density as (number)
            this.setDensity_serialize(density_casted)
            return
        }
        private getContext_serialize(): UIContext {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_DensityInfo_getContext(this.peer!.ptr)
            const obj : UIContext = extractors.fromUIContextPtr(retval)
            return obj
        }
        private setContext_serialize(context: UIContext): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_DensityInfo_setContext(this.peer!.ptr, extractors.toUIContextPtr(context))
        }
        private getDensity_serialize(): number {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_DensityInfo_getDensity(this.peer!.ptr)
            return retval
        }
        private setDensity_serialize(density: number): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_DensityInfo_setDensity(this.peer!.ptr, density)
        }
    }
    export class RouterPageInfoInternal {
        public static fromPtr(ptr: KPointer): uiObserver.RouterPageInfo {
            return new uiObserver.RouterPageInfo(ptr)
        }
    }
    export class RouterPageInfo implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get context(): object | UIContext {
            return this.getContext()
        }
        set context(context: object | UIContext) {
            this.setContext(context)
        }
        get index(): number {
            return this.getIndex()
        }
        set index(index: number) {
            this.setIndex(index)
        }
        get name(): string {
            return this.getName()
        }
        set name(name: string) {
            this.setName(name)
        }
        get path(): string {
            return this.getPath()
        }
        set path(path: string) {
            this.setPath(path)
        }
        get state(): RouterPageState {
            return this.getState()
        }
        set state(state: RouterPageState) {
            this.setState(state)
        }
        get pageId(): string {
            return this.getPageId()
        }
        set pageId(pageId: string) {
            this.setPageId(pageId)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, RouterPageInfo.getFinalizer())
        }
        constructor() {
            this(RouterPageInfo.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getFinalizer()
        }
        private getContext(): object | UIContext {
            return this.getContext_serialize()
        }
        private setContext(context: object | UIContext): void {
            const context_casted = context as (object | UIContext)
            this.setContext_serialize(context_casted)
            return
        }
        private getIndex(): number {
            return this.getIndex_serialize()
        }
        private setIndex(index: number): void {
            const index_casted = index as (number)
            this.setIndex_serialize(index_casted)
            return
        }
        private getName(): string {
            return this.getName_serialize()
        }
        private setName(name: string): void {
            const name_casted = name as (string)
            this.setName_serialize(name_casted)
            return
        }
        private getPath(): string {
            return this.getPath_serialize()
        }
        private setPath(path: string): void {
            const path_casted = path as (string)
            this.setPath_serialize(path_casted)
            return
        }
        private getState(): RouterPageState {
            return this.getState_serialize()
        }
        private setState(state: RouterPageState): void {
            const state_casted = state as (RouterPageState)
            this.setState_serialize(state_casted)
            return
        }
        private getPageId(): string {
            return this.getPageId_serialize()
        }
        private setPageId(pageId: string): void {
            const pageId_casted = pageId as (string)
            this.setPageId_serialize(pageId_casted)
            return
        }
        private getContext_serialize(): object | UIContext {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getContext(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferUnionSelector : int32 = retvalDeserializer.readInt8()
            let buffer : object | UIContext | undefined
            if (bufferUnionSelector == (0).toChar()) {
                buffer = (retvalDeserializer.readCustomObject('object') as object)
            } else if (bufferUnionSelector == (1).toChar()) {
                buffer = (UIContext_serializer.read(retvalDeserializer) as UIContext)
            } else {
                throw new Error("One of the branches for buffer has to be chosen through deserialisation.")
            }
            const returnResult : object | UIContext = (buffer as object | UIContext)
            return returnResult
        }
        private setContext_serialize(context: object | UIContext): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (context instanceof object) {
                thisSerializer.writeInt8((0).toChar())
                const contextForIdx0  = context as object
                thisSerializer.writeCustomObject('object', contextForIdx0)
            } else if (context instanceof UIContext) {
                thisSerializer.writeInt8((1).toChar())
                const contextForIdx1  = context as UIContext
                UIContext_serializer.write(thisSerializer, contextForIdx1)
            }
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_setContext(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        private getIndex_serialize(): number {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getIndex(this.peer!.ptr)
            return retval
        }
        private setIndex_serialize(index: number): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_setIndex(this.peer!.ptr, index)
        }
        private getName_serialize(): string {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getName(this.peer!.ptr)
            return retval
        }
        private setName_serialize(name: string): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_setName(this.peer!.ptr, name)
        }
        private getPath_serialize(): string {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getPath(this.peer!.ptr)
            return retval
        }
        private setPath_serialize(path: string): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_setPath(this.peer!.ptr, path)
        }
        private getState_serialize(): RouterPageState {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getState(this.peer!.ptr)
            return TypeChecker.uiObserver_RouterPageState_FromNumeric(retval)
        }
        private setState_serialize(state: RouterPageState): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_setState(this.peer!.ptr, TypeChecker.uiObserver_RouterPageState_ToNumeric(state))
        }
        private getPageId_serialize(): string {
            const retval  = OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_getPageId(this.peer!.ptr)
            return retval
        }
        private setPageId_serialize(pageId: string): void {
            OHOS_ARKUI_OBSERVERNativeModule._uiObserver_RouterPageInfo_setPageId(this.peer!.ptr, pageId)
        }
    }
    export enum NavDestinationState {
        ON_SHOWN = 0,
        ON_HIDDEN = 1,
        ON_APPEAR = 2,
        ON_DISAPPEAR = 3,
        ON_WILL_SHOW = 4,
        ON_WILL_HIDE = 5,
        ON_WILL_APPEAR = 6,
        ON_WILL_DISAPPEAR = 7,
        ON_BACKPRESS = 100
    }
    export enum RouterPageState {
        ABOUT_TO_APPEAR = 0,
        ABOUT_TO_DISAPPEAR = 1,
        ON_PAGE_SHOW = 2,
        ON_PAGE_HIDE = 3,
        ON_BACK_PRESS = 4
    }
    export enum ScrollEventType {
        SCROLL_START = 0,
        SCROLL_STOP = 1
    }
    export enum TabContentState {
        ON_SHOW = 0,
        ON_HIDE = 1
    }
    export interface NavDestinationInfo {
        navigationId: object;
        name: object;
        state: uiObserver.NavDestinationState;
        index: number;
        param?: Object;
        navDestinationId: string;
        uniqueId?: number;
        mode?: object;
    }
    export interface NavigationInfo {
        navigationId: string;
        pathStack: object;
    }
    export interface ScrollEventInfo {
        id: string;
        uniqueId: number;
        scrollEvent: uiObserver.ScrollEventType;
        offset: number;
    }
    export interface TabContentInfo {
        tabContentId: string;
        tabContentUniqueId: number;
        state: uiObserver.TabContentState;
        index: number;
        id: string;
        uniqueId: number;
    }
    export interface ObserverOptions {
        id: string;
    }
    export interface NavDestinationSwitchInfo {
        context: object | UIContext;
        from: uiObserver.NavDestinationInfo | object;
        to: uiObserver.NavDestinationInfo | object;
        operation: object;
    }
    export interface NavDestinationSwitchObserverOptions {
        navigationId: object;
    }
}
