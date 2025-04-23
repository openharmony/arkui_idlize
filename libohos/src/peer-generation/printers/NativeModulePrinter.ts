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
import { maybeReadLangTemplate, readLangTemplate } from "../FileGenerators";
import { FunctionCallExpression, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { BlockStatement, ExpressionStatement, IfStatement, LanguageWriter, MethodSignature, NaryOpExpression,
    createConstructPeerMethod, PeerClass, PeerMethod, PeerLibrary, Language, InteropArgConvertor,
    createInteropArgConvertor, NativeModuleType, CJLanguageWriter, isStructureType, isEnumType, InteropReturnTypeConvertor,
    isInIdlizeInterop,
    TypeConvertor,
    convertType,
    generatorConfiguration,
    isDirectMethod,
    isVMContextMethod,
    LayoutNodeRole,
    lib,
} from "@idlizer/core"
import * as idl from  '@idlizer/core/idl'
import { NativeModule } from "../NativeModule";
import { ArkTSSourceFile, CJSourceFile, SourceFile, TsSourceFile } from "./SourceFile";
import { idlFreeMethodsGroupToLegacy } from "../GlobalScopeUtils";
import { PrinterFunction } from "../LayoutManager";
import { ImportsCollector } from "../ImportsCollector";
import { createOutArgConvertor } from "../PromiseConvertors";
import { collectPeersForFile } from "../PeersCollector";

class NativeModulePrinterBase {
    readonly nativeModule: LanguageWriter = this.library.createLanguageWriter(this.language)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly language: Language,
    ) {}

    tryWriteQuick(method: Method): void {
        if (this.language != Language.ARKTS) return
        if (isVMContextMethod(method)) return
        if (isDirectMethod(method, this.library)) {
            this.nativeModule.print('@ani.unsafe.Direct')
            return
        }
        this.nativeModule.print('@ani.unsafe.Quick')
        return
    }

    protected printMethod(interopMethod: Method) {
        this.tryWriteQuick(interopMethod)
        this.nativeModule.writeNativeMethodDeclaration(interopMethod)
    }
}

class NativeModulePredefinedVisitor extends NativeModulePrinterBase {
    private static readonly excludes = new Map<Language, Set<string>>([
        [Language.CJ, new Set(["MaterializeBuffer", "GetNativeBufferPointer"])],
        [Language.JAVA, new Set(["MaterializeBuffer", "GetNativeBufferPointer"])],
        [Language.CPP, new Set(["MaterializeBuffer", "GetNativeBufferPointer"])],
        [Language.TS, new Set()],
        [Language.ARKTS, new Set(["MaterializeBuffer", "GetNativeBufferPointer"])],
    ])

    constructor(
        library: PeerLibrary,
        language: Language,
        private readonly entries: idl.IDLInterface[],
    ) {
        super(library, language)
    }

    private makeInteropMethodFromIdl(inputMethod: idl.IDLMethod, language: Language): Method {
        let signature = NamedMethodSignature.make(
            inputMethod.returnType,
            inputMethod.parameters.map(it => ({
                name: it.name,
                type:  it.isOptional ? idl.createOptionalType(it.type!) : it.type!
            }))
        )
        if (language === Language.TS) {
            function patchType(type:idl.IDLType): idl.IDLType {
                // TODO: do we need it?
                if (type === idl.IDLBooleanType) {
                    return idl.IDLNumberType
                }
                return type
            }
            const patchedSignatureArgs = signature.args.map(patchType)
            const patchedReturnType = patchType(signature.returnType)
            signature = new NamedMethodSignature(patchedReturnType, patchedSignatureArgs, signature.argsNames, signature.defaults)
        }
        let modifiers = generatorConfiguration().forceContext.includes(inputMethod.name) ?
            [ MethodModifier.FORCE_CONTEXT ] : undefined
        return new Method('_' + inputMethod.name, signature, modifiers)
    }

