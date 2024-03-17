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
import { GenericVisitor } from "./options"
import * as path from "path"
import { asString, getDeclarationsByNode, getLineNumberString, nameOrNullForIdl } from "./util"

export enum LinterError {
    NONE,
    TYPE_LITERAL,
    ENUM_WITH_INIT,
    COMPUTED_PROPERTY_NAME,
    TUPLE_TYPE,
    INDEXED_ACCESS_TYPE,
    TEMPLATE_LITERAL,
    IMPORT_TYPE,
    MULTIPLE_INHERITANCE,
    UNSUPPORTED_TYPE_PARAMETER,
    PARAMETER_INITIALIZER,
    DUPLICATE_INTERFACE,
    INDEX_SIGNATURE
}

export interface LinterMessage {
    file: ts.SourceFile
    pos: string
    message: string,
    error: LinterError
}

function stringMessage(message: LinterMessage): string {
    return `${message.pos} - [${message.error}] ${message.message}`
}

let allInterfaces = new Map<string, string>()

export class LinterVisitor implements GenericVisitor<LinterMessage[]> {
    private output: LinterMessage[] = []

    constructor(private sourceFile: ts.SourceFile, private typeChecker: ts.TypeChecker) {
    }

    visitWholeFile(): LinterMessage[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.output
    }

