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
import { Language } from '../Language'
import { ArgConvertor, VoidConvertor } from '../LanguageWriters/ArgConvertors'
import { CppReturnTypeConvertor } from '../LanguageWriters/convertors/CppConvertors'
import { copyMethod, Field, Method, MethodModifier, NamedMethodSignature } from '../LanguageWriters/LanguageWriter'
import { capitalize } from '../util'
import { isBuilderClass } from './BuilderClass'
import { qualifiedName } from './idl/common'
import { PeerClassBase } from './PeerClass'
import { PeerMethod, PeerMethodSignature } from './PeerMethod'
import { ReferenceResolver } from './ReferenceResolver'

export class MaterializedField {
    constructor(
        public field: Field,
        public argConvertor: ArgConvertor,
        public outArgConvertor?: ArgConvertor,
        public isNullableOriginalTypeField?: boolean,
        public extraMethodName: string | undefined = undefined
    ) { }
}

export class MaterializedMethod extends PeerMethod {
    constructor(
        sig: PeerMethodSignature,
        originalParentName: string,
        public implementationParentName: string,
        returnType: idl.IDLType,
        isCallSignature: boolean,
        method: Method,
    ) {
        super(sig, originalParentName, returnType, isCallSignature, method)
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
                        .filter(it => it !== MethodModifier.OVERRIDE)
                        .concat([MethodModifier.PRIVATE])
                })
            })
        }
        return privateMethod
    }

    withReturnType(returnType: idl.IDLType): MaterializedMethod {
        const s = this.method.signature
        const argNames = s.args.map((_, i) => s.argName(i))
        const signature = new NamedMethodSignature(
            returnType, s.args, argNames, s.defaults, s.argsModifiers, s.printHints)
        const method = copyMethod(this.method, { signature: signature })
        return copyMaterializedMethod(this, { method: method })
    }
}

export function copyMaterializedMethod(method: MaterializedMethod, overrides: {
    method?: Method,
    // add more if you need
}) {
    return new MaterializedMethod(
        method.sig,
        method.originalParentName,
        method.implementationParentName,
        method.returnType,
        method.isCallSignature,
        overrides.method ?? method.method)
}

export class MaterializedClass implements PeerClassBase {
    constructor(
        public readonly decl: idl.IDLInterface,
        public readonly className: string,
        public readonly isInterface: boolean,
        public readonly isStaticMaterialized: boolean,
        public readonly superClass: idl.IDLReferenceType | undefined,
        public readonly interfaces: idl.IDLReferenceType[] | undefined,
        public readonly generics: string[] | undefined,
        public readonly fields: MaterializedField[],
        public readonly ctors: MaterializedMethod[], // zero size when used for global functions
        public readonly finalizer: MaterializedMethod | undefined, // undefined when used for global functions
        public readonly methods: MaterializedMethod[],
        public readonly needBeGenerated: boolean = true,
        public readonly taggedMethods: idl.IDLMethod[] = [],
    ) {}

    getImplementationName(): string {
        return this.isInterface ? getInternalClassName(this.className) : this.className
    }

    generatedName(isCallSignature: boolean): string{
        return this.getImplementationName()
    }

    private _isGlobal = false
    setGlobalScope() {
        this._isGlobal = true
    }
    isGlobalScope() {
        return this._isGlobal
    }
}

export function createDestroyPeerMethod(clazz: MaterializedClass): MaterializedMethod | undefined {
    if (clazz.isGlobalScope() || clazz.isStaticMaterialized) {
        return undefined
    }
    return new MaterializedMethod(
            new PeerMethodSignature(
                PeerMethodSignature.DESTROY,
                '%NEVER_USED$',
                [],
                idl.IDLVoidType,
                clazz.decl,
            ),
            idl.getQualifiedName(clazz.decl, "namespace.name").split('.').join('_'),
            clazz.getImplementationName(),
            idl.IDLVoidType,
            false,
            new Method(
                'destroyPeer',
                new NamedMethodSignature(
                    idl.IDLVoidType,
                    [idl.createReferenceType(clazz.decl)],
                    ['peer']
                )
            )
        )
}

export function getInternalClassName(name: string): string {
    return `${name}Internal`
}

export function getInternalClassQualifiedName(target: idl.IDLEntry, pattern: idl.QNPattern = "package.namespace.name", language?: Language): string {
    return getInternalClassName(qualifiedName(target, language ?? ".", pattern))
}

export function getMaterializedFileName(name:string): string {
    const pascalCase = name.split('_').map(x => capitalize(x)).join('')
    return `Ark${pascalCase}Materialized`
}