    visit(): void {
        for (const entry of this.entries) {
            for (const idlMethod of entry.methods) {
                if (NativeModulePredefinedVisitor.excludes.get(this.language)?.has(idlMethod.name))
                    continue
                const method = this.makeInteropMethodFromIdl(idlMethod, this.language)
                this.printMethod(method)
            }
        }
    }
}

class NativeModuleArkUIGeneratedVisitor extends NativeModulePrinterBase {
    private readonly interopConvertor = createInteropArgConvertor(this.language)
    private readonly interopRetConvertor = new InteropReturnTypeConvertor(this.library)

    constructor(
        library: PeerLibrary,
        language: Language,
    ) {
        super(library, language)
    }

    private printPeerMethods(peer: PeerClass) {
        const constructMethod = createConstructPeerMethod(peer)
        this.printPeerMethod(constructMethod, constructMethod.method.signature.returnType)
        peer.methods.forEach(it => this.printPeerMethod(it, undefined))
    }

    private printMaterializedMethods() {
        this.library.materializedToGenerate.forEach(clazz => {
            if (clazz.ctor) this.printPeerMethod(clazz.ctor, idl.IDLPointerType)
            if (clazz.finalizer) this.printPeerMethod(clazz.finalizer, idl.IDLPointerType)
            clazz.methods.forEach(method => {
                this.printPeerMethod(method, method.tsReturnType())
            })
        })
    }

    private printGlobalScopeMethods() {
        this.library.globals.forEach(entry => {
            const peerMethods = idlFreeMethodsGroupToLegacy(this.library, entry.methods)
            peerMethods.forEach(method => {
                this.printPeerMethod(method, method.returnType)
            })
        })
    }

    private printPeerMethod(method: PeerMethod, returnType?: idl.IDLType) {
        returnType = toNativeReturnType(returnType, this.library)
        const component = method.originalParentName
        const name = `_${component}_${method.overloadedName}`
        const interopMethod = makeInteropMethod(this.library, name, method)
        this.printMethod(interopMethod)
    }

    visit(): void {
        for (const file of this.library.files) {
            for (const peer of collectPeersForFile(this.library, file)) {
                this.printPeerMethods(peer)
            }
        }
        this.printMaterializedMethods()
        this.printGlobalScopeMethods()
    }
}

function writeNativeModuleEmptyImplementation(method: Method, writer: LanguageWriter, throwTodo = false) {
    writer.writeMethodImplementation(method, writer => {
        writer.writePrintLog(method.name)
        if (throwTodo) {
            writer.writeStatement(writer.makeThrowError("default structure value is not implemented"))
            return
        }
        if (method.signature.returnType !== undefined && method.signature.returnType !== idl.IDLVoidType) {
            writer.writeStatement(writer.makeReturn(writer.makeString(getReturnValue(method.signature.returnType))))
        }
    })
}

class TSNativeModulePredefinedVisitor extends NativeModulePredefinedVisitor {
    readonly nativeModuleEmpty: LanguageWriter = this.library.createLanguageWriter(this.language)

    protected printMethod(interopMethod: Method): void {
        super.printMethod(interopMethod)
        const isUnsupportedStructType = isStructureType(interopMethod.signature.returnType, this.library)
        writeNativeModuleEmptyImplementation(interopMethod, this.nativeModuleEmpty, isUnsupportedStructType)
    }
}

class TSNativeModuleArkUIGeneratedVisitor extends NativeModuleArkUIGeneratedVisitor {
    readonly nativeModuleEmpty: LanguageWriter = this.library.createLanguageWriter(Language.TS)

    protected printMethod(interopMethod: Method): void {
        super.printMethod(interopMethod)
        const isUnsupportedStructType = isStructureType(interopMethod.signature.returnType, this.library)
        writeNativeModuleEmptyImplementation(interopMethod, this.nativeModuleEmpty, isUnsupportedStructType)
    }
}

