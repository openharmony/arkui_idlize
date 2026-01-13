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
import { lw, LWExpression, LWStatement, LWType } from "@idlizer/libohos"
import { TypeSpecSelector } from "../generator/generator"
import { InputLibrary } from "../library"
import { getFileFor, IDLNode, IDLReferenceType, IDLType, toIDLString } from "@idlizer/core/idl"
import { ConfigBundle } from "../config"

export interface Convertor {

    toBufferTransferable?: {
        /**
         * managed argument -> interop argument
         */
        toInteropBuffer(arg: lw.LWExpression, buffer: lw.LWExpression): LWStatement[]
        /**
         * interop argument -> c-api argument
         */
        fromInteropBuffer(buffer: lw.LWExpression): [LWStatement[], LWExpression]
    }

    fromBufferTransferrable?: {
        /**
         * c-api return type to interop return type
         */
        toReturnBuffer(arg: lw.LWExpression, buffer: lw.LWExpression): LWStatement[]
        /**
         * interop return type to managed return type
         */
        fromReturnBuffer(buffer: lw.LWExpression): [LWStatement[], LWExpression]
    }

    toInteropTransferable?: {
        /**
         * managed argument -> interop argument
         */
        toInteropArgument(param: lw.LWExpression): [LWExpression, LWType]
        /**
         * interop argument -> c-api argument
         */
        fromInteropArgument(param: lw.LWExpression): LWExpression
    }

    fromInteropTransferable?: {
        /**
         * c-api return type to interop return type
         */
        toInteropReturn(param: lw.LWExpression): [LWExpression, LWType]
        /**
         * interop return type to managed return type
         */
        fromInteropReturn(param: lw.LWExpression): LWExpression
    }
}

export interface GenerationLibrary {
    original: InputLibrary
    stage: 'peer' | 'bridge' | 'api' | 'managed' | 'native'
    flavours: string[],
    target: ConfigBundle['target']
    targetName: string,
    selector: TypeSpecSelector
}

export function showErrorForIDLNode(node: IDLNode): string {
    return `"${toIDLString(node, {})}" ${showErrorFile(node)}`
}

export function showErrorFile(node: IDLNode): string {
    let position = ''
    const startPoint = node.nameLocation?.range?.start
    if (startPoint) {
        position = `:${startPoint.line}:${startPoint.character}`
    }
    return `[${getFileFor(node)?.fileName ?? '<unknown file>'}${position}]`
}

export class DeclarationNotFoundError extends Error {
    constructor(
        public reference: IDLReferenceType
    ) { super(`Declaration was not found for reference "${reference.name}" ` + showErrorFile(reference)) }
}

export function throwDeclarationWasNotFound(reference: IDLReferenceType): never {
    throw new DeclarationNotFoundError(reference)
}

export class NotTransferrableType extends Error {
    constructor(
        public type: IDLType,
        public direction: 'fromManagedToNative' | 'fromNativeToManaged'
    ) { super("NOT TRANSFERRABLE TYPE") }
}

