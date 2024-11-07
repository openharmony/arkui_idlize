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

import { ArgConvertor, RetConvertor } from "../peer-generation/ArgConvertors";
import { Field, Method, MethodModifier } from "../peer-generation/LanguageWriters"
import { capitalize } from "../util"
import { Skoala } from './utils';

export class WrapperMethod {
    // todo
    constructor(
        public originalParentName: string,
        public method: Method,
        public argConvertors: ArgConvertor[],
        public retConvertor: RetConvertor,
    ) { }

    public isMakeMethod(): boolean {
        return this.toStringName.startsWith("make") 
        && (this.method.modifiers ? this.method.modifiers.includes(MethodModifier.STATIC) : true)
    }

    public hasReceiver(): boolean {
        return !this.method.modifiers?.includes(MethodModifier.STATIC)
    }

    get peerMethodName() {
        const name = this.toStringName
        if (!this.hasReceiver()) return name
        if (name.startsWith("set") ||
            name.startsWith("get")
        ) return name
        return `set${capitalize(name)}`
    }

    get implNamespaceName(): string {
        return `${capitalize(this.originalParentName)}Modifier`
    }

    get implName(): string {
        return `${capitalize(this.toStringName)}Impl`
    }

    get toStringName(): string {
        return this.method.name
    }

    get dummyReturnValue(): string | undefined {
        return undefined
    }

    get retType(): string {
        return "void"
    }

    get apiCall(): string {
        return "GetNodeModifiers()"
    }

    get apiKind(): string {
        return "Modifier"
    }

    maybeCRetType(retConvertor: RetConvertor): string | undefined {
        if (retConvertor.isVoid) return undefined
        return retConvertor.nativeType()
    }

    generateAPIParameters(): string[] {
        const args = this.argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
        })
        const receiver = this.generateReceiver()
        if (receiver) return [`${receiver.argType} ${receiver.argName}`, ...args]
        return args
    }

    generateReceiver(): {argName: string, argType: string} | undefined {
        if (!this.hasReceiver()) return undefined
        return {
            argName: "node",
            argType: "NativePointer"
        }
    }
}

export class WrapperField {
    constructor(
        public field: Field,
        public argConvertor: ArgConvertor,
        public retConvertor: RetConvertor,
    ) { }
}

export class WrapperClass {
    constructor(
        public readonly className: string,
        public readonly isInterface: boolean,
        public readonly baseClass: Skoala.BaseClasses,
        private heritages: string[],
        public readonly fields: WrapperField[],
        public readonly ctor: WrapperMethod | undefined,
        public readonly finalizer: WrapperMethod | undefined,
        public readonly methods: WrapperMethod[]
    ) { }

    get superClassName(): string {
        return this.heritages[0]
    }

    getComponentName(): string {
        return this.className
    }
}