const cjArrayLikeTypes = new Set([
    'Uint8Array', 'Int8Array', 'KUint8ArrayPtr', 'KInt32ArrayPtr', 'KFloat32ArrayPtr', 'ArrayBuffer', 'Array<UInt8>', 'ArrayList<UInt8>', 'ArrayList<Int8>'])
const cjStringLikeTypes = new Set(['String', 'KString', 'KStringPtr', 'string'])
const cjMethodsIgnoreList = new Set(['_RawReturnData'])

function writeCJNativeModuleMethod(method: Method, nativeModule: LanguageWriter, nativeFunctions: LanguageWriter) {
    if (cjMethodsIgnoreList.has(method.name)) return

    method = new Method(method.name, method.signature, [MethodModifier.PUBLIC, MethodModifier.STATIC])
    const signature = method.signature as NamedMethodSignature
    const nativeName = method.name.substring(1)
    nativeModule.writeMethodImplementation(method, (printer) => {
        let functionCallArgs: Array<string> = []
        printer.print('unsafe {')
        printer.pushIndent()
        for(let paramName of signature.argsNames) {
            let ordinal = signature.argsNames.indexOf(paramName)
            let param = signature.args[ordinal]
            if (idl.isContainerType(param) || cjArrayLikeTypes.has(nativeModule.getNodeName(param))) {
                functionCallArgs.push(`handle_${ordinal}.pointer`)
                nativeModule.getNodeName(param) == 'Array<UInt8>' ?
                printer.print(`let handle_${ordinal} = acquireArrayRawData(${signature.argsNames[ordinal]})`) :
                printer.print(`let handle_${ordinal} = acquireArrayRawData(${signature.argsNames[ordinal]}.toArray())`)
            } else if (cjStringLikeTypes.has(nativeModule.getNodeName(param))) {
                printer.print(`let ${signature.argsNames[ordinal]} =  LibC.mallocCString(${signature.argsNames[ordinal]})`)
                functionCallArgs.push(signature.argsNames[ordinal])
            } else {
                functionCallArgs.push(signature.argsNames[ordinal])
            }
        }
        let resultVarName = 'result'
        let shouldReturn = false
        if (signature.returnType === idl.IDLVoidType) {
            printer.print(`${new FunctionCallExpression(nativeName, functionCallArgs.map(it => printer.makeString(it))).asString()}`)
        } else if (signature.returnType === idl.IDLInteropReturnBufferType) {
            printer.writeStatement(
                printer.makeAssign(
                    resultVarName,
                    undefined,
                    new FunctionCallExpression(nativeName, functionCallArgs.map(it => printer.makeString(it))),
                    true
                )
            )
            printer.print(`let array = Array<UInt8>(Int64(result.length), repeat: 0)`)
            printer.print(`for (i in 0..array.size) { unsafe { array[i] = result.data.read() } }`)
            shouldReturn = true
            resultVarName = 'array'
        } else {
            printer.writeStatement(
                printer.makeAssign(
                    resultVarName,
                    undefined,
                    new FunctionCallExpression(nativeName, functionCallArgs.map(it => printer.makeString(it))),
                    true
                )
            )
            shouldReturn = true
        }
        for(let param of signature.args) {
            let ordinal = signature.args.indexOf(param)
            if (idl.isContainerType(param) || cjArrayLikeTypes.has(nativeModule.getNodeName(param))) {
                printer.print(`releaseArrayRawData(handle_${ordinal})`)
            } else if (cjStringLikeTypes.has(nativeModule.getNodeName(param))) {
                printer.print(`LibC.free(${signature.argsNames[ordinal]})`)
            }
        }

        if (shouldReturn) {
            printer.writeStatement(printer.makeReturn(printer.makeString(resultVarName.concat(signature.returnType == idl.IDLStringType ? ".toString()" : ""))))
        }
        printer.popIndent()
        printer.print('}')
    })
    if (nativeFunctions) {
        nativeFunctions!.pushIndent()
        nativeFunctions!.writeNativeMethodDeclaration(new Method(nativeName, signature))
        nativeFunctions!.popIndent()
    }
}

