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

import { ArgConvertor, RetConvertor } from "./Convertors"
import { LanguageWriter } from "./LanguageWriters"
import { PeerMethod } from "./PeerMethod"

export class MaterializedMethod extends PeerMethod {
    constructor(
        originalParentName: string,
        methodName: string,
        argConvertors: ArgConvertor[],
        retConvertor: RetConvertor,
        public tsRetType: string | undefined,
        hasReceiver: boolean,
        isCallSignature: boolean
    ) {
        super(originalParentName, methodName, [], argConvertors, retConvertor, hasReceiver, isCallSignature,
            undefined, undefined, undefined)
     }

     override generateAPIParameters(): string[] {
        let maybeReceiver = this.hasReceiver ? [`${this.originalParentName}Peer* peer`] : []
        return (maybeReceiver.concat(this.argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
        })))
    }
}

export class MaterializedClass {
    constructor(
        public readonly className: string,
        public readonly ctor: MaterializedMethod,
        public readonly dtor: MaterializedMethod,
        public readonly methods: MaterializedMethod[],
    ) {}
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
        clazz.methods.forEach(method => {
            console.log(`Materialized class: ${clazz.className}, method: ${method.methodName}\n\n`)
            const implDecl = `_${clazz.className}_${method.methodName}(): void`
            nativeModule.print(implDecl)
            nativeModuleEmpty.print(`${implDecl} { console.log("${method.methodName}") }`)
        })
    })
}
