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
import { generatorConfiguration, Language, isMaterialized, isExternalType, isBuilderClass, throwException, LanguageExpression, isInIdlize, isInIdlizeInternal, createLanguageWriter, lib, getExtractorName } from '@idlizer/core'
import { ExpressionStatement, LanguageStatement, Method, MethodSignature, NamedMethodSignature } from "../LanguageWriters"
import { LanguageWriter, PeerLibrary } from "@idlizer/core"
import { peerGeneratorConfiguration } from '../../DefaultConfiguration'
import { ImportsCollector } from "../ImportsCollector"
import {
    ArkTSBuiltTypesDependencyFilter,
    DependencyFilter,
} from '../idl/IdlPeerGeneratorVisitor'
import { collectAllProperties, collectFunctions, collectProperties } from '../printers/StructPrinter'
import { FieldModifier, MethodModifier, ProxyStatement } from '@idlizer/core'
import { createDeclarationNameConvertor } from '@idlizer/core'
import { IDLEntry } from "@idlizer/core/idl"
import { convertDeclaration, generateCallbackKindValue } from '@idlizer/core'
import { getInternalClassName, getInternalClassQualifiedName, LayoutNodeRole } from '@idlizer/core'
import { collectUniqueCallbacks } from './CallbacksPrinter'
import { collectDeclItself, collectDeclDependencies, convertDeclToFeature } from '../ImportsCollectorUtils'
import { collectDeclarationTargets } from '../DeclarationTargetCollector'
import { qualifiedName, flattenUnionType, maybeTransformManagedCallback } from '@idlizer/core'
import { NativeModule } from '../NativeModule'
import { PrinterFunction } from '../LayoutManager'
import { isComponentDeclaration } from '../ComponentsCollector'

type SerializableTarget = idl.IDLInterface | idl.IDLCallback

class SerializerPrinter {
    constructor(
        private readonly library: PeerLibrary,
        readonly language: Language,
        readonly writer: LanguageWriter,
        readonly imports: ImportsCollector,
    ) {}

