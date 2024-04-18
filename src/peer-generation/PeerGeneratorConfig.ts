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
        "Number", "Object", "String", "Function", "Optional", "Undefined"
    ]
    public static ignorePeerMethod = ["attributeModifier"]

    private static knownParametrized = ["Indicator", "AttributeModifier", "AnimationRange", "ContentModifier"]

    public static exports = [
        { file: "common", components: ["Common", "ScrollableCommon", "CommonShape"]},
        { file: "shape", components: ["Shape"] },
        { file: "security_component", components: ["SecurityComponent"] },
        { file: "column", components: ["Column"] },
        { file: "image", components: ["Image"] },
        { file: "span", components: ["BaseSpan"] },
    ]

    public static invalidAttributes = ["ArkScrollableCommon"]

    public static readonly uselessConstructorInterfaces = [
        "CommonInterface",
        "ForEachInterface",
        "LazyForEachInterface",
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
        "ProgressInterface"
    ]

    public static skipPeerGeneration = ["CommonAttribute"]

    static mapComponentName(originalName: string): string {
        if (originalName.endsWith("Attribute"))
            return originalName.substring(0, originalName.length - 9)
        return originalName
    }

    static isKnownParametrized(name: string | undefined) : boolean {
        return name != undefined && PeerGeneratorConfig.knownParametrized.includes(name)
    }
}

