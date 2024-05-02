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

import { PeerFile } from "./PeerFile"
import { PeerMethod } from "./PeerMethod"
import { Printers } from "./Printers"
import { DeclarationTable } from "./DeclarationTable"

export class PeerClass {
    constructor(
        public readonly file: PeerFile,
        public readonly componentName: string,
        public readonly originalFilename: string,
        public readonly declarationTable: DeclarationTable
    ) { }

    methods: PeerMethod[] = []
    get callableMethod(): PeerMethod {
        return this.methods.find(method => method.isCallSignature)!
    }

    originalClassName: string | undefined = undefined
    originalInterfaceName: string | undefined = undefined
    originalParentName: string | undefined = undefined
    originalParentFilename: string | undefined = undefined
    parentComponentName: string | undefined = undefined
    attributesFields: string[] = []
    attributesTypes: string[] = []

    private printGlobalNativeModule(printers: Printers) {
        printers.nodeTypes.print(this.componentName)
        this.methods.forEach(method => {
            const component = method.isCallSignature ? this.originalInterfaceName : this.originalClassName
            this.declarationTable.setCurrentContext(`${method.isCallSignature ? "" : method.methodName}()`)
            const basicParameters = method.argConvertors
                .map(it => {
                    if (it.useArray) {
                        const array = `${it.param}Serializer`
                        return `${it.param}Array: Uint8Array, ${array}Length: int32`
                    } else {
                        return `${it.param}: ${it.interopType(true)}`
                    }
                })
            let maybeReceiver = method.hasReceiver ? [`ptr: KPointer`] : []
            const parameters = maybeReceiver
                .concat(basicParameters)
                .join(", ")

            const implDecl = `_${component}_${method.methodName}(${parameters}): void`

            printers.nativeModule.print(implDecl)
            printers.nativeModuleEmpty.print(`${implDecl} { console.log("${method.methodName}") }`)
            this.declarationTable.setCurrentContext(undefined)
        })
    }

    printGlobal(printers: Printers) {
        this.methods.forEach(it => it.printGlobal(printers))
        this.printGlobalNativeModule(printers)
    }
}