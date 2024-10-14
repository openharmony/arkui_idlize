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
import { OptionConvertor } from "./Convertors"
import { DeclarationTable, DeclarationTarget, FieldRecord, StructVisitor } from "./DeclarationTable"
import { PeerMethod } from "./PeerMethod"

export class MethodSeparatorVisitor {
    constructor(
        protected readonly declarationTable: DeclarationTable,
        protected readonly method: PeerMethod,
    ) {}

    protected onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {}
    protected onPopUnionScope(argIndex: number) {}
    protected onPushOptionScope(argIndex: number, target: DeclarationTarget, exists: boolean): void {}
    protected onPopOptionScope(argIndex: number): void {}
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
        if (this.method.argConvertors[argIndex] instanceof OptionConvertor) {
            // todo does we have optionals only on root?
            const conv = this.method.argConvertors[argIndex] as OptionConvertor
            const target = this.declarationTable.toTarget(conv.type)

            this.onPushOptionScope(argIndex, target, true)
            this.declarationTable.visitDeclaration(target, visitor)
            this.onPopOptionScope(argIndex)

            this.onPushOptionScope(argIndex, target, false)
            visitor.visitInseparable()
            this.onPopOptionScope(argIndex)
        } else
            this.declarationTable.visitDeclaration(this.method.declarationTargets[argIndex], visitor)
    }

    visit(): void {
        this.visitArg(0)
    }
}