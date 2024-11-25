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

import * as idl from '../../idl'
import { Language } from "../../Language";
import { PrimitiveType } from "../ArkPrimitiveType"
import { ExpressionStatement, LanguageStatement, LanguageWriter, Method, MethodSignature, NamedMethodSignature } from "../LanguageWriters";
import { PeerGeneratorConfig } from '../PeerGeneratorConfig';
import { ImportsCollector } from '../ImportsCollector';
import { PeerLibrary } from '../PeerLibrary';
import {
    ArkTSBuiltTypesDependencyFilter,
    convertDeclToFeature,
    DependencyFilter,
    isBuilderClass,
    isMaterialized,
} from '../idl/IdlPeerGeneratorVisitor';
import { isSyntheticDeclaration, makeSyntheticDeclarationsFiles } from '../idl/IdlSyntheticDeclarations';
import { collectProperties } from '../printers/StructPrinter';
import { FieldModifier, MethodModifier, ProxyStatement } from '../LanguageWriters/LanguageWriter';
import { DeclarationNameConvertor } from '../idl/IdlNameConvertor';
import { throwException } from "../../util";
import { IDLEntry } from "../../idl";
import { convertDeclaration } from '../LanguageWriters/nameConvertor';
import { collectMaterializedImports, getInternalClassName } from '../Materialized';
import { CallbackKind, generateCallbackKindAccess, stubIsTypeCallback } from '../ArgConvertors';
import { SourceFile, TsSourceFile } from './SourceFile';
import { collectUniqueCallbacks } from './CallbacksPrinter';

type SerializableTarget = idl.IDLInterface | idl.IDLCallback

class IdlSerializerPrinter {
    constructor(
        private readonly library: PeerLibrary,
        private readonly destFile: SourceFile,
    ) {}

    private get writer(): LanguageWriter {
        return this.destFile.content
    }

