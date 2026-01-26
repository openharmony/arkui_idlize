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

import { IDLType, isReferenceType, isPrimitiveType, isOptionalType, isContainerType, DebugUtils, IDLMethod, isInterface, IDLInterface, getFQName, IDLEnum, IDLPrimitiveType, IDLPrimitiveTypeKind, IDLContainerType, IDLContainerUtils, IDLOptionalType, isNamespace, isEnum, isCallback, IDLKind, IDLReferenceType, IDLEntry, createReferenceType, IDLCallback, createMethod, createParameter, createPrimitiveType, IDLProperty, linkParentBack, isMethod, hasExtAttribute, IDLExtendedAttributes, getExtAttribute, forEachChild, isUnionType, toIDLString, printType, isType, isTypedef, IDLTypedef, getPackageClause, getNamespaceName, getNamespacesPathFor } from "@idlizer/core/idl"
import { LWType, FunctionDeclaration, Modifier, Md, E, T, Vs, DD, S, D, Ts, LWExpression, LWStatement, std, LWKind } from "@idlizer/ost"
import { terminate, ProducerResult, ProducerContext, Seed, onlyFor } from "@idlizer/kit"
import { GeneratorLibrary } from "./library"
import { TYPES } from "./shared"
import { selectDeclaration, selectEQ, Selector, SelectorBuilder, selectReference, selectType } from "./selector"
import { capitalize } from "@idlizer/core"
import { makeStructureInfo } from "./structs"

export class GeneratorSeed extends Seed {

    constructor(
        public typeToGenerate: IDLType
    ) {
        super()
    }

    private hashFromType(type: IDLType): string {
        if (isReferenceType(type)) {
            return 'REF:' + type.name
        }
        if (isPrimitiveType(type)) {
            return 'PRIMITIVE:' + type.name
        }
        if (isOptionalType(type)) {
            return 'OPTIONAL:' + this.hashFromType(type.type)
        }
        if (isContainerType(type)) {
            return 'CONTAINER:' + type.elementType.map(e => this.hashFromType(e)).join(':')
        }
        terminate(`CAN NOT HASH TYPE "${DebugUtils.debugPrintType(type)}"`)
    }

    hash(): string {
        return this.hashFromType(this.typeToGenerate)
    }

    debugMessage(): string {
        return `Generating "${printType(this.typeToGenerate)}"`
    }
}

export const GO = {
    typeName: (type: IDLType): LWType => T.hole(new GeneratorSeed(type))
}

///

const NM_METHOD_PREFIX = '_'
const NATIVE_MODULE_NAME = 'framework.GraphicsNativeModule'

function guessNativeModuleFunctionByParent(parent: IDLInterface): string {
    const methodName: string[] = []
    const parentPackage = getPackageClause(parent).slice()
    parentPackage.pop() // this is the file name
    methodName.push(...parentPackage)
    const parentsNamespaces = getNamespacesPathFor(parent)
    parentsNamespaces.forEach(ns => {
        methodName.push(ns.name)
    })
    methodName.push(parent.name)
    return methodName.reduce((a, s) => a + s + '_', NM_METHOD_PREFIX)
}

function guessNativeModuleFunctionName(method: IDLMethod) {
    let methodName = ''
    if (method.parent && isInterface(method.parent)) {
        methodName += guessNativeModuleFunctionByParent(method.parent)
    }
    methodName += capitalize(method.name)
    return methodName
}

function guessNativeModuleFinalizerName(parent: IDLInterface) {
    return guessNativeModuleFunctionByParent(parent) + 'GetFinalizer'
}

///

function satisfyTypePred(type: IDLType, predicate: (type: IDLType) => boolean): boolean {
    if (predicate(type)) {
        return true
    }
    let found = false
    forEachChild(type, (node) => {
        if (isType(node) && predicate(node)) {
            found = true
        }
    })
    return found
}

function isPrimitiveCollection(type: IDLContainerType, lib: GeneratorLibrary): boolean {
    const elemType = type.elementType[0]
    if (isPrimitiveType(elemType, 'i32') || isPrimitiveType(elemType, 'f32') || isPrimitiveType(elemType, 'String')) {
        return true
    }
    if (isReferenceType(type.elementType[0])) {
        const decl = lib.toDeclaration(type.elementType[0])
        if (isInterface(decl)) {
            return true
        }
        if (isEnum(decl)) {
            return true
        }
    }
    return false
}