    private generateInterfaceSerializer(target: idl.IDLInterface, prefix: string = "") {
        const methodName = this.library.getInteropName(target)
        this.library.setCurrentContext(`write${methodName}()`)
        this.writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType(target)], ["value"]), [MethodModifier.PUBLIC]),
            writer => {
                if (isMaterialized(target, this.library)) {
                    this.generateMaterializedBodySerializer(writer)
                } else if (isExternalType(target, this.library)) {
                    this.generateExternalTypeBodySerializer(target, writer)
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
            // import collection!!!
            if (idl.isReferenceType(type)) {
                const resolved = this.library.resolveTypeReference(type)
                if (resolved) {
                    collectDeclItself(this.library, type, this.imports)
                }
            }

            let memberAccess = writer.makeString(`value.${writer.escapeKeyword(it.name)}`)
            writer.writeStatement(writer.makeAssign(field, undefined, memberAccess, true))
            typeConvertor.convertorSerialize(`value`, field, writer)
        })
    }

    private generateMaterializedBodySerializer(writer: LanguageWriter) {
        this.declareSerializer(writer)
        const valueExpr = writer.makeString("value")
        let peerExpr: LanguageExpression
        switch (writer.language) {
            case Language.CPP:
                peerExpr = valueExpr
                break
            case Language.JAVA:
            case Language.KOTLIN:
            case Language.CJ:
                peerExpr = writer.makeMethodCall("MaterializedBase", "toPeerPtr", [valueExpr])
                break
            default:
                peerExpr = writer.makeFunctionCall("toPeerPtr", [valueExpr])
                break
        }
        writer.writeExpressionStatement(
            writer.makeMethodCall(`valueSerializer`, `writePointer`, [peerExpr]))
    }
    private generateExternalTypeBodySerializer(target: idl.IDLInterface, writer: LanguageWriter) {
        this.declareSerializer(writer)
        const valueExpr = writer.makeString("value")
        let peerExpr: LanguageExpression
        const extractor = `extractors.${getExtractorName(target, writer.language)}`
        switch (writer.language) {
            case Language.CPP:
                peerExpr = valueExpr
                break
            default:
                peerExpr = writer.makeFunctionCall(extractor, [valueExpr])
                break
        }
        writer.writeExpressionStatement(
            writer.makeMethodCall(`valueSerializer`, `writePointer`, [peerExpr]))
    }
    print(prefix: string, declarationPath?: string) {
        const className = "Serializer"
        const superName = `${className}Base`
        if (prefix == "" && this.writer.language === Language.CPP)
            prefix = generatorConfiguration().TypePrefix + this.library.libraryPrefix
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.writer.language))
        printSerializerImports(this.library, this.language, this.imports, declarationPath)
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

                writer.makeStaticBlock(() => {
                    writer.writeFieldDeclaration("pool", idl.createOptionalType(poolType), [FieldModifier.PRIVATE, FieldModifier.STATIC], true, writer.makeNull('ArrayList<Serializer>'))
                    writer.writeFieldDeclaration("poolTop", idl.IDLI32Type, [FieldModifier.PRIVATE, FieldModifier.STATIC], false, writer.makeString('-1'))
    
                    writer.writeMethodImplementation(new Method("hold", new MethodSignature(idl.createReferenceType("Serializer"), []), [MethodModifier.STATIC]),
                    writer => {
                        writer.writeStatement(writer.makeCondition(writer.makeNot(writer.makeDefinedCheck('Serializer.pool')), writer.makeBlock(
                            writer.language == Language.CJ ?
                            [
                                new ExpressionStatement(writer.makeString("Serializer.pool = ArrayList<Serializer>(8, {idx => Serializer()})"))
                            ]:
                            writer.language == Language.KOTLIN ?
                            [
                                new ExpressionStatement(writer.makeString("Serializer.pool = Array<Serializer>(8) {idx -> Serializer()}"))
                            ] :
                            [
                                writer.makeAssign("Serializer.pool", undefined, idl.isContainerType(poolType) ? writer.makeArrayInit(poolType, 8) : undefined, false),
                                writer.makeAssign("pool", poolType, writer.makeUnwrapOptional(writer.makeString("Serializer.pool")), true, true),
                                writer.makeLoop("idx", "8", writer.makeAssign(
                                    `pool[idx]`,
                                    undefined,
                                    writer.makeNewObject('Serializer'),
                                    false
                                ))
                            ]
                        )))
                        writer.writeStatement(writer.makeAssign("pool", poolType, writer.makeUnwrapOptional(
                            writer.makeString("Serializer.pool")), true, true))
                        writer.writeStatement(writer.makeCondition(writer.makeString(`Serializer.poolTop >= ${writer.castToInt(writer.makeArrayLength('pool').asString(), 32)} - 1`),
                            writer.makeBlock([writer.makeThrowError(("Serializer pool is full. Check if you had released serializers before"))])),
                        )
                        writer.writeStatement(writer.makeAssign("Serializer.poolTop", undefined,
                            writer.makeString("Serializer.poolTop + 1"), false))
                        writer.writeStatement(writer.makeAssign("serializer", undefined,
                                writer.makeArrayAccess("pool", "Serializer.poolTop"), true, false))
                        writer.writeStatement(writer.makeReturn(writer.makeString("serializer")))
                    })
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
            const ctorSignatures = this.writer.makeSerializerConstructorSignatures()
            if (ctorSignatures) {
                for (const ctorSignature of ctorSignatures) {
                    writer.writeConstructorImplementation(className, ctorSignature, writer => {},
                        {superArgs: ctorSignature.args.map((_, i) => ctorSignature!.argName(i)), superName: superName})
                }
            }
            for (const decl of serializerDeclarations) {
                if (isComponentDeclaration(this.library, decl))
                    continue
                if (idl.isInterface(decl)) {
                    this.generateInterfaceSerializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    // callbacks goes through writeCallbackResource function
                }
            }
        }, superName)
    }
}

