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
import {
    Language,
    CustomTypeConvertor,
    InteropReturnTypeConvertor,
    PeerMethod,
    LanguageWriter,
    MaterializedMethod,
    PeerLibrary,
    isNamedNode,
    isMaterializedType,
    isPrimitiveType,
    LayoutNodeRole,
    PeerMethodSignature,
    getExtractor,
    maybeRestoreThrows,
    isThrows,
    MethodModifier,
    PrimitiveTypesInstance,
    isMaterialized,
} from '@idlizer/core'
import { getHookMethod } from '../../DefaultConfiguration.js'
import {
    ExpressionStatement,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodSignature,
    NamedMethodSignature,
} from "../LanguageWriters/index.js";
import { createReferenceType, IDLType } from '@idlizer/core/idl'
import { NativeModule } from "../NativeModule.js";

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

const returnValName = "retval"  // make sure this doesn't collide with parameter names!

export function writePeerMethod(library: PeerLibrary, printer: LanguageWriter, method: PeerMethod, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnTypeOverride?: IDLType, isOverridden?: boolean
) {
    let returnType = returnTypeOverride ?? method.sig.returnType
    if (isPrimitiveType(returnType) && returnType.name === 'this') {
        returnType = idl.createPrimitiveType('void')
    }
    const hookMethod = getHookMethod(method.originalParentName, method.method.name)
    if (hookMethod && hookMethod.replaceImplementation) return
    const signature = method.method.signature as NamedMethodSignature
    const modifiers = method.method.modifiers ?? []
    const isStatic = modifiers.includes(MethodModifier.STATIC)
    if (!isStatic && isOverridden != undefined) {
        modifiers.push(isOverridden ? MethodModifier.OVERRIDE : MethodModifier.OPEN)
    }
    let peerMethod = new Method(
        `${method.sig.name}${methodPostfix}`,
        new NamedMethodSignature(returnType, signature.args, signature.argsNames, signature.defaults, signature.argsModifiers),
        modifiers, method.method.generics
    )
    const restoredType = maybeRestoreThrows(returnType, library)
    if (restoredType && isPrimitiveType(restoredType) && restoredType.name === 'this') {
        peerMethod.signature.returnType = idl.createPrimitiveType('void')
    }
    const argConvertors = method.argAndOutConvertors(library)
    printer.writeMethodImplementation(peerMethod, (writer) => {
        let scopes = argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            writer.pushIndent()
        })
        if (method.isCallSignature && [Language.ARKTS, Language.TS].includes(library.language)) {
            writer.print(`ArkThemeScopeManager.getInstance().applyThemeScopeIdToNode(this.peer.ptr);`)
            writer.addFeature(`ArkThemeScopeManager`, '#arktheme')
        }
        let serializerCreated = false
        let returnValueFilledThroughOutArg = false
        argConvertors.forEach((it, index) => {
            if (it.useArray) {
                if (!serializerCreated) {
                    const serializerRef = createReferenceType('idlize.internal.SerializerBase')
                    const serializerEntry = library.resolveTypeReference(serializerRef)
                    if (!serializerEntry) {
                        throw new Error("Not found SerializerBase!")
                    }
                    writer.addFeature('SerializerBase', library.layout.resolve({ node: serializerEntry, role: LayoutNodeRole.INTERFACE }))
                    writer.addFeature('DeserializerBase', library.layout.resolve({ node: serializerEntry, role: LayoutNodeRole.INTERFACE }))
                    writer.writeStatement(
                        writer.makeAssign(`thisSerializer`, createReferenceType('idlize.internal.SerializerBase'),
                            writer.makeMethodCall('SerializerBase', 'hold', []), true)
                    )
                    serializerCreated = true
                }
                if (it.isOut) {
                    returnValueFilledThroughOutArg = true
                    writer.writeStatement(it.convertorSerialize(`this`, returnValName, writer))
                } else
                    writer.writeStatement(it.convertorSerialize(`this`, it.param, writer))
            }
        })
        // Enable to see serialized data.
        if (dumpSerialized) {
            let arrayNum = 0
            argConvertors.forEach((it, index) => {
                if (it.useArray) {
                    writer.writePrintLog(`"${it.param}:", thisSerializer.asBuffer(), thisSerializer.length())`)
                }
            })
        }
        let params: LanguageExpression[] = []
        if (method.sig.context) {
            params.push(writer.makeString(ptr))
        }
        let serializerPushed = false
        argConvertors.forEach(it => {
            if (it.useArray) {
                if (!serializerPushed) {
                    params.push(writer.makeSerializedBufferGetter(`thisSerializer`))
                    params.push(writer.makeMethodCall(`thisSerializer`, 'length', []))
                    serializerPushed = true
                }
            } else {
                params.push(writer.makeString(it.convertorArg(it.param, writer)))
            }
        })
        let call = writer.makeNativeCall(
            NativeModule.Generated,
            `_${method.originalParentName}_${method.sig.name}`,
            params)

        if (!returnValueFilledThroughOutArg && !isPrimitiveType(returnType, 'void') && !isPrimitiveType(returnType, 'this')) {
            writer.writeStatement(writer.makeAssign(returnValName, undefined, call, true))
        } else {
            writer.writeStatement(writer.makeStatement(call))
        }
        if (serializerPushed)
            writer.writeStatement(new ExpressionStatement(
                writer.makeMethodCall('thisSerializer', 'release', [])))
        scopes.reverse().forEach(it => {
            writer.popIndent()
        })
        // Improve: refactor
        if (!isPrimitiveType(returnType, 'void')) {
            let result: LanguageStatement[] = [writer.makeReturn(writer.makeString(returnValName))]
            if (returnValueFilledThroughOutArg) {
                // keep result
            } else if (returnsThis(method, returnType)) {
                result = [writer.makeReturn(writer.makeString("this"))]
            } else if (method.sig.name !== PeerMethodSignature.CTOR) {
                if (isNamedNode(returnType)
                    && (returnType.name === method.originalParentName || isMaterializedType(returnType, writer.resolver))) {
                    result = [
                        ...constructMaterializedObject(writer, signature, "obj", returnValName),
                        writer.makeReturn(writer.makeString("obj"))
                    ]
                } else if (isPrimitiveType(returnType, 'any')) {
                    // Read as resource
                    // Change any return type to the serializer buffer in NativeModule
                    // result = makeDeserializedReturn(library, printer, returnType)
                } else if (!isPrimitiveType(returnType)) {
                    const returnTypeConvertor = new InteropReturnTypeConvertor(library)
                    const primitiveTypes = [
                        PrimitiveTypesInstance.String.getText(),
                        PrimitiveTypesInstance.Number.getText(),
                        PrimitiveTypesInstance.Int32.getText(),
                        PrimitiveTypesInstance.Int64.getText(),
                        PrimitiveTypesInstance.Boolean.getText(),
                    ]
                    // That hack allows to process typedefs pointing to string/number/other primitive.
                    const isPrimitiveReturnType = primitiveTypes.some(it => it === returnTypeConvertor.convert(returnType))
                    if ((idl.IDLContainerUtils.isSequence(returnType) || idl.IDLContainerUtils.isRecord(returnType))) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else if (returnTypeConvertor.isReturnInteropBuffer(returnType)
                        && !(library.typeConvertor(returnValName, returnType) instanceof CustomTypeConvertor)) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else if (isPrimitiveReturnType) {
                        // primitive can be returned as is.
                    } else {
                        // todo: implement deserialization for types other than enum
                        result = [writer.makeThrowError("Object deserialization is not implemented.")]

                        if (idl.isReferenceType(returnType)) {
                            const entry = library.resolveTypeReference(returnType)
                            if (entry && idl.isEnum(entry)) {
                                result = [
                                    writer.makeReturn(writer.enumFromI32(writer.makeString(returnValName), entry))
                                ]
                            } else if (entry && idl.isInterface(entry) && isMaterialized(entry, library)) {
                                const extractor = getExtractor(entry, writer.language, false)
                                result = [
                                    writer.makeReturn(
                                        writer.makeMethodCall(extractor.receiver!, extractor.method, [writer.makeString(`ptr`)])
                                    )
                                ]
                            }
                        }
                    }
                } else if (isPrimitiveType(returnType, 'buffer')) {
                    const instance = makeDeserializerInstance(returnValName, writer.language)
                    result = [
                        writer.makeReturn(
                            writer.makeMethodCall(
                                instance, 'readBuffer', []
                            )
                        )
                    ]
                }
            }
            for (const stmt of result) {
                LanguageWriter.managedThrowsTypeUnwrapped(false, () => writer.writeStatement(stmt))
            }
        }
    })
}

