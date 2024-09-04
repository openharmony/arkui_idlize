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
import { heritageDeclarations, identName, isReadonly, isStatic } from "../util"
import { Field, FieldModifier, Method, MethodModifier, MethodSignature, NamedMethodSignature, Type } from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import { DeclarationTable, DeclarationTarget, FieldRecord, PrimitiveType } from "./DeclarationTable"
import {
    collectDeclarationDeps,
    createTypeNodeConvertor,
    generateMethodModifiers,
    generateSignature
} from "./PeerGeneratorVisitor"
import { SuperElement, extractSuperElement } from "./Materialized"
import { ImportFeature } from "./ImportsCollector"
import { TypeNodeNameConvertor } from "./TypeNodeNameConvertor"
import { DeclarationDependenciesCollector } from "./dependencies_collector";
import { PeerLibrary } from "./PeerLibrary";

export function isBuilderClass(declaration: ts.InterfaceDeclaration | ts.ClassDeclaration): boolean {

    // Builder classes are classes with methods which have only one parameter and return only itself

    const className = identName(declaration)!

    if (PeerGeneratorConfig.builderClasses.includes(className)) {
        return true
    }

    if (isCustomBuilderClass(className)) {
        return true
    }

    // TBD: update builder class check condition.
    // Only SubTabBarStyle, BottomTabBarStyle, DotIndicator, and DigitIndicator classes
    // are used for now.

    return false

    /*
    if (PeerGeneratorConfig.isStandardNameIgnored(className)) {
        return false
    }

    const methods: (ts.MethodSignature | ts.MethodDeclaration)[] = [
        ...ts.isClassDeclaration(declaration) ? declaration.members.filter(ts.isMethodDeclaration) : [],
    ]

    if (methods.length === 0) {
        return false
    }

    return methods.every(it => it.type && className == it.type.getText() && it.parameters.length === 1)
    */
}

function builderMethod(name: string, typeName: string, declarationTarget: DeclarationTarget): BuilderMethod {
    const method = new Method(name, new NamedMethodSignature(Type.This, [new Type(typeName)], ["value"]))
    return new BuilderMethod(method, [declarationTarget])
}

export class BuilderField {
    constructor(
        public field: Field,
        public declarationTarget: DeclarationTarget,
    ) { }
}

export class BuilderMethod {
    constructor(
        public method: Method,
        public declarationTargets: DeclarationTarget[],
    ) { }
}

export class BuilderClass {
    constructor(
        public readonly name: string,
        public readonly isInterface: boolean,
        public readonly superClass: SuperElement | undefined,
        public readonly fields: BuilderField[],
        public readonly constructors: BuilderMethod[],
        public readonly methods: BuilderMethod[],
        public readonly importFeatures: ImportFeature[],
        public readonly needBeGenerated: boolean = true,
    ) { }
}

export const CUSTOM_BUILDER_CLASSES: BuilderClass[] = []
const CUSTOM_BUILDER_CLASSES_SET: Set<String> = new Set()

export function initCustomBuilderClasses() {
    CUSTOM_BUILDER_CLASSES.push(
        new BuilderClass("Indicator", false, undefined,
            [], // fields
            [new BuilderMethod(new Method("constructor", new MethodSignature(Type.Void, [])), [])],
            [
                ...["left", "top", "right", "bottom"].map(it => builderMethod(it, "Length", PrimitiveType.Length)),
                ...["start", "end"].map(it => builderMethod(it, "LengthMetrics", PrimitiveType.CustomObject)),
                new BuilderMethod(new Method("dot", new MethodSignature(new Type("DotIndicator"), []), [MethodModifier.STATIC]), [PrimitiveType.CustomObject]),
            ],
            [], // imports
        )
    )
    CUSTOM_BUILDER_CLASSES.forEach(it => CUSTOM_BUILDER_CLASSES_SET.add(it.name))
}

export function isCustomBuilderClass(name: string) {
    return CUSTOM_BUILDER_CLASSES_SET.has(name)
}

export function toBuilderClass(declarationTable: DeclarationTable,
                               name: string,
                               target: ts.InterfaceDeclaration | ts.ClassDeclaration,
                               peerLibrary: PeerLibrary,
                               declDependenciesCollector: DeclarationDependenciesCollector,
                               needBeGenerated: boolean,
                               typeNodeConvertor: TypeNodeNameConvertor): BuilderClass {
    const importFeatures = collectDeclarationDeps(target, declDependenciesCollector, peerLibrary)
    typeNodeConvertor = createTypeNodeConvertor(peerLibrary,
        typeNodeConvertor,
        declDependenciesCollector,
        importFeatures)
    const isClass = ts.isClassDeclaration(target)
    const isInterface = ts.isInterfaceDeclaration(target)

    const superClass = extractSuperElement(target)

    const fields = isClass
        ? target.members
            .filter(ts.isPropertyDeclaration)
            .map(it => toBuilderField(declarationTable, it, typeNodeConvertor))
        : isInterface
            ? target.members
                .filter(ts.isPropertySignature)
                .map(it => toBuilderField(declarationTable, it, typeNodeConvertor))
            : []

    const constructors = isClass
        ? target.members
            .filter(ts.isConstructorDeclaration)
            .map(method => toBuilderMethod(declarationTable, method, typeNodeConvertor))
        : [toBuilderMethod(declarationTable, undefined, typeNodeConvertor)]

    const methods = getBuilderMethods(declarationTable, target, peerLibrary.declarationTable.typeChecker!, typeNodeConvertor, name)
    return new BuilderClass(name, isInterface, superClass, fields, constructors, methods, importFeatures, needBeGenerated)
}