class DeserializerPrinter {
    private continuationValueHolders = new Array<idl.IDLType>()

    constructor(
        private readonly library: PeerLibrary,
        readonly language: Language,
        readonly writer: LanguageWriter,
        readonly imports: ImportsCollector,
    ) {}

    private generateInterfaceDeserializer(target: idl.IDLInterface, prefix: string = "") {
        const methodName = this.library.getInteropName(target)
        const type = idl.createReferenceType(target)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], []), [MethodModifier.PUBLIC]), writer => {
            if (isMaterialized(target, this.library)) {
                this.generateMaterializedBodyDeserializer(target)
            } else if (isExternalType(target, this.library)) {
                this.generateExternalTypeBodyDeserializer(target)
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
                // import collection!!!
                if (idl.isReferenceType(type)) {
                    const resolved = this.library.resolveTypeReference(type)
                    if (resolved) {
                        collectDeclItself(this.library, type, this.imports)
                    }
                }
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
                    let parentProperties: idl.IDLProperty[] = []
                    const superNames = target.inheritance
                    if (superNames) {
                        const superDecls = superNames ? superNames.map(t => this.library.resolveTypeReference(t as idl.IDLReferenceType)) : undefined
                        parentProperties = superDecls!.map(decl => collectAllProperties(decl as idl.IDLInterface, this.library)).flat()
                    }
                    let ownProperties: idl.IDLProperty[] = isComponentDeclaration(this.library, target) ? [] : target.properties.filter(it => !parentProperties.map(prop => prop.name).includes(it.name))
                    
                    this.writer.writeStatement(this.writer.makeAssign("value", valueType, this.writer.makeString(`${this.writer.getNodeName(valueType)}(${ownProperties.concat(parentProperties).map(it => it.name.concat('_result')).join(', ')})`), true, false))
                } else {
                    if (this.writer.language === Language.ARKTS) {
                        if (collectFunctions(target, this.library).length > 0) {
                            this.writer.writeStatement(this.writer.makeThrowError("Interface with functions is not supported"))
                            return;
                        }
                    }

                    this.writer.writeStatement(this.writer.makeAssign("value", valueType, this.writer.makeCast(this.writer.makeString(`{${propsAssignees.join(', ')}}`), type), true, false))
                }
            }
        } else {
            if (this.writer.language === Language.CPP) {
                let typeConvertor = this.library.declarationConvertor("value", idl.createReferenceType(target), target)
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
            this.writer.makeAssign(`ptr`, idl.IDLPointerType,
                this.writer.makeMethodCall(`valueDeserializer`, `readPointer`, []), true, false))
        if (this.writer.language === Language.CPP)
            this.writer.writeStatement(
                this.writer.makeReturn(this.writer.makeCast(this.writer.makeString(`ptr`), target)))
        else
            this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeMethodCall(
                        this.writer.language == Language.CJ ?
                        getInternalClassName(this.writer.getNodeName(target)) :
                        getInternalClassQualifiedName(target, "namespace.name"), "fromPtr", [this.writer.makeString(`ptr`)])))
    }

    private generateExternalTypeBodyDeserializer(target: idl.IDLInterface) {
        this.declareDeserializer()
        this.writer.writeStatement(
            this.writer.makeAssign(`ptr`, idl.IDLPointerType,
                this.writer.makeMethodCall(`valueDeserializer`, `readPointer`, []), true, false))
        const lang = this.writer.language
        if (lang === Language.CPP)
            this.writer.writeStatement(
                this.writer.makeReturn(this.writer.makeCast(this.writer.makeString(`ptr`), target)))
        else
            this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeFunctionCall(
                        `extractors.${getExtractorName(target, lang, false)}`,
                        [this.writer.makeString(`ptr`)])))
    }

    private generateCallbackDeserializer(target: idl.IDLCallback): void {
        if (idl.hasTypeParameters(target)) {
            return
        }
        if (!this.continuationValueHolders.map(it => this.writer.getNodeName(it)).includes(this.writer.getNodeName(target.returnType))) {
            this.continuationValueHolders.push(target.returnType)
        }
        if (this.writer.language === Language.CPP)
            // callbacks in native are just CallbackResource while in managed we need to convert them to
            // target language callable
            return
        target = maybeTransformManagedCallback(target, this.library) ?? target
        const methodName = this.library.getInteropName(target)
        const type = idl.createReferenceType(target)
        if (this.writer.language == Language.CJ) {
            this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], []), [MethodModifier.PUBLIC]), writer => {
                this.writer.writeMethodCall('this', `read${methodName}`, ['false'])
            })
        }
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [idl.IDLBooleanType], ['isSync'], ['false']), [MethodModifier.PUBLIC]), writer => {
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
                    writer.language == Language.CJ ?
                    writer.makeAssign(continuationValueName, undefined, writer.makeString(`${writer.getNodeName(target.returnType).replace(/[\<\>]/g, '')}Holder(None<${writer.getNodeName(target.returnType)}>)`), true, true) :
                    writer.makeAssign(continuationValueName, optionalReturnType, undefined, true, false),
                    writer.makeAssign(
                        continuationCallbackName,
                        continuationReference,
                        writer.makeLambda(new NamedMethodSignature(idl.IDLVoidType, [returnType], [`value`]), [
                            writer.language == Language.CJ ?
                            writer.makeAssign(`${continuationValueName}.value`, undefined, writer.makeString(`value`), false) :
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
                        convertor.convertorSerialize(argsSerializer, writer.escapeKeyword(it.name), writer)
                    })
                }),
                ...continuation,
                new ExpressionStatement(
                    writer.makeTernary(
                        writer.makeString('isSync'),
                        writer.makeNativeCall(NativeModule.Interop, `_CallCallbackSync`, [
                            writer.makeString(generateCallbackKindValue(target).toString()),
                            writer.makeSerializedBufferGetter(`${argsSerializer}Serializer`),
                            writer.makeString(`${argsSerializer}Serializer.length()`),
                        ]),
                        writer.makeNativeCall(NativeModule.Interop, `_CallCallback`, [
                            writer.makeString(generateCallbackKindValue(target).toString()),
                            writer.makeSerializedBufferGetter(`${argsSerializer}Serializer`),
                            writer.makeString(`${argsSerializer}Serializer.length()`),
                        ])
                    )
                ),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `release`, [])),
                writer.makeReturn(hasContinuation
                    ? writer.makeCast(
                        writer.language == Language.CJ ?
                        writer.makeString(`${continuationValueName}.value`) :
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
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLSerializerBuffer, idl.IDLI32Type], ["data", "length"])
            prefix = prefix === "" ? generatorConfiguration().TypePrefix : prefix
        } else if (this.writer.language === Language.ARKTS) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [
                idl.createUnionType([idl.IDLSerializerBuffer, idl.IDLUint8ArrayType]), idl.IDLI32Type], ["data", "length"])
        }
        else if (this.writer.language === Language.CJ) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.IDLBufferType, idl.IDLI32Type], ["data", "length"])
        }
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.writer.language))
        printSerializerImports(this.library, this.language, this.imports, declarationPath)
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, {superArgs: ctorSignature.args.map((_, i) => ctorSignature!.argName(i)), superName: superName})
            }
            for (const decl of serializerDeclarations) {
                if (isComponentDeclaration(this.library, decl))
                    continue
                if (idl.isInterface(decl)) {
                    this.generateInterfaceDeserializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    this.generateCallbackDeserializer(decl)
                }
            }
        }, superName)
        if (this.writer.language == Language.CJ) {
            for (let valueHolder of this.continuationValueHolders) {
                let className = `${this.writer.getNodeName(valueHolder).replace(/[\<\>]/g, '')}Holder`
                this.writer.writeClass(className, (writer) => {
                    writer.makeAssign("value", idl.maybeOptional(valueHolder, true), undefined, true, false).write(writer)
                    writer.writeConstructorImplementation(className, new MethodSignature(idl.IDLAnyType, [idl.maybeOptional(valueHolder, true)]), () => {
                        writer.makeAssign("this.value", idl.maybeOptional(valueHolder, true), writer.makeString('arg0'), false, false).write(writer)
                    })
                })
            }
        }
    }
}

