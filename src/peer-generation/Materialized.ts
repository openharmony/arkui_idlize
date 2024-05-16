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

import * as ts from "typescript"
import { ArgConvertor, RetConvertor } from "./Convertors"
import { LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, Type } from "./LanguageWriters"
import { PeerMethod } from "./PeerMethod"
import { Language, identName } from "../util"
import { printPeerMethod } from "./NativeModulePrinter"
import { PeerClassBase } from "./PeerClass"
import { DeclarationTarget } from "./DeclarationTable"

const ignoredMaterializedClasses = [
    "CanvasRenderingContext2D", // has data
    "NavPathStack",             // duplicate overloaded functions
    "Scroller",                 // duplicate scrollPage()
    "SubTabBarStyle",           // duplicate of()
    "TransitionEffect",         // Type 'typeof TransitionEffect' is not assignable to type 'TransitionEffect' ??
]

export function isMaterialized(declaration: ts.ClassDeclaration): boolean {
    // TBD: check the class has zero fields
    if (ignoredMaterializedClasses.includes(identName(declaration)!)) return false
    return declaration.members.find(ts.isConstructorDeclaration) !== undefined
}

export class MaterializedMethod extends PeerMethod {
    constructor(
        originalParentName: string,
        declarationTargets: DeclarationTarget[],
        argConvertors: ArgConvertor[],
        retConvertor: RetConvertor,
        public tsRetType: string | undefined,
        isCallSignature: boolean,
        method: Method
    ) {
        super(originalParentName, declarationTargets, argConvertors, retConvertor, isCallSignature, false, method)
    }

    override get implName(): string {
        return `${this.originalParentName}_${this.overloadedName}`
    }

    override generateReceiver(): { argName: string; argType: string } | undefined {
        if (!this.hasReceiver()) return undefined
        return {
            argName: 'peer',
            argType: `${this.originalParentName}Peer*`
        }
    }
}

export class MaterializedClass implements PeerClassBase {
    constructor(
        public readonly className: string,
        public readonly ctor: MaterializedMethod,
        public readonly dtor: MaterializedMethod,
        public readonly methods: MaterializedMethod[],
    ) {}

    setGenerationContext(context: string| undefined): void {
       // TODO: set generation context!
    }

    generatedName(isCallSignature: boolean): string{
        return this.className
    }

}

export class Materialized {
    private static _instance: Materialized = new Materialized()

    public materializedClasses: Map<string, MaterializedClass> = new Map()

    private constructor() {
    }

    public static get Instance(): Materialized {
        return this._instance
    }
}

export function printGlobalMaterialized(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter) {
    console.log(`Materialized classes: ${Materialized.Instance.materializedClasses.size}`)
    Materialized.Instance.materializedClasses.forEach(clazz => {
        printPeerMethod(clazz, clazz.ctor, nativeModule, nativeModuleEmpty, new Type("pointer"))
        clazz.methods.forEach(method => printPeerMethod(clazz, method, nativeModule, nativeModuleEmpty))
    })
}
