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

import { ArkPrimitiveTypesInstance } from "../ArkPrimitiveType"
import {
    accessorStructList,
    appendModifiersCommonPrologue,
    appendViewModelBridge,
    completeModifiersContent,
    cStyleCopyright,
    makeFileNameFromClassName,
    modifierStructList,
    warning
} from "../FileGenerators";
import {
    createDestroyPeerMethod,
    MaterializedClass,
    MaterializedMethod,
    IndentedPrinter,
    groupBy,
    Language,
    createConstructPeerMethod,
    PeerClass,
    PeerMethod,
    PeerLibrary,
    InteropReturnTypeConvertor,
    LanguageWriter,
    createLanguageWriter,
    createEmptyReferenceResolver,
    CppInteropConvertor,
    CppReturnTypeConvertor
} from '@idlizer/core'
import { CppLanguageWriter, LanguageStatement, printMethodDeclaration } from "../LanguageWriters";
import { LibaceInstall } from "../../Install";
import { IDLAnyType, IDLBooleanType, IDLFunctionType, IDLPointerType, IDLStringType, IDLThisType, IDLType, isOptionalType, isReferenceType } from '@idlizer/core/idl'
import { peerGeneratorConfiguration } from "../PeerGeneratorConfig";

export class ModifierVisitor {
    dummy = this.library.createLanguageWriter(Language.CPP)
    real = this.library.createLanguageWriter(Language.CPP)
    modifiers = this.library.createLanguageWriter(Language.CPP)
    getterDeclarations = this.library.createLanguageWriter(Language.CPP)
    modifierList = this.library.createLanguageWriter(Language.CPP)
    private readonly returnTypeConvertor = new CppReturnTypeConvertor(this.library)
    commentedCode = true

    constructor(
        protected library: PeerLibrary,
        private isDummy: boolean = false
    ) { }

    printDummyImplFunctionBody(method: PeerMethod) {
        let _ = this.dummy
        const isVoid = this.returnTypeConvertor.isVoid(method)
        let retVal = isVoid ? undefined : (method.dummyReturnValue(this.library) ?? "0")

        _.writeStatement(
            _.makeCondition(
                _.makeString("!needGroupedLog(1)"),
                method.toStringName == "construct"
                    ? this.makeConstructReturnStatement(_, method)
                    : _.makeReturn(retVal ? _.makeString(retVal) : undefined)
            )
        )
        _.print(`string out("${method.toStringName}(");`)
        method.argAndOutConvertors.forEach((argConvertor, index) => {
            if (index > 0) this.dummy.print(`out.append(", ");`)
            _.print(`WriteToString(&out, ${argConvertor.param});`)
        })
        _.print(`out.append(") \\n");`)
        if (retVal !== undefined) {
            _.print(`out.append("[return ${retVal}] \\n");`)
        }
        _.print(`appendGroupedLog(1, out);`)
        if (method.toStringName == "construct") {
            _.writeStatement(this.makeConstructReturnStatement(_, method))
        } else {
            this.printReturnStatement(this.dummy, method, true, retVal)
        }
    }

    printModifierImplFunctionBody(method: PeerMethod, clazz: PeerClass | undefined = undefined) {
        if (!this.isDummy) {
            this.printBodyImplementation(this.real, method, clazz)
        }
        this.printReturnStatement(this.real, method)
    }

    private makeConstructReturnStatement(printer: LanguageWriter, method: PeerMethod): LanguageStatement {
        return printer.makeReturn(printer.makeString(`new TreeNode("${method.originalParentName}", id, flags);`))
    }

    private printReturnStatement(printer: LanguageWriter, method: PeerMethod, isDummy?: boolean, returnValue: string | undefined = undefined) {
        const isVoid = this.returnTypeConvertor.isVoid(method)
        if (isDummy) {
            if (returnValue) {
                printer.print(`return ${returnValue};`)
            }
        }
        else if (method.method.name == 'getFinalizer') {
            printer.print(`return reinterpret_cast<void *>(&DestroyPeerImpl);`)
        }
        else if (method.method.name == 'ctor') {
            const argCount = method.method.signature.args.length

            const paramNames: string[] = []
            for (let i = 0; i < argCount; i++) {
                paramNames.push(method.method.signature.argName(i))
            }
            const apiParameters = paramNames.join(', ')
            printer.print(`return new ${method.originalParentName}Peer(${apiParameters});`)
        }
        else if (method.method.name == 'destroyPeer') {
            const implClassName = `${method.originalParentName}PeerImpl`
            printer.print(`auto peerImpl = reinterpret_cast<${implClassName} *>(peer);`)
            printer.print(`if (peerImpl) {`)
            printer.print(`    delete peerImpl;`)
            printer.print(`}`)
        }
        else if (!isVoid) {
            printer.print(`return {};`)
        }
    }

