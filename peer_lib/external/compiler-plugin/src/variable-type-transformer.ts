/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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
import { AbstractVisitor } from "./AbstractVisitor";
import { Rewrite } from "./transformation-context";
import { asString, createContextTypeImport, FunctionKind, hiddenParameters, skipParenthesizedType, Tracer } from "./util";

export class VariableTypeTransformer extends AbstractVisitor {
    constructor(
        public tracer: Tracer,
        public typechecker: ts.TypeChecker,
        public sourceFile: ts.SourceFile,
        public rewrite: Rewrite,
        ctx: ts.TransformationContext
    ) {
        super(ctx)
    }

    isFunctionTypeNode(node: ts.TypeNode): boolean {
        if (ts.isFunctionTypeNode(node)) return true
        return ts.isParenthesizedTypeNode(node) && ts.isFunctionTypeNode(node.type)
    }

    skipParenthesizedOverFunctionType(node: ts.FunctionTypeNode | ts.ParenthesizedTypeNode): ts.FunctionTypeNode {
        if (ts.isParenthesizedTypeNode(node) && !ts.isFunctionTypeNode(node.type)) {
            throw new Error(`Expected function type, but got: ${asString(node.type)}`)
        }
        return skipParenthesizedType(node) as ts.FunctionTypeNode
    }

    updateFunctionType(node: ts.FunctionTypeNode | ts.ParenthesizedTypeNode): ts.FunctionTypeNode {
        const type = this.skipParenthesizedOverFunctionType(node)
        const additionalParameters = hiddenParameters(this.rewrite)
        const newParameters = additionalParameters.concat(type.parameters)

        return ts.factory.updateFunctionTypeNode(
            type,
            type.typeParameters,
            ts.factory.createNodeArray(newParameters),
            type.type
        )
    }

    isFunctionOrUndefinedType(node: ts.TypeNode): boolean {
        const type = skipParenthesizedType(node)
        if (!type) return false
        if (!ts.isUnionTypeNode(type)) return false

        const types: Array<ts.TypeNode> = [...type.types]
        return types.every(
                it => (this.isFunctionTypeNode(it) ||
                    it.kind == ts.SyntaxKind.UndefinedKeyword))

    }

    transformFunctionOrUndefined(node: ts.UnionTypeNode): ts.UnionTypeNode {
        const newTypes = node.types.map(
            it => (it.kind == ts.SyntaxKind.UndefinedKeyword ? it :
                this.updateFunctionType(it as ts.FunctionTypeNode))
        )
        return ts.factory.updateUnionTypeNode(
            node,
            ts.factory.createNodeArray(newTypes)
        )
    }

    transformParameterType(node: ts.ParameterDeclaration): ts.ParameterDeclaration {
        const type = skipParenthesizedType(node.type)
        if (type == undefined) return node

        let newType = type
        if (ts.isFunctionTypeNode(type)) {
            newType = this.updateFunctionType(type)
        } else if (this.isFunctionOrUndefinedType(type)) {
            newType = this.transformFunctionOrUndefined(type as ts.UnionTypeNode)
        } else return node
        // Applyting @memo to non-functional parameters should have been reported
        // by the diagnostics visitor.

        return ts.factory.updateParameterDeclaration(
            node,
            node.modifiers,
            node.dotDotDotToken,
            node.name,
            node.questionToken,
            newType,
            node.initializer
        )
    }

    transformVariableType(node: ts.VariableDeclaration): ts.VariableDeclaration {
        const type = skipParenthesizedType(node.type)
        if (type == undefined) return node
        // Applyting @memo to non-functional variable should have been reported
        // by the diagnostics visitor.
        if (!ts.isFunctionTypeNode(type)) return node

        return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            this.updateFunctionType(type),
            node.initializer
        )
    }

    transformPropertyType(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
        const type = skipParenthesizedType(node.type)
        if (type == undefined) return node
        // Applying @memo to non-functional property should have been reported
        // by the diagnostics visitor.
        if (!ts.isFunctionTypeNode(type)) return node

        return ts.factory.updatePropertyDeclaration(
            node,
            node.modifiers,
            node.name,
            node.questionToken ?? node.exclamationToken,
            this.updateFunctionType(type),
            node.initializer
        )
    }

    transformPropertySignatureType(node: ts.PropertySignature): ts.PropertySignature {
        const type = skipParenthesizedType(node.type)
        if (type == undefined) return node
        // Applying @memo to non-functional property should have been reported
        // by the diagnostics visitor.
        if (!ts.isFunctionTypeNode(type)) return node

        return ts.factory.updatePropertySignature(
            node,
            node.modifiers,
            node.name,
            node.questionToken,
            this.updateFunctionType(type)
        )
    }

    addTypeImports(node: ts.SourceFile, rewrite: Rewrite): ts.SourceFile {
        if (rewrite.importTypesFrom == undefined) return node

        const newStatements = [createContextTypeImport(rewrite.importTypesFrom)].concat(node.statements.slice())

        return ts.factory.updateSourceFile(
                node,
                newStatements,
                node.isDeclarationFile,
                node.referencedFiles,
                node.typeReferenceDirectives,
                node.hasNoDefaultLib,
                node.libReferenceDirectives
            )
    }

    visitor(beforeChildren: ts.Node): ts.Node {
        const node = this.visitEachChild(beforeChildren)
        let transformed: ts.Node|undefined = undefined
        if (ts.isParameter(node)) {
            const kind = this.rewrite.variableTable.get(ts.getOriginalNode(node) as ts.ParameterDeclaration)
            if (kind == FunctionKind.MEMO) {
                transformed = this.transformParameterType(node)
            }
        } else if (ts.isVariableDeclaration(node)) {
            const kind = this.rewrite.variableTable.get(ts.getOriginalNode(node) as ts.VariableDeclaration)
            if (kind == FunctionKind.MEMO) {
                transformed = this.transformVariableType(node)
            }
        } else if (ts.isPropertyDeclaration(node)) {
            const kind = this.rewrite.variableTable.get(ts.getOriginalNode(node) as ts.PropertyDeclaration)
            if (kind == FunctionKind.MEMO) {
                transformed = this.transformPropertyType(node)
            }
        } else if (ts.isPropertySignature(node)) {
            const kind = this.rewrite.variableTable.get(ts.getOriginalNode(node) as ts.PropertySignature)
            if (kind == FunctionKind.MEMO) {
                transformed = this.transformPropertySignatureType(node)
            }
        } else if (ts.isSourceFile(node)) {
            transformed = this.addTypeImports(node, this.rewrite)
        }

        return transformed ?? node
    }
}