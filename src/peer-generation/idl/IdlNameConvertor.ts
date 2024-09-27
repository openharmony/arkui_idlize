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

export interface IdlTypeNameConvertor extends TypeConvertor<string> {
    convert(type: idl.IDLType): string
}

export class TSTypeNameConvertor implements IdlTypeNameConvertor {
    constructor(private library: IdlPeerLibrary) {}
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

        let typeSpec = type.name ?? "MISSING_TYPE_NAME"
        const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier)
        if (qualifier) {
            typeSpec = `${qualifier}.${typeSpec}`
        }
        if (typeSpec === 'Style')
            return "Object" //this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword))
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `AttributeModifier`)
            typeArgs = [`object`]
        if (typeSpec === `ContentModifier`)
            typeArgs = [`any`] //this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
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

    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        return `${
                isTuple ? "[" : "{"
            } ${
                decl.properties.map(it => {
                    const type = this.library.mapType(it.type)
                    return it.isOptional
                        ? includeFieldNames ? `${it.name}?: ${type}` : `(${type})?`
                        : includeFieldNames ? `${it.name}: ${type}` : `${type}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`
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
