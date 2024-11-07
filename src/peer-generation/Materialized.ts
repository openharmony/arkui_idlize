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

import { ArgConvertor, RetConvertor } from "./ArgConvertors"
import { Field, Method, MethodModifier } from "./LanguageWriters"
import { capitalize } from "../util"
import { ImportFeature } from "./ImportsCollector"
import { isOptionalType, isNamedNode, IDLThisType, IDLType, maybeOptional, IDLNode } from "../idl"
import { IdlPeerMethod } from "./idl/IdlPeerMethod";
import { PeerClassBase } from "./PeerClass";

export class MaterializedField {
    constructor(
        public field: Field,
        public argConvertor: ArgConvertor,
        public retConvertor: RetConvertor,
        public isNullableOriginalTypeField?: boolean
    ) { }
}

export class MaterializedMethod extends IdlPeerMethod {
    constructor(
        originalParentName: string,
        declarationTargets: IDLNode[],
        argConvertors: ArgConvertor[],
        retConvertor: RetConvertor,
        isCallSignature: boolean,
        method: Method,
    ) {
        super(originalParentName, declarationTargets, argConvertors, retConvertor, isCallSignature, method)
    }

    override get peerMethodName() {
        return this.overloadedName
    }

    override get implNamespaceName(): string {
        return `${capitalize(this.originalParentName)}Accessor`
    }

    override get toStringName(): string {
        switch (this.method.name) {
            case "ctor": return `new ${this.originalParentName}`
            case "destructor": return `delete ${this.originalParentName}`
            default: return super.toStringName
        }
    }

    override get dummyReturnValue(): string | undefined {
        if (this.method.name === "ctor") return `(${this.originalParentName}Peer*) 100`
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

    tsReturnType(): IDLType | undefined {
        const returnType = this.method.signature.returnType
        return this.hasReceiver() && isNamedNode(returnType) && returnType.name === this.originalParentName
            ? IDLThisType
            : maybeOptional(returnType, isOptionalType(returnType))
    }
}

export function copyMaterializedMethod(method: MaterializedMethod, overrides: {
    method?: Method,
    // add more if you need
}) {
    const copied = new MaterializedMethod(
        method.originalParentName,
        method.declarationTargets,
        method.argConvertors,
        method.retConvertor,
        method.isCallSignature,
        overrides.method ?? method.method,
    )
    copied.setSameOverloadIndex(method)
    return copied
}

export class SuperElement {
    constructor(
        public readonly name: string,
        public readonly generics?: string[]
    ) { }

    getSuperType(): string {
        return `${this.name}${this.generics?.length ? `<${this.generics.join(", ")}>` : ``}`
    }
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
        public readonly methods: MaterializedMethod[],
        public readonly needBeGenerated: boolean = true,
    ) {
        IdlPeerMethod.markAndGroupOverloads(methods)
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
