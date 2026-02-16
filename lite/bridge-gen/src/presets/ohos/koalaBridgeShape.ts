/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { capitalize } from "@idlizer/core";
import { IDLType, IDLParameter, IDLMethod, getFQName, IDLInterface, isInterface, createReferenceType, isPrimitiveType } from "@idlizer/core/idl";
import { D, DD, E, FunctionDeclaration, Hs, lw, LWDeclaration, LWExpression, LWKind, LWStatement, Modifier, S, std, T, Ts, Vs } from "@idlizer/ost";
import { TypeSpecSelector } from "../../generator/generator";
import { KOALAUI_SERIALIZER_BASE, KOALAUI_DESERIALIZER_BASE, KOALAUI_KRETURN_BUFFER, KOALAUI_KINT32, KOALAUI_KPOINTER, KOALAUI_KUINT8 } from "../../generator/names";
import { GeneratedNativeModule } from "../../generator/nativeModuleProducer";
import { Ask } from "../../generator/seed";
import { NotTransferrableType } from "../../generator/common";

interface UniversalParameter {
    name: string
    type: IDLType
}
function idlToUniversalParameter(param: IDLParameter): UniversalParameter {
    return {
        name: param.name,
        type: param.type,
    }
}

export function produceKoalaTwinFunction(node: IDLMethod, selector: TypeSpecSelector): FunctionDeclaration {

    const hostFunctionName = 'impl.impl_' + getFQName(node).split('.').map(capitalize).join('_')

    const parentInterface: IDLInterface | undefined = node.parent && isInterface(node.parent) ? node.parent : undefined
    const modifiers: Modifier[] = []

    const writeFunctionBody: lw.LWStatement[] = []
    const readFunctionBody: lw.LWStatement[] = []

    const callArgs: lw.LWExpression[] = []
    const receiveParameters: lw.FunctionDeclaration['parameters'] = []
    const apiCallArgs: LWExpression[] = []
    const apiCallParams: lw.FunctionDeclaration['parameters'] = []

    const hostFunction = DD({}).func(
        hostFunctionName,
        receiveParameters,
        Ts.prim.void /* this field is subject to change later in this function */,
        S.block(readFunctionBody)
    )

    const universalParameters: UniversalParameter[] = []
    if (parentInterface && !node.isStatic) {
        const parentInterfaceRef = createReferenceType(parentInterface)
        universalParameters.push({
            name: 'self',
            type: parentInterfaceRef,
        })
    }
    node.parameters.forEach(param => {
        universalParameters.push(idlToUniversalParameter(param))
    })

    const parameters = universalParameters.map(param => ({
        name: param.name,
        type: Ask.typeName(param.type)
    }))

    const wrappedFunction = DD({ modifiers }).func(
        getFQName(node),
        { implicitThisType: node.parent && isInterface(node.parent) ? Ask.typeName(node.parent) : undefined, parameters },
        isPrimitiveType(node.returnType, 'void') ? Ts.prim.void : Ask.typeName(node.returnType),
        S.block(writeFunctionBody)
    )

    const thisSerializerName = 'thisSerializer'
    const thisSerializer = E.v(thisSerializerName)
    const thisDeserializerName = 'thisDeserializer'
    const thisDeserializer = E.v(thisDeserializerName)
    let serializerUsed = false

    const writeFunctionCleanup: LWStatement[] = []

    universalParameters.forEach((param, idx) => {
        const convertor = selector.selectConvertor(param.type)
        if (convertor.toInteropTransferable) {
            const [interopCallArg, interopType] = convertor.toInteropTransferable.toInteropArgument(E.v(param.name))
            callArgs.push(interopCallArg)
            receiveParameters.push({ name: param.name, type: interopType })
            apiCallArgs.push(convertor.toInteropTransferable.fromInteropArgument(E.v(param.name)))
            apiCallParams.push({ name: param.name, type: Ask.typeName(param.type) })
        } else if (convertor.toBufferTransferable) {
            serializerUsed = true
            writeFunctionBody.push(...convertor.toBufferTransferable.toInteropBuffer(E.v(param.name), thisSerializer))
            const [stmts, callArg] = convertor.toBufferTransferable.fromInteropBuffer(thisDeserializer)
            const paramDeclName = `orderedApiPram${idx}`
            const paramDecl = S.declaration(paramDeclName, Ask.typeName(param.type), false, callArg)
            apiCallArgs.push(E.v(paramDeclName))
            apiCallParams.push({
                name: param.name,
                type: Ask.typeName(param.type)
            })
            readFunctionBody.push(
                ...(stmts.length ? [...stmts, paramDecl] : [paramDecl])
            )
        } else {
            throw new NotTransferrableType(param.type, 'fromManagedToNative')
        }
    })

    const trivialReturn = isPrimitiveType(node.returnType, 'void') || !!selector.selectConvertor(node.returnType).fromInteropTransferable
    if (serializerUsed || !trivialReturn) {
        callArgs.push(E.call(E.get(thisSerializer, 'asBuffer'), []))
        receiveParameters.push({ name: 'thisArray', type: T.c(KOALAUI_KPOINTER) })
        callArgs.push(E.call(E.get(thisSerializer, 'length'), []))
        receiveParameters.push({ name: 'thisLength', type: T.c(KOALAUI_KINT32) })

        writeFunctionBody.unshift(
            S.declaration(thisSerializerName, T.c(KOALAUI_SERIALIZER_BASE), true, E.call(E.get(E.v(KOALAUI_SERIALIZER_BASE, [Hs.isType()]), 'hold'), [])),
        )
        writeFunctionCleanup.push(
            S.e(E.call(E.get(thisSerializer, 'release'), []))
        )
        readFunctionBody.unshift(
            S.declaration(thisDeserializerName, T.c(KOALAUI_DESERIALIZER_BASE), true, E.instance2(T.c(KOALAUI_DESERIALIZER_BASE), [E.cast(E.v('thisArray'), Ts.ptr(T.c(KOALAUI_KUINT8))), E.v('thisLength')], [Hs.stackInstance()]))
        )
    }

    const writeCall = E.call(Ask.interopCall(node, hostFunction), callArgs)
    const apiCall = Ask.apiCall(node, apiCallArgs, apiCallParams, Ask.typeName(node.returnType))

    if (!isPrimitiveType(node.returnType, 'void')) {
        const returnTypeConvertor = selector.selectConvertor(node.returnType)
        if (returnTypeConvertor.fromInteropTransferable) {
            const [hostReturnExpression, interopReturnType] = returnTypeConvertor.fromInteropTransferable.toInteropReturn(apiCall)
            hostFunction.returnType = interopReturnType
            readFunctionBody.push(S.return(hostReturnExpression))
            if (!serializerUsed) {
                writeFunctionBody.push(S.return(returnTypeConvertor.fromInteropTransferable.fromInteropReturn(writeCall)))
            } else {
                writeFunctionBody.push(
                    S.declaration('retval', Ask.typeName(node.returnType), true, writeCall),
                    ...writeFunctionCleanup,
                    S.return(returnTypeConvertor.fromInteropTransferable.fromInteropReturn(E.v('retval')))
                )
            }
        } else if (returnTypeConvertor.fromBufferTransferrable) {
            const returnInteropBuffer = T.c(KOALAUI_KRETURN_BUFFER)
            hostFunction.returnType = returnInteropBuffer
            writeFunctionBody.push(S.declaration('retval', returnInteropBuffer, true, writeCall))
            writeFunctionBody.push(...writeFunctionCleanup)
            writeFunctionBody.push(S.declaration('returnDeserializer', T.c(KOALAUI_DESERIALIZER_BASE), true, E.instance2(T.c(KOALAUI_DESERIALIZER_BASE), [E.v('retval'), E.get(E.v('retval'), 'length')])))
            const [stmts, result] = returnTypeConvertor.fromBufferTransferrable.fromReturnBuffer(E.v('returnDeserializer'))
            writeFunctionBody.push(...stmts)
            writeFunctionBody.push(S.return(result))

            readFunctionBody.push(S.declaration('retvalSerializer', T.c(KOALAUI_SERIALIZER_BASE), true, E.instance2(T.c(KOALAUI_SERIALIZER_BASE), [Vs.null], [Hs.stackInstance()])))
            readFunctionBody.push(S.declaration('retval', Ask.typeName(node.returnType), true, apiCall))
            readFunctionBody.push(
                ...returnTypeConvertor.fromBufferTransferrable.toReturnBuffer(E.v('retval'), E.v('retvalSerializer'))
            )
            readFunctionBody.push(S.return(E.call(E.get(E.v('retvalSerializer'), 'toReturnBuffer'), [])))
        } else {
            throw new NotTransferrableType(node.returnType, 'fromNativeToManaged')
        }
    } else {
        writeFunctionBody.push(S.e(writeCall))
        writeFunctionBody.push(...writeFunctionCleanup)
        readFunctionBody.push(S.e(apiCall))
    }

    return wrappedFunction
}

///

export function koalaInteropBridge(nm: GeneratedNativeModule): LWDeclaration[] {
    return nm.methods.flatMap(method => {
        let macroName = 'KOALA_INTEROP_'
        const interopCallArgs: LWExpression[] = []
        interopCallArgs.push(E.v(method.nativeBridgeFunction.name.split('.')[1]))
        if (method.nativeBridgeFunction.returnType.kind === LWKind.ValueType && method.nativeBridgeFunction.returnType.name === std.names.types.void) {
            macroName += 'V'
        } else {
            interopCallArgs.push(E.type(method.nativeBridgeFunction.returnType))
        }
        macroName += method.nativeBridgeFunction.parameters.length
        method.nativeBridgeFunction.parameters.forEach(param => {
            interopCallArgs.push(E.type(param.type))
        })
        return [
            method.nativeBridgeFunction,
            D.expr(E.call(E.v(macroName), interopCallArgs))
        ]
    })
}