class CJNativeModulePredefinedVisitor extends NativeModulePredefinedVisitor {
    readonly nativeFunctions = this.library.createLanguageWriter(Language.CJ)

    protected printMethod(method: Method): void {
        writeCJNativeModuleMethod(method, this.nativeModule, this.nativeFunctions)
    }
}

class CJNativeModuleArkUIGeneratedVisitor extends NativeModuleArkUIGeneratedVisitor {
    readonly nativeFunctions = this.library.createLanguageWriter(Language.CJ)

    protected printMethod(method: Method): void {
        writeCJNativeModuleMethod(method, this.nativeModule, this.nativeFunctions)
    }
}

function createPredefinedNativeModuleVisitor(library: PeerLibrary, language: Language, entries: idl.IDLInterface[]): NativeModulePredefinedVisitor {
    switch (language) {
        case Language.TS:
            return new TSNativeModulePredefinedVisitor(library, language, entries)
        case Language.CJ:
            return new CJNativeModulePredefinedVisitor(library, language, entries)
        case Language.ARKTS:
        case Language.JAVA:
            return new NativeModulePredefinedVisitor(library, language, entries)
        default:
            throw new Error("Not supported language for NativeModule")
    }
}

function createArkUIGeneratedNativeModuleVisitor(library: PeerLibrary, language: Language): NativeModuleArkUIGeneratedVisitor {
    switch (language) {
        case Language.TS:
            return new TSNativeModuleArkUIGeneratedVisitor(library, language)
        case Language.CJ:
            return new CJNativeModuleArkUIGeneratedVisitor(library, language)
        case Language.ARKTS:
        case Language.JAVA:
            return new NativeModuleArkUIGeneratedVisitor(library, language)
        default:
            throw new Error("Not supported language for NativeModule")
    }
}

function collectNativeModuleImports(module: NativeModuleType, imports: ImportsCollector, library:PeerLibrary) {
    if (library.language === Language.TS || library.language === Language.ARKTS) {
        imports.addFeatures([
            "KInt",
            "KLong",
            "KBoolean",
            "KFloat",
            "KUInt",
            "KStringPtr",
            "KPointer",
            "KNativePointer",
            "KInt32ArrayPtr",
            "KUint8ArrayPtr",
            "KFloat32ArrayPtr",
            "pointer",
            "KInteropReturnBuffer",
            "KSerializerBuffer",
            "loadNativeModuleLibrary",
            "NativeBuffer",
        ], "@koalaui/interop")
        imports.addFeatures(["int32", "int64", "float32"], "@koalaui/common")
        if (module === NativeModule.Generated && library.name === 'arkoala') {
            if (library.language === Language.TS || library.language === Language.ARKTS)
                imports.addFeature('Length', './units')
        }
    }
}

function printNativeModuleRegistration(language: Language, module: NativeModuleType, content: LanguageWriter): void {
    switch (language) {
        case Language.TS:
            content.print("private static _isLoaded: boolean = false")
            content.writeMethodImplementation(new Method(
                "_LoadOnce",
                new MethodSignature(idl.IDLBooleanType, []),
                [MethodModifier.PRIVATE, MethodModifier.STATIC]
            ), writer => {
                writer.writeStatement(new IfStatement(
                    new NaryOpExpression("==", [writer.makeString("this._isLoaded"), writer.makeString("false")]),
                    new BlockStatement([
                        writer.makeAssign("this._isLoaded", undefined, writer.makeString("true"), false),
                        new ExpressionStatement(writer.makeFunctionCall(
                            `loadNativeModuleLibrary`,
                            [writer.makeString(`"${module.name}"`), writer.makeString(module.name)],
                        )),
                        writer.makeReturn(writer.makeString("true"))
                    ]), undefined, undefined, undefined
                ))
                writer.writeStatement(writer.makeReturn(writer.makeString("false")))
            })
            break
        case Language.ARKTS:
            content.writeStaticBlock(writer => {
                writer.print(`loadNativeModuleLibrary("${module.name}")`)
            })
            break
    }
}

