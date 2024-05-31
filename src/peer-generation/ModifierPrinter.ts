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

import { IndentedPrinter } from "../IndentedPrinter";
import { DeclarationTable, DeclarationTarget, FieldRecord, PrimitiveType } from "./DeclarationTable";
import { modifierStructList, modifierStructs } from "./FileGenerators";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { MethodSeparatorVisitor, PeerMethod } from "./PeerMethod";
import { DelegateSignatureBuilder } from "./DelegatePrinter";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";

class MethodSeparatorPrinter extends MethodSeparatorVisitor {
    public readonly printer = new IndentedPrinter()
    constructor(
        declarationTable: DeclarationTable,
        method: PeerMethod,
    ) {
        super(declarationTable, method)
        this.delegateSignatureBuilder = new DelegateSignatureBuilder(declarationTable, method)
        this.accessChain = method.argConvertors.map((convertor, index) => [{
            name: convertor.param,
            type: method.declarationTargets[index],
            isPointerType: convertor.isPointerType(),
        }])
    }

    private readonly delegateSignatureBuilder: DelegateSignatureBuilder
    private readonly accessChain: {name: string, type: DeclarationTarget, isPointerType: boolean}[][]
    private generateAccessTo(argIndex: number, fieldName?: string) {
        const argAccessChain = this.accessChain[argIndex]
        if (argAccessChain[argAccessChain.length - 1].type === PrimitiveType.Undefined) {
            return `{}`
        }
        let resultAccess = argAccessChain[0].name
        for (let i = 1; i < argAccessChain.length; i++) {
            const fieldAccess = argAccessChain[i-1].isPointerType ? '->' : '.'
            resultAccess += `${fieldAccess}${argAccessChain[i].name}`
        } 
        
        if (fieldName) {
            const fieldAccess = argAccessChain[argAccessChain.length-1].isPointerType ? '->' : '.'
            resultAccess += `${fieldAccess}${fieldName}`
        }
        return resultAccess
    }

    protected override onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {
        super.onPushUnionScope(argIndex, field, selectorValue)
        this.printer.print(`if (${this.generateAccessTo(argIndex, 'selector')} == ${selectorValue}) {`)
        this.printer.pushIndent()
        this.accessChain[argIndex].push({
            name: field.name,
            type: field.declaration,
            isPointerType: false
        })
        this.delegateSignatureBuilder.pushUnionScope(argIndex, field)
    }

    protected override onPopUnionScope(argIndex: number): void {
        super.onPopUnionScope(argIndex)
        this.accessChain[argIndex].pop()
        this.printer.popIndent()
        this.printer.print('}')
        this.delegateSignatureBuilder.popScope(argIndex)
    }

    protected override onPushOptionScope(argIndex: number, target: DeclarationTarget, exists: boolean): void {
        super.onPushOptionScope(argIndex, target, exists)
        if (exists) {
            this.printer.print(`if (${this.generateAccessTo(argIndex, 'tag')} != ${PrimitiveType.UndefinedTag}) {`)
            this.accessChain[argIndex].push({
                name: "value",
                type: target,
                isPointerType: false,
            })
        } else {
            this.printer.print(`if (${this.generateAccessTo(argIndex, 'tag')} == ${PrimitiveType.UndefinedTag}) {`)
            this.accessChain[argIndex].push({
                name: "UNDEFINED",
                type: PrimitiveType.Undefined,
                isPointerType: false,
            })
        }
        this.printer.pushIndent()
        this.delegateSignatureBuilder.pushOptionScope(argIndex, target, exists)
    }

    protected override onPopOptionScope(argIndex: number): void {
        super.onPopUnionScope(argIndex)
        this.accessChain[argIndex].pop()
        this.printer.popIndent()
        this.printer.print('}')
        this.delegateSignatureBuilder.popScope(argIndex)
    }

    protected generateInseparableFieldName(argIndex: number) {
        return `arg${argIndex}_inseparable_value`
    }

    onVisitInseparableArg(argIndex: number): void {
        super.onVisitInseparableArg(argIndex)
        const argChain = this.accessChain[argIndex]
        const arg = argChain[argChain.length - 1]
        const type = this.declarationTable.computeTargetName(arg.type, false)
        const maybePointer = arg.isPointerType 
            ? '*' 
            : arg.type !== PrimitiveType.Undefined ? '&' : ''
        this.printer.print(`const ${type} ${maybePointer}${this.generateInseparableFieldName(argIndex)} = ${this.generateAccessTo(argIndex)};`)
    }