export function createSerializerPrinter(language: Language, prefix: string): PrinterFunction {
    return (library: PeerLibrary) => {
        const imports = new ImportsCollector()
        const writer = library.createLanguageWriter(language)
        new SerializerPrinter(library, language, writer, imports).print(prefix)
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType("Serializer"))!,
                role: LayoutNodeRole.PEER
            },
            collector: imports,
            content: writer,
        }]
    }
}

export function createDeserializerPrinter(language: Language, prefix: string): PrinterFunction {
    if (language === Language.JAVA)
        return () => []
    return (library: PeerLibrary) => {
        const imports = new ImportsCollector()
        const writer = library.createLanguageWriter(language)
        new DeserializerPrinter(library, language, writer, imports).print(prefix)
        return [{
            over: {
                node: library.resolveTypeReference(idl.createReferenceType("Deserializer"))!,
                role: LayoutNodeRole.PEER
            },
            collector: imports,
            content: writer,
        }]
    }
}

export function getSerializerDeclarations(library: PeerLibrary, dependencyFilter: DependencyFilter): SerializableTarget[] {
    const seenNames = new Set<string>()
    return collectDeclarationTargets(library)
        .map(it => it)
        .filter((it): it is SerializableTarget => dependencyFilter.shouldAdd(it))
        .filter(it => !idl.isHandwritten(it) && !isInIdlizeInternal(it) && !peerGeneratorConfiguration().components.custom.includes(it.name))
        .filter(it => !(idl.isNamedNode(it) && peerGeneratorConfiguration().isResource(it.name)))
        .filter(it => !it.typeParameters?.length || it.typeParameters.every(it => it.includes('=')))
        .filter(it => {
            const fullName = qualifiedName(it, "_", "namespace.name")
            const seen = seenNames.has(fullName)
            seenNames.add(fullName)
            return !seen
        })
}