    private generateInterfaceSerializer(target: idl.IDLInterface, prefix: string = "") {
        const methodName = this.library.getInteropName(target)
        this.library.setCurrentContext(`write${methodName}()`)
        this.writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType(target.name)], ["value"])),
            writer => {
                if (isMaterialized(target)) {
                    this.generateMaterializedBodySerializer(target, writer)
                } else {
                    this.generateInterfaceBodySerializer(target, writer)
                }
            })
        this.library.setCurrentContext(undefined)
    }

    private declareSerializer(writer: LanguageWriter) {
        writer.writeStatement(
            writer.makeAssign(
                "valueSerializer",
                idl.createReferenceType("Serializer"),
                writer.makeThis(),
                true,
                false,
                { assignRef: true }
            )
        )
}

    private generateInterfaceBodySerializer(target: idl.IDLInterface, writer: LanguageWriter) {
        const properties = collectProperties(target, this.library)
        if (properties.length > 0) {
            this.declareSerializer(writer)
        }
        properties.forEach(it => {
            let field = `value_${it.name}`
            const type = this.library.flattenType(it.type)
            let typeConvertor = this.library.typeConvertor(`value`, type, it.isOptional)

            let memberAccess = writer.makeString(`value.${writer.escapeKeyword(it.name)}`)
            if (writer.language === Language.ARKTS && stubIsTypeCallback(this.library, type)) {
                memberAccess = writer.makeCast(memberAccess, idl.maybeOptional(type, it.isOptional))
            }

            writer.writeStatement(writer.makeAssign(field, undefined, memberAccess, true))
            typeConvertor.convertorSerialize(`value`, field, writer)
        })
    }

    private generateMaterializedBodySerializer(target: idl.IDLInterface, writer: LanguageWriter) {
        this.declareSerializer(writer)
        if (writer.language === Language.CPP) {
            writer.writeExpressionStatement(
                writer.makeMethodCall(`valueSerializer`, `writePointer`, [writer.makeString(`value.ptr`)]))
            return
        }
        const baseType = idl.createReferenceType("MaterializedBase")
        const unsafe = writer.language === Language.TS
        writer.writeStatement(
            writer.makeAssign(
                `base`,
                baseType,
                writer.makeCast(writer.makeString(`value`), baseType, { unsafe: unsafe }),
                true,
                true
            ))
        writer.writeStatement(
            writer.makeAssign(
                `peer`,
                undefined,
                writer.makeString(`base.getPeer()`),
                true,
                true
            ))
        writer.writeStatement(
            writer.makeAssign(
                `ptr`,
                idl.IDLPointerType,
                writer.makeString(`nullptr`),
                true,
                false
            ))
        writer.writeStatement(
            writer.makeCheckOptional(
                writer.makeString(`peer`),
                writer.makeAssign(
                    `ptr`,
                    idl.IDLPointerType,
                    writer.makeString(`peer.ptr`),
                    false,
                    false,
                )
            )
        )
        writer.writeStatement(
            writer.makeStatement(
                writer.makeMethodCall(`valueSerializer`, `writePointer`, [
                    writer.makeString(`ptr`)
                ])
            ))
    }

    print(prefix: string, declarationPath?: string) {
        const className = "Serializer"
        const superName = `${className}Base`
        let ctorSignature = this.writer.makeSerializerConstructorSignature()
        if (prefix == "" && this.writer.language === Language.CPP)
            prefix = PrimitiveType.Prefix + this.library.libraryPrefix
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.writer.language))
        printSerializerImports(this.library, this.destFile, declarationPath)
        // just a separator
        if (this.writer.language == Language.JAVA) {
            this.writer.print("import java.util.function.Supplier;")
        }
        this.writer.writeClass(className, writer => {
            if (writer.language == Language.JAVA)
                writer.writeFieldDeclaration('nullptr', idl.IDLPointerType, [FieldModifier.STATIC, FieldModifier.PRIVATE], false, writer.makeString('0'))


            // No need for hold() in C++.
            if (writer.language != Language.CPP) {
                writer.writeFieldDeclaration("cache", idl.createOptionalType(idl.createReferenceType("Serializer")), [FieldModifier.PRIVATE, FieldModifier.STATIC], true, writer.makeNull("Serializer"))

                writer.writeMethodImplementation(new Method("hold", new MethodSignature(idl.createReferenceType("Serializer"), []), [MethodModifier.STATIC]),
                writer => {
                    writer.writeStatement(writer.makeCondition(writer.makeNot(writer.makeDefinedCheck('Serializer.cache')), writer.makeBlock([
                        writer.makeAssign("Serializer.cache", undefined, writer.makeString(`${writer.language == Language.CJ ? "" : "new "}Serializer()`), false)
                    ])))
                    writer.writeStatement(writer.makeAssign("serializer", undefined,
                            writer.makeUnwrapOptional(writer.makeString("Serializer.cache")), true, false))
                    writer.writeStatement(writer.makeCondition(writer.makeString("serializer.isHolding"),
                        writer.makeBlock([writer.makeThrowError(("Serializer is already being held. Check if you had released is before"))])),
                    )
                    writer.writeStatement(writer.makeAssign("serializer.isHolding", undefined, writer.makeString("true"), false))
                    writer.writeStatement(writer.makeReturn(writer.makeString("serializer")))
                })
            }
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {
                }, ctorMethod)
            }
            for (const decl of serializerDeclarations) {
                if (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl)) {
                    this.generateInterfaceSerializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    // callbacks goes through writeCallbackResource function
                }
            }
        }, superName)
    }
}

class IdlDeserializerPrinter {
    constructor(
        private readonly library: PeerLibrary,
        private readonly destFile: SourceFile,
    ) {}

    private get writer(): LanguageWriter {
        return this.destFile.content
    }