    visit(node: ts.Node): void {
        if (ts.isClassDeclaration(node)) {
            this.visitClass(node)
        } else if (ts.isInterfaceDeclaration(node)) {
            this.visitInterface(node)
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, this.visit);
        } else if (ts.isEnumDeclaration(node)) {
            this.visitEnum(node)
        } else if (ts.isFunctionDeclaration(node)) {
            this.visitFunctionDeclaration(node)
        } else if (ts.isTypeAliasDeclaration(node)) {
            this.visitTypeAlias(node)
        }
    }

    visitClass(clazz: ts.ClassDeclaration): void {
        this.checkClassDuplicate(clazz)
        const allInheritCount = clazz.heritageClauses
            ?.map(it => it.types)
            ?.flatMap(it => it)
            ?.length ?? 0
        if (allInheritCount > 1) {
            this.report(clazz, LinterError.MULTIPLE_INHERITANCE, `Multiple inheritance for class ${asString(clazz.name)}`)
        }
        clazz.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.visitConstructor(child)
            } else if (ts.isMethodDeclaration(child)) {
                this.visitMethod(child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.visitProperty(child)
            }
        })
    }

    checkClassDuplicate(clazz: ts.InterfaceDeclaration | ts.ClassDeclaration) {
        let clazzName = asString(clazz.name)
        if (allInterfaces.has(clazzName)) {
            this.report(clazz, LinterError.DUPLICATE_INTERFACE,
                `Duplicate interface ${clazzName}: ${clazz.getSourceFile().fileName} and ${allInterfaces.get(clazzName)}`)
        }
        allInterfaces.set(clazzName, clazz.getSourceFile().fileName)
    }

    visitInterface(clazz: ts.InterfaceDeclaration): void {
        this.checkClassDuplicate(clazz)
        const allInheritCount = clazz.heritageClauses
            ?.map(it => it.types)
            ?.flatMap(it => it)
            ?.length ?? 0
        if (allInheritCount > 1) {
            this.report(clazz, LinterError.MULTIPLE_INHERITANCE, `Multiple inheritance for interface ${asString(clazz.name)}`)
        }
        clazz.members.forEach(child => {
            if (ts.isConstructSignatureDeclaration(child)) {
                this.visitConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.visitMethod(child)
            } else if (ts.isPropertySignature(child)) {
                this.visitProperty(child)
            }
        })
    }

    checkType(type: ts.TypeNode | undefined): void {
        if (!type) return
        if (ts.isTypeLiteralNode(type)) {
            this.report(type, LinterError.TYPE_LITERAL, `Type literal`)
            type.members.forEach(it => {
                if (ts.isPropertySignature(it)) this.visitProperty(it)
                if (ts.isIndexSignatureDeclaration(it)) {
                    this.report(it, LinterError.INDEX_SIGNATURE, `Index signature type: ${type.getText(this.sourceFile)}`)
                }

            })
        }
        if (ts.isTupleTypeNode(type)) {
            this.report(type, LinterError.TUPLE_TYPE, `Tuple type: ${type.getText(this.sourceFile)}`)
            type.elements.forEach(it => this.checkType(it))
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            this.report(type, LinterError.INDEXED_ACCESS_TYPE, `Indexed access type: ${type.getText(this.sourceFile)}`)
            this.checkType(type.indexType)
            this.checkType(type.objectType)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            this.report(type, LinterError.TEMPLATE_LITERAL, `Template literal: ${type.getText(this.sourceFile)}`)
        }
        if (ts.isImportTypeNode(type)) {
            this.report(type, LinterError.IMPORT_TYPE, `Import type: ${type.getText(this.sourceFile)}`)
        }
        if (this.isTypeParameterReferenceAndNotCommonMethod(type)) {
            this.report(type, LinterError.UNSUPPORTED_TYPE_PARAMETER, `Unsupported type parameter: ${type.getText(this.sourceFile)}`)
        }
    }

    isTypeParameterReferenceAndNotCommonMethod(type: ts.TypeNode): boolean {
        if (!ts.isTypeReferenceNode(type)) return false
        const name = type.typeName
        const declaration = getDeclarationsByNode(this.typeChecker, name)[0]
        if (!declaration) return false
        if (ts.isTypeParameterDeclaration(declaration)) {
            let parent = declaration.parent
            if (ts.isClassDeclaration(parent)) {
                let declName = asString(parent.name)
                // TODO: shall we indeed ignore CommonShapeMethod.
                return declName != "CommonMethod" && declName != "CommonShapeMethod"
            }
        }
        return false
    }

    checkName(name: ts.PropertyName | undefined): void {
        if (!name) return
        if (ts.isComputedPropertyName(name)) {
            this.report(name, LinterError.COMPUTED_PROPERTY_NAME, `Computed property name ${name.getText(this.sourceFile)}`)
        }
    }

    visitConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration): void {
        ctor.parameters.map(param => this.checkType(param.type))
    }

    visitMethod(method: ts.MethodDeclaration | ts.MethodSignature): void {
        this.checkType(method.type)
        method.parameters.map(param => this.checkType(param.type))
        method.parameters.forEach(it => this.visitParameter(it))
    }

    visitParameter(parameter: ts.ParameterDeclaration): void {
        if (parameter.initializer) {
            this.report(parameter, LinterError.PARAMETER_INITIALIZER, "Parameter initializer is forbidden")
        }
    }

    visitProperty(property: ts.PropertySignature | ts.PropertyDeclaration): void {
        this.checkType(property.type)
        this.checkName(property.name)
    }

    visitEnum(enumDeclaration: ts.EnumDeclaration): void {
        enumDeclaration.members.forEach(member => {
            if (member.initializer && !ts.isNumericLiteral(member.initializer)) {
                this.report(
                    member,
                    LinterError.ENUM_WITH_INIT,
                    `Enum ${nameOrNullForIdl(enumDeclaration.name)}.${nameOrNullForIdl(member.name)} with non-int initializer: ${member.initializer.getText(this.sourceFile)}`
                )
            }
        })
    }

    visitTypeAlias(type: ts.TypeAliasDeclaration): void {
        this.checkType(type.type)
    }

    visitFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration): void {
        functionDeclaration.parameters.forEach(it => this.visitParameter(it))
    }

    report(node: ts.Node, error: LinterError, message: string): void {
        this.output.push({
            file: this.sourceFile,
            pos: `${path.basename(this.sourceFile.fileName)}:${getLineNumberString(this.sourceFile, node.getStart(this.sourceFile, false))}`,
            message: message,
            error: error
        })
    }
}

export function toLinterString(allEntries: Array<LinterMessage[]>,
    suppressErrors: string | undefined,
    suppressLocations: string | undefined
): [string, number] {
    const suppressedErrorsSet = new Set<LinterError>()
    if (suppressErrors) {
        suppressErrors.split(",").forEach(it => suppressedErrorsSet.add(Number(it) as LinterError))
    }
    const suppressLocationsSet = new Set<string>()
    if (suppressLocations) {
        console.log(typeof suppressLocations)
        suppressLocations.split(",").forEach(it => suppressLocationsSet.add(it))
    }
    let errors = allEntries
        .flatMap(entries =>
            entries
                .filter(it => !suppressedErrorsSet.has(it.error))
                .filter(it => !suppressLocationsSet.has(it.pos))
                .map(stringMessage)
        )
        .filter(element => (element?.length ?? 0) > 0)
    return [errors.join("\n"), errors.length > 0 ? 1 : 0 ]
}