function getBuilderMethods(declarationTable: DeclarationTable,
                           target: ts.InterfaceDeclaration | ts.ClassDeclaration,
                           typeChecker: ts.TypeChecker,
                           typeNodeNameConvertor: TypeNodeNameConvertor,
                           childName: string): BuilderMethod[] {

    const className = identName(target.name)!
    const heritageMethods = target.heritageClauses
        ?.flatMap(it => heritageDeclarations(typeChecker, it))
        .flatMap(it => (ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it))
            ? getBuilderMethods(declarationTable, it, typeChecker, typeNodeNameConvertor, className)
            : [])
        ?? []

    const isClass = ts.isClassDeclaration(target)
    const isInterface = ts.isInterfaceDeclaration(target)

    // Assume that all super type parameters resolved
    // to the current class name
    const genericsSubstitution = new Map<string, string>()
    if (childName) {
        target.typeParameters?.forEach(it => {
            genericsSubstitution.set(it.getText(), childName)
        })
    }

    const methods = isClass
        ? target.members
            .filter(ts.isMethodDeclaration)
            .map(method => toBuilderMethod(declarationTable, method, typeNodeNameConvertor, genericsSubstitution))
        : isInterface
            ? target.members
                .filter(ts.isMethodSignature)
                .map(method => toBuilderMethod(declarationTable, method, typeNodeNameConvertor, genericsSubstitution))
            : []

    return [...heritageMethods, ...methods]
}

function toBuilderField(declarationTable: DeclarationTable,
                        property: ts.PropertyDeclaration | ts.PropertySignature,
                        typeNodeConvertor: TypeNodeNameConvertor): BuilderField {
    const fieldName = identName(property.name)!
    const modifiers = isReadonly(property.modifiers) ? [FieldModifier.READONLY] : []
    const isOptional = property.questionToken !== undefined
    const declarationTarget = declarationTable.toTarget(property.type!)
    return new BuilderField(new Field(fieldName, new Type(typeNodeConvertor.convert(property.type!), isOptional), modifiers), declarationTarget)
}

function toBuilderMethod(declarationTable: DeclarationTable,
                         method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | undefined,
                         typeNodeNameConvertor: TypeNodeNameConvertor,
                         genericsSubstitution?: Map<string, string>): BuilderMethod {
    const methodName = method === undefined || ts.isConstructorDeclaration(method) ? "constructor" : identName(method.name)!

    if (method === undefined) {
        return new BuilderMethod(new Method(methodName, new NamedMethodSignature(Type.Void)), [])
    }

    const generics = method.typeParameters?.map(it => it.getText())
    const signature = generateSignature(method, typeNodeNameConvertor, false, genericsSubstitution)
    const modifiers = generateMethodModifiers(method)
    const declarationTargets: DeclarationTarget[] = method.parameters.map(it => declarationTable.toTarget(it.type!))

    return new BuilderMethod(new Method(methodName, signature, modifiers, generics), declarationTargets)
}

export function methodsGroupOverloads(methods: Method[]): Method[][] {
    const seenNames = new Set<string>()
    const groups: Method[][] = []
    for (const method of methods) {
        if (seenNames.has(method.name))
            continue
        seenNames.add(method.name)
        groups.push(methods.filter(it => it.name === method.name))
    }
    return groups
}

export function extractBuilderFields(target: ts.InterfaceDeclaration | ts.ClassDeclaration, table: DeclarationTable): FieldRecord[] {

    if (!isBuilderClass(target)) {
        return []
    }

    const isClass = ts.isClassDeclaration(target)
    const isInterface = ts.isInterfaceDeclaration(target)

    const methods = isClass
        ? target.members
            .filter(ts.isMethodDeclaration)
            .filter(it => !isStatic(it.modifiers))
        : isInterface
            ? target.members
                .filter(ts.isMethodSignature)
            : []

    let records: FieldRecord[] = []

    methods.forEach(method => {
        const parameters = Array.from(method.parameters)
        if (parameters.length === 1) {
            const param = parameters[0]
            const type = param.type!
            const name = `_${identName(method.name)}`
            records.push(new FieldRecord(table.toTarget(type!), type, name, true))
        }
    })

    return records
}