function makeDeserializedReturn(library: PeerLibrary, writer: LanguageWriter, returnType: IDLType): LanguageStatement[] {
    const deserializerName = `${returnValName}Deserializer`
    writer.addFeature(idl.createReferenceType('idlize.internal.DeserializerBase'))
    writer.writeStatement(
        writer.makeAssign(
            deserializerName,
            idl.createReferenceType("idlize.internal.DeserializerBase"),
            writer.makeString(makeDeserializerInstance(returnValName, writer.language)),
            true,
            false,
            { assignRef: true }
        )
    )

    const returnConvertor = library.typeConvertor(returnValName, returnType)
    const valueVarName = 'resultValueTmpVar'
    let resultAssigneer: (expr: LanguageExpression) => LanguageStatement = (expr) => {
        return writer.makeAssign(valueVarName, undefined, expr, false, false)
    }
    let needReturn = true
    let needReturnType: IDLType = returnType
    if (isThrows(returnType, library)) {
        const restoredThrow = maybeRestoreThrows(returnType, library)!
        needReturn = !isPrimitiveType(restoredThrow, 'void') && !isPrimitiveType(restoredThrow, 'this')
        if (needReturn) {
            needReturnType = restoredThrow
        }
        resultAssigneer = (expr) => {
            const throwStatements = [
                writer.makeThrowError(writer.makeUnwrapOptional(writer.makeString(`exceptionBuffer.exception`)))
            ]
            if (library.language === Language.ARKTS) {
                throwStatements.unshift(
                    writer.makeStatement(writer.makeMethodCall(deserializerName, 'dispose', [])),
                )
            }
            return writer.makeBlock([
                writer.makeAssign(`exceptionBuffer`, undefined, expr, true),
                writer.makeCondition(writer.makeString(`exceptionBuffer.hasException`),
                    writer.makeBlock(throwStatements),
                    needReturn
                        ? writer.makeAssign(valueVarName, undefined, writer.makeUnwrapOptional(writer.makeString(`exceptionBuffer.value`)), false, false)
                        : undefined
                )
            ], false)
        }
    }
    const optionalNeedReturnType = idl.createOptionalType(needReturnType)
    const resultStmts =  [
        writer.makeAssign(valueVarName, optionalNeedReturnType, writer.makeNull(optionalNeedReturnType), true, false),
        returnConvertor.convertorDeserialize(
            'buffer',
            deserializerName,
            resultAssigneer,
            writer
        ),
    ]
    if (library.language === Language.ARKTS) {
        resultStmts.push(writer.makeStatement(writer.makeMethodCall(deserializerName, 'dispose', [])),)
    }
    if (needReturn) {
        if (library.language === Language.ARKTS) {
            resultStmts.push(writer.makeReturn(writer.makeCast(writer.makeString(valueVarName), needReturnType)))
        } else {
            if (idl.isOptionalType(needReturnType)) {
                resultStmts.push(writer.makeReturn(writer.makeString(valueVarName)))
            } else {
                resultStmts.push(writer.makeReturn(writer.makeUnwrapOptional(writer.makeString(valueVarName))))
            }
        }
    }
    return resultStmts
}

