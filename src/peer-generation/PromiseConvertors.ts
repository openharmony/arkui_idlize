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

import * as idl from '@idlize/core/idl'
import { LibraryInterface } from "../LibraryInterface"
import { ArgConvertor, BaseArgConvertor, CallbackConvertor, RuntimeType, ExpressionAssigneer } from "./ArgConvertors"
import { LanguageStatement, LanguageWriter } from "./LanguageWriters"
import { Language } from '@idlize/core'

class PromiseOutArgConvertor extends BaseArgConvertor {
    callbackConvertor: CallbackConvertor
    callback: idl.IDLCallback
    callbackReference: idl.IDLReferenceType
    isOut: true = true
    constructor(
        private readonly library: LibraryInterface,
        param: string,
        readonly promise: idl.IDLContainerType)
    {
        super(promise, [RuntimeType.FUNCTION], false, true, param)

        this.callbackReference = library.createContinuationCallbackReference(promise)
        const callbackEntry = library.resolveTypeReference(this.callbackReference)
        if (!callbackEntry)
            throw new Error("Internal error: no callback for Promise resolved")
        this.callback = callbackEntry as idl.IDLCallback
        this.callbackConvertor = new CallbackConvertor(library, param, this.callback)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return this.callbackConvertor.convertorArg(param, writer)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        if (writer.language == Language.CPP) {
            this.callbackConvertor.convertorSerialize(param, value, writer)
            return
        }

        const serializeCallback = idl.isVoidType(this.promise.elementType[0])
            ? writer.makeMethodCall(`${param}Serializer`, `holdAndWriteCallbackForPromiseVoid`, [])
            : writer.makeMethodCall(`${param}Serializer`, `holdAndWriteCallbackForPromise<${writer.getNodeName(this.promise.elementType[0])}>`, [])
        writer.writeStatement(writer.makeAssign(value, undefined, writer.makeTupleAccess(serializeCallback.asString(), 0), true))
    }

    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return this.callbackConvertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
    }
    nativeType(): idl.IDLType {
        return this.callbackReference
    }
    isPointerType(): boolean {
        return true
    }
}

export function createOutArgConvertor(library: LibraryInterface, type: idl.IDLType|undefined, otherParams: string[]): ArgConvertor | undefined {
    if (type && idl.isContainerType(type) && idl.IDLContainerUtils.isPromise(type)) {
        const param = (entropy: number) => `outputArgumentForReturningPromise${entropy || ''}`
        let paramEntropy = 0
        while (otherParams?.includes(param(paramEntropy)))
            ++paramEntropy;
        return new PromiseOutArgConvertor(library, param(paramEntropy), type)
    }
    return undefined
}