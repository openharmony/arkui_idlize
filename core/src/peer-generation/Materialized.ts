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

import { generatorConfiguration } from '../config'
import * as idl from '../idl'
import { ArgConvertor } from '../LanguageWriters/ArgConvertors'
import { copyMethod, Field, Method, MethodModifier, NamedMethodSignature } from '../LanguageWriters/LanguageWriter'
import { capitalize } from '../util'
import { isBuilderClass } from './BuilderClass'
import { qualifiedName } from './idl/common'
import { PeerClassBase } from './PeerClass'
import { PeerMethod } from './PeerMethod'
import { ReferenceResolver } from './ReferenceResolver'

export function isMaterialized(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    if (idl.isHandwritten(declaration) ||
        isBuilderClass(declaration) ||
        declaration.subkind === idl.IDLInterfaceSubkind.AnonymousInterface ||
        declaration.subkind === idl.IDLInterfaceSubkind.Tuple)
    {
        return false
    }
    for (const ignore of generatorConfiguration().param<string[]>("ignoreMaterialized")) {
        if (declaration.name.endsWith(ignore)) return false
    }

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    if (declaration.methods.length > 0) return true

    // Or a class or an interface derived from materialized class
    if (idl.hasSuperType(declaration)) {
        const superType = resolver.resolveTypeReference(idl.getSuperType(declaration)!)
        if (!superType || !idl.isInterface(superType)) {
            console.log(`Unable to resolve ${idl.getSuperType(declaration)!.name} type, consider ${declaration.name} to be not materialized`)
            return false
        }
        return isMaterialized(superType, resolver)
    }
    return false
}

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
        returnType: idl.IDLType,
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
        if (this.method.modifiers?.includes(MethodModifier.STATIC)) {
            if (this.method.signature.returnType === idl.IDLNumberType) {
                return '100'
            }
            if (this.method.signature.returnType === idl.IDLBooleanType) {
                return '0'
            }
            return `(void*) 300`
        }
        if (idl.isReferenceType(this.method.signature.returnType)) {
            return "{}"
        }
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

    tsReturnType(): idl.IDLType | undefined {
        return this.method.signature.returnType
    }

    getPrivateMethod() {
        let privateMethod: MaterializedMethod = this
        if (!privateMethod.method.modifiers?.includes(MethodModifier.PRIVATE)) {
            privateMethod = copyMaterializedMethod(this, {
                method: copyMethod(this.method, {
                    modifiers: (this.method.modifiers ?? [])
                        .filter(it => it !== MethodModifier.PUBLIC)
                        .concat([MethodModifier.PRIVATE])
                })
            })
        }
        return privateMethod
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
        public readonly interfaces: idl.IDLReferenceType[] | undefined,
        public readonly generics: string[] | undefined,
        public readonly fields: MaterializedField[],
        public readonly ctor: MaterializedMethod | undefined, // undefined when used for global functions
        public readonly finalizer: MaterializedMethod | undefined, // undefined when used for global functions
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

    isGlobalScope() {
        return idl.hasExtAttribute(this.decl, idl.IDLExtendedAttributes.GlobalScope)
    }
}

export function createDestroyPeerMethod(clazz: MaterializedClass): MaterializedMethod {
    return new MaterializedMethod(
            clazz.className,
            clazz.getImplementationName(),
            [],
            idl.IDLVoidType,
            false,
            new Method(
                'destroyPeer',
                new NamedMethodSignature(
                    idl.IDLVoidType,
                    [idl.createReferenceType(clazz.className)],
                    ['peer']
                )
            )
        )
}

export function getInternalClassName(name: string): string {
    return `${name}Internal`
}

export function getInternalClassQualifiedName(target: idl.IDLEntry): string {
    return getInternalClassName(qualifiedName(target, "."))
}

export function getMaterializedFileName(name:string): string {
    const pascalCase = name.split('_').map(x => capitalize(x)).join('')
    return `Ark${pascalCase}Materialized`
}