function makeDeserializerInstance(returnValName: string, language: Language) {
    if (language === Language.TS) {
        return `new DeserializerBase(${returnValName}.buffer, ${returnValName}.byteLength)`
    } else if (language === Language.ARKTS) {
        return `new DeserializerBase(${returnValName}, ${returnValName}.length)`
    } else if (language === Language.CJ) {
        return `DeserializerBase(${returnValName}, Int32(${returnValName}.size))`
    } else if (language === Language.KOTLIN) {
        return `DeserializerBase(${returnValName}.data, ${returnValName}.length)`
    } else {
        throw new Error("not implemented")
    }
}

function returnsThis(method: PeerMethod, returnType: IDLType) {
    return !!method.sig.context && isPrimitiveType(returnType, 'this')
}

function constructMaterializedObject(writer: LanguageWriter, signature: MethodSignature,
    resultName: string, peerPtrName: string): LanguageStatement[] {
    const retType = signature.returnType
    if (!idl.isReferenceType(retType)) {
        throw new Error("Method returns wrong value")
    }
    // Improve: Use "ClassNameInternal.fromPtr(ptr)"
    // once java is generated in the same way as typescript for materialized classes
    const decl = writer.resolver.resolveTypeReference(retType)
    if (!decl) {
        throw new Error(`Can not resolve materialized class: ${retType.name}`)
    }
    if (!idl.isInterface(decl)) {
        throw new Error(`Materialized class ${decl.name}, kind: ${decl.kind} must be an IDL interface`)
    }
    const extractor = getExtractor(decl, writer.language, false)
    return [
        writer.makeAssign(
            `${resultName}`,
            retType,
            writer.makeMethodCall(extractor.receiver!, extractor.method, [writer.makeString(peerPtrName)]),
            true),
    ]
    /*
    return [
        writer.makeAssign(`${resultName}`, retType, writer.makeNewObject(forceAsNamedNode(retType).name), true),
-        writer.makeAssign(`${resultName}.peer`, createReferenceType("Finalizable"),
            writer.makeNewObject('Finalizable', [writer.makeString(peerPtrName), writer.makeString(`${forceAsNamedNode(retType).name}.getFinalizer()`)]),
            false),
    ]
    */
}
