/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Location } from "../diagnostictypes";
import { capitalize } from "../util";
import { isOptionalType, getFQName, isContainerType, isNamedNode, isPrimitiveType } from "./discriminators";
import { IDLCallable, IDLCallback, IDLConstant, IDLConstructor, IDLContainerKind, IDLContainerType, IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLFile, IDLImport, IDLInterface, IDLInterfaceSubkind, IDLKind, IDLMethod, IDLNamespace, IDLNode, IDLOptionalType, IDLParameter, IDLPrimitiveType, IDLProperty, IDLReferenceType, IDLType, IDLTypedef, IDLTypeParameterType, IDLUnionType, IDLVersion } from "./node";

const innerIdlSymbol = Symbol("innerIdlSymbol")

export type IDLNodeInitializer = {
    extendedAttributes?: IDLExtendedAttribute[]
    fileName?: string
    documentation?: string
    nodeLocation?: Location
    nameLocation?: Location
    valueLocation?: Location
}

export function createPrimitiveType(name: string): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        name: name,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createOptionalType(element: IDLType, nodeInitializer?: IDLNodeInitializer): IDLOptionalType {
    if (isOptionalType(element) && !nodeInitializer) {
        return element
    }
    if (isOptionalType(element)) {
        return {
            kind: IDLKind.OptionalType,
            type: element.type,
            ...nodeInitializer,
            _idlNodeBrand: innerIdlSymbol,
            _idlTypeBrand: innerIdlSymbol,
        }
    }
    return {
        kind: IDLKind.OptionalType,
        type: element,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
    }
}

