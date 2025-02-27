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
import { generatorTypePrefix, LanguageWriter, PeerLibrary, PrimitiveTypesInstance } from "@idlizer/core"
import { peerGeneratorConfiguration } from "../PeerGeneratorConfig";
import { ImportsCollector } from "../ImportsCollector"
import { Language, LibraryInterface, CallbackConvertor, maybeTransformManagedCallback } from  '@idlizer/core'
import { CallbackKind, generateCallbackAPIArguments, generateCallbackKindAccess, generateCallbackKindName, generateCallbackKindValue } from "@idlizer/core";
import { PrintHint } from "@idlizer/core";
import { CppSourceFile, SourceFile, TsSourceFile } from "./SourceFile";
import { collectDeclItself, collectDeclDependencies } from "../ImportsCollectorUtils";

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
    const foundCallbacksNames = new Set<string>()
    const foundCallbacks: idl.IDLCallback[] = []
    const addCallback = (callback: idl.IDLCallback) => {
        if (options?.transformCallbacks)
            callback = maybeTransformManagedCallback(callback, library) ?? callback
        if (foundCallbacksNames.has(callback.name))
            return
        foundCallbacksNames.add(callback.name)
        foundCallbacks.push(callback)
    }
    for (const file of library.files) {
        for (const decl of idl.linearizeNamespaceMembers(file.entries)) {
            for (const callback of collectEntryCallbacks(library, decl)) {
                addCallback(callback)
            }
            idl.forEachFunction(decl, function_ => {
                const promise = idl.asPromise(function_.returnType)
                if (promise) {
                    const reference = library.createContinuationCallbackReference(promise)
                    const callback = library.resolveTypeReference(reference)
                    addCallback(callback as idl.IDLCallback)
                }
            })
        }
    }
    for (const foundCallback of [...foundCallbacks]) {
        const continuationRef = library.createContinuationCallbackReference(foundCallback.returnType)
        const continuation = library.resolveTypeReference(continuationRef)
        if (continuation && idl.isCallback(continuation))
            addCallback(continuation)
    }
    return foundCallbacks
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(callback => {
            const subtypes = callback.parameters.map(it => it.type!).concat(callback.returnType)
                .flatMap(it => {
                    if (idl.isContainerType(it))
                        return it.elementType
                    if (idl.isUnionType(it))
                        return it.types
                    if (idl.isOptionalType(it))
                        return it.type
                    return it
                })
            // handwritten types are not serializable
            if (subtypes.some(it => idl.isNamedNode(it) && peerGeneratorConfiguration().isHandWritten(it.name)))
                return false
            // can not process callbacks with type arguments used inside
            // (value: SomeInterface<T>) => void
            if (subtypes.some(it => idl.isReferenceType(it) && it.typeArguments))
                return false
            // (value: T) => void
            if (subtypes.some(it => idl.isTypeParameterType(it)))
                return false
            // (value: IgnoredInterface) => void
            if (subtypes.some(it => idl.isNamedNode(it) && peerGeneratorConfiguration().ignoreEntry(it.name, library.language)))
                return false
            if (subtypes.some(it => idl.isNamedNode(it) && it.name === "this"))
                return false
            return true
        })
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
    writer.writeStatement(writer.makeEnumEntity(callbacksKindsEnum, true))
}

class DeserializeCallbacksVisitor {
    constructor(
        private readonly libraryName: string,
        private readonly library: PeerLibrary,
        private readonly destFile: SourceFile
    ) {}

    private get writer(): LanguageWriter {
        return this.destFile.content
    }

