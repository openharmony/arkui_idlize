import * as ts from "typescript";
import { getDeclarationsByNode } from "../util";
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
    if (!name) throw new Error("name must be known")
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
