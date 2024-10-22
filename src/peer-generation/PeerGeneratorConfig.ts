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

import * as ts from 'typescript'
import { Language } from '../Language'

export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]
    public static customComponent = ["CustomComponent"]
    public static customNodeTypes = ["Root", "ComponentRoot", "CustomNode"]

    public static ignoreSerialization = [
        "Array", "Callback", "ErrorCallback", "Length", "AttributeModifier",
        "Number", "String", "Function", "Optional", "RelativeIndexable",
    ]

    public static ignorePeerMethod = [
        "attributeModifier",
        /**
         * ScrollableCommonMethod has a method `onWillScroll(handler: Optional<OnWillScrollCallback>): T;`
         * ScrollAttribute extends ScrollableCommonMethod and overrides this method as
         * `onWillScroll(handler: ScrollOnWillScrollCallback): ScrollAttribute;`. So that override is not
         * valid and cannot be correctly processed for now.
         */
        "onWillScroll",
    ]

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
        "Event",
        "Configuration",
        "UIGestureEvent",
        "GestureHandler",           // class with generics
        // constant values need to be generated
        // "equals(id: TextMenuItemId): boolean" method leads to the "cycle detected" message
        "TextMenuItemId",
        "BaseSpan",
        "CommonTransition",
    ]

    public static ArkTsIgnoredMethods = ["testTupleNumberStringEnum", "testTupleOptional", "testTupleUnion"]

    public static ignoreReturnTypes = new Set<string>([
        "Promise"
    ])

    private static ignoredEntriesCommon = new Set([
        // Predefined types
        "Dimension",
        "Length",
        "Optional",

        // common
        "AppStorage",
        "CustomComponent",  // pulls in Layoutable, LayoutChild
        "DataAddOperation",
        "DataChangeListener",  // causes discrimination code failure
        "DataChangeOperation",
        "DataReloadOperation",
        "DisturbanceFieldOptions",
        "EmitterProperty",
        "EntryOptions",
        "Environment",
        "GestureGroupGestureHandlerOptions",
        "GestureGroupHandler",
        "IDataSource",
        "Layoutable",
        "LayoutChild",
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
        "UIExtensionProxy",
    ])

    private static ignoredEntriesJava = new Set([
        "AnimationRange",
        "EventTargetInfo",
        "GestureRecognizer",
        "GestureRecognizerJudgeBeginCallback",
        "Matrix2D",
        "ScrollAnimationOptions",
        "SheetDismiss",
        "SubTabBarStyle",
        "TextPickerDialog",
    ])

    static ignoreEntry(name: string, language: Language) {
        return PeerGeneratorConfig.ignoredEntriesCommon.has(name) ||
            language === Language.JAVA && PeerGeneratorConfig.ignoredEntriesJava.has(name)
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

    static isConflictedDeclaration(node: ts.Declaration): boolean {
        if (!this.needInterfaces) return false
        // duplicate type declarations with different signatures
        if (ts.isTypeAliasDeclaration(node) && node.name.text === 'OnWillScrollCallback') return true
        // has same named class and interface
        if ((ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) && node.name?.text === 'LinearGradient') return true
        // just has ugly dependency WrappedBuilder - there is conflict in generic types
        if (ts.isInterfaceDeclaration(node) && node.name.text === 'ContentModifier') return true
        // complicated type arguments
        if (ts.isClassDeclaration(node) && node.name?.text === 'TransitionEffect') return true
        // inside namespace
        if (ts.isEnumDeclaration(node) && node.name.text === 'GestureType') return true
        // no return type in some methods
        if (ts.isInterfaceDeclaration(node) && node.name.text === 'LayoutChild') return true
        return false
    }

    static cppPrefix = "GENERATED_"
    static needInterfaces = true
}
