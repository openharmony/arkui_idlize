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

import * as idl from "../../idl"
import { cStyleCopyright } from "../FileGenerators";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { CppLanguageWriter, createLanguageWriter, LanguageWriter, NamedMethodSignature } from "../LanguageWriters";
import { EnumEntity, EnumMember } from "../PeerFile";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { ImportsCollector } from "../ImportsCollector";
import { Language } from "../../Language";
import { CallbackKind, generateCallbackAPIArguments, generateCallbackKindAccess, generateCallbackKindName } from "../idl/IdlArgConvertors";
import { MethodArgPrintHint } from "../LanguageWriters/LanguageWriter";
import { collectMaterializedImports } from "../Materialized";

function collectEntryCallbacks(library: IdlPeerLibrary, entry: idl.IDLEntry): idl.IDLCallback[] {
    let res: idl.IDLCallback[] = []
    if (idl.isCallback(entry)) {
        res.push(entry)
    }
    if ([idl.IDLKind.Interface, idl.IDLKind.AnonymousInterface].includes(entry.kind!)) {
        // TODO support methods in interfaces (should be processed as properties with function type)
        // const decl = entry as idl.IDLInterface
        // decl.methods.forEach(method => {
        //     const syntheticName = generateSyntheticFunctionName(
        //         (type) => cleanPrefix(library.getTypeName(type), PrimitiveType.Prefix), 
        //         method.parameters, method.returnType)
        //     const selectedName = decl.kind === idl.IDLKind.AnonymousInterface
        //         ? syntheticName
        //         : selectName(NameSuggestion.make(`Type_${decl.name}_${method.name}`), syntheticName)
        //     res.push(idl.createCallback(
        //         selectedName,
        //         method.parameters,
        //         method.returnType,
        //     ))
        // })
    }
    if (entry.scope)
        res.push(...entry.scope.flatMap(it => collectEntryCallbacks(library, it)))
    return res
}

export function collectUniqueCallbacks(library: IdlPeerLibrary) {
    const foundCallbacksNames = new Set<string>()
    const foundCallbacks: idl.IDLCallback[] = []
    for (const file of library.files) {
        for (const decl of file.entries) {
            for (const callback of collectEntryCallbacks(library, decl)) {
                if (foundCallbacksNames.has(callback.name))
                    continue
                foundCallbacksNames.add(callback.name)
                foundCallbacks.push(callback)
            }
        }
    }
    for (const callback of library.continuationCallbacks) {
        if (foundCallbacksNames.has(callback.name))
            continue
        foundCallbacksNames.add(callback.name)
        foundCallbacks.push(callback)
    }
    return foundCallbacks
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(it => !PeerGeneratorConfig.ignoredCallbacks.has(it.name))
        .filter(callback => {
            const subtypes = callback.parameters.map(it => it.type!).concat(callback.returnType)
                .flatMap(it => {
                    if (idl.isContainerType(it))
                        return it.elementType
                    if (idl.isUnionType(it))
                        return it.types
                    return it
                })
            // can not process callbacks with type arguments used inside 
            // (value: SomeInterface<T>) => void
            if (subtypes.some(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.TypeArguments)?.length))
                return false
            // (value: T) => void
            if (subtypes.some(it => idl.isTypeParameterType(it)))
                return false
            // (value: IgnoredInterface) => void
            if (subtypes.some(it => idl.isNamedNode(it) && PeerGeneratorConfig.ignoreEntry(it.name, library.language)))
                return false
            return true
        })
}

export function printCallbacksKindsImports(language: Language, writer: LanguageWriter) {
    if (language === Language.ARKTS) {
        const imports = new ImportsCollector()
        imports.addFeatures(['KInt'], '@koalaui/interop')
        imports.print(writer, '')
    }
}

export function printCallbacksKinds(library: IdlPeerLibrary, writer: LanguageWriter): void {
    writer.writeStatement(writer.makeEnumEntity(new EnumEntity(
        CallbackKind,
        "",
        collectUniqueCallbacks(library).map((it, index) => {
            return new EnumMember(generateCallbackKindName(it), "", index.toString())
        })
    ), true))
}

class DeserializeCallbacksVisitor {
    constructor(private readonly library: IdlPeerLibrary, private readonly writer: LanguageWriter) {}

    private writeImports() {
        this.writer.writeLines(cStyleCopyright)
        
        if (this.writer.language === Language.CPP) {
            const cppWriter = this.writer as CppLanguageWriter
            cppWriter.writeInclude("arkoala_api_generated.h")
            cppWriter.writeInclude("callback_kind.h")
            cppWriter.writeInclude("Serializers.h")
            cppWriter.writeInclude("common-interop.h")
        }

        if (this.writer.language === Language.TS) {
            const imports = new ImportsCollector()
            imports.addFeature("CallbackKind", "./CallbackKind")
            imports.addFeature("Deserializer", "./Deserializer")
            imports.addFeature("int32", "@koalaui/common")
            imports.addFeature("ResourceHolder", "@koalaui/interop")
            imports.addFeature("RuntimeType", "./SerializerBase")
            collectMaterializedImports(imports, this.library, "../")
            imports.print(this.writer, "./peers")
        }
    }

