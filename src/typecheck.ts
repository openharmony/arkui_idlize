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

import { IDLEntry, forEachChild, isCallback, isClass, isEnum, isInterface, isTypedef } from "./idl"

export enum TypeKind {
    Primitive,
    Container,
    Interface,
    Class,
    Enum,
    Callback,
    AnonymousInterface, // Do we need it?
    Typedef,
}

export class TypeInfo {
    constructor(
        public kind: TypeKind,
        public declaration: IDLEntry|undefined,
        public location: string|undefined = undefined
    ) {}
}

function createPrimitiveType(): TypeInfo {
    return new TypeInfo(TypeKind.Primitive, undefined, undefined)
}

function createContainerType(): TypeInfo {
    return new TypeInfo(TypeKind.Container, undefined, undefined)
}

function createReferenceType(idl: IDLEntry, kind: TypeKind): TypeInfo {
    return new TypeInfo(TypeKind.Interface, idl, idl.fileName)
}

export class TypeTable {
    table = new Map<string, TypeInfo[]>([
        ["undefined", [new TypeInfo(TypeKind.Primitive, undefined, undefined)]],
        ["boolean", [new TypeInfo(TypeKind.Primitive, undefined, undefined)]],
        ["string", [new TypeInfo(TypeKind.Primitive, undefined, undefined)]],
        ["number", [new TypeInfo(TypeKind.Primitive, undefined, undefined)]],
        ["sequence", [new TypeInfo(TypeKind.Container, undefined, undefined)]],
        ["record", [new TypeInfo(TypeKind.Container, undefined, undefined)]]
    ])

    put(name: string, typeInfo: TypeInfo) {
        const alreadyKnown = this.table.get(name)
        if (!alreadyKnown) {
            this.table.set(name, [typeInfo])
            return
        }
        if (alreadyKnown.length > 0) {
            // console.log(`Duplicate type declaration: ${name}`)
        }
        alreadyKnown.push(typeInfo)
    }
    get(name: string): TypeInfo[] {
        return this.table.get(name) ?? []
    }
}

export class TypeChecker {
    typeTable: TypeTable
    constructor(idls?: IDLEntry[], typeTable?: TypeTable) {
        this.typeTable = typeTable ?? new TypeTable()
        idls?.forEach(idl => this.typecheck(idl))
    }

    typecheck(idl: IDLEntry) {
        forEachChild(idl, it => this.recordType(it))
    }

    private createTypeInfo(idl: IDLEntry, typeKind: TypeKind) {
        if (!idl.name) {
            console.log("Trying to record type for an unnamed IDL entry: ", idl)
        }
        this.typeTable.put(idl.name!, new TypeInfo(typeKind, idl, idl.fileName))
    }

    recordType(idl: IDLEntry) {
        if (isInterface(idl)) {
            this.createTypeInfo(idl, TypeKind.Interface)
            return
        }
        if (isEnum(idl)) {
            this.createTypeInfo(idl, TypeKind.Enum)
            return
        }
        if (isClass(idl)) {
            this.createTypeInfo(idl, TypeKind.Class)
            return
        }
        if (isCallback(idl)) {
            this.createTypeInfo(idl, TypeKind.Callback)
            return
        }
        if (isTypedef(idl)) {
            this.createTypeInfo(idl, TypeKind.Typedef)
            return
        }
    }
}

export function testTypecheck(entries: IDLEntry[]) {
    const typeChecker = new TypeChecker(entries)
    typeChecker.typeTable.table.forEach((types, name) => {
        console.log(`${name}:`)
        types.forEach(type =>
            console.log(`\t${TypeKind[type.kind]} ${type.declaration ? `IDLEntry name is ${type.declaration.name}` : `NO DECL`} in ${type.location}`)
        )
    })
}