export function createNamespace(name: string, members?: IDLEntry[], nodeInitializer?: IDLNodeInitializer): IDLNamespace {
    return {
        kind: IDLKind.Namespace,
        members: members ?? [],
        name: name,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createVersion(value: string[], nodeInitializer?: IDLNodeInitializer): IDLVersion {
    return {
        kind: IDLKind.Version,
        value,
        name: "version",
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createReferenceType(name: string, typeArguments?: IDLType[], nodeInitializer?: IDLNodeInitializer): IDLReferenceType
export function createReferenceType(source: IDLEntry, typeArguments?: IDLType[], nodeInitializer?: IDLNodeInitializer): IDLReferenceType
export function createReferenceType(
    nameOrSource: string | IDLEntry,
    typeArguments?: IDLType[],
    nodeInitializer?: IDLNodeInitializer
): IDLReferenceType {
    let name: string
    if (typeof nameOrSource === 'string') {
        name = nameOrSource
    } else {
        name = getFQName(nameOrSource)
    }
    return {
        kind: IDLKind.ReferenceType,
        name,
        typeArguments,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createContainerType(container: IDLContainerKind, element: IDLType[], nodeInitializer?: IDLNodeInitializer): IDLContainerType {
    return {
        kind: IDLKind.ContainerType,
        containerKind: container,
        elementType: element,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
    }
}

export function createUnionType(types: IDLType[], name?: string, nodeInitializer?: IDLNodeInitializer): IDLUnionType {
    if (types.length < 2)
        throw new Error("IDLUnionType should contain at least 2 types")
    return {
        kind: IDLKind.UnionType,
        name: name ?? "Union_" + types.map(it => generateSyntheticIdlNodeName(it)).join("_"),
        types: types,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createFile(entries: IDLEntry[], fileName?: string, packageClause: string[] = [], nodeInitializer?: IDLNodeInitializer): IDLFile {
    return {
        kind: IDLKind.File,
        packageClause,
        entries: entries,
        fileName,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
    }
}

export function createImport(clause: string[], name?: string, nodeInitializer?: IDLNodeInitializer): IDLImport {
    return {
        kind: IDLKind.Import,
        name: name ?? "",
        clause,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createEnum(
    name: string,
    elements: IDLEnumMember[],
    nodeInitializer: IDLNodeInitializer,
): IDLEnum {
    const result: IDLEnum = {
        kind: IDLKind.Enum,
        name: name,
        elements: elements,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
    elements.forEach(it => it.parent = result)
    return result
}

export function createEnumMember(
    name: string,
    parent: IDLEnum,
    type: IDLPrimitiveType,
    initializer: number | string | undefined,
    nodeInitializer: IDLNodeInitializer = {},
): IDLEnumMember {
    return {
        kind: IDLKind.EnumMember,
        name: name,
        parent,
        type,
        initializer,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createInterface(
    name: string,
    subkind: IDLInterfaceSubkind,
    inheritance: IDLReferenceType[] = [],
    constructors: IDLConstructor[] = [],
    constants: IDLConstant[] = [],
    properties: IDLProperty[] = [],
    methods: IDLMethod[] = [],
    callables: IDLCallable[] = [],
    typeParameters: string[] = [],
    nodeInitializer: IDLNodeInitializer = {},
): IDLInterface {
    return {
        kind: IDLKind.Interface,
        name,
        subkind,
        typeParameters,
        inheritance,
        constructors,
        constants,
        properties,
        methods,
        callables,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createProperty(
    name: string,
    type: IDLType,
    isReadonly: boolean = false,
    isStatic: boolean = false,
    isOptional: boolean = false,
    nodeInitializer: IDLNodeInitializer = {},
): IDLProperty {
    return {
        name,
        kind: IDLKind.Property,
        type,
        isReadonly,
        isStatic,
        isOptional,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createParameter(
    name: string,
    type: IDLType,
    isOptional: boolean = false,
    isVariadic: boolean = false,
    nodeInitializer: IDLNodeInitializer = {},
): IDLParameter {
    return {
        kind: IDLKind.Parameter,
        name: name,
        type: type,
        isOptional,
        isVariadic,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export type IDLMethodInitializer = {
    isAsync: boolean
    isStatic: boolean
    isOptional: boolean
    isFree: boolean // not a member of interface/class
}
export function createMethod(
    name: string,
    parameters: IDLParameter[],
    returnType: IDLType,
    methodInitializer: IDLMethodInitializer = {
        isAsync: false,
        isStatic: false,
        isOptional: false,
        isFree: false,
    },
    nodeInitializer: IDLNodeInitializer = {},
    typeParameters: string[] = []
): IDLMethod {
    return {
        kind: IDLKind.Method,
        name,
        parameters,
        returnType,
        typeParameters,
        ...methodInitializer,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export type IDLCallableInitializer = {
    isAsync: boolean,
    isStatic: boolean,
}
export function createCallable(
    // TODO name here seems useless
    name: string,
    parameters: IDLParameter[],
    returnType: IDLType,
    callableInitializer: IDLCallableInitializer,
    nodeInitializer?: IDLNodeInitializer,
    typeParameters: string[] = []
): IDLCallable {
    return {
        kind: IDLKind.Callable,
        name,
        parameters,
        returnType,
        ...callableInitializer,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createConstructor(
    parameters: IDLParameter[],
    returnType: IDLType | undefined,
    nodeInitializer: IDLNodeInitializer = {},
): IDLConstructor {
    return {
        kind: IDLKind.Constructor,
        name: "$CONSTRUCTOR%",
        parameters,
        returnType,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createCallback(name: string, parameters: IDLParameter[], returnType: IDLType,
    nodeInitializer: IDLNodeInitializer = {}, typeParameters: string[] = []): IDLCallback {
    return {
        kind: IDLKind.Callback,
        name, parameters, returnType, typeParameters,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createTypeParameterReference(name: string, nodeInitializer?: IDLNodeInitializer): IDLTypeParameterType {
    return {
        kind: IDLKind.TypeParameterType,
        name: name,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createTypedef(name: string, type: IDLType, typeParameters: string[] = [], nodeInitializer: IDLNodeInitializer = {}): IDLTypedef {
    return {
        name, type, typeParameters,
        kind: IDLKind.Typedef,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}


export function createConstant(name: string, type: IDLType, value?: string, nodeInitializer: IDLNodeInitializer = {}): IDLConstant {
    return {
        kind: IDLKind.Const,
        name,
        type,
        value,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function generateSyntheticIdlNodeName(type: IDLType): string {
    if (isPrimitiveType(type)) return capitalize(type.name)
    if (isContainerType(type)) {
        const typeArgs = type.elementType.map(it => generateSyntheticIdlNodeName(it)).join("_").replaceAll(".", "_")
        switch (type.containerKind) {
            case "sequence": return "Array_" + typeArgs
            case "record": return "Map_" + typeArgs
            case "Promise": return "Promise_" + typeArgs
            default: throw new Error(`Unknown container type ${type.containerKind}`)
        }
    }
    if (isNamedNode(type))
        return type.name.split('.').map(capitalize).join('_')
    if (isOptionalType(type))
        return `Opt_${generateSyntheticIdlNodeName(type.type)}`
    throw `Can not compute type name of ${IDLKind[type.kind]}`
}

export function generateSyntheticUnionName(types: IDLType[]) {
    return `Union_${types.map(it => generateSyntheticIdlNodeName(it)).join("_").replaceAll(".", "_")}`
}


/// STANDARD LIBRARY

export const IDLPointerType = createPrimitiveType('pointer')
export const IDLVoidType = createPrimitiveType('void')
export const IDLBooleanType = createPrimitiveType('boolean')
export const IDLI8Type = createPrimitiveType('i8')
export const IDLU8Type = createPrimitiveType('u8')
export const IDLI16Type = createPrimitiveType('i16')
export const IDLU16Type = createPrimitiveType('u16')
export const IDLI32Type = createPrimitiveType('i32')
export const IDLU32Type = createPrimitiveType('u32')
export const IDLI64Type = createPrimitiveType('i64')
export const IDLU64Type = createPrimitiveType('u64')
export const IDLF16Type = createPrimitiveType('f16')
export const IDLF32Type = createPrimitiveType('f32')
export const IDLF64Type = createPrimitiveType('f64')
export const IDLBigintType = createPrimitiveType("bigint")
export const IDLNumberType = createPrimitiveType('number')
export const IDLStringType = createPrimitiveType('String')
export const IDLAnyType = createPrimitiveType('any')
export const IDLUndefinedType = createPrimitiveType('undefined')
export const IDLUnknownType = createPrimitiveType('unknown')
export const IDLObjectType = createPrimitiveType('Object')
export const IDLThisType = createPrimitiveType('this')
export const IDLDate = createPrimitiveType('date')
export const IDLBufferType = createPrimitiveType('buffer')

export const IDLUint8ArrayType = createContainerType('sequence', [IDLU8Type])
export const IDLSerializerBuffer = createPrimitiveType('SerializerBuffer')

// Stub for IdlPeerLibrary
export const IDLFunctionType = createPrimitiveType('Function')
export const IDLCustomObjectType = createPrimitiveType('CustomObject')
export const IDLInteropReturnBufferType = createPrimitiveType('InteropReturnBuffer')

export const IDLNullTypeName = "idlize.stdlib.Null"
export const IDLThrowsTypeName = "idlize.stdlib.ThrowsWrapper"

export function isUndefinedType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLUndefinedType.name
}

export function isVoidType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLVoidType.name
}

