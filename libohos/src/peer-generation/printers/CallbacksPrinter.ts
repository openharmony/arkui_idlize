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
import { generatorTypePrefix, LanguageWriter, LayoutNodeRole, maybeRestoreGenerics, MethodSignature, PeerLibrary, PrimitiveTypesInstance, snakeCaseToCamelCase } from "@idlizer/core"
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { ImportsCollector } from "../ImportsCollector"
import { Language, LibraryInterface, CallbackConvertor } from  '@idlizer/core'
import { CallbackKind, generateCallbackAPIArguments, generateCallbackKindAccess, generateCallbackKindName, generateCallbackKindValue } from "@idlizer/core";
import { PrintHint } from "@idlizer/core";
import { CppSourceFile, SourceFile } from "./SourceFile";
import { collectDeclItself, collectDeclDependencies } from "../ImportsCollectorUtils";
import { collectDeclarationTargets } from '../DeclarationTargetCollector';
import { PrinterFunction, PrinterResult } from '../LayoutManager';

export function collectUniqueCallbacks(library: LibraryInterface, options?: { transformCallbacks?: boolean }) {
    const uniqueCallbacks: idl.IDLCallback[] = []
    const uniqueCallbacksNames = new Set<string>()
    collectDeclarationTargets(library)
        .filter(idl.isCallback)
        .filter(it => !idl.hasTypeParameters(it))
        .filter(it => !peerGeneratorConfiguration().isHandWritten(it.name))
        .filter(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.TransformOnSerialize))
        .forEach(it => {
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
    const stubFile = idl.linkParentBack(idl.createFile([callbacksKindsEnum]))
    console.log(`WARNING: using stub file ${stubFile.kind} to allow FQN resolving. Seems like for CallbackKind we must not create enum entry, instead use another LW IR`)
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
        const generate = () => {
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
            const stubFile = idl.linkParentBack(idl.createFile([callbacksKindsEnum]))
            console.log(`WARNING: using stub file ${stubFile.kind} to allow FQN resolving. Seems like for CallbackKind we must not create enum entry, instead use another LW IR`)
            callbacksKindsEnum.elements = collectUniqueCallbacks(library, { transformCallbacks: true }).map(it =>
                idl.createEnumMember(generateCallbackKindName(it), callbacksKindsEnum, idl.IDLNumberType, generateCallbackKindValue(it))
            )
            if (callbacksKindsEnum.elements.length === 0) {
                // TODO We should skip generation of CallbackKind at all, but there are references to this type in common code
                callbacksKindsEnum.elements.push(idl.createEnumMember("Kind_EMPTY_Callback", callbacksKindsEnum, idl.IDLNumberType, -1))
            }
            writer.writeStatement(writer.makeEnumEntity(callbacksKindsEnum, { isExport: true }))
            return { content: writer, imports }
        }
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType("idlize.internal.CallbackKind")) as idl.IDLEntry,
                role: LayoutNodeRole.PEER,
            },
            generate,
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
            this.imports.addFeatures(["int32", "float32", "int64"], "@koalaui/common")
            this.imports.addFeatures([
                "ResourceHolder", "KInt", "KStringPtr", "wrapSystemCallback",
                "DeserializerBase", "SerializerBase", "CallbackResource",
                "InteropNativeModule", "KPointer", "RuntimeType",
                "KSerializerBuffer", "NativeBuffer",
            ], "@koalaui/interop")
            if (this.writer.language === Language.TS) {
                this.imports.addFeatures(["runtimeType"], "@koalaui/interop")
                this.imports.addFeatures(["unsafeCast"], "@koalaui/common")
            }
            if (this.libraryName === 'arkoala') {
                this.imports.addFeature("CallbackTransformer", "./CallbackTransformer")
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


        if (this.writer.language === Language.KOTLIN) {
            this.imports.addFeatures([
                "ResourceHolder", "KInt", "KStringPtr",
                "DeserializerBase", "SerializerBase", "CallbackResource",
                "InteropNativeModule", "KPointer", "KNativePointer", "RuntimeType",
                "KSerializerBuffer", "NativeBuffer",
            ], "koalaui.interop")
            for (const callback of collectUniqueCallbacks(this.library, { transformCallbacks: true })) {
                collectDeclItself(this.library, callback, this.imports)
                collectDeclDependencies(this.library, callback, this.imports, { expandTypedefs: true })
            }
        }
    }

    private generateMeaninglessCallArguments(callback: idl.IDLCallback): string[] {
        if (this.library.language === Language.ARKTS) {
            const originalReference = maybeRestoreGenerics(callback, this.library)
            if (originalReference) {
                const original = this.library.resolveTypeReference(originalReference) as idl.IDLCallback
                return original.parameters.slice(callback.parameters.length).map(it => 'undefined')
            }
        }
        return []
    }

    private writeCallbackDeserializeAndCall(callback: idl.IDLCallback): void {

        const vmContext = 'vmContext'

        let signature: NamedMethodSignature
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLSerializerBuffer, idl.IDLI32Type], [`thisArray`, `thisLength`])
        } else {
            signature = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType(`idlize.internal.DeserializerBase`)], [`thisDeserializer`])
        }
        this.writer.writeFunctionImplementation(`deserializeAndCall${callback.name}`, signature, writer => {
            const resourceIdName = `resourceId`
            const callName = `call`
            if (writer.language === Language.CPP) {
                writer.writeStatement(writer.makeAssign(`thisDeserializer`, idl.createReferenceType(`idlize.internal.DeserializerBase`),
                    writer.makeClassInit(idl.createReferenceType('idlize.internal.DeserializerBase'), [writer.makeString('thisArray'), writer.makeString('thisLength')]),
                    true, false))
            }
            writer.writeStatement(writer.makeAssign(resourceIdName, idl.IDLI32Type, writer.makeMethodCall(`thisDeserializer`, `readInt32`, []), true))
            if (writer.language === Language.CPP) {
                // there is some assymmetrics - we do not read `call` pointer when processing in managed, but always do in native
                const callerInvocation = writer.makeString(`getManagedCallbackCaller(${generateCallbackKindAccess(callback, writer.language)})`)
                const callReadExpr = writer.makeCast(
                    writer.makeMethodCall(`thisDeserializer`, `readPointerOrDefault`,
                        [writer.makeCast(callerInvocation, idl.IDLPointerType, { unsafe: true })]),
                        idl.IDLUndefinedType /* not used */,
                        {
                            unsafe: true,
                            overrideTypeName: `void(*)(${generateCallbackAPIArguments(this.library, callback).join(", ")})`
                        }
                )
                writer.writeStatement(writer.makeAssign(callName, undefined, callReadExpr, true))
                writer.writeStatement(writer.makeStatement(writer.makeMethodCall(`thisDeserializer`, `readPointer`, [])))
            } else if (writer.language === Language.KOTLIN) {
                writer.writeStatement(writer.makeAssign(callName, undefined, writer.makeCast(
                    writer.makeMethodCall(`ResourceHolder`, `get`, [writer.makeString(resourceIdName)]),
                    callback), true))
            } else {
                writer.addFeature(callback)
                writer.writeStatement(writer.makeAssign(callName, undefined, writer.makeCast(
                    writer.makeMethodCall(`ResourceHolder.instance()`, `get`, [writer.makeString(resourceIdName)]),
                    idl.createReferenceType(callback)), true))
            }
            const argsNames = []
            for (const param of callback.parameters) {
                const convertor = this.library.typeConvertor(param.name, param.type!, param.isOptional)
                writer.writeStatement(convertor.convertorDeserialize(`${param.name}TmpBuf`, `thisDeserializer`, (expr) => {
                    const maybeOptionalType = idl.maybeOptional(param.type!, param.isOptional)
                    return writer.makeAssign(param.name, maybeOptionalType, expr, true, false)
                }, writer))
                argsNames.push(param.name)
            }
            const hasContinuation = !idl.isVoidType(callback.returnType)
            if (hasContinuation) {
                const continuationReference = this.library.createContinuationCallbackReference(callback.returnType)
                const convertor = this.library.typeConvertor(`continuation`, continuationReference)
                writer.writeStatement(convertor.convertorDeserialize(`continuationBuffer`, `thisDeserializer`, (expr) => {
                    return writer.makeAssign(`continuationResult`, continuationReference, expr, true, false)
                }, writer))
            }
            if (writer.language === Language.CPP) {
                const cppArgsNames = [
                    resourceIdName,
                    ...argsNames,
                ]
                if (hasContinuation)
                    cppArgsNames.push(`continuationResult`)
                writer.writeExpressionStatement(writer.makeFunctionCall(callName, cppArgsNames.map(it => writer.makeString(it))))
            } else {
                let callExpression = writer.makeFunctionCall(
                    callName,
                    argsNames
                        .concat(this.generateMeaninglessCallArguments(callback))
                        .map(it => writer.makeString(writer.escapeKeyword(it))),
                )
                if (hasContinuation) {
                    // TODO: Uses temporary variable `callResultRef` to fix ArkTS error: 'TypeError: Member type must be the same for all union objects.'
                    // Issue: https://rnd-gitlab-msc.huawei.com/rus-os-team/virtual-machines-and-tools/panda/-/issues/21332
                    const callResultRef = `${callName}Result`
                    writer.writeStatement(writer.makeAssign(callResultRef, undefined, callExpression, true, true))
                    callExpression = writer.makeFunctionCall(`continuationResult`, [writer.makeString(callResultRef)])
                }
                writer.writeExpressionStatement(callExpression)
            }
        })
        if (this.writer.language === Language.CPP) {
            let signatureSync = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType('idlize.stdlib.VMContext'), idl.IDLSerializerBuffer, idl.IDLI32Type], [vmContext, `thisArray`, `thisLength`])
            this.writer.writeFunctionImplementation(`deserializeAndCallSync${callback.name}`, signatureSync, writer => {
                const resourceIdName = `resourceId`
                const callName = `callSyncMethod`
                writer.writeStatement(writer.makeAssign(`thisDeserializer`, idl.createReferenceType(`idlize.internal.DeserializerBase`),
                        writer.makeClassInit(idl.createReferenceType('idlize.internal.DeserializerBase'), [writer.makeString('thisArray'), writer.makeString('thisLength')]),
                        true, false))
                writer.writeStatement(writer.makeAssign(resourceIdName, idl.IDLI32Type, writer.makeMethodCall(`thisDeserializer`, `readInt32`, []), true))
                const callerSyncInvocation = writer.makeString(`getManagedCallbackCallerSync(${generateCallbackKindAccess(callback, writer.language)})`)
                const callReadExpr = writer.makeCast(
                writer.makeMethodCall(`thisDeserializer`, `readPointerOrDefault`,
                    [writer.makeCast(callerSyncInvocation, idl.IDLPointerType, { unsafe: true })]),
                    idl.IDLUndefinedType /* not used */,
                    {
                        unsafe: true,
                        overrideTypeName: `void(*)(${[`${generatorTypePrefix()}VMContext vmContext`].concat(generateCallbackAPIArguments(this.library, callback)).join(", ")})`
                    }
                )
                writer.writeStatement(writer.makeStatement(writer.makeMethodCall(`thisDeserializer`, `readPointer`, [])))
                writer.writeStatement(writer.makeAssign(callName, undefined, callReadExpr, true))
                const argsNames = []
                for (const param of callback.parameters) {
                    const convertor = this.library.typeConvertor(param.name, param.type!, param.isOptional)
                    writer.writeStatement(convertor.convertorDeserialize(`${param.name}TmpBuf`, `thisDeserializer`, (expr) => {
                        const maybeOptionalType = idl.maybeOptional(param.type!, param.isOptional)
                        return writer.makeAssign(param.name, maybeOptionalType, expr, true, false)
                    }, writer))
                    argsNames.push(param.name)
                }
                const hasContinuation = !idl.isVoidType(callback.returnType)
                if (hasContinuation) {
                    const continuationReference = this.library.createContinuationCallbackReference(callback.returnType)
                    const convertor = this.library.typeConvertor(`continuation`, continuationReference)
                    writer.writeStatement(convertor.convertorDeserialize(`continuationTmpBuf`, `thisDeserializer`, (expr) => {
                        return writer.makeAssign(`continuationResult`, continuationReference, expr, true, false)
                    }, writer))
                }
                const cppArgsNames = [
                    vmContext,
                    resourceIdName,
                    ...argsNames,
                ]
                if (hasContinuation)
                    cppArgsNames.push(`continuationResult`)
                writer.writeExpressionStatement(writer.makeFunctionCall(callName, cppArgsNames.map(it => writer.makeString(it))))
            })
        }
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        let signature: NamedMethodSignature
        let signatureSync: NamedMethodSignature
        collectDeclItself(this.library, idl.createReferenceType("idlize.internal.CallbackKind"), this.imports)
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType,
                [idl.IDLI32Type, idl.IDLSerializerBuffer, idl.IDLI32Type],
                [`kind`, `thisArray`, `thisLength`],
            )
            signatureSync = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType('idlize.stdlib.VMContext'), idl.IDLI32Type, idl.IDLSerializerBuffer, idl.IDLI32Type],
                [`vmContext`, `kind`, `thisArray`, `thisLength`],
            )
        } else {
            signature = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType(`idlize.internal.DeserializerBase`)],
                [`thisDeserializer`],
            )
            signatureSync = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType(`idlize.internal.DeserializerBase`)],
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
            } else if (writer.language == Language.KOTLIN) {
                writer.print(`when (kind) {`)
                writer.pushIndent()
                for (const [idx, callback] of callbacks.entries()) {
                    if (this.isGenericCallback(callback)) {
                        continue
                    }
                    const args = writer.language === Language.CPP
                        ? [`thisArray`, `thisLength`]
                        : [`thisDeserializer`]
                    const callbackKindValue = generateCallbackKindAccess(callback, this.writer.language)
                    writer.print(`${generateCallbackKindValue(callback)}/*${callbackKindValue}*/ -> deserializeAndCall${callback.name}(${args.join(', ')});`)
                }
                writer.print(`else -> error("Unknown callback kind")`)
                writer.popIndent()
                writer.print(`}`)
            } else {
                const castedKind = this.writer.makeCast(writer.makeString('kind'), idl.createReferenceType("idlize.internal.CallbackKind")).asString()
                if (callbacks.length > 0) {
                    writer.print(`switch (${castedKind}) {`)
                    writer.pushIndent()
                    for (const callback of callbacks) {
                        if (this.isGenericCallback(callback)) {
                            continue
                        }
                        const args = writer.language === Language.CPP
                            ? [`thisArray`, `thisLength`]
                            : [`thisDeserializer`]
                        const callbackKindValue = generateCallbackKindAccess(callback, this.writer.language)
                        writer.print(`case ${callbackKindValue}: return deserializeAndCall${callback.name}(${args.join(', ')});`)
                    }
                    writer.popIndent()
                    writer.print(`}`)
                }
                writer.writeStatement(writer.makeThrowError(`Unknown callback kind`))
            }
        })
        const camelcaseModuleName = snakeCaseToCamelCase(peerGeneratorConfiguration().moduleName.split(".").join("_"))
        if (this.writer.language != Language.CPP) {
            this.writer.writeFunctionImplementation(`register${camelcaseModuleName}ApiHandler`, new MethodSignature(idl.IDLVoidType, []), writer => {
                writer.addFeature('registerApiEventHandler', writer.interopModule)
                const deserializeFunctionReference = this.writer.language === Language.KOTLIN
                    ? "::deserializeAndCallCallback" : "deserializeAndCallCallback"
                writer.writeExpressionStatement(writer.makeFunctionCall(`registerApiEventHandler`, [
                    writer.makeString(peerGeneratorConfiguration().ApiKind.toString()),
                    writer.makeString(deserializeFunctionReference),
                ]))
            })
        }
        if (this.writer.language === Language.CPP) {
            this.writer.print(`KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(${peerGeneratorConfiguration().ApiKind}, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))`)
        }
        if (this.writer.language === Language.TS) {
            this.writer.writeExpressionStatement(this.writer.makeFunctionCall(`register${camelcaseModuleName}ApiHandler`, []))
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
                        writer.print(`case ${callbackKindValue}: return deserializeAndCallSync${callback.name}(${args.join(', ')});`)
                    }
                    writer.popIndent()
                    writer.print(`}`)
                }
                writer.writeStatement(writer.makeThrowError(`Unknown callback kind`))
            })
            this.writer.print(`KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(${peerGeneratorConfiguration().ApiKind}, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))`)
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
        this.writer.writeFunctionImplementation(`CallManaged${callback.name}`, signature, writer => {
            writer.writeStatement(writer.makeAssign(`callbackBuffer`, idl.createReferenceType(`idlize.internal.CallbackBuffer`),
                writer.makeString(`{{}, {}}`), true, false))
            writer.writeStatement(writer.makeAssign(`callbackResourceSelf`, idl.createReferenceType(`idlize.stdlib.CallbackResource`),
                this.writer.makeString(`{resourceId, holdManagedCallbackResource, releaseManagedCallbackResource}`), true))
            writer.writeExpressionStatement(writer.makeMethodCall(`callbackBuffer.resourceHolder`, `holdCallbackResource`, [writer.makeString(`&callbackResourceSelf`)]))
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`idlize.internal.SerializerBase`),
                writer.makeString(`SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder))`), true, false))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(generateCallbackKindName(callback))]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(`resourceId`)]))
            for (let i = 0; i < args.length; i++) {
                const convertor = this.library.typeConvertor(argsNames[i], args[i], callback.parameters[i]?.isOptional)
                convertor.holdResource(`arg${i}Resource`, 'callbackBuffer.resourceHolder', writer)
                writer.writeStatement(convertor.convertorSerialize(`args`, argsNames[i], writer))
            }
            writer.print(`enqueueCallback(${peerGeneratorConfiguration().ApiKind}, &callbackBuffer);`)
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
            [idl.createReferenceType('idlize.stdlib.VMContext'), idl.IDLI32Type, ...args],
            ["vmContext", "resourceId", ...argsNames],
        )
        this.writer.writeFunctionImplementation(`CallManaged${callback.name}Sync`, signature, writer => {
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`idlize.internal.SerializerBase`),
                writer.makeString(`SerializerBase(nullptr)`), true, false))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(peerGeneratorConfiguration().ApiKind.toString())]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(generateCallbackKindName(callback))]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(`resourceId`)]))
            for (let i = 0; i < args.length; i++) {
                const convertor = this.library.typeConvertor(argsNames[i], args[i], callback.parameters[i]?.isOptional)
                writer.writeStatement(convertor.convertorSerialize(`args`, argsNames[i], writer))
            }
            writer.print(`KInteropReturnBuffer callData = argsSerializer.toReturnBuffer();`)
            writer.print(`KOALA_INTEROP_CALL_VOID(vmContext, 1, callData.length, callData.data);`)
            writer.print(`callData.dispose(callData.data, callData.length);`)
        })
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        const signature = new NamedMethodSignature(idl.IDLPointerType,
            [idl.createReferenceType(`idlize.internal.CallbackKind`)],
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
                    writer.print(`case ${generateCallbackKindName(callback)}: return reinterpret_cast<${PrimitiveTypesInstance.NativePointer}>(CallManaged${callback.name});`)
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
                    writer.print(`case ${generateCallbackKindName(callback)}: return reinterpret_cast<${PrimitiveTypesInstance.NativePointer}>(CallManaged${callback.name}Sync);`)
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
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType(`${idl.PACKAGE_IDLIZE_INTERNAL}.deserializeAndCallCallback`)) as idl.IDLEntry,
                role: LayoutNodeRole.PEER,
            },
            generate: () => {
                const content = library.createLanguageWriter(language)
                const imports = new ImportsCollector()
                new DeserializeCallbacksVisitor(libraryName, library, content, imports).visit()
                return { content, imports}
            },
        }]
    }
}

export function printManagedCaller(libraryName:string, library: PeerLibrary): SourceFile {
    const destFile = new CppSourceFile('callback_managed_caller.cc', library) // TODO combine with TargetFile
    const visitor = new ManagedCallCallbackVisitor(libraryName, library, destFile)
    visitor.visit()
    return destFile
}
