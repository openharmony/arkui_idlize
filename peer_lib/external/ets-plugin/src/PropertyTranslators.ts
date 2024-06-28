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

import * as ts from "ohos-typescript"
import {
    Any,
    assignment,
    createThisFieldAccess,
    dropReadonly,
    Exclamation,
    findDecoratorArgument,
    id,
    orUndefined,
    parameter,
    undefinedValue,
} from "./ApiUtils"
import { Importer } from "./Importer"
import {
    backingField,
    BuilderParamDecorator,
    collect,
    ConsumeDecorator,
    createBlock,
    createNotNullAccessor,
    createNullableAccessor,
    createNullishCoalescing,
    createValueAccessor,
    dropDecorators,
    filterDecorators,
    idTextOrError,
    initializers,
    isBuilderParam,
    isConsume,
    isLink,
    isLocalStorageLink,
    isLocalStorageProp,
    isObjectLink,
    isProp,
    isProvide,
    isState,
    isStorageLink,
    isStorageProp,
    LinkDecorator,
    LocalStorageLinkDecorator,
    LocalStoragePropDecorator,
    LocalStoragePropertyName,
    ObjectLinkDecorator,
    prependDoubleLineMemoComment,
    prependMemoComment,
    PropDecorator,
    ProvideDecorator,
    StateDecorator,
    StorageLinkDecorator,
    StoragePropDecorator,
    SyncedPropertyConstructor,
    WatchDecorator,
} from "./utils"

export abstract class PropertyTranslator {
    private cachedType: ts.TypeNode | undefined // do not analyze this.property.initializer every time
    constructor(protected property: ts.PropertyDeclaration, protected importer: Importer) { }

    get propertyName(): string {
        return idTextOrError(this.property.name)
    }
    get propertyType(): ts.TypeNode {
        let type = this.property.type ?? this.cachedType
        if (!type) this.cachedType = type = this.typeInference(this.property.initializer)
        return type
    }
    private typeInference(initializer?: ts.Expression): ts.TypeNode {
        // TODO: try to analyze this.property.initializer
        return Any()
    }

    abstract translateMember(): ts.ClassElement[]
    translateInitializer(): ts.Expression|undefined {
        return undefined
    }
    translateToInitialization(): ts.Statement | undefined {
        return undefined
    }
    translateToUpdate(): ts.Statement | undefined {
        return undefined
    }
    translateToBuildParameter(): ts.ParameterDeclaration | undefined {
        return undefined
    }

    createStateOf(type: ts.TypeNode | undefined, ...initializer: ts.Expression[]): ts.Expression {
        return createStateOf(this.importer, type, ...initializer)
    }

    translateStateMember(
        property: ts.PropertyDeclaration,
        decoratorName: string,
        initializer: ts.Expression | undefined,
        type: ts.TypeNode | undefined,
        addExclamation: boolean
    ): ts.ClassElement[] {

        const originalName = idTextOrError(property.name)
        const newName = backingField(originalName)

        const field = ts.factory.updatePropertyDeclaration(
            property,
            dropDecorators(property.modifiers, decoratorName, WatchDecorator),
            newName,
            addExclamation ? Exclamation() : undefined,
            type,
            initializer
        )

        const getter = this.createStateGetter(originalName, newName)
        const setter = this.createStateSetter(originalName, newName)

        return [field, getter, setter]
    }

    translatePlainMember(
        property: ts.PropertyDeclaration,
        initializer: ts.Expression | undefined,
        type: ts.TypeNode | undefined,
        decorator?: string,
        memo?: boolean
    ): ts.ClassElement[] {
        const originalName = idTextOrError(property.name)
        const newName = backingField(originalName)

        const field = ts.factory.updatePropertyDeclaration(
            property,
            dropReadonly(dropDecorators(property.modifiers, decorator)),
            newName,
            initializer ? undefined : ts.factory.createToken(ts.SyntaxKind.ExclamationToken),
            type,
            initializer
        )

        const getter = this.createPlainGetter(originalName, newName, type, memo)
        const setter = this.createPlainSetter(originalName, newName, type, memo)

        const backingFieldWithMemo = memo ? prependMemoComment(field) : field

        // TODO: don't produce any setters for readonly properties
        return [backingFieldWithMemo, getter, setter]
    }

