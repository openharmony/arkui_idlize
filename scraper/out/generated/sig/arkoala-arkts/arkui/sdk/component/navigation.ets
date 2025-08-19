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
import { Resource } from "@global.resource"
import { CustomBuilder, PageMapBuilder } from "./builder"
import { TitleHeight, Color } from "./enums"
import { Length, ResourceStr, ResourceColor, Dimension, VoidCallback } from "./units"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
import { NavDestinationContext, NavDestinationMode } from "./navDestination"
import { BlurStyle, BackgroundBlurStyleOptions, BackgroundEffectOptions, CommonMethod, Bindable, LayoutSafeAreaType, LayoutSafeAreaEdge, ArkCommonMethodStyle } from "./common"
import { LengthMetrics } from "./../Graphics"
import { TextModifier } from "./../TextModifier"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
export type SystemBarStyle = window.SystemBarStyle;
export declare interface NavigationCommonTitle {
    main: string | Resource;
    sub: string | Resource;
}
export declare interface NavigationCustomTitle {
    builder: CustomBuilder;
    height: TitleHeight | Length;
}
export enum NavigationMode {
    STACK = 0,
    Stack = 0,
    SPLIT = 1,
    Split = 1,
    AUTO = 2,
    Auto = 2
}
export enum NavBarPosition {
    START = 0,
    Start = 0,
    END = 1,
    End = 1
}
export enum NavigationTitleMode {
    FREE = 0,
    Free = 0,
    FULL = 1,
    Full = 1,
    MINI = 2,
    Mini = 2
}
export declare interface NavigationMenuItem {
    value: string | Resource;
    icon?: string | Resource;
    symbolIcon?: SymbolGlyphModifier;
    isEnabled?: boolean;
    action?: (() => void);
}
export declare interface PopInfo {
    info: NavPathInfo;
    result: Object;
}
export declare class NavPathInfo {
    constructor(name: string, param: Object | undefined, onPop: ((value0: PopInfo) => void) | undefined, isEntry: boolean | undefined)
    name: string;
    param?: Object | undefined;
    onPop?: ((value0: PopInfo) => void) | undefined;
    isEntry?: boolean | undefined;
    navDestinationId?: string | undefined;
}
export enum LaunchMode {
    STANDARD = 0,
    MOVE_TO_TOP_SINGLETON = 1,
    POP_TO_SINGLETON = 2,
    NEW_INSTANCE = 3
}
export declare interface NavigationOptions {
    launchMode?: LaunchMode;
    animated?: boolean;
}
export declare class NavPathStack {
    constructor()
    pushPath(info: NavPathInfo, animated_options?: boolean | NavigationOptions): void
    pushDestination(info: NavPathInfo, animated_options?: boolean | NavigationOptions): Promise<void>
    pushPathByName(name: string, param: Object | undefined, animated?: boolean): void
    pushPathByName(name: string, param: Object, onPop: ((value0: PopInfo) => void), animated?: boolean): void
    pushDestinationByName(name: string, param: Object, animated?: boolean): Promise<void>
    pushDestinationByName(name: string, param: Object, onPop: ((value0: PopInfo) => void), animated?: boolean): Promise<void>
    replacePath(info: NavPathInfo, animated_options?: boolean | NavigationOptions): void
    replaceDestination(info: NavPathInfo, options?: NavigationOptions): Promise<void>
    replacePathByName(name: string, param: Object, animated?: boolean): void
    removeByIndexes(indexes: Array<number>): number
    removeByName(name: string): number
    removeByNavDestinationId(navDestinationId: string): boolean
    pop(animated?: boolean): NavPathInfo | undefined
    pop(result: Object, animated?: boolean): NavPathInfo | undefined
    popToName(name: string, animated?: boolean): number
    popToName(name: string, result: Object, animated?: boolean): number
    popToIndex(index: number, animated?: boolean): void
    popToIndex(index: number, result: Object, animated?: boolean): void
    moveToTop(name: string, animated?: boolean): number
    moveIndexToTop(index: number, animated?: boolean): void
    clear(animated?: boolean): void
    getAllPathName(): Array<string>
    getParamByIndex(index: number): Object | undefined
    getParamByName(name: string): Array<Object | undefined>
    getIndexByName(name: string): Array<number>
    getParent(): NavPathStack | undefined
    size(): number
    disableAnimation(value: boolean): void
    setInterception(interception: NavigationInterception): void
    getPathStack(): Array<NavPathInfo>
    setPathStack(pathStack: Array<NavPathInfo>, animated?: boolean): void
}
export type NavBar = string;
export type InterceptionShowCallback = (from: NavDestinationContext | NavBar, to: NavDestinationContext | NavBar, operation: NavigationOperation, isAnimated: boolean) => void;
export type InterceptionModeCallback = (mode: NavigationMode) => void;
export declare interface NavigationInterception {
    willShow?: InterceptionShowCallback;
    didShow?: InterceptionShowCallback;
    modeChange?: InterceptionModeCallback;
}
export enum ToolbarItemStatus {
    NORMAL = 0,
    DISABLED = 1,
    ACTIVE = 2
}
export enum NavigationOperation {
    PUSH = 1,
    POP = 2,
    REPLACE = 3
}
export declare interface ToolbarItem {
    value: ResourceStr;
    icon?: ResourceStr;
    symbolIcon?: SymbolGlyphModifier;
    action?: (() => void);
    status?: ToolbarItemStatus;
    activeIcon?: ResourceStr;
    activeSymbolIcon?: SymbolGlyphModifier;
}
export declare interface NavigationTitleOptions {
    backgroundColor?: ResourceColor;
    backgroundBlurStyle?: BlurStyle;
    backgroundBlurStyleOptions?: BackgroundBlurStyleOptions;
    backgroundEffect?: BackgroundEffectOptions;
    barStyle?: BarStyle;
    paddingStart?: LengthMetrics;
    paddingEnd?: LengthMetrics;
    mainTitleModifier?: TextModifier;
    subTitleModifier?: TextModifier;
    enableHoverMode?: boolean;
}
export enum BarStyle {
    STANDARD = 0,
    STACK = 1,
    SAFE_AREA_PADDING = 2
}
export declare interface NavigationToolbarOptions {
    backgroundColor?: ResourceColor;
    backgroundBlurStyle?: BlurStyle;
    backgroundBlurStyleOptions?: BackgroundBlurStyleOptions;
    backgroundEffect?: BackgroundEffectOptions;
    moreButtonOptions?: MoreButtonOptions;
    barStyle?: BarStyle;
    hideItemValue?: boolean;
}
export declare interface NavigationMenuOptions {
    moreButtonOptions?: MoreButtonOptions;
}
export declare interface MoreButtonOptions {
    backgroundBlurStyle?: BlurStyle;
    backgroundBlurStyleOptions?: BackgroundBlurStyleOptions;
    backgroundEffect?: BackgroundEffectOptions;
}
export interface NavigationAttribute extends CommonMethod {
    navBarWidth(value: Length | Bindable<Length> | undefined): this {
        throw new Error("Unimplemented method navBarWidth")
    }
    navBarPosition(value: NavBarPosition | undefined): this {
        throw new Error("Unimplemented method navBarPosition")
    }
    navBarWidthRange(value: [ Dimension, Dimension ] | undefined): this {
        throw new Error("Unimplemented method navBarWidthRange")
    }
    minContentWidth(value: Dimension | undefined): this {
        throw new Error("Unimplemented method minContentWidth")
    }
    mode(value: NavigationMode | undefined): this {
        throw new Error("Unimplemented method mode")
    }
    backButtonIcon(value: string | image.PixelMap | Resource | SymbolGlyphModifier | undefined): this {
        throw new Error("Unimplemented method backButtonIcon")
    }
    hideNavBar(value: boolean | undefined): this {
        throw new Error("Unimplemented method hideNavBar")
    }
    hideTitleBar(value: boolean | undefined): this {
        throw new Error("Unimplemented method hideTitleBar")
    }
    hideBackButton(value: boolean | undefined): this {
        throw new Error("Unimplemented method hideBackButton")
    }
    titleMode(value: NavigationTitleMode | undefined): this {
        throw new Error("Unimplemented method titleMode")
    }
    menus(value: Array<NavigationMenuItem> | CustomBuilder | undefined): this {
        throw new Error("Unimplemented method menus")
    }
    hideToolBar(value: boolean | undefined): this {
        throw new Error("Unimplemented method hideToolBar")
    }
    enableToolBarAdaptation(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableToolBarAdaptation")
    }
    onTitleModeChange(value: ((titleMode: NavigationTitleMode) => void) | undefined): this {
        throw new Error("Unimplemented method onTitleModeChange")
    }
    onNavBarStateChange(value: ((isVisible: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onNavBarStateChange")
    }
    onNavigationModeChange(value: ((mode: NavigationMode) => void) | undefined): this {
        throw new Error("Unimplemented method onNavigationModeChange")
    }
    navDestination(value: PageMapBuilder | undefined): this {
        throw new Error("Unimplemented method navDestination")
    }
    customNavContentTransition(value: ((from: NavContentInfo,to: NavContentInfo,operation: NavigationOperation) => NavigationAnimatedTransition | undefined) | undefined): this {
        throw new Error("Unimplemented method customNavContentTransition")
    }
    systemBarStyle(value: window.SystemBarStyle | undefined): this {
        throw new Error("Unimplemented method systemBarStyle")
    }
    recoverable(value: boolean | undefined): this {
        throw new Error("Unimplemented method recoverable")
    }
    enableDragBar(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableDragBar")
    }
    enableModeChangeAnimation(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableModeChangeAnimation")
    }
    backButtonIcon(icon: string | image.PixelMap | Resource | SymbolGlyphModifier | undefined, accessibilityText?: ResourceStr): this {
        throw new Error("Unimplemented method backButtonIcon")
    }
    title(value: ResourceStr | CustomBuilder | NavigationCommonTitle | NavigationCustomTitle | undefined, options?: NavigationTitleOptions): this {
        throw new Error("Unimplemented method title")
    }
    hideTitleBar(hide: boolean | undefined, animated: boolean | undefined): this {
        throw new Error("Unimplemented method hideTitleBar")
    }
    menus(items: Array<NavigationMenuItem> | CustomBuilder | undefined, options?: NavigationMenuOptions): this {
        throw new Error("Unimplemented method menus")
    }
    toolbarConfiguration(value: Array<ToolbarItem> | CustomBuilder | undefined, options?: NavigationToolbarOptions): this {
        throw new Error("Unimplemented method toolbarConfiguration")
    }
    hideToolBar(hide: boolean | undefined, animated: boolean | undefined): this {
        throw new Error("Unimplemented method hideToolBar")
    }
    ignoreLayoutSafeArea(types?: Array<LayoutSafeAreaType>, edges?: Array<LayoutSafeAreaEdge>): this {
        throw new Error("Unimplemented method ignoreLayoutSafeArea")
    }
    attributeModifier(value: AttributeModifier<NavigationAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkNavigationStyle extends ArkCommonMethodStyle implements NavigationAttribute {
    navBarWidth_value?: Length | Bindable<Length> | undefined
    navBarPosition_value?: NavBarPosition | undefined
    navBarWidthRange_value?: [ Dimension, Dimension ] | undefined
    minContentWidth_value?: Dimension | undefined
    mode_value?: NavigationMode | undefined
    backButtonIcon_value?: string | image.PixelMap | Resource | SymbolGlyphModifier | undefined
    hideNavBar_value?: boolean | undefined
    hideTitleBar_value?: boolean | undefined
    hideBackButton_value?: boolean | undefined
    titleMode_value?: NavigationTitleMode | undefined
    menus_value?: Array<NavigationMenuItem> | CustomBuilder | undefined
    hideToolBar_value?: boolean | undefined
    enableToolBarAdaptation_value?: boolean | undefined
    onTitleModeChange_value?: ((titleMode: NavigationTitleMode) => void) | undefined
    onNavBarStateChange_value?: ((isVisible: boolean) => void) | undefined
    onNavigationModeChange_value?: ((mode: NavigationMode) => void) | undefined
    navDestination_value?: PageMapBuilder | undefined
    customNavContentTransition_value?: ((from: NavContentInfo,to: NavContentInfo,operation: NavigationOperation) => NavigationAnimatedTransition | undefined) | undefined
    systemBarStyle_value?: window.SystemBarStyle | undefined
    recoverable_value?: boolean | undefined
    enableDragBar_value?: boolean | undefined
    enableModeChangeAnimation_value?: boolean | undefined
    navBarWidth(value: Length | Bindable<Length> | undefined): this {
        return this
    }
    navBarPosition(value: NavBarPosition | undefined): this {
        return this
    }
    navBarWidthRange(value: [ Dimension, Dimension ] | undefined): this {
        return this
    }
    minContentWidth(value: Dimension | undefined): this {
        return this
    }
    mode(value: NavigationMode | undefined): this {
        return this
    }
    backButtonIcon(value: string | image.PixelMap | Resource | SymbolGlyphModifier | undefined): this {
        return this
    }
    hideNavBar(value: boolean | undefined): this {
        return this
    }
    hideTitleBar(value: boolean | undefined): this {
        return this
    }
    hideBackButton(value: boolean | undefined): this {
        return this
    }
    titleMode(value: NavigationTitleMode | undefined): this {
        return this
    }
    menus(value: Array<NavigationMenuItem> | CustomBuilder | undefined): this {
        return this
    }
    hideToolBar(value: boolean | undefined): this {
        return this
    }
    enableToolBarAdaptation(value: boolean | undefined): this {
        return this
    }
    onTitleModeChange(value: ((titleMode: NavigationTitleMode) => void) | undefined): this {
        return this
    }
    onNavBarStateChange(value: ((isVisible: boolean) => void) | undefined): this {
        return this
    }
    onNavigationModeChange(value: ((mode: NavigationMode) => void) | undefined): this {
        return this
    }
    navDestination(value: PageMapBuilder | undefined): this {
        return this
    }
    customNavContentTransition(value: ((from: NavContentInfo,to: NavContentInfo,operation: NavigationOperation) => NavigationAnimatedTransition | undefined) | undefined): this {
        return this
    }
    systemBarStyle(value: window.SystemBarStyle | undefined): this {
        return this
    }
    recoverable(value: boolean | undefined): this {
        return this
    }
    enableDragBar(value: boolean | undefined): this {
        return this
    }
    enableModeChangeAnimation(value: boolean | undefined): this {
        return this
    }
    backButtonIcon(icon: string | image.PixelMap | Resource | SymbolGlyphModifier | undefined, accessibilityText?: ResourceStr): this {
        return this
    }
    title(value: ResourceStr | CustomBuilder | NavigationCommonTitle | NavigationCustomTitle | undefined, options?: NavigationTitleOptions): this {
        return this
    }
    hideTitleBar(hide: boolean | undefined, animated: boolean | undefined): this {
        return this
    }
    menus(items: Array<NavigationMenuItem> | CustomBuilder | undefined, options?: NavigationMenuOptions): this {
        return this
    }
    toolbarConfiguration(value: Array<ToolbarItem> | CustomBuilder | undefined, options?: NavigationToolbarOptions): this {
        return this
    }
    hideToolBar(hide: boolean | undefined, animated: boolean | undefined): this {
        return this
    }
    ignoreLayoutSafeArea(types?: Array<LayoutSafeAreaType>, edges?: Array<LayoutSafeAreaEdge>): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<NavigationAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface NavigationAnimatedTransition {
    onTransitionEnd?: ((isVisible: boolean) => void);
    timeout?: number;
    isInteractive?: boolean;
    transition: ((transitionProxy: NavigationTransitionProxy) => void);
}
export declare interface NavigationTransitionProxy {
    from: NavContentInfo;
    to: NavContentInfo;
    isInteractive?: boolean;
    cancelTransition?: VoidCallback;
    updateTransition?: UpdateTransitionCallback;
    finishTransition(): void
}
export type UpdateTransitionCallback = (progress: number) => void;
export declare interface NavContentInfo {
    name?: string;
    index: number;
    mode?: NavDestinationMode;
    param?: Object;
    navDestinationId?: string;
}

@memo
@ComponentBuilder
export function Navigation(
    pathInfos?: NavPathStack,
    @memo
    content_?: () => void,
): NavigationAttribute { throw new Error("")}
