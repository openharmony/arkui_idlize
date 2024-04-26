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

export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]

    public static ignoreSerialization = [
        "Array", "Callback", "ErrorCallback", "Resource", "Length", "AttributeModifier",
        "Number", "String", "Function", "Optional", "RelativeIndexable"
    ]
    public static ignorePeerMethod = ["attributeModifier"]

    private static knownParametrized = ["Indicator", "AttributeModifier", "AnimationRange", "ContentModifier", "SizeT", "PositionT"]

    public static invalidAttributes = ["ArkScrollableCommon"]

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
        "ContentSlotInterface"
    ]

    public static skipPeerGeneration = ["CommonAttribute"]

    public static rootComponents = [
        "CommonMethod",
        "SecurityComponentMethod"
    ]

    public static standaloneComponents = [
        "CalendarAttribute",
        "ContainerSpanAttribute",
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
}