function evalBlacklistMethodFilter(text: string, lib: GeneratorLibrary, methodOrProp: IDLMethod | IDLProperty): boolean {
    if (!text.startsWith('$')) {
        terminate(`CAN NOT FILTER WITH OPTION "${text}"`)
    }
    const [command, ...values] = text.split(':')
    if (command === '$NAME') {
        return methodOrProp.name === values[0]
    }
    if (command === '$PARAM_IS') {
        const collectedTypes = isMethod(methodOrProp)
            ? methodOrProp.parameters.map(p => p.type)
            : [methodOrProp.type]
        const types = collectedTypes.map(t => lib.followTypedefs(t))
        switch (values[0]) {
            case 'generalSequence': return types.some(t => satisfyTypePred(t, t => isContainerType(t) && IDLContainerUtils.isSequence(t) && !isPrimitiveCollection(t, lib)))
            case 'optional': return types.some(t => satisfyTypePred(t, isOptionalType))
            case 'container': return types.some(t => satisfyTypePred(t, isContainerType))
            case 'buffer': return types.some(t => satisfyTypePred(t, x => isPrimitiveType(x, 'buffer')))
            case 'reference': return types.some(t => satisfyTypePred(t, x => isReferenceType(x) && x.name === values[1]))
            case 'union': return types.some(t => satisfyTypePred(t, isUnionType))
        }
        terminate(`UNKNOWN ARGUMENT "${values[0]}" to command "${command}"`)
    }
    if (command === '$RET_TYPE_IS') {
        const collectedType = isMethod(methodOrProp)
            ? methodOrProp.returnType
            : methodOrProp.type
        const type = lib.followTypedefs(collectedType)
        switch (values[0]) {
            case 'generalSequence': return satisfyTypePred(type, type => isContainerType(type) && IDLContainerUtils.isSequence(type) && !isPrimitiveCollection(type, lib))
            case 'optional': return satisfyTypePred(type, isOptionalType)
            case 'container': return satisfyTypePred(type, isContainerType)
            case 'buffer': return satisfyTypePred(type, x => isPrimitiveType(x, 'buffer'))
            case 'reference': return satisfyTypePred(type, x => isReferenceType(x) && x.name === values[1])
            case 'union': return satisfyTypePred(type, isUnionType)
        }
        terminate(`UNKNOWN ARGUMENT "${values[0]}" to command "${command}"`)
    }
    terminate(`UNKNOWN PREDICATE "${command}"`)
}

function findBlacklistRecord(ref: string, lib: GeneratorLibrary) {
    return lib.config.declarations.custom.find(record => record === ref)
        ?? lib.config.declarations.ignore.find(record => {
            if (typeof record === 'string') {
                return record === ref
            }
            return record.name === ref
        })
}

function isInterfaceWhitelisted(ref: string, lib: GeneratorLibrary): boolean {
    return !findBlacklistRecord(ref, lib)
}

function isWhitelistedMember(ref: string, member: IDLMethod | IDLProperty, lib: GeneratorLibrary): boolean {
    const record = findBlacklistRecord(ref, lib)
    if (!record) {
        return true
    }
    if (typeof record === 'string') {
        return true
    }
    return !record.members.find(m => member.name === m)
}

///

function printIDLTypeForce(type: IDLType, lib: GeneratorLibrary): LWType {
    type = lib.followTypedefs(type)
    if (isPrimitiveType(type)) {
        if (knownPrimitives.has(type.name)) {
            return knownPrimitives.get(type.name)!
        }
    }
    if (isContainerType(type)) {
        if (IDLContainerUtils.isSequence(type)) {
            return Ts.array(printIDLTypeForce(type.elementType[0], lib))
        }
        if (IDLContainerUtils.isRecord(type)) {
            return Ts.map(printIDLTypeForce(type.elementType[0], lib), printIDLTypeForce(type.elementType[1], lib))
        }
    }
    if (isUnionType(type)) {
        return Ts.union(type.types.map(t => printIDLTypeForce(t, lib)))
    }
    if (isOptionalType(type)) {
        return Ts.optional(printIDLTypeForce(type.type, lib))
    }
    if (isReferenceType(type)) {
        return T.c(type.name, ...(type.typeArguments?.map(t => printIDLTypeForce(t, lib)) ?? []))
    }
    terminate("NOT SUPPORTED IDL TYPE")
}

