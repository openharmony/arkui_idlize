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
import { DeclarationTable, FieldRecord } from "./DeclarationTable"
import { generateMethodModifiers, generateSignature } from "./PeerGeneratorVisitor"
import { SuperElement } from "./Materialized"
import { ImportFeature } from "./ImportsCollector"
import { mapType, TypeNodeNameConvertor } from "./TypeNodeNameConvertor"

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

function builderMethod(name: string, typeName: string): Method {
    return new Method(name, new NamedMethodSignature(Type.This, [new Type(typeName)], ["value"]))
}

export class BuilderClass {
    constructor(
        public readonly name: string,
        public readonly isInterface: boolean,
        public readonly superClass: SuperElement | undefined,
        public readonly fields: Field[],
        public readonly constructors: Method[],
        public readonly methods: Method[],
        public readonly importFeatures: ImportFeature[],
        public readonly needBeGenerated: boolean = true,
    ) { }
}

export const CUSTOM_BUILDER_CLASSES: BuilderClass[] = [
    new BuilderClass("Indicator", false, undefined,
        [], // fields
        [new Method("constructor", new MethodSignature(Type.Void, []))],
        [
            ...["left", "top", "right", "bottom"].map(it => builderMethod(it, "Length")),
            ...["start", "end"].map(it => builderMethod(it, "LengthMetrics")),
            new Method("dot", new MethodSignature(new Type("DotIndicator"), []), [MethodModifier.STATIC]),
        ],
        [], // imports
    ),
]

const CUSTOM_BUILDER_CLASSES_SET: Set<String> = new Set(CUSTOM_BUILDER_CLASSES.map(it => it.name))

export function isCustomBuilderClass(name: string) {
    return CUSTOM_BUILDER_CLASSES_SET.has(name)
}

export function toBuilderClass(name: string,
                               target: ts.InterfaceDeclaration | ts.ClassDeclaration, typeChecker: ts.TypeChecker,
                               needBeGenerated: boolean,
                               typeNodeNameConvertor: TypeNodeNameConvertor) {

    const isClass = ts.isClassDeclaration(target)
    const isInterface = ts.isInterfaceDeclaration(target)

    const fields = isClass
        ? target.members
            .filter(ts.isPropertyDeclaration)
            .map(it => toBuilderField(it))
        : isInterface
            ? target.members
                .filter(ts.isPropertySignature)
                .map(it => toBuilderField(it))
            : []

    const constructors = isClass
        ? target.members
            .filter(ts.isConstructorDeclaration)
            .map(method => toBuilderMethod(method, typeNodeNameConvertor))
        : [toBuilderMethod(undefined, typeNodeNameConvertor)]

    const methods = getBuilderMethods(target, typeChecker, typeNodeNameConvertor)

    return new BuilderClass(name, isInterface, undefined, fields, constructors, methods, [], needBeGenerated)
}

function getBuilderMethods(target: ts.InterfaceDeclaration | ts.ClassDeclaration, typeChecker: ts.TypeChecker, typeNodeNameConvertor: TypeNodeNameConvertor): Method[] {

    const heritageMethods = target.heritageClauses
        ?.flatMap(it => heritageDeclarations(typeChecker, it))
        .flatMap(it => (ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it))
            ? getBuilderMethods(it, typeChecker, typeNodeNameConvertor)
            : [])
        ?? []

    const isClass = ts.isClassDeclaration(target)
    const isInterface = ts.isInterfaceDeclaration(target)

    const methods = isClass
        ? target.members
            .filter(ts.isMethodDeclaration)
            .map(method => toBuilderMethod(method, typeNodeNameConvertor))
        : isInterface
            ? target.members
                .filter(ts.isMethodSignature)
                .map(method => toBuilderMethod(method, typeNodeNameConvertor))
            : []

    return [...heritageMethods, ...methods]
}

function toBuilderField(property: ts.PropertyDeclaration | ts.PropertySignature): Field {
    const fieldName = identName(property.name)!
    const modifiers = isReadonly(property.modifiers) ? [FieldModifier.READONLY] : []
    const isOptional = property.questionToken !== undefined
    return new Field(fieldName, new Type(mapType(property.type), isOptional), modifiers)
}

function toBuilderMethod(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | undefined, typeNodeNameConvertor: TypeNodeNameConvertor): Method {
    const methodName = method === undefined || ts.isConstructorDeclaration(method) ? "constructor" : identName(method.name)!

    if (method === undefined) {
        return new Method(methodName, new NamedMethodSignature(Type.Void))
    }

    const generics = method.typeParameters?.map(it => it.getText())
    const signature = generateSignature(method, typeNodeNameConvertor)
    const modifiers = generateMethodModifiers(method)

    return new Method(methodName, signature, modifiers, generics)
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