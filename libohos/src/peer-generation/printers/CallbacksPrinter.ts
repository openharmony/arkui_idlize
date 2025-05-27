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

import * as idl from '@idlizer/core/idl'
import { CppLanguageWriter, NamedMethodSignature } from "../LanguageWriters";
import { generatorTypePrefix, LanguageWriter, LayoutNodeRole, PeerLibrary, PrimitiveTypesInstance } from "@idlizer/core"
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { ImportsCollector } from "../ImportsCollector"
import { Language, LibraryInterface, CallbackConvertor, maybeTransformManagedCallback } from  '@idlizer/core'
import { CallbackKind, generateCallbackAPIArguments, generateCallbackKindAccess, generateCallbackKindName, generateCallbackKindValue } from "@idlizer/core";
import { PrintHint } from "@idlizer/core";
import { CppSourceFile, SourceFile, TsSourceFile } from "./SourceFile";
import { collectDeclItself, collectDeclDependencies } from "../ImportsCollectorUtils";
import { collectDeclarationTargets } from '../DeclarationTargetCollector';
import { PrinterFunction, PrinterResult } from '../LayoutManager';

function collectEntryCallbacks(library: LibraryInterface, entry: idl.IDLEntry): idl.IDLCallback[] {
    let res: idl.IDLCallback[] = []
    if (idl.isCallback(entry)) {
        res.push(entry)
    }
    // TODO support methods in interfaces (should be processed as properties with function type)
    // if ([idl.IDLKind.Interface, idl.IDLKind.AnonymousInterface].includes(entry.kind!)) {
    //     const decl = entry as idl.IDLInterface
    //     decl.methods.forEach(method => {
    //         const syntheticName = generateSyntheticFunctionName(
    //             (type) => cleanPrefix(library.getTypeName(type), PrimitiveType.Prefix),
    //             method.parameters, method.returnType)
    //         const selectedName = decl.kind === idl.IDLKind.AnonymousInterface
    //             ? syntheticName
    //             : selectName(NameSuggestion.make(`Type_${decl.name}_${method.name}`), syntheticName)
    //         res.push(idl.createCallback(
    //             selectedName,
    //             method.parameters,
    //             method.returnType,
    //         ))
    //     })
    // }
    return res
}

export function collectUniqueCallbacks(library: LibraryInterface, options?: { transformCallbacks?: boolean }) {
    const uniqueCallbacks: idl.IDLCallback[] = []
    const uniqueCallbacksNames = new Set<string>()
    collectDeclarationTargets(library).filter(idl.isCallback).forEach(it => {
        if (!uniqueCallbacksNames.has(it.name)) {
            uniqueCallbacksNames.add(it.name)
            uniqueCallbacks.push(it)
        }
    })
    return uniqueCallbacks.sort((a, b) => a.name.localeCompare(b.name))
}

export function printCallbacksKindsImports(language: Language, writer: LanguageWriter) {
    if (language === Language.ARKTS) {
        const imports = new ImportsCollector()
        imports.addFeatures(['int32', 'float32'], '@koalaui/common')
        imports.print(writer, '')
    }
    if (language === Language.CJ) {
        writer.print('package idlize\n')
    }
}

export function printCallbacksKinds(library: PeerLibrary, writer: LanguageWriter): void {
    let callbacksKindsEnum = idl.createEnum(
        CallbackKind, [], {}
    )
    callbacksKindsEnum.elements = collectUniqueCallbacks(library, { transformCallbacks: true }).map(it =>
        idl.createEnumMember(generateCallbackKindName(it), callbacksKindsEnum, idl.IDLNumberType, generateCallbackKindValue(it))
    )
    if (callbacksKindsEnum.elements.length === 0) {
        // TODO We should skip generation of CallbackKind at all, but there are references to this type in common code
        callbacksKindsEnum.elements.push(idl.createEnumMember("Kind_EMPTY_Callback", callbacksKindsEnum, idl.IDLNumberType, -1))
    }
    writer.writeStatement(writer.makeEnumEntity(callbacksKindsEnum, {isExport: true}))
}