    mutableState(type: ts.TypeNode,): ts.TypeNode {
        return ts.factory.createTypeReferenceNode(
            id(this.importer.withRuntimeImport("MutableState")),
            [type]
        )
    }

    mutableStateOrUndefined(type: ts.TypeNode, importer: Importer): ts.TypeNode {
        return orUndefined(this.mutableState(type))
    }


    translateStateWithoutInitializer(
        property: ts.PropertyDeclaration,
        decoratorName: string,
        syncedProperty: boolean = false,
    ): ts.ClassElement[] {
        return this.translateStateMember(
            property,
            decoratorName,
            undefined,
            ts.factory.createTypeReferenceNode(
                syncedProperty
                    ? this.importer.withAdaptorImport("SyncedProperty")
                    : this.importer.withRuntimeImport("MutableState"),
                [
                    this.propertyType
                ]
            ),
            true
        )
    }

    translateStateWithInitializer(
        property: ts.PropertyDeclaration,
        decorator: string,
        initializer: ts.Expression,
    ): ts.ClassElement[] {
        return this.translateStateMember(property, decorator, initializer, undefined, false)
    }

    protected createAppStorageState(decoratorName: string): ts.Expression {
        return ts.factory.createCallExpression(
            id(this.importer.withAdaptorImport("AppStorageLinkState")),
            [this.propertyType],
            [
                findDecoratorArgument(filterDecorators(this.property), decoratorName, 0),
                this.property.initializer!
            ]
        )
    }

    protected createLocalStorageState(decoratorName: string): ts.Expression {
        return ts.factory.createCallExpression(
            id(this.importer.withAdaptorImport("StorageLinkState")),
            [this.propertyType],
            [
                createThisFieldAccess(LocalStoragePropertyName),
                findDecoratorArgument(filterDecorators(this.property), decoratorName, 0),
                this.property.initializer!
            ]
        )
    }

    private createStateGetter(originalName: string, newName: string): ts.GetAccessorDeclaration {
        return ts.factory.createGetAccessorDeclaration(
            undefined,
            id(originalName),
            [],
            this.propertyType,
            createBlock(
                    ts.factory.createReturnStatement(
                        createValueAccessor(
                            // TODO: issue a message if there is no @Provide.
                            ts.factory.createNonNullExpression(
                                createThisFieldAccess(newName)
                            )
                        )
                    )
            )
        )

    }

    private createStateSetter(originalName: string, newName: string, postStatements?: ts.Statement[]) {
        const preStatement =
            (postStatements?.length ?? 0) > 0 ?
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList(
                        [
                            ts.factory.createVariableDeclaration(
                                id("oldValue"),
                                undefined,
                                undefined,
                                createValueAccessor(
                                    ts.factory.createNonNullExpression(
                                        createThisFieldAccess(newName)
                                    )
                                )
                            )
                        ],
                        ts.NodeFlags.Const
                    )
                )
                : undefined

        return ts.factory.createSetAccessorDeclaration(
            undefined,
            id(originalName),
            [
                parameter(
                    "value",
                    this.propertyType
                )
            ],
            ts.factory.createBlock(
                collect(
                    preStatement,
                    assignment(
                        createValueAccessor(
                            // TODO: issue a message if there is no @Provide.
                            ts.factory.createNonNullExpression(
                                createThisFieldAccess(newName)
                            )
                        ),
                        ts.factory.createCallExpression(
                            id(this.importer.withAdaptorImport("observableProxy")),
                            undefined,
                            [
                                id("value"),
                            ]
                        )
                    ),
                    postStatements
                ),
                true
            )
        )
    }

    createPlainGetter(originalName: string, newName: string, type: ts.TypeNode | undefined, memo?: boolean): ts.GetAccessorDeclaration {
        const getter = ts.factory.createGetAccessorDeclaration(
            undefined,
            id(originalName),
            [],
            this.propertyType,
            createBlock(
                    ts.factory.createReturnStatement(
                        createThisFieldAccess(newName)
                    )
            )
        )
        return memo ? prependMemoComment(getter) : getter
    }

    createPlainSetter(originalName: string, newName: string, type: ts.TypeNode | undefined, memo?: boolean) {
        const param = parameter(
            id("value"),
            type
        )

        return ts.factory.createSetAccessorDeclaration(
            undefined,
            id(originalName),
            [
                memo ? prependDoubleLineMemoComment(param) : param
            ],
            createBlock(assignToField(newName, id("value")))
        )
    }

    translateInitializerOfSyncedProperty(constructorName: SyncedPropertyConstructor, withValue?: ts.Expression): ts.Expression {
        return ts.factory.createCallExpression(
            id(this.importer.withAdaptorImport(constructorName)),
            this.property.type ? [this.property.type] : undefined,
            withValue ? [withValue] : []
        )
    }

    translateToUpdateSyncedProperty(withValue: ts.Expression): ts.Statement {
        return ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                    createThisFieldAccess(backingField(this.propertyName)),
                    "update"
                ),
                undefined,
                [withValue]
            )
        )
    }
}


