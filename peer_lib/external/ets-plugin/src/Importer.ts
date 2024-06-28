/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import * as ts from 'ohos-typescript'
import { id } from './ApiUtils'

let knownPrefixes = ["@ohos", "@system"]

export function isOhosImport(literal: string): boolean {
    for (let prefix of knownPrefixes) {
        if (literal.startsWith(prefix)) return true
    }
    return false
}

interface ArkUIVariance {
    koalaCommon: string
    koalaFramework: string
    koalaRuntime: string
    koalaArkuiCommon: string
    arkoala: string
    koalaAdaptor: string
}

const KoalaArkui: ArkUIVariance = {
    koalaCommon: "@koalaui/common",
    koalaFramework: "@koalaui/framework",
    koalaRuntime: "@koalaui/runtime",
    koalaArkuiCommon: "@koalaui/arkui-common",
    arkoala: "@koalaui/arkoala",
    koalaAdaptor: "@koalaui/arkui"
}

const ArkoalaArkui: ArkUIVariance = {
    koalaCommon: "@koalaui/common",
    koalaFramework: "@koalaui/framework",
    koalaRuntime: "@koalaui/runtime",
    koalaArkuiCommon: "@koalaui/arkui-common",
    arkoala: "@koalaui/arkoala",
    koalaAdaptor: "@koalaui/arkoala-arkui"
}

// Everything re-exported through arkoala-arkui
const ArkoalaSdkArkui: ArkUIVariance = {
    koalaCommon: "@koalaui/arkoala-arkui",
    koalaFramework: "@koalaui/arkoala-arkui",
    koalaRuntime: "@koalaui/arkoala-arkui",
    koalaArkuiCommon: "@koalaui/arkoala-arkui",
    arkoala: "@koalaui/arkoala-arkui",
    koalaAdaptor: "@koalaui/arkoala-arkui",
}


export class Importer {
    // TODO: Every use of this property is a bad HACK!
    // Think hard how to eliminate it!
    public __isArkoalaImplementation: boolean = false
    private allImports: Map<string, Set<string>>
    private implementedPackages: Set<string>

    static koalaCommon = "@koalaui/common"
    static koalaFramework = "@koalaui/framework"
    static koalaRuntime = "@koalaui/runtime"
    static koalaArkuiCommon = "@koalaui/arkui-common"
    static arkoala = "@koalaui/arkoala"

    subproject: ArkUIVariance
    
    constructor(koalaAdaptor: string = "@koalaui/arkui", public moduleInfo?: (moduleName: string)=>any) {
        this.__isArkoalaImplementation = (koalaAdaptor == "@koalaui/arkoala-arkui")
        this.subproject = this.__isArkoalaImplementation ? ArkoalaSdkArkui : KoalaArkui

        this.implementedPackages = new Set(
            this.__isArkoalaImplementation ?
                [
                    'ohos.arkui.testing',
                    'ohos.matrix4',
                    'ohos.router',
                    'system.router'
                ] :
                [
                    'ohos.curves',
                    'ohos.events.emitter',
                    'ohos.matrix44',
                    'ohos.router',
                    'ohos.data.preferences',
                    'ohos.hilog',
                    'ohos.mediaquery',
                    'ohos.UiTest',
                    'ohos.display',
                    'ohos/hypium',
                    'ohos.net.http',
                    'system.router'
                ]
        )

        // TODO Add special handling for ForEach imports
        this.allImports = new Map([
            [
                this.subproject.koalaAdaptor, new Set(
                    this.__isArkoalaImplementation ? [
                        "ForEach",
                        "LazyForEach",
                        "IDataSource",
                        "SwiperController",
                        "Scroller",
                        "VideoController",
                        "TabsController",
                        "SearchController",
                        "PatternLockController",
                        "AppStorage",
                        "LocalStorage",
                        "animateTo",
                        "TransitionEffect",
                        "TapGesture",
                        "LongPressGesture",
                        "PanGestureOptions",
                        "PanGesture",
                        "PinchGesture",
                        "GestureGroup",
                        "LinearGradient",
                        "TextClockController",
                        "TextTimerController",
                        "RichEditorController",
                        "TextAreaController",
                        "CanvasRenderingContext2D",
                        "OffscreenCanvasRenderingContext2D",
                        "ImageBitmap",
                        "RenderingContextSettings",
                        "XComponentController",
                        "Indicator",
                        "TextInputOptions",
                        "TextInputController",
                        "WebController",
                        "ESObject",
                    ] : [
                        "PanGestureOptions",
                        "TapGesture",
                        "LongPressGesture",
                        "PanGesture",
                        "SwipeGesture",
                        "PinchGesture",
                        "RotationGesture",
                        "GestureGroup",
                        "DataChangeListener",
                        "ForEach",
                        "IDataSource",
                        "Scroller",
                        "CustomDialogController",
                        "SwiperController",
                        "RenderingContextSettings",
                        "CanvasRenderingContext2D",
                        "VideoController",
                        "TabsController",
                        "TextAreaController",
                        // generated classes do not see common_ts_ets_api.d.ts
                        // so, import next five classes from Storage.ts
                        "AppStorage",
                        "PersistentStorage",
                        "Environment",
                        "SubscribedAbstractProperty",
                        "LocalStorage",

                        "Observed",
                        "$r",
                        "$rawfile",
                        "getContext",
                        "getInspectorByKey",
                        "vp2px",
                        "px2vp",
                        "fp2px",
                        "px2fp",
                        "lpx2px",
                        "px2lpx",
                        "animateTo",
                    ])
            ]
        ])
    }


