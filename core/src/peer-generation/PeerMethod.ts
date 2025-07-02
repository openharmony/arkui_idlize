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
import { IDLType } from "../idl"
import { ArgConvertor, createOutArgConvertor } from "../LanguageWriters/ArgConvertors"
import { Method, MethodModifier } from "../LanguageWriters/LanguageWriter"
import { isDefined } from "../util"
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

    static generateOverloadPostfix(decl: idl.IDLConstructor | idl.IDLMethod | idl.IDLCallable | idl.IDLProperty): string {
        if (!decl.parent)
            return ``
        let sameNamed: idl.IDLEntry[] = []
        if (idl.isMethod(decl) || idl.isProperty(decl)) {
            let members: idl.IDLEntry[] = []
            if (idl.isInterface(decl.parent))
                members = [...decl.parent.properties, ...decl.parent.methods]
            else if (idl.isNamespace(decl.parent))
                members = decl.parent.members
            else if (idl.isFile(decl.parent))
                members = decl.parent.entries.filter(idl.isMethod)
            sameNamed = members.filter(it => it.name === decl.name)
        } else if (idl.isConstructor(decl) && idl.isInterface(decl.parent)) {
            sameNamed = decl.parent.constructors
        } else if (idl.isCallable(decl) && idl.isInterface(decl.parent)) {
            sameNamed = decl.parent.callables
        } else {
            throw new Error("unexpected type of declaration")
        }
        return sameNamed.length > 1 ? sameNamed.indexOf(decl).toString() : ''
    }

    static get CTOR(): string { return "construct" }
    static get GET_FINALIZER(): string { return "getFinalizer" }
    static get DESTROY(): string { return "destroyPeer" }
}

export class PeerMethod {
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
}
