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
import { nativeModuleDeclaration, nativeModuleEmptyDeclaration } from "../FileGenerators";
import { FunctionCallExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, StringExpression, createInteropArgConvertor, createLanguageWriter } from "../LanguageWriters";
import { createConstructPeerMethod, PeerClassBase } from "../PeerClass";
import { PeerClass } from "../PeerClass";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";
import { Language } from "../../Language";
import * as idl from '../../idl'
import { getReferenceResolver } from "../ReferenceResolver";
import { InteropArgConvertor } from "../LanguageWriters/convertors/InteropConvertor";

class NativeModuleVisitor {
    readonly nativeModulePredefined: Map<string, LanguageWriter>
    readonly nativeModule: LanguageWriter
    readonly nativeModuleEmpty: LanguageWriter
    nativeFunctions?: LanguageWriter
    protected readonly interopConvertor

    protected readonly excludes = new Map<Language, Set<string>>([
        [Language.CJ, new Set([
            "StringData"
        ])],
        [Language.JAVA, new Set()],
        [Language.CPP, new Set()],
        [Language.TS, new Set()],
        [Language.ARKTS, new Set()],
    ])

    constructor(
        protected readonly library: PeerLibrary,
    ) {
        this.nativeModule = createLanguageWriter(library.language, getReferenceResolver(library))
        this.nativeModuleEmpty = createLanguageWriter(library.language, getReferenceResolver(library))
        this.nativeModulePredefined = new Map()
        this.interopConvertor = createInteropArgConvertor(library.language)
    }

    protected printPeerMethods(peer: PeerClass) {
        const constructMethod = createConstructPeerMethod(peer)
        this.printPeerMethod(peer, constructMethod, this.nativeModule, this.nativeModuleEmpty, constructMethod.method.signature.returnType, this.nativeFunctions)
        peer.methods.forEach(it => this.printPeerMethod(peer, it, this.nativeModule, this.nativeModuleEmpty, undefined, this.nativeFunctions))
    }

    protected printMaterializedMethods(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter, nativeFunctions?: LanguageWriter) {
        this.library.materializedToGenerate.forEach(clazz => {
            this.printPeerMethod(clazz, clazz.ctor, nativeModule, nativeModuleEmpty, idl.IDLPointerType)
            this.printPeerMethod(clazz, clazz.finalizer, nativeModule, nativeModuleEmpty, idl.IDLPointerType)
            clazz.methods.forEach(method => {
                const returnType = method.tsReturnType()
                this.printPeerMethod(clazz, method, nativeModule, nativeModuleEmpty,
                    returnType && idl.isPrimitiveType(returnType) ? returnType : idl.IDLPointerType)
            })
        })
    }

    printPeerMethod(clazz: PeerClassBase, method: PeerMethod, nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter,
        returnType?: idl.IDLType,
        nativeFunctions?: LanguageWriter
    ) {
        const component = method.originalParentName // clazz.generatedName(method.isCallSignature)
        clazz.setGenerationContext(`${method.isCallSignature ? "" : method.overloadedName}()`)
        const parameters = makeInteropSignature(method, returnType, this.interopConvertor)
        let name = `_${component}_${method.overloadedName}`

        if (parameters.returnType === idl.IDLThisType) {
            parameters.returnType = idl.IDLPointerType
        }

        nativeModule.writeNativeMethodDeclaration(name, parameters)

        nativeModuleEmpty.writeMethodImplementation(new Method(name, parameters), (printer) => {
            printer.writePrintLog(name)
            if (returnType !== undefined && returnType !== idl.IDLVoidType) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(returnType))))
            }
        })
        clazz.setGenerationContext(undefined)
    }

    shouldPrintPredefineMethod(inputMethod:idl.IDLMethod): boolean {
        const langExcludes = this.excludes.get(this.library.language)
        if (langExcludes) {
            return !langExcludes.has(inputMethod.name)
        }
        return true
    }

    makeMethodFromIdl(inputMethod:idl.IDLMethod, printer: LanguageWriter): Method {
        let signature = printer.makeNamedSignature(
            inputMethod.returnType,
            inputMethod.parameters
        )
        if (this.library.language === Language.TS) {
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

    printPredefinedMethod(inputMethod:idl.IDLMethod, printer:LanguageWriter) {
        if (!this.shouldPrintPredefineMethod(inputMethod)) {
            return
        }

        const method = this.makeMethodFromIdl(inputMethod, printer)
        printer.writeNativeMethodDeclaration(method.name, method.signature)
        this.nativeModuleEmpty.writeMethodImplementation(method, (printer) => {
            printer.writePrintLog(method.name)
            if (method.signature.returnType !== undefined && idl.forceAsNamedNode(method.signature.returnType).name !== 'void') {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(method.signature.returnType))))
            }
        })
    }

    printPredefined() {
        this.nativeModuleEmpty.pushIndent()
        this.nativeFunctions?.pushIndent()
        for (const declaration of this.library.predefinedDeclarations) {
            const writer = createLanguageWriter(this.library.language, getReferenceResolver(this.library))
            this.nativeModulePredefined.set(
                declaration.name,
                writer
            )
            writer.pushIndent()
            for (const method of declaration.methods) {
                this.printPredefinedMethod(method, writer)
            }
            writer.popIndent()
        }
        this.nativeFunctions?.popIndent()
        this.nativeModuleEmpty.popIndent()
    }

    print(): void {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        this.printPredefined()
        this.nativeModule.pushIndent()
        this.nativeModuleEmpty.pushIndent()
        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                this.printPeerMethods(peer)
            }
        }
        this.printMaterializedMethods(this.nativeModule, this.nativeModuleEmpty, this.nativeFunctions)
        this.nativeModule.popIndent()
        this.nativeModuleEmpty.popIndent()
    }
}