    private printBodyImplementation(printer: LanguageWriter, method: PeerMethod,
        clazz: PeerClass | undefined = undefined) {
        const apiParameters = method.generateAPIParameters(
            this.library.createTypeNameConvertor(Language.CPP)
        )
        if (apiParameters.at(0)?.includes(ArkPrimitiveTypesInstance.NativePointer.getText())) {
            this.real.print(`auto frameNode = reinterpret_cast<FrameNode *>(node);`)
            this.real.print(`CHECK_NULL_VOID(frameNode);`)
            if (method.argAndOutConvertors.length === 1
                && method.argAndOutConvertors.at(0)?.nativeType() === IDLStringType
            ) {
                this.real.print(`CHECK_NULL_VOID(${
                    method.argAndOutConvertors.at(0)?.param
                });`)
                this.real.print(`auto convValue = Converter::Convert<std::string>(*${
                    method.argAndOutConvertors.at(0)?.param
                });`)
            } else if (this.commentedCode
                && method.argAndOutConvertors.length === 1
                && isOptionalType(method.argAndOutConvertors[0].nativeType())
                && method.argAndOutConvertors.at(0)?.isPointerType()) {
                this.real.print(`//auto convValue = ${method.argAndOutConvertors.at(0)?.param} ? ` +
                    `Converter::OptConvert<type>(*${method.argAndOutConvertors.at(0)?.param}) : std::nullopt;`)
            } else if (method.argAndOutConvertors.length === 1 && method.argAndOutConvertors.at(0)?.isPointerType()) {
                this.real.print(`CHECK_NULL_VOID(${
                    method.argAndOutConvertors.at(0)?.param
                });`)
                if (this.commentedCode) {
                    this.real.print(`//auto convValue = Converter::OptConvert<type_name>(*${
                        method.argAndOutConvertors.at(0)?.param
                    });`)
                }
            } else if (method.argAndOutConvertors.length === 1 &&
                method.argAndOutConvertors.at(0)?.nativeType() === IDLBooleanType) {
                this.real.print(`auto convValue = Converter::Convert<bool>(${
                    method.argAndOutConvertors.at(0)?.param
                });`)
            } else if (this.commentedCode
                && method.argAndOutConvertors.length === 1
                && method.argAndOutConvertors.at(0)?.nativeType() === IDLFunctionType) {
                this.real.print(`//auto convValue = [frameNode](input values) { code }`)
            } else {
                if (this.commentedCode) {
                    this.real.print(`//auto convValue = Converter::Convert<type>(${
                        method.argAndOutConvertors.at(0)?.param
                    });`)
                    this.real.print(`//auto convValue = Converter::OptConvert<type>(${
                        method.argAndOutConvertors.at(0)?.param
                    }); // for enums`)
                }
            }
            if (this.commentedCode) {
                this.real.print(`//${clazz?.componentName}ModelNG::Set${method.implName.replace("Impl", "")}(frameNode, convValue);`)
            }
        }
    }

    printMethodProlog(printer: LanguageWriter, method: PeerMethod) {
        const apiParameters = method.generateAPIParameters(
            this.library.createTypeNameConvertor(Language.CPP)
        )
        printMethodDeclaration(printer.printer, this.returnTypeConvertor.convert(method.returnType), method.implName, apiParameters)
        printer.print("{")
        printer.pushIndent()
    }

    printMethodEpilog(printer: LanguageWriter) {
        printer.popIndent()
        printer.print(`}`)
    }

    printRealAndDummyModifier(method: PeerMethod, clazz: PeerClass) {
        this.modifiers.print(`${method.implNamespaceName}::${method.implName},`)
        if (peerGeneratorConfiguration().noDummyGeneration(clazz.getComponentName(), method.toStringName)) {
            return
        }
        this.printMethodProlog(this.dummy, method)
        this.printMethodProlog(this.real, method)
        this.printDummyImplFunctionBody(method)
        this.printModifierImplFunctionBody(method, clazz)
        this.printMethodEpilog(this.dummy)
        this.printMethodEpilog(this.real)
    }

    printClassProlog(clazz: PeerClass) {
        const component = clazz.componentName
        const modifierStructImpl = `ArkUI${component}ModifierImpl`

        this.modifiers.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${component}Modifier* Get${component}Modifier()`)
        this.modifiers.print("{")
        this.modifiers.pushIndent()
        this.modifiers.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUI${component}Modifier ${modifierStructImpl} {`)
        this.modifiers.pushIndent()

