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

import { ArgConvertor } from "./peer-generation/ArgConvertors"
import { TypeNodeConvertor } from "./peer-generation/TypeNodeConvertor"
import { Language } from "./util"

export interface DeclarationProcessor<T1, T2> {
    language: Language
    readonly typeMap: Map<T1, [T2, string[], boolean]>
    orderedDependencies: T2[]
    typeConvertor(paramName: string, 
        type: T1, 
        isOptional?: boolean, 
        maybeCallback?: boolean,
        nodeConv?: TypeNodeConvertor<string>
    ): ArgConvertor
    declarationConvertor(paramName: string, 
        type: T1, 
        declaration?: T2,
        maybeCallback?: boolean,
        nodeConv?: TypeNodeConvertor<string>
    ): ArgConvertor
    getTypeName(type: T1, optional?: boolean): string
    toDeclaration(node: T1): T2 // or toTarget(node: T1): T2
    computeTargetName(target: T2, optional: boolean): string
    requestType(type: T1, useToGenerate: boolean, name: string): void


    // typeChecker: ts.TypeChecker | undefined
    // computeTypeName(suggestedName: string | undefined, type: ts.TypeNode, optional?: boolean, prefix?: string): string
    // serializerName(name: string): string
    // deserializerName(name: string): string
    // targetStruct(target: DeclarationTarget): StructDescriptor
}