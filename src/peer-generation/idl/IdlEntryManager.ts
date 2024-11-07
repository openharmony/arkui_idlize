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

import * as idl from "../../idl";
import { generateSyntheticFunctionName } from "../../IDLVisitor";

export class IdlEntryManager {

    private entries = new Map<string, idl.IDLEntry>()

    generateCallback(mapper:(type:idl.IDLType) => string, parameters:idl.IDLParameter[], returnType:idl.IDLType): [idl.IDLReferenceType, idl.IDLCallback] {
        const name = generateSyntheticFunctionName(
            mapper,
            parameters,
            returnType
        )
        const callback = idl.createCallback(
            name, 
            parameters, 
            returnType,
            { 
                extendedAttributes : [{
                    name: idl.IDLExtendedAttributes.Synthetic
                }]
            }
        )
        this.entries.set(name, callback)
        const ref = idl.createReferenceType(name)
        return [ref, callback]
    }

    registerInterface(entry:idl.IDLInterface): [idl.IDLReferenceType, idl.IDLInterface] {
        const mangledName = `Generated_synthetic_${entry.name}`
        this.entries.set(mangledName, entry)
        const ref = idl.createReferenceType(mangledName)
        return [ref, entry]
    }

    resolveTypeReference(type: idl.IDLReferenceType): idl.IDLEntry | undefined {
        return this.entries.get(type.name)
    }
}