function createStateOf(importer: Importer, type: ts.TypeNode | undefined, ...initializer: ts.Expression[]): ts.Expression {
    return ts.factory.createCallExpression(
        id(importer.withAdaptorImport("stateOf")),
        type ? [type] : undefined,
        initializer
    )
}

class State extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, StateDecorator)
    }

    translateToInitialization(): ts.Statement {
        const name = this.propertyName
        return assignToBackingField(
            name,
            this.createStateOf(
                this.propertyType,
                createNullishCoalescing(
                    createNullableAccessor(initializers(), name),
                    this.property.initializer!
                ),
                ts.factory.createThis())
        )
    }
}

export class ClassState extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        // special case: @State in any class other than struct
        return this.translateStateWithInitializer(this.property, StateDecorator, this.createStateOf(
            this.property.type,
            this.property.initializer!,
            undefinedValue(),
            undefinedValue()))
    }
}

class Prop extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, PropDecorator, true)
    }
    override translateToInitialization(): ts.Statement {
        return assignToBackingField(
            this.propertyName,
            this.translateInitializerOfSyncedProperty(SyncedPropertyConstructor.propState, this.property.initializer))
    }
    translateToUpdate(): ts.Statement {
        return this.translateToUpdateSyncedProperty(createNullableAccessor(initializers(), this.propertyName))
    }
    translateToBuildParameter(): ts.ParameterDeclaration {
        return translatePropOrObjectLinkToBuildParameter(this.property, this.importer)
    }
}

class Link extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, LinkDecorator)
    }
    translateToInitialization(): ts.Statement {
        return translateToInitializationFromInitializers(backingField(this.propertyName))
    }
}

class ObjectLink extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, ObjectLinkDecorator, true)
    }
    override translateToInitialization(): ts.Statement {
        return assignToBackingField(
            this.propertyName,
            this.translateInitializerOfSyncedProperty(SyncedPropertyConstructor.objectLink, this.property.initializer))
    }
    translateToUpdate(): ts.Statement {
        return this.translateToUpdateSyncedProperty(createNullableAccessor(initializers(), this.propertyName))
    }
    translateToBuildParameter(): ts.ParameterDeclaration {
        return translatePropOrObjectLinkToBuildParameter(this.property, this.importer)
    }
}

class Provide extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, ProvideDecorator)
    }
    translateToInitialization() {
        return translateToInitializationFromInitializers(backingField(this.propertyName))
    }
}

class Consume extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, ConsumeDecorator)
    }
    translateToInitialization() {
        return translateToInitializationFromInitializers(backingField(this.propertyName))
    }
}

class StorageLink extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, StorageLinkDecorator)
    }

    translateToInitialization(): ts.Statement {
        return assignToBackingField(this.propertyName, this.createAppStorageState(StorageLinkDecorator))
    }

}
class LocalStorageLink extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, LocalStorageLinkDecorator)
    }

    translateToInitialization(): ts.Statement {
        return assignToBackingField(this.propertyName, this.createLocalStorageState(LocalStorageLinkDecorator))
    }

}
class StorageProp extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, StoragePropDecorator, true)
    }
    override translateToInitialization(): ts.Statement {
        return assignToBackingField(
            this.propertyName,
            this.translateInitializerOfSyncedProperty(SyncedPropertyConstructor.propState, this.createAppStorageValue()))
    }
    translateToUpdate(): ts.Statement {
        return this.translateToUpdateSyncedProperty(this.createAppStorageValue())
    }
    createAppStorageValue(): ts.Expression {
        return createValueAccessor(this.createAppStorageState(StoragePropDecorator))
    }

}
class LocalStorageProp extends PropertyTranslator {
    translateMember(): ts.ClassElement[] {
        return this.translateStateWithoutInitializer(this.property, LocalStoragePropDecorator, true)
    }
    override translateToInitialization(): ts.Statement {
        return assignToBackingField(
            this.propertyName,
            this.translateInitializerOfSyncedProperty(SyncedPropertyConstructor.propState, this.createLocalStorageValue()))
    }
    translateToUpdate(): ts.Statement {
        return this.translateToUpdateSyncedProperty(this.createLocalStorageValue())
    }
    createLocalStorageValue(): ts.Expression {
        return createValueAccessor(this.createLocalStorageState(LocalStoragePropDecorator))
    }
}