export function printSerializerImports(library: PeerLibrary, language: Language, collector: ImportsCollector, declarationPath?: string) {
    const serializerDeclarations = getSerializerDeclarations(library,
        createSerializerDependencyFilter(language))

    if (language === Language.TS || language === Language.ARKTS) {
        collector.addFeatures([
            "SerializerBase", "DeserializerBase", "CallbackResource", "InteropNativeModule", "MaterializedBase", "Tags", "RuntimeType", "runtimeType", "toPeerPtr", 'nullptr', 'KPointer'
        ], "@koalaui/interop")
        collector.addFeatures(["int32", "int64", "float32", "unsafeCast"], "@koalaui/common")
        collectDeclItself(library, idl.createReferenceType("CallbackKind"), collector)
        collectDeclItself(library, idl.createReferenceType("Serializer"), collector)
        if (language == Language.TS && library.name === "arkoala") {
            collector.addFeatures([
                "MaterializedBase", "InteropNativeModule", "ResourceHolder",
                "nullptr", "KPointer", "isInstanceOf",
            ], "@koalaui/interop")
            collector.addFeatures(["isResource", "isPadding"], "../utils")
        }
        if (generatorConfiguration().externalTypes.size > 0
            || generatorConfiguration().externalPackages.length > 0) {
            collector.addFeature("extractors", library.layout.handwrittenPackage())
        }
        if (!declarationPath) {
            collector.addFeatures(["NativeBuffer", "KSerializerBuffer"], "@koalaui/interop")
            if (language === Language.TS) {
                collector.addFeature('Finalizable', '@koalaui/interop')
                collector.addFeatures(["NativeBuffer"], "@koalaui/interop")
            } else {
                collectDeclItself(library, idl.createReferenceType("TypeChecker"), collector)
                collector.addFeatures(["KUint8ArrayPtr", "NativeBuffer", "InteropNativeModule"], "@koalaui/interop")
            }
            if (library.name === 'arkoala') {
                collector.addFeature("CallbackTransformer", "../CallbackTransformer")
            }
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
            collectOhosImports(collector, true)
            collector.addFeature("TypeChecker", "./type_check")
        }
    }

    function collectMaterializedImports(imports: ImportsCollector, library: PeerLibrary) {
        for (const materialized of library.materializedClasses.values()) {
            const file = library.layout.resolve({
                node: materialized.decl,
                role: LayoutNodeRole.INTERFACE
            })
            const ns = idl.getNamespaceName(materialized.decl)
            const name = ns === '' ? getInternalClassName(materialized.className) : ns.split('.')[0]
            imports.addFeature(name, `./${file}`)
        }
    }

    function collectOhosImports(collector: ImportsCollector, supportsNs: boolean) {
        // TODO Check for compatibility!
        const nameCovertor = createDeclarationNameConvertor(language)
        // TODO remove this hack once enums will be namespace members too
        const forceUseByName = language === Language.ARKTS ? (node: idl.IDLEntry) => idl.isEnum(node) : () => false
        const makeFeature = (node: idl.IDLEntry) => {
            let features = []
            // Enums of OHOS are accessed through namespaces, not directly
            let ns = idl.getNamespaceName(node)
            if (supportsNs && ns && !forceUseByName(node)) {
                features.push({ feature: ns, module: `./${declarationPath}` }) // TODO resolve
            } else {
                features.push({
                    feature: convertDeclaration(nameCovertor, node),
                    module: `./${declarationPath}` // TODO resolve
                })
                // Add <class>Internal support class for materialized classes with no constructor
                // If class has a namespace, the corresponding Internal class is imported by the same namespace
                if (idl.isInterface(node) && isMaterialized(node, library) && node.constructors.length === 0) {
                    features.push({
                        feature: getInternalClassName(convertDeclaration(nameCovertor, node)), // TODO check/refactor name generation
                        module: `./${declarationPath}` // TODO resolve
                    })
                }
            }
            return features
        }
        serializerDeclarations.filter(it => it.fileName)
            .filter(it => !idl.isCallback(it) && !isInIdlize(it))
            .flatMap(makeFeature)
            .forEach(it => collector.addFeature(it.feature, it.module))
    }
}