class CJNativeModuleVisitor extends NativeModuleVisitor {
    private arrayLikeTypes = new Set([
        'Uint8Array', 'KUint8ArrayPtr', 'KInt32ArrayPtr', 'KFloat32ArrayPtr', 'ArrayBuffer'])
    private stringLikeTypes = new Set(['String', 'KString', 'KStringPtr', 'string'])

    constructor(
        protected readonly library: PeerLibrary,
    ) {
        super(library)
        this.nativeFunctions = createLanguageWriter(library.language, getReferenceResolver(library))
    }

    override printPeerMethod(clazz: PeerClassBase, method: PeerMethod, nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter,
        returnType?: idl.IDLType,
        nativeFunctions?: LanguageWriter
    ) {
        const component = method.originalParentName // clazz.generatedName(method.isCallSignature)
        clazz.setGenerationContext(`${method.isCallSignature ? "" : method.overloadedName}()`)
        const parameters = makeInteropSignature(method, returnType, this.interopConvertor)
        let name = `_${component}_${method.overloadedName}`
        let nativeName = name.substring(1)
        nativeModule.writeMethodImplementation(new Method(name, parameters, [MethodModifier.PUBLIC, MethodModifier.STATIC]), (printer) => {
            let functionCallArgs: Array<string> = []
            printer.print('unsafe {')
            printer.pushIndent()
            for(let param of parameters.args) {
                let ordinal = parameters.args.indexOf(param)
                if (idl.isContainerType(param) || this.arrayLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                    functionCallArgs.push(`handle_${ordinal}.pointer`)
                    printer.print(`let handle_${ordinal} = acquireArrayRawData(${parameters.argsNames[ordinal]}.toArray())`)
                } else if (this.stringLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                    printer.print(`let ${parameters.argsNames[ordinal]} =  LibC.mallocCString(${parameters.argsNames[ordinal]})`)
                    functionCallArgs.push(parameters.argsNames[ordinal])
                } else {
                    functionCallArgs.push(parameters.argsNames[ordinal])
                }
            }
            const resultVarName = 'result'
            let shouldReturn = false
            if (returnType === idl.IDLVoidType) {
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
            for(let param of parameters.args) {
                let ordinal = parameters.args.indexOf(param)
                if (idl.isContainerType(param) || this.arrayLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                    printer.print(`releaseArrayRawData(handle_${ordinal})`)
                } else if (this.stringLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                    printer.print(`LibC.free(${parameters.argsNames[ordinal]})`)
                }
            }

            if (shouldReturn) {
                printer.writeStatement(printer.makeReturn(printer.makeString(resultVarName)))
            }
            printer.popIndent()
            printer.print('}')
        })
        if (nativeFunctions) {
            nativeFunctions!.pushIndent()
            nativeFunctions!.writeNativeMethodDeclaration(nativeName, parameters)
            nativeFunctions!.popIndent()
        }

        nativeModuleEmpty.writeMethodImplementation(new Method(name, parameters), (printer) => {
            printer.writePrintLog(name)
            if (returnType !== undefined
                && idl.forceAsNamedNode(returnType).name !== idl.IDLVoidType.name
                && idl.forceAsNamedNode(returnType).name !== 'Void'
            ) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(returnType))))
            }
        })
        clazz.setGenerationContext(undefined)
    }

    override printMaterializedMethods(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter, nativeFunctions?: LanguageWriter) {
        this.library.materializedToGenerate.forEach(clazz => {
            this.printPeerMethod(clazz, clazz.ctor, nativeModule, nativeModuleEmpty, idl.IDLPointerType)
            this.printPeerMethod(clazz, clazz.finalizer, nativeModule, nativeModuleEmpty, idl.IDLPointerType)
            const component = clazz.generatedName(false)
            if (nativeFunctions) {
                nativeFunctions!.pushIndent()
                nativeFunctions!.writeNativeMethodDeclaration(`${component}_${clazz.ctor.method.name}`, clazz.finalizer.method.signature)
                nativeFunctions!.writeNativeMethodDeclaration(`${component}_${clazz.finalizer.method.name}`, clazz.finalizer.method.signature)
                nativeFunctions!.popIndent()
            }
            clazz.methods.forEach(method => {
                const returnType = method.tsReturnType()
                this.printPeerMethod(clazz, method, nativeModule, nativeModuleEmpty, idl.IDLPointerType, nativeFunctions)
            })
        })
    }

    override printPredefinedMethod(inputMethod:idl.IDLMethod, printer:LanguageWriter) {
        if (!this.shouldPrintPredefineMethod(inputMethod)) {
            return
        }
        const method = this.makeMethodFromIdl(inputMethod, printer)
        method.modifiers = [MethodModifier.PUBLIC, MethodModifier.STATIC]

        const foreightMethodName = method.name.substring(1)
        const func = printer.makeNativeMethodNamedSignature(inputMethod.returnType, inputMethod.parameters)

        this.nativeFunctions!.writeNativeMethodDeclaration(foreightMethodName, func)
        printer.writeMethodImplementation(method, printer => {
            printer.print('unsafe {')
            printer.pushIndent()
            const callParameters: string[] = []
            const cleanUpStmnts: string[] = []
            method.signature.args.forEach((arg, ordinal) => {
                const paramName = method.signature.argName(ordinal)
                if (idl.IDLContainerUtils.isSequence(arg) || this.arrayLikeTypes.has(idl.forceAsNamedNode(arg).name) || idl.forceAsNamedNode(arg).name.startsWith('ArrayList<') || idl.forceAsNamedNode(arg).name.startsWith('buffer')) {
                    const varName = `handle_${ordinal}`
                    callParameters.push(`${varName}.pointer`)
                    printer.writeStatement(printer.makeAssign(
                        varName,
                        undefined,
                        printer.makeString(`acquireArrayRawData(${paramName}.toArray())`),
                        true
                    ))
                    cleanUpStmnts.push(`releaseArrayRawData(${varName})`)
                } else if (this.stringLikeTypes.has(idl.forceAsNamedNode(arg).name)) {
                    const varName = `cstr_${ordinal}`
                    callParameters.push(varName)
                    printer.writeStatement(printer.makeAssign(
                        varName,
                        undefined,
                        printer.makeString(`LibC.mallocCString(${paramName})`),
                        true
                    ))
                    cleanUpStmnts.push(`LibC.free(${varName})`)
                } else {
                    callParameters.push(paramName)
                }
            })

            const resultVarName = 'result'
            let shouldReturn = false
            const callExpr = printer.makeFunctionCall(foreightMethodName, callParameters.map((x) => printer.makeString(x)))
            if (idl.forceAsNamedNode(method.signature.returnType).name === 'void') {
                printer.writeStatement(printer.makeStatement(callExpr))
            } else {
                printer.writeStatement(
                    printer.makeAssign(
                        resultVarName,
                        undefined,
                        callExpr,
                        true
                    )
                )
                shouldReturn = true
            }
            cleanUpStmnts.forEach((str) => {
                printer.writeStatement(printer.makeStatement(printer.makeString(str)))
            })

            if (shouldReturn) {
                printer.writeStatement(printer.makeReturn(printer.makeString(resultVarName)))
            }
            printer.popIndent()
            printer.print('}')
        })

        this.nativeModuleEmpty.writeMethodImplementation(method, (printer) => {
            printer.writePrintLog(method.name)
            if (inputMethod.returnType !== undefined
                && idl.forceAsNamedNode(inputMethod.returnType).name !== idl.IDLVoidType.name
                && idl.forceAsNamedNode(inputMethod.returnType).name !== 'Void'
            ) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(inputMethod.returnType))))
            }
        })
    }
}

export function printNativeModule(peerLibrary: PeerLibrary, nativeBridgePath: string): string {
    const lang = peerLibrary.language
    const visitor = (lang == Language.CJ) ? new CJNativeModuleVisitor(peerLibrary) : new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleDeclaration(visitor.nativeModule, visitor.nativeModulePredefined, nativeBridgePath, false, lang, visitor.nativeFunctions)
}

export function printNativeModuleEmpty(peerLibrary: PeerLibrary): string {
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleEmptyDeclaration(visitor.nativeModuleEmpty.getOutput())
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
