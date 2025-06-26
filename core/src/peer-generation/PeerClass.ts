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

import { getFQName, IDLFile, IDLI32Type, IDLPointerType, IDLProperty } from "../idl"
import { NumericConvertor, PointerConvertor } from "../LanguageWriters/ArgConvertors"
import { PeerMethod, PeerMethodArg, PeerMethodSignature } from "./PeerMethod"
import { Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters/LanguageWriter"

export interface PeerClassBase {
    generatedName(isCallSignature: boolean): string
}

export class PeerClass implements PeerClassBase {
    constructor(
        public readonly file: IDLFile,
        public readonly componentName: string,
        public readonly originalFilename: string,
    ) { }

    generatedName(isCallSignature: boolean): string{
        return isCallSignature ? this.originalInterfaceName! : this.originalClassName!
    }

    methods: PeerMethod[] = []

    originalClassName: string | undefined = undefined
    originalInterfaceName: string | undefined = undefined
    originalParentName: string | undefined = undefined
    originalParentFilename: string | undefined = undefined
    parentComponentName: string | undefined = undefined
    attributesFields: IDLProperty[] = []
    hasGenericType: boolean = false
}

export function createConstructPeerMethod(clazz: PeerClass): PeerMethod {
    // TODO here is class FQName needed, but can not calculate if from current PeerClass data
    const classFQN = [clazz.componentName]
    return new PeerMethod(
        new PeerMethodSignature(
            PeerMethodSignature.CTOR,
            classFQN.concat(PeerMethodSignature.CTOR).join('_'),
            [new PeerMethodArg('id', IDLI32Type), new PeerMethodArg('flags', IDLI32Type)],
            IDLPointerType,
        ),
        clazz.componentName,
        IDLPointerType,
        false,
        new Method(
            'construct',
            new NamedMethodSignature(IDLPointerType, [IDLI32Type, IDLI32Type], ['id', 'flags']),
            [MethodModifier.STATIC]
        )
    )
}
