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
import { FunctionCallExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, StringExpression, createInteropArgConvertor, createLanguageWriter } from "../LanguageWriters";
import { createConstructPeerMethod } from "../PeerClass";
import { PeerClass } from "../PeerClass";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";
import { Language } from  '@idlize/core'
import * as idl from  '@idlize/core/idl'
import { InteropArgConvertor } from "../LanguageWriters/convertors/InteropConvertor";
import { NativeModuleType } from "../NativeModuleType";
import { ArkTSSourceFile, SourceFile, TsSourceFile } from "./SourceFile";
import { CJLanguageWriter } from "../LanguageWriters/writers/CJLanguageWriter";

class NativeModulePrinterBase {
    readonly nativeModule: LanguageWriter = createLanguageWriter(this.language, this.library)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly language: Language,
    ) {}

    protected printMethod(method: Method) {
        this.nativeModule.writeNativeMethodDeclaration(method.name, method.signature)
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
                if (type === idl.IDLBooleanType) {
                    return idl.IDLNumberType
                }
                return type
            }
            const patchedSignatureArgs = signature.args.map(patchType)
            const patchedReturnType = patchType(signature.returnType)
            signature = new NamedMethodSignature(patchedReturnType, patchedSignatureArgs, signature.argsNames, signature.defaults)
        }
        return new Method('_' + inputMethod.name, signature)
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
            this.printPeerMethod(clazz.ctor, idl.IDLPointerType)
            this.printPeerMethod(clazz.finalizer, idl.IDLPointerType)
            clazz.methods.forEach(method => {
                const returnType = method.tsReturnType()
                this.printPeerMethod(method, returnType && idl.isPrimitiveType(returnType) ? returnType : idl.IDLPointerType)
            })
        })
    }

    private printPeerMethod(method: PeerMethod, returnType?: idl.IDLType) {
        const component = method.originalParentName
        const parameters = makeInteropSignature(method, returnType, this.interopConvertor)
        let name = `_${component}_${method.overloadedName}`

        if (parameters.returnType === idl.IDLThisType) {
            parameters.returnType = idl.IDLPointerType
        }

        this.printMethod(new Method(name, parameters))
    }

    visit(): void {
        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                this.printPeerMethods(peer)
            }
        }
        this.printMaterializedMethods()
    }
}

function writeNativeModuleEmptyImplementation(method: Method, writer: LanguageWriter) {
    writer.writeMethodImplementation(method, writer => {
        writer.writePrintLog(method.name)
        if (method.signature.returnType !== undefined && method.signature.returnType !== idl.IDLVoidType) {
            writer.writeStatement(writer.makeReturn(writer.makeString(getReturnValue(method.signature.returnType))))
        }
    })
}

class TSNativeModulePredefinedVisitor extends NativeModulePredefinedVisitor {
    readonly nativeModuleEmpty: LanguageWriter = createLanguageWriter(this.language, this.library)

    protected printMethod(method: Method): void {
        super.printMethod(method)
        writeNativeModuleEmptyImplementation(method, this.nativeModuleEmpty)
    }
}

class TSNativeModuleArkUIGeneratedVisitor extends NativeModuleArkUIGeneratedVisitor {
    readonly nativeModuleEmpty: LanguageWriter = createLanguageWriter(Language.TS, this.library)

    protected printMethod(method: Method): void {
        super.printMethod(method)
        writeNativeModuleEmptyImplementation(method, this.nativeModuleEmpty)
    }
}

const cjArrayLikeTypes = new Set([
    'Uint8Array', 'KUint8ArrayPtr', 'KInt32ArrayPtr', 'KFloat32ArrayPtr', 'ArrayBuffer', 'ArrayList<UInt8>'])
