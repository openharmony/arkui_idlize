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

import { E, T } from "./builder"
import { Hint, DecoratorKind, LWType, Modifier } from "./lws"

const knownHints = {
    ptrVal: 'ptrVal',
    asStruct: 'asStruct',
    isType: 'isType',
    named: 'named',
    staticMethod: 'staticMethod',
    stackInstance: 'stackInstance',
    excl: 'excl',
}

const knownModifiers = {
    getter: 'get',
    setter: 'set',
    native: 'native',
    optional: 'optional',
    private: 'private',
    readonly: 'readonly',
    static: 'static',
}

const specialMemberNames = {
    ctor: '@constructor',
    deCtor: '@destructor',
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

    auto: '@LW.AUTO',

    bigint: '@LW.Bigint',
    boolean: '@LW.Boolean',
    buffer: '@LW.Buffer',
    f32: '@LW.Float32',
    f64: '@LW.Float64',
    i8: '@LW.Int8',
    i32: '@LW.Int32',
    i64: '@LW.Int64',
    object: '@LW.Object',
    nativePointer: '@LW.NativePointer',
    number: '@LW.Number',
    returnBuffer: '@LW.ReturnBuffer',
    serializerBuffer: '@LW.SerializerBuffer',
    string: '@LW.String',
    u8: '@LW.U8',
    u32: '@LW.U32',
    u64: '@LW.U64',
    void: '@LW.Void',
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
    excl: (): Hint => ({ kind: DecoratorKind.Hint, name: knownHints.excl }),
}

export const Md = {
    getter: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.getter }),
    setter: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.setter }),
    native: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.native }),
    optional: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.optional }),
    private: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.private }),
    readonly: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.readonly }),
    static: (): Modifier => ({ kind: DecoratorKind.Modifier, name: knownModifiers.static }),
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
}

export const Op = knownOperations

const primitiveTypes = {
    bigint: T.cc(specialTypeNames.bigint),
    boolean: T.cc(specialTypeNames.boolean),
    buffer: T.cc(specialTypeNames.buffer),
    f32: T.cc(specialTypeNames.f32),
    f64: T.cc(specialTypeNames.f64),
    i8: T.cc(specialTypeNames.i8),
    i32: T.cc(specialTypeNames.i32),
    i64: T.cc(specialTypeNames.i64),
    pointer: T.cc(specialTypeNames.nativePointer),
    tag: T.cc(specialTypeNames.tag),
    object: T.cc(specialTypeNames.object),
    number: T.cc(specialTypeNames.number),
    returnBuffer: T.cc(specialTypeNames.returnBuffer),
    serializerBuffer: T.cc(specialTypeNames.serializerBuffer),
    str: T.cc(specialTypeNames.string),
    u8: T.cc(specialTypeNames.u8),
    u32: T.cc(specialTypeNames.u32),
    u64: T.cc(specialTypeNames.u64),
    void: T.cc(specialTypeNames.void),
}

export const Ts = {
    prim: primitiveTypes,

    ref: (type:LWType) => T.c(specialTypeNames.reference, type),
    ptr: (type:LWType) => T.c(specialTypeNames.pointer, type),
    const: (type:LWType) => T.c(specialTypeNames.constant, type),
    struct: (type:LWType) => T.c(specialTypeNames.struct, type),

    union: (types: LWType[]) => T.c(specialTypeNames.union, ...types),
    intersection: (types: LWType[]) => T.c(specialTypeNames.intersection, ...types),
}