export function createCallbackKindPrinter(language: Language): PrinterFunction {
    return (library: PeerLibrary) => {
        const writer = library.createLanguageWriter(language)
        const imports = new ImportsCollector()
        if (language === Language.ARKTS) {
            imports.addFeatures(['int32', 'float32'], '@koalaui/common')
        }
        if (language === Language.CJ) {
            writer.print('package idlize\n')
        }
        let callbacksKindsEnum = idl.createEnum(
            CallbackKind, [], {}
        )
        callbacksKindsEnum.elements = collectUniqueCallbacks(library, { transformCallbacks: true }).map(it =>
            idl.createEnumMember(generateCallbackKindName(it), callbacksKindsEnum, idl.IDLNumberType, generateCallbackKindValue(it))
        )
        if (callbacksKindsEnum.elements.length === 0) {
            // TODO We should skip generation of CallbackKind at all, but there are references to this type in common code
            callbacksKindsEnum.elements.push(idl.createEnumMember("Kind_EMPTY_Callback", callbacksKindsEnum, idl.IDLNumberType, -1))
        }
        writer.writeStatement(writer.makeEnumEntity(callbacksKindsEnum, { isExport: true }))
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType("CallbackKind")) as idl.IDLEntry,
                role: LayoutNodeRole.PEER,
            },
            collector: imports,
            content: writer,
        }]
    }
}

class DeserializeCallbacksVisitor {
    constructor(
        private readonly libraryName: string,
        private readonly library: PeerLibrary,
        readonly writer: LanguageWriter,
        readonly imports: ImportsCollector,
    ) {}

    private writeImports() {
        if (this.writer.language === Language.CPP && this.library.name === "arkoala") {
            const cppWriter = this.writer as CppLanguageWriter
            cppWriter.print("#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule")
            cppWriter.writeInclude("callback_kind.h")
            cppWriter.writeInclude("Serializers.h")
            cppWriter.writeInclude("callbacks.h")
            cppWriter.writeInclude("common-interop.h")
            cppWriter.writeInclude(`${this.libraryName}_api_generated.h`)
        }

        if (this.writer.language === Language.TS || this.writer.language === Language.ARKTS) {
            collectDeclItself(this.library, idl.createReferenceType("CallbackKind"), this.imports)
            collectDeclItself(this.library, idl.createReferenceType("Deserializer"), this.imports)
            this.imports.addFeatures(["int32", "float32", "int64"], "@koalaui/common")
            this.imports.addFeatures(["ResourceHolder", "KInt", "KStringPtr", "wrapSystemCallback", "KPointer", "RuntimeType", "KSerializerBuffer", "NativeBuffer"], "@koalaui/interop")
            if (this.libraryName === 'arkoala') {
                this.imports.addFeature("CallbackTransformer", "../CallbackTransformer")
            }

            for (const callback of collectUniqueCallbacks(this.library, { transformCallbacks: true })) {
                collectDeclItself(this.library, callback, this.imports)
                collectDeclDependencies(this.library, callback, this.imports, { expandTypedefs: true })
            }
            if (this.writer.language === Language.TS && this.library.name !== 'arkoala') {
                for (const callback of collectUniqueCallbacks(this.library)) {
                    collectDeclDependencies(this.library, callback, this.imports, { expandTypedefs: true })
                }
            }
        }

        if (this.writer.language === Language.ARKTS) {
            collectDeclItself(this.library, idl.createReferenceType("TypeChecker"), this.imports)
        }
    }

