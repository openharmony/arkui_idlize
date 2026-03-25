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

import { E, T } from "./builders/original.js"
import { Hint, DecoratorKind, LWType, Modifier } from "./lws.js"

const knownHints = {
    ptrVal: 'ptrVal',
    asStruct: 'asStruct',
    isType: 'isType',
    named: 'named',
    staticMethod: 'staticMethod',
    stackInstance: 'stackInstance',
    arrayInstance: 'arrayInstance',
    promise: 'promise',
    excl: 'excl',
    macroCall: 'macroCall',
    questionMark: 'questionMark',
}

const knownModifiers = {
    getter: 'get',
    setter: 'set',
    native: 'native',
    optional: 'optional',
    private: 'private',
    readonly: 'readonly',
    static: 'static',
    declare: 'declare',
    externC: 'externC',
}

const specialMemberNames = {
    ctor: '@constructor',
    deCtor: '@destructor',
    staticCtor: '@static_ctor'
}
const specialVariables = {
    self: '@self',
    base: '@base',
    null: '@null',
    undef: '@undefined',
    print: '@print'
}
const specialTypeNames = {
    constant: '@CONST',
    reference: '@REF',
    pointer: '@PTR',
    tag: '@TAG',
    struct: '@STRUCT',

    hole: '@UNDEFINED',

    union: '@UNION',
    intersection: '@INTERSECTION',
    array: '@ARRAY',
    vector: '@VECTOR',
    map: '@MAP',
    promise: '@PROMISE',
    optional: '@OPTIONAL',

    auto: '@LW.AUTO',

    bigint: '@LW.Bigint',
    boolean: '@LW.Boolean',
    buffer: '@LW.Buffer',
    f32: '@LW.Float32',
    f64: '@LW.Float64',
    i8: '@LW.Int8',
    i32: '@LW.Int32',
    i64: '@LW.Int64',
    i16: '@LW.I16',
    u16: '@LW.U16',
    object: '@LW.Object',
    nativePointer: '@LW.NativePointer',
    number: '@LW.Number',
    serializerBuffer: '@LW.SerializerBuffer',
    string: '@LW.String',
    u8: '@LW.U8',
    u32: '@LW.U32',
    u64: '@LW.U64',
    undefined: '@LW.Undefined',
    void: '@LW.Void',

    self: '@LW.Self',

    interopNumber: '@LW.InteropNumber',
    interopString: '@LW.InteropString',
    interopReturnBuffer: '@LW.InteropReturnBuffer',
}

export const std = {
    names: {
        members: specialMemberNames,
        vars: specialVariables,
        types: specialTypeNames,
        hints: knownHints,
        modifiers: knownModifiers,
    }
}

export const Hs = {
    ptrVal: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.ptrVal }),
    asStruct: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.asStruct }),
    isType: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.isType }),
    named: (name:string): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.named, value: name }),
    staticMethod: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.staticMethod }),
    stackInstance: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.stackInstance }),
    arrayInstance: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.arrayInstance }),
    promise: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.promise }),
    excl: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.excl }),
    macroCall: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.macroCall }),
    questionMark: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.questionMark })
}

export const Md = {
    getter: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.getter }),
    setter: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.setter }),
    native: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.native }),
    optional: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.optional }),
    private: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.private }),
    readonly: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.readonly }),
    static: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.static }),
    declare: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.declare }),
    externC: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.externC }),
    custom: (name:string): Modifier => ({ kind: DecoratorKind.Modifier, name })
}

export const Vs = {
    self: E.v(specialVariables.self, [{ kind: DecoratorKind.Hint, name: knownHints.ptrVal }]),
    base: E.v(specialVariables.base),
    null: E.v(specialVariables.null),
    undef: E.v(specialVariables.undef),
    print: E.v(specialVariables.print),
}

const knownOperations = {
    // binary
    add: '+',
    sub: '-',
    mul: '*',
    div: '/',
    mod: '%',
    or: '||',
    and: '&&',
    le: '<=',
    lt: '<',
    eq: '==',
    gt: '>',
    ge: '>=',
    ne: '!=',

    // unary
    neg: '-',
    not: '!',
    ref: 'ref',
    deref: 'deref',
    inc: '++',
    dec: '--',
    postinc: '_++',
    postdec: '_--',
    assert: '_!',
}

export const Op = knownOperations

const primitiveTypes = {
    bigint: T.c(specialTypeNames.bigint),
    boolean: T.c(specialTypeNames.boolean),
    buffer: T.c(specialTypeNames.buffer),
    f32: T.c(specialTypeNames.f32),
    f64: T.c(specialTypeNames.f64),
    i8: T.c(specialTypeNames.i8),
    i32: T.c(specialTypeNames.i32),
    i64: T.c(specialTypeNames.i64),
    pointer: T.c(specialTypeNames.nativePointer),
    tag: T.c(specialTypeNames.tag),
    object: T.c(specialTypeNames.object),
    number: T.c(specialTypeNames.number),
    serializerBuffer: T.c(specialTypeNames.serializerBuffer),
    str: T.c(specialTypeNames.string),
    u8: T.c(specialTypeNames.u8),
    u32: T.c(specialTypeNames.u32),
    u64: T.c(specialTypeNames.u64),
    undefined: T.c(specialTypeNames.undefined),
    void: T.c(specialTypeNames.void),
    self: T.c(specialTypeNames.self),

    interopNumber: T.c(specialTypeNames.interopNumber),
    interopString: T.c(specialTypeNames.interopString),
    interopReturnBuffer: T.c(specialTypeNames.interopReturnBuffer),
}

export const Ts = {
    prim: primitiveTypes,

    ref: (type:LWType) => T.c(specialTypeNames.reference, type),
    ptr: (type:LWType) => T.c(specialTypeNames.pointer, type),
    const: (type:LWType) => T.c(specialTypeNames.constant, type),
    struct: (type:LWType) => T.c(specialTypeNames.struct, type),

    union: (types: LWType[]) => T.c(specialTypeNames.union, ...types),
    intersection: (types: LWType[]) => T.c(specialTypeNames.intersection, ...types),
    optional: (type: LWType) => T.c(specialTypeNames.optional, type),
    array: (elemType: LWType) => T.c(specialTypeNames.array, elemType),
    vector: (elemType: LWType) => T.c(specialTypeNames.vector, elemType),
    map: (keyType: LWType, valueType: LWType) => T.c(specialTypeNames.map, keyType, valueType),
    promise: (resultType: LWType) => T.c(specialTypeNames.promise, resultType),
}