function generateCustomMethod(method: IDLMethod, lib: GeneratorLibrary, selector: Selector): FunctionDeclaration {
    const body: LWStatement[] = []
    const callee = E.get(E.v('custom'), 'impl' + getFQName(method).split('.').map(capitalize).join(''))
    const callArgs = method.parameters.map(param => E.v(param.name))
    if (!method.isStatic) {
        callArgs.unshift(Vs.self)
    }
    const call = E.call(callee, callArgs)
    if (isPrimitiveType(method.returnType, 'void')) {
        body.push(S.e(call))
    } else {
        body.push(S.return(call))
    }
    return D.func(
        method.name,
        method.parameters.map(p => ({ name: p.name, type: printIDLTypeForce(p.type, lib) })),
        printIDLTypeForce(method.returnType, lib),
        S.block(body)
    )
}

///

function generateBridgeAndNM(method: IDLMethod, lib: GeneratorLibrary, selector: Selector): [FunctionDeclaration, FunctionDeclaration] {
    const modifiers: Modifier[] = []
    if (method.isStatic) {
        modifiers.push(Md.static())
    }

    const universalParameters: {
        name: string
        expr: LWExpression
        type: IDLType
    }[] = []

    if (!method.isStatic && method.parent && isInterface(method.parent)) {
        universalParameters.push({
            name: 'self',
            expr: Vs.self,
            type: createReferenceType(method.parent)
        })
    }
    method.parameters.forEach(param => {
        universalParameters.push({
            name: param.name,
            expr: E.v(param.name),
            type: param.type
        })
    })

    const nmName = guessNativeModuleFunctionName(method)
    const nmParams: FunctionDeclaration['parameters'] = []
    const nmArgs: LWExpression[] = []
    const bridgeBody: LWStatement[] = []

    universalParameters.forEach(param => {
        const [stmt, expr, type] = selector.toNative(param.type, lib, param.expr)
        bridgeBody.push(...stmt)
        nmArgs.push(expr)
        nmParams.push({
            name: param.name,
            type: type
        })
    })
    let nmReturnType: LWType = Ts.prim.void
    const theCall = E.call(E.get(E.v(NATIVE_MODULE_NAME), nmName), nmArgs)
    if (isPrimitiveType(method.returnType, 'void') || isPrimitiveType(method.returnType, 'this')) {
        bridgeBody.push(S.e(theCall))
        if (isPrimitiveType(method.returnType, 'this')) {
            bridgeBody.push(S.return(Vs.self))
        }
    } else {
        const RETVAL = 'retval'
        const [retType, [prevStmt, postStmt], retExpr] = selector.fromNative(method.returnType, lib, E.v(RETVAL), (name, type, expr) => {
            nmArgs.push(expr)
            nmParams.push({ name, type })
        })
        nmReturnType = retType
        bridgeBody.push(...prevStmt)
        if (nmReturnType.kind === LWKind.ValueType && nmReturnType.name === Ts.prim.void.name) {
            bridgeBody.push(S.e(theCall))
        } else {
            bridgeBody.push(S.declaration(RETVAL, retType, true, theCall))
        }
        bridgeBody.push(...postStmt)
        bridgeBody.push(S.return(retExpr))
    }

    const bridge = DD({ modifiers }).func(
        method.name,
        method.parameters.map(param => ({ name: param.name, type: GO.typeName(param.type) })),
        GO.typeName(method.returnType),
        S.block(bridgeBody)
    )
    const nativeModule = DD({ modifiers: [Md.static(), Md.native()] }).func(
        nmName,
        nmParams,
        nmReturnType,
    )

    return [bridge, nativeModule]
}

///

const knownPrimitives = new Map<IDLPrimitiveTypeKind, LWType>([
    ['pointer', T.c(TYPES.pointer)],
    ['boolean', Ts.prim.boolean],
    ['i32', T.c(TYPES.i32)],
    ['u32', T.c(TYPES.u32)],
    ['f32', T.c(TYPES.f32)],
    ['buffer', Ts.prim.buffer],
    ['String', Ts.prim.str],
    ['void', Ts.prim.void],
    ['this', Ts.prim.self],
    ['Object', Ts.prim.object],
])