    onVisitInseparable(): void {
        super.onVisitInseparable()
        const delegateIdentifier = this.delegateSignatureBuilder.buildIdentifier()
        let delegateArgs = Array.from({length: this.method.argConvertors.length}, (_, argIndex) => {
            return this.generateInseparableFieldName(argIndex)
        })
        if (this.method.hasReceiver())
            delegateArgs = [this.method.generateReceiver()!.argName, ...delegateArgs]
        this.printer.print(`${delegateIdentifier}(${delegateArgs.join(', ')});`)
    }
}

export class ModifierVisitor {
    dummy = new IndentedPrinter()
    real = new IndentedPrinter()
    modifiers = new IndentedPrinter()
    modifierList = new IndentedPrinter()
    accessorList = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary,
    ) { }

    printDummyImplFunctionBody(method: PeerMethod) {
        this.dummy.print(`string out("${method.toStringName}(");`)
        method.argConvertors.forEach((argConvertor, index) => {
            if (index > 0) this.dummy.print(`out.append(", ");`)
            this.dummy.print(`WriteToString(&out, ${argConvertor.param});`)
        })
        this.dummy.print(`out.append(")");`)
        const retVal = method.dummyReturnValue
        if (retVal  !== undefined) {
            this.dummy.print(`out.append("[return ${retVal}]");`)
        }
        this.dummy.print(`appendGroupedLog(1, out);`)
        this.printReturnStatement(this.dummy, method, retVal)
    }

    printModifierImplFunctionBody(method: PeerMethod) {
        const visitor = new MethodSeparatorPrinter(
            this.library.declarationTable,
            method
        )
        visitor.visit()
        visitor.printer.getOutput().forEach(it => this.real.print(it))
        this.printReturnStatement(this.real, method)
    }

    private printReturnStatement(printer: IndentedPrinter, method: PeerMethod, returnValue: string | undefined = undefined) {
        if (!method.retConvertor.isVoid) {
            printer.print(`return ${returnValue?? "0"};`)
        }
    }

    printMethodProlog(printer: IndentedPrinter, method: PeerMethod) {
        const apiParameters = method.generateAPIParameters().join(", ")
        const signature = `${method.retType} ${method.implName}(${apiParameters}) {`
        printer.print(signature)
        printer.pushIndent()
    }

    printMethodEpilog(printer: IndentedPrinter) {
        printer.popIndent()
        printer.print(`}`)
    }

    printRealAndDummyModifier(method: PeerMethod) {
        this.printMethodProlog(this.dummy, method)
        this.printMethodProlog(this.real, method)
        this.printDummyImplFunctionBody(method)
        this.printModifierImplFunctionBody(method)
        this.printMethodEpilog(this.dummy)
        this.printMethodEpilog(this.real)

        this.modifiers.print(`${method.implName},`)
    }

    printClassProlog(clazz: PeerClass) {
        const component = clazz.componentName
        const modifierStructImpl = `ArkUI${component}ModifierImpl`

        this.modifiers.print(`${PeerGeneratorConfig.cppPrefix}ArkUI${component}Modifier ${modifierStructImpl} {`)
        this.modifiers.pushIndent()

        this.modifierList.pushIndent()
        this.modifierList.print(`Get${component}Modifier,`)
        this.modifierList.popIndent()
    }

    printClassEpilog(clazz: PeerClass) {
        this.modifiers.popIndent()
        this.modifiers.print(`};\n`)
        const name = clazz.componentName
        this.modifiers.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${name}Modifier* Get${name}Modifier() { return &ArkUI${name}ModifierImpl; }\n\n`)
    }

    // TODO: have a proper Peer module visitor
    printRealAndDummyModifiers() {
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => {
                this.printClassProlog(clazz)
                clazz.methods.forEach(method => this.printRealAndDummyModifier(method))
                this.printClassEpilog(clazz)
            })
        })
    }
}

export function printRealAndDummyModifiers(peerLibrary: PeerLibrary): {dummy: string, real: string} {
    const visitor = new ModifierVisitor(peerLibrary)
    visitor.printRealAndDummyModifiers()

    const dummy =
        visitor.dummy.getOutput().join("\n") +
        modifierStructs(visitor.modifiers.getOutput()) +
        modifierStructList(visitor.modifierList.getOutput())

    const real =
        visitor.real.getOutput().join("\n") +
        modifierStructs(visitor.modifiers.getOutput()) +
        modifierStructList(visitor.modifierList.getOutput())
    return {dummy, real}
}