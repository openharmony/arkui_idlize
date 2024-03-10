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

import * as ts from "typescript"
import * as webidl2 from "webidl2"
import { PunctuationToken, SyntaxKind } from "typescript"
import { toString } from "./toString"
import {
    IDLCallback, IDLConstructor, IDLEntry, IDLEnum, IDLInterface, IDLMethod, IDLParameter, IDLProperty, IDLType,
    IDLTypedef, hasExtAttribute, isCallback, isClass, isContainerType, isEnum, isInterface, isPrimitiveType, isReferenceType, isTypedef,
    isUnionType
} from "../idl"
import { isDefined } from "../util"
import { toIDLNode } from "./deserialize"

/*
    TODO: global function
    TODO: generic interface (return this) + class inheritance (CommonMethod)
    TODO: comments
    TODO: enum values
    TODO: namespace
 */

export function toTsNode(node: IDLEntry): ts.Node {
    if (isInterface(node)) return toInterface(node)
    if (isClass(node)) return toClass(node)
    if (isCallback(node)) return toGlobalType(node)
    if (isEnum(node)) return toEnum(node)
    if (isTypedef(node)) return toTypedef(node)

    throw new Error(`unexpected node type: ${toString(node)}`)
}

function toInterface(node: IDLInterface): ts.Node {
    return ts.factory.createInterfaceDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
        node.name,
        [], // assuming no type params
        toHeritageClause(node.inheritance),
        [
            node.properties.map((it) => toInterfaceProperty(node, it)),
            node.constructors.map(toInterfaceConstructor),
            node.methods.map(toInterfaceMethod)
        ].flat()
    )
}

function toHeritageClause(inheritance: IDLType[]): ts.HeritageClause[] {
    if (inheritance.length === 0) return []
    return [ts.factory.createHeritageClause(
        ts.SyntaxKind.ExtendsKeyword,
        [ts.factory.createExpressionWithTypeArguments(
            ts.factory.createIdentifier(inheritance[0].name),
            [] // assuming no type params
        )]
    )]
}

function toEnumInitializer(value: number|string|undefined): ts.Expression|undefined {
    if (typeof value == "number") return ts.factory.createNumericLiteral(value)
    if (typeof value == "string") return ts.factory.createStringLiteral(value)
    return undefined
}

function toEnum(node: IDLEnum): ts.Node {
    return ts.factory.createEnumDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
        node.name,
        node.elements.map(it => ts.factory.createEnumMember(it.name, toEnumInitializer(it.initializer)))
    )
}

function toInterfaceConstructor(node: IDLConstructor): ts.MethodSignature {
    return ts.factory.createMethodSignature(
        [],
        "constructor",
        undefined,
        [], // assuming no type params
        node.parameters.map(toParameter),
        undefined
    )
}

function toInterfaceMethod(node: IDLMethod): ts.MethodSignature {
    return ts.factory.createMethodSignature(
        toMethodModifiers(node),
        renameMethod(node.name),
        undefined, // no question token for methods
        [], // assuming no type params
        node.parameters.map(toParameter),
        toTypeOrUndefined(node.returnType)
    )
}

function toParameter(node: IDLParameter): ts.ParameterDeclaration {
    return ts.factory.createParameterDeclaration(
        [],
        toDotDotDotToken(node.isVariadic),
        node.name,
        toQuestionToken(node.isOptional),
        toTypeOrUndefined(node.type),
        undefined // initializer is forbidden
    )
}

function toInterfaceProperty(iface: IDLInterface, node: IDLProperty): ts.PropertySignature | ts.MethodSignature {
    if (hasExtAttribute(node, "CommonMethod")) {
        return ts.factory.createMethodSignature(
            undefined,
            node.name,
            undefined,
            undefined,
            [
                ts.factory.createParameterDeclaration(
                    undefined, undefined, "value", undefined, toType(node.type), undefined)
            ],
            ts.factory.createTypeReferenceNode(
                renameType(iface.name)
            )
        )
    }
    return ts.factory.createPropertySignature(
        toPropertyModifiers(node),
        node.name,
        toQuestionToken(node.isOptional),
        toTypeOrUndefined(node.type)
    )
}

function toPropertyModifiers(node: IDLProperty): readonly ts.Modifier[] {
    return [
        node.isStatic ? ts.factory.createModifier(ts.SyntaxKind.StaticKeyword) : undefined,
        node.isReadonly ? ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword) : undefined
    ].filter(isDefined)
}

