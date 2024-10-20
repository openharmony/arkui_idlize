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
import { capitalize } from "../util"
import { ArgConvertor, RetConvertor } from "./ArgConvertors"
import { Method, MethodModifier } from "./LanguageWriters/LanguageWriter"
import { DeclarationTarget } from "./DeclarationTable"
import { PrimitiveType } from "./ArkPrimitiveType"
import { mangleMethodName } from "./LanguageWriters/LanguageWriter"

export class PeerMethod {
    constructor(
        public originalParentName: string,
        public declarationTargets: DeclarationTarget[],
        public argConvertors: ArgConvertor[],
        public retConvertor: RetConvertor,
        public isCallSignature: boolean,
        public isOverloaded: boolean,
        public method: Method,
        public index: number,
    ) { }

    public hasReceiver(): boolean {
        return !this.method.modifiers?.includes(MethodModifier.STATIC)
    }

    get overloadedName(): string {
        return this.isOverloaded ? mangleMethodName(this.method, this.index) : this.method.name
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

    get retType(): string {
        return this.maybeCRetType(this.retConvertor) ?? "void"
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

    maybeCRetType(retConvertor: RetConvertor): string | undefined {
        if (retConvertor.isVoid) return undefined
        return retConvertor.nativeType()
    }

    generateAPIParameters(): string[] {
        const args = this.argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}/*OLD ${it.constructor.name}}*/${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
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

    static markOverloads(methods: PeerMethod[]): void {
        for (const peerMethod of methods)
            peerMethod.isOverloaded = false

        for (const peerMethod of methods) {
            if (peerMethod.isOverloaded) continue
            const sameNamedMethods = methods.filter(it => it.method.name === peerMethod.method.name)
            if (sameNamedMethods.length <= 1) continue
            sameNamedMethods.forEach((method) => method.isOverloaded = true)
        }
    }
}