const cjStringLikeTypes = new Set(['String', 'KString', 'KStringPtr', 'string'])
function writeCJNativeModuleMethod(method: Method, nativeModule: LanguageWriter, nativeFunctions: LanguageWriter) {
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
                printer.print(`let handle_${ordinal} = acquireArrayRawData(${signature.argsNames[ordinal]}.toArray())`)
            } else if (cjStringLikeTypes.has(nativeModule.getNodeName(param))) {
                printer.print(`let ${signature.argsNames[ordinal]} =  LibC.mallocCString(${signature.argsNames[ordinal]})`)
                functionCallArgs.push(signature.argsNames[ordinal])
            } else {
                functionCallArgs.push(signature.argsNames[ordinal])
            }
        }
        const resultVarName = 'result'
        let shouldReturn = false
        if (signature.returnType === idl.IDLVoidType) {
            printer.print(`${new FunctionCallExpression(nativeName, functionCallArgs.map(it => printer.makeString(it))).asString()}`)
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
        nativeFunctions!.writeNativeMethodDeclaration(nativeName, signature)
        nativeFunctions!.popIndent()
    }
}

class CJNativeModulePredefinedVisitor extends NativeModulePredefinedVisitor {
    readonly nativeFunctions = createLanguageWriter(Language.CJ, this.library)

    protected printMethod(method: Method): void {
        writeCJNativeModuleMethod(method, this.nativeModule, this.nativeFunctions)
    }
}