function toMethodModifiers(node: IDLMethod): readonly ts.Modifier[] {
    return [
        node.isStatic ? ts.factory.createModifier(ts.SyntaxKind.StaticKeyword) : undefined
    ].filter(isDefined)
}

function toType(node: IDLType): ts.TypeNode {
    if (isUnionType(node)) {
        return ts.factory.createUnionTypeNode(
            node.types
                .map(toType)
                .filter(isDefined)
        )
    }
    if (isContainerType(node)) {
        return ts.factory.createArrayTypeNode(
            toType(node.elementType)
        )
    }
    if (isReferenceType(node) || isPrimitiveType(node)) {
        return ts.factory.createTypeReferenceNode(
            renameType(node.name)
        )
    }
    throw new Error(`unexpected type: ${node}`)
}

function toTypeOrUndefined(node: IDLType | undefined): ts.TypeNode | undefined {
    return node ? toType(node) : undefined
}

const printer = ts.createPrinter()

function tsNodeToString(node: ts.Node): string {
    return printer.printNode(ts.EmitHint.Unspecified, node, ts.createSourceFile("", "", ts.ScriptTarget.ESNext))
}

export function idlToString(name: string, content: string): string {
    return webidl2.parse(content)
        .map(it => toIDLNode(name, it))
        .map(toTsNode)
        .map(tsNodeToString)
        .join('\n')
}

function toClass(node: IDLInterface): ts.ClassDeclaration {
    return ts.factory.createClassDeclaration(
        [
            ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)
        ],
        node.name,
        [], // assuming no type params
        toHeritageClause(node.inheritance),
        [
            node.properties.map(it => toClassProperty(node, it)),
            node.constructors.map(toClassConstructor),
            node.methods.map(toClassMethod)
        ].flat()
    )
}

function toClassConstructor(node: IDLConstructor): ts.MethodDeclaration {
    return ts.factory.createMethodDeclaration(
        [],
        undefined,
        "constructor",
        undefined,
        [], // assuming no type params
        node.parameters.map(toParameter),
        undefined,
        undefined
    )
}

function toClassMethod(node: IDLMethod): ts.MethodDeclaration {
    return ts.factory.createMethodDeclaration(
        toMethodModifiers(node),
        undefined,
        renameMethod(node.name),
        undefined,
        [], // assuming no type params
        node.parameters.map(toParameter),
        toType(node.returnType),
        undefined
    )
}

function toClassProperty(clazz: IDLInterface, prop: IDLProperty): ts.PropertyDeclaration | ts.MethodDeclaration {
    if (hasExtAttribute(prop, "CommonMethod")) {
        return ts.factory.createMethodDeclaration(
            undefined,
            undefined,
            prop.name,
            undefined,
            undefined,
            [
                ts.factory.createParameterDeclaration(
                    undefined, undefined, "value", undefined, toType(prop.type), undefined)
            ],
            ts.factory.createTypeReferenceNode(
                renameType(clazz.name)
            ),
            undefined
        )
    }

    return ts.factory.createPropertyDeclaration(
        toPropertyModifiers(prop),
        prop.name,
        toQuestionToken(prop.isOptional),
        toTypeOrUndefined(prop.type),
        undefined
    )
}

function renameType(literal: string): string {
    if (literal === "undefined") {
        return "void"
    }
    return literal
}

function renameMethod(method: string): string {
    if (method === "invoke") {
        return ""
    }
    return method
}

function toGlobalType(node: IDLCallback): ts.TypeAliasDeclaration {
    return ts.factory.createTypeAliasDeclaration(
        [],
        node.name,
        [], // assuming no type params
        ts.factory.createFunctionTypeNode(
            [], // assuming no type params here
            node.parameters.map(toParameter),
            toType(node.returnType)
        )
    )
}

function toTypedef(node: IDLTypedef): ts.TypeAliasDeclaration {
    return ts.factory.createTypeAliasDeclaration(
        [],
        node.name,
        [], // assuming no type params
        toType(node.type)
    )
}

function toQuestionToken<T>(value: T): PunctuationToken<SyntaxKind.QuestionToken> | undefined {
    return !!value ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined
}

function toDotDotDotToken<T>(value: T): PunctuationToken<SyntaxKind.DotDotDotToken> | undefined {
    return !!value ? ts.factory.createToken(ts.SyntaxKind.DotDotDotToken) : undefined
}
