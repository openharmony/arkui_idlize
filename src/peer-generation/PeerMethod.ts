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


import { Language, capitalize } from "../util"
import { ArgConvertor, OptionConvertor, RetConvertor } from "./Convertors"
import { Method, MethodModifier, NamedMethodSignature } from "./LanguageWriters"
import { DeclarationTable, DeclarationTarget, FieldRecord, PrimitiveType, StructVisitor } from "./DeclarationTable"

export class PeerMethod {
    constructor(
        public originalParentName: string,
        public declarationTargets: DeclarationTarget[],
        public argConvertors: ArgConvertor[],
        public retConvertor: RetConvertor,
        public isCallSignature: boolean,
        public method: Method
    ) { }

    public hasReceiver(): boolean {
        return !this.method.modifiers?.includes(MethodModifier.STATIC)
    }

    // TODO: remove these 3 methods
    public mappedParams(language: Language): string[] {
        return this.method.signature.args.map((it, index) => `${this.method.signature.argName(index)}${it.nullable ? "?" : ""}: ${it.name}`)
    }

    public mappedParamValues(language: Language): string[] {
        return this.method.signature.args.map((it, index) => this.method.signature.argName(index))
    }

    public mappedParamsTypes(language: Language): string[] {
        return this.method.signature.args.map(it => `${it.name}`)
    }

    get fullMethodName(): string {
        return this.isCallSignature ? this.method.name : this.peerMethodName
    }

    get peerMethodName() {
        const name = this.method.name
        if (!this.hasReceiver()) return name
        if (name.startsWith("set") ||
            name.startsWith("get") ||
            name.startsWith("_set")
        ) return name
        return `set${capitalize(name)}`
    }

    get implName(): string {
        return `${capitalize(this.originalParentName)}_${capitalize(this.fullMethodName)}Impl`
    }

    get retType(): string {
        return this.maybeCRetType(this.retConvertor) ?? "void"
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
}

export class MethodSeparatorVisitor {
    constructor(
        protected readonly declarationTable: DeclarationTable,
        protected readonly method: PeerMethod,
    ) {}

    protected onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {}
    protected onPopUnionScope(argIndex: number) {}
    protected onVisitInseparableArg(argIndex: number) {}
    protected onVisitInseparable() {}

    private visitArg(argIndex: number): void {
        if (argIndex >= this.method.argConvertors.length) {
            this.onVisitInseparable()
            return
        }
        
        const visitor: StructVisitor = {
            visitUnionField: (field: FieldRecord, selectorValue: number) => {
                this.onPushUnionScope(argIndex, field, selectorValue)
                this.declarationTable.visitDeclaration(field.declaration, visitor)
                this.onPopUnionScope(argIndex)
            },
            visitInseparable: () => {
                this.onVisitInseparableArg(argIndex)
                this.visitArg(argIndex + 1)
            }
        }
        // TODO we cannot process optionals for now
        if (this.method.argConvertors[argIndex] instanceof OptionConvertor)
            visitor.visitInseparable()
        else
            this.declarationTable.visitDeclaration(this.method.declarationTargets[argIndex], visitor)
    }

    visit(): void {
        this.visitArg(0)
    }
}