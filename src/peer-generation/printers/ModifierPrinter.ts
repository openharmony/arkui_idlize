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

import { IndentedPrinter } from "../../IndentedPrinter";
import { DeclarationTable, DeclarationTarget, FieldRecord } from "../DeclarationTable";
import { PrimitiveType } from "../ArkPrimitiveType"
import { accessorStructList,
         cStyleCopyright,
         completeModifiersContent,
         appendModifiersCommonPrologue,
         appendViewModelBridge,
         makeFileNameFromClassName,
         modifierStructList,
         warning } from "../FileGenerators";
import { PeerClass } from "../PeerClass";
import { PeerLibrary } from "../PeerLibrary";
import { MethodSeparatorVisitor, PeerMethod } from "../PeerMethod";
import { DelegateSignatureBuilder } from "./DelegatePrinter";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { MaterializedClass, MaterializedMethod } from "../Materialized";
import { Language, groupBy } from "../../util";
import { CppLanguageWriter, createLanguageWriter, LanguageWriter, printMethodDeclaration } from "../LanguageWriters";
import { LibaceInstall } from "../../Install";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { IdlPeerClass } from "../idl/IdlPeerClass";
import { IdlPeerMethod } from "../idl/IdlPeerMethod";

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
        protected library: PeerLibrary | IdlPeerLibrary,
    ) { }

    printDummyImplFunctionBody(method: PeerMethod | IdlPeerMethod) {
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

    printModifierImplFunctionBody(method: PeerMethod | IdlPeerMethod, clazz: PeerClass | IdlPeerClass | undefined = undefined) {
        if (this.library instanceof PeerLibrary) {
            const visitor = new MethodSeparatorPrinter(
                this.library.declarationTable,
                method as PeerMethod
            )
            visitor.visit()
        }
        this.printBodyImplementation(this.real, method, clazz)
        this.printReturnStatement(this.real, method)
    }

    private printReturnStatement(printer: LanguageWriter, method: PeerMethod | IdlPeerMethod, returnValue: string | undefined = undefined) {
        if (!method.retConvertor.isVoid) {
            printer.print(`return ${returnValue ?? "0"};`)
        }
    }

    private printBodyImplementation(printer: LanguageWriter, method: PeerMethod | IdlPeerMethod,
        clazz: PeerClass | IdlPeerClass | undefined = undefined) {
        const apiParameters = method.generateAPIParameters()
        if (apiParameters.at(0)?.includes(PrimitiveType.NativePointer.getText())) {
            this.real.print(`auto frameNode = reinterpret_cast<FrameNode *>(node);`)
            this.real.print(`CHECK_NULL_VOID(frameNode);`)
            if (method.argConvertors.length === 1 && method.argConvertors.at(0)?.nativeType(false)
                .includes(PrimitiveType.String.getText())) {
                this.real.print(`CHECK_NULL_VOID(${
                    method.argConvertors.at(0)?.param
                });`)
                this.real.print(`[[maybe_unused]]`)
                this.real.print(`auto convValue = Converter::Convert<std::string>(*${
                    method.argConvertors.at(0)?.param
                });`)
            } else if (method.argConvertors.length === 1 && method.argConvertors.at(0)?.nativeType(false)
                .includes(PrimitiveType.OptionalPrefix) && method.argConvertors.at(0)?.isPointerType()) {
                this.real.print(`//auto convValue = ${method.argConvertors.at(0)?.param} ? ` +
                    `Converter::OptConvert<type>(*${method.argConvertors.at(0)?.param}) : std::nullopt;`)
            } else if (method.argConvertors.length === 1 && method.argConvertors.at(0)?.isPointerType()) {
                this.real.print(`CHECK_NULL_VOID(${
                    method.argConvertors.at(0)?.param
                });`)
                this.real.print(`//auto convValue = Converter::OptConvert<type_name>(*${
                    method.argConvertors.at(0)?.param
                });`)
            } else if (method.argConvertors.length === 1 && method.argConvertors.at(0)?.nativeType(false)
                .includes(PrimitiveType.Boolean.getText())) {
                this.real.print(`[[maybe_unused]]`)
                this.real.print(`auto convValue = Converter::Convert<bool>(${
                    method.argConvertors.at(0)?.param
                });`)
            } else if (method.argConvertors.length === 1 && method.argConvertors.at(0)?.nativeType(false)
                .includes(PrimitiveType.Function.getText())) {
                this.real.print(`//auto convValue = [frameNode](input values) { code }`)
            } else {
                this.real.print(`//auto convValue = Converter::Convert<type>(${
                    method.argConvertors.at(0)?.param
                });`)
                this.real.print(`//auto convValue = Converter::OptConvert<type>(${
                    method.argConvertors.at(0)?.param
                }); // for enums `)
            }
            this.real.print(`//${clazz?.componentName}ModelNG::Set${method.implName.replace("Impl", "")}(frameNode, convValue);`)
        }
    }

    printMethodProlog(printer: LanguageWriter, method: PeerMethod | IdlPeerMethod) {
        const apiParameters = method.generateAPIParameters()
        printMethodDeclaration(printer.printer, method.retType, method.implName, apiParameters)
        printer.print("{")
        printer.pushIndent()
    }

    printMethodEpilog(printer: LanguageWriter) {
        printer.popIndent()
        printer.print(`}`)
    }

    printRealAndDummyModifier(method: PeerMethod | IdlPeerMethod, clazz: PeerClass | IdlPeerClass) {
        this.printMethodProlog(this.dummy, method)
        this.printMethodProlog(this.real, method)
        this.printDummyImplFunctionBody(method)
        this.printModifierImplFunctionBody(method, clazz)
        this.printMethodEpilog(this.dummy)
        this.printMethodEpilog(this.real)

        this.modifiers.print(`${method.implNamespaceName}::${method.implName},`)
    }

    printClassProlog(clazz: PeerClass | IdlPeerClass) {
        const component = clazz.componentName
        const modifierStructImpl = `ArkUI${component}ModifierImpl`

        this.modifiers.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${component}Modifier* Get${component}Modifier()`)
        this.modifiers.print("{")
        this.modifiers.pushIndent()
        this.modifiers.print(`static const ${PeerGeneratorConfig.cppPrefix}ArkUI${component}Modifier ${modifierStructImpl} {`)
        this.modifiers.pushIndent()

        this.modifierList.print(`Get${component}Modifier,`)
    }

    printClassEpilog(clazz: PeerClass | IdlPeerClass) {
        const name = clazz.componentName
        const modifierStructImpl = `ArkUI${name}ModifierImpl`

        this.modifiers.popIndent()
        this.modifiers.print(`};`)
        this.modifiers.print(`return &${modifierStructImpl};`)
        this.modifiers.popIndent()
        this.modifiers.print(`}\n`)

        this.getterDeclarations.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${name}Modifier* Get${name}Modifier();`)
    }

    pushNamespace(namespaceName: string, ident: boolean = true) {
        this.real.print(`namespace ${namespaceName} {`)
        this.dummy.print(`namespace ${namespaceName} {`)
        if (ident) {
            this.real.pushIndent()
            this.dummy.pushIndent()
        }
    }

    popNamespace(namespaceName: string, ident: boolean = true) {
        if (ident) {
            this.real.popIndent()
            this.dummy.popIndent()
        }
        this.real.print(`} // ${namespaceName}`)
        this.dummy.print(`} // ${namespaceName}`)
    }

    printPeerClassModifiers(clazz: PeerClass | IdlPeerClass) {
        this.printClassProlog(clazz)
        // TODO: move to Object.groupBy when move to nodejs 21
        const namespaces: Map<string, PeerMethod[] | IdlPeerMethod[]> = clazz instanceof PeerClass
            ? groupBy(clazz.methods, it => it.implNamespaceName)
            : groupBy(clazz.methods, it => it.implNamespaceName)
        Array.from(namespaces.keys()).forEach (namespaceName => {
            this.pushNamespace(namespaceName, false)
            namespaces.get(namespaceName)?.forEach(
                method => this.printRealAndDummyModifier(method, clazz)
            )
            this.popNamespace(namespaceName, false)
        })
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

    constructor(library: PeerLibrary | IdlPeerLibrary) {
        super(library)
    }

    override printRealAndDummyModifiers() {
        super.printRealAndDummyModifiers()
        this.library.materializedClasses.forEach(c => this.printRealAndDummyAccessor(c))
    }

    printRealAndDummyAccessor(clazz: MaterializedClass) {
        this.printMaterializedClassProlog(clazz)
        // Materialized class methods share the same namespace
        // so take the first one.
        const namespaceName = clazz.methods[0].implNamespaceName
        this.pushNamespace(namespaceName, false);
        [clazz.ctor, clazz.finalizer].concat(clazz.methods).forEach(method => {
            this.printMaterializedMethod(this.dummy, method, m => this.printDummyImplFunctionBody(m))
            this.printMaterializedMethod(this.real, method, m => this.printModifierImplFunctionBody(m))
            this.accessors.print(`${method.implNamespaceName}::${method.implName},`)
        })
        this.popNamespace(namespaceName, false)
        this.printMaterializedClassEpilog(clazz)
    }

    printMaterializedClassProlog(clazz: MaterializedClass) {
        const accessor = `${clazz.className}Accessor`
        this.accessors.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${accessor}* Get${accessor}()`)
        this.accessors.print("{")
        this.accessors.pushIndent()
        this.accessors.print(`static const ${PeerGeneratorConfig.cppPrefix}ArkUI${accessor} ${accessor}Impl {`)
        this.accessors.pushIndent()
        this.accessorList.print(`Get${accessor},`)
    }

    printMaterializedClassEpilog(clazz: MaterializedClass) {
        const accessor = `${clazz.className}Accessor`
        this.accessors.popIndent()
        this.accessors.print(`};`)
        this.accessors.print(`return &${accessor}Impl;`)
        this.accessors.popIndent()
        this.accessors.print(`}\n`)
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
    hasModifiers = false
    hasAccessors = false
}

class MultiFileModifiersVisitor extends AccessorVisitor {
    private stateByFile = new Map<string, MultiFileModifiersVisitorState>()
    private hasModifiers = false
    private hasAccessors = false

    printPeerClassModifiers(clazz: PeerClass): void {
        this.onFileStart(clazz.componentName)
        this.hasModifiers = true
        super.printPeerClassModifiers(clazz)
        this.onFileEnd(clazz.componentName)
    }

    onFileStart(className: string) {
        const slug = makeFileNameFromClassName(className)
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
        this.hasModifiers = false
        this.hasAccessors = false
    }

    onFileEnd(className: string) {
        const slug = makeFileNameFromClassName(className)
        const state = this.stateByFile.get(slug)!
        state.hasModifiers = this.hasModifiers
        state.hasAccessors = this.hasAccessors
    }

    printRealAndDummyAccessor(clazz: MaterializedClass): void {
        this.onFileStart(clazz.className)
        this.hasAccessors = true
        super.printRealAndDummyAccessor(clazz)
        this.onFileEnd(clazz.className)
    }

    emitRealSync(library: PeerLibrary | IdlPeerLibrary, libace: LibaceInstall, options: ModifierFileOptions): void {
        const modifierList = createLanguageWriter(Language.CPP)
        const accessorList = createLanguageWriter(Language.CPP)
        const getterDeclarations = createLanguageWriter(Language.CPP)

        for (const [slug, state] of this.stateByFile) {
            if (state.hasModifiers)
                printModifiersImplFile(libace.modifierCpp(slug), state, options)
            if (state.hasAccessors)
                printModifiersImplFile(libace.accessorCpp(slug), state, options)
            modifierList.concat(state.modifierList)
            accessorList.concat(state.accessorList)
            getterDeclarations.concat(state.getterDeclarations)
        }

        const commonFilePath = libace.allModifiers
        const commonFileContent = getterDeclarations
            .concat(modifierStructList(modifierList))
            .concat(accessorStructList(accessorList))

        printModifiersCommonImplFile(commonFilePath, commonFileContent, options)
        printApiImplFile(library, libace.viewModelBridge, options)
    }
}

export function printRealAndDummyModifiers(peerLibrary: PeerLibrary | IdlPeerLibrary): {dummy: LanguageWriter, real: LanguageWriter} {
    const visitor = new ModifierVisitor(peerLibrary)
    visitor.printRealAndDummyModifiers()
    const dummy =
        visitor.dummy.concat(visitor.modifiers).concat(modifierStructList(visitor.modifierList))
    const real =
        visitor.real.concat(visitor.modifiers).concat(modifierStructList(visitor.modifierList))
    return {dummy, real}
}

export function printRealAndDummyAccessors(peerLibrary: PeerLibrary | IdlPeerLibrary): {dummy: LanguageWriter, real: LanguageWriter} {
    const visitor = new AccessorVisitor(peerLibrary)
    peerLibrary.materializedClasses.forEach(c => visitor.printRealAndDummyAccessor(c))

    const dummy =
        visitor.dummy.concat(visitor.accessors).concat(accessorStructList(visitor.accessorList))

    const real =
        visitor.real.concat(visitor.accessors).concat(accessorStructList(visitor.accessorList))
    return {dummy, real}
}

export interface Namespaces {
    generated: string,
    base: string
}

export interface ModifierFileOptions {
    basicVersion: number;
    fullVersion: number;
    extendedVersion: number;

    namespaces?: Namespaces
}

export function printRealModifiersAsMultipleFiles(library: PeerLibrary | IdlPeerLibrary, libace: LibaceInstall, options: ModifierFileOptions) {
    const visitor = new MultiFileModifiersVisitor(library)
    visitor.printRealAndDummyModifiers()
    visitor.emitRealSync(library, libace, options)
}

function printModifiersImplFile(filePath: string, state: MultiFileModifiersVisitorState, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter())
    writer.writeLines(cStyleCopyright)

    writer.writeInclude(`core/components_ng/base/frame_node.h`)
    writer.writeInclude(`core/interfaces/arkoala/utility/converter.h`)
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, false)
    }

    writer.concat(state.real)
    writer.concat(state.modifiers)
    writer.concat(state.accessors)

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.print("")
    writer.printTo(filePath)
}

function printModifiersCommonImplFile(filePath: string, content: LanguageWriter, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter())
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude('arkoala-macros.h')
    writer.writeInclude('core/interfaces/arkoala/arkoala_api.h')
    writer.writeInclude('node_api.h')
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.base, false)
    }
    writer.concat(appendModifiersCommonPrologue())

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, false)
    }

    writer.concat(completeModifiersContent(content, options.basicVersion, options.fullVersion, options.extendedVersion))

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.print("")
    writer.printTo(filePath)
}

function printApiImplFile(library: PeerLibrary | IdlPeerLibrary, filePath: string, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter())
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude('core/interfaces/arkoala/arkoala_api.h')
    writer.writeInclude('arkoala_api_generated.h')
    writer.writeInclude('base/utils/utils.h')
    writer.writeInclude('core/pipeline/base/element_register.h')
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.base, false)
    }
    writer.concat(appendViewModelBridge(library))

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.printTo(filePath)
}
