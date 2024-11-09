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

import * as idl from '../../../idl'
import { capitalize } from '../../../util'
import { PrimitiveType } from '../../ArkPrimitiveType'
import { PeerGeneratorConfig } from '../../PeerGeneratorConfig'
import { ReferenceResolver } from '../../ReferenceResolver'
import { IdlNameConvertor, IdlNameConvertorBase, TypeConvertor } from '../nameConvertor'

export interface ConvertResult {
    text: string,
    noPrefix: boolean
}

export class InteropConverter implements TypeConvertor<ConvertResult> {

    private make(text: string, noPrefix = false): ConvertResult {
        return { text, noPrefix }
    }

    constructor(
        protected resolver: ReferenceResolver
    ) {}

    convertType(type: idl.IDLType): ConvertResult {
        if (idl.isType(type) && idl.isOptionalType(type)) {
            return this.convertOptional(type)
        }
        if (idl.isPrimitiveType(type)) {
            return this.convertPrimitiveType(type)
        }
        if (idl.isContainerType(type)) {
            return this.convertContainer(type)
        }
        if (idl.isUnionType(type)) {
            return this.convertUnion(type)
        }
        if (idl.isReferenceType(type)) {
            return this.convertTypeReference(type)
        }
        if (idl.isTypeParameterType(type)) {
            return this.make('CustomObject')
        }
        throw new Error(`Unmapped type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    convertEntry(target: idl.IDLEntry): ConvertResult {
        if (idl.isType(target)) {
            throw new Error('use convertType instead!')
        }
        if (idl.isAnonymousInterface(target)) {
            return target.name
                ? this.make(target.name)
                : this.make(this.computeTargetTypeLiteralName(target), true)
        }
        if (idl.isEnum(target)) {
            return this.make(this.enumName(target))
        }
        if (idl.isInterface(target) || idl.isClass(target)) {
            if (target.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.Namespace && it.value === 'predefined')) {
                return this.make(target.name, true)
            }
            return this.make(target.name)
        }
        if (idl.isCallback(target)) {
            return this.make(PrimitiveType.LibraryPrefix + target.name, true)
        }
        if (idl.isTupleInterface(target)) {
            return target.name
                ? this.make(target.name)
                : this.make(`Tuple_${target.properties.map(it => this.convertType(idl.maybeOptional(it.type, it.isOptional)).text).join("_")}`, true)
        }
        if (idl.isImport(target))
            return this.make(this.mapImportTypeName(target), true)
        if (idl.isEnumMember(target))
            return this.convertEntry(target.parent)
        if (idl.isTypedef(target))
            return this.make(target.name)
        throw new Error(`Cannot compute target name: ${idl.IDLKind[target.kind!]} ${target.name}`)
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    convertOptional(type: idl.IDLOptionalType): ConvertResult {
        return this.convertType(type.type)
    }
    convertUnion(type: idl.IDLUnionType): ConvertResult {
        return this.make(type.name, false)
    }
    convertContainer(type: idl.IDLContainerType): ConvertResult {
        if (idl.IDLContainerUtils.isPromise(type)) {
            return this.make(`Promise_${this.convertType(type.elementType[0]).text}`)
        }
        if (idl.IDLContainerUtils.isSequence(type)) {
            if (type.elementType[0] === idl.IDLU8Type) {
                return this.make(`uint8_t*`, true)
            }
            return this.make(`Array_${this.convertType(type.elementType[0]).text}`, true)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return this.make(`Map_${this.convertType(type.elementType[0]).text}_${this.convertType(type.elementType[1]).text}`, true)
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(_type: idl.IDLReferenceType, _: string): ConvertResult {
        throw new Error("Method not implemented.")
    }
    convertTypeReference(type: idl.IDLReferenceType): ConvertResult {
        const refName = type.name
        switch (refName) {
            case "object":
            case "Object":
                return this.make('CustomObject')
        }
        if (PeerGeneratorConfig.isKnownParametrized(refName)) {
            return this.make('CustomObject')
        }
        const decl = this.resolver.toDeclaration(type)
        if (idl.isType(decl)) {
            if (idl.isReferenceType(decl)) {
                return this.make(`${capitalize(decl.name)}`)
            }
            return this.convertType(decl)
        }
        let res = this.convertEntry(decl as idl.IDLEntry)
        if (type.name === "Optional")
            res = this.make("Opt_" + res.text, true)
        return res
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ConvertResult {
        throw new Error("Method not implemented.")
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ConvertResult {
        switch (type) {
            case idl.IDLVoidType: return this.make('void', true)
            case idl.IDLI8Type: return this.make(`Int8`)
            case idl.IDLU8Type: return this.make(`UInt8`)
            case idl.IDLI16Type: return this.make(`Int16`)
            case idl.IDLU16Type: return this.make(`UInt16`)
            case idl.IDLI32Type: return this.make(`Int32`)
            case idl.IDLU32Type: return this.make(`UInt32`)
            case idl.IDLI64Type: return this.make(`Int64`)
            case idl.IDLU64Type: return this.make(`UInt64`)
            case idl.IDLNumberType: return this.make(`Number`)
            case idl.IDLStringType: return this.make(`String`)
            case idl.IDLBooleanType: return this.make(`Boolean`)
            case idl.IDLPointerType: return this.make('void*', true)
            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType:
            case idl.IDLAnyType: return this.make(`CustomObject`)
            case idl.IDLUndefinedType: return this.make(`Undefined`)
            case idl.IDLLengthType: return this.make(`Length`)
            case idl.IDLFunctionType: return this.make(`Function`)
            case idl.IDLDate: return this.make(`Date`)
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    private mapImportTypeName(type: idl.IDLEntry): string {
        console.log(`Import type: ${type.name}`)
        switch (type.name) {
            // maybe we should remove them
            case "Resource": return "Resource"
            case "Callback": return PrimitiveType.Function.getText()
            default: return PrimitiveType.CustomObject.getText()
        }
    }

    private enumName(target: idl.IDLEnum): string {
        const namespace = idl.getExtAttribute(target, idl.IDLExtendedAttributes.Namespace)
        return `${namespace ? namespace + "_" : ""}${target.name}`
    }

    private computeTargetTypeLiteralName(decl: idl.IDLInterface): string {
        const map = new Map<string, string[]>()
        for (const prop of decl.properties) {
            const type = this.convertType(prop.type)
            const values = map.has(type.text) ? map.get(type.text)! : []
            values.push(prop.name)
            map.set(type.text, values)
        }
        const names = Array.from(map.keys()).map(key => `${key}_${map.get(key)!.join('_')}`)
        return `Literal_${names.join('_')}`
    }
}

export class IDLNodeToStringConvertor extends IdlNameConvertorBase {

    private readonly interopConverter: InteropConverter
    constructor(
        protected resolver: ReferenceResolver
    ) {
        super()
        this.interopConverter = new InteropConverter(resolver)
    }

    convertType(type: idl.IDLType): string {
        return this.interopConverter.convertType(type).text
    }

    convertEntry(type: idl.IDLEntry): string {
        return this.interopConverter.convertEntry(type).text
    }
}
