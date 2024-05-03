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
import { asString, nameOrNullForIdl as nameOrUndefined, getDeclarationsByNode } from "./util"
import { GenericVisitor } from "./options"
import {randInt, randString, pick, pickArray} from "./rand_utils";

const LAMBDA = "LAMBDA"

export class TestGeneratorVisitor implements GenericVisitor<string[]> {
    private interfacesToTest = new Set<string>()
    private methodsToTest = new Set<string>()
    private propertiesToTest = new Set<string>()

    constructor(private sourceFile: ts.SourceFile, private typeChecker: ts.TypeChecker,
        interfacesToTest: string| undefined,
        methodsToTest: string| undefined,
        propertiesToTest: string| undefined) {
            interfacesToTest?.split(",")?.map(it => this.interfacesToTest.add(`${it}Attribute`))
            methodsToTest?.split(",")?.map(it => this.methodsToTest.add(it))
            propertiesToTest?.split(",")?.map(it => this.propertiesToTest.add(it))
    }

    private output: string[] = []

    visitWholeFile(): string[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.output
    }

    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node)) {
            this.testClass(node)
        } else if (ts.isInterfaceDeclaration(node)) {
            this.testInterface(node)
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, (node) => this.visit(node));
        }
    }

    testClass(node: ts.ClassDeclaration) {
        if (this.interfacesToTest.size > 0 && !this.interfacesToTest.has(nameOrUndefined(node.name)!)) return
        this.prologue(node.name!)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.testConstructor(child)
            } else if (ts.isMethodDeclaration(child)) {
                this.testMethod(child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.testProperty(child)
            }
        })
        this.epilogue(node.name!)
    }

    testInterface(node: ts.InterfaceDeclaration) {
        if (this.interfacesToTest.size > 0 && !this.interfacesToTest.has(nameOrUndefined(node.name)!)) return
        this.prologue(node.name!)
        let members = this.membersWithFakeOverrides(node)
        members.forEach(child => {
            if (ts.isConstructSignatureDeclaration(child)) {
                this.testConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.testMethod(child)
            } else if (ts.isPropertySignature(child)) {
                this.testProperty(child)
            }
        })
        this.epilogue(node.name!)
    }

    testConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
        if (this.methodsToTest.size > 0 && !this.methodsToTest.has("constructor")) return
    }

    testMethod(method: ts.MethodDeclaration | ts.MethodSignature) {
        if (this.methodsToTest.size > 0 && !this.methodsToTest.has(nameOrUndefined(method.name)!)) return

        this.generateArgs(method).forEach(args => {
            let methodName = nameOrUndefined(method.name)

            // Handle Lambda
            let passedArgs = args.replaceAll(LAMBDA, `() => {}`)
            let expectedArgs = args.replaceAll(LAMBDA, `"Function 42"`)

            let golden = `${methodName}(${expectedArgs})`
            this.output.push(`  checkResult("${methodName}", () => peer.${methodName}Attribute(${passedArgs}), \`${golden}\`)`)
        })
    }

    generateArgs(method: ts.MethodDeclaration | ts.MethodSignature): string[] {
        let args = method.parameters.map(it => this.generateArg(it))
        if (args.find(it => it === undefined)) {
            console.log("Cannot map some argument")
            return []
        }
        return pick(method.parameters.map(it => it), key => this.generateArg(key))
    }

    generateArg(param: ts.ParameterDeclaration): string[] {
        return this.generateValueOfType(param.type!)
    }

    generateValueOfType(type: ts.TypeNode): string[] {
        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return ["undefined"]
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return ["null"]
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return [`0`, `-1`, `${randInt(2048, -1024)}`, `-0.59`, `93.54`]
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return ['""',`"${randString(randInt(16))}"`]
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return ["false", "true"]
        }
        if (ts.isTypeReferenceNode(type)) {
            let name = type.typeName
            if (!ts.isIdentifier(name)) {
                console.log(`${asString(name)} is not identifier`)
                return []
            }
            let decls = getDeclarationsByNode(this.typeChecker, name)
            if (decls) {
                let decl = decls[0]
                if (decl && ts.isEnumDeclaration(decl)) {
                    // TBD: Use enum constants
                    // let name = decl.name
                    // ${nameOrUndefined(name)}.${nameOrUndefined(it.name)!}
                    return decl.members.map((it, index) => `${index}`)
                }
                if (decl && ts.isTypeAliasDeclaration(decl)) {
                    return this.generateValueOfType(decl.type)
                }
                if (decl && ts.isInterfaceDeclaration(decl)) {

                    let interfaceName = asString(name)
                    // Array from built-in
                    if (interfaceName === "Array") {
                        return type.typeArguments ? pickArray(this.generateValueOfType(type.typeArguments[0])) : []
                    }
                    // Optional from stdlib.d.ts
                    if (interfaceName === "Optional") {
                        if (type.typeArguments) {
                            let argType = type.typeArguments[0]
                            if (ts.isTypeNode(argType)) {
                                return [`undefined`, ...this.generateValueOfType(argType)]
                            }
                        }
                        return [`undefined`]
                    }

                    return pick(decl.members.filter(ts.isPropertySignature), (key) =>
                        this.generateValueOfType(key.type!)
                            .map(it => `${nameOrUndefined(key.name)}: ${it}`))
                        .map(it => `{${it}}`)
                }
                if (decl && ts.isClassDeclaration(decl)) {

                    let className = nameOrUndefined(decl.name)
                    console.log(`class: ${nameOrUndefined(decl.name)}`)
                    decl.members.forEach(it => console.log(`class member: ${nameOrUndefined(it.name)}`))

                    let consturctors = decl.members.filter(ts.isConstructorDeclaration)
                    if (consturctors.length > 0) {
                        let constructor = consturctors[randInt(consturctors.length)]
                        constructor.parameters.forEach(it => {console.log(`constructor param: ${nameOrUndefined(it.name)}`)})

                        // TBD: add imports for classes with constructors
                        /*
                        return pick(constructor.parameters.map (it => it), (key) =>
                            this.generateValueOfType(key.type!)
                                .map(it => `${it}`)) // TBD: Use generated class
                                // .map(it => `${nameOrUndefined(key.name)}: ${it}`))
                            .map(it => `new ${className}(${it})`) // TBD: Use generated class
                            // .map(it => `{${it}}`)
                        */
                       return []
                    }


                    return pick(decl.members.filter(ts.isPropertyDeclaration), (key) =>
                        this.generateValueOfType(key.type!)
                            .map(it => `${nameOrUndefined(key.name)}: ${it}`))
                        .map(it => `{${it}}`)
                }
                console.log(`Cannot create value of type ${asString(type)}`)
                return []
            }
        }
        if (ts.isOptionalTypeNode(type)) {
            return [`undefined`, ...this.generateValueOfType(type.type)]
        }
        if (ts.isUnionTypeNode(type)) {
            return type.types.flatMap(it => this.generateValueOfType(it))
        }
        if (ts.isArrayTypeNode(type)) {
            return pickArray(this.generateValueOfType(type.elementType))
        }
        if (ts.isLiteralTypeNode(type)) {
            let literal = type.literal
            if (ts.isStringLiteral(literal)) return [`${literal.getText(this.sourceFile)}`]
            console.log(`Cannot create value of literal type ${asString(literal)}`)
            return []
        }
        if (ts.isTupleTypeNode(type)) {
            // return [`[${type.elements.map(it => this.generateValueOfType(it)).join(",")}]`]
            return pick(type.elements.map(it => it), (key) =>
                this.generateValueOfType(key))
                .map(it => `[${it}]`)
        }
        if (ts.isFunctionTypeNode(type)) {
            // TODO: be smarter here
            return [`${LAMBDA}`]
        }
        if (ts.isTypeLiteralNode(type)) {
            // TODO: be smarter here
            return pick(type.members.filter(ts.isPropertySignature), (key) =>
                this.generateValueOfType(key.type!).map(it => `${nameOrUndefined(key.name)}: ${it}`))
                .map(it => `{${it}}`)
        }
        console.log(`Cannot create value of type ${asString(type)}`)
        return []
    }

    testProperty(property: ts.PropertyDeclaration | ts.PropertySignature) {
        if (this.methodsToTest.size > 0 && !this.methodsToTest.has(nameOrUndefined(property.name)!)) return
        console.log(`test prop ${nameOrUndefined(property.name)!}`)
    }

    getClassName(name: ts.Identifier) : string {
        const clazzName = nameOrUndefined(name)!
        return clazzName.endsWith("Attribute") ? clazzName.replace("Attribute", "") : clazzName
    }

    prologue(name: ts.Identifier) {
        let clazzName = this.getClassName(name)!
        this.output.push(`import { Ark${clazzName}Peer } from "@arkoala/arkui/Ark${clazzName}Peer"`)
        this.output.push(``)
        this.output.push(`function check${clazzName}() {`)
        this.output.push(`  let peer = new Ark${clazzName}Peer(ArkUINodeType.${clazzName})`)
    }

    epilogue(name: ts.Identifier) {
        let clazzName = this.getClassName(name)!
        this.output.push(`}`)
        this.output.push(`check${clazzName}()`)
        this.output.push(`\n`)
    }

    membersWithFakeOverrides(node: ts.InterfaceDeclaration): ts.TypeElement[] {
        const result: ts.TypeElement[] = []
        const worklist: ts.InterfaceDeclaration[] = [node]
        const overridden = new Set<string>()
        while (worklist.length != 0) {
            const next = worklist.shift()!
            const fakeOverrides = this.filterNotOverridden(overridden, next)
            fakeOverrides
                .map(it => nameOrUndefined(it.name))
                .forEach(it => it ? overridden.add(it) : undefined)
            result.push(...fakeOverrides)
            const bases = next.heritageClauses
                ?.flatMap(it => this.baseDeclarations(it))
                ?.filter(it => ts.isInterfaceDeclaration(it)) as ts.InterfaceDeclaration[]
                ?? []
            worklist.push(...bases)
        }
        return result
    }

    filterNotOverridden(overridden: Set<string>, node: ts.InterfaceDeclaration): ts.TypeElement[] {
        return node.members.filter(it =>
            it.name && ts.isIdentifier(it.name) && !overridden.has(ts.idText(it.name))
        )
    }

    baseDeclarations(heritage: ts.HeritageClause): ts.Declaration[] {
        return this.heritageIdentifiers(heritage)
            .map(it => getDeclarationsByNode(this.typeChecker, it)[0])
            .filter(it => !!it)
    }

    heritageIdentifiers(heritage: ts.HeritageClause): ts.Identifier[] {
        return heritage.types.map(it => {
            return ts.isIdentifier(it.expression) ? it.expression : undefined
        }).filter(it => !!it) as ts.Identifier[]
    }
}
