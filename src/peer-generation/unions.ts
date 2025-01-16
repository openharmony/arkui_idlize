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

import { convertType, TypeConvertor } from "@idlize/core";
import { IDLContainerType, IDLCustomObjectType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType, IDLType, IDLTypeParameterType, IDLUndefinedType, IDLUnionType, isType, isUnionType } from '@idlize/core/idl'
import { typeOrUnion } from "@idlize/core"
import { ReferenceResolver } from "./ReferenceResolver";
import { ArgConvertor, RuntimeType } from "./ArgConvertors";
import { LanguageExpression, LanguageWriter } from "./LanguageWriters";
import { LibraryInterface } from "../LibraryInterface";

export class UnionFlattener implements TypeConvertor<IDLType[]> {
    constructor(private resolver: ReferenceResolver) {}

    convertUnion(type: IDLUnionType): IDLType[] {
        return type.types.flatMap(it => convertType(this, it))
    }
    convertTypeReference(type: IDLReferenceType): IDLType[] {
        const decl = this.resolver.toDeclaration(type)
        return isType(decl) && decl !== IDLCustomObjectType ? convertType(this, decl) : [type]
    }
    convertOptional(type: IDLOptionalType): IDLType[] {
        return [type.type, IDLUndefinedType]
    }
    convertContainer(type: IDLContainerType): IDLType[] {
        return [type]
    }
    convertImport(type: IDLReferenceType, importClause: string): IDLType[] {
        return [type]
    }
    convertPrimitiveType(type: IDLPrimitiveType): IDLType[] {
        return [type]
    }
    convertTypeParameter(type: IDLTypeParameterType): IDLType[] {
        return [type]
    }
}

export class UnionRuntimeTypeChecker {
    private conflictingConvertors: Set<ArgConvertor> = new Set()
    private duplicateMembers: Set<string> = new Set()
    private discriminators: [LanguageExpression | undefined, ArgConvertor, number][] = []

    constructor(private convertors: ArgConvertor[]) {
        this.checkConflicts()
    }
    private checkConflicts() {
        const runtimeTypeConflicts: Map<RuntimeType, ArgConvertor[]> = new Map()
        this.convertors.forEach(conv => {
            conv.runtimeTypes.forEach(rtType => {
                const convertors = runtimeTypeConflicts.get(rtType)
                if (convertors) convertors.push(conv)
                else runtimeTypeConflicts.set(rtType, [conv])
            })
        })
        runtimeTypeConflicts.forEach((convertors, rtType) => {
            if (convertors.length > 1) {
                const allMembers: Set<string> = new Set()
                if (rtType === RuntimeType.OBJECT) {
                    convertors.forEach(convertor => {
                        convertor.getMembers().forEach(member => {
                            if (allMembers.has(member)) this.duplicateMembers.add(member)
                            allMembers.add(member)
                        })
                    })
                }
                convertors.forEach(convertor => {
                    this.conflictingConvertors.add(convertor)
                })
            }
        })
    }
    makeDiscriminator(value: string, convertorIndex: number, writer: LanguageWriter): LanguageExpression {
        const convertor = this.convertors[convertorIndex]
        if (this.conflictingConvertors.has(convertor) && writer.language.needsUnionDiscrimination) {
            const discriminator = convertor.unionDiscriminator(value, convertorIndex, writer, this.duplicateMembers)
            this.discriminators.push([discriminator, convertor, convertorIndex])
            if (discriminator) return discriminator
        }
        return writer.makeNaryOp("||", convertor.runtimeTypes.map((it, runtimeTypeIndex) =>
            writer.makeNaryOp("==", [
                writer.makeUnionVariantCondition(
                    convertor,
                    value,
                    `${value}_type`,
                    RuntimeType[it],
                    convertorIndex,
                    runtimeTypeIndex)])))
    }
    reportConflicts(context: string | undefined) {
        if (this.discriminators.filter(([discriminator, _, __]) => discriminator === undefined).length > 1) {
            this.discriminators.forEach(([discr, conv, n]) =>
                console.log(`   ${n} : ${conv.constructor.name} : ${discr ? discr.asString() : "<undefined>"}`))
            throw new Error(`runtime type conflict in \`${context}\``)
        }
    }
}

export function flattenUnionType(library: LibraryInterface, type: IDLType): IDLType {
    const unionFlattener = new UnionFlattener(library)
    if (isUnionType(type)) {
        const allTypes = type.types.flatMap(it => convertType(unionFlattener, it))
        const uniqueTypes = new Set(allTypes)
        return uniqueTypes.size === allTypes.length ? type : typeOrUnion(Array.from(uniqueTypes))
    }
    return type
}