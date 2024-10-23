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

import * as idl from '../../idl'
import { throwException } from '../../util'
import { IdlPeerLibrary } from './IdlPeerLibrary'
import { DeclarationConvertor, TypeConvertor, convertType } from './IdlTypeConvertor'
import { Type } from '../LanguageWriters'
import { ARK_CUSTOM_OBJECT, convertJavaOptional, javaCustomTypeMapping } from '../printers/lang/Java'
import { IDLInterface, IDLPrimitiveType, IDLProperty, isAnonymousInterface } from "../../idl";
import { cjCustomTypeMapping } from '../printers/lang/Cangjie'

export interface IdlTypeNameConvertor {
    convert(type: idl.IDLType): string
}

export class TSTypeNameConvertor implements IdlTypeNameConvertor, TypeConvertor<string> {
    constructor(protected library: IdlPeerLibrary) {}
    convertUnion(type: idl.IDLUnionType): string {
        return type.types.map(it => this.convert(it)).join(" | ")
    }
    convertContainer(type: idl.IDLContainerType): string {
        const containerName =
            type.name === "sequence" ? "Array"
            : type.name === "record" ? "Map"
            : type.name === "Promise" ? "Promise"
            : throwException(`Unmapped container type: ${type.name}`)
        return `${containerName}<${type.elementType.map(it => this.convert(it)).join(",")}>`
    }
    convertEnum(type: idl.IDLEnumType): string {
        return type.name
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        ///feed importClause into TS parser?
        if (importClause.includes("want?: import('../api/@ohos.app.ability.Want').default;"))
            return "IMPORT_Callback_code_number_want_IMPORT_default_FROM_api_ohos_app_ability_Want_FROM_api_ohos_base"
        const match = importClause.match(/import *\((['"`])(.+)\1\)\.(.+)/)
        if (!match)
            throw new Error(`Cannot parse import clause ${importClause}`)
        const [where, what] = match.slice(2)
        return `IMPORT_${what}_FROM_${where}`
            .match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        // resolve synthetic types
        const decl = this.library.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)

            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }

        if (decl && idl.isEnumMember(decl) && decl.parent) {
            // when `interface A { field?: MyEnum.Value1 }` is generated, it is not possible
            // to deserialize A, because there is no such type information in declaration target
            // (can not cast MyEnum to exact MyEnum.Value1)
            return decl.parent?.name
        }

        let typeSpec = type.name ?? "MISSING_TYPE_NAME"
        const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier)
        if (qualifier) {
            typeSpec = `${qualifier}.${typeSpec}`
        }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `AttributeModifier`)
            typeArgs = [`object`]
        if (typeSpec === `ContentModifier`)
            typeArgs = [this.convert(idl.IDLAnyType)]
        if (typeSpec === `Optional`)
            return `${typeArgs} | undefined`
        const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
        return `${typeSpec}${maybeTypeArguments}`
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name///?
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLStringType: return "string"
            case idl.IDLNullType: return "null"
            case idl.IDLVoidType: return "void"
        }
        return type.name
    }
    convert(type: idl.IDLType | idl.IDLCallback): string {
        return idl.isCallback(type)
            ? this.callbackType(type)
            : convertType(this, type)
    }

    callbackType(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${this.library.mapType(it.type)}`)
        return `((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
    }

    protected productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        return `${
                isTuple ? "[" : "{"
            } ${
                decl.properties
                    .map(it => isTuple ? this.processTupleType(it) : it)
                    .map(it => {
                    const type = this.library.mapType(it.type)
                    return it.isOptional
                        ? includeFieldNames ? `${it.name}?: ${type}` : `(${type})?`
                        : includeFieldNames ? `${it.name}: ${type}` : `${type}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`
    }

    protected processTupleType(idlProperty: IDLProperty): IDLProperty {
        return idlProperty
    }
}

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    convertEnum(decl: idl.IDLEnum): string {
        return decl.name
    }
    convertTypedef(decl: idl.IDLTypedef): string {
        return decl.name
    }
    convertCallback(decl: idl.IDLCallback): string {
        return decl.name ?? "MISSING CALLBACK NAME"
    }

    static readonly I = new DeclarationNameConvertor()
}

class JavaTypeAlias {
    // Java type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: Type

    // synthetic identifier for internal use cases: naming classes/files etc.
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): JavaTypeAlias {
        return new JavaTypeAlias(new Type(typeName, optional), optional ? convertJavaOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: JavaTypeAlias, optional: boolean): JavaTypeAlias {
        return new JavaTypeAlias(new Type(typeAlias.type.name, optional), optional ? convertJavaOptional(typeAlias.alias) : typeAlias.alias)
    }

    constructor(type: Type, alias: string) {
        this.type = type
        this.alias = alias
    }
}

class JavaTypeAliasConvertor implements TypeConvertor<JavaTypeAlias> {
    constructor(private readonly library: IdlPeerLibrary) {}

    convertUnion(type: idl.IDLUnionType): JavaTypeAlias {
        const javaTypeAliases = type.types.map(it => convertType(this, it))
        const result = JavaTypeAlias.fromTypeName(`Union_${javaTypeAliases.map(it => it.alias).join("_")}`, false)
        return result
    }
    convertContainer(type: idl.IDLContainerType): JavaTypeAlias {
        switch (type.name) {
            case "sequence": {
                const javaTypeAlias = convertType(this, type.elementType[0])
                return new JavaTypeAlias(new Type(`${javaTypeAlias.type}[]`), `Array_${javaTypeAlias.alias}`)
            }
            case "record": {
                const javaTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
                const result = new JavaTypeAlias(new Type(`Map<${javaTypeAliases[0].type}, ${javaTypeAliases[1].type}>`), `Map_${javaTypeAliases[0].alias}_${javaTypeAliases[1].alias}`)
                return result
            }
            case "Promise":
            default:
                throw new Error(`IDL type '${type.name}' not supported`)
        }
    }
    convertEnum(type: idl.IDLEnumType): JavaTypeAlias {
        // TODO: remove prefix after full migration to IDL
        return JavaTypeAlias.fromTypeName(`Ark_${type.name}`, false)
    }
    convertCallback(type: idl.IDLCallback): JavaTypeAlias {
        // TODO
        return JavaTypeAlias.fromTypeName(`Callback`, false)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): JavaTypeAlias {
        return JavaTypeAlias.fromTypeName(type.name, false)
    }
    convertTypeReference(type: idl.IDLReferenceType): JavaTypeAlias {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }

        // resolve synthetic types
        const decl = this.library.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }

        let typeSpec = type.name ?? "MISSING_TYPE_NAME"
        if (javaCustomTypeMapping.has(typeSpec)) {
            typeSpec = javaCustomTypeMapping.get(typeSpec)!
        }
        // const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier)
        // if (qualifier) {
        //     typeSpec = `${qualifier}.${typeSpec}`
        // }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `Optional`) {
            return JavaTypeAlias.fromTypeName(typeArgs![0], true)
        }
        return JavaTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): JavaTypeAlias {
        // TODO
        return JavaTypeAlias.fromTypeName(type.name, false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): JavaTypeAlias {
        switch (type) {
            case idl.IDLAnyType: return JavaTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
            case idl.IDLStringType: return JavaTypeAlias.fromTypeName('String', false)
            case idl.IDLNumberType: return JavaTypeAlias.fromTypeName('double', false)
            case idl.IDLBooleanType: return JavaTypeAlias.fromTypeName('boolean', false)
            case idl.IDLUndefinedType: return JavaTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLI8Type: return JavaTypeAlias.fromTypeName('byte', false)
            case idl.IDLU8Type: return JavaTypeAlias.fromTypeName('byte', false)
            case idl.IDLI16Type: return JavaTypeAlias.fromTypeName('short', false)
            case idl.IDLU16Type: return JavaTypeAlias.fromTypeName('short', false)
            case idl.IDLI32Type: return JavaTypeAlias.fromTypeName('int', false)
            case idl.IDLU32Type: return JavaTypeAlias.fromTypeName('int', false)
            case idl.IDLI64Type: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLU64Type: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLF32Type: return JavaTypeAlias.fromTypeName('float', false)
            case idl.IDLF64Type: return JavaTypeAlias.fromTypeName('double', false)
            case idl.IDLPointerType: return JavaTypeAlias.fromTypeName('long', false)
        }
        throw new Error(`Unsupported IDL primitive ${type.name}`)
    }
    private readonly javaPrimitiveToReferenceTypeMap = new Map([
        ['byte', JavaTypeAlias.fromTypeName('Byte', false)],
        ['short', JavaTypeAlias.fromTypeName('Short', false)],
        ['int', JavaTypeAlias.fromTypeName('Integer', false)],
        ['float', JavaTypeAlias.fromTypeName('Float', false)],
        ['double', JavaTypeAlias.fromTypeName('Double', false)],
        ['boolean', JavaTypeAlias.fromTypeName('Boolean', false)],
        ['char', JavaTypeAlias.fromTypeName('Character', false)],
    ])
    private maybeConvertPrimitiveType(javaType: JavaTypeAlias): JavaTypeAlias {
        if (this.javaPrimitiveToReferenceTypeMap.has(javaType.type.name)) {
            return this.javaPrimitiveToReferenceTypeMap.get(javaType.type.name)!
        }
        return javaType
    }

    private callbackType(decl: idl.IDLCallback): JavaTypeAlias {
        // TODO
        //const params = decl.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${this.library.mapType(it.type)}`)
        //`((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
        return JavaTypeAlias.fromTypeName('Callback', false)
    }

    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): JavaTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const javaTypeAliases = decl.properties.map(it => JavaTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return JavaTypeAlias.fromTypeName(`Tuple_${javaTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }
}

export class JavaTypeNameConvertor implements IdlTypeNameConvertor {
    private readonly typeAliasConvertor = new JavaTypeAliasConvertor(this.library)
    constructor(private readonly library: IdlPeerLibrary) {}
    convert(type: idl.IDLType): string {
        // if (ts.isQualifiedName(type)) return this.convertQualifiedName(type)
        // if (ts.isIdentifier(type)) return this.convertIdentifier(type)
        const typeAlias = convertType(this.typeAliasConvertor, type)
        return typeAlias.type.nullable ? convertJavaOptional(typeAlias.type.name) : typeAlias.type.name
    }
}

export class ArkTSTypeNameConvertor extends TSTypeNameConvertor {
    override convertContainer(type: idl.IDLContainerType): string {
        if (type.name === "sequence") {
            return `${this.convert(type.elementType[0])}[]`
        }
        return super.convertContainer(type)
    }

    convertPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLVoidType: return "void"
            case idl.IDLAnyType: return "object"
            case idl.IDLUnknownType: return "object";
        }
        return super.convertPrimitiveType(type);
    }

    protected productType(decl: IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        if (isAnonymousInterface(decl)) {
            return decl.name
        }
        return super.productType(decl, isTuple, includeFieldNames);
    }

    protected processTupleType(idlProperty: IDLProperty): IDLProperty {
        if (idlProperty.isOptional) {
            return {
                ...idlProperty,
                isOptional: false,
                type: idl.createUnionType([idlProperty.type, idl.IDLUndefinedType])
            }
        }
        return idlProperty
    }
}
export class CJTypeNameConvertor implements IdlTypeNameConvertor {
    private readonly typeAliasConvertor = new CJTypeAliasConvertor(this.library)
    constructor(private readonly library: IdlPeerLibrary) {}
    convert(type: idl.IDLType): string {
        const typeAlias = convertType(this.typeAliasConvertor, type)
        return typeAlias.type.nullable ? convertJavaOptional(typeAlias.type.name) : typeAlias.type.name
    }
}

export class CJTypeAliasConvertor implements TypeConvertor<CJTypeAlias> {
    constructor(private readonly library: IdlPeerLibrary) {}

    convertUnion(type: idl.IDLUnionType): CJTypeAlias {
        const CJTypeAliases = type.types.map(it => convertType(this, it))
        const result = CJTypeAlias.fromTypeName(`Union_${CJTypeAliases.map(it => it.alias).join("_")}`, false)
        return result
    }
    convertContainer(type: idl.IDLContainerType): CJTypeAlias {
        switch (type.name) {
            case "sequence": {
                const cjTypeAlias = convertType(this, type.elementType[0])
                return new CJTypeAlias(new Type(`ArrayList<${cjTypeAlias.type}>`), `Array_${cjTypeAlias.alias}`)
            }
            case "record": {
                const cjTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
                const result = new CJTypeAlias(new Type(`Map<${cjTypeAliases[0].type}, ${cjTypeAliases[1].type}>`), `Map_${cjTypeAliases[0].alias}_${cjTypeAliases[1].alias}`)
                return result
            }
            case "Promise":
            default:
                throw new Error(`IDL type '${type.name}' not supported`)
        }
    }
    convertEnum(type: idl.IDLEnumType): CJTypeAlias {
        // TODO: remove prefix after full migration to IDL
        return CJTypeAlias.fromTypeName(`Ark_${type.name}`, false)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): CJTypeAlias {
        return CJTypeAlias.fromTypeName(type.name, false)
    }
    convertTypeReference(type: idl.IDLReferenceType): CJTypeAlias {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }

        // resolve synthetic types
        const decl = this.library.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }

        let typeSpec = type.name ?? "MISSING_TYPE_NAME"
        if (cjCustomTypeMapping.has(typeSpec)) {
            typeSpec = cjCustomTypeMapping.get(typeSpec)!
        }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `Optional`) {
            return CJTypeAlias.fromTypeName(typeArgs![0], true)
        }
        return CJTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName(type.name, false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): CJTypeAlias {
        switch (type) {
            case idl.IDLStringType: return CJTypeAlias.fromTypeName('String', false)
            case idl.IDLNumberType: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLBooleanType: return CJTypeAlias.fromTypeName('Bool', false)
            case idl.IDLUndefinedType: return CJTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLAnyType: return CJTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
            case idl.IDLI8Type: return CJTypeAlias.fromTypeName('Int8', false)
            case idl.IDLU8Type: return CJTypeAlias.fromTypeName('UInt8', false)
            case idl.IDLI16Type: return CJTypeAlias.fromTypeName('Int16', false)
            case idl.IDLU16Type: return CJTypeAlias.fromTypeName('UInt16', false)
            case idl.IDLI32Type: return CJTypeAlias.fromTypeName('Int32', false)
            case idl.IDLU32Type: return CJTypeAlias.fromTypeName('UInt32', false)
            case idl.IDLI64Type: return CJTypeAlias.fromTypeName('Int64', false)
            case idl.IDLU64Type: return CJTypeAlias.fromTypeName('UInt64', false)
            case idl.IDLF32Type: return CJTypeAlias.fromTypeName('Float32', false)
            case idl.IDLF64Type: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLPointerType: return CJTypeAlias.fromTypeName('Int64', false)
        }
        throw new Error(`Unsupported IDL primitive ${type.name}`)
    }
    private readonly cjPrimitiveToReferenceTypeMap = new Map([
        ['byte', JavaTypeAlias.fromTypeName('Byte', false)],
        ['short', JavaTypeAlias.fromTypeName('Short', false)],
        ['int', JavaTypeAlias.fromTypeName('Integer', false)],
        ['float', JavaTypeAlias.fromTypeName('Float', false)],
        ['double', JavaTypeAlias.fromTypeName('Double', false)],
        ['boolean', JavaTypeAlias.fromTypeName('Boolean', false)],
        ['char', JavaTypeAlias.fromTypeName('Character', false)],
    ])
    private callbackType(decl: idl.IDLCallback): JavaTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName('Callback', false)
    }
    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): JavaTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const cjTypeAliases = decl.properties.map(it => CJTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return CJTypeAlias.fromTypeName(`Tuple_${cjTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }
    private maybeConvertPrimitiveType(cjType: CJTypeAlias): CJTypeAlias {
        if (this.cjPrimitiveToReferenceTypeMap.has(cjType.type.name)) {
            return this.cjPrimitiveToReferenceTypeMap.get(cjType.type.name)!
        }
        return cjType
    }
}

class CJTypeAlias {
    // CJ type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: Type

    // synthetic identifier for internal use cases: naming classes/files etc. 
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): CJTypeAlias {
        return new CJTypeAlias(new Type(typeName, optional), optional ? convertJavaOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: CJTypeAlias, optional: boolean): CJTypeAlias {
        return new CJTypeAlias(new Type(typeAlias.type.name, optional), optional ? convertJavaOptional(typeAlias.alias) : typeAlias.alias)
    }

    constructor(type: Type, alias: string) {
        this.type = type
        this.alias = alias
    }
}
