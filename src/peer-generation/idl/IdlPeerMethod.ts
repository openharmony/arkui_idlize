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


import { capitalize, isDefined } from "../../util"
import { ArgConvertor, OptionConvertor, RetConvertor } from "./IdlArgConvertors"
import { Method, MethodModifier, mangleMethodName } from "../LanguageWriters"
import { PrimitiveType } from "../DeclarationTable"
import { IDLType } from "../../idl"

export class IdlPeerMethod {
    private overloadIndex?: number
    constructor(
        public originalParentName: string,
        public declarationTargets: IDLType[],
        public argConvertors: ArgConvertor[],
        // public retConvertor: RetConvertor,
        public isCallSignature: boolean,
        public method: Method,
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
    get retType(): string {
        return /*this.maybeCRetType(this.retConvertor) ??*/ "void"
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

    hasReceiver(): boolean {
        return !this.method.modifiers?.includes(MethodModifier.STATIC)
    }

    maybeCRetType(retConvertor: RetConvertor): string | undefined {
        if (retConvertor.isVoid) return undefined
        return retConvertor.nativeType()
    }

    generateAPIParameters(): string[] {
        const args = this.argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
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

    static markOverloads(methods: IdlPeerMethod[]): void {
        // for (const peerMethod of methods)
        //     peerMethod.isOverloaded = false

        for (const peerMethod of methods) {
            if (isDefined(peerMethod.overloadIndex)) continue
            const sameNamedMethods = methods.filter(it => it.method.name === peerMethod.method.name)
            if (sameNamedMethods.length > 1)
                sameNamedMethods.forEach((it, index) => it.overloadIndex = index)
        }
    }
}

// export class MethodSeparatorVisitor {
//     constructor(
//         protected readonly declarationTable: DeclarationTable,
//         protected readonly method: PeerMethod,
//     ) {}

//     protected onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {}
//     protected onPopUnionScope(argIndex: number) {}
//     protected onPushOptionScope(argIndex: number, target: DeclarationTarget, exists: boolean): void {}
//     protected onPopOptionScope(argIndex: number): void {}
//     protected onVisitInseparableArg(argIndex: number) {}
//     protected onVisitInseparable() {}

//     private visitArg(argIndex: number): void {
//         if (argIndex >= this.method.argConvertors.length) {
//             this.onVisitInseparable()
//             return
//         }

//         const visitor: StructVisitor = {
//             visitUnionField: (field: FieldRecord, selectorValue: number) => {
//                 this.onPushUnionScope(argIndex, field, selectorValue)
//                 this.declarationTable.visitDeclaration(field.declaration, visitor)
//                 this.onPopUnionScope(argIndex)
//             },
//             visitInseparable: () => {
//                 this.onVisitInseparableArg(argIndex)
//                 this.visitArg(argIndex + 1)
//             }
//         }
//         if (this.method.argConvertors[argIndex] instanceof OptionConvertor) {
//             // todo does we have optionals only on root?
//             const conv = this.method.argConvertors[argIndex] as OptionConvertor
//             const target = this.declarationTable.toTarget(conv.type)

//             this.onPushOptionScope(argIndex, target, true)
//             this.declarationTable.visitDeclaration(target, visitor)
//             this.onPopOptionScope(argIndex)

//             this.onPushOptionScope(argIndex, target, false)
//             visitor.visitInseparable()
//             this.onPopOptionScope(argIndex)
//         } else
//             this.declarationTable.visitDeclaration(this.method.declarationTargets[argIndex], visitor)
//     }

//     visit(): void {
//         this.visitArg(0)
//     }
// }