    addImport(pkg: string, subpackage: string | undefined, name: string) {
        const from = subpackage ? `${pkg}/${subpackage}` : pkg
        if (this.allImports.has(from)) {
            this.allImports.get(from)?.add(name)
        } else {
            this.allImports.set(from, new Set([name]))
        }
    }

    addCommonImport(name: string) {
        this.addImport(this.subproject.koalaCommon, undefined, name)
    }
    addFrameworkImport(name: string) {
        this.addImport(this.subproject.koalaFramework, undefined, name)
    }
    addArkoalaImport(name: string) {
        this.addImport(this.subproject.arkoala, undefined, name)
    }
    addRuntimeImport(name: string) {
        this.addImport(this.subproject.koalaRuntime, undefined, name)
    }
    addAdaptorImport(name: string) {
        this.addImport(this.subproject.koalaAdaptor, undefined, name)
    }
    addArkuiCommonImport(name: string) {
        this.addImport(this.subproject.koalaArkuiCommon, undefined, name)
    }
    addOhosImport(pkg: string, name: string) {
        this.addImport(this.subproject.koalaAdaptor, pkg, name)
    }
    allImportsSorted(from: string): string[] {
        const nameSet: Set<string> | undefined = this.allImports.get(from)
        if (!nameSet) return []
        return Array.from(nameSet).sort()
    }

    withCommonImport(name: string): string {
        this.addCommonImport(name)
        return name
    }

    withAdaptorImport(name: string): string {
        this.addAdaptorImport(name)
        return name
    }

    withArkuiCommonImport(name: string): string {
        this.addArkuiCommonImport(name)
        return name
    }

    withOhosImport(pkg: string, name: string): string {
        this.addOhosImport(pkg, name)
        return name
    }

    withFrameworkImport(name: string): string {
        this.addFrameworkImport(name)
        return name
    }

    withArkoalaImport(name: string): string {
        this.addArkoalaImport(name)
        return name
    }

    withRuntimeImport(name: string): string {
        this.addRuntimeImport(name)
        return name
    }

    generateAllImports(array: string[], from: string): ts.ImportDeclaration {
        const namedImports = array.map(it => ts.factory.createImportSpecifier(
            false,
            undefined,
            id(it)
        ))

        return ts.factory.createImportDeclaration(
            undefined,
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports(
                    namedImports
                )
            ),
            ts.factory.createStringLiteral(from),
        )
    }

    generate(): ts.ImportDeclaration[] {
        const allImports = Array.from(this.allImports.keys()).map(from =>
            this.generateAllImports(this.allImportsSorted(from), from)
        )

        return allImports
    }

    translateOhosImport(node: ts.ImportDeclaration, oldPackage: string, oldDefaultName: string): ts.ImportDeclaration {
        if (!oldPackage.startsWith("@")) return node
        const stringName = oldPackage.substring(1)
        if (!this.implementedPackages.has(stringName)) return node

        return ts.factory.updateImportDeclaration(
            node,
            node.modifiers,
            (oldDefaultName.length == 0) ? node.importClause : ts.factory.createImportClause(
                false,
                id(oldDefaultName),
                undefined
            ),
            ts.factory.createStringLiteral(`${this.subproject.koalaAdaptor}/${stringName}`),
            undefined
        )
    }
}