    private writeCallbackDeserializeAndCall(callback: idl.IDLCallback): void {
        let signature: NamedMethodSignature
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType, [idl.createContainerType('sequence', [idl.IDLU8Type]), idl.IDLI32Type], [`thisArray`, `thisLength`])
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
            } else {
                writer.writeStatement(writer.makeAssign(callName, undefined, writer.makeCast(
                    writer.makeMethodCall(`ResourceHolder.instance()`, `get`, [writer.makeString(resourceIdName)]),
                    idl.createReferenceType(callback.name),
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
                writer.writeStatement(convertor.convertorDeserialize(`_continuation_buf`, `thisDeserializer`, (expr) => {
                    return writer.makeAssign(`_continuation`, continuationReference, expr, true, false)
                }, writer))
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
                if (hasContinuation)
                    callExpression = writer.makeFunctionCall(`_continuation`, [callExpression])
                writer.writeExpressionStatement(callExpression)
            }
        })
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        let signature: NamedMethodSignature
        if (this.writer.language === Language.CPP) {
            signature = new NamedMethodSignature(idl.IDLVoidType,
                [idl.IDLI32Type, idl.createContainerType('sequence', [idl.IDLU8Type]), idl.IDLI32Type],
                [`kind`, `thisArray`, `thisLength`],
            )
        } else {
            signature = new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType(`Deserializer`)],
                [`thisDeserializer`],
            )
        }
        this.writer.writeFunctionImplementation(`deserializeAndCallCallback`, signature, writer => {
            if (writer.language !== Language.CPP) {
                writer.writeStatement(writer.makeAssign(`kind`, idl.createReferenceType(`CallbackKind`), 
                    writer.makeCast(writer.makeMethodCall(`thisDeserializer`, `readInt32`, []), idl.createReferenceType(`CallbackKind`)), true))
            }
            writer.print(`switch (kind) {`)
            writer.pushIndent()
            for (const callback of callbacks) {
                const args = writer.language === Language.CPP
                    ? [`thisArray`, `thisLength`]
                    : [`thisDeserializer`]
                writer.print(`case ${generateCallbackKindAccess(callback, this.writer.language)}: return deserializeAndCall${callback.name}(${args.join(', ')});`)
            }
            writer.popIndent()
            writer.print(`}`)
        })
    }

    visit(): void {
        this.writeImports()
        const uniqCallbacks = collectUniqueCallbacks(this.library)
        for (const callback of uniqCallbacks) {
            this.writeCallbackDeserializeAndCall(callback)
        }
        this.writeInteropImplementation(uniqCallbacks)
    }
}

class ManagedCallCallbackVisitor {
    readonly writer: CppLanguageWriter = createLanguageWriter(Language.CPP, this.library) as CppLanguageWriter

    constructor(private readonly library: IdlPeerLibrary) {}

    private writeImports() {
        this.writer.writeLines(cStyleCopyright)
        this.writer.writeInclude("arkoala_api_generated.h")
        this.writer.writeInclude("callback_kind.h")
        this.writer.writeInclude("Serializers.h")
        this.writer.writeInclude("common-interop.h")
        this.writer.writeInclude("callbacks.h")
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
            writer.writeStatement(writer.makeAssign(`__buffer`, idl.createReferenceType(`CallbackBuffer`), 
                writer.makeString(`{{}, {}}`), true, false))
            writer.writeStatement(writer.makeAssign(`__callbackResource`, idl.createReferenceType(`CallbackResource`), 
                this.writer.makeString(`{resourceId, holdManagedCallbackResource, releaseManagedCallbackResource}`), true))
            writer.writeExpressionStatement(writer.makeMethodCall(`__buffer.resourceHolder`, `holdCallbackResource`, [writer.makeString(`&__callbackResource`)]))
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`Serializer`), 
                writer.makeString(`Serializer(__buffer.buffer, &(__buffer.resourceHolder))`), true, false))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(generateCallbackKindName(callback))]))
            writer.writeExpressionStatement(writer.makeMethodCall(`argsSerializer`, `writeInt32`, [writer.makeString(`resourceId`)]))
            for (let i = 0; i < args.length; i++) {
                const convertor = this.library.typeConvertor(argsNames[i], args[i], callback.parameters[i]?.isOptional)
                convertor.convertorSerialize(`args`, argsNames[i], writer)
            }
            writer.print(`enqueueArkoalaCallback(&__buffer);`)
        })
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        const signature = new NamedMethodSignature(idl.IDLPointerType,
            [idl.createReferenceType(`CallbackKind`)],
            [`kind`],
            undefined,
            [undefined, MethodArgPrintHint.AsValue]
        )
        this.writer.writeFunctionImplementation(`getManagedCallbackCaller`, signature, writer => {
            writer.print(`switch (kind) {`)
            writer.pushIndent()
            for (const callback of callbacks) {
                writer.print(`case ${generateCallbackKindName(callback)}: return reinterpret_cast<Ark_NativePointer>(callManaged${callback.name});`)
            }
            writer.popIndent()
            writer.print(`}`)
            writer.writeStatement(writer.makeReturn(writer.makeString(`nullptr`)))
        })
    }

    visit(): void {
        this.writeImports()
        const uniqCallbacks = collectUniqueCallbacks(this.library)
        for (const callback of uniqCallbacks) {
            this.writeCallbackCaller(callback)
        }
        this.writeInteropImplementation(uniqCallbacks)
    }
}

export function printDeserializeAndCall(library: IdlPeerLibrary, writer: LanguageWriter): void {
    const visitor = new DeserializeCallbacksVisitor(library, writer)
    visitor.visit()
}

export function printManagedCaller(library: IdlPeerLibrary): string {
    const visitor = new ManagedCallCallbackVisitor(library)
    visitor.visit()
    return visitor.writer.getOutput().join("\n")
}