    private generateInterfaceDeserializer(target: idl.IDLInterface, prefix: string = "") {
        const methodName = this.library.getInteropName(target)
        const type = idl.createReferenceType(target.name)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], [])), writer => {
            const canDeserializeProperty = (prop: idl.IDLProperty): boolean => {
                if (!idl.isReferenceType(prop.type)) return true
                const decl = this.library.resolveTypeReference(prop.type)
                return decl === undefined || (!idl.isInterface(decl) && !idl.isClass(decl))
            }
            if (writer.language === Language.ARKTS && collectProperties(target, this.library).some(it => !canDeserializeProperty(it))) {
                writer.writeStatement(writer.makeThrowError("Waiting for 20642 issue to be fixed"))
                return
            }
            if (isMaterialized(target)) {
                this.generateMaterializedBodyDeserializer(target)
            } else if (isBuilderClass(target)) {
                this.generateBuilderClassDeserializer(target, type)
            } else {
                this.generateInterfaceBodyDeserializer(target, type)
            }
        })
    }

    private declareDeserializer() {
        this.writer.writeStatement(
            this.writer.makeAssign(
                "valueDeserializer",
                idl.createReferenceType("Deserializer"),
                this.writer.makeThis(),
                true,
                false,
                { assignRef: true }
            )
        )
    }
    private generateBuilderClassDeserializer(target: idl.IDLInterface, type: idl.IDLType) {
        if (this.writer.language === Language.CPP)
            return this.generateInterfaceBodyDeserializer(target, type)
        this.writer.writeStatement(this.writer.makeThrowError("Can not deserialize builder class"))
    }
    private generateInterfaceBodyDeserializer(target: idl.IDLInterface, type: idl.IDLType) {
        const properties = collectProperties(target, this.library)
        // using list initialization to prevent uninitialized value errors
        const valueType = type // not used, if language === TS

        if (this.writer.language === Language.CPP)
            this.writer.writeStatement(this.writer.makeAssign("value", valueType, this.writer.makeString(`{}`), true, false))
        if (idl.isInterface(target) || idl.isClass(target)) {
            if (properties.length > 0) {
                this.declareDeserializer()
            }
            properties.forEach(it => {
                const type = this.library.flattenType(it.type)
                let typeConvertor = this.library.typeConvertor(`value`, type, it.isOptional)
                this.writer.writeStatement(typeConvertor.convertorDeserialize(`${it.name}_buf`, `valueDeserializer`, (expr) => {
                    if (this.writer.language === Language.CPP)
                        return this.writer.makeAssign(`value.${this.writer.escapeKeyword(it.name)}`, undefined, expr, false)
                    return this.writer.makeAssign(`${it.name}_result`, idl.maybeOptional(it.type, it.isOptional), expr, true, true)
                }, this.writer))
            })
            if (this.writer.language !== Language.CPP) {
                const propsAssignees = properties.map(it => {
                    if (this.writer.language === Language.ARKTS) {
                        if (stubIsTypeCallback(this.library, it.type))
                            return `${it.name}: undefined`
                    }
                    return `${it.name}: ${it.name}_result`
                })
                this.writer.writeStatement(this.writer.makeAssign("value", valueType, this.writer.makeCast(this.writer.makeString(`{${propsAssignees.join(',')}}`), type), true, false))
            }
        } else {
            if (this.writer.language === Language.CPP) {
                let typeConvertor = this.library.declarationConvertor("value", idl.createReferenceType((target as idl.IDLInterface).name), target)
                this.declareDeserializer()
                this.writer.writeStatement(typeConvertor.convertorDeserialize(`value_buf`, `valueDeserializer`, (expr) => {
                   return this.writer.makeAssign(`value`, undefined, expr, false)
                }, this.writer))
            }
        }
        this.writer.writeStatement(this.writer.makeReturn(
            this.writer.makeCast(this.writer.makeString("value"), type)))
    }

    private generateMaterializedBodyDeserializer(target: idl.IDLInterface) {
        this.declareDeserializer()
        this.writer.writeStatement(
            this.writer.makeAssign(`ptr`, idl.IDLPointerType, this.writer.makeMethodCall(
                `valueDeserializer`, `readPointer`, []), true, false),
        )
        if (this.writer.language === Language.CPP) {
            this.writer.writeStatement(
                this.writer.makeReturn(this.writer.makeString(`{ ptr }`))
            )
            return
        }
        // TBD: Use explicit cast for CanvasRenderingContext2D and UIExtensionProxy classes
        // to avoid errors
        // for CanvasRenderingContext2D "Types of property 'clip' are incompatible."
        // for UIExtensionProxy "Types of property 'off' are incompatible."
        if (["CanvasRenderingContext2D", "UIExtensionProxy"].includes(target.name)) {
            this.writer.print(`// TBD: remove explicit for ${target.name} class`)
            const unsafe = this.writer.language === Language.TS
            this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeCast(
                        this.writer.makeMethodCall(
                            getInternalClassName(target.name), "fromPtr", [this.writer.makeString(`ptr`)]
                        ),
                        idl.createReferenceType(target.name),
                        { unsafe: unsafe }
                    )
                )
            )
            return
        }
        this.writer.writeStatement(
            this.writer.makeReturn(
                this.writer.makeMethodCall(
                    getInternalClassName(target.name), "fromPtr", [this.writer.makeString(`ptr`)]
                )
            )
        )
    }

    private generateCallbackDeserializer(target: idl.IDLCallback): void {
        if (this.writer.language === Language.CPP)
            // callbacks in native are just CallbackResource while in managed we need to convert them to
            // target language callable
            return
        if (PeerGeneratorConfig.ignoredCallbacks.has(target.name))
            return
        const methodName = this.library.getInteropName(target)
        const type = idl.createReferenceType(target.name)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], [])), writer => {
            const resourceName = "_resource"
            const callName = "_call"
            const argsSerializer = "_args"
            const continuationValueName = "_continuationValue"
            const continuationCallbackName = "_continuationCallback"
            writer.writeStatement(writer.makeAssign(
                resourceName,
                idl.createReferenceType("CallbackResource"),
                writer.makeMethodCall(`this`, `readCallbackResource`, []),
                true,
            ))
            writer.writeStatement(writer.makeAssign(
                callName,
                idl.IDLPointerType,
                writer.makeMethodCall(`this`, `readPointer`, []),
                true,
            ))
            const callbackSignature = new NamedMethodSignature(
                target.returnType,
                target.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional)),
                target.parameters.map(it => it.name),
            )
            const hasContinuation = !idl.isVoidType(target.returnType)
            let continuation: LanguageStatement[] = []
            if (hasContinuation) {
                const continuationReference = this.library.createContinuationCallbackReference(target.returnType)
                const continuationConvertor = this.library.typeConvertor(continuationCallbackName, continuationReference)
                const returnType = target.returnType
                const optionalReturnType = idl.createOptionalType(target.returnType)
                continuation = [
                    writer.makeAssign(continuationValueName, optionalReturnType, undefined, true, false),
                    writer.makeAssign(
                        continuationCallbackName,
                        continuationReference,
                        writer.makeLambda(new NamedMethodSignature(idl.IDLVoidType, [returnType], [`value`]), [
                            writer.makeAssign(continuationValueName, undefined, writer.makeString(`value`), false)
                        ]),
                        true,
                    ),
                    new ProxyStatement(writer => {
                        continuationConvertor.convertorSerialize(argsSerializer, continuationCallbackName, writer)
                    }),
                ]
            }
            writer.writeStatement(writer.makeReturn(writer.makeLambda(callbackSignature, [
                writer.makeAssign(`${argsSerializer}Serializer`, idl.createReferenceType('Serializer'), writer.makeMethodCall('Serializer', 'hold', []), true),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writeInt32`,
                    [writer.makeString(`${resourceName}.resourceId`)])),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writePointer`,
                    [writer.makeString(callName)])),
                ...target.parameters.map(it => {
                    const convertor = this.library.typeConvertor(it.name, it.type!, it.isOptional)
                    return new ProxyStatement((writer: LanguageWriter) => {
                        convertor.convertorSerialize(argsSerializer, it.name, writer)
                    })
                }),
                ...continuation,
                new ExpressionStatement(writer.makeNativeCall(`_CallCallback`, [
                    writer.ordinalFromEnum(writer.makeString(`${generateCallbackKindAccess(target, writer.language)}`), idl.createReferenceType(CallbackKind)),
                    writer.makeString(`${argsSerializer}Serializer.asArray()`),
                    writer.makeString(`${argsSerializer}Serializer.length()`),
                ])),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `release`, [])),
                writer.makeReturn(hasContinuation
                    ? writer.makeCast(
                        writer.makeString(continuationValueName),
                        target.returnType)
                    : undefined),
            ])))

        })
    }

    print(prefix: string, declarationPath?: string) {
        const className = "Deserializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        if (this.writer.language == Language.CPP) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLUint8ArrayType, idl.IDLI32Type], ["data", "length"])
            prefix = prefix === "" ? PrimitiveType.Prefix : prefix
        } else if (this.writer.language === Language.ARKTS) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLBufferType, idl.IDLI32Type], ["data", "length"])
        }
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.writer.language))
        printSerializerImports(this.library, this.destFile, declarationPath)
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            for (const decl of serializerDeclarations) {
                if (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl)) {
                    this.generateInterfaceDeserializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    this.generateCallbackDeserializer(decl)
                }
            }
        }, superName)
    }
}

