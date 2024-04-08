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
import {randInt, randString} from "./rand_utils";

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
        this.output.push(`  console.log(\`${nameOrUndefined(method.name)}(${this.generateArgs(method)})\`)`)
        this.output.push(`  peer.${nameOrUndefined(method.name)}(${this.generateArgs(method)})`)
    }

    generateArgs(method: ts.MethodDeclaration | ts.MethodSignature): string | undefined {
        let args = method.parameters.map(it => this.generateArg(it))
        if (args.find(it => it === undefined)) {
            console.log("Cannot map some argument")
            return undefined
        }
        return args.join(",")
    }

    generateArg(param: ts.ParameterDeclaration): string | undefined {
        return this.generateValueOfType(param.type!)
    }

    generateValueOfType(type: ts.TypeNode): string|undefined {
        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return "undefined"
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return "null"
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return `${randInt(2048, -1024)}`
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return `"${randString(randInt(16))}"`
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return Math.random() < 0.5 ? "false" : "true"
        }
        if (ts.isTypeReferenceNode(type)) {
            let name = type.typeName
            if (!ts.isIdentifier(name)) {
                console.log(`${asString(name)} is not identifier`)
                return undefined
            }
            let decls = getDeclarationsByNode(this.typeChecker, name)
            if (decls) {
                let decl = decls[0]
                if (decl && ts.isEnumDeclaration(decl)) {
                    // TBD: Use enum constants
                    // return `${nameOrUndefined(decl.name)}.${nameOrUndefined(decl.members[0].name)!}`
                    return `${randInt(decl.members.length)}`
                }
                if (decl && ts.isTypeAliasDeclaration(decl)) {
                    return `${this.generateValueOfType(decl.type)}`
                }
                if (decl && ts.isInterfaceDeclaration(decl)) {
                    return `{${decl.members
                        .filter(ts.isPropertySignature)
                        .map(it => nameOrUndefined(it.name) + ":" + this.generateValueOfType(it.type!))
                        .join(", ")}}`
                }
                if (decl && ts.isClassDeclaration(decl)) {
                    // TODO: logic to find proper way to instantiate class
                    return `undefined`
                }
                console.log(`Cannot create value of type ${asString(type)}`)
                return undefined
            }
        }
        if (ts.isUnionTypeNode(type)) {
            return this.generateValueOfType(type.types[0])
        }
        if (ts.isLiteralTypeNode(type)) {
            let literal = type.literal
            if (ts.isStringLiteral(literal)) return `${literal.getText(this.sourceFile)}`
            console.log(`Cannot create value of literal type ${asString(literal)}`)
            return undefined
        }
        if (ts.isTupleTypeNode(type)) {
            return `[${type.elements.map(it => this.generateValueOfType(it)).join(",")}]`
        }
        if (ts.isFunctionTypeNode(type)) {
            // TODO: be smarter here
            return "() => {}"
        }
        if (ts.isTypeLiteralNode(type)) {
            // TODO: be smarter here
            return `{${type.members
                .filter(ts.isPropertySignature)
                .map(it => nameOrUndefined(it.name) + ":" + this.generateValueOfType(it.type!))
                .join(", ")}}`
        }
        console.log(`Cannot create value of type ${asString(type)}`)
        return undefined
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
        this.output.push(`  console.log("call ${clazzName} peer")`)
        this.output.push(`  let peer = new Ark${clazzName}Peer()`)
    }

    epilogue(name: ts.Identifier) {
        let clazzName = this.getClassName(name)!
        this.output.push(`  console.log("\\n")`)
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