export function printArkUILibrariesLoader(file: SourceFile) {
    const template = readLangTemplate(`librariesLoader`, file.language)
    switch (file.language) {
        case Language.TS:
            const tsFile = file as TsSourceFile
            tsFile.imports.addFeatures(['withByteArray', 'Access', 'callCallback', 'nullptr', 'InteropNativeModule', 'providePlatformDefinedData', 'NativeStringBase', 'ArrayDecoder', 'CallbackRegistry'], '@koalaui/interop')
            tsFile.content.writeLines(template)
            break
        case Language.ARKTS:
            const arktsFile = file as ArkTSSourceFile
            arktsFile.content.writeLines(template)
            break
        default:
            throw new Error("Not implemented")
    }
}

export function printPredefinedNativeModule(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const language = library.language
    const entries = collectPredefinedNativeModuleEntries(library, module)
    const visitor = createPredefinedNativeModuleVisitor(library, language, entries)
    visitor.visit()
    const file = SourceFile.make(`${module.name}${language.extension}`, language, library)
    if (file instanceof TsSourceFile || file instanceof ArkTSSourceFile)
        collectNativeModuleImports(module, file.imports, library)
    file.content.writeClass(module.name, writer => {
        printNativeModuleRegistration(language, module, file.content)
        writer.concat(visitor.nativeModule)
        const maybeTemplate = maybeReadLangTemplate(`${module.name}_functions`, language)
        if (maybeTemplate)
            writer.writeLines(maybeTemplate)
    })
    return file
}

export function printTSPredefinedEmptyNativeModule(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const entries = collectPredefinedNativeModuleEntries(library, module)
    const visitor = new TSNativeModulePredefinedVisitor(library, library.language, entries)
    visitor.visit()
    const file = SourceFile.make("", library.language, library) as TsSourceFile
    collectNativeModuleImports(module, file.imports, library)
    file.content.writeClass(`${module.name}Empty`, writer => {
        writer.concat(visitor.nativeModuleEmpty)
    })
    return file
}

export function printCJPredefinedNativeFunctions(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const entries = collectPredefinedNativeModuleEntries(library, module)
    const visitor = new CJNativeModulePredefinedVisitor(library, library.language, entries)
    visitor.visit()
    const writer = library.createLanguageWriter() as CJLanguageWriter
    writer.writeCJForeign(writer => {
        writer.concat(visitor.nativeFunctions)
    })
    const file = SourceFile.make("", library.language, library)
    file.content.concat(writer)
    return file
}

export function createGeneratedNativeModulePrinter(module: NativeModuleType, more?:(w:LanguageWriter) => void): PrinterFunction {
    return (library) => {
        const visitor = createArkUIGeneratedNativeModuleVisitor(library, library.language)
        visitor.visit()
        const content = library.createLanguageWriter()
        const imports = new ImportsCollector()
        collectNativeModuleImports(module, imports, library)
        if (content.language == Language.CJ) {
            (content as CJLanguageWriter).writeCJForeign(writer => {
                writer.concat((visitor as CJNativeModuleArkUIGeneratedVisitor).nativeFunctions)
            })
        }
        content.writeClass(module.name, writer => {
            printNativeModuleRegistration(library.language, module, content)
            more?.(writer)
            writer.concat(visitor.nativeModule)
        })
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType(module.name)) as idl.IDLInterface,
                role: LayoutNodeRole.PEER
            },
            collector: imports,
            content: content,
        }]
    }
}