class CJNativeModuleArkUIGeneratedVisitor extends NativeModuleArkUIGeneratedVisitor {
    readonly nativeFunctions = createLanguageWriter(Language.CJ, this.library)

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

function collectNativeModuleImports(module: NativeModuleType, file: SourceFile) {
    if (file.language === Language.TS || file.language === Language.ARKTS) {
        const tsFile = file as TsSourceFile
        tsFile.imports.addFeatures([
            "KInt",
            "KBoolean",
            "KFloat",
            "KUInt",
            "KStringPtr",
            "KPointer",
            "KNativePointer",
            "KInt32ArrayPtr",
            "KUint8ArrayPtr",
            "KFloat32ArrayPtr",
            "pointer"
        ], "@koalaui/interop")
        tsFile.imports.addFeatures(["int32", "float32"], "@koalaui/common")
        if (file.language === Language.ARKTS) {
            tsFile.imports.addFeature('NativeBuffer', '@koalaui/interop')
            tsFile.imports.addFeature('NativeModuleLoader', './NativeModuleLoader')
            if (module === NativeModuleType.Generated)
                tsFile.imports.addFeature('Length', '../ArkUnitsInterfaces')
        }
    }
}

function printNativeModuleRegistration(language: Language, module: NativeModuleType, file: SourceFile): void {
    switch (language) {
        case Language.TS:
            const tsFile = file as TsSourceFile
            tsFile.imports.addFeature('registerNativeModule', '@koalaui/interop')
            tsFile.content.print(`registerNativeModule("${module.name}", ${module.name})`)
            break
    }
}

export function printArkUILibrariesLoader(file: SourceFile) {
    const template = readLangTemplate(`librariesLoader`, file.language)
    switch (file.language) {
        case Language.TS:
            const tsFile = file as TsSourceFile
            tsFile.imports.addFeatures(['withByteArray', 'Access', 'callCallback', 'nullptr', 'InteropNativeModule', 'registerLoadedLibrary', 'providePlatformDefinedData', 'NativeStringBase', 'ArrayDecoder', 'CallbackRegistry'], '@koalaui/interop')
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
    collectNativeModuleImports(module, file)
    file.content.writeClass(module.name, writer => {
        writer.concat(visitor.nativeModule)
        const maybeTemplate = maybeReadLangTemplate(`${module.name}_functions`, language)
        if (maybeTemplate)
            writer.writeLines(maybeTemplate)
    })
    printNativeModuleRegistration(language, module, file)
    return file
}

export function printTSPredefinedEmptyNativeModule(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const entries = collectPredefinedNativeModuleEntries(library, module)
    const visitor = new TSNativeModulePredefinedVisitor(library, library.language, entries)
    visitor.visit()
    const file = SourceFile.make("", library.language, library)
    collectNativeModuleImports(module, file)
    file.content.writeClass(`${module.name}Empty`, writer => {
        writer.concat(visitor.nativeModuleEmpty)
    })
    return file
}

export function printCJPredefinedNativeFunctions(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const entries = collectPredefinedNativeModuleEntries(library, module)
    const visitor = new CJNativeModulePredefinedVisitor(library, library.language, entries)
    visitor.visit()
    const writer = createLanguageWriter(Language.CJ, library) as CJLanguageWriter
    writer.writeCJForeign(writer => {
        writer.concat(visitor.nativeFunctions)
        const maybeTemplate = maybeReadLangTemplate(`${module.name}_nativeFunctions`, Language.CJ)
        if (maybeTemplate)
            writer.writeLines(maybeTemplate)
    })
    const file = SourceFile.make("", library.language, library)
    collectNativeModuleImports(module, file)
    file.content.concat(writer)
    return file
}

export function printArkUIGeneratedNativeModule(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const visitor = createArkUIGeneratedNativeModuleVisitor(library, library.language)
    visitor.visit()
    const file = SourceFile.make("", library.language, library)
    collectNativeModuleImports(module, file)
    file.content.writeClass(module.name, writer => {
        writer.concat(visitor.nativeModule)
    })
    printNativeModuleRegistration(library.language, module, file)
    return file
}

export function printTSArkUIGeneratedEmptyNativeModule(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const visitor = createArkUIGeneratedNativeModuleVisitor(library, library.language) as TSNativeModuleArkUIGeneratedVisitor
    visitor.visit()
    const file = SourceFile.make("", library.language, library)
    collectNativeModuleImports(module, file)
    file.content.writeClass(`${module.name}Empty`, writer => {
        writer.concat(visitor.nativeModuleEmpty)
    })
    return file
}

export function printCJArkUIGeneratedNativeFunctions(library: PeerLibrary, module: NativeModuleType): SourceFile {
    const visitor = new CJNativeModuleArkUIGeneratedVisitor(library, library.language)
    visitor.visit()
    const writer = createLanguageWriter(Language.CJ, library) as CJLanguageWriter
    writer.writeCJForeign(writer => {
        writer.concat(visitor.nativeFunctions)
    })
    const file = SourceFile.make("", library.language, library)
    collectNativeModuleImports(module, file)
    file.content.concat(writer)
    return file
}

export function collectPredefinedNativeModuleEntries(library: PeerLibrary, module: NativeModuleType): idl.IDLInterface[] {
    switch (module) {
        case NativeModuleType.Interop:
            return library.predefinedDeclarations.filter(it => it.name === "Interop" || it.name === "Loader")
        case NativeModuleType.Test:
            return library.predefinedDeclarations.filter(it => it.name === "Test")
        case NativeModuleType.ArkUI:
            return library.predefinedDeclarations.filter(it => it.name === "Node")
        default:
            throw new Error(`NativeModuleType.${module} is not predefined`)
    }
}

export function makeInteropSignature(method: PeerMethod, returnType: idl.IDLType | undefined, interopConvertor: InteropArgConvertor): NamedMethodSignature {
    const maybeReceiver: ({name: string, type: idl.IDLType})[] = method.hasReceiver()
        ? [{ name: 'ptr', type: idl.createReferenceType('KPointer') }] : []
    let serializerArgCreated = false
    method.argAndOutConvertors.forEach(it => {
        if (it.useArray) {
            if (!serializerArgCreated) {
                maybeReceiver.push({ name: `thisArray`, type: idl.IDLUint8ArrayType }, { name: `thisLength`, type: idl.IDLI32Type })
                serializerArgCreated = true
            }
        } else {
            maybeReceiver.push({
                name: `${it.param}`,
                type: idl.createReferenceType(interopConvertor.convert(it.interopType()))
            })
        }
    })
    return NamedMethodSignature.make(returnType ?? idl.IDLVoidType, maybeReceiver)
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
        case idl.IDLBooleanType : return "false"
        case idl.IDLNumberType: return "1"
        case idl.IDLPointerType: return "0"
        case idl.IDLStringType: return `"some string"`
        case idl.IDLAnyType: return `""`
        case idl.IDLObjectType: return "new Object()"
        case idl.IDLBufferType: return "new ArrayBuffer(8)"
    }

    throw new Error(`Unknown return type: ${idl.IDLKind[type.kind]} ${idl.forceAsNamedNode(type).name}`)
}
