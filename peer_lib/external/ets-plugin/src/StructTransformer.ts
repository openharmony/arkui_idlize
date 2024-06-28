/*
 * Copyright (c) 2022-2024 Huawei Device Co., Ltd.
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

import * as ts from 'ohos-typescript'
import { AbstractVisitor } from './AbstractVisitor'
import { CallExpressionCollector } from './CallExpressionCollector'
import { EntryTracker } from './EntryTracker'
import { Importer, isOhosImport } from './Importer'
import { adaptorClassName, adaptorComponentName, adaptorEtsName, adaptorEtsParameterName, asString, backingField, backingFieldName, CallTable, collect, consumeVariableName, contextLocalStateOf, createConsumeInitializerField, createProvideInitializerField, customDialogImplName, deduceConsumeName, deduceProvideName, dropBuilder, EntryDecorator, filterConsumes, filterDecorators, filterDefined, filterModifiers, filterProvides, hasLocalDeclaration, initializers, isBuilderLambdaCall, isBuiltinComponentName, isGlobalBuilder, isState, isStructCall, LocalStoragePropertyName, mangleIfBuild, NameTable, prependDoubleLineMemoComment, prependMemoComment, provideVariableName, RewriteNames, voidLambdaType, WatchDecorator } from './utils'
import { BuilderParam, classifyProperty, ClassState, PropertyTranslator } from './PropertyTranslators'
import { Any, assignment, createThisFieldAccess, Export, findDecoratorArguments, findDecoratorLiterals, getDeclarationsByNode, hasDecorator, id, isKnownIdentifier, isUndefined, optionalParameter, orUndefined, parameter, partial, Private, provideAnyTypeIfNone, Undefined, undefinedValue, Void } from './ApiUtils'

function parameterNameIdentifier(name: ts.LeftHandSideExpression): ts.Identifier {
    if (ts.isIdentifier(name)) {
        const newName = adaptorEtsParameterName(name)
        return newName
    } else {
        throw new Error("expected ETS name to be an Identifier, got: " + ts.SyntaxKind[name.kind])
    }
}

export class StructTransformer extends AbstractVisitor {
    private printer = ts.createPrinter({ removeComments: false })
    constructor(
        sourceFile: ts.SourceFile,
        ctx: ts.TransformationContext,
        public typechecker: ts.TypeChecker,
        public importer: Importer,
        public nameTable: NameTable,
        public entryTracker: EntryTracker,
        public callTable: CallTable
    ) {
        super(sourceFile, ctx)
        this.importer.addAdaptorImport(adaptorComponentName("PageTransitionEnter"))
        this.importer.addAdaptorImport(adaptorComponentName("PageTransitionExit"))
    }

    dropImportEtsExtension(node: ts.ImportDeclaration, oldLiteral: string): ts.ImportDeclaration {
        if (!oldLiteral.endsWith(".ets")) return node
        const newLiteral = oldLiteral.substring(0, oldLiteral.length - 4)
        return ts.factory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(newLiteral),
            undefined
        )
    }

    translateImportDeclaration(node: ts.ImportDeclaration): ts.ImportDeclaration {
        const oldModuleSpecifier = node.moduleSpecifier
        if (!ts.isStringLiteral(oldModuleSpecifier)) return node
        const oldLiteral = oldModuleSpecifier.text

        if (isOhosImport(oldLiteral)) {
            const oldDefaultName = node.importClause!.name ? ts.idText(node.importClause!.name) : ""
            return this.importer.translateOhosImport(node, oldLiteral, oldDefaultName)
        }

        return this.dropImportEtsExtension(node, oldLiteral)
    }

    emitStartApplicationBody(name: string): ts.Block {
        return ts.factory.createBlock(
            [ts.factory.createReturnStatement(ts.factory.createCallExpression(
                id(name),
                undefined,
                []
            ))],
            true
        )
    }

    emitStartApplicationDeclaration(name: string): ts.Statement {
        const koalaEntry = ts.factory.createFunctionDeclaration(
            [],
            [Export()],
            undefined,
            id("KoalaEntry"),
            undefined,
            [],
            undefined,
            this.emitStartApplicationBody(name)
        )
        prependMemoComment(koalaEntry)
        return koalaEntry
    }

    entryCode: ts.Statement[] = []
    entryFile: string | undefined = undefined
    prepareEntryCode(name: string) {
        this.entryCode = [
            this.emitStartApplicationDeclaration(name),
        ]
        this.entryFile = this.sourceFile.fileName
    }
    findContextLocalState(name: string, type: ts.TypeNode | undefined): ts.Expression {
        const state = ts.factory.createCallExpression(
            id(this.importer.withRuntimeImport("contextLocal")),
            type ? [type] : undefined,
            [ts.factory.createStringLiteral(name)]
        )
        return ts.factory.createAsExpression(
            state,
            ts.factory.createTypeReferenceNode(
                id("MutableState"),
                [type!]
            )
        )
    }

    createConsumeState(consume: ts.PropertyDeclaration): ts.Statement {
        if (!ts.isIdentifier(consume.name) && !ts.isPrivateIdentifier(consume.name)) {
            throw new Error("Expected an identifier")
        }

        return ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList([
                ts.factory.createVariableDeclaration(
                    consumeVariableName(consume),
                    undefined,
                    undefined,
                    this.findContextLocalState(deduceConsumeName(consume), consume.type)
                )
            ],
                ts.NodeFlags.Const
            )
        )
    }

    createProvideState(provide: ts.PropertyDeclaration): ts.Statement {
        this.importer.addAdaptorImport("contextLocalStateOf")

        if (!ts.isIdentifier(provide.name) && !ts.isPrivateIdentifier(provide.name)) {
            throw new Error("Expected an identifier")
        }
        if (!provide.initializer) {
            throw new Error("Expected an initialization for @Provide " + deduceProvideName(provide))
        }
        return ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList([
                ts.factory.createVariableDeclaration(
                    provideVariableName(provide),
                    undefined,
                    undefined,
                    contextLocalStateOf(deduceProvideName(provide), provide.initializer!, provide.type)
                )
            ],
                ts.NodeFlags.Const
            )
        )
    }

    createBuildProlog(
        structNode: ts.StructDeclaration,
        members?: ts.NodeArray<ts.ClassElement>,
        propertyTranslators?: PropertyTranslator[],
    ): ts.MethodDeclaration|undefined {

        const propertyInitializationProcessors = propertyTranslators ?
            filterDefined(propertyTranslators.map(it => it.translateToUpdate())) :
            undefined

        const watchHandlers = members ? this.translateWatchDecorators(members) : undefined

        if (!propertyInitializationProcessors?.length &&
            !watchHandlers?.length
        ) return undefined

        const body = ts.factory.createBlock(
            collect(
                propertyInitializationProcessors,
                watchHandlers,
            ),
            true
        )

        const className = adaptorClassName(structNode.name!)!

        const method = ts.factory.createMethodDeclaration(
            undefined,
            undefined,
            undefined,
            id(RewriteNames.UpdateStruct),
            undefined,
            undefined,
            [
                parameter(initializers(), orUndefined(partial(className)))
            ],
            Void(),
            body
        )

        return prependMemoComment(method)
    }

    private createThisMethodCall(name: string | ts.Identifier | ts.PrivateIdentifier, args?: ReadonlyArray<ts.Expression>): ts.Expression {
        return ts.factory.createCallChain(
            createThisFieldAccess(name),
            undefined,
            undefined,
            args
        )
    }

    private createWatchCall(name: string): ts.Statement {
        return ts.factory.createExpressionStatement(this.createThisMethodCall(name))
    }

    translateWatchDecorators(members?: ts.NodeArray<ts.ClassElement>): ts.Statement[] {
        const statements: ts.Statement[] = []
        if (members && members.length) {
            for (const property of members) {
                if (ts.isPropertyDeclaration(property)) {
                    if (ts.isIdentifier(property.name) || ts.isPrivateIdentifier(property.name)) {
                        const name = ts.idText(property.name)
                        const watches = findDecoratorLiterals(filterDecorators(property), WatchDecorator, 0)
                        if (watches && watches.length) statements.push(
                            ts.factory.createExpressionStatement(
                                ts.factory.createCallExpression(
                                    id(this.importer.withRuntimeImport("OnChange")),
                                    undefined,
                                    [
                                        createThisFieldAccess(name),
                                        ts.factory.createArrowFunction(
                                            undefined,
                                            undefined,
                                            [],
                                            undefined,
                                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                                            watches.length == 1
                                                ? this.createThisMethodCall(watches[0])
                                                : ts.factory.createBlock(watches.map(it => this.createWatchCall(it)))
                                        ),
                                    ]
                                )
                            )
                        )
                    }
                }
            }
        }
        return statements
    }

    translateBuilder(structure: ts.StructDeclaration, propertyTranslators: PropertyTranslator[], member: ts.ClassElement, isMainBuild: boolean): ts.MethodDeclaration {
        if (!ts.isMethodDeclaration(member)) {
            throw new Error("Expected member declaration, got: " + ts.SyntaxKind[member.kind])
        }

        const className = adaptorClassName(structure.name!)!

        const stateParameters = isMainBuild ? [
            prependDoubleLineMemoComment(
                parameter(
                    "builder",
                    orUndefined(
                        ts.factory.createFunctionTypeNode(
                            undefined,
                            [
                                parameter(
                                    id("instance"),
                                    ts.factory.createTypeReferenceNode(className),
                                )
                            ],
                            Void()
                        )
                    )
                )
            )
        ] : []

        const newMethod = ts.factory.updateMethodDeclaration(
            member,
            dropBuilder(member.modifiers),
            member.asteriskToken,
            mangleIfBuild(member.name),
            member.questionToken,
            member.typeParameters,
            [
                ...stateParameters,
                ...member.parameters
            ],
            member.type,
            member.body
        )
        return prependMemoComment(newMethod)
    }

    translateGlobalBuilder(func: ts.FunctionDeclaration): ts.FunctionDeclaration {
        const newFunction = ts.factory.createFunctionDeclaration(
            dropBuilder(func.modifiers),
            func.asteriskToken,
            func.name,
            func.typeParameters,
            func.parameters.map(it => provideAnyTypeIfNone(it)),
            func.type,
            func.body
        )
        return prependMemoComment(newFunction)
    }

    translateMemberFunction(method: ts.MethodDeclaration): ts.MethodDeclaration {
        // TODO: nothing for now?
        return method
    }

    translateStructMembers(structNode: ts.StructDeclaration, propertyTranslators: PropertyTranslator[]): ts.ClassElement[] {
        const propertyMembers = propertyTranslators.map(translator =>
            translator.translateMember()

        )
        const updateStruct = this.createBuildProlog(structNode, structNode.members, propertyTranslators)

        // The rest of the struct members are translated here directly.
        const restMembers = structNode.members.map(member => {
            if (isKnownIdentifier(member.name, "build")) {
                return this.translateBuilder(structNode, propertyTranslators, member, true)
            } else if (hasDecorator(member, "Builder")) {
                return this.translateBuilder(structNode, propertyTranslators, member, false)
            } else if (isKnownIdentifier(member.name, "pageTransition")) {
                return prependMemoComment(member)
            } else if (ts.isMethodDeclaration(member)) {
                return this.translateMemberFunction(member)
            }
            return []
        }).flat()
        return collect(
            ...propertyMembers,
            updateStruct,
            ...restMembers
        )
    }

    translateComponentName(name: ts.Identifier | undefined): ts.Identifier | undefined {
        if (!name) return undefined
        // return id(adaptorName(ts.idText(name)))
        return id(ts.idText(name))
    }

    /**
     * @param name - a unique state name
     * @returns a statement to initialize a context local state with new map
     */
    contextLocalStateMap(name: string): ts.Statement {
        this.importer.addAdaptorImport("contextLocalStateOf")
        return ts.factory.createExpressionStatement(contextLocalStateOf(name, ts.factory.createNewExpression(
            id("Map"),
            undefined,
            []
        )))
    }

    /**
     * @param source - a node to find named call expressions
     * @returns an array of statements corresponding to the found expressions
     */
    collectContextLocals(source: ts.Node): ts.Statement[] {
        const statements: ts.Statement[] = []
        const collector = new CallExpressionCollector(this.sourceFile, this.ctx,
            "ArkRadio",
            "ArkCheckbox",
            "ArkCheckboxGroup",
        )
        collector.visitor(source)
        if (collector.isVisited("ArkRadio")) {
            statements.push(this.contextLocalStateMap("contextLocalMapOfRadioGroups"))
        }
        if (collector.isVisited("ArkCheckbox") || collector.isVisited("ArkCheckboxGroup")) {
            statements.push(this.contextLocalStateMap("contextLocalMapOfCheckboxGroups"))
        }
        return statements
    }

    topLevelMemoFunctions: ts.FunctionDeclaration[] = []
    topLevelInitialization: ts.Statement[] = []

    createTopLevelMemo(node: ts.StructDeclaration, impl: boolean): ts.FunctionDeclaration {
        const className = this.translateComponentName(adaptorClassName(node.name))!
        const functionName = impl ? customDialogImplName(node.name) : node.name

        const factory = ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createNewExpression(
                className,
                undefined,
                undefined
            )
        )

        const provideVariables = filterProvides(node.members).map(it => this.createProvideState(it))
        const consumeVariables = filterConsumes(node.members).map(it => this.createConsumeState(it))
        const contextLocals = this.collectContextLocals(node)

        const additionalStatements = [
            ...provideVariables,
            ...consumeVariables,
            ...contextLocals,
        ]

        const provides = filterProvides(node.members).map(it => createProvideInitializerField(it))
        const consumes = filterConsumes(node.members).map(it => createConsumeInitializerField(it))
        const updatedInitializers = (provides.length != 0 || consumes.length != 0) ?
            ts.factory.createObjectLiteralExpression(
                [
                    ...provides,
                    ...consumes,
                    ts.factory.createSpreadAssignment(initializers()),
                ],
                true
            ) :
            initializers()


        const callInstantiate = ts.factory.createReturnStatement(
            ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                    className,
                    id("_instantiate")
            ),
            undefined,
            [
                impl ? undefinedValue() : id("style"),
                factory,
                impl ? undefinedValue() : id("content"),
                updatedInitializers
            ]
          ))

        const memoFunction = ts.factory.createFunctionDeclaration(
            [Export()],
            undefined,
            functionName,
            undefined,
            impl ? [
                optionalParameter(
                    initializers(),
                    partial(className),
                )
            ]:
            [
                optionalParameter(
                    "style",
                    Any(),
                ),
                prependDoubleLineMemoComment(
                    optionalParameter(
                        "content",
                        voidLambdaType(),
                    )
                ),
                optionalParameter(
                    initializers(),
                    partial(className),
                )
            ],
            ts.factory.createTypeReferenceNode(className),
            ts.factory.createBlock(
                [
                    ...additionalStatements,
                    callInstantiate
                ],
                true
            )
        )

        return prependMemoComment(memoFunction)
    }

    /*
    Creates something like:
        export function DialogExample(initializer: any = {}) {
            return { build: bindCustomDialog(DialogExampleImpl, initializer), buildOptions: initializer };
        }
    */
    createCustomDialogConstructor(node: ts.StructDeclaration) {
        return ts.factory.createFunctionDeclaration(
            undefined,
            [Export()],
            undefined,
            node.name,
            undefined,
            [
                parameter(
                    id("initializer"),
                    Any(),
                    ts.factory.createObjectLiteralExpression()
                )
            ],
            undefined,
            ts.factory.createBlock(
                [
                    ts.factory.createReturnStatement(
                        ts.factory.createObjectLiteralExpression([
                            ts.factory.createPropertyAssignment("build",
                                ts.factory.createCallExpression(
                                    id(this.importer.withAdaptorImport("bindCustomDialog")),
                                    undefined,
                                    [
                                        customDialogImplName(node.name)!,
                                        id("initializer")
                                    ]
                                )
                            ),
                            ts.factory.createPropertyAssignment("buildOptions",
                                id("initializer"))
                        ])
                    )
                ],
                true
            )
        )

    }

    createInitializerMethod(
        className: ts.Identifier,
        propertyTranslators: PropertyTranslator[]
    ): ts.MethodDeclaration {
        const parameters = [
            prependDoubleLineMemoComment(
                optionalParameter(
                    "content",
                    voidLambdaType(),
                )
            ),
            optionalParameter(
                initializers(),
                partial(className),
            )
        ]
        const initializations = filterDefined(
            propertyTranslators.map(it => it.translateToInitialization())
        )
        const buildParams = propertyTranslators.filter(it => it instanceof BuilderParam)
        if (buildParams.length > 0) {
            const field = createThisFieldAccess(backingField(buildParams[0].propertyName))
            initializations.push(ts.factory.createIfStatement(
                ts.factory.createBinaryExpression(
                    ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, field),
                    ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                    id("content")
                ),
                assignment(field, id("content"))
            ))
        }

        return ts.factory.createMethodDeclaration(
            undefined,
            undefined,
            RewriteNames.InitializeStruct,
            undefined,
            undefined,
            parameters,
            Void(),
            ts.factory.createBlock(initializations, true)
        )
    }

    createTopLevelInitialization(node: ts.StructDeclaration): ts.ExpressionStatement {
        const routerPage = this.entryTracker.sourceFileToRoute(this.sourceFile)
        return ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
                id(this.importer.withOhosImport("ohos.router", "registerArkuiEntry")),
                undefined,
                [
                    id(ts.idText(node.name!)),
                    ts.factory.createStringLiteral(routerPage),
                ]
            )
        )
    }

    createEntryPointAlias(node: ts.StructDeclaration): ts.Statement {
        return ts.factory.createVariableStatement(
            [Export()],
            ts.factory.createVariableDeclarationList(
                [
                    ts.factory.createVariableDeclaration(
                        id("__Entry"),
                        undefined,
                        undefined,
                        id(ts.idText(node.name!)
                        )
                    )
                ],
                ts.NodeFlags.Const
            )
        )
    }

    translateStructToClass(node: ts.StructDeclaration): ts.ClassDeclaration {
        const className = this.translateComponentName(adaptorClassName(node.name)) // TODO make me string for proper reuse
        const baseClassName = this.importer.withAdaptorImport("ArkStructBase")

        let entryLocalStorage: ts.Expression | undefined = undefined

        if (hasDecorator(node, "CustomDialog")) {
            this.topLevelMemoFunctions.push(
                this.createTopLevelMemo(node, true),
                this.createCustomDialogConstructor(node)
            )
        } else {
            this.topLevelMemoFunctions.push(
                this.createTopLevelMemo(node, false)
            )
        }

        if (hasDecorator(node, EntryDecorator)) {
            this.topLevelInitialization.push(
                this.createTopLevelInitialization(node),
                this.createEntryPointAlias(node)
            )
            const args = findDecoratorArguments(filterDecorators(node), EntryDecorator, 0)
            switch (args?.length) {
                case 0:
                    break
                case 1:
                    entryLocalStorage = args[0]
                    break
                default:
                    throw new Error("Entry must have only one name, but got " + args?.length)
            }

            if (!node.name) throw new Error("Expected @Entry struct to have a name")
            this.entryTracker.addEntry(ts.idText(node.name), this.sourceFile)
        }

        const inheritance = ts.factory.createHeritageClause(
            ts.SyntaxKind.ExtendsKeyword,
            [ts.factory.createExpressionWithTypeArguments(
                id(baseClassName),
                [
                    ts.factory.createTypeReferenceNode(
                        adaptorComponentName(ts.idText(node.name!)),
                    )
                ]
            )]
        )

        const entryLocalStorageProperty = ts.factory.createPropertyDeclaration(
            undefined,
            [Private()],
            LocalStoragePropertyName,
            undefined,
            undefined,
            entryLocalStorage ?? ts.factory.createNewExpression(
                id(this.importer.withAdaptorImport("LocalStorage")),
                undefined,
                []
            )
        )

        const propertyTranslators = filterDefined(
            node.members.map(it => classifyProperty(it, this.importer, this.typechecker))
        )

        const translatedMembers = this.translateStructMembers(node, propertyTranslators)

        const createdClass = ts.factory.createClassDeclaration(
            filterModifiers(node),
            className,
            node.typeParameters,
            [inheritance],
            [
                entryLocalStorageProperty,
                this.createInitializerMethod(className!, propertyTranslators),
                ...translatedMembers,
            ]
        )

        return createdClass
    }

    findEtsAdaptorName(name: ts.LeftHandSideExpression): ts.LeftHandSideExpression {
        if (ts.isIdentifier(name)) {
            const newName = adaptorEtsName(name)
            this.importer.addAdaptorImport(ts.idText(newName))
            return newName
        } else {
            return name
        }
    }

    findEtsAdaptorClassName(name: ts.LeftHandSideExpression): ts.Identifier {
        if (ts.isIdentifier(name)) {
            const newName = adaptorClassName(name)!
            this.importer.addAdaptorImport(ts.idText(newName))
            return newName
        } else {
            throw new Error("expected ETS name to be an Identifier, got: " + ts.SyntaxKind[name.kind])
        }
    }

    createContentLambda(node: ts.EtsComponentExpression): ts.Expression {
        if (!node.body?.statements || node.body.statements.length == 0) {
            return undefinedValue()
        }

        const contentLambdaBody = ts.factory.createBlock(
            node.body?.statements,
            true
        )

        return ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            contentLambdaBody
        )
    }

    createEtsInstanceLambda(node: ts.EtsComponentExpression): ts.Expression {
        // Either a lambda or undefined literal.
        const instanceArgument = node.arguments[0]

        if (isUndefined(instanceArgument)) {
            return instanceArgument
        }

        return this.createInstanceLambda(node, this.findEtsAdaptorClassName(node.expression))
    }

    createBuilderLambdaInstanceLambda(node: ts.EtsComponentExpression|ts.CallExpression, parameterTypeName?: ts.Identifier): ts.Expression {
        // Either a lambda or undefined literal.
        const instanceArgument = node.arguments[0]

        if (isUndefined(instanceArgument)) {
            return instanceArgument
        }

        return this.createInstanceLambda(node, undefined)
    }

    createInstanceLambda(node: ts.EtsComponentExpression|ts.CallExpression, parameterTypeName?: ts.Identifier): ts.Expression {
        // Either a lambda or undefined literal.
        const instanceArgument = node.arguments[0]

        if (isUndefined(instanceArgument)) {
            return instanceArgument
        }

        const parameterName = parameterNameIdentifier(node.expression)

        const lambdaParameter = parameter(
            parameterName,
            parameterTypeName ? ts.factory.createTypeReferenceNode(parameterTypeName) : undefined
        )

        const instanceLambdaBody = ts.factory.createBlock(
            [
                ts.factory.createExpressionStatement(instanceArgument)
            ],
            true
        )

        return ts.factory.createArrowFunction(
            undefined,
            undefined,
            [lambdaParameter],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            instanceLambdaBody
        )
    }

    translateEtsComponent(node: ts.EtsComponentExpression, newName: ts.LeftHandSideExpression): ts.CallExpression {
        const newArguments = [
            this.createEtsInstanceLambda(node),
            this.createContentLambda(node),
            ...node.arguments.slice(1)
        ]

        return ts.factory.createCallExpression(
            newName,
            node.typeArguments,
            newArguments
        )
    }



    translateBuiltinEtsComponent(node: ts.EtsComponentExpression): ts.CallExpression {
        const newName = this.findEtsAdaptorName(node.expression)
        return this.translateEtsComponent(node, newName)
    }

    translateUserEtsComponent(node: ts.EtsComponentExpression): ts.CallExpression {
        return this.translateEtsComponent(node, node.expression)
    }

    transformBuilderLambdaCall(node: ts.CallExpression): ts.CallExpression {
        const originalCall = ts.getOriginalNode(node) as ts.CallExpression
        const newName = this.callTable.builderLambdas.get(originalCall)
        if (!newName) return node

        const newArguments = [
            this.createBuilderLambdaInstanceLambda(node),
            ...node.arguments.slice(1)
        ]

        return ts.factory.updateCallExpression(
            node,
            id(newName),
            node.typeArguments,
            newArguments
        )
    }

    transformStructCall(node: ts.CallExpression): ts.CallExpression {
        const newArguments = [
            undefinedValue(),
            undefinedValue(),
            ...node.arguments
        ]

        return ts.factory.updateCallExpression(
            node,
            //id(newName),
            node.expression,
            node.typeArguments,
            newArguments
        )
    }

    // This is a heuristics to understand if the given property call
    // is a style setting call.
    isStyleSettingMethodCall(node: ts.CallExpression): boolean {
        const property = node.expression
        if (!property || !ts.isPropertyAccessExpression(property)) return false
        const name = property.name
        if (!name || !ts.isIdentifier(name)) return false

        const declarations = getDeclarationsByNode(this.typechecker, name)

        // TODO: handle multiple declarations
        const declaration = declarations[0]

        if (!declaration || !ts.isMethodDeclaration(declaration)) return false
        const returnType = declaration.type
        if (!returnType || !ts.isTypeReferenceNode(returnType)) return false
        const returnTypeName = returnType.typeName
        if (!returnTypeName || !ts.isIdentifier(returnTypeName)) return false
        const parent = declaration.parent
        if (!parent || !ts.isClassDeclaration(parent)) return false
        const parentName = parent.name
        if (!parentName || !ts.isIdentifier(parentName)) return false
        const parentNameString = ts.idText(parentName)

        const ohosDeclaredClass =
            parentNameString.endsWith("Attribute") ||
            parentNameString == "CommonMethod"

        return ohosDeclaredClass
    }

    // TODO: Somehow eTS compiler produces style setting methods with a type parameter.
    fixEmptyTypeArgs(node: ts.CallExpression): ts.CallExpression {
        if (this.isStyleSettingMethodCall(node)) {
            return ts.factory.updateCallExpression(node, node.expression, undefined, node.arguments)
        }
        return node
    }

    importIfEnum(node: ts.PropertyAccessExpression): ts.PropertyAccessExpression {
        const name = node.expression
        if (!ts.isIdentifier(name)) return node
        const receiverDeclarations = getDeclarationsByNode(this.typechecker, node.expression)
        const anyDeclaration = receiverDeclarations[0]
        if (anyDeclaration && ts.isEnumDeclaration(anyDeclaration)) {
            this.importer.addAdaptorImport(ts.idText(name))
        }

        // Just return the node itself.
        return node
    }

    appendTopLevelMemoFunctions(file: ts.SourceFile): ts.SourceFile {
        return ts.factory.updateSourceFile(file,
            [...file.statements, ...this.topLevelMemoFunctions, ...this.topLevelInitialization],
            file.isDeclarationFile,
            file.referencedFiles,
            file.typeReferenceDirectives,
            file.hasNoDefaultLib,
            file.libReferenceDirectives
        )
    }

    isDollarFieldAccess(node: ts.Expression): boolean {
        if (!ts.isPropertyAccessExpression(node)) return false
        const name = node.name
        if (!name) return false
        if (!ts.isIdentifier(name)) return false

        const receiver = node.expression
        if (!receiver) return false
        if (receiver.kind != ts.SyntaxKind.ThisKeyword) return false

        const nameString = ts.idText(name)
        return nameString.startsWith("$")
    }

    translateDollarFieldAccess(node: ts.PropertyAccessExpression): ts.PropertyAccessExpression {
        return ts.factory.createPropertyAccessExpression(
            node.expression,
            backingField(ts.idText(node.name).substring(1))
        )
    }

    isDollarFieldAssignment(node: ts.PropertyAssignment): boolean {
        if (!ts.isPropertyAccessExpression(node.initializer)) return false
        return this.isDollarFieldAccess(node.initializer)
    }

    translateDollarFieldAssignment(node: ts.PropertyAssignment): ts.PropertyAssignment {
        if (!ts.isIdentifier(node.name)) return node

        const initializer = node.initializer
        if (this.isDollarFieldAccess(initializer)) {
            const newInitializer = this.translateDollarFieldAccess(initializer as ts.PropertyAccessExpression)
            return ts.factory.createPropertyAssignment(backingFieldName(node.name), newInitializer)
        }

        return node
    }

    translateClass(node: ts.ClassDeclaration): ts.ClassDeclaration {
        const newMembers = node.members.flatMap(it => {
            if (!ts.isPropertyDeclaration(it) || !isState(it)) {
                return it
            }
            return new ClassState(it, this.importer).translateMember()
        })

        const createdClass = ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            newMembers
        )
        return createdClass
    }

    isUserEts(node: ts.EtsComponentExpression): boolean {
        const nameId = node.expression as ts.Identifier
        const name = ts.idText(nameId)

        // Special handling for synthetic names
        if (this.callTable.lazyCalls.has(nameId)) return false

        if (isBuiltinComponentName(this.ctx, name) &&
            !hasLocalDeclaration(this.typechecker, nameId)
        ) return false

        return true
    }

    visitor(beforeChildren: ts.Node): ts.Node {
        const node = this.visitEachChild(beforeChildren)
        if (ts.isStructDeclaration(node)) {
            return this.translateStructToClass(node)
        } else if (ts.isClassDeclaration(node)) {
            return this.translateClass(node)
        } else if (isGlobalBuilder(node)) {
            return this.translateGlobalBuilder(node as ts.FunctionDeclaration)
        } else if (ts.isEtsComponentExpression(node)) {
            if (this.isUserEts(node)) {
                return this.translateUserEtsComponent(node)
            } else {
                return this.translateBuiltinEtsComponent(node)
            }
        } else if (ts.isImportDeclaration(node)) {
            const newNode = this.translateImportDeclaration(node)
            return this.visitEachChild(newNode)
        } else if (ts.isCallExpression(node) && isBuilderLambdaCall(this.callTable, node)) {
            return this.transformBuilderLambdaCall(node as ts.CallExpression)
        } else if (ts.isCallExpression(node) && isStructCall(this.callTable, node)) {
            return this.transformStructCall(node as ts.CallExpression)
        } else if (ts.isCallExpression(node)) {
            return this.fixEmptyTypeArgs(node)
        } else if (ts.isPropertyAssignment(node) && this.isDollarFieldAssignment(node)) {
            return this.translateDollarFieldAssignment(node)
        } else if (ts.isSourceFile(node)) {
            return this.appendTopLevelMemoFunctions(node)
        }
        return node
    }
}