export function printTSArkUIGeneratedEmptyNativeModule(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const visitor = createArkUIGeneratedNativeModuleVisitor(library, library.language) as TSNativeModuleArkUIGeneratedVisitor
    visitor.visit()
    const file = SourceFile.make("", library.language, library)
    if (file instanceof TsSourceFile || file instanceof ArkTSSourceFile)
        collectNativeModuleImports(module, file.imports, library)
    file.content.writeClass(`${module.name}Empty`, writer => {
        writer.concat(visitor.nativeModuleEmpty)
    })
    return file
}

export function printCJArkUIGeneratedNativeFunctions(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const visitor = new CJNativeModuleArkUIGeneratedVisitor(library, library.language)
    visitor.visit()
    const writer = library.createLanguageWriter(Language.CJ) as CJLanguageWriter
    writer.writeCJForeign(writer => {
        writer.concat(visitor.nativeFunctions)
    })
    const file = SourceFile.make("", library.language, library)
    file.content.concat(writer)
    return file
}

export function collectPredefinedNativeModuleEntries(library: PeerLibrary, module: NativeModuleType): idl.IDLInterface[] {
    const interopDeclarations = library.files
        .filter(it => isInIdlizeInterop(it))
        .flatMap(it => it.entries.filter(idl.isInterface))
    switch (module) {
        case NativeModule.Interop:
            return interopDeclarations.filter(it => it.name === "Interop" || it.name === "Loader")
        case NativeModule.Test:
            return interopDeclarations.filter(it => it.name === "Test")
        case NativeModule.ArkUI:
            return interopDeclarations.filter(it => it.name === "Node")
        default:
            throw new Error(`NativeModuleType.${module} is not predefined`)
    }
}

export function makeInteropMethod(
    library: PeerLibrary,
    name: string,
    method: PeerMethod,
): Method
export function makeInteropMethod(
    library: PeerLibrary,
    name: string,
    idlParameters: idl.IDLParameter[],
    idlReturnType: idl.IDLType | undefined,
    options: {
        forceContext: boolean,
        throws: boolean,
        hasReceiver: boolean,
        interopConvertor?: TypeConvertor<string>,
        interopReturnConvertor?: InteropReturnTypeConvertor,
    },
): Method
export function makeInteropMethod(
    library: PeerLibrary,
    name: string,
    idlParametersOrMethod: idl.IDLParameter[] | PeerMethod,
    idlReturnType?: idl.IDLType | undefined,
    options?: {
        forceContext: boolean,
        throws: boolean,
        hasReceiver: boolean,
        interopConvertor?: TypeConvertor<string>,
        interopReturnConvertor?: InteropReturnTypeConvertor,
    },
): Method {
    if (idlParametersOrMethod instanceof PeerMethod) {
        const method = idlParametersOrMethod
        return makeInteropMethodInner(
            library,
            name,
            method.method.signature.args.map((it, index) => idl.createParameter(method.method.signature.argName(index), it, method.method.signature.isArgOptional(index))),
            method.returnType,
            {
                hasReceiver: method.hasReceiver(),
                throws: !!method.method.modifiers?.includes(MethodModifier.THROWS),
                forceContext: !!method.method.modifiers?.includes(MethodModifier.FORCE_CONTEXT),
            }
        )
    }
    return makeInteropMethodInner(library, name, idlParametersOrMethod, idlReturnType, options!)
}

