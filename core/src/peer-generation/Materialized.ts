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

import * as idl from '../idl/index.js'
import { ArgConvertor } from '../LanguageWriters/ArgConvertors.js'
import { copyMethod, Field, FieldModifier, Method, METHOD_ACCESS_MODIFIERS, MethodModifier, NamedMethodSignature } from '../LanguageWriters/LanguageWriter.js'
import { getInternalClassName } from './isMaterialized.js'
import { PeerClassBase } from './PeerClass.js'
import { PeerMethod, PeerMethodSignature } from './PeerMethod.js'
import { Language } from "../Language.js"

export class MaterializedField {
    constructor(
        public field: Field,
        public argConvertor: ArgConvertor,
        public outArgConvertor?: ArgConvertor,
        public isNullableOriginalTypeField?: boolean,
        public extraMethodName: string | undefined = undefined
    ) {
        const isReadonly = field.modifiers.includes(FieldModifier.READONLY)
        const isGetter = field.modifiers.includes(FieldModifier.GET)
        const isSetter = field.modifiers.includes(FieldModifier.SET)
        if (isReadonly && (isGetter || isSetter))
            throw new Error(`Unsupported modifiers combination: field can be either readonly or getter/setter or mutable for field ${field.name}`)
        if (isSetter && !isGetter)
            throw new Error(`Unsupported modifiers combination: if setter is defined getter must be defined too for field ${field.name}`)
    }

    get state(): PropertyState {
        const hasGetter = this.field.modifiers.includes(FieldModifier.GET)
        const hasSetter = this.field.modifiers.includes(FieldModifier.SET)
        if (hasGetter || hasSetter) {
            return {
                isAccessor: true,
                hasGetter,
                hasSetter
            }
        } else {
            const isReadonly = this.field.modifiers.includes(FieldModifier.READONLY)
            return {
                isAccessor: false,
                isReadonly
            }
        }
    }
}

export class MaterializedMethod extends PeerMethod {
    constructor(
        public decl: idl.IDLConstructor | idl.IDLMethod | undefined,
        sig: PeerMethodSignature,
        originalParentName: string,
        public implementationParentName: string,
        returnType: idl.IDLType,
        isCallSignature: boolean,
        uniqueOverloadName: string,
        method: Method,
    ) {
        super(decl, sig, originalParentName, returnType, isCallSignature, uniqueOverloadName, method)
    }

    tsReturnType(): idl.IDLType | undefined {
        return this.method.signature.returnType
    }

    getPrivateMethod(asProtected: boolean = false) {
        let privateMethod: MaterializedMethod = this
        const neededModifier = asProtected ? MethodModifier.PROTECTED : MethodModifier.PRIVATE
        if (privateMethod.method.modifiers?.includes(neededModifier)) {
            return privateMethod
        }
        return copyMaterializedMethod(this, {
            method: copyMethod(this.method, {
                modifiers: (this.method.modifiers ?? [])
                    .filter(it => !METHOD_ACCESS_MODIFIERS.has(it))
                    .filter(it => it !== MethodModifier.OVERRIDE)
                    .concat([neededModifier])
            })
        })
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
        method.decl,
        method.sig,
        method.originalParentName,
        method.implementationParentName,
        method.returnType,
        method.isCallSignature,
        method.uniqueOverloadName,
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
        public readonly isRefCounted: boolean = false
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
        undefined,
        new PeerMethodSignature(
            PeerMethodSignature.DESTROY,
            '%NEVER_USED$',
            [],
            idl.createPrimitiveType('void'),
            clazz.decl,
        ),
        idl.getQualifiedName(clazz.decl, "namespace.name").split('.').join('_'),
        clazz.getImplementationName(),
        idl.createPrimitiveType('void'),
        false,
        PeerMethodSignature.DESTROY,
        new Method(
            PeerMethodSignature.DESTROY,
            new NamedMethodSignature(
                idl.createPrimitiveType('void'),
                [idl.createReferenceType(clazz.decl)],
                ['peer']
            )
        )
    )
}

type PropertyState = {
    isAccessor: true,
    hasGetter: boolean,
    hasSetter: boolean
} | {
    isAccessor: false,
    isReadonly: boolean
}

function toAccessor(state: PropertyState): PropertyState {
    return state.isAccessor
        ? state
        : {
            isAccessor: true,
            hasGetter: true,
            hasSetter: !state.isReadonly
        }
}

export function stateToAccessor(decl: idl.IDLInterface, lang: Language, state: PropertyState): PropertyState {
    // Fix Kotlin accessors generation
    if (lang == Language.KOTLIN) return toAccessor(state)
    if (idl.isClassSubkind(decl)) return state
    return toAccessor(state)
}
