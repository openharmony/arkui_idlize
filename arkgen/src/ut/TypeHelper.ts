/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import {
    Language,
    PeerLibrary,
    PeerMethod,
    camelCaseToUpperSnakeCase,
    flattenUnionType,
    isMaterialized,
} from '@idlizer/core'
import { AceTypes } from './AceTypes.js'
import { E } from '@idlizer/libohos'

const NON_JSON_TYPES = ['Ark_CustomObject', 'Ark_Object', 'Ark_ContentModifier']

export class TypeHelper {
    private library: PeerLibrary
    private aceTypes: AceTypes
    private typeName: string
    private baseTypeName?: string
    private type: idl.IDLType
    private decl: idl.IDLNode
    private optional: boolean = false

    private constructor(library: PeerLibrary, aceTypes: AceTypes, type: idl.IDLNode, optional: boolean) {
        this.library = library
        this.aceTypes = aceTypes
        this.optional = optional

        const nameConverter = library.createTypeNameConvertor(Language.CPP)

        if (!idl.isType(type)) throw `Unexpected non-type node in TypeHelper`
        this.type = type
        if (idl.isOptionalType(type)) {
            this.optional = true
            this.type = type.type
        }
        let nonOptName = nameConverter.convert(this.type)
        if (nonOptName.startsWith('Ark_Union')) {
            this.type = flattenUnionType(library, this.type)
            nonOptName = nameConverter.convert(this.type)
        }
        if (this.optional) {
            this.typeName = nameConverter.convert(idl.createOptionalType(this.type))
            this.baseTypeName = nonOptName
        } else {
            this.typeName = nonOptName
        }
        this.decl = library.toDeclaration(this.type)
    }

    static fromMethodArg(library: PeerLibrary, aceTypes: AceTypes, method: PeerMethod, index: number): TypeHelper {
        let decl = method.sig.args[index].type
        //let name = library.computeTargetName(decl, method.argConvertors(library)[index] instanceof OptionConvertor)
        //console.log(`// method: ${method.sig.name}, arg: ${index}, type: ${name}, kind: ${decl.kind}`)
        return new TypeHelper(library, aceTypes, decl, false)
    }

    static dummyType(library: PeerLibrary, aceTypes: AceTypes): TypeHelper {
        return new TypeHelper(library, aceTypes, idl.createPrimitiveType('void'), false)
    }

    getIdlDecl() {
        return this.decl
    }
    getTypeName() {
        return this.typeName
    }
    getBaseTypeName() {
        return this.baseTypeName ?? this.typeName
    }
    isOptional(): boolean {
        return this.optional
    }
    isUnion(): boolean {
        return idl.isUnionType(this.decl)
    }
    isEnum(): boolean {
        return idl.isEnum(this.decl)
    }
    isAggregate(): boolean {
        if (this.aceTypes.getSimpleTypes().includes(this.getBaseTypeName())) return false
        if (this.isNonJsonType()) return false
        return idl.isInterface(this.decl) && this.decl.properties.filter(it => !it.isStatic).length > 0
    }
    getUnionMembers(): TypeHelper[] {
        //console.log(`// getUnionMembers()`)
        if (!idl.isUnionType(this.decl)) throw `getUnionMembers() called on non-union type!`
        return this.decl.types.map(type => new TypeHelper(this.library, this.aceTypes, type, false))
    }
    getEnumValues(): { names: string[], values: string[], isString?: boolean } {
        const info: { names: string[], values: string[], isString?: boolean } = { names: [], values: [] }
        if (idl.isEnum(this.decl)) {
            for (const it of this.decl.elements) {
                info.names.push(it.name)
                info.values.push(idl.getExtAttribute(it, idl.IDLExtendedAttributes.OriginalEnumMemberName) ?? it.name)
            }
            info.isString = idl.isStringEnum(this.decl)
        }
        return info
    }
    getAggregateMembers(): [string, TypeHelper][] {
        //console.log(`// getAggregateMembers(): ${this.typeName}`)
        if (idl.isInterface(this.decl)) {
            return this.decl.properties
                .filter(it => !it.isStatic)
                .map(it => [it.name, new TypeHelper(this.library, this.aceTypes, it.type, it.isOptional)])
        }
        throw `getAggregateMembers() called on non-aggregate type!`
    }
    isComplex(): boolean {
        if (this.isNonJsonType()) return false
        if (this.isAggregate()) return true
        if (this.isUnion()) {
            for (let member of this.getUnionMembers()) {
                if (member.isComplex()) return true
            }
        }
        return false
    }
    tsName(): string {
        const tsName = this.typeName.substring(4)
        if (tsName.startsWith("arkui_component_enums_")) {
            return tsName.substring(22)
        } else if (tsName.startsWith("arkui_component_units_")) {
            return tsName.substring(22)
        } else {
            return tsName
        }
    }
    getNonOptType(library: PeerLibrary): TypeHelper {
        //console.log(`// getNonOptType()`)
        return new TypeHelper(library, this.aceTypes, this.type, false)
    }
    isNonJsonType() {
        if (this.aceTypes.getSimpleTypes().includes(this.getBaseTypeName())) return false
        if (NON_JSON_TYPES.includes(this.getBaseTypeName())) return true
        if (idl.isCallback(this.decl)) return true
        if (idl.getExtAttribute(this.decl, idl.IDLExtendedAttributes.Component)) return true
        if (idl.isInterface(this.decl)) {
            if (this.decl.properties.length == 0) return true
            if (isMaterialized(this.decl, this.library)) return true
            if (this.decl.properties.length == 1) {
                let name = this.decl.properties[0].name
                if (name == '_stub') return true
                if (name.startsWith('_') && name.endsWith('Stub')) {
                    return true
                }
            }
            let members = this.getAggregateMembers()
            for (let mem of members) {
                if (mem[1].isOptional()) continue
                if (mem[1].isNonJsonType()) return true
            }
        }
        return false
    }
}
