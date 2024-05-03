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

import { LanguageWriter } from "./LanguageWriters";

export class MaterializedMethod {
    constructor(
        public readonly methodName: string,
        public readonly isStatic: boolean,
        public readonly returnType: string | undefined,
        public readonly params: [name: string, type: string][]
    ) {}
}

export class MaterializedClass {
    constructor(
        public readonly className: string,
        public readonly cons: MaterializedMethod,
        public readonly methods: MaterializedMethod[],
    ) {}
}

export class Materialized {
    private static _instance: Materialized = new Materialized()

    public materializedClasses: MaterializedClass[] = []

    private constructor() {
    }

    public static get Instance(): Materialized {
        return this._instance
    }
}

export function printGlobalMaterialized(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter) {
        console.log(`Materialized classes: ${Materialized.Instance.materializedClasses.length}`)
    Materialized.Instance.materializedClasses.forEach(clazz => {
            clazz.methods.forEach(method => {
            console.log(`Materialized class: ${clazz.className}, method: ${method.methodName}\n\n`)
            const implDecl = `_${clazz.className}_${method.methodName}(): void`
            nativeModule.print(implDecl)
            nativeModuleEmpty.print(`${implDecl} { console.log("${method.methodName}") }`)
        })
    })
}
