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
import { LibraryInterface, LanguageStatement, LanguageWriter, Language,
    ArgConvertor, BaseArgConvertor, CallbackConvertor, RuntimeType, ExpressionAssigner
} from "@idlizer/core"
import { NativeModule } from './NativeModule'

class PromiseOutArgConvertor extends BaseArgConvertor {
    callbackConvertor: CallbackConvertor
    callback: idl.IDLCallback
    isOut: true = true
    constructor(
        private readonly library: LibraryInterface,
        param: string,
        readonly promise: idl.IDLContainerType)
    {
        super(library.createContinuationCallbackReference(promise), [RuntimeType.FUNCTION], false, true, param)
        const type = this.idlType as idl.IDLReferenceType
        const callbackEntry = library.resolveTypeReference(type)
        if (!callbackEntry)
            throw new Error(`Internal error: no callback for ${type.name} resolved`)
        this.callback = callbackEntry as idl.IDLCallback
        this.callbackConvertor = new CallbackConvertor(library, param, this.callback, NativeModule.Interop)
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
        writer.writeStatement(writer.makeAssign(value, undefined, writer.language == Language.CJ ? writer.makeString(serializeCallback.asString().concat('.promise')) : writer.makeTupleAccess(serializeCallback.asString(), 0), true))
    }

    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return this.callbackConvertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
    }
    nativeType(): idl.IDLType {
        return this.idlType
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