export class BuilderParam extends PropertyTranslator {
    constructor(protected property: ts.PropertyDeclaration, protected importer: Importer, private typechecker: ts.TypeChecker) {
        super(property, importer)
    }
    translateMember(): ts.ClassElement[] {
        return this.translatePlainMember(
            this.property,
            undefined,
            this.propertyType,
            BuilderParamDecorator,
            /* memo = */ true
        )
    }
    translateToInitialization(): ts.Statement | undefined {
        return initializePlainProperty(this.propertyName, this.property.initializer)
    }
}

class PlainProperty extends PropertyTranslator {
    constructor(protected property: ts.PropertyDeclaration, protected importer: Importer, private typechecker: ts.TypeChecker) {
        super(property, importer)
    }
    translateMember(): ts.ClassElement[] {
        return this.translatePlainMember(
            this.property,
            undefined,
            this.propertyType
        )
    }
    translateToInitialization(): ts.Statement | undefined {
        return initializePlainProperty(this.propertyName, this.property.initializer)
    }
}

function initializePlainProperty(name: string, initializer?: ts.Expression): ts.Statement {
    return initializer
        ? assignToBackingField(name, createNullishCoalescing(createNullableAccessor(initializers(), name), initializer))
        : ts.factory.createIfStatement(
            createNullableAccessor(initializers(), name),
            createBlock(assignToBackingField(name, createNullableAccessor(initializers(), name)))
        )
}

function assignToBackingField(name: string, expression: ts.Expression): ts.Statement {
    return assignToField(backingField(name), expression)
}

function assignToField(name: string, expression: ts.Expression): ts.Statement {
    return assignment(createThisFieldAccess(name), expression)
}

function translateToInitializationFromInitializers(name: string): ts.Statement {
    return assignToField(name, createNotNullAccessor(initializers(), name))
}

function translatePropOrObjectLinkToBuildParameter(property: ts.PropertyDeclaration, importer: Importer): ts.ParameterDeclaration {
    return parameter(
        backingField(idTextOrError(property.name)),
        property.type
    )
}

export function haveProvidesOrConsumes(translators: PropertyTranslator[]): boolean {
    const providesOrConsumes = translators.filter(it => it instanceof Provide || it instanceof Consume)
    return providesOrConsumes.length > 0
}

export function classifyProperty(member: ts.ClassElement, importer: Importer, typechecker: ts.TypeChecker): PropertyTranslator | undefined {
    if (!ts.isPropertyDeclaration(member)) return undefined
    if (isState(member)) {
        return new State(member, importer)
    } else if (isStorageProp(member)) {
        return new StorageProp(member, importer)
    } else if (isStorageLink(member)) {
        return new StorageLink(member, importer)
    } else if (isLocalStorageLink(member)) {
        return new LocalStorageLink(member, importer)
    } else if (isLocalStorageProp(member)) {
        return new LocalStorageProp(member, importer)
    } else if (isLink(member)) {
        return new Link(member, importer)
    } else if (isProp(member)) {
        return new Prop(member, importer)
    } else if (isObjectLink(member)) {
        return new ObjectLink(member, importer)
    } else if (isProvide(member)) {
        return new Provide(member, importer)
    } else if (isConsume(member)) {
        return new Consume(member, importer)
    } else if (isBuilderParam(member)) {
        return new BuilderParam(member, importer, typechecker)
    } else {
        return new PlainProperty(member, importer, typechecker)
    }
}