function makeInteropMethodInner(
    library: PeerLibrary,
    name: string,
    idlParameters: idl.IDLParameter[],
    idlReturnType: idl.IDLType | undefined,
    options: {
        forceContext: boolean,
        throws: boolean,
        hasReceiver: boolean,
        interopConvertor?: TypeConvertor<string>,
        interopReturnConvertor?: InteropReturnTypeConvertor,
    },
): Method {
    const interopConvertor = options.interopConvertor ?? createInteropArgConvertor(library.language)
    const interopReturnConvertor = options.interopReturnConvertor ?? new InteropReturnTypeConvertor(library)
    const interopParameters: ({name: string, type: idl.IDLType})[] = options.hasReceiver
        ? [{ name: 'ptr', type: idl.IDLPointerType }] : []
    const argConvertors = idlParameters.map(it => library.typeConvertor(it.name, it.type, it.isOptional))
    const outArgConvertor = createOutArgConvertor(library, idlReturnType, idlParameters.map(it => it.name))
    let serializerArgCreated = false
    argConvertors.concat(outArgConvertor ?? []).forEach(it => {
        if (it.useArray) {
            if (!serializerArgCreated) {
                interopParameters.push({ name: `thisArray`, type: idl.IDLSerializerBuffer }, { name: `thisLength`, type: idl.IDLI32Type })
                serializerArgCreated = true
            }
        } else {
            interopParameters.push({
                name: `${it.param}`,
                type: idl.createReferenceType('%TEXT%:' + convertType(interopConvertor, it.interopType()))
            })
        }
    })
    const interopReturnType = idlReturnType && interopReturnConvertor.isReturnInteropBuffer(idlReturnType)
        ? idl.IDLInteropReturnBufferType
        : toNativeReturnType(idlReturnType, library) ?? idl.IDLVoidType
    const modifiers: MethodModifier[] = []
    if (options.forceContext || idlReturnType && idl.IDLContainerUtils.isPromise(idlReturnType))
        modifiers.push(MethodModifier.FORCE_CONTEXT)
    if (options.throws)
        modifiers.push(MethodModifier.THROWS)
    return new Method(
        name,
        new NamedMethodSignature(
            interopReturnType,
            interopParameters.map(it => it.type),
            interopParameters.map(it => it.name)
        ),
        modifiers
    )
}

function getReturnValue(type: idl.IDLType): string {

    const pointers = new Set<idl.IDLType>([idl.IDLPointerType])
    const integrals = new Set<idl.IDLType>([
        idl.IDLI8Type,
        idl.IDLU8Type,
        idl.IDLI16Type,
        idl.IDLU16Type,
        idl.IDLI32Type,
        idl.IDLU32Type,
        idl.IDLI64Type,
        idl.IDLU64Type,
    ])
    const numeric = new Set<idl.IDLType>([
        ...integrals, idl.IDLF32Type, idl.IDLF64Type
    ])
    const strings = new Set<idl.IDLType>([
        idl.IDLStringType
    ])
    if (type === idl.IDLThisType) {
        return 'this'
    }
    if (type === idl.IDLUndefinedType) {
        return 'undefined'
    }
    if (pointers.has(type)) {
        return '-1'
    }
    if (numeric.has(type)) {
        return '0'
    }
    if (strings.has(type)) {
        return `""`
    }

    switch(type) {
        case idl.IDLUnknownType :return "0"
        case idl.IDLBooleanType : return "false"
        case idl.IDLNumberType: return "1"
        case idl.IDLPointerType: return "0"
        case idl.IDLStringType: return `"some string"`
        case idl.IDLAnyType: return `""`
        case idl.IDLObjectType: return "new Object()"
        case idl.IDLBufferType: return "new ArrayBuffer(8)"
        case idl.IDLBigintType: return "BigInt(0)"
        case idl.IDLInteropReturnBufferType: return "new Uint8Array()"
    }

    throw new Error(`Unknown return type: ${idl.IDLKind[type.kind]} ${idl.forceAsNamedNode(type).name}`)
}

function toNativeReturnType(returnType: idl.IDLType | undefined, library: PeerLibrary): idl.IDLType {

    if (!returnType) return idl.IDLVoidType

    if (isEnumType(returnType, library))
        return idl.IDLI32Type

    if (idl.isPrimitiveType(returnType)
        || isStructureType(returnType, library)
        || idl.IDLContainerUtils.isSequence(returnType)
        || idl.IDLContainerUtils.isRecord(returnType))
        return returnType

    return idl.IDLPointerType
}