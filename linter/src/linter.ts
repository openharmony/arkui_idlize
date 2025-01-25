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
import * as path from "path"
import {
    GenericVisitor, cppKeywords,
    asString,
    getDeclarationsByNode,
    getLineNumberString,
    identName,
    isAbstract,
    isStatic,
    nameOrNull,
    zip,
    isCommonMethodOrSubclass,
    findRealDeclarations
} from "@idlize/core"
import { LinterWhitelist } from "./LinterWhitelist"
import { LinterError, LinterMessage } from "./LinterMessage"

const suppressed = new Set([
    LinterError.UNION_CONTAINS_ENUM,
    LinterError.EVENT_HANDLER_WITH_FUNCTIONAL_PARAM_TYPE,
    LinterError.CALLBACK_WITH_FUNCTIONAL_PARAM_TYPE,
])

function stringMessage(message: LinterMessage): string {
    return `${message.pos} - [${LinterError[message.error]}] ${message.message}`
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
            this.visitNamespace(node)
        } else if (ts.isEnumDeclaration(node)) {
            this.visitEnum(node)
        } else if (ts.isFunctionDeclaration(node)) {
            this.visitFunctionDeclaration(node)
        } else if (ts.isTypeAliasDeclaration(node)) {
            this.visitTypeAlias(node)
        } else if (ts.isVariableStatement(node)) {
            this.visitVariable(node)
        }
    }

    visitVariable(node: ts.VariableStatement) {
        //if (node.modifiers?.includes(ts.factory.createToken(ts.SyntaxKind.DeclareKeyword))) {
        node.declarationList.forEachChild(declaration => {
                if (ts.isVariableDeclaration(declaration)) {
                    if (declaration.initializer == undefined && declaration.type) {
                        let name = identName(declaration.type)
                        if (!name?.endsWith("Interface") && !name?.endsWith("Attribute"))
                            this.report(declaration, LinterError.VARIABLE_WITHOUT_VALUE, `Variable ${identName(declaration.name)} has no initialization`)
                    }
                }
            }
        )
        ts.forEachChild(node, this.visit)
    }

    visitNamespace(node: ts.ModuleDeclaration) {
        if (node.name) {
            // No longer an error.
            // this.report(node, LinterError.NAMESPACE, `Namespace detected: ${asString(node.name)}`)
        }
        ts.forEachChild(node, this.visit)
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
        if (clazz.members.every(ts.isConstructorDeclaration) && allInheritCount == 0 && !isAbstract(clazz.modifiers)) {
            this.report(clazz, LinterError.INCORRECT_DATA_CLASS, `Data class ${identName(clazz.name)} declared wrong way: use class/interface with fields`)
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
        this.checkClassInheritance(clazz)
        this.checkClassStaticMethodsWithoutConstructor(clazz)
        this.interfaceOrClassChecks(clazz)
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
        clazz.modifiers?.forEach(it => {
            if (it.kind == ts.SyntaxKind.PrivateKeyword) {
                this.report(clazz, LinterError.PRIVATE_VISIBILITY, `Private visibility is useless: ${clazz.getText(this.sourceFile).substring(0, 50)}`)
            }
        })
        clazz.members.forEach(child => {
            if (ts.isConstructSignatureDeclaration(child)) {
                this.visitConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.visitMethod(child)
            } else if (ts.isPropertySignature(child)) {
                this.visitProperty(child)
            } else if (ts.isCallSignatureDeclaration(child)) {
                this.visitMethod(child)
            }
        })
        this.interfaceOrClassChecks(clazz)
    }

    checkType(type: ts.TypeNode | undefined): void {
        if (!type) return
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            let parent = type.parent
            this.report(type, LinterError.ANY_KEYWORD, `Keyword "any" is disallowed: ${parent.getText()}`)
            return
        }
        if (ts.isArrayTypeNode(type)) {
            this.checkType(type.elementType)
            return
        }
        if (ts.isTypeLiteralNode(type)) {
            this.report(type, LinterError.TYPE_LITERAL, `Type literal`)
            type.members.forEach(it => {
                if (ts.isPropertySignature(it)) this.visitProperty(it)
                if (ts.isIndexSignatureDeclaration(it)) {
                    this.report(it, LinterError.INDEX_SIGNATURE, `Index signature type: ${type.getText()}`)
                    it.parameters.forEach(it => this.checkType(it.type))
                }

            })
        }
        if (ts.isUnionTypeNode(type)) {
            const enumType = findEnumType(type.types, this.typeChecker)
            if (enumType != undefined) {
                this.report(type, LinterError.UNION_CONTAINS_ENUM, `Union: '${type.getText()}' contains type Enum: '${enumType.name.text}'`)
            }
            type.types.forEach(it => {
                this.checkType(it)
            })
        }
        if (ts.isTypeReferenceNode(type)) {
            if (this.inParamCheck) {
                const declarations = getDeclarationsByNode(this.typeChecker, type.typeName)
                if (declarations.length > 0) {
                    const decl = declarations[0]
                    if (ts.isClassDeclaration(decl) && isCommonMethodOrSubclass(this.typeChecker, decl)) {
                        this.report(type, LinterError.USE_COMPONENT_AS_PARAM, `Component ${identName(decl.name)} used as parameter`)
                    }
                    if (ts.isInterfaceDeclaration(decl)) {
                        this.checkCallback(type)
                    }
                }
            }
            if (ts.isQualifiedName(type.typeName)) {
                this.report(type, LinterError.TYPE_ELEMENT_TYPE,
                    `Type element types unsupported, use type "${ts.idText(type.typeName.left as ts.Identifier)}" itself: ${type.getText(this.sourceFile)}`)
            }
        }
        if (ts.isParenthesizedTypeNode(type)) {
            this.checkType(type.type)
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
        if (ts.isFunctionTypeNode(type)) {
            this.checkHandler(type)
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
                return !isCommonMethodOrSubclass(this.typeChecker, parent)
            }
        }
        return false
    }

    checkName(name: ts.PropertyName | undefined): void {
        if (!name) return
        if (ts.isComputedPropertyName(name)) {
            this.report(name, LinterError.COMPUTED_PROPERTY_NAME, `Computed property name ${name.getText(this.sourceFile)}`)
        } else {
            let nameString = identName(name)!
            if (cppKeywords.has(nameString)) {
                this.report(
                    name,
                    LinterError.CPP_KEYWORDS,
                    `Use C/C++ keyword as the field name: ${nameString}`
                )
            }
        }
    }

    checkCallback(type: ts.TypeReferenceNode) {
        if ("Callback" === `${identName(type)}`) {
            const typeArgs = type.typeArguments
            if (typeArgs && typeArgs.length > 1) {
                const returnType = typeArgs[1]
                if (returnType.kind !== ts.SyntaxKind.VoidKeyword) {
                    this.report(type, LinterError.CALLBACK_WITH_NON_VOID_RETURN_TYPE,
                        `Callback<${typeArgs.map(it => identName(it)).join(", ")}> has non void return type`)
                }
            }
        }
    }

    checkHandler(type: ts.FunctionTypeNode) {
        const prop = type.parent
        const method = type.parent.parent
        let clazz: ts.Node | undefined
        let memberName: string | undefined

        if (ts.isPropertySignature(prop) || ts.isPropertyDeclaration(prop)) {
            clazz = prop.parent
            memberName = identName(prop.name)
        } else if (ts.isMethodSignature(method) || ts.isMethodDeclaration(method)) {
            clazz = method.parent
            memberName = identName(method.name)
        } else {
            return
        }

        let clazzName: string | undefined

        if (ts.isClassDeclaration(clazz) || ts.isInterfaceDeclaration(clazz)) {
            clazzName = identName(clazz.name)
            type.parameters.forEach(it => {
                if (it.type && this.isInvalidHandlerParamType(it.type)) {
                    const error = ts.isClassDeclaration(clazz!) && isCommonMethodOrSubclass(this.typeChecker, clazz!)
                        ? LinterError.EVENT_HANDLER_WITH_FUNCTIONAL_PARAM_TYPE
                        : LinterError.CALLBACK_WITH_FUNCTIONAL_PARAM_TYPE
                    const paramName = identName(it.name)
                    this.report(type, error,
                        `Callback ${clazzName}.${memberName} has functional type for param ${paramName}`)
                }
            })
        }

        const returnType = identName(type.type)
        if (returnType !== "void") {
            const params = type.parameters.map(it => `${identName(it.name)}: ${identName(it.type)}`)
            this.report(type, LinterError.CALLBACK_WITH_NON_VOID_RETURN_TYPE,
                `Callback ` + (clazzName ? `for member ${clazzName}.${memberName} ` : ``) +
                `has non void return type: (${params.join(", ")}) => ${returnType}`)
        }
    }

    isInvalidHandlerParamType(type: ts.Node): boolean {
        if (ts.isFunctionTypeNode(type)) {
            return true
        }
        if (ts.isInterfaceDeclaration(type)) {
            return type.members
                .filter(ts.isPropertySignature)
                .some(it => ts.isFunctionTypeNode(it.type!) || identName(it.type) === "Callback")
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
                .find(it => ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it))

            return declaration ? this.isInvalidHandlerParamType(declaration) : false
        }
        return false
    }

    visitConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration): void {
        ctor.parameters.map(param => this.checkType(param.type))
    }

    visitMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration): void {
        this.checkType(method.type)
        method.modifiers?.forEach(it => {
            if (it.kind == ts.SyntaxKind.PrivateKeyword) {
                this.report(method, LinterError.PRIVATE_VISIBILITY, `Private visibility is useless: Private visibility is useless: ${method.getText(this.sourceFile).substring(0, 50)}`)
            }
        })
        method.parameters.forEach(it => this.visitParameter(it))
    }

    private inParamCheck = false
    visitParameter(parameter: ts.ParameterDeclaration): void {
        if (parameter.initializer) {
            this.report(parameter, LinterError.PARAMETER_INITIALIZER, "Parameter initializer is forbidden")
        }
        this.inParamCheck = true
        this.checkType(parameter.type)
        this.inParamCheck = false

    }

    visitProperty(property: ts.PropertySignature | ts.PropertyDeclaration): void {
        property.modifiers?.forEach(it => {
            if (it.kind == ts.SyntaxKind.PrivateKeyword) {
                this.report(property, LinterError.PRIVATE_VISIBILITY, `Private visibility is useless: ${property.getText(this.sourceFile)}`)
            }
        })
        this.checkType(property.type)
        this.checkName(property.name)
    }

    visitEnum(enumDeclaration: ts.EnumDeclaration): void {
        enumDeclaration.members.forEach(member => {
            if (member.initializer && !ts.isNumericLiteral(member.initializer)) {
                this.report(
                    member,
                    LinterError.ENUM_WITH_INIT,
                    `Enum ${nameOrNull(enumDeclaration.name)}.${nameOrNull(member.name)} with non-int initializer: ${member.initializer.getText(this.sourceFile)}`
                )
            }
        })
    }

    visitTypeAlias(type: ts.TypeAliasDeclaration): void {
        this.checkType(type.type)
    }

    visitFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration): void {
        this.report(functionDeclaration, LinterError.TOP_LEVEL_FUNCTIONS, `Top level function: ${functionDeclaration.getText(this.sourceFile)}`)
        functionDeclaration.parameters.forEach(it => this.visitParameter(it))
    }

    report(node: ts.Node, error: LinterError, message: string): void {
        if (suppressed.has(error)) return
        this.output.push({
            file: this.sourceFile,
            pos: `${path.basename(this.sourceFile.fileName)}:${getLineNumberString(this.sourceFile, node.getStart(this.sourceFile, false))}`,
            message: message,
            error: error,
            node: node
        })
    }

    private checkClassInheritance(node: ts.ClassDeclaration) {
        const inheritance = node.heritageClauses
            ?.filter(it => it.token === ts.SyntaxKind.ExtendsKeyword)
        if (inheritance === undefined || inheritance.length === 0) return

        const parent = inheritance[0].types[0].expression
        const parentDeclaration = getDeclarationsByNode(this.typeChecker, parent).find(ts.isClassDeclaration)
        if (parentDeclaration === undefined) return

        const nodeMethods = this.getMethodsTypes(node)
        const parentMethods = this.getMethodsTypes(parentDeclaration)

        nodeMethods.forEach((nodeMethod: ts.FunctionTypeNode, methodName: string) => {
            const parentMethod = parentMethods.get(methodName)
            if (parentMethod === undefined) return

            if (!this.satisfies(nodeMethod, parentMethod)) {
                this.report(
                    node,
                    LinterError.INTERFACE_METHOD_TYPE_INCONSISTENT_WITH_PARENT,
                    `${node.name!.getText()} - ${methodName}`
                )
            }
        })
    }

    private checkClassStaticMethodsWithoutConstructor(node: ts.ClassDeclaration) {
        const staticMethods = node.members.filter(member => ts.isMethodDeclaration(member) && isStatic(member.modifiers));
        if (staticMethods.length > 0 && !node.members.find(ts.isConstructorDeclaration)) {
            this.report(
                node,
                LinterError.STATIC_METHODS_WITHOUT_CONSTRUCTOR,
                `Class ${identName(node)} with static methods [${staticMethods.map(identName).join(", ")}] but without a constructor`
            )
        }
    }

    private getMethodsTypes(node: ts.ClassDeclaration): Map<string, ts.FunctionTypeNode> {
        const map = new Map()
        node.members
            .filter(ts.isMethodDeclaration)
            .forEach(it =>
                map.set(
                    it.name.getText(),
                    ts.factory.createFunctionTypeNode(
                        undefined,
                        it.parameters,
                        it.type!
                    )
                )
            )
        return map
    }

    /*
        ts.typechecker doesn't provide the functionality to check if type1 satisfies type2,
        so we'll implement it for functional types, by comparing recursively number of parameters

        currently, this one's needed only to report ScrollAttribute
     */
    private satisfies(
        subtypeFunction: ts.FunctionTypeNode,
        supertypeFunction: ts.FunctionTypeNode
    ): boolean {
        if (subtypeFunction.parameters.length != supertypeFunction.parameters.length) return false

        return zip(subtypeFunction.parameters, supertypeFunction.parameters)
            .every(([subtypeParam, supertypeParam]) => {
                const subtype = this.followDeclarationFunctionalType(subtypeParam.type!)
                if (subtype === undefined) return true
                const supertype = this.followDeclarationFunctionalType(supertypeParam.type!)
                if (supertype === undefined) return true

                return this.satisfies(subtype, supertype);
            })
    }

    private followDeclarationFunctionalType(node: ts.TypeNode): ts.FunctionTypeNode | undefined {
        if (ts.isFunctionTypeNode(node)) return node
        if (!ts.isTypeReferenceNode(node)) return undefined

        const declaredType = getDeclarationsByNode(this.typeChecker, node.typeName)
            .find(ts.isTypeAliasDeclaration)
            ?.type

        return declaredType && ts.isFunctionTypeNode(declaredType)
            ? declaredType
            : undefined
    }

    private checkOverloads(node: ts.InterfaceDeclaration | ts.ClassDeclaration) {
        const set = new Set<string>()

        const perMethod = (it: string) => {
            if (set.has(it)) {
                this.report(
                    node,
                    LinterError.METHOD_OVERLOADING,
                    `Method overloaded: ${it}`
                )
            }
            set.add(it)
        }

        if (ts.isClassDeclaration(node)) {
            node.members
                .filter(ts.isMethodDeclaration)
                .map(it => it.name.getText())
                .forEach(perMethod)
        }
        if (ts.isInterfaceDeclaration(node)) {
            node.members
                .filter(ts.isMethodSignature)
                .map(it => it.name.getText())
                .forEach(perMethod)
        }
    }

    private checkEmpty(node: ts.InterfaceDeclaration | ts.ClassDeclaration) {
        if (node.heritageClauses === undefined && node.members.length === 0 && !isAbstract(node.modifiers)) {
            this.report(
                node,
                LinterError.EMPTY_DECLARATION,
                `Empty class or interface declaration ${node.name?.getText() ?? ""}`
            )
        }
    }

    private interfaceOrClassChecks(node: ts.InterfaceDeclaration | ts.ClassDeclaration) {
        this.checkEmpty(node)
        this.checkOverloads(node)
    }
}