    private writeCallbackDeserializeAndCall(callback: idl.IDLCallback): void {

        const vmContext = 'vmContext'

        let signature: NamedMethodSignature
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLSerializerBuffer, idl.IDLI32Type], [`thisArray`, `thisLength`])
        } else {
            signature = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType(`Deserializer`)], [`thisDeserializer`])
        }
        this.writer.writeFunctionImplementation(`deserializeAndCall${callback.name}`, signature, writer => {
            const resourceIdName = `_resourceId`
            const callName = `_call`
            if (writer.language === Language.CPP) {
                writer.writeStatement(writer.makeAssign(`thisDeserializer`, idl.createReferenceType(`Deserializer`),
                    writer.makeClassInit(idl.createReferenceType('Deserializer'), [writer.makeString('thisArray'), writer.makeString('thisLength')]),
                    true, false))
            }
            writer.writeStatement(writer.makeAssign(resourceIdName, idl.IDLI32Type, writer.makeMethodCall(`thisDeserializer`, `readInt32`, []), true))
            if (writer.language === Language.CPP) {
                // there is some assymmetrics - we do not read `call` pointer when processing in managed, but always do in native
                const callReadExpr = writer.makeCast(
                    writer.makeMethodCall(`thisDeserializer`, `readPointer`, []),
                    idl.IDLUndefinedType,
                    { unsafe: true, overrideTypeName: `void(*)(${generateCallbackAPIArguments(this.library, callback).join(", ")})` }
                )
                writer.writeStatement(writer.makeAssign(callName, undefined, callReadExpr, true))
                writer.writeStatement(writer.makeStatement(writer.makeMethodCall(`thisDeserializer`, `readPointer`, [])))
            } else {
                writer.writeStatement(writer.makeAssign(callName, undefined, writer.makeCast(
                    writer.makeMethodCall(`ResourceHolder.instance()`, `get`, [writer.makeString(resourceIdName)]),
                    callback), true))
            }
            const argsNames = []
            for (const param of callback.parameters) {
                const convertor = this.library.typeConvertor(param.name, param.type!, param.isOptional)
                writer.writeStatement(convertor.convertorDeserialize(`${param.name}_buf`, `thisDeserializer`, (expr) => {
                    const maybeOptionalType = idl.maybeOptional(param.type!, param.isOptional)
                    return writer.makeAssign(param.name, maybeOptionalType, expr, true, false)
                }, writer))
                argsNames.push(param.name)
            }
            const hasContinuation = !idl.isVoidType(callback.returnType)
            if (hasContinuation) {
                const continuationReference = this.library.createContinuationCallbackReference(callback.returnType)
                const convertor = this.library.typeConvertor(`continuation`, continuationReference)
                if (convertor instanceof CallbackConvertor) {
                    writer.writeStatement(convertor.convertorDeserialize(`_continuation_buf`, `thisDeserializer`, (expr) => {
                        return writer.makeAssign(`_continuation`, continuationReference, expr, true, false)
                    }, writer, true))
                }
            }
            if (writer.language === Language.CPP) {
                const cppArgsNames = [
                    resourceIdName,
                    ...argsNames,
                ]
                if (hasContinuation)
                    cppArgsNames.push(`_continuation`)
                writer.writeExpressionStatement(writer.makeFunctionCall(callName, cppArgsNames.map(it => writer.makeString(it))))
            } else {
                let callExpression = writer.makeFunctionCall(callName, argsNames.map(it => writer.makeString(writer.escapeKeyword(it))))
                if (hasContinuation) {
                    // TODO: Uses temporary variable `callResultRef` to fix ArkTS error: 'TypeError: Member type must be the same for all union objects.'
                    // Issue: https://rnd-gitlab-msc.huawei.com/rus-os-team/virtual-machines-and-tools/panda/-/issues/21332
                    const callResultRef = `${callName}Result`
                    writer.writeStatement(writer.makeAssign(callResultRef, undefined, callExpression, true, true))
                    callExpression = writer.makeFunctionCall(`_continuation`, [writer.makeString(callResultRef)])
                }
                writer.writeExpressionStatement(callExpression)
            }
        })
        if (this.writer.language === Language.CPP) {
            let signatureSync = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType('VMContext'), idl.IDLSerializerBuffer, idl.IDLI32Type], [vmContext, `thisArray`, `thisLength`])
            this.writer.writeFunctionImplementation(`deserializeAndCallSync${callback.name}`, signatureSync, writer => {
                const resourceIdName = `_resourceId`
                const callName = `_callSync`
                writer.writeStatement(writer.makeAssign(`thisDeserializer`, idl.createReferenceType(`Deserializer`),
                        writer.makeClassInit(idl.createReferenceType('Deserializer'), [writer.makeString('thisArray'), writer.makeString('thisLength')]),
                        true, false))
                writer.writeStatement(writer.makeAssign(resourceIdName, idl.IDLI32Type, writer.makeMethodCall(`thisDeserializer`, `readInt32`, []), true))
                const callReadExpr = writer.makeCast(
                    writer.makeMethodCall(`thisDeserializer`, `readPointer`, []),
                    idl.IDLUndefinedType,
                    { unsafe: true, overrideTypeName: `void(*)(${[`${generatorTypePrefix()}VMContext vmContext`].concat(generateCallbackAPIArguments(this.library, callback)).join(", ")})` }
                )
                writer.writeStatement(writer.makeStatement(writer.makeMethodCall(`thisDeserializer`, `readPointer`, [])))
                writer.writeStatement(writer.makeAssign(callName, undefined, callReadExpr, true))
                const argsNames = []
                for (const param of callback.parameters) {
                    const convertor = this.library.typeConvertor(param.name, param.type!, param.isOptional)
                    writer.writeStatement(convertor.convertorDeserialize(`${param.name}_buf`, `thisDeserializer`, (expr) => {
                        const maybeOptionalType = idl.maybeOptional(param.type!, param.isOptional)
                        return writer.makeAssign(param.name, maybeOptionalType, expr, true, false)
                    }, writer))
                    argsNames.push(param.name)
                }
                const hasContinuation = !idl.isVoidType(callback.returnType)
                if (hasContinuation) {
                    const continuationReference = this.library.createContinuationCallbackReference(callback.returnType)
                    const convertor = this.library.typeConvertor(`continuation`, continuationReference)
                    writer.writeStatement(convertor.convertorDeserialize(`_continuation_buf`, `thisDeserializer`, (expr) => {
                        return writer.makeAssign(`_continuation`, continuationReference, expr, true, false)
                    }, writer))
                }
                const cppArgsNames = [
                    vmContext,
                    resourceIdName,
                    ...argsNames,
                ]
                if (hasContinuation)
                    cppArgsNames.push(`_continuation`)
                writer.writeExpressionStatement(writer.makeFunctionCall(callName, cppArgsNames.map(it => writer.makeString(it))))
            })
        }
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        let signature: NamedMethodSignature
        let signatureSync: NamedMethodSignature
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType,
                [idl.IDLI32Type, idl.IDLSerializerBuffer, idl.IDLI32Type],
                [`kind`, `thisArray`, `thisLength`],
            )
            signatureSync = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType('VMContext'), idl.IDLI32Type, idl.IDLSerializerBuffer, idl.IDLI32Type],
                [`vmContext`, `kind`, `thisArray`, `thisLength`],
            )
        } else {
            signature = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType(`Deserializer`)],
                [`thisDeserializer`],
            )
            signatureSync = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType(`Deserializer`)],
                [`thisDeserializer`],
            )
        }
        this.writer.writeFunctionImplementation(`deserializeAndCallCallback`, signature, writer => {
            if (writer.language !== Language.CPP) {
                writer.writeStatement(writer.makeAssign(`kind`, idl.IDLI32Type,
                    writer.makeMethodCall(`thisDeserializer`, `readInt32`, []),
                    true
                ))
            }
            const args = writer.language === Language.CPP
            ? [`thisArray`, `thisLength`]
            : [`thisDeserializer`]

            if (writer.language == Language.CJ) {
                writer.print(`match (kind) {`)
                writer.pushIndent()
                for (const callback of callbacks) {
                    if (this.isGenericCallback(callback)) {
                        continue
                    }
                    const args = writer.language === Language.CPP
                        ? [`thisArray`, `thisLength`]
                        : [`thisDeserializer`]
                    const callbackKindValue = generateCallbackKindAccess(callback, this.writer.language)
                    writer.print(`case ${generateCallbackKindValue(callback)}/*${callbackKindValue}*/ => return deserializeAndCall${callback.name}(${args.join(', ')});`)
                }
                writer.print(`case _ => throw Exception()`)
                writer.popIndent()
                writer.print(`}`)
                writer.writeStatement(writer.makeThrowError("Unknown callback kind"))
            } else {
                if (callbacks.length > 0) {
                    writer.print(`switch (kind) {`)
                    writer.pushIndent()
                    for (const callback of callbacks) {
                        if (this.isGenericCallback(callback)) {
                            continue
                        }
                        const args = writer.language === Language.CPP
                            ? [`thisArray`, `thisLength`]
                            : [`thisDeserializer`]
                        const callbackKindValue = generateCallbackKindAccess(callback, this.writer.language)
                        writer.print(`case ${generateCallbackKindValue(callback)}/*${callbackKindValue}*/: return deserializeAndCall${callback.name}(${args.join(', ')});`)
                    }
                    writer.popIndent()
                    writer.print(`}`)
                }
                writer.writePrintLog(`Unknown callback kind`)
            }
        })
        if (this.writer.language === Language.CPP) {
            this.writer.print(`KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(static_cast<Callback_Caller_t>(deserializeAndCallCallback)))`)
        }
        if (this.writer.language === Language.TS) {
            this.writer.print('wrapSystemCallback(1, (buffer: KSerializerBuffer, len:int32) => { deserializeAndCallCallback(new Deserializer(buffer, len)); return 0 })')
        }

        if (this.writer.language === Language.CPP) {
            this.writer.writeFunctionImplementation(`deserializeAndCallCallbackSync`, signatureSync, writer => {
                if (writer.language !== Language.CPP) {
                    writer.writeStatement(writer.makeAssign(`kind`, idl.IDLI32Type,
                        writer.makeMethodCall(`thisDeserializer`, `readInt32`, []),
                        true
                    ))
                }
                if (callbacks.length > 0) {
                    writer.print(`switch (kind) {`)
                    writer.pushIndent()
                    for (const callback of callbacks) {
                        if (this.isGenericCallback(callback)) {
                            continue
                        }
                        const args = writer.language === Language.CPP
                            ? [`vmContext`, `thisArray`, `thisLength`]
                            : [`thisDeserializer`]
                        const callbackKindValue = generateCallbackKindAccess(callback, this.writer.language)
                        writer.print(`case ${generateCallbackKindValue(callback)}/*${callbackKindValue}*/: return deserializeAndCallSync${callback.name}(${args.join(', ')});`)
                    }
                    writer.popIndent()
                    writer.print(`}`)
                }
                writer.writePrintLog(`Unknown callback kind`)
            })
            this.writer.print(`KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))`)
        }
    }

    private isGenericCallback(cb:idl.IDLCallback) {
        let hasGenerics = false
        idl.forEachChild(cb, node => {
            if (idl.isTypeParameterType(node)) {
                hasGenerics = true
            }
        })
        return hasGenerics
    }

    visit(): void {
        this.writeImports()
        const uniqCallbacks = collectUniqueCallbacks(this.library, { transformCallbacks: true })
        for (const callback of uniqCallbacks) {
            if (this.isGenericCallback(callback)) {
                continue
            }
            this.writeCallbackDeserializeAndCall(callback)
        }
        this.writeInteropImplementation(uniqCallbacks)
    }
}