const MATERIALIZED_BASE = idl.createInterface(
    "MaterializedBase",
    idl.IDLInterfaceSubkind.Interface, [], [], [],
    [idl.createProperty("peer", idl.IDLBooleanType)],
)

export function createSerializerDependencyFilter(language: Language): DependencyFilter {
    switch (language) {
        case Language.TS: return new DefaultSerializerDependencyFilter()
        case Language.ARKTS: return new ArkTSSerializerDependencyFilter()
        case Language.JAVA: return new DefaultSerializerDependencyFilter()
        case Language.CJ: return new DefaultSerializerDependencyFilter()
        case Language.CPP: return new DefaultSerializerDependencyFilter()
        case Language.KOTLIN: return new DefaultSerializerDependencyFilter()
    }
    throwException("Unimplemented filter")
}

class DefaultSerializerDependencyFilter implements DependencyFilter {
    shouldAdd(node: IDLEntry): boolean {
        return !peerGeneratorConfiguration().serializer.ignore.includes(node.name!)
            && (!this.isParameterized(node) || this.isParametrizedWithAllDefaults(node))
            && this.canSerializeDependency(node)
    }
    isParameterized(node: idl.IDLEntry) {
        return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)
            || ["Record", "Required"].includes(node.name!)
    }
    isParametrizedWithAllDefaults(node: idl.IDLEntry): boolean {
        return !!idl.getExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)?.split(',').every(it => it.includes("="))
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
