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

import { AggregateConvertor, ArrayConvertor, CallbackConvertor, CustomTypeConvertor, ImportTypeConvertor, MapConvertor,
    Method, MethodModifier, OptionConvertor, PeerLibrary, PeerMethod, PeerMethodSignature, TupleConvertor, TypeAliasConvertor,
    UnionConvertor } from '@idlizer/core'
import * as idl from '@idlizer/core/idl'
import { peerGeneratorConfiguration } from '../../DefaultConfiguration.js'

function isDirectConvertedType(originalType: idl.IDLType|undefined, library: PeerLibrary): boolean {
    const debug = false
    if (originalType == undefined) return true // TODO: is it correct?
    if (debug) console.log(`IDL type ${idl.DebugUtils.debugPrintType(originalType)}`)
    if (idl.isPrimitiveType(originalType, 'InteropReturnBuffer')) return false
    if (idl.isPrimitiveType(originalType, 'this')) return true /* Because this type for native is pointer, right? */
    if (idl.isPrimitiveType(originalType, 'SerializerBuffer')) return true
    let convertor = library.typeConvertor("x", originalType, false)
    // Resolve aliases.
    while (convertor instanceof TypeAliasConvertor) {
        convertor = convertor.convertor
    }
    if (convertor instanceof ArrayConvertor ||
        convertor instanceof CustomTypeConvertor ||
        convertor instanceof UnionConvertor ||
        convertor instanceof CallbackConvertor ||
        convertor instanceof MapConvertor ||
        convertor instanceof TupleConvertor ||
        convertor instanceof AggregateConvertor ||
        convertor instanceof OptionConvertor ||
        convertor instanceof ImportTypeConvertor) {
        // try { console.log(`convertor is ${convertor.constructor.name} for ${JSON.stringify(originalType)}`) } catch (e) {}
        return false
    }
    let type = convertor.interopType()
    if (debug) console.log(`converted type ${idl.DebugUtils.debugPrintType(originalType)}`)
    let result = idl.isPrimitiveType(type, 'i8') || idl.isPrimitiveType(type, 'u8')
            || idl.isPrimitiveType(type, 'i16') || idl.isPrimitiveType(type, 'u16')
            || idl.isPrimitiveType(type, 'i32') || idl.isPrimitiveType(type, 'u32')
            || idl.isPrimitiveType(type, 'i64') || idl.isPrimitiveType(type, 'u64')
            || idl.isPrimitiveType(type, 'f32') || idl.isPrimitiveType(type, 'f64')
            || idl.isPrimitiveType(type, 'pointer')
            || idl.isPrimitiveType(type, 'boolean')
            || idl.isPrimitiveType(type, 'void')
            || idl.isPrimitiveType(type, 'undefined')
            || idl.isPrimitiveType(type, 'SerializerBuffer')
            || idl.isPrimitiveType(type, 'number')
    if (!result && debug) console.log(`type ${idl.DebugUtils.debugPrintType(type)} is not direct`)
    return result
}

export function isVMContextMethod(method: Method | PeerMethodSignature): boolean {
    const isPromise = !!idl.asPromise(method instanceof PeerMethodSignature ? method.returnType : method.signature.returnType)
    return isPromise ||
        !!method.modifiers?.includes(MethodModifier.FORCE_CONTEXT)
}

export function isDirectMethod(method: Method, library: PeerLibrary): boolean {
    if (isVMContextMethod(method)) {
        return false
    }
    let result = isDirectConvertedType(method.signature.returnType, library) &&
            method.signature.args.every((arg) => isDirectConvertedType(arg, library))
    // if (!result) console.log(`method ${method.name} is not direct`)
    return result
}
