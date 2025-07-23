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
    getInternalClassName,
    getHookMethod,
    isNamedNode,
    isMaterializedType,
    isPrimitiveType,
    LayoutNodeRole,
    PeerMethodSignature,
    getExtractor
} from '@idlizer/core'
import {
    ExpressionStatement,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodSignature,
    NamedMethodSignature,
} from "../LanguageWriters";
import { createReferenceType, IDLType, IDLVoidType, IDLThisType } from '@idlizer/core'
import { NativeModule } from "../NativeModule";

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

export function componentToStyleClass(component: string) {
    if (component.endsWith("Attribute"))
        component = component.substring(0, component.length - 9)
    return `Ark${component}Style`
}

const returnValName = "retval"  // make sure this doesn't collide with parameter names!

export function writePeerMethod(library: PeerLibrary, printer: LanguageWriter, method: PeerMethod, isIDL: boolean, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnType: IDLType = IDLVoidType, generics?: string[]
) {
    const hookMethod = getHookMethod(method.originalParentName, method.method.name)
    if (hookMethod && hookMethod.replaceImplementation) return
    const signature = method.method.signature as NamedMethodSignature
    let peerMethod = new Method(
        `${method.sig.name}${methodPostfix}`,
        new NamedMethodSignature(returnType, signature.args, signature.argsNames, signature.defaults, signature.argsModifiers),
        method.method.modifiers, method.method.generics
    )
    const argConvertors = method.argAndOutConvertors(library)
    printer.writeMethodImplementation(peerMethod, (writer) => {
        let scopes = argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            writer.pushIndent()
        })
        let serializerCreated = false
        let returnValueFilledThroughOutArg = false
        argConvertors.forEach((it, index) => {
            if (it.useArray) {
                if (!serializerCreated) {
                    const serializerRef = createReferenceType('SerializerBase')
                    const serializerEntry = library.resolveTypeReference(serializerRef)
                    if (!serializerEntry) {
                        throw new Error("Not found SerializerBase!")
                    }
                    writer.addFeature('SerializerBase', library.layout.resolve({ node: serializerEntry, role: LayoutNodeRole.INTERFACE }))
                    writer.addFeature('DeserializerBase', library.layout.resolve({ node: serializerEntry, role: LayoutNodeRole.INTERFACE }))
                    writer.writeStatement(
                        writer.makeAssign(`thisSerializer`, createReferenceType('SerializerBase'),
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

        if (!returnValueFilledThroughOutArg && returnType != IDLVoidType && returnType !== IDLThisType) {
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
        // TODO: refactor
        if (returnType != IDLVoidType) {
            let result: LanguageStatement[] = [writer.makeReturn(writer.makeString(returnValName))]
            if (returnValueFilledThroughOutArg) {
                // keep result
            } else if (returnsThis(method, returnType)) {
                result = [writer.makeReturn(writer.makeString("this"))]
            } else if (method instanceof MaterializedMethod && method.sig.name !== PeerMethodSignature.CTOR) {
                if (isNamedNode(returnType)
                    && (returnType.name === method.originalParentName || isMaterializedType(returnType, writer.resolver))) {
                    result = [
                        ...constructMaterializedObject(writer, signature, "obj", returnValName),
                        writer.makeReturn(writer.makeString("obj"))
                    ]
                } else if (returnType == idl.IDLAnyType) {
                    // Read as resource
                    // Change any return type to the serializer buffer in NativeModule
                    // result = makeDeserializedReturn(library, printer, returnType)
                } else if (!isPrimitiveType(returnType)) {
                    const returnTypeConvertor = new InteropReturnTypeConvertor(library)
                    if ((idl.IDLContainerUtils.isSequence(returnType) || idl.IDLContainerUtils.isRecord(returnType)) && writer.language != Language.JAVA) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else if (returnTypeConvertor.isReturnInteropBuffer(returnType)
                        && !(library.typeConvertor(returnValName, returnType) instanceof CustomTypeConvertor)
                        && writer.language != Language.JAVA) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else {
                        // todo: implement deserialization for types other than enum
                        result = [writer.makeThrowError("Object deserialization is not implemented.")]

                        if (idl.isReferenceType(returnType)) {
                            const enumEntry = library.resolveTypeReference(returnType)
                            if (enumEntry && idl.isEnum(enumEntry))
                                result = [
                                    writer.makeReturn(writer.enumFromI32(writer.makeString(returnValName), enumEntry))
                                ]
                        }
                    }
                } else if (returnType === idl.IDLBufferType && writer.language !== Language.JAVA) {
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
                writer.writeStatement(stmt)
            }
        }
    })
}

function makeDeserializedReturn(library: PeerLibrary, writer: LanguageWriter, returnType: IDLType): LanguageStatement[] {
    const deserializerName = `${returnValName}Deserializer`
    writer.writeStatement(
        writer.makeAssign(
            deserializerName,
            idl.createReferenceType("DeserializerBase"),
            writer.makeString(makeDeserializerInstance(returnValName, writer.language)),
            true,
            false,
            { assignRef: true }
        )
    )

    const returnConvertor = library.typeConvertor(returnValName, returnType)
    const returnResultValName = "returnResult"
    return [
        returnConvertor.convertorDeserialize(
            'buffer',
            deserializerName,
            (expr) => writer.makeAssign(returnResultValName, returnType, expr, true),
            writer
        ),
        writer.makeReturn(writer.makeString(returnResultValName))
    ]
}

function makeDeserializerInstance(returnValName: string, language: Language) {
    if (language === Language.TS) {
        return `new DeserializerBase(${returnValName}.buffer, ${returnValName}.byteLength)`
    } else if (language === Language.ARKTS) {
        return `new DeserializerBase(${returnValName}, ${returnValName}.length)`
    } else if (language === Language.JAVA) {
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
    return !!method.sig.context && returnType === IDLThisType
}

function constructMaterializedObject(writer: LanguageWriter, signature: MethodSignature,
    resultName: string, peerPtrName: string): LanguageStatement[] {
    const retType = signature.returnType
    if (!idl.isReferenceType(retType)) {
        throw new Error("Method returns wrong value")
    }
    // TODO: Use "ClassNameInternal.fromPtr(ptr)"
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
