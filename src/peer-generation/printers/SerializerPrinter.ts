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

import * as idl from '@idlize/core/idl'
import { generatorConfiguration, Language, throwException } from '@idlize/core'
import { ArkPrimitiveType } from "../ArkPrimitiveType"
import { ExpressionStatement, LanguageStatement, Method, MethodSignature, NamedMethodSignature } from "../LanguageWriters"
import { LanguageWriter } from "@idlize/core"
import { PeerGeneratorConfig } from '../PeerGeneratorConfig'
import { ImportsCollector } from '../ImportsCollector'
import { PeerLibrary } from '../PeerLibrary'
import {
    ArkTSBuiltTypesDependencyFilter,
    DependencyFilter,
    isBuilderClass,
    isMaterialized,
} from '../idl/IdlPeerGeneratorVisitor'
import { collectProperties } from '../printers/StructPrinter'
import { FieldModifier, MethodModifier, ProxyStatement } from '@idlize/core'
import { createDeclarationNameConvertor } from '@idlize/core'
import { IDLEntry } from "@idlize/core/idl"
import { convertDeclaration } from '@idlize/core'
import { collectMaterializedImports, getInternalClassName } from '../Materialized'
import { generateCallbackKindValue, maybeTransformManagedCallback } from '../ArgConvertors'
import { ArkTSSourceFile, SourceFile, TsSourceFile } from './SourceFile'
import { collectUniqueCallbacks } from './CallbacksPrinter'
import { collectDeclItself, collectDeclDependencies, convertDeclToFeature } from '../ImportsCollectorUtils'
import { collectDeclarationTargets } from '../DeclarationTargetCollector'
import { flattenUnionType } from '@idlize/core'
import { NativeModule } from '../NativeModule'

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
                if (isMaterialized(target, this.library)) {
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
            const type = flattenUnionType(this.library, it.type)
            let typeConvertor = this.library.typeConvertor(`value`, type, it.isOptional)

            let memberAccess = writer.makeString(`value.${writer.escapeKeyword(it.name)}`)
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

    private generateLengthSerializer() {
        // generate Length serializer only if there is such a type
        if (!collectDeclarationTargets(this.library).some(it => it === idl.IDLLengthType)) return

        const methodName = idl.IDLLengthType.name
        const value = "value"

        const serializerBody = this.writer.makeLengthSerializer("this", value)
        if (!serializerBody) return

        this.library.setCurrentContext(`write${methodName}()`)
        this.writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(idl.IDLVoidType, [idl.IDLLengthType], [value])),
            writer => writer.writeStatement(serializerBody))
        this.library.setCurrentContext(undefined)
    }

    print(prefix: string, declarationPath?: string) {
        const className = "Serializer"
        const superName = `${className}Base`
        let ctorSignature = this.writer.makeSerializerConstructorSignature()
        if (prefix == "" && this.writer.language === Language.CPP)
            prefix = generatorConfiguration().param("TypePrefix") + this.library.libraryPrefix
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.writer.language))
        printSerializerImports(this.library, this.destFile, declarationPath)
        // just a separator
        if (this.writer.language == Language.JAVA) {
            this.writer.print("import java.util.function.Supplier;")
        }
        this.writer.writeClass(className, writer => {
            if (writer.language == Language.JAVA || writer.language == Language.CJ)
                writer.writeFieldDeclaration('nullptr', idl.IDLPointerType, [FieldModifier.STATIC, FieldModifier.PRIVATE], false, writer.makeString('0'))


            // No need for hold() in C++.
            if (writer.language != Language.CPP) {
                const poolType = idl.createContainerType('sequence', [idl.createReferenceType("Serializer")])

                writer.writeFieldDeclaration("pool", idl.createOptionalType(poolType), [FieldModifier.PRIVATE, FieldModifier.STATIC], true, writer.makeNull('ArrayList<Serializer>'))
                writer.writeFieldDeclaration("poolTop", idl.IDLI32Type, [FieldModifier.PRIVATE, FieldModifier.STATIC], false, writer.makeString('-1'))

                writer.writeMethodImplementation(new Method("hold", new MethodSignature(idl.createReferenceType("Serializer"), []), [MethodModifier.STATIC]),
                writer => {
                    writer.writeStatement(writer.makeCondition(writer.makeNot(writer.makeDefinedCheck('Serializer.pool')), writer.makeBlock(
                        writer.language == Language.CJ ?
                        [
                            new ExpressionStatement(writer.makeString("Serializer.pool = ArrayList<Serializer>(8, {idx => Serializer()})"))
                        ]:
                        [
                            writer.makeAssign("Serializer.pool", undefined, idl.isContainerType(poolType) ? writer.makeArrayInit(poolType, 8) : undefined, false),
                            writer.makeAssign("pool", poolType, writer.makeUnwrapOptional(writer.makeString("Serializer.pool")), true, true),
                            writer.makeLoop("idx", "8", writer.makeAssign(
                                `pool[idx]`,
                                undefined,
                                writer.makeString(`${writer.language == Language.CJ ? "" : "new "}Serializer()`),
                                false
                            ))
                        ]
                    )))
                    writer.writeStatement(writer.makeAssign("pool", poolType, writer.makeUnwrapOptional(
                        writer.makeString("Serializer.pool")), true, true))
                    writer.writeStatement(writer.makeCondition(writer.makeString(`Serializer.poolTop >= ${writer.language == Language.CJ ? "Int32(pool.size)" : "pool.length"} - 1`),
                        writer.makeBlock([writer.makeThrowError(("Serializer pool is full. Check if you had released serializers before"))])),
                    )
                    writer.writeStatement(writer.makeAssign("Serializer.poolTop", undefined,
                        writer.makeString("Serializer.poolTop + 1"), false))
                    writer.writeStatement(writer.makeAssign("serializer", undefined,
                            writer.makeArrayAccess("pool", "Serializer.poolTop"), true, false))
                    writer.writeStatement(writer.makeReturn(writer.makeString("serializer")))
                })

                writer.writeMethodImplementation(new Method('release', new MethodSignature(idl.IDLVoidType, []), [MethodModifier.PUBLIC]), writer => {
                    writer.writeStatement(writer.makeCondition(writer.makeString("Serializer.poolTop == -1"),
                        writer.makeBlock([writer.makeThrowError(("Serializer pool is empty. Check if you had hold serializers before"))])),
                    )
                    writer.writeStatement(writer.makeAssign("pool", poolType, writer.makeUnwrapOptional(
                        writer.makeString("Serializer.pool")), true, true))
                    writer.writeStatement(writer.makeCondition(
                            writer.makeEquals([
                                writer.makeThis(),
                                writer.makeArrayAccess("pool", "Serializer.poolTop")
                        ]),
                        writer.makeBlock([
                            writer.makeAssign("Serializer.poolTop", undefined,
                                writer.makeString("Serializer.poolTop - 1"), false),
                            writer.makeStatement(writer.makeMethodCall('super', 'release', [])),
                            writer.makeReturn()
                        ]
                    )))

                    writer.writeStatement(writer.makeThrowError(("Only last serializer should be released")))
                })
            }
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {
                }, ctorMethod)
            }
            for (const decl of serializerDeclarations) {
                if (idl.isInterface(decl)) {
                    this.generateInterfaceSerializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    // callbacks goes through writeCallbackResource function
                }
            }
            this.generateLengthSerializer()
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
            if (isMaterialized(target, this.library)) {
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
        if ([idl.IDLInterfaceSubkind.Interface, idl.IDLInterfaceSubkind.Class].includes(target.subkind)) {
            if (properties.length > 0) {
                this.declareDeserializer()
            }
            properties.forEach(it => {
                const type = flattenUnionType(this.library, it.type)
                let typeConvertor = this.library.typeConvertor(`value`, type, it.isOptional)
                this.writer.writeStatement(typeConvertor.convertorDeserialize(`${it.name}_buf`, `valueDeserializer`, (expr) => {
                    if (this.writer.language === Language.CPP)
                        return this.writer.makeAssign(`value.${this.writer.escapeKeyword(it.name)}`, undefined, expr, false)
                    return this.writer.makeAssign(`${it.name}_result`, idl.maybeOptional(it.type, it.isOptional), expr, true, true)
                }, this.writer))
            })
            if (this.writer.language !== Language.CPP) {
                const propsAssignees = properties.map(it => {
                    return `${it.name}: ${it.name}_result`
                })
                if (this.writer.language == Language.CJ) {
                    this.writer.writeStatement(this.writer.makeAssign("value", valueType, this.writer.makeString(`${this.writer.getNodeName(valueType)}(${properties.map(it => it.name.concat('_result')).join(', ')})`), true, false))
                } else {
                    this.writer.writeStatement(this.writer.makeAssign("value", valueType, this.writer.makeCast(this.writer.makeString(`{${propsAssignees.join(',')}}`), type), true, false))
                }
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
            this.writer.makeString("value")))
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
        target = maybeTransformManagedCallback(target) ?? target
        const methodName = this.library.getInteropName(target)
        const type = idl.createReferenceType(target.name)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [idl.IDLBooleanType], ['isSync'], ['false'])), writer => {
            const resourceName = "_resource"
            const callName = "_call"
            const callSyncName = '_callSync'
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
            writer.writeStatement(writer.makeAssign(
                callSyncName,
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
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writePointer`,
                    [writer.makeString(callSyncName)])),
                ...target.parameters.map(it => {
                    const convertor = this.library.typeConvertor(it.name, it.type!, it.isOptional)
                    return new ProxyStatement((writer: LanguageWriter) => {
                        convertor.convertorSerialize(argsSerializer, it.name, writer)
                    })
                }),
                ...continuation,
                new ExpressionStatement(
                    writer.makeTernary(
                        writer.makeString('isSync'),
                        writer.makeNativeCall(NativeModule.Interop, `_CallCallbackSync`, [
                            writer.makeString(generateCallbackKindValue(target).toString()),
                            writer.makeString(`${argsSerializer}Serializer.asArray()`),
                            writer.makeString(`${argsSerializer}Serializer.length()`),
                        ]),
                        writer.makeNativeCall(NativeModule.Interop, `_CallCallback`, [
                            writer.makeString(generateCallbackKindValue(target).toString()),
                            writer.makeString(`${argsSerializer}Serializer.asArray()`),
                            writer.makeString(`${argsSerializer}Serializer.length()`),
                        ])
                    )
                ),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `release`, [])),
                writer.makeReturn(hasContinuation
                    ? writer.makeCast(
                        writer.makeString(continuationValueName),
                        target.returnType)
                    : undefined),
            ])))

        })
    }

    private generateLengthDeserializer() {
        // generate Length deserializer only if there is such a type
        if (!collectDeclarationTargets(this.library).some(it => it === idl.IDLLengthType)) return

        const deserializerBody = this.writer.makeLengthDeserializer("this")
        if (!deserializerBody) return

        const methodName = idl.IDLLengthType.name
        const value = "value"

        this.library.setCurrentContext(`read${methodName}()`)
        this.writer.writeMethodImplementation(
            new Method(`read${methodName}`,
                new NamedMethodSignature(idl.createOptionalType(idl.IDLLengthType))),
            writer => writer.writeStatement(deserializerBody))
        this.library.setCurrentContext(undefined)
    }

    print(prefix: string, declarationPath?: string) {
        const className = "Deserializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        if (this.writer.language == Language.CPP) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLUint8ArrayType, idl.IDLI32Type], ["data", "length"])
            prefix = prefix === "" ? generatorConfiguration().param("TypePrefix") : prefix
        } else if (this.writer.language === Language.ARKTS) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.createContainerType("sequence", [idl.IDLU8Type]), idl.IDLI32Type], ["data", "length"])
        }
        else if (this.writer.language === Language.CJ) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLBufferType, idl.IDLI64Type], ["data", "length"])
        }
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.writer.language))
        printSerializerImports(this.library, this.destFile, declarationPath)
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature && this.writer.language != Language.CJ) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            if (this.writer.language == Language.CJ) {
                writer.print("Deserializer(data: Array<UInt8>, length: Int64) {")
                writer.pushIndent()
                writer.print("super(data, length)")
                writer.popIndent()
                writer.print("}")
            }
            for (const decl of serializerDeclarations) {
                if (idl.isInterface(decl)) {
                    this.generateInterfaceDeserializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    this.generateCallbackDeserializer(decl)
                }
            }
            this.generateLengthDeserializer()
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
    return collectDeclarationTargets(library)
        .filter((it): it is SerializableTarget => dependencyFilter.shouldAdd(it))
        .filter(it => !idl.isHandwritten(it))
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

        if (!declarationPath) {
            for (let builder of library.builderClasses.keys()) {
                collector.addFeature(builder, `Ark${builder}Builder`)
            }
            collector.addFeature(`Finalizable`, `Finalizable`)
            collector.addFeature("CallbackTransformer", "./peers/CallbackTransformer")
            collectMaterializedImports(collector, library)
        }

        if (declarationPath) { // This is used for OHOS library generation only
            collectOhosImports(collector, true)
        }
    } else if (destFile.language === Language.ARKTS) {
        const collector = (destFile as ArkTSSourceFile).imports
        if (!declarationPath) {
            collector.addFeature("TypeChecker", "#components")
            collector.addFeature("KUint8ArrayPtr", "@koalaui/interop")
            collector.addFeature("NativeBuffer", "@koalaui/interop")
            collector.addFeature("InteropNativeModule", "@koalaui/interop")
            collector.addFeature("CallbackTransformer", "./peers/CallbackTransformer")
            for (const callback of collectUniqueCallbacks(library)) {
                if (idl.isSyntheticEntry(callback))
                    continue
                const feature = convertDeclToFeature(library, callback)
                collector.addFeature(feature.feature, feature.module)
            }
            for (const decl of serializerDeclarations) {
                collectDeclItself(library, decl, collector, {
                    includeMaterializedInternals: true,
                    includeTransformedCallbacks: true,
                })
                collectDeclDependencies(library, decl, collector, {
                    expandTypedefs: true,
                    includeMaterializedInternals: true,
                    includeTransformedCallbacks: true,
                })
            }
        } else { // This is used for OHOS library generation only
            collectOhosImports(collector, false)
        }
    }

    function collectOhosImports(collector: ImportsCollector, supportsNs: boolean) {
        // TODO Check for compatibility!
        const nameCovertor = createDeclarationNameConvertor(destFile.language)
        const makeFeature = (node: idl.IDLEntry) => {
            let features = []
            // Enums of OHOS are accessed through namespaces, not directly
            let ns = idl.getExtAttribute(node, idl.IDLExtendedAttributes.Namespace)
            if (supportsNs && ns) {
                features.push({ feature: ns, module: `./${declarationPath}` }) // TODO resolve
            }
            features.push({
                feature: convertDeclaration(nameCovertor, node),
                module: `./${declarationPath}` // TODO resolve
            })
            // Add <class>Internal support class for materialized classes with no constructor
            if (idl.isInterface(node) && isMaterialized(node, library) && node.constructors.length === 0) {
                features.push({
                    feature: getInternalClassName(convertDeclaration(nameCovertor, node)), // TODO check/refactor name generation
                    module: `./${declarationPath}` // TODO resolve
                })
            }
            return features
        }
        serializerDeclarations.filter(it => it.fileName)
            .filter(it => !idl.isCallback(it) && !(library.files.find(f => f.originalFilename == it.fileName)?.isPredefined))
            .flatMap(makeFeature)
            .forEach(it => collector.addFeature(it.feature, it.module))
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
            && this.canSerializeDependency(node)
    }
    isParameterized(node: idl.IDLEntry) {
        return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)
            || ["Record", "Required"].includes(node.name!)
    }

    canSerializeDependency(dep: idl.IDLEntry): dep is SerializableTarget  {
        if (idl.isInterface(dep)) {
            return [idl.IDLInterfaceSubkind.Class, idl.IDLInterfaceSubkind.Interface].includes(dep.subkind)
        }
        if (idl.isCallback(dep))
            return true
        return false
    }
}

class ArkTSSerializerDependencyFilter extends DefaultSerializerDependencyFilter {
    readonly arkTSBuiltTypesFilter = new ArkTSBuiltTypesDependencyFilter()
    override shouldAdd(node: IDLEntry): node is SerializableTarget {
        if (idl.isEnum(node)) {
            return true
        }
        if (!this.arkTSBuiltTypesFilter.shouldAdd(node)) {
            return false
        }
        return super.shouldAdd(node)
    }
}
