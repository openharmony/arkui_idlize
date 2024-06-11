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

import * as fs from "fs"
import * as path from "path"

import { IndentedPrinter } from "../IndentedPrinter";
import { DeclarationTable, DeclarationTarget, FieldRecord, PrimitiveType } from "./DeclarationTable";
import { accessorStructList, cStyleCopyright, completeModufiersContent as completeModifiersContent, modifierStructList, warning } from "./FileGenerators";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { MethodSeparatorVisitor, PeerMethod } from "./PeerMethod";
import { DelegateSignatureBuilder } from "./DelegatePrinter";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { MaterializedClass, MaterializedMethod } from "./Materialized";
import { Language } from "../util";
import { CppLanguageWriter, createLanguageWriter, LanguageWriter } from "./LanguageWriters";
import { LibaceInstall } from "../CopyPeers";

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
    dummy = createLanguageWriter(Language.CPP)
    real = createLanguageWriter(Language.CPP)
    modifiers = createLanguageWriter(Language.CPP)
    getterDeclarations = createLanguageWriter(Language.CPP)
    modifierList = createLanguageWriter(Language.CPP)

    constructor(
        protected library: PeerLibrary,
    ) { }

    printDummyImplFunctionBody(method: PeerMethod) {
        let _ = this.dummy
        _.writeStatement(
            _.makeCondition(
                _.makeString("!needGroupedLog(1)"),
                _.makeReturn(
                    method.retConvertor.isVoid ? undefined : _.makeString(method.dummyReturnValue ?? "0"))))
        _.print(`string out("${method.toStringName}(");`)
        method.argConvertors.forEach((argConvertor, index) => {
            if (index > 0) this.dummy.print(`out.append(", ");`)
            _.print(`WriteToString(&out, ${argConvertor.param});`)
        })
        _.print(`out.append(")");`)
        const retVal = method.dummyReturnValue
        if (retVal  !== undefined) {
            _.print(`out.append("[return ${retVal}]");`)
        }
        _.print(`appendGroupedLog(1, out);`)
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

    private printReturnStatement(printer: LanguageWriter, method: PeerMethod, returnValue: string | undefined = undefined) {
        if (!method.retConvertor.isVoid) {
            printer.print(`return ${returnValue ?? "0"};`)
        }
    }

    printMethodProlog(printer: LanguageWriter, method: PeerMethod) {
        const apiParameters = method.generateAPIParameters().join(", ")
        const signature = `${method.retType} ${method.implName}(${apiParameters}) {`
        printer.print(signature)
        printer.pushIndent()
    }

    printMethodEpilog(printer: LanguageWriter) {
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
        this.getterDeclarations.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${name}Modifier* Get${name}Modifier();`)
    }

    printPeerClassModifiers(clazz: PeerClass) {
        this.printClassProlog(clazz)
        clazz.methods.forEach(method => this.printRealAndDummyModifier(method))
        this.printClassEpilog(clazz)
    }

    // TODO: have a proper Peer module visitor
    printRealAndDummyModifiers() {
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => this.printPeerClassModifiers(clazz))
        })
    }
}

class AccessorVisitor extends ModifierVisitor {
    accessors = createLanguageWriter(Language.CPP)
    accessorList = createLanguageWriter(Language.CPP)

    constructor(library: PeerLibrary) {
        super(library)
    }

    override printRealAndDummyModifiers() {
        super.printRealAndDummyModifiers()
        this.library.materializedClasses.forEach(c => this.printRealAndDummyAccessor(c))
    }

    printRealAndDummyAccessor(clazz: MaterializedClass) {
        this.accessorList.pushIndent()
        this.printMaterializedClassProlog(clazz);
        [clazz.ctor, clazz.finalizer].concat(clazz.methods).forEach(method => {
            this.printMaterializedMethod(this.dummy, method, m => this.printDummyImplFunctionBody(m))
            this.printMaterializedMethod(this.real, method, m => this.printModifierImplFunctionBody(m))
            this.accessors.print(`${method.originalParentName}_${method.overloadedName},`)
        })
        this.printMaterializedClassEpilog(clazz)
        this.accessorList.popIndent()
    }

    printMaterializedClassProlog(clazz: MaterializedClass) {
        const accessor = `${clazz.className}Accessor`
        this.accessors.print(`${PeerGeneratorConfig.cppPrefix}ArkUI${accessor} ${accessor}Impl {`)
        this.accessors.pushIndent()
        this.accessorList.print(`Get${accessor},`)
    }

    printMaterializedClassEpilog(clazz: MaterializedClass) {
        this.accessors.popIndent()
        this.accessors.print(`};\n`)
        const accessor = `${clazz.className}Accessor`
        this.accessors.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${accessor}* Get${accessor}() { return &${accessor}Impl; }\n\n`)
        this.getterDeclarations.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${accessor}* Get${accessor}();`)
    }

    printMaterializedMethod(printer: LanguageWriter, method: MaterializedMethod, printBody: (m: MaterializedMethod) => void) {
        this.printMethodProlog(printer, method)
        printBody(method)
        this.printMethodEpilog(printer)
    }
}

class MultiFileModifiersVisitorState {
    dummy = createLanguageWriter(Language.CPP)
    real = createLanguageWriter(Language.CPP)
    accessorList = createLanguageWriter(Language.CPP)
    accessors = createLanguageWriter(Language.CPP)
    modifierList = createLanguageWriter(Language.CPP)
    modifiers = createLanguageWriter(Language.CPP)
    getterDeclarations = createLanguageWriter(Language.CPP)
}

class MultiFileModifiersVisitor extends AccessorVisitor {
    private stateByFile = new Map<string, MultiFileModifiersVisitorState>()

    printPeerClassModifiers(clazz: PeerClass): void {
        this.onFileStart(clazz.componentName.toLowerCase())
        super.printPeerClassModifiers(clazz)
        this.onFileEnd()
    }

    onFileStart(slug: string) {
        let state = this.stateByFile.get(slug)
        if (!state) {
            state = new MultiFileModifiersVisitorState()
            this.stateByFile.set(slug, state)
        }
        this.dummy = state.dummy
        this.real = state.real
        this.accessors = state.accessors
        this.accessorList = state.accessorList
        this.modifiers = state.modifiers
        this.modifierList = state.modifierList
        this.getterDeclarations = state.getterDeclarations
    }

    onFileEnd() {
    }

    printRealAndDummyAccessor(clazz: MaterializedClass): void {
        this.onFileStart(clazz.className.toLowerCase())
        super.printRealAndDummyAccessor(clazz)
        this.onFileEnd()
    }

    emitRealSync(libace: LibaceInstall, options: ModifierFileOptions): void {
        const modifierList = createLanguageWriter(Language.CPP)
        const accessorList = createLanguageWriter(Language.CPP)
        const getterDeclarations = createLanguageWriter(Language.CPP)

        for (const [slug, state] of this.stateByFile) {
            const filePath = libace.modifierCpp(slug)
            printModifiersImplFile(filePath, slug, state, options)
            modifierList.concat(state.modifierList)
            accessorList.concat(state.accessorList)
            getterDeclarations.concat(state.getterDeclarations)
        }

        const commonFilePath = libace.allModifiers
        const commonFileContent = getterDeclarations
            .concat(modifierStructList(modifierList))
            .concat(accessorStructList(accessorList))

        printModifiersCommonImplFile(commonFilePath, commonFileContent, options);
    }
}

export function printRealAndDummyModifiers(peerLibrary: PeerLibrary): {dummy: LanguageWriter, real: LanguageWriter} {
    const visitor = new ModifierVisitor(peerLibrary)
    visitor.printRealAndDummyModifiers()
    const dummy =
        visitor.dummy.concat(visitor.modifiers).concat(modifierStructList(visitor.modifierList))
    const real =
        visitor.real.concat(visitor.modifiers).concat(modifierStructList(visitor.real))
    return {dummy, real}
}

export function printRealAndDummyAccessors(peerLibrary: PeerLibrary): {dummy: LanguageWriter, real: LanguageWriter} {
    const visitor = new AccessorVisitor(peerLibrary)
    peerLibrary.materializedClasses.forEach(c => visitor.printRealAndDummyAccessor(c))

    const dummy =
        visitor.dummy.concat(visitor.accessors).concat(accessorStructList(visitor.accessorList))

    const real =
        visitor.real.concat(visitor.accessors).concat(accessorStructList(visitor.accessorList))
    return {dummy, real}
}

export interface ModifierFileOptions {
    basicVersion: number;
    fullVersion: number;
    extendedVersion: number;

    namespace?: string
}

export function printRealModifiersAsMultipleFiles(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions) {
    const visitor = new MultiFileModifiersVisitor(library)
    visitor.printRealAndDummyModifiers()
    visitor.emitRealSync(libace, options)
}

function printModifiersImplFile(filePath: string, slug: string, state: MultiFileModifiersVisitorState, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter())
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude("Interop.h")
    writer.writeInclude("Serializers.h")
    writer.writeInclude(`${slug}_delegates.h`)
    writer.print("")

    if (options.namespace) {
        writer.pushNamespace(options.namespace)
    }

    writer.concat(state.real)
    writer.concat(state.modifiers)

    if (options.namespace) {
        writer.popNamespace()
    }

    writer.print("")
    writer.printTo(filePath)
}

function printModifiersCommonImplFile(filePath: string, content: LanguageWriter, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter())
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude("Interop.h")
    writer.writeInclude("Serializers.h")
    writer.print("")

    if (options.namespace) {
        writer.pushNamespace(options.namespace)
    }

    writer.concat(completeModifiersContent(content, options.basicVersion, options.fullVersion, options.extendedVersion))

    if (options.namespace) {
        writer.popNamespace()
    }

    writer.print("")
    writer.printTo(filePath)
}