export function writeSerializer(library: PeerLibrary, writer: LanguageWriter, prefix: string) {
    const destFile = SourceFile.make("peers/Serializer" + writer.language.extension, writer.language, library)
    writeSerializerFile(library, destFile, prefix)
    destFile.printImports(writer)
    writer.concat(destFile.content)
}

export function writeSerializerFile(library: PeerLibrary, destFile: SourceFile, prefix: string, declarationPath?: string) {
    new IdlSerializerPrinter(library, destFile).print(prefix, declarationPath)
}

export function writeDeserializer(library: PeerLibrary, writer: LanguageWriter, prefix: string) {
    const destFile = SourceFile.make("peers/Deserializer" + writer.language.extension, writer.language, library)
    writeDeserializerFile(library, destFile, prefix)
    destFile.printImports(writer)
    writer.concat(destFile.content)
}

export function writeDeserializerFile(library: PeerLibrary, destFile: SourceFile, prefix: string, declarationPath?: string) {
    const printer = new IdlDeserializerPrinter(library, destFile)
    printer.print(prefix, declarationPath)
}

export function getSerializerDeclarations(library: PeerLibrary, dependencyFilter: DependencyFilter): SerializableTarget[] {
    const seenNames = new Set<string>()
    return library.orderedDependenciesToGenerate
        .filter((it): it is SerializableTarget => dependencyFilter.shouldAdd(it))
        .filter(it => {
            const seen = seenNames.has(it.name!)
            seenNames.add(it.name!)
            return !seen
        })
}