    private writeImports() {
        if (this.writer.language === Language.CPP) {
            const cppFile = this.destFile as CppSourceFile
            cppFile.addInclude("callback_kind.h")
            cppFile.addInclude("Serializers.h")
            cppFile.addInclude("callbacks.h")
            cppFile.addInclude("common-interop.h")
            cppFile.addInclude(`${this.libraryName}_api_generated.h`)
        }

        if (this.writer.language === Language.TS || this.writer.language === Language.ARKTS) {
            const tsFile = this.destFile as TsSourceFile
            const imports = tsFile.imports
            imports.addFeature("CallbackKind", "./peers/CallbackKind")
            imports.addFeature("Deserializer", "./peers/Deserializer")
            imports.addFeatures(["int32", "float32", "int64"], "@koalaui/common")
            imports.addFeatures(["ResourceHolder", "KInt", "KStringPtr", "wrapSystemCallback", "KPointer", "RuntimeType"], "@koalaui/interop")
            if (this.libraryName === 'arkoala') {
                imports.addFeature("CallbackTransformer", "./peers/CallbackTransformer")
            }

            for (const callback of collectUniqueCallbacks(this.library, { transformCallbacks: true })) {
                collectDeclItself(this.library, callback, imports)
                collectDeclDependencies(this.library, callback, imports, { expandTypedefs: true })
            }

            for (let builder of this.library.builderClasses.keys()) {
                imports.addFeature(builder, `Ark${builder}Builder`)
            }
            if (this.writer.language === Language.TS && this.library.name !== 'arkoala') {
                for (const callback of collectUniqueCallbacks(this.library)) {
                    collectDeclDependencies(this.library, callback, imports, { expandTypedefs: true })
                }
            }
        }
    }

    private writeCallbackDeserializeAndCall(callback: idl.IDLCallback): void {

        const vmContext = 'vmContext'

        let signature: NamedMethodSignature
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLUint8ArrayType, idl.IDLI32Type], [`thisArray`, `thisLength`])
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
                    idl.createReferenceType(callback),
                ), true))
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
                let callExpression = writer.makeFunctionCall(callName, argsNames.map(it => writer.makeString(it)))
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
            let signatureSync = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType('VMContext'), idl.IDLUint8ArrayType, idl.IDLI32Type], [vmContext, `thisArray`, `thisLength`])
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
                [idl.IDLI32Type, idl.IDLUint8ArrayType, idl.IDLI32Type],
                [`kind`, `thisArray`, `thisLength`],
            )
            signatureSync = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType('VMContext'), idl.IDLI32Type, idl.IDLUint8ArrayType, idl.IDLI32Type],
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
        if (this.writer.language === Language.TS) {
            this.writer.print('wrapSystemCallback(1, (buff:Uint8Array, len:int32) => { deserializeAndCallCallback(new Deserializer(buff.buffer, len)); return 0 })')
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
        }
    }

    visit(): void {
        let nameConvertor = this.library.createTypeNameConvertor(Language.CJ)
        this.writeImports()
        const uniqCallbacks = collectUniqueCallbacks(this.library, { transformCallbacks: true })
        for (const callback of uniqCallbacks) {
            this.writeCallbackDeserializeAndCall(callback)
            if (this.writer.language == Language.CJ) {
                const params = callback.parameters.map(it =>
                    `${it.name}: ${it.isOptional ? "?" : ""}${nameConvertor.convert(it.type!)}`)
                this.writer.print(`public type ${callback.name} = (${params.join(", ")}) -> ${nameConvertor.convert(callback.returnType)}`)
            }
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
            writer.writeStatement(writer.makeAssign(`_callbackResource`, idl.createReferenceType(`CallbackResource`),
                this.writer.makeString(`{resourceId, holdManagedCallbackResource, releaseManagedCallbackResource}`), true))
            writer.writeExpressionStatement(writer.makeMethodCall(`_buffer.resourceHolder`, `holdCallbackResource`, [writer.makeString(`&_callbackResource`)]))
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`Serializer`),
                writer.makeString(`Serializer(_buffer.buffer, sizeof(_buffer.buffer), &(_buffer.resourceHolder))`), true, false))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(generateCallbackKindName(callback))]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(`resourceId`)]))
            for (let i = 0; i < args.length; i++) {
                const convertor = this.library.typeConvertor(argsNames[i], args[i], callback.parameters[i]?.isOptional)
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
            writer.print('uint8_t _buffer[60 * 4];')
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`Serializer`),
                writer.makeString(`Serializer(_buffer, sizeof(_buffer), nullptr)`), true, false))
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

export function printDeserializeAndCall(libraryName:string, library: PeerLibrary, destination: SourceFile): void {
    const visitor = new DeserializeCallbacksVisitor(libraryName, library, destination)
    visitor.visit()
}

export function printManagedCaller(libraryName:string, library: PeerLibrary): SourceFile {
    const destFile = new CppSourceFile('callback_managed_caller.cc', library) // TODO combine with TargetFile
    const visitor = new ManagedCallCallbackVisitor(libraryName, library, destFile)
    visitor.visit()
    return destFile
}
