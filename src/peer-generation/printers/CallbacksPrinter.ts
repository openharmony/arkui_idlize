import * as idl from "../../idl"
import { generateSyntheticFunctionName, NameSuggestion, selectName } from "../../IDLVisitor";
import { PrimitiveType } from "../ArkPrimitiveType";
import { cStyleCopyright } from "../FileGenerators";
import { cleanPrefix, IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { CppLanguageWriter, createLanguageWriter, LanguageWriter, Method, NamedMethodSignature } from "../LanguageWriters";
import { EnumEntity, EnumMember } from "../PeerFile";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { ImportsCollector } from "../ImportsCollector";
import { Language } from "../../Language";

export const CallbackKind = "CallbackKind"

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
            if (subtypes.some(it => PeerGeneratorConfig.ignoreEntry(idl.getIDLTypeName(it, (_, it) => it), library.language)))
                return false
            return true
        })
}

export function generateCallbackKindName(callback: idl.IDLCallback) {
    return `Kind_${callback.name}`
}

export function generateCallbackKindAccess(callback: idl.IDLCallback, language: Language) {
    const name = generateCallbackKindName(callback)
    if (language == Language.CPP)
        return name
    return `${CallbackKind}.${name}`
}

export function printCallbacksKindsImports(library: IdlPeerLibrary, writer: LanguageWriter) {
    if (library.language === Language.ARKTS) {
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
    readonly writer: CppLanguageWriter = createLanguageWriter(Language.CPP, this.library) as CppLanguageWriter

    constructor(private readonly library: IdlPeerLibrary) {}

    private writeImports() {
        this.writer.writeLines(cStyleCopyright)
        this.writer.writeInclude("arkoala_api_generated.h")
        this.writer.writeInclude("callback_kind.h")
        this.writer.writeInclude("Serializers.h")
        this.writer.writeInclude("common-interop.h")
    }

    private writeCallbackDeserializeAndCall(callback: idl.IDLCallback): void {
        const signature = new NamedMethodSignature(idl.IDLVoidType, [idl.toIDLType(`uint8_t*`), idl.IDLI32Type], [`thisArray`, `thisLength`])
        this.writer.writeFunctionImplementation(`deserializeAndCall${callback.name}`, signature, writer => {
            const resourceName = `_resource`
            writer.writeStatement(writer.makeAssign(`thisDeserializer`, idl.createReferenceType(`Deserializer`), 
                writer.makeString(`Deserializer(thisArray, thisLength)`), true, false))
            const callbackConvertor = this.library.typeConvertor(resourceName, idl.createReferenceType(callback.name))
            writer.writeStatement(callbackConvertor.convertorDeserialize(`${resourceName}_buf`, `thisDeserializer`, (expr) => {
                return writer.makeAssign(resourceName, idl.createReferenceType(this.library.computeTargetName(callback, false)), 
                    expr, true, false)
            }, writer))
            const argsNames = [`_resource.resource.resourceId`]
            for (const param of callback.parameters) {
                const convertor = this.library.typeConvertor(param.name, param.type!, param.isOptional)
                writer.writeStatement(convertor.convertorDeserialize(`${param.name}_buf`, `thisDeserializer`, (expr) => {
                    return writer.makeAssign(param.name, idl.createReferenceType(convertor.nativeType(false)), expr, true, false)
                }, writer))
                argsNames.push(param.name)
            }
            if (!idl.isVoidType(callback.returnType)) {
                const continuationReference = this.library.createContinuationCallbackReference(callback.returnType)
                const convertor = this.library.typeConvertor(`continuation`, continuationReference)
                const continuationTarget = this.library.toDeclaration(continuationReference)
                writer.writeStatement(convertor.convertorDeserialize(`continuation_buf`, `thisDeserializer`, (expr) => {
                    return writer.makeAssign(`continuation`, idl.createReferenceType(convertor.nativeType(false)), expr, true, false)
                }, writer))
                argsNames.push(`continuation`)
            }
            writer.writeExpressionStatement(writer.makeMethodCall(`${resourceName}`, `call`, argsNames.map(it => writer.makeString(it))))
        })
    }

    private writeInteropImplementation(callbacks: idl.IDLCallback[]): void {
        const signature = new NamedMethodSignature(idl.IDLVoidType,
            [idl.IDLI32Type, idl.toIDLType(`KByte*`), idl.IDLI32Type],
            [`kind`, `thisArray`, `thisLength`],
        )
        this.writer.writeFunctionImplementation(`deserializeAndCallCallback`, signature, writer => {
            writer.print(`switch (kind) {`)
            writer.pushIndent()
            for (const callback of callbacks) {
                writer.print(`case ${generateCallbackKindName(callback)}: return deserializeAndCall${callback.name}(thisArray, thisLength);`)
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
        const args = callback.parameters.map(it => it.type!)
        const argsNames = callback.parameters.map(it => it.name)
        if (!idl.isVoidType(callback.returnType)) {
            args.push(this.library.createContinuationCallbackReference(callback.returnType))
            argsNames.push(`continuation`)
        }
        const signature = new NamedMethodSignature(idl.IDLVoidType, 
            args.map((it, index) => {
                // TODO now convert on CppLanguageWriter works really bad - it is not possible to resolve name with Ark_ prefix
                const realCppName = this.library.getTypeName(it, callback.parameters[index]?.isOptional)
                return idl.createReferenceType(realCppName)
            }),
            argsNames,
        )
        this.writer.writeFunctionImplementation(`callManaged${callback.name}`, signature, writer => {
            writer.writeStatement(writer.makeAssign(`__buffer`, idl.createReferenceType(`CallbackBuffer`), 
                writer.makeString(`{${generateCallbackKindName(callback)}, {}, {}}`), true, false))
            writer.writeStatement(writer.makeAssign(`argsSerializer`, idl.createReferenceType(`Serializer`), 
                writer.makeString(`Serializer(__buffer.buffer, &(__buffer.resourceHolder))`), true, false))
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

export function printDeserializeAndCall(library: IdlPeerLibrary): string {
    const visitor = new DeserializeCallbacksVisitor(library)
    visitor.visit()
    return visitor.writer.getOutput().join("\n")
}

export function printManagedCaller(library: IdlPeerLibrary): string {
    const visitor = new ManagedCallCallbackVisitor(library)
    visitor.visit()
    return visitor.writer.getOutput().join("\n")
}