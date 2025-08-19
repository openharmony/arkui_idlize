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
import { CustomBuilder } from "./builder"
import { TitleHeight } from "./enums"
import { Length, ResourceStr } from "./units"
import { NavPathInfo, NavPathStack, NavigationMenuItem, NavigationOperation, NavigationTitleOptions, NavigationMenuOptions, ToolbarItem, NavigationToolbarOptions } from "./navigation"
import { Scroller } from "./scroll"
import { default as curves } from "@ohos.curves"
import { CommonMethod, LayoutSafeAreaType, LayoutSafeAreaEdge, ArkCommonMethodStyle } from "./common"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
export type Orientation = window.Orientation;
export declare interface NavDestinationCommonTitle {
    main: string | Resource;
    sub: string | Resource;
}
export declare interface NavDestinationCustomTitle {
    builder: CustomBuilder;
    height: TitleHeight | Length;
}
export enum NavigationSystemTransitionType {
    DEFAULT = 0,
    NONE = 1,
    TITLE = 2,
    CONTENT = 3,
    FADE = 4,
    EXPLODE = 5,
    SLIDE_RIGHT = 6,
    SLIDE_BOTTOM = 7
}
export enum NavDestinationMode {
    STANDARD = 0,
    DIALOG = 1
}
export enum NavDestinationActiveReason {
    TRANSITION = 0,
    CONTENT_COVER = 1,
    SHEET = 2,
    DIALOG = 3,
    OVERLAY = 4,
    APP_STATE = 5
}
export declare interface RouteMapConfig {
    name: string;
    pageSourceFile: string;
    data: Object;
}
export declare interface NavDestinationContext {
    pathInfo: NavPathInfo;
    pathStack: NavPathStack;
    navDestinationId?: string;
    getConfigInRouteMap(): RouteMapConfig | undefined
}
export declare interface NestedScrollInfo {
    parent: Scroller;
    child: Scroller;
}
export declare interface NavDestinationTransition {
    onTransitionEnd?: (() => void);
    duration?: number;
    curve?: curves.Curve;
    delay?: number;
    event: (() => void);
}
export interface NavDestinationAttribute extends CommonMethod {
    hideTitleBar(value: boolean | undefined): this {
        throw new Error("Unimplemented method hideTitleBar")
    }
    hideBackButton(value: boolean | undefined): this {
        throw new Error("Unimplemented method hideBackButton")
    }
    onShown(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onShown")
    }
    onHidden(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onHidden")
    }
    onBackPressed(value: (() => boolean) | undefined): this {
        throw new Error("Unimplemented method onBackPressed")
    }
    onResult(value: ((value0: Object | undefined) => void) | undefined): this {
        throw new Error("Unimplemented method onResult")
    }
    mode(value: NavDestinationMode | undefined): this {
        throw new Error("Unimplemented method mode")
    }
    backButtonIcon(value: ResourceStr | image.PixelMap | SymbolGlyphModifier | undefined): this {
        throw new Error("Unimplemented method backButtonIcon")
    }
    menus(value: Array<NavigationMenuItem> | CustomBuilder | undefined): this {
        throw new Error("Unimplemented method menus")
    }
    onReady(value: ((value0: NavDestinationContext) => void) | undefined): this {
        throw new Error("Unimplemented method onReady")
    }
    onWillAppear(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onWillAppear")
    }
    onWillDisappear(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onWillDisappear")
    }
    onWillShow(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onWillShow")
    }
    onWillHide(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onWillHide")
    }
    systemBarStyle(value: window.SystemBarStyle | undefined): this {
        throw new Error("Unimplemented method systemBarStyle")
    }
    recoverable(value: boolean | undefined): this {
        throw new Error("Unimplemented method recoverable")
    }
    systemTransition(value: NavigationSystemTransitionType | undefined): this {
        throw new Error("Unimplemented method systemTransition")
    }
    bindToScrollable(value: Array<Scroller> | undefined): this {
        throw new Error("Unimplemented method bindToScrollable")
    }
    bindToNestedScrollable(value: Array<NestedScrollInfo> | undefined): this {
        throw new Error("Unimplemented method bindToNestedScrollable")
    }
    onActive(value: ((value0: NavDestinationActiveReason) => void) | undefined): this {
        throw new Error("Unimplemented method onActive")
    }
    onInactive(value: ((value0: NavDestinationActiveReason) => void) | undefined): this {
        throw new Error("Unimplemented method onInactive")
    }
    customTransition(value: NavDestinationTransitionDelegate | undefined): this {
        throw new Error("Unimplemented method customTransition")
    }
    onNewParam(value: ((value0: Object | undefined) => void) | undefined): this {
        throw new Error("Unimplemented method onNewParam")
    }
    preferredOrientation(value: window.Orientation | undefined): this {
        throw new Error("Unimplemented method preferredOrientation")
    }
    enableNavigationIndicator(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableNavigationIndicator")
    }
    title(value: string | CustomBuilder | NavDestinationCommonTitle | NavDestinationCustomTitle | Resource | undefined, options?: NavigationTitleOptions): this {
        throw new Error("Unimplemented method title")
    }
    hideTitleBar(hide: boolean | undefined, animated: boolean | undefined): this {
        throw new Error("Unimplemented method hideTitleBar")
    }
    backButtonIcon(icon: ResourceStr | image.PixelMap | SymbolGlyphModifier | undefined, accessibilityText?: ResourceStr): this {
        throw new Error("Unimplemented method backButtonIcon")
    }
    menus(items: Array<NavigationMenuItem> | CustomBuilder | undefined, options?: NavigationMenuOptions): this {
        throw new Error("Unimplemented method menus")
    }
    toolbarConfiguration(toolbarParam: Array<ToolbarItem> | CustomBuilder | undefined, options?: NavigationToolbarOptions): this {
        throw new Error("Unimplemented method toolbarConfiguration")
    }
    hideToolBar(hide: boolean | undefined, animated?: boolean): this {
        throw new Error("Unimplemented method hideToolBar")
    }
    ignoreLayoutSafeArea(types?: Array<LayoutSafeAreaType>, edges?: Array<LayoutSafeAreaEdge>): this {
        throw new Error("Unimplemented method ignoreLayoutSafeArea")
    }
    enableStatusBar(enabled: boolean | undefined, animated?: boolean): this {
        throw new Error("Unimplemented method enableStatusBar")
    }
    attributeModifier(value: AttributeModifier<NavDestinationAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkNavDestinationStyle extends ArkCommonMethodStyle implements NavDestinationAttribute {
    hideTitleBar_value?: boolean | undefined
    hideBackButton_value?: boolean | undefined
    onShown_value?: (() => void) | undefined
    onHidden_value?: (() => void) | undefined
    onBackPressed_value?: (() => boolean) | undefined
    onResult_value?: ((value0: Object | undefined) => void) | undefined
    mode_value?: NavDestinationMode | undefined
    backButtonIcon_value?: ResourceStr | image.PixelMap | SymbolGlyphModifier | undefined
    menus_value?: Array<NavigationMenuItem> | CustomBuilder | undefined
    onReady_value?: ((value0: NavDestinationContext) => void) | undefined
    onWillAppear_value?: (() => void) | undefined
    onWillDisappear_value?: (() => void) | undefined
    onWillShow_value?: (() => void) | undefined
    onWillHide_value?: (() => void) | undefined
    systemBarStyle_value?: window.SystemBarStyle | undefined
    recoverable_value?: boolean | undefined
    systemTransition_value?: NavigationSystemTransitionType | undefined
    bindToScrollable_value?: Array<Scroller> | undefined
    bindToNestedScrollable_value?: Array<NestedScrollInfo> | undefined
    onActive_value?: ((value0: NavDestinationActiveReason) => void) | undefined
    onInactive_value?: ((value0: NavDestinationActiveReason) => void) | undefined
    customTransition_value?: NavDestinationTransitionDelegate | undefined
    onNewParam_value?: ((value0: Object | undefined) => void) | undefined
    preferredOrientation_value?: window.Orientation | undefined
    enableNavigationIndicator_value?: boolean | undefined
    hideTitleBar(value: boolean | undefined): this {
        return this
    }
    hideBackButton(value: boolean | undefined): this {
        return this
    }
    onShown(value: (() => void) | undefined): this {
        return this
    }
    onHidden(value: (() => void) | undefined): this {
        return this
    }
    onBackPressed(value: (() => boolean) | undefined): this {
        return this
    }
    onResult(value: ((value0: Object | undefined) => void) | undefined): this {
        return this
    }
    mode(value: NavDestinationMode | undefined): this {
        return this
    }
    backButtonIcon(value: ResourceStr | image.PixelMap | SymbolGlyphModifier | undefined): this {
        return this
    }
    menus(value: Array<NavigationMenuItem> | CustomBuilder | undefined): this {
        return this
    }
    onReady(value: ((value0: NavDestinationContext) => void) | undefined): this {
        return this
    }
    onWillAppear(value: (() => void) | undefined): this {
        return this
    }
    onWillDisappear(value: (() => void) | undefined): this {
        return this
    }
    onWillShow(value: (() => void) | undefined): this {
        return this
    }
    onWillHide(value: (() => void) | undefined): this {
        return this
    }
    systemBarStyle(value: window.SystemBarStyle | undefined): this {
        return this
    }
    recoverable(value: boolean | undefined): this {
        return this
    }
    systemTransition(value: NavigationSystemTransitionType | undefined): this {
        return this
    }
    bindToScrollable(value: Array<Scroller> | undefined): this {
        return this
    }
    bindToNestedScrollable(value: Array<NestedScrollInfo> | undefined): this {
        return this
    }
    onActive(value: ((value0: NavDestinationActiveReason) => void) | undefined): this {
        return this
    }
    onInactive(value: ((value0: NavDestinationActiveReason) => void) | undefined): this {
        return this
    }
    customTransition(value: NavDestinationTransitionDelegate | undefined): this {
        return this
    }
    onNewParam(value: ((value0: Object | undefined) => void) | undefined): this {
        return this
    }
    preferredOrientation(value: window.Orientation | undefined): this {
        return this
    }
    enableNavigationIndicator(value: boolean | undefined): this {
        return this
    }
    title(value: string | CustomBuilder | NavDestinationCommonTitle | NavDestinationCustomTitle | Resource | undefined, options?: NavigationTitleOptions): this {
        return this
    }
    hideTitleBar(hide: boolean | undefined, animated: boolean | undefined): this {
        return this
    }
    backButtonIcon(icon: ResourceStr | image.PixelMap | SymbolGlyphModifier | undefined, accessibilityText?: ResourceStr): this {
        return this
    }
    menus(items: Array<NavigationMenuItem> | CustomBuilder | undefined, options?: NavigationMenuOptions): this {
        return this
    }
    toolbarConfiguration(toolbarParam: Array<ToolbarItem> | CustomBuilder | undefined, options?: NavigationToolbarOptions): this {
        return this
    }
    hideToolBar(hide: boolean | undefined, animated?: boolean): this {
        return this
    }
    ignoreLayoutSafeArea(types?: Array<LayoutSafeAreaType>, edges?: Array<LayoutSafeAreaEdge>): this {
        return this
    }
    enableStatusBar(enabled: boolean | undefined, animated?: boolean): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<NavDestinationAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type NavDestinationTransitionDelegate = (operation: NavigationOperation, isEnter: boolean) => Array<NavDestinationTransition> | undefined;

@memo
@ComponentBuilder
export function NavDestination(
    
    @memo
    content_?: () => void,
): NavDestinationAttribute { throw new Error("")}
