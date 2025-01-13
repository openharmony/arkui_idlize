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

import { capitalize, IDLType, isDefined } from '@idlize/core'
import { ArgConvertor } from "./ArgConvertors"
import { Method, MethodModifier } from "./LanguageWriters"
import { PrimitiveType } from "./ArkPrimitiveType"
import { mangleMethodName } from "./LanguageWriters/LanguageWriter"
import { IdlNameConvertor } from "./LanguageWriters/nameConvertor"
export class PeerMethod {
    private overloadIndex?: number
    constructor(
        public originalParentName: string,
        public argConvertors: ArgConvertor[],
        public returnType: IDLType,
        public isCallSignature: boolean,
        public method: Method,
        public outArgConvertor?: ArgConvertor,
    ) { }

    get overloadedName(): string {
        return mangleMethodName(this.method, this.overloadIndex)
    }
    get fullMethodName(): string {
        return this.isCallSignature ? this.overloadedName : this.peerMethodName
    }
    get peerMethodName() {
        const name = this.overloadedName
        if (!this.hasReceiver()) return name
        if (name.startsWith("set") ||
            name.startsWith("get")
        ) return name
        return `set${capitalize(name)}`
    }
    get implNamespaceName(): string {
        return `${capitalize(this.originalParentName)}Modifier`
    }
    get implName(): string {
        return `${capitalize(this.overloadedName)}Impl`
    }
    get toStringName(): string {
        return this.method.name
    }
    get dummyReturnValue(): string | undefined {
        return undefined
    }
    get receiverType(): string {
        return "Ark_NodeHandle"
    }
    get apiCall(): string {
        return "GetNodeModifiers()"
    }
    get apiKind(): string {
        return "Modifier"
    }
    get argAndOutConvertors(): ArgConvertor[] {
        return this.argConvertors.concat(this.outArgConvertor ?? [])
    }

    hasReceiver(): boolean {
        return !this.method.modifiers?.includes(MethodModifier.STATIC)
    }

    generateAPIParameters(converter:IdlNameConvertor): string[] {
        const args = this.argAndOutConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${converter.convert(it.nativeType())}${isPointer ? "*": ""} ${it.param}`
        })
        const receiver = this.generateReceiver()
        if (receiver) return [`${receiver.argType} ${receiver.argName}`, ...args]
        return args
    }

    generateReceiver(): {argName: string, argType: string} | undefined {
        if (!this.hasReceiver()) return undefined
        return {
            argName: "node",
            argType: PrimitiveType.NativePointer.getText()
        }
    }

    getImplementationName(): string {
        return this.originalParentName
    }

    static markAndGroupOverloads(methods: PeerMethod[]): PeerMethod[] {
        let groupedMethods: PeerMethod[] = []
        for (const peerMethod of methods) {
            if (isDefined(peerMethod.overloadIndex)) continue
            const sameNamedMethods = methods.filter(it => it.method.name === peerMethod.method.name)
            if (sameNamedMethods.length > 1)
                sameNamedMethods.forEach((it, index) => it.overloadIndex = index)
            groupedMethods = groupedMethods.concat(sameNamedMethods)
        }
        return groupedMethods
    }

    setSameOverloadIndex(copyFrom: PeerMethod) {
        this.overloadIndex = copyFrom.overloadIndex
    }
}
