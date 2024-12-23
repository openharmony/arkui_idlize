/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { Language } from '../Language'

export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]
    public static customNodeTypes = ["CustomNode"]

    public static ignoreSerialization = [
        "Array", "Callback", "ErrorCallback", "Length", "AttributeModifier",
        "Number", "String", "Function", "Optional", "RelativeIndexable",
    ]

    public static handWritten = [
        "LocalStorage",
        "SyncedPropertyOneWay",
        "SubscribedAbstractProperty",
        "SyncedPropertyTwoWay",
        "Navigation",
        "CustomComponent",
        "AttributeModifier",
        "AbstractProperty",
        "SubscribaleAbstract",
        "IPropertySubscriber",
        "ISinglePropertyChangeSubscriber",
        "NavigationMenuItem",
        "NavDestinationContext",
        "NavDestination",
        "SystemBarStyle",
        "NavDestinationCommonTitle",
        "NavDestinationCustomTitle",
        "NavigationTitleOptions",
        "ToolbarItem",
        "NavigationTransitionProxy",
        "NavigationToolbarOptions",
        "NavigationOptions",
        "NavPathInfo",
        "PopInfo",
        "NavPathStack",
        "NavigationInterception",
        "NavigationAttribute",
        "NavContentInfo",
        "NavigationCommonTitle",
        "NavigationCustomTitle",
        "AbstractProperty",
        "ISinglePropertyChangeSubscriber",
        "NavigationAnimatedTransition",
        "PageTransitionEnterInterface",
        "PageTransitionExitInterface",
        "CommonTransition",
    ]

    public static ignorePeerMethod = ["attributeModifier"]

    public static ignoreComponents = [
        "Particle",
        "ForEach",
        "LazyForEach",
        "ContentSlot",
    ]

    private static knownParametrized = [
        "Indicator", "AttributeModifier", "AnimationRange", "ContentModifier", "SizeT", "PositionT", "Record"
    ]

    public static invalidAttributes = ["ScrollableCommonMethod"]

    public static invalidEvents: string[] = []

    public static rootComponents = [
        "Root",
        "ComponentRoot",
        "CommonMethod",
        "SecurityComponentMethod",
        "CommonTransition",
        "CalendarAttribute",
        "ContainerSpanAttribute",
    ]

    public static standaloneComponents = [
        "TextPickerDialog",
        "TimePickerDialog",
        "AlertDialog",
        "CanvasPattern"
    ]

    public static builderClasses = [
        "SubTabBarStyle",
        "BottomTabBarStyle",
        "DotIndicator",
        "DigitIndicator",
    ]

    private static ignoreStandardNames = [
        // standard exclusion
        "Attribute",
        "Interface",
        "Method",
    ]

    public static isStandardNameIgnored(name: string) {
        for (const ignore of this.ignoreStandardNames) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }

    private static ignoreMaterialized = [
        // TBD
        "CustomComponent",
        "Layoutable",
        "LayoutChild",
        "Measurable",
        "IMonitor", // IMonitor class processing will fixed in !920
        "Event",
        "Configuration",
        "UIGestureEvent",
        "GestureHandler",           // class with generics
        "GestureGroupHandler",
        "ContentModifier",
        // constant values need to be generated
        // "equals(id: TextMenuItemId): boolean" method leads to the "cycle detected" message
        // "TextMenuItemId", // SyntaxError: Unexpected token, expected 'private' or identifier [ArkTextCommonInterfaces.ts:52:24]
        "AnimatableArithmetic", // Unused generic class
        "DataChangeListener"
    ]

    public static ignoreReturnTypes = new Set<string>([
        "Promise"
    ])

    private static ignoredEntriesCommon = new Set([
        // Predefined types
        "Optional",

        // common
        "AppStorage",
        "DataAddOperation",
        "DataChangeListener",  // causes discrimination code failure
        "DataChangeOperation",
        "DataReloadOperation",
        "DisturbanceFieldOptions",
        "EntryOptions",
        "Environment",
        "GestureGroupHandler",
        "IDataSource",
        "LazyForEachInterface",  // pulls in DataChangeListener
        "LocalStorage",
        "OffscreenCanvas",
        "OffscreenCanvasRenderingContext2D",
        "PersistentStorage",
        "PositionT",
        "SizeT",
        "Storage",  // escape method name `delete` in C++ code
        "SubscribedAbstractProperty",
        "SyncedPropertyOneWay",
        "SyncedPropertyTwoWay",
        "IMonitorValue",
    ])

    private static ignoredEntriesJava = new Set([
        "CustomComponent",
        "AnimationRange",
        "EventTargetInfo",
        "GestureRecognizer",
        "GestureRecognizerJudgeBeginCallback",
        "Matrix2D",
        "ScrollAnimationOptions",
        "SheetDismiss",
        "SubTabBarStyle",
        "TextPickerDialog",
        "Dimension",
    ])

    private static ignoredEntriesCJ = new Set([
        "CallbackResource",
        "Dimension",
        "RuntimeType"
    ])

    public static ignoredCallbacks = new Set<string>([
        // Empty for now
    ])

    static ignoreEntry(name: string, language: Language) {
        return PeerGeneratorConfig.ignoredEntriesCommon.has(name) ||
            language === Language.JAVA && PeerGeneratorConfig.ignoredEntriesJava.has(name) ||
            language === Language.CJ && PeerGeneratorConfig.ignoredEntriesCJ.has(name)
    }

    static ignoreMethod(name: string, language: Language) {
        return language === Language.ARKTS &&
            ["testTupleNumberStringEnum", "testTupleOptional", "testTupleUnion"].includes(name)
    }

    public static isMaterializedIgnored(name: string) {
        if (this.isStandardNameIgnored(name)) return true

        for (const ignore of this.ignoreMaterialized) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }

    static mapComponentName(originalName: string): string {
        if (originalName.endsWith("Attribute"))
            return originalName.substring(0, originalName.length - 9)
        return originalName
    }

    static isKnownParametrized(name: string | undefined) : boolean {
        return name != undefined && PeerGeneratorConfig.knownParametrized.includes(name)
    }

    static cppPrefix = "GENERATED_"
    static needInterfaces = true
}
