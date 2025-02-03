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

import { 
    Language, 
    isDefined, 
    warn
} from '@idlizer/core'

import * as fs from "fs"
import * as path from "path"

export interface CoreGeneratorConfiguration {
    get dummy(): { 
        [key: string]: { }
    }
}

export const defaultCoreGeneratorConfiguration: CoreGeneratorConfiguration = {
    "dummy": {
        "ignoreMethods": {
            "LazyForEachOps": ["*"],
            "CommonMethod": [
                "onClick"
            ]
        }
    }
}

export function loadConfiguration(configurationFile?: string): CoreGeneratorConfiguration {
    if (!isDefined(configurationFile)) return defaultCoreGeneratorConfiguration

    const data = fs.readFileSync(path.resolve(configurationFile)).toString()
    const userConfiguration = JSON.parse(data)
    if (!isDefined(userConfiguration)) {
        warn(`Could not parse json config file ${configurationFile}`)
        return defaultCoreGeneratorConfiguration
    }
    const mergedConfig = deepMergeConfig(defaultCoreGeneratorConfiguration, userConfiguration)
    return mergedConfig
}

export class PeerGeneratorConfigImpl implements CoreGeneratorConfiguration {
    constructor(private data: CoreGeneratorConfiguration) {

        this.dummy = this.data.dummy

        const ignoreDummy = this.dummy?.ignoreMethods
        if (ignoreDummy) {
            this.noDummyComponents = new Map<string, string[]>(Object.entries(ignoreDummy))
        }
    }

    readonly dummy: Record<string, any> 

    noDummyGeneration(component: string, method = "") {
        const ignoreMethods = this.noDummyComponents.get(component)
        if (!isDefined(ignoreMethods)) return false
        if (this.isWhole(ignoreMethods)) return true
        if (ignoreMethods.includes(method)) return true

        return false
    }

    private isWhole(methods: string[]): boolean {
        return methods.includes("*")
    }

    private noDummyComponents: Map<string, string[]> = new Map()
}

export let PeerGeneratorConfigCore = new PeerGeneratorConfigImpl(defaultCoreGeneratorConfiguration)

export function setFileGeneratorConfiguration(config: CoreGeneratorConfiguration) {
    PeerGeneratorConfigCore = new PeerGeneratorConfigImpl(config)
}

export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]
    public static customNodeTypes = ["CustomNode"]

    public static ignoreSerialization = [
        "Array", "Callback", "ErrorCallback", "Length", "AttributeModifier",
        "Number", "String", "Function", "Optional", "RelativeIndexable",
    ]

    private static customComponents = [
        "BaseCustomComponent",
        "CustomComponent",
        "CustomComponentV2",
    ]

    public static handWritten = [
        ...this.customComponents,
        "LocalStorage",
        "SyncedPropertyOneWay",
        "SubscribedAbstractProperty",
        "SyncedPropertyTwoWay",
        "AttributeModifier",
        "AbstractProperty",
        "SubscribaleAbstract",
        "IPropertySubscriber",
        "ISinglePropertyChangeSubscriber",
        "SystemBarStyle",
        "Navigation",
        "AbstractProperty",
        "ISinglePropertyChangeSubscriber",
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

    public static knownParametrized = [
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

    private static replaceThrowErrorReturn = [
        "NavPathStack"
    ]

    public static isShouldReplaceThrowingError(name: string) {
        for (const ignore of this.replaceThrowErrorReturn) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }

    private static ignoreMaterialized = [
        // TBD
        "Layoutable",
        "LayoutChild",
        "Measurable",
        "IMonitor", // IMonitor class processing will fixed in !920
        "Configuration",
        "UIGestureEvent",
        //"GestureHandler",           // class with generics
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
        ...this.customComponents,
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

    public static boundProperties: Array<[string, string[]]> = [
        ["Checkbox", ["select"]],
        ["CheckboxGroup", ["selectAll"]],
        ["DatePicker", ["selected"]],
        ["TimePicker", ["selected"]],
        ["MenuItem", ["selected"]],
        ["Panel", ["mode"]],
        ["Radio", ["checked"]],
        ["Rating", ["rating"]],
        ["Search", ["value"]],
        ["SideBarContainer", ["showSideBar"]],
        ["Slider", ["value"]],
        ["Stepper", ["index"]],
        ["Swiper", ["index"]],
        ["Tabs", ["index"]],
        ["TextArea", ["text"]],
        ["TextInput", ["text"]],
        ["TextPicker", ["selected", "value"]],
        ["Toggle", ["isOn"]],
        ["AlphabetIndexer", ["selected"]],
        ["Select", ["selected", "value"]],
        ["BindSheet", ["isShow"]],
        ["BindContentCover", ["isShow"]],
        ["Refresh", ["refreshing"]],
        ["GridItem", ["selected"]],
        ["ListItem", ["selected"]],
    ]

    public static ignoredCallbacks = new Set<string>([
        // Empty for now
    ])

    static ignoreEntry(name: string, language: Language) {
        return PeerGeneratorConfig.ignoredEntriesCommon.has(name) ||
            language === Language.JAVA && PeerGeneratorConfig.ignoredEntriesJava.has(name)
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


function isObject(i: any): i is object {
    if (typeof i !== 'object')
        return false
    if (Array.isArray(i))
        return false
    return true
}

export function deepMergeConfig<T extends object>(defaults: T, custom: Partial<T>): T {
    if (custom === undefined)
        return defaults
    const result = Object.assign({}, defaults)
    for (const key in custom) {
        if (Object.prototype.hasOwnProperty.call(custom, key)) {
            const defaultValue = result[key]
            const customValue = custom[key]
            if (isObject(defaultValue) && isObject(customValue)) {
                Object.assign(result, { [key]: deepMergeConfig(defaultValue, customValue) })
            } else {
                if (isObject(defaultValue))
                    throw new Error("Replacing default object value with custom non-object")
                Object.assign(result, { [key]: customValue })
            }
        }
    }
    return result
}