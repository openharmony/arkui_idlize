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

export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]
    public static customComponent = ["CustomComponent"]

    public static ignoreSerialization = [
        "Array", "Callback", "ErrorCallback", "Resource", "Length", "AttributeModifier",
        "Number", "String", "Function", "Optional", "RelativeIndexable"
    ]
    public static ignorePeerMethod = ["attributeModifier"]

    private static knownParametrized = [
        "Indicator", "AttributeModifier", "AnimationRange", "ContentModifier", "SizeT", "PositionT", "Record"
    ]

    public static invalidAttributes = ["ScrollableCommon"]

    public static invalidEvents = ["onRenderExited"]

    // TODO: need a better logic to know if the XxxInterface
    // doesn't have a XxxAttribute class which needs a peer.
    public static readonly uselessConstructorInterfaces = [
        "CommonInterface",
        "ForEachInterface",
        "LazyForEachInterface",
        "GestureInterface",
        "TapGestureInterface",
        "LongPressGestureInterface",
        "PanGestureInterface",
        "SwipeGestureInterface",
        "PinchGestureInterface",
        "RotationGestureInterface",
        "GestureGroupInterface",
        "PageTransitionEnterInterface",
        "PageTransitionExitInterface",
        "ParticleInterface",
        "ProgressInterface",
        "TextStyleInterface",
        "DecorationStyleInterface",
        "GestureStyleInterface",
        "ImageAttachmentInterface",
        "ContentSlotInterface",
        "ParagraphStyleInterface",
        "LocationButtonInterface",
        "PasteButtonInterface",
        "SaveButtonInterface",
    ]

    public static skipPeerGeneration = ["CommonAttribute", "ProgressAttribute"]

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
