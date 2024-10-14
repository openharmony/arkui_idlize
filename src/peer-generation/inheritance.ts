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


import * as ts from "typescript";
import { asString, getDeclarationsByNode, heritageDeclarations, identName } from "../util";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";

export enum InheritanceRole {
    Finalizable,
    PeerNode,
    Root,
    Heir,
    Standalone,
}

export function determineInheritanceRole(name: string): InheritanceRole {
    if (PeerGeneratorConfig.rootComponents.includes(name)) return InheritanceRole.Root
    if (PeerGeneratorConfig.standaloneComponents.includes(name)) return InheritanceRole.Standalone
    return InheritanceRole.Heir
}

export function determineParentRole(name: string|undefined, parent: string | undefined): InheritanceRole {
    if (!name) throw new Error(`name must be known: ${parent}`)
    if (parent === undefined) {
        if (isStandalone(name)) return InheritanceRole.PeerNode
        if (isCommonMethod(name)) return InheritanceRole.PeerNode
        if (isRoot(name)) return InheritanceRole.PeerNode
        throw new Error(`Expected check to be exhaustive. node: ${name}`)
    }
    if (isRoot(parent)) return InheritanceRole.Root
    return InheritanceRole.Heir
}

export function isCommonMethod(name: string): boolean {
    return name === "CommonMethod"
}

export function isCommonMethodOrSubclass(typeChecker: ts.TypeChecker, decl: ts.ClassDeclaration): boolean {
    let name = identName(decl.name)!
    let isSubclass = isRoot(name)
    decl.heritageClauses?.forEach(it => {
        heritageDeclarations(typeChecker, it).forEach(it => {
            let name = asString(it.name)
            isSubclass = isSubclass || isRoot(name)
            if (!ts.isClassDeclaration(it)) return isSubclass
            isSubclass = isSubclass || isCommonMethodOrSubclass(typeChecker, it)
        })
    })
    return isSubclass
}

export function isRoot(name: string): boolean {
    return determineInheritanceRole(name) === InheritanceRole.Root
}

export function isStandalone(name: string): boolean {
    return determineInheritanceRole(name) === InheritanceRole.Standalone
}

export function isHeir(name: string): boolean {
    return determineInheritanceRole(name) === InheritanceRole.Heir
}

export function singleParentDeclaration(
    typeChecker: ts.TypeChecker,
    component: ts.ClassDeclaration | ts.InterfaceDeclaration
): ts.ClassDeclaration | ts.InterfaceDeclaration | undefined {
    const parentTypeNode = component.heritageClauses
        ?.filter(it => it.token == ts.SyntaxKind.ExtendsKeyword)[0]?.types[0]?.expression
    if (parentTypeNode) {
        const declaration = getDeclarationsByNode(typeChecker, parentTypeNode)
            .find(it => ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it))
        return declaration as (ts.ClassDeclaration | ts.InterfaceDeclaration | undefined)
    }
    return undefined
}
