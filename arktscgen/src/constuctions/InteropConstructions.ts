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

import { capitalize, createPrimitiveType, createReferenceType, IDLPrimitiveType } from "@idlizer/core"
import { isCreateOrUpdate, splitCreateOrUpdate } from "../general/common.js"

export class InteropConstructions {
    static get receiver(): string {
        return `receiver`
    }

    static context = {
        type: createReferenceType(`Context`),
        name: `context`
    }

    static get sequencePointerType(): IDLPrimitiveType {
        return createPrimitiveType('pointer')
    }

    static get sequenceLengthType(): IDLPrimitiveType {
        return createPrimitiveType('u32')
    }

    static sequenceParameterPointer(parameter: string): string {
        return `${parameter}SequencePointer`
    }

    static sequenceParameterLength(parameter: string): string {
        return `${parameter}SequenceLength`
    }

    static method(interfaceName: string, methodName: string, namespaceName: string = ""): string {
        if (isCreateOrUpdate(methodName)) {
            const { createOrUpdate, rest } = splitCreateOrUpdate(methodName)
            return `${createOrUpdate}${interfaceName}${rest}`
        }
        return `${interfaceName}${methodName}`
    }

    static get keywords(): string[] {
        return [
            `extends`,
            `var`,
            `function`,
            `super`,
            `arguments`,
            `implements`,
            `interface`,
            `global`
        ]
    }
}