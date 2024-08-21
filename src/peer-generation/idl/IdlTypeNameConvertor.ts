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
import { TypeConvertor, convertType } from './IdlTypeConvertor'

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
    // convertTypeLiteral(node: ts.TypeLiteralNode): string {
    //     const members = node.members.map(it => {
    //         if (ts.isPropertySignature(it)) {
    //             const name = this.convert(it.name)
    //             const maybeQuestion = it.questionToken ? '?' : ''
    //             const type = this.convert(it.type!)
    //             return `${name}${maybeQuestion}: ${type}`
    //         }
    //         if (ts.isIndexSignatureDeclaration(it)) {
    //             if (it.modifiers) throw 'Not implemented'
    //             if (it.typeParameters) throw 'Not implemented'
    //             if (it.questionToken) throw 'Not implemented'
    //             if (it.name) throw 'Not implemented'
    //             const parameters = it.parameters.map(it => this.convertParameterDeclaration(it))
    //             return `[${parameters.join(', ')}]: ${this.convert(it.type)}`
    //         }
    //         throw `Unknown member type ${ts.SyntaxKind[it.kind]}`
    //     })
    //     return `{${members.join(', ')}}`
    // }
    // private convertParameterDeclaration(node: ts.ParameterDeclaration): string {
    //     if (node.modifiers) throw 'Not implemented'
    //     if (!node.type) throw 'Expected ParameterDeclaration to have a type'
    //     const maybeQuestion = node.questionToken ? '?' : ''
    //     const name = this.convert(node.name)
    //     return `${name}${maybeQuestion}: ${this.convert(node.type!)}`
    // }
    // convertLiteralType(node: ts.LiteralTypeNode): string {
    //     if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return `true`
    //     if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return `false`
    //     if (node.literal.kind === ts.SyntaxKind.NullKeyword) return `null`
    //     if (node.literal.kind === ts.SyntaxKind.StringLiteral) return `"${node.literal.text}"`
    //     throw new Error(`Unknown LiteralTypeNode ${ts.SyntaxKind[node.literal.kind]}`)
    // }
    // convertTuple(node: ts.TupleTypeNode): string {
    //     const members = node.elements.map(it => this.convertTupleElement(it))
    //     return `[${members.join(', ')}]`
    // }
    // protected convertTupleElement(node: ts.TypeNode): string {
    //     if (ts.isNamedTupleMember(node)) {
    //         const name = this.convert(node.name)
    //         const maybeQuestion = node.questionToken ? '?' : ''
    //         const type = this.convert(node.type!)
    //         return `${name}${maybeQuestion}: ${type}`
    //     }
    //     return this.convert(node)
    // }
    // convertArray(node: ts.ArrayTypeNode): string {
    //     return `${this.convert(node.elementType)}[]`
    // }
    // convertOptional(node: ts.OptionalTypeNode): string {
    //     return `${this.convert(node.type)}?`
    // }
    // convertFunction(node: ts.FunctionTypeNode): string {
    //     if (node.typeParameters?.length)
    //         throw "Not implemented"
    //     const parameters = node.parameters.map(it => {
    //         const name = this.convert(it.name)
    //         const maybeQuestion = it.questionToken ? '?' : ''
    //         const type = this.convert(it.type!)
    //         return `${name}${maybeQuestion}: ${type}`
    //     })
    //     return `((${parameters.join(', ')}) => ${this.convert(node.type)})`
    // }
    // convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
    //     return node.templateSpans.map(template => {
    //         return `\`\${${this.convert(template.type)}}${template.literal.rawText}\``
    //     }).join()
    // }
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
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr)
            return importAttr

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
    // convertParenthesized(node: ts.ParenthesizedTypeNode): string {
    //     return `(${this.convert(node.type)})`
    // }
    // convertIndexedAccess(node: ts.IndexedAccessTypeNode): string {
    //     throw new Error('Method not implemented.')
    // }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name///?
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case "DOMString": return "string"
            case "null_": return "null"
            case "void_": return "void"
        }
        return type.name
    }
    // convertStringKeyword(node: ts.TypeNode): string {
    //     return 'string'
    // }
    // convertNumberKeyword(node: ts.TypeNode): string {
    //     return 'number'
    // }
    // convertBooleanKeyword(node: ts.TypeNode): string {
    //     return 'boolean'
    // }
    // convertUndefinedKeyword(node: ts.TypeNode): string {
    //     return 'undefined'
    // }
    // convertVoidKeyword(node: ts.TypeNode): string {
    //     return 'void'
    // }
    // convertObjectKeyword(node: ts.TypeNode): string {
    //     return 'Object'
    // }
    // convertAnyKeyword(node: ts.TypeNode): string {
    //     return 'any'
    // }
    // convertUnknownKeyword(node: ts.TypeNode): string {
    //     return `unknown`
    // }

    // // identifier
    // convertQualifiedName(node: ts.QualifiedName): string {
    //     return `${this.convert(node.left)}.${this.convert(node.right)}`
    // }
    // convertIdentifier(node: ts.Identifier): string {
    //     return node.text
    // }

    convert(type: idl.IDLType): string {
        // if (ts.isQualifiedName(type)) return this.convertQualifiedName(type)
        // if (ts.isIdentifier(type)) return this.convertIdentifier(type)
        return convertType(this, type)
        // throw new Error(`Unknown node type ${ts.SyntaxKind[type.kind]}`)
    }

    private callbackType(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${this.library.mapType(it.type)}`)
        return `((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
    }

    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        return `${
                isTuple ? "[" : "{"
            } ${
                decl.properties.map(it => {
                    const questionMark = it.isOptional ? "?" : ""
                    const type = this.library.mapType(it.type)
                    return includeFieldNames ? `${it.name}${questionMark}: ${type}` : `${type}${questionMark}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`
    }
}

export class ArkTSTypeNameConvertor extends TSTypeNameConvertor {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case "any": return "Object"
            case "void_": return "Void"
        }
        return super.convertPrimitiveType(type)
    }

    // protected convertTupleElement(node: ts.TypeNode): string {
    //     return super.convertTupleElement(node).replaceAll("?", " | undefined")
    // }

    // convertImport(node: ts.ImportTypeNode): string {
    //     return super.convertImport(node);
    // }

    // convertLiteralType(node: ts.LiteralTypeNode): string {
    //     if (ts.isUnionTypeNode(node.parent) && ts.isStringLiteral(node.literal)) {
    //         return `LITERAL_${node.literal.getText().replaceAll('"', '')}`
    //     } else {
    //         return super.convertLiteralType(node)
    //     }
    // }

    // convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
    //     const parent = node.parent
    //     if (ts.isTypeAliasDeclaration(parent)) {
    //         return `TEMPLATE_LITERAL_${node.templateSpans
    //             .map(it => `${this.convert(it.type)}_${parent.name.text}`).join('_')}`
    //     }
    //     return `TEMPLATE_LITERAL_${node.templateSpans
    //         .map(it => `${this.convert(it.type)}_${it.literal.text}`).join('_')}`
    // }
}