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
import { ArgConvertor, RetConvertor } from "./Convertors"
import { Field, Method, MethodModifier, Type } from "./LanguageWriters"
import { PeerMethod } from "./PeerMethod"
import { identName } from "../util"
import { PeerClassBase } from "./PeerClass"
import { DeclarationTarget, PrimitiveType } from "./DeclarationTable"
import { ImportFeature } from "./ImportsCollector"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import { isBuilderClass } from "./BuilderClass"

export function checkTSDeclarationMaterialized(declaration: ts.Declaration): boolean {
    return (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration)) && isMaterialized(declaration)
}

export function checkDeclarationTargetMaterialized(declaration: DeclarationTarget): boolean {
    return !(declaration instanceof PrimitiveType) && (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration)) && isMaterialized(declaration)
}

export function isMaterialized(declaration: ts.InterfaceDeclaration | ts.ClassDeclaration): boolean {

    const name = identName(declaration)!

    if (PeerGeneratorConfig.isMaterializedIgnored(name)) {
        return false;
    }

    if (isBuilderClass(declaration)) {
        return false
    }

    // TODO: parse Builder classes separatly

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    return (ts.isClassDeclaration(declaration) && declaration.members.some(ts.isMethodDeclaration))
        || (ts.isInterfaceDeclaration(declaration) && declaration.members.some(ts.isMethodSignature))
}

export class MaterializedField {
    constructor(
        public declarationTarget: DeclarationTarget,
        public argConvertor: ArgConvertor,
        public retConvertor: RetConvertor,
        public field: Field
    ) { }
}

export class MaterializedMethod extends PeerMethod {
    constructor(
        originalParentName: string,
        declarationTargets: DeclarationTarget[],
        argConvertors: ArgConvertor[],
        retConvertor: RetConvertor,
        isCallSignature: boolean,
        method: Method
    ) {
        super(originalParentName, declarationTargets, argConvertors, retConvertor, isCallSignature, false, method)
    }

    override get peerMethodName() {
        return this.overloadedName
    }

    override get implName(): string {
        return `${this.originalParentName}_${this.overloadedName}`
    }

    override get toStringName(): string {
        switch (this.method.name) {
            case "ctor": return `new ${this.originalParentName}`
            case "destructor": return `delete ${this.originalParentName}`
            default: return super.toStringName
        }
    }

    override get dummyReturnValue(): string | undefined {
        if (this.method.name === "ctor") return `(void*) 100`
        if (this.method.name === "getFinalizer") return `fnPtr<KNativePointer>(dummyClassFinalizer)`
        if (this.method.modifiers?.includes(MethodModifier.STATIC)) return `(void*) 300`
        return undefined;
    }

    override get receiverType(): string {
        return `${this.originalParentName}Peer*`
    }

    override get apiCall(): string {
        return "GetAccessors()"
    }

    override get apiKind(): string {
        return "Accessor"
    }

    override generateReceiver(): { argName: string; argType: string } | undefined {
        if (!this.hasReceiver()) return undefined
        return {
            argName: 'peer',
            argType: `${this.originalParentName}Peer*`
        }
    }

    tsReturnType(): Type | undefined {
        const returnType = this.method.signature.returnType
        return this.hasReceiver() && returnType.name === this.originalParentName ? Type.This : returnType
    }
}

export class SuperElement {
    constructor(
        public readonly name: string,
        public readonly generics?: string[]
    ) { }
}

export class MaterializedClass implements PeerClassBase {
    constructor(
        public readonly className: string,
        public readonly isInterface: boolean,
        public readonly superClass: SuperElement | undefined,
        public readonly generics: string[] | undefined,
        public readonly fields: MaterializedField[],
        public readonly ctor: MaterializedMethod,
        public readonly finalizer: MaterializedMethod,
        public readonly importFeatures: ImportFeature[],
        public methods: MaterializedMethod[],
    ) {
        PeerMethod.markOverloads(methods)
    }

    getComponentName(): string {
        return this.className
    }

    setGenerationContext(context: string| undefined): void {
       // TODO: set generation context!
    }

    generatedName(isCallSignature: boolean): string{
        return this.className
    }
}
