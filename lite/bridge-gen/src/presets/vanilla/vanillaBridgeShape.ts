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
import * as idl from "@idlizer/core/idl"
import { capitalize } from "@idlizer/core"
import { FunctionDeclaration, Modifier, lw, LWExpression, DD, Ts, S, E, LWStatement, T, Hs, D, Vs, std, LWType, Md } from "@idlizer/ost"
import { terminate } from "@idlizer/kit"
import { TypeSpecSelector } from "../../generator/generator"
import { IDLIZER_RAW_MEMORY, IDLIZER_SERIALIZER_BASE, IDLIZER_DESERIALIZER_BASE } from "../../generator/names"
import { GeneratedNativeModule } from "../../generator/nativeModuleProducer"
import { Ask } from "../../generator/seed"
import { NotTransferrableType } from "../../generator/common"

interface UniversalParameter {
    name: string
    type: idl.IDLType
}
function idlToUniversalParameter(param: idl.IDLParameter): UniversalParameter {
    return {
        name: param.name,
        type: param.type,
    }
}

export function producesVanillaTwinFunctions(node: idl.IDLMethod, selector: TypeSpecSelector): FunctionDeclaration {

    const hostFunctionName = 'impl.' + idl.getFQName(node).split('.').map(capitalize).join('_')

    const parentInterface: idl.IDLInterface | undefined = node.parent && idl.isInterface(node.parent) ? node.parent : undefined
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
        const parentInterfaceRef = idl.createReferenceType(parentInterface)
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
        idl.getFQName(node),
        { implicitThisType: node.parent && idl.isInterface(node.parent) ? Ask.typeName(node.parent) : undefined, parameters },
        node.returnType === idl.IDLVoidType ? Ts.prim.void : Ask.typeName(node.returnType),
        S.block(writeFunctionBody)
    )

    const memoryBufferName = 'memoryBuffer'
    const memoryBuffer = E.v(memoryBufferName)
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

    const trivialReturn = node.returnType === idl.IDLVoidType || !!selector.selectConvertor(node.returnType).fromInteropTransferable
    if (serializerUsed || !trivialReturn) {
        callArgs.push(E.call(E.get(memoryBuffer, 'getPeer'), []))
        receiveParameters.push({ name: 'buffer', type: Ts.prim.pointer })
        callArgs.push(E.call(E.get(memoryBuffer, 'getLength'), []))
        receiveParameters.push({ name: 'length', type: Ts.prim.i32 })

        writeFunctionBody.unshift(
            S.declaration(memoryBufferName, T.c(IDLIZER_RAW_MEMORY), true, E.call(E.get(E.v(IDLIZER_RAW_MEMORY, [Hs.isType()]), 'allocate'), [])),
            S.declaration(thisSerializerName, T.c(IDLIZER_SERIALIZER_BASE), true, E.call(E.get(E.v(IDLIZER_SERIALIZER_BASE, [Hs.isType()]), 'use'), [memoryBuffer])),
        )
        writeFunctionCleanup.push(
            S.e(E.call(E.get(memoryBuffer, 'free'), []))
        )
        readFunctionBody.unshift(
            S.declaration(thisDeserializerName, T.c(IDLIZER_DESERIALIZER_BASE), true, E.call(E.get(E.v(IDLIZER_DESERIALIZER_BASE, [Hs.isType()]), 'fromPointer'), [E.v('buffer'), E.v('length')]))
        )
    }

    const writeCall = E.call(Ask.interopCall(node, hostFunction), callArgs)
    const apiCall = Ask.apiCall(node, apiCallArgs, apiCallParams, Ask.typeName(node.returnType))

    if (node.returnType !== idl.IDLVoidType) {
        const returnTypeConvertor = selector.selectConvertor(node.returnType)
        if (returnTypeConvertor.fromInteropTransferable) {
            const [hostReturnExpression, interopReturnType] = returnTypeConvertor.fromInteropTransferable.toInteropReturn(apiCall)
            hostFunction.returnType = interopReturnType
            readFunctionBody.push(S.return(hostReturnExpression))
            writeFunctionBody.push(S.return(returnTypeConvertor.fromInteropTransferable.fromInteropReturn(writeCall)))
        } else if(returnTypeConvertor.fromBufferTransferrable) {
            writeFunctionBody.push(S.e(writeCall))
            const [stmts, result] = returnTypeConvertor.fromBufferTransferrable.fromReturnBuffer(E.call(E.get(thisSerializer, 'swap'), []))
            writeFunctionBody.push(...stmts)
            writeFunctionBody.push(S.declaration('result', Ask.typeName(node.returnType), false, result))
            writeFunctionBody.push(...writeFunctionCleanup)
            writeFunctionBody.push(S.return(E.v('result')))

            readFunctionBody.push(
                ...returnTypeConvertor.fromBufferTransferrable.toReturnBuffer(apiCall, E.call(E.get(thisDeserializer, 'swap'), []))
            )
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

/// NODE SPECIFICS

function makeNodeInteropBridge(funcName: string, callName: string, types: lw.LWType[], returnType: lw.LWType): lw.FunctionDeclaration {
    const parameters: lw.FunctionDeclaration['parameters'] = []
    parameters.push(
        {
            name: 'env',
            type: T.c('napi_env')
        },
        {
            name: 'info',
            type: T.c('napi_callback_info')
        }
    )

    const body: lw.LWStatement[] = []
    body.push(S.declaration('argc', T.c('size_t'), true, E.c("32")))
    body.push(S.declaration('argv', T.c('napi_value'), true, E.instance('', [E.c('32')], undefined, [Hs.arrayInstance()])))
    body.push(S.e(E.call(E.v('napi_get_cb_info'), [E.v('env'), E.v('info'), E.unary('&', E.v('argc')), E.v('argv'), Vs.null, Vs.null])))
    types.forEach((type, i) => {
        body.push(S.declaration('a' + i, type, false, E.call(E.get(E.type(T.c('BridgeConvertor', type)), 'toBridgeType'), [E.v('env'), E.get(E.v('argv'), E.c(i.toFixed(0)))])))
    })
    const theCall = E.call(E.v(callName), types.map((_, i) => E.v('a' + i)))
    const isVoidReturnType = returnType.kind === lw.LWKind.ValueType && returnType.name === std.names.types.void
    if (!isVoidReturnType) {
        body.push(S.declaration('result', returnType, false, theCall))
    } else {
        body.push(S.e(theCall))
    }
    types.forEach((type, i) => {
        body.push(S.e(E.call(E.get(E.type(T.c('BridgeConvertor', type)), 'cleanup'), [E.v('a' + i)])))
    })
    if (!isVoidReturnType) {
        body.push(S.return(E.call(E.get(E.type(T.c('BridgeConvertor', returnType)), 'fromBridgeType'), [E.v('env'), E.v('result')])))
    } else {
        body.push(S.declaration('undefinedResult', T.c('napi_value'), true))
        body.push(S.e(E.call(E.v('napi_get_undefined'), [E.v('env'), E.unary('&', E.v('undefinedResult'))])))
        body.push(S.return(E.v('undefinedResult')))
    }

    return D.func(funcName, parameters, T.c('napi_value'), S.block(body))
}

function produceNodeVanillaBridges(nodeBridgeFunctions: GeneratedNativeModule): lw.LWDeclaration[] {

    const interopBridges: lw.LWDeclaration[] = []
    const endBridges: lw.LWDeclaration[] = []

    return [
        D.func(
            '_NODE_ADDON_INIT_',
            [{ name: 'env', type: T.c('napi_env') }, { name: 'exports', type: T.c('napi_value') }],
            T.c('napi_value'), S.block([
                S.declaration('nativeModuleObject', T.c('napi_value'), true),
                S.e(E.call(E.v('napi_create_object'), [E.v('env'), E.unary('&', E.v('nativeModuleObject'))])),
                ...nodeBridgeFunctions.methods.map(record => {
                    const nmPureName = '_' + idl.getFQName(record.original).split('.').join('_')
                    const nmName = E.s(nmPureName)
                    const interopBridgeName = '_NAPI_BRIDGE_' + nmPureName
                    interopBridges.push(
                        makeNodeInteropBridge(
                            interopBridgeName,
                            record.nativeBridgeFunction.name.split('.').at(-1)!,
                            record.nativeBridgeFunction.parameters.map(p => p.type),
                            record.nativeBridgeFunction.returnType,
                        )
                    )
                    endBridges.push(record.nativeBridgeFunction)
                    return S.block([
                        S.declaration('fn', T.c('napi_value'), true),
                        S.e(E.call(E.v('napi_create_function'), [E.v('env'), nmName, E.v("NAPI_AUTO_LENGTH"), E.unary('&', E.v(interopBridgeName)), Vs.null, E.unary('&', E.v('fn'))])),
                        S.e(E.call(E.v('napi_set_named_property'), [E.v('env'), E.v('nativeModuleObject'), nmName, E.v('fn')]))
                    ])
                }),
                S.e(E.call(E.v('napi_set_named_property'), [E.v('env'), E.v('exports'), E.s(nodeBridgeFunctions.nativeModuleName.split('.').at(-1)!), E.v("nativeModuleObject")])),
                S.return(E.v('exports'))
            ])
        ),
        D.expr(E.call(E.v("NAPI_MODULE"), [E.v("NODE_GYP_MODULE_NAME"), E.v("_NODE_ADDON_INIT_")])),
        ...interopBridges,
        ...endBridges
    ]
}

/// END NODE SPECIFICS

/// PANDA ANI SPECIFICS

const aniTypeMapping = new Map<string, string>([
    [std.names.types.boolean, 'ani_boolean'],
    [std.names.types.u8, 'ani_boolean'],
    [std.names.types.u16, 'ani_char'],
    [std.names.types.i8, 'ani_byte'],
    [std.names.types.i16, 'ani_short'],
    [std.names.types.i32, 'ani_int'],
    [std.names.types.i64, 'ani_long'],
    [std.names.types.u64, 'ani_long'],
    [std.names.types.f32, 'ani_float'],
    [std.names.types.f64, 'ani_double'],
    [std.names.types.nativePointer, 'ani_long'],
    [std.names.types.pointer, 'ani_long'],
    [std.names.types.string, 'ani_string'],
])

function toAniType(type: LWType): LWType {
    if (type.kind !== lw.LWKind.ValueType) {
        terminate("NOT KNOWN ANI INTEROP TYPE ")
    }
    return T.c(aniTypeMapping.get(type.name) ?? terminate("NOT SUPPORTED ANI INTEROP TYPE"))
}
function toAniReturnType(type: LWType): LWType {
    if (type.kind === lw.LWKind.ValueType && type.name === std.names.types.void) {
        return Ts.prim.void
    }
    return toAniType(type)
}

function makeAniInteropBridge(funcName: string, callName: string, types: lw.LWType[], returnType: lw.LWType): lw.FunctionDeclaration {
    const parameters: lw.FunctionDeclaration['parameters'] = []
    parameters.push(
        {
            name: 'env',
            type: Ts.ptr(T.c('ani_env'))
        },
        {
            name: 'clazz',
            type: T.c('ani_class')
        }
    )
    types.forEach((type, idx) => {
        parameters.push({
            name: 'arg' + idx,
            type: toAniType(type)
        })
    })

    const body: lw.LWStatement[] = []
    types.forEach((type, i) => {
        body.push(S.declaration('a' + i, type, false, E.call(E.get(E.type(T.c('BridgeConvertor', type)), 'toBridgeType'), [E.v('env'), E.v('arg' + i)])))
    })
    const theCall = E.call(E.v(callName), types.map((_, i) => E.v('a' + i)))
    const isVoidReturnType = returnType.kind === lw.LWKind.ValueType && returnType.name === std.names.types.void
    if (!isVoidReturnType) {
        body.push(S.declaration('result', returnType, false, theCall))
    } else {
        body.push(S.e(theCall))
    }
    types.forEach((type, i) => {
        body.push(S.e(E.call(E.get(E.type(T.c('BridgeConvertor', type)), 'cleanup'), [E.v('a' + i)])))
    })
    if (!isVoidReturnType) {
        body.push(S.return(E.call(E.get(E.type(T.c('BridgeConvertor', returnType)), 'fromBridgeType'), [E.v('env'), E.v('result')])))
    }

    return D.func(funcName, parameters, toAniReturnType(returnType), S.block(body))
}

function produceAniVanillaBridges(nodeBridgeFunctions: GeneratedNativeModule): lw.LWDeclaration[] {

    const ani_status = T.c('ani_status')
    const ani_vm = T.c('ani_vm')
    const ani_env = T.c('ani_env')
    const ani_class = T.c('ani_class')
    const ani_native_function = T.c('ani_native_function')

    const interopBridges: lw.LWDeclaration[] = []
    const endBridges: lw.LWDeclaration[] = []

    return [
        DD({ modifiers: [Md.custom('ANI_EXPORT')] }).func(
            'ANI_Constructor',
            [
                { name: 'vm', type: Ts.ptr(ani_vm) },
                { name: 'result', type: Ts.ptr(Ts.prim.u32) }
            ],
            ani_status,
            S.block([
                S.declaration('aniEnv', Ts.ptr(ani_env), true, Vs.null),
                S.e(E.call(E.get(E.v('vm', [Hs.ptrVal()]), 'GetEnv'), [E.c(1), E.unary('&', E.v('aniEnv'))])),
                S.declaration('nativeModule', ani_class, true, Vs.null),
                S.e(E.call(E.get(E.v('aniEnv', [Hs.ptrVal()]), 'FindClass'), [E.s(nodeBridgeFunctions.nativeModuleName), E.unary('&', E.v('nativeModule'))])),
                S.block(
                    nodeBridgeFunctions.methods.map(record => {
                        const nmPureName = '_' + idl.getFQName(record.original).split('.').join('_')
                        const interopBridgeName = '_ANI_BRIDGE_' + nmPureName
                        interopBridges.push(
                            makeAniInteropBridge(
                                interopBridgeName,
                                record.nativeBridgeFunction.name.split('.').at(-1)!,
                                record.nativeBridgeFunction.parameters.map(p => p.type),
                                record.nativeBridgeFunction.returnType,
                            )
                        )
                        endBridges.push(record.nativeBridgeFunction)
                        return S.block([
                            S.declaration('method', ani_native_function, true),
                            S.e(E.bin('=', E.get(E.v('method'), 'name'), E.s(nmPureName))),
                            S.e(E.bin('=', E.get(E.v('method'), 'pointer'), E.cast(E.v(interopBridgeName), Ts.const(Ts.ptr(Ts.prim.void))))),
                            S.e(E.bin('=', E.get(E.v('method'), 'signature'), Vs.null)),
                            S.e(E.call(E.get(E.v('aniEnv', [Hs.ptrVal()]), 'Class_BindStaticNativeMethods'), [E.v('nativeModule'), E.unary('&', E.v('method')), E.c(1)]))
                        ])
                    })
                ),
                S.e(E.bin('=', E.unary('*', E.v('result')), E.c(1))),
                S.return(E.v('ANI_OK'))
            ])
        ),
        ...interopBridges,
        ...endBridges
    ]
}

/// END PANDA API SPECIFICS


export function produceVanillaBridges(kind: 'node' | 'panda') {
    switch (kind) {
        case 'node': return produceNodeVanillaBridges
        case 'panda': return produceAniVanillaBridges
    }
}