        this.modifierList.print(`Get${component}Modifier,`)
    }

    printClassEpilog(clazz: PeerClass) {
        const name = clazz.componentName
        const modifierStructImpl = `ArkUI${name}ModifierImpl`

        this.modifiers.popIndent()
        this.modifiers.print(`};`)
        this.modifiers.print(`return &${modifierStructImpl};`)
        this.modifiers.popIndent()
        this.modifiers.print(`}\n`)

        this.getterDeclarations.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${name}Modifier* Get${name}Modifier();`)
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

    printPeerClassModifiers(clazz: PeerClass) {
        this.printClassProlog(clazz)
        // TODO: move to Object.groupBy when move to nodejs 21
        const namespaces: Map<string, PeerMethod[]> =
            groupBy([createConstructPeerMethod(clazz)].concat(clazz.methods), it => it.implNamespaceName)
        Array.from(namespaces.keys()).forEach (namespaceName => {
            this.pushNamespace(namespaceName, false)
            namespaces.get(namespaceName)?.forEach(
                method => {
                    this.printRealAndDummyModifier(method, clazz)
                }
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
    accessors = this.library.createLanguageWriter(Language.CPP)
    accessorList = this.library.createLanguageWriter(Language.CPP)

    constructor(library: PeerLibrary) {
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
        const mDestroyPeer = createDestroyPeerMethod(clazz)
        const namespaceName = mDestroyPeer.implNamespaceName
        this.pushNamespace(namespaceName, false);
        [mDestroyPeer, clazz.ctor, clazz.finalizer].concat(clazz.methods).forEach(method => {
            if (!method) return
            this.accessors.print(`${method.implNamespaceName}::${method.implName},`)
            if (peerGeneratorConfiguration().noDummyGeneration(clazz.getComponentName(), method.toStringName)) return

            this.printMaterializedMethod(this.dummy, method, m => this.printDummyImplFunctionBody(m))
            this.printMaterializedMethod(this.real, method, m => this.printModifierImplFunctionBody(m))
        })
        this.popNamespace(namespaceName, false)
        this.printMaterializedClassEpilog(clazz)

        this.printStruct(clazz)
    }

    printMaterializedClassProlog(clazz: MaterializedClass) {
        const accessor = `${clazz.className}Accessor`
        this.accessors.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${accessor}* Get${accessor}()`)
        this.accessors.print("{")
        this.accessors.pushIndent()
        this.accessors.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUI${accessor} ${accessor}Impl {`)
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
        this.getterDeclarations.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${accessor}* Get${accessor}();`)
    }

    printMaterializedMethod(printer: LanguageWriter, method: MaterializedMethod, printBody: (m: MaterializedMethod) => void) {
        this.printMethodProlog(printer, method)
        printBody(method)
        this.printMethodEpilog(printer)
    }

    printStruct(clazz: MaterializedClass): void {
        const structName = `${clazz.className}Peer`

        this.accessors.print(`struct ${structName} {`)
        this.accessors.pushIndent()
        this.accessors.print(`virtual ~${structName}() = default;`)
        this.accessors.popIndent()
        this.accessors.print(`};`)
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

    emitRealSync(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions): void {
        const modifierList = library.createLanguageWriter(Language.CPP)
        const accessorList = library.createLanguageWriter(Language.CPP)
        const getterDeclarations = library.createLanguageWriter(Language.CPP)

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

export function printRealAndDummyModifiers(peerLibrary: PeerLibrary, isDummy: boolean = false): {dummy: LanguageWriter, real: LanguageWriter} {
    const visitor = new ModifierVisitor(peerLibrary, isDummy)
    visitor.printRealAndDummyModifiers()
    const dummy =
        visitor.dummy.concat(visitor.modifiers).concat(modifierStructList(visitor.modifierList))
    const real =
        visitor.real.concat(visitor.modifiers).concat(modifierStructList(visitor.modifierList))
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

export interface Namespaces {
    generated: string,
    base: string
}

export interface ModifierFileOptions {
    basicVersion: number;
    fullVersion: number;
    extendedVersion: number;
    commentedCode: boolean

    namespaces?: Namespaces
}

export function printRealModifiersAsMultipleFiles(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions) {
    const visitor = new MultiFileModifiersVisitor(library)
    visitor.commentedCode = options.commentedCode
    visitor.printRealAndDummyModifiers()
    visitor.emitRealSync(library, libace, options)
}

function printModifiersImplFile(filePath: string, state: MultiFileModifiersVisitorState, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new CppInteropConvertor(createEmptyReferenceResolver()), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)

    writer.writeInclude(`core/components_ng/base/frame_node.h`)
    writer.writeInclude(`core/interfaces/native/utility/converter.h`)
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
    const writer = new CppLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new CppInteropConvertor(createEmptyReferenceResolver()), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude('arkoala-macros.h')
    writer.writeInclude('arkoala_api_generated.h')
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

function printApiImplFile(library: PeerLibrary, filePath: string, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), library, new CppInteropConvertor(library), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

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