export function printSerializerImports(library: PeerLibrary, destFile: SourceFile, declarationPath?: string) {
    const serializerDeclarations = getSerializerDeclarations(library,
        createSerializerDependencyFilter(destFile.language))
    if (destFile.language === Language.TS) {
        const collector = (destFile as TsSourceFile).imports
        for (let [module, {dependencies, declarations}] of makeSyntheticDeclarationsFiles()) {
            declarations.forEach(it => collector.addFeature(it.name!, module))
        }

        if (!declarationPath) {
            for (let builder of library.builderClasses.keys()) {
                collector.addFeature(builder, `Ark${builder}Builder`)
            }
            collector.addFeature(`Finalizable`, `Finalizable`)
            collectMaterializedImports(collector, library)
        }

        if (declarationPath) { // This is used for OHOS library generation only
            // TODO Check for compatibility!
            const makeFeature = (node: idl.IDLEntry) => {
                let features = []
                // Enums of OHOS are accessed through namespaces, not directly
                let ns = idl.getExtAttribute(node, idl.IDLExtendedAttributes.Namespace)
                if (ns) {
                    features.push({ feature: ns, module: `./${declarationPath}` }) // TODO resolve
                }
                features.push({
                    feature: convertDeclaration(DeclarationNameConvertor.I, node),
                    module: `./${declarationPath}` // TODO resolve
                })
                return features
            }
            serializerDeclarations.filter(it => it.fileName)
                .filter(it => !idl.isCallback(it) && !(library.files.find(f => f.originalFilename == it.fileName)?.isPredefined))
                .flatMap(makeFeature)
                .forEach(it => collector.addFeature(it.feature, it.module))
        }
    }
    else if (destFile.language === Language.ARKTS) {
        const collector = new ImportsCollector()
        collector.addFeature("TypeChecker", "#components")

        for (const callback of collectUniqueCallbacks(library)) {
            if (idl.isSyntheticEntry(callback))
                continue
            const feature = convertDeclToFeature(library, callback)
            collector.addFeature(feature.feature, feature.module)
        }

        library.files.forEach(peer => peer.serializeImportFeatures
            .forEach(importFeature => collector.addFeature(importFeature.feature, importFeature.module)))

        serializerDeclarations.filter(it => isSyntheticDeclaration(it) || it.fileName)
            .filter(it => !idl.isCallback(it))
            .map(it => convertDeclToFeature(library, it))
            .forEach(it => collector.addFeature(it.feature, it.module))

        for (let builder of library.builderClasses.keys()) {
            collector.addFeature(builder, `Ark${builder}Builder`)
        }
        collectMaterializedImports(collector, library)
        // TODO Refactor to remove dependency on hardcoded paths
        collector.print(destFile.content, (declarationPath ? "." : "./peers/") + `Serializer.${destFile.language.extension}`)
    }
}