export function buildSelectors() {
    const selectors = new SelectorBuilder()

    /// PRIMITIVE TYPE

    knownPrimitives.forEach((mapped, typeName) => {
        selectors.register<IDLPrimitiveType>({
            select: (type: IDLType) => isPrimitiveType(type, typeName) ? type : undefined,
            makeDeclaration() {
                return {
                    continuation: mapped,
                    declarations: []
                }
            },
            toNative(_, param) {
                return [[], param, mapped]
            },
            fromNative(_, returnValue) {
                return [mapped, [[], []], returnValue]
            },
        })
    })

    /// STANDARD LIBRARY (EDIT IT CAREFULLY)

    const knownStandardTypes = new Set([
        'Error',
        'KFloat32ArrayPtr',
        'Partial'
    ])

    knownStandardTypes.forEach(typeName => {
        selectors.register<IDLReferenceType>({
            select: selectReference(typeName),
            makeDeclaration() {
                return { skip: true }
            },
            toNative() {
                terminate("OH NO!")
            },
            fromNative() {
                terminate("OH NO!")
            },
        })
    })

    /// OPTIONAL TYPE

    selectors.register<IDLOptionalType>({
        select: selectType(isOptionalType),
        makeDeclaration(type) {
            return {
                continuation: Ts.union([
                    GO.typeName(type.type),
                    Ts.prim.undefined
                ]),
                declarations: []
            }
        },
        toNative(type, param) {
            return [[], param, GO.typeName(type)]
        },
        fromNative(type, returnValue, lib, selector, modify) {
            const [innerType, [prevStmt, postStmt], innerExpr] = selector.fromNative(type.type, lib, returnValue, modify)
            if (innerType.kind === LWKind.ValueType && innerType.name === std.names.types.void) {
                const stmts: LWStatement[] = [
                    S.if(returnValue, S.block([S.return(Vs.undef)]))
                ]
                return [Ts.prim.boolean, [prevStmt, stmts.concat(postStmt)], innerExpr]
            }
            if (innerType.kind === LWKind.ValueType && innerType.name === TYPES.pointer) {
                const stmts: LWStatement[] = [
                    S.if(E.bin('==', returnValue, E.c('0')), S.block([S.return(Vs.undef)]))
                ]
                return [innerType, [prevStmt, stmts.concat(postStmt)], innerExpr]

            }
            return [innerType, [prevStmt, postStmt], innerExpr]
        },
    })

    /// CONTAINER TYPE

    function makeToInteropCycle(bufName: string, bufType: LWType, param: LWExpression, castLength: (len: LWExpression) => LWExpression, length: LWExpression, body: LWStatement[]): [LWStatement[], LWExpression, LWType] {
        return [
            [
                S.declaration(bufName, bufType, true, E.instance2(bufType, [E.bin('+', length, E.c(1))])),
                S.e(E.bin('=', E.get(E.v(bufName), E.c(0)), castLength(E.get(param, 'length')))),
                S.declaration('ii', Ts.prim.i32, true, E.c(0)),
                S.loop(E.bin('<', E.v('ii'), E.get(param, 'length')), S.block([
                    ...body,
                    S.e(E.bin('+=', E.v('ii'), E.c(1)))
                ]))
            ],
            E.v(bufName),
            bufType
        ]
    }

    function makeFromInteropCycle(bufName: string, returnBufType: LWType, bufType: LWType, returnValue: LWExpression, factor: LWExpression, body: [LWStatement[], LWExpression]): [LWType, [LWStatement[], LWStatement[]], LWExpression] {
        const bufNameLength = bufName + 'Length'
        return [
            returnBufType,
            [
                [],
                [
                    S.declaration(bufName, bufType, true, E.instance2(bufType, [])),
                    S.declaration(bufNameLength, Ts.prim.i32, true, E.call(E.get(E.get(returnValue, E.c(0)), 'toInt'), [])),
                    S.declaration('ii', Ts.prim.i32, true, E.c(1)),
                    S.loop(E.bin('<=', E.v('ii'), E.v(bufNameLength)), S.block([
                        ...body[0],
                        S.e(E.call(E.get(E.v(bufName), 'push'), [body[1]])),
                        S.e(E.bin('+=', E.v('ii'), factor)),
                    ])),
                ]
            ],
            E.v(bufName)
        ]
    }

    selectors.register<IDLContainerType>({
        select: selectType(isContainerType, IDLContainerUtils.isSequence, isPrimitiveCollection),
        makeDeclaration(type) {
            return {
                continuation: Ts.array(GO.typeName(type.elementType[0])),
                declarations: []
            }
        },
        toNative(type, param, lib) {
            const bufName = 'buffArray'
            if (isPrimitiveType(type.elementType[0])) {
                return [[], param, GO.typeName(type)]
            }
            if (isReferenceType(type.elementType[0])) {
                const decl = lib.toDeclaration(type.elementType[0])
                if (isInterface(decl)) {
                    const isDataClass = hasExtAttribute(decl, IDLExtendedAttributes.DataClass)
                    if (!isDataClass) {
                        return makeToInteropCycle(
                            bufName,
                            Ts.vector(T.c(TYPES.pointer)),
                            param,
                            (len) => E.call(E.get(len, 'toLong'), []),
                            E.get(param, 'length'),
                            [
                                S.e(E.bin('=', E.get(E.v(bufName), E.bin('+', E.v('ii'), E.c(1))), E.get(E.get(param, E.v('ii')), 'ptr')))
                            ]
                        )
                    }

                    const dataClassStat = makeStructureInfo(decl, lib)
                    const bufSize = dataClassStat.structureSize
                    return makeToInteropCycle(
                        bufName,
                        dataClassStat.bufferType,
                        param,
                        (len) => dataClassStat.basedOn === 'Int32' ? E.call(E.get(len, 'toInt'), []) : E.call(E.get(len, 'toFloat'), []),
                        E.bin('*', E.c(bufSize), E.get(param, 'length')),
                        [
                            S.e(E.call(E.get(E.get(param, E.v('ii')), 'cloneTo'), [E.v(bufName), E.bin('+', E.c(1), E.bin('*', E.c(bufSize), E.v('ii')))]))
                        ]
                    )
                }
                if (isEnum(decl)) {
                    const bufType = Ts.vector(Ts.prim.i32)
                    return makeToInteropCycle(
                        bufName,
                        bufType,
                        param,
                        len => E.call(E.get(len, 'toInt'), []),
                        E.bin('+', E.c(1), E.get(param, 'length')),
                        [
                            S.e(E.bin('=', E.get(E.v(bufName), E.bin('+', E.v('ii'), E.c(1))), E.call(E.get(E.get(param, E.v('ii')), 'valueOf'), [])))
                        ]
                    )
                }
            }
            terminate("CONTAINER TYPE IS NOT SYNCHRONIZED toNative")
        },
        fromNative(type, returnValue, lib) {
            const bufName = 'returnBufferArray'
            if (isPrimitiveType(type.elementType[0])) {
                return [GO.typeName(type), [[], []], returnValue]
            }
            if (isReferenceType(type.elementType[0])) {
                const decl = lib.toDeclaration(type.elementType[0])
                if (isInterface(decl)) {
                    const isDataClass = hasExtAttribute(decl, IDLExtendedAttributes.DataClass)
                    if (!isDataClass) {
                        return makeFromInteropCycle(
                            bufName,
                            Ts.vector(T.c(TYPES.pointer)),
                            Ts.array(GO.typeName(createReferenceType(decl))),
                            returnValue,
                            E.c(1),
                            [
                                [],
                                E.instance2(GO.typeName(createReferenceType(decl)), [E.get(returnValue, E.v('ii')), E.c('true')])
                            ]
                        )
                    }
                    const dataClassStat = makeStructureInfo(decl, lib)
                    const bufSize = dataClassStat.structureSize
                    return makeFromInteropCycle(
                        bufName,
                        dataClassStat.bufferType,
                        Ts.array(GO.typeName(createReferenceType(decl))),
                        returnValue,
                        E.c(bufSize),
                        [
                            [],
                            E.instance2(GO.typeName(createReferenceType(decl)), [returnValue, E.v('ii')])
                        ]
                    )
                }
                if (isEnum(decl)) {
                    return makeFromInteropCycle(
                        bufName,
                        Ts.vector(Ts.prim.i32),
                        Ts.array(GO.typeName(createReferenceType(decl))),
                        returnValue,
                        E.c(1),
                        [
                            [],
                            E.call(E.get(E.type(GO.typeName(createReferenceType(decl))), 'fromValue'), [E.get(returnValue, E.v('ii'))])
                        ]
                    )
                }
            }
            terminate("CONTAINER TYPE IS NOT SYNCHRONIZED fromNative")
        },
    })

    /// ENUM

    selectors.register<IDLEnum>({
        select: selectDeclaration(isEnum),
        makeDeclaration(decl, lib) {
            lib.tracker.track(decl)
            const name = getFQName(decl)
            return {
                continuation: T.c(name),
                declarations: [
                    D.enum(name, decl.elements.map(e => ({
                        name: e.name,
                        value: e.initializer
                    })))
                ]
            }
        },
        toNative(_, param) {
            return [[], E.call(E.get(param, 'valueOf'), []), T.c(TYPES.i32)]
        },
        fromNative(decl, returnValue) {
            return [T.c(TYPES.i32), [[], []], E.call(E.get(E.type(GO.typeName(createReferenceType(decl))), 'fromValue'), [returnValue])]
        },
    })

    /// INTERFACE

    selectors.register<IDLInterface>({
        select: selectDeclaration(isInterface, x => hasExtAttribute(x, IDLExtendedAttributes.DataClass)),
        makeDeclaration(decl, lib) {
            if (!isInterfaceWhitelisted(getFQName(decl), lib)) {
                return { continuation: T.c(getFQName(decl)), declarations: [] }
            }

            lib.tracker.track(decl)
            const name = getFQName(decl)
            const info = makeStructureInfo(decl, lib)
            const bufferName = 'memory'
            const offsetName = 'offset'
            return {
                continuation: T.c(name),
                declarations: [
                    D.class(name,
                        [
                            { name: bufferName, type: info.bufferType, modifiers: [Md.private()] },
                            { name: offsetName, type: Ts.prim.i32, modifiers: [Md.private()] }
                        ],
                        [
                            D.func(
                                std.names.members.ctor,
                                info.ctor.parameters.map(param => ({
                                    name: param.name,
                                    type: GO.typeName(param.type)
                                })),
                                Ts.prim.void,
                                S.block([
                                    S.e(E.bin('=', E.get(Vs.self, bufferName), info.init())),
                                    S.e(E.bin('=', E.get(Vs.self, offsetName), E.c(0))),
                                    ...info.ctor.parameters.flatMap((param, i) => info.assignTo(i, E.c(0), E.get(Vs.self, bufferName), E.v(param.name))),
                                ])
                            ),
                            D.func(std.names.members.ctor, [{ name: 'buf', type: info.bufferType }, { name: 'off', type: Ts.prim.i32 }], Ts.prim.void, S.block([
                                S.e(E.bin('=', E.get(Vs.self, bufferName), E.v('buf'))),
                                S.e(E.bin('=', E.get(Vs.self, offsetName), E.v('off'))),
                            ])),
                            DD({ modifiers: [Md.static()] }).func(
                                'create',
                                info.ctor.parameters.map(param => ({
                                    name: param.name,
                                    type: GO.typeName(param.type)
                                })),
                                T.c(name),
                                S.block([
                                    S.return(E.instance2(T.c(name), info.ctor.parameters.map(param => E.v(param.name))))
                                ])
                            ),
                            DD({ modifiers: [Md.static()] }).func(
                                'empty',
                                [],
                                T.c(name),
                                S.block([
                                    S.declaration(bufferName, info.bufferType, true, info.init()),
                                    S.return(E.instance2(T.c(name), [E.v(bufferName), E.c(0)]))
                                ])
                            ),
                            ...info.ctor.parameters.flatMap((param, idx) => {
                                const [stmt, expr] = info.readFrom(idx, E.get(Vs.self, offsetName), E.get(Vs.self, bufferName))
                                const getter = DD({ modifiers: [Md.getter()] }).func(
                                    param.name,
                                    [],
                                    GO.typeName(param.type),
                                    S.block([
                                        ...stmt,
                                        S.return(expr)
                                    ])
                                )
                                const setter = DD({ modifiers: [Md.setter()] }).func(
                                    param.name,
                                    [{ name: 'value', type: GO.typeName(param.type) }],
                                    Ts.prim.void,
                                    S.block(info.assignTo(idx, E.get(Vs.self, offsetName), E.get(Vs.self, bufferName), E.v('value')))
                                )

                                return [getter, setter]
                            }),
                            ...info.ctor.parameters.map((param, i) => {
                                return D.func('with' + capitalize(param.name), [{ name: 'value', type: GO.typeName(param.type) }], T.c(name), S.block([
                                    S.return(
                                        E.instance2(T.c(name), info.ctor.parameters.map((p, j) => {
                                            if (i === j) {
                                                return E.v('value')
                                            }
                                            return E.get(Vs.self, p.name)
                                        }))
                                    )
                                ]))
                            }),
                            D.func(
                                'toBuffer',
                                [],
                                info.bufferType,
                                S.block([
                                    S.if(E.bin('==', E.get(Vs.self, offsetName), E.c(0)), S.block([
                                        S.return(E.get(Vs.self, bufferName))
                                    ])),
                                    S.declaration('clonedBuff', info.bufferType, true, info.init()),
                                    S.e(E.call(E.get(Vs.self, 'cloneTo'), [E.v('clonedBuff'), E.c(0)])),
                                    S.return(E.v('clonedBuff'))
                                ])
                            ),
                            D.func(
                                'cloneTo',
                                [
                                    { name: 'dst', type: info.bufferType },
                                    { name: 'dstOffset', type: Ts.prim.i32 }
                                ],
                                Ts.prim.void,
                                S.block(info.clone(E.get(Vs.self, bufferName), E.get(Vs.self, offsetName), E.v('dst'), E.v('dstOffset')))
                            )
                        ]
                    )
                ]
            }
        },
        fromNative(decl, returnValue, lib, _selector, pushArg) {
            const info = makeStructureInfo(decl, lib)
            if (info.isWriteable) {
                pushArg(
                    'returnBuffer',
                    info.bufferType,
                    E.call(E.get(E.v('returnBuffer'), 'toBuffer'), [])
                )
                const ref = GO.typeName(createReferenceType(decl))
                return [Ts.prim.void, [[S.declaration('returnBuffer', ref, true, E.call(E.get(E.type(ref), 'empty'), []))], []], E.v('returnBuffer')]
            }
            return [
                info.bufferType,
                [[], []],
                E.instance2(GO.typeName(createReferenceType(decl)), [returnValue])
            ]
        },
        toNative(decl, param, lib) {
            const info = makeStructureInfo(decl, lib)
            return [[], E.call(E.get(param, 'toBuffer'), []), info.bufferType]
        },
    })

    selectors.register<IDLInterface>({
        select: selectDeclaration(isInterface, x => !hasExtAttribute(x, IDLExtendedAttributes.DataClass)),
        makeDeclaration(decl, lib, selector) {
            if (!isInterfaceWhitelisted(getFQName(decl), lib)) {
                return { continuation: T.c(getFQName(decl)), declarations: [] }
            }

            lib.tracker.track(decl)

            const name = getFQName(decl)

            const nativeModuleMethods: FunctionDeclaration[] = []
            const generatedMethods: FunctionDeclaration[] = []

            // finalizers
            const nmFinalizerName = guessNativeModuleFinalizerName(decl)
            generatedMethods.push(
                DD({ modifiers: [Md.static()] }).func(
                    'getFinalizer', [], T.c(TYPES.pointer), S.block([
                        S.return(E.call(E.get(E.v(NATIVE_MODULE_NAME), nmFinalizerName), []))
                    ])
                )
            )
            nativeModuleMethods.push(DD({ modifiers: [Md.static(), Md.native()] }).func(nmFinalizerName, [], T.c(TYPES.pointer)))

            // constructor
            generatedMethods.push(
                D.func(std.names.members.ctor,
                    [
                        { name: 'ptr', type: T.c(TYPES.pointer) },
                        { name: 'managed', type: Ts.prim.boolean }
                    ],
                    Ts.prim.void,
                    S.block([
                        S.e(
                            E.call(Vs.base, [
                                E.v('ptr'),
                                E.call(E.get(E.type(GO.typeName(createReferenceType(decl))), 'getFinalizer'), []),
                                E.v('managed')
                            ])
                        )
                    ])
                )
            )

            // regular methods
            const methodsToGenerate: IDLMethod[] = []
            decl.properties.forEach(prop => {
                if (!isWhitelistedMember(getFQName(decl), prop, lib)) {
                    return
                }
                if (lib.config.declarations.censor.methods.some(pred => evalBlacklistMethodFilter(pred, lib, prop))) {
                    return
                }

                let isSetter = true
                let isGetter = true

                const accessAttrs = prop.extendedAttributes?.filter(attr => attr.name === IDLExtendedAttributes.Accessor).map(attr => attr.value ?? '').join(',')
                if (accessAttrs) {
                    isGetter = false
                    isSetter = false
                    if (accessAttrs.includes('Getter')) {
                        isGetter = true
                    }
                    if (accessAttrs.includes('Setter')) {
                        isSetter = true
                    }
                }

                lib.tracker.track(prop)
                if (isSetter) {
                    const proxySetMethod = createMethod(
                        'set' + capitalize(prop.name),
                        [createParameter('value', prop.type)],
                        createPrimitiveType('void')
                    )
                    proxySetMethod.parent = decl
                    linkParentBack(proxySetMethod)
                    generatedMethods.push(
                        DD({ modifiers: [Md.setter()] }).func(prop.name, [{ name: 'val', type: GO.typeName(prop.type) }], Ts.prim.void, S.block([
                            S.return(E.call(E.get(Vs.self, proxySetMethod.name), [E.v('val')]))
                        ]))
                    )
                    methodsToGenerate.push(proxySetMethod)
                }
                if (isGetter) {
                    const proxyGetMethod = createMethod('get' + capitalize(prop.name), [], prop.type)
                    proxyGetMethod.parent = decl
                    linkParentBack(proxyGetMethod)
                    generatedMethods.push(
                        DD({ modifiers: [Md.getter()] }).func(prop.name, [], GO.typeName(prop.type), S.block([
                            S.return(E.call(E.get(Vs.self, proxyGetMethod.name), []))
                        ]))
                    )
                    methodsToGenerate.push(proxyGetMethod)
                }
            })
            decl.methods.forEach(method => {
                if (!isWhitelistedMember(getFQName(decl), method, lib)) {
                    return
                }
                if (lib.config.declarations.censor.methods.some(pred => evalBlacklistMethodFilter(pred, lib, method))) {
                    return
                }
                methodsToGenerate.push(method)
            })
            const censoredMethods: IDLMethod[] = []
            methodsToGenerate.forEach(method => {
                if (method.parameters.map(p => p.type).concat(method.returnType).some(t => !selector.isRegistered(t, lib) || lib.isCustom(t))) {
                    generatedMethods.push(generateCustomMethod(method, lib, selector))
                    return
                }
                censoredMethods.push(method)
            })
            censoredMethods.forEach(method => {
                lib.tracker.track(method)
                const result = generateBridgeAndNM(method, lib, selector)
                generatedMethods.push(result[0])
                nativeModuleMethods.push(result[1])
            })

            return {
                continuation: T.c(name),
                declarations: [
                    D.class(name, [], generatedMethods, { kind: 'class', base: T.c(TYPES.finalizable) }),
                    D.class(NATIVE_MODULE_NAME, [], nativeModuleMethods),
                ]
            }
        },
        fromNative(decl, returnParam) {
            return [T.c(TYPES.pointer), [[], []], E.instance2(GO.typeName(createReferenceType(decl)), [returnParam, E.c('true')])]
        },
        toNative(_, param) {
            return [[], E.get(param, 'ptr'), T.c(TYPES.pointer)]
        },
    })

    return selectors.build()
}

///

export interface RollProps {
    library: GeneratorLibrary
    selector: Selector
}

export function roll(query: GeneratorSeed, ctx: ProducerContext<RollProps, undefined>): ProducerResult {
    query.typeToGenerate = ctx.library.library.followTypedefs(query.typeToGenerate)
    return ctx.library.selector.generate(query.typeToGenerate, ctx.library.library)
}