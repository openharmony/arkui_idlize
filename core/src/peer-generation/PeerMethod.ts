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
import * as idl from '../idl'
import { generatorTypePrefix } from "../config"
import { asPromise, IDLType } from "../idl"
import { IdlNameConvertor } from "../LanguageWriters"
import { ArgConvertor, createOutArgConvertor, isVMContextMethod } from "../LanguageWriters/ArgConvertors"
import { mangleMethodName, Method, MethodModifier } from "../LanguageWriters/LanguageWriter"
import { capitalize, isDefined } from "../util"
import { PrimitiveTypesInstance } from "./PrimitiveType"
import { ReferenceResolver } from "./ReferenceResolver"
import { flattenUnionType } from './unions'
import { PeerLibrary } from './PeerLibrary'

export class PeerMethodArg {
    constructor(
        public readonly name: string,
        public readonly type: idl.IDLType,
    ) {}
}

export class PeerMethodSignature {
    constructor(
        // contextual name of method
        public readonly name: string,
        // unique name of method (used in global scopes like interop)
        public readonly fqname: string,
        public readonly args: PeerMethodArg[],
        public readonly returnType: idl.IDLType,
        public readonly context: idl.IDLEntry | undefined = undefined,
        // only modifiers affecting signature. Private, public, static and others - does not belong here
        public readonly modifiers: (MethodModifier.FORCE_CONTEXT | MethodModifier.THROWS)[] = [],
    ) { }

    // whilt migration we're creating PeerMethod, but in reality we shoudnt (created method does not goes through interop and does not have representation in native)
    static stub(): PeerMethodSignature {
        return new PeerMethodSignature(
            "%STUB$",
            "%STUB$",
            [],
            idl.IDLVoidType,
            undefined,
        )
    }

    static generateOverloadPostfix(decl: idl.IDLConstructor | idl.IDLMethod | idl.IDLCallable | idl.IDLProperty): string {
        if (!decl.parent || !idl.isInterface(decl.parent))
            return ``
        if (idl.isMethod(decl) || idl.isProperty(decl)) {
            let sameNamed: idl.IDLEntry[] = [
                ...decl.parent.properties,
                ...decl.parent.methods,
            ].filter(it => it.name === decl.name)
            const overloadIndex = sameNamed.length > 1 ? sameNamed.indexOf(decl).toString() : ''
            return overloadIndex
        }
        if (idl.isConstructor(decl)) {
            const sameNamed = decl.parent.constructors.filter(it => it.name === decl.name)
            const overloadIndex = sameNamed.length > 1 ? sameNamed.indexOf(decl).toString() : ''
            return overloadIndex
        }
        if (idl.isCallable(decl)) {
            const sameNamed = decl.parent.callables
            const overloadIndex = sameNamed.length > 1 ? sameNamed.indexOf(decl).toString() : ''
            return overloadIndex
        }
        throw new Error("unexpected type of declaration")
    }

    static get CTOR(): string { return "construct" }
    static get GET_FINALIZER(): string { return "getFinalizer" }
    static get DESTROY(): string { return "destroyPeer" }
}

export class PeerMethod {
    protected overloadIndex?: number
    constructor(
        public sig: PeerMethodSignature,
        public originalParentName: string,
        public returnType: IDLType,
        public isCallSignature: boolean,
        public method: Method,
    ) { 
        // todo remove me
        if (method.modifiers?.includes(MethodModifier.FORCE_CONTEXT))
            sig.modifiers.push(MethodModifier.FORCE_CONTEXT)
        if (method.modifiers?.includes(MethodModifier.THROWS))
            sig.modifiers.push(MethodModifier.THROWS)
    }

    argConvertors(library: PeerLibrary): ArgConvertor[] {
        return this.sig.args.map(it => library.typeConvertor(it.name, it.type, false))
    }

    argAndOutConvertors(library: PeerLibrary): ArgConvertor[] {
        const convertors = this.argConvertors(library)
        const outArgConvertor = createOutArgConvertor(library, this.sig.returnType, this.sig.args.map(it => it.name))
        return outArgConvertor ? convertors.concat(outArgConvertor) : convertors
    }

    static markAndGroupOverloads(methods: PeerMethod[]): PeerMethod[] {
        let groupedMethods: PeerMethod[] = []
        for (const peerMethod of methods) {
            if (isDefined(peerMethod.overloadIndex)) continue
            const sameNamedMethods = methods.filter(it => it.method.name === peerMethod.method.name)
            if (sameNamedMethods.length > 1)
                sameNamedMethods.forEach((it, index) => it.overloadIndex = index)
            groupedMethods = groupedMethods.concat(sameNamedMethods)
        }
        return groupedMethods
    }

    setSameOverloadIndex(copyFrom: PeerMethod) {
        this.overloadIndex = copyFrom.overloadIndex
    }
}