export function createSerializerDependencyFilter(language: Language): DependencyFilter {
    switch (language) {
        case Language.TS: return new DefaultSerializerDependencyFilter()
        case Language.ARKTS: return new ArkTSSerializerDependencyFilter()
        case Language.JAVA: return new DefaultSerializerDependencyFilter()
        case Language.CJ: return new DefaultSerializerDependencyFilter()
        case Language.CPP: return new DefaultSerializerDependencyFilter()
    }
    throwException("Unimplemented filter")
}

class DefaultSerializerDependencyFilter implements DependencyFilter {
    shouldAdd(node: IDLEntry): boolean {
        return !PeerGeneratorConfig.ignoreSerialization.includes(node.name!)
            && !this.isParameterized(node)
            && this.canSerializeDependency(node);
    }
    isParameterized(node: idl.IDLEntry) {
        return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)
            || ["Record", "Required"].includes(node.name!)
    }

    canSerializeDependency(dep: idl.IDLEntry): dep is SerializableTarget  {
        if (idl.isClass(dep) || idl.isInterface(dep))
            return true
        if (idl.isCallback(dep))
            return true
        return false
    }
}

class ArkTSSerializerDependencyFilter extends DefaultSerializerDependencyFilter {
    readonly arkTSBuiltTypesFilter = new ArkTSBuiltTypesDependencyFilter()
    override shouldAdd(node: IDLEntry): node is SerializableTarget {
        if (idl.isEnum(node)) {
            return true;
        }
        if (!this.arkTSBuiltTypesFilter.shouldAdd(node)) {
            return false
        }
        return super.shouldAdd(node)
    }
}