function updateHistogram(message: LinterMessage, histogram: Map<LinterError, number>): LinterMessage {
    histogram.set(message.error, (histogram.get(message.error) ?? 0) + 1)
    return message
}

function printHistogram(histogram: Map<LinterError, number>): string {
    let sorted = Array.from(histogram.entries()).sort((a, b) => b[1] - a[1])
    return sorted.map(it => `${LinterError[it[0]]}: ${it[1]}`).join("\n")
}

function findEnumDFS(type: ts.TypeNode, typeChecker: ts.TypeChecker): ts.EnumDeclaration | undefined {
    if (ts.isTypeReferenceNode(type)) {
        for (const decl of getDeclarationsByNode(typeChecker, type.typeName)) {
            if (ts.isEnumDeclaration(decl)) {
                return decl
            }
            if (ts.isTypeAliasDeclaration(decl)) {
                return findEnumDFS(decl.type, typeChecker)
            }
        }
    }
    return undefined
}

function findEnumType(types: ts.NodeArray<ts.TypeNode>, typeChecker: ts.TypeChecker): ts.EnumDeclaration | undefined {
    for (const type of types) {
        const enumType = findEnumDFS(type, typeChecker)
        if (enumType != undefined) {
            return enumType
        }
    }
    return undefined
}

export function toLinterString(
    allEntries: Array<LinterMessage[]>,
    suppressErrors: string | undefined,
    whitelistFile: string | undefined,
): [string, number, string] {
    const suppressedErrorsSet = new Set<LinterError>()
    if (suppressErrors) {
        suppressErrors.split(",").forEach(it => suppressedErrorsSet.add(Number(it) as LinterError))
    }
    let whitelist: LinterWhitelist | undefined = undefined
    if (whitelistFile) {
        whitelist = new LinterWhitelist(whitelistFile)
    }
    let histogram = new Map<LinterError, number>()
    let errors = allEntries
        .flatMap(entries =>
            entries
                .filter(it => !suppressedErrorsSet.has(it.error))
                .filter(it => whitelist ? !whitelist.shallSuppress(it) : true)
                .map(it => updateHistogram(it, histogram))
                .map(stringMessage)
        )
        .filter(element => (element?.length ?? 0) > 0)
    return [errors.join("\n"), errors.length > 0 ? 1 : 0, printHistogram(histogram)]
}
