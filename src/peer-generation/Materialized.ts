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

import * as idl from '@idlize/core/idl'
import { ArgConvertor } from "./ArgConvertors"
import { Field, Method, MethodModifier, NamedMethodSignature } from "./LanguageWriters"
import { capitalize } from '@idlize/core'
import { ImportsCollector } from "./ImportsCollector"
import { createReferenceType, IDLType, IDLVoidType } from '@idlize/core/idl'
import { PeerMethod } from "./PeerMethod";
import { PeerClassBase } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary"

export class MaterializedField {
    constructor(
        public field: Field,
        public argConvertor: ArgConvertor,
        public outArgConvertor?: ArgConvertor,
        public isNullableOriginalTypeField?: boolean
    ) { }
}

export class MaterializedMethod extends PeerMethod {
    constructor(
        originalParentName: string,
        public implementationParentName: string,
        argConvertors: ArgConvertor[],
        returnType: IDLType,
        isCallSignature: boolean,
        method: Method,
        public outArgConvertor?: ArgConvertor,
    ) {
        super(originalParentName, argConvertors, returnType, isCallSignature, method, outArgConvertor)
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

    override getImplementationName(): string {
        return this.implementationParentName
    }

    tsReturnType(): IDLType | undefined {
        return this.method.signature.returnType
    }
}

export function copyMaterializedMethod(method: MaterializedMethod, overrides: {
    method?: Method,
    // add more if you need
}) {
    const copied = new MaterializedMethod(
        method.originalParentName,
        method.implementationParentName,
        method.argConvertors,
        method.returnType,
        method.isCallSignature,
        overrides.method ?? method.method,
        method.outArgConvertor)
    copied.setSameOverloadIndex(method)
    return copied
}

export class MaterializedClass implements PeerClassBase {
    constructor(
        public readonly decl: idl.IDLInterface,
        public readonly className: string,
        public readonly isInterface: boolean,
        public readonly superClass: idl.IDLReferenceType | undefined,
        public readonly generics: string[] | undefined,
        public readonly fields: MaterializedField[],
        public readonly ctor: MaterializedMethod,
        public readonly finalizer: MaterializedMethod,
        public readonly methods: MaterializedMethod[],
        public readonly needBeGenerated: boolean = true,
        public readonly taggedMethods: idl.IDLMethod[] = [],
    ) {
        PeerMethod.markAndGroupOverloads(methods)
    }

    getComponentName(): string {
        return this.className
    }

    getImplementationName(): string {
        return this.isInterface ? getInternalClassName(this.className) : this.className
    }

    generatedName(isCallSignature: boolean): string{
        return this.className
    }
}

export function createDestroyPeerMethod(clazz: MaterializedClass): MaterializedMethod {
    return new MaterializedMethod(
            clazz.className,
            clazz.getImplementationName(),
            [],
            IDLVoidType,
            false,
            new Method(
                'destroyPeer',
                new NamedMethodSignature(
                    IDLVoidType,
                    [createReferenceType(clazz.className)],
                    ['peer']
                )
            )
        )
}

export function getInternalClassName(name: string): string {
    return `${name}Internal`
}

export function collectMaterializedImports(imports: ImportsCollector, library: PeerLibrary) {
    for (const materialized of library.materializedClasses.values()) {
        imports.addFeature(getInternalClassName(materialized.className), `./Ark${materialized.className}Materialized`)
    }
}
