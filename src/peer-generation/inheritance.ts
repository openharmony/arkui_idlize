import * as ts from "typescript";
import { componentName } from "../util";

export enum InheritanceRole {
    Finalizable,
    PeerNode,
    Root,
    Heir,
    Standalone,
}

const rootComponents = [
    "CommonMethod",
    "SecurityComponentMethod"
]

const standaloneComponents = [
    "CalendarAttribute",
    "ContainerSpanAttribute"
]

function determineInheritanceRole(name: string): InheritanceRole {
    if (rootComponents.includes(name)) return InheritanceRole.Root
    if (standaloneComponents.includes(name)) return InheritanceRole.Standalone
    return InheritanceRole.Heir
}

export function determineParentRole(node: ts.ClassDeclaration | ts.InterfaceDeclaration): InheritanceRole {
    const name = componentName(node)
    const parent = parentName(node)
    if (parent === undefined) {
        if (isStandalone(name)) return InheritanceRole.PeerNode
        if (isCommonMethod(name)) return InheritanceRole.PeerNode
        if (isRoot(name)) return InheritanceRole.Finalizable
        throw new Error(`Expected check to be exhaustive`)
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

export function parentName(component: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
    const heritage = component.heritageClauses
        ?.filter(it => it.token == ts.SyntaxKind.ExtendsKeyword)

    return heritage?.[0].types[0].expression.getText()
}