class ManagedCallCallbackVisitor {
    constructor(
        private readonly libraryName:string,
        private readonly library: PeerLibrary,
        private readonly dest: CppSourceFile
    ) {}

    private get writer(): CppLanguageWriter {
        return this.dest.content
    }

    private writeImports() {
        this.dest.addInclude("callback_kind.h")
        this.dest.addInclude("Serializers.h")
        this.dest.addInclude("common-interop.h")
        this.dest.addInclude("callbacks.h")
        this.dest.addInclude(`${this.libraryName}_api_generated.h`)
    }

    private writeCallbackCaller(callback: idl.IDLCallback): void {
        const args = callback.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional))
        const argsNames = callback.parameters.map(it => it.name)
        if (!idl.isVoidType(callback.returnType)) {
            args.push(this.library.createContinuationCallbackReference(callback.returnType))
            argsNames.push(`continuation`)
        }
        const signature = new NamedMethodSignature(idl.IDLVoidType,
            [idl.IDLI32Type, ...args],
            ["resourceId", ...argsNames],
        )
        this.writer.writeFunctionImplementation(`callManaged${callback.name}`, signature, writer => {
            writer.writeStatement(writer.makeAssign(`_buffer`, idl.createReferenceType(`CallbackBuffer`),
                writer.makeString(`{{}, {}}`), true, false))
            writer.writeStatement(writer.makeAssign(`_callbackResourceSelf`, idl.createReferenceType(`CallbackResource`),
                this.writer.makeString(`{resourceId, holdManagedCallbackResource, releaseManagedCallbackResource}`), true))
            writer.writeExpressionStatement(writer.makeMethodCall(`_buffer.resourceHolder`, `holdCallbackResource`, [writer.makeString(`&_callbackResourceSelf`)]))
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`Serializer`),
                writer.makeString(`Serializer((KSerializerBuffer)&(_buffer.buffer), sizeof(_buffer.buffer), &(_buffer.resourceHolder))`), true, false))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(generateCallbackKindName(callback))]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(`resourceId`)]))
            for (let i = 0; i < args.length; i++) {
                const convertor = this.library.typeConvertor(argsNames[i], args[i], callback.parameters[i]?.isOptional)
                convertor.holdResource(`arg${i}Resource`, '_buffer.resourceHolder', writer)
                convertor.convertorSerialize(`args`, argsNames[i], writer)
            }
            writer.print(`enqueueCallback(&_buffer);`)
        })
    }

    private writeCallbackCallerSync(callback: idl.IDLCallback): void {
        const args = callback.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional))
        const argsNames = callback.parameters.map(it => it.name)
        if (!idl.isVoidType(callback.returnType)) {
            args.push(this.library.createContinuationCallbackReference(callback.returnType))
            argsNames.push(`continuation`)
        }
        const signature = new NamedMethodSignature(idl.IDLVoidType,
            [idl.createReferenceType('VMContext'), idl.IDLI32Type, ...args],
            ["vmContext", "resourceId", ...argsNames],
        )
        this.writer.writeFunctionImplementation(`callManaged${callback.name}Sync`, signature, writer => {
            writer.print('uint8_t _buffer[4096];')
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`Serializer`),
                writer.makeString(`Serializer((KSerializerBuffer)&_buffer, sizeof(_buffer), nullptr)`), true, false))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(generateCallbackKindName(callback))]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(`resourceId`)]))
            for (let i = 0; i < args.length; i++) {
                const convertor = this.library.typeConvertor(argsNames[i], args[i], callback.parameters[i]?.isOptional)
                convertor.convertorSerialize(`args`, argsNames[i], writer)
            }
            writer.print(`KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(_buffer), _buffer);`)
        })
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        const signature = new NamedMethodSignature(idl.IDLPointerType,
            [idl.createReferenceType(`CallbackKind`)],
            [`kind`],
            undefined,
            undefined,
            [undefined, PrintHint.AsValue]
        )
        this.writer.writeFunctionImplementation(`getManagedCallbackCaller`, signature, writer => {
            if (callbacks.length > 0) {
                writer.print(`switch (kind) {`)
                writer.pushIndent()
                for (const callback of callbacks) {
                    writer.print(`case ${generateCallbackKindName(callback)}: return reinterpret_cast<${PrimitiveTypesInstance.NativePointer}>(callManaged${callback.name});`)
                }
                writer.popIndent()
                writer.print(`}`)
            }
            writer.writeStatement(writer.makeReturn(writer.makeString(`nullptr`)))
        })
        this.writer.writeFunctionImplementation(`getManagedCallbackCallerSync`, signature, writer => {
            if (callbacks.length > 0) {
                writer.print(`switch (kind) {`)
                writer.pushIndent()
                for (const callback of callbacks) {
                    writer.print(`case ${generateCallbackKindName(callback)}: return reinterpret_cast<${PrimitiveTypesInstance.NativePointer}>(callManaged${callback.name}Sync);`)
                }
                writer.popIndent()
                writer.print(`}`)
            }
            writer.writeStatement(writer.makeReturn(writer.makeString(`nullptr`)))
        })
    }

    visit(): void {
        this.writeImports()
        const uniqCallbacks = collectUniqueCallbacks(this.library, { transformCallbacks: true })
        for (const callback of uniqCallbacks) {
            this.writeCallbackCaller(callback)
            this.writeCallbackCallerSync(callback)
        }
        this.writeInteropImplementation(uniqCallbacks)
    }
}

export function createDeserializeAndCallPrinter(libraryName: string, language: Language): PrinterFunction {
    return (library: PeerLibrary): PrinterResult[] => {
        const writer = library.createLanguageWriter(language)
        const imports = new ImportsCollector()
        new DeserializeCallbacksVisitor(libraryName, library, writer, imports).visit()
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType("deserializeAndCallCallback")) as idl.IDLEntry,
                role: LayoutNodeRole.PEER,
            },
            collector: imports,
            content: writer,
        }]
    }
}

export function printManagedCaller(libraryName:string, library: PeerLibrary): SourceFile {
    const destFile = new CppSourceFile('callback_managed_caller.cc', library) // TODO combine with TargetFile
    const visitor = new ManagedCallCallbackVisitor(libraryName, library, destFile)
    visitor.visit()
    return destFile
}
