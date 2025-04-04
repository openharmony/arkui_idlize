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

import * as webidl2 from "webidl2"
import * as fs from "fs"
import {
    isAttribute, isCallback, isClass, isConstant, isConstructor, isDictionary, isEnum, isInterface, isOperation, isOptional,
    isPromiseTypeDescription,
    isRecordTypeDescription,
    isSequenceTypeDescription,
    isSingleTypeDescription, isTypedef, isUnionTypeDescription,
    isUnspecifiedGenericTypeDescription
} from "./webidl2-utils"
import { toString } from "./toString"
import * as idl from "../idl"
import * as lib from "../library"
import { isDefined, stringOrNone, warn } from "../util"
import { generateSyntheticUnionName } from "../peer-generation/idl/common"

export type WebIDLTokenCollection = Record<string, webidl2.Token | null | undefined>
export type IDLTokenInfoMap = Map<unknown, WebIDLTokenCollection>

function getTokens(node:webidl2.AbstractBase): WebIDLTokenCollection {
    return (node as any).tokens
}

const syntheticTypes = new Map<string, idl.IDLEntry>()

export function addSyntheticType(name: string, type: idl.IDLEntry) {
    if (syntheticTypes.has(name))
        warn(`duplicate synthetic type name "${name}"`) ///throw?
    syntheticTypes.set(name, type)
} // check

export function resolveSyntheticType(type: idl.IDLReferenceType): idl.IDLEntry | undefined {
    return syntheticTypes.get(type.name)
}

class IDLDeserializer {

    constructor(
        private info: IDLTokenInfoMap
    ) {}

    ///

    withInfo<T>(from:webidl2.AbstractBase, result:T): T {
        this.info.set(result, getTokens(from))
        return result
    }

    ///

    toIDLNode(file: string, node: webidl2.IDLRootType): idl.IDLEntry {
        return this.toIDLNodeForward(file, node)
    }
    toIDLNodeForward(file: string, node: webidl2.IDLRootType): idl.IDLEntry {
        if (isEnum(node)) {
            return this.toIDLEnum(file, node)
        }
        if (this.isImport(node)) {
            return this.toIDLImport(node)
        }
        if (isClass(node)) {
            return this.toIDLInterface(file, node)
        }
        if (isInterface(node)) {
            return this.toIDLInterface(file, node)
        }
        if (isCallback(node)) {
            return this.toIDLCallback(file, node)
        }
        if (isTypedef(node)) {
            return this.toIDLTypedef(file, node)
        }
        if (isDictionary(node)) {
            return this.toIDLDictionary(file, node)
        }
        if (this.isNamespace(node)) {
            return this.toIDLNamespace(file, node)
        }
        if (this.isVersion(node)) {
            return this.toIDLVersion(file, node)
        }
        if (isAttribute(node as webidl2.IDLNamespaceMemberType)) {
            return this.toIDLProperty(file, node as webidl2.AttributeMemberType)
        }
        if (isOperation(node as webidl2.IDLNamespaceMemberType)) {
            return this.toIDLMethod(file, node as webidl2.OperationMemberType, true)
        }
        if (isConstant(node)) {
            return this.toIDLConstant(file, node)
        }
        throw new Error(`unexpected node type: ${toString(node)}`)
    }
    toIDLImport(node: webidl2.ImportType): idl.IDLImport {
        // console.log(node)
        return this.withInfo(node, idl.createImport(node.clause.split("."), node.alias||undefined))
    }
    interfaceSubkind(node: webidl2.InterfaceType): idl.IDLInterfaceSubkind {
        const nodeIDLEntity = node.extAttrs.find(it => it.name === "Entity")?.rhs?.value
        if (nodeIDLEntity == idl.IDLEntity.Class) return idl.IDLInterfaceSubkind.Class
        if (nodeIDLEntity == idl.IDLEntity.Interface) return idl.IDLInterfaceSubkind.Interface
        if (nodeIDLEntity == idl.IDLEntity.Tuple) return idl.IDLInterfaceSubkind.Tuple
        return idl.IDLInterfaceSubkind.Interface
    }
    toIDLInterface(file: string, node: webidl2.InterfaceType): idl.IDLInterface {
        const result = idl.createInterface(
            node.name,
            this.interfaceSubkind(node),
            (()=>{
                if (!node.inheritance)
                    return []
                const parentTypeArgs = this.extractTypeArguments(file, node.inheritanceExtAttrs ?? [], idl.IDLExtendedAttributes.TypeArguments)
                const parentType = idl.createReferenceType(node.inheritance, parentTypeArgs)
                parentType.fileName = file
                if (node.inheritanceExtAttrs)
                    parentType.extendedAttributes = this.toExtendedAttributes(node.inheritanceExtAttrs)?.filter(it => it.name !== idl.IDLExtendedAttributes.TypeArguments)
                return [parentType]
            })(),
            node.members
                .filter(isConstructor)
                .map(it => this.toIDLConstructor(file, it)),
            [],
            node.members
                .filter(isAttribute)
                .map(it => this.toIDLProperty(file, it)),
            node.members
                .filter(isOperation)
                .filter(it => !this.isCallable(it))
                .map(it =>this.toIDLMethod(file, it, false)),
            node.members
                .filter(isOperation)
                .filter(it => this.isCallable(it))
                .map(it => this.toIDLCallable(file, it)),
                this.findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","),
            {
                fileName: file,
                documentation: this.makeDocs(node),
                extendedAttributes: this.toExtendedAttributes(node.extAttrs),
            }
        )
        this.info.set(result, getTokens(node))
        if (node.extAttrs.find(it => it.name === "Synthetic"))
            addSyntheticType(node.name, result)
        return result
    }
    toIDLType(file: string, type: webidl2.IDLTypeDescription | string, extAttrs?: webidl2.ExtendedAttribute[]): idl.IDLType {
        if (typeof type === "string") {
            // is it IDLStringType?
            const refType = idl.createReferenceType(type)
            refType.fileName = file
            refType.typeArguments = this.extractTypeArguments(file, extAttrs, idl.IDLExtendedAttributes.TypeArguments)
            return refType
        }
        if (type.nullable) {
            return this.withInfo(type,
                idl.createOptionalType(
                    this.toIDLType(file, { ...type, nullable: false }, extAttrs)
                )
            )
        }
        if (isUnionTypeDescription(type)) {
            const types = type.idlType
                .map(it => this.toIDLType(file, it, undefined))
                .filter(isDefined)
            const name = generateSyntheticUnionName(types)
            return this.withInfo(type, idl.createUnionType(types, name))
        }
        if (isSingleTypeDescription(type)) {
            // must match with primitive types in idl.ts
            switch (type.idlType) {
                case idl.IDLPointerType.name: return idl.IDLPointerType
                case idl.IDLVoidType.name: return idl.IDLVoidType
                case idl.IDLBooleanType.name: return idl.IDLBooleanType
                case idl.IDLObjectType.name: return idl.IDLObjectType
                case idl.IDLI8Type.name: return idl.IDLI8Type
                case idl.IDLU8Type.name: return idl.IDLU8Type
                case idl.IDLI16Type.name: return idl.IDLI16Type
                case idl.IDLU16Type.name: return idl.IDLU16Type
                case idl.IDLI32Type.name: return idl.IDLI32Type
                case idl.IDLU32Type.name: return idl.IDLU32Type
                case idl.IDLI64Type.name: return idl.IDLI64Type
                case idl.IDLU64Type.name: return idl.IDLU64Type
                case idl.IDLF32Type.name: return idl.IDLF32Type
                case idl.IDLF64Type.name: return idl.IDLF64Type
                case idl.IDLBigintType.name: return idl.IDLBigintType
                case idl.IDLNumberType.name: return idl.IDLNumberType
                case idl.IDLStringType.name: return idl.IDLStringType
                case idl.IDLAnyType.name: return idl.IDLAnyType
                case idl.IDLUndefinedType.name: return idl.IDLUndefinedType
                case idl.IDLUnknownType.name: return idl.IDLUnknownType
                case idl.IDLObjectType.name: return idl.IDLObjectType
                case idl.IDLThisType.name: return idl.IDLThisType
                case idl.IDLDate.name: return idl.IDLDate
                case idl.IDLBufferType.name: return idl.IDLBufferType
                case idl.IDLSerializerBuffer.name: return idl.IDLSerializerBuffer
            }
            const combinedExtAttrs = (type.extAttrs ?? []).concat(extAttrs ?? [])
            const idlRefType = idl.createReferenceType(type.idlType)
            idlRefType.fileName = file
            idlRefType.typeArguments = this.extractTypeArguments(file, combinedExtAttrs, idl.IDLExtendedAttributes.TypeArguments)
            idlRefType.extendedAttributes = this.toExtendedAttributes(combinedExtAttrs)
            return this.withInfo(type, idlRefType)
        }
        if (isSequenceTypeDescription(type) || isPromiseTypeDescription(type) || isRecordTypeDescription(type)) {
            return this.withInfo(type,
                idl.createContainerType(
                    type.generic,
                    type.idlType.map(it => this.toIDLType(file, it, undefined))
                )
            )
        }
        if (isUnspecifiedGenericTypeDescription(type)) {
            return this.withInfo(type,
                idl.createUnspecifiedGenericType(
                    type.generic,
                    type.idlType.map(it => this.toIDLType(file, it, undefined))
                )
            )
        }
        throw new Error(`unexpected type: ${toString(type)}`)
    }
    toIDLCallable(file: string, node: webidl2.OperationMemberType): idl.IDLCallable {
        if (!node.idlType) {
            throw new Error(`method with no type ${toString(node)}`)
        }
        const returnType = this.toIDLType(file, node.idlType, node.extAttrs)
        if (idl.isReferenceType(returnType)) {
            const returnTypeArgs = this.extractTypeArguments(file, node.extAttrs, idl.IDLExtendedAttributes.TypeArguments)
            returnType.typeArguments = returnTypeArgs
        }
        return this.withInfo(node, idl.createCallable(
            node.name ?? "",
            node.arguments.map(it => this.toIDLParameter(file, it)),
            returnType,
            {
                isStatic: node.special === "static",
                isAsync: node.async,
            }, {
                documentation: this.makeDocs(node),
                extendedAttributes: this.toExtendedAttributes(node.extAttrs),
            }, this.findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","),
        ))
    }
    toIDLMethod(file: string, node: webidl2.OperationMemberType, isFree:boolean = false): idl.IDLMethod {
        if (!node.idlType) {
            throw new Error(`method with no type ${toString(node)}`)
        }
        const returnType = this.toIDLType(file, node.idlType, node.extAttrs)
        if (idl.isReferenceType(returnType))
            returnType.typeArguments = this.extractTypeArguments(file, node.extAttrs, idl.IDLExtendedAttributes.TypeArguments)
        return this.withInfo(node, idl.createMethod(
            node.name ?? "",
            node.arguments.map(it => this.toIDLParameter(file, it ?? new Map())),
            returnType,
            {
                isStatic: node.special === "static",
                isAsync: node.async,
                isOptional: isOptional(node),
                isFree
            }, {
                documentation: this.makeDocs(node),
                extendedAttributes: this.toExtendedAttributes(node.extAttrs),
            }, this.findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","),
        ))
    }
    toIDLConstructor(file: string, node: webidl2.ConstructorMemberType): idl.IDLConstructor {
        return this.withInfo(node, idl.createConstructor(
            node.arguments.map(it => this.toIDLParameter(file, it)),
            undefined, {
            documentation: this.makeDocs(node),
        }))
    }
    toIDLParameter(file: string, node: webidl2.Argument): idl.IDLParameter {
        return this.withInfo(node, idl.createParameter(
            node.name,
            this.toIDLType(file, node.idlType, node.extAttrs),
            node.optional,
            node.variadic, {
            fileName: file,
        }))
    }
    toIDLCallback(file: string, node: webidl2.CallbackType): idl.IDLCallback {
        const result = idl.createCallback(
            node.name,
            node.arguments.map(it => this.toIDLParameter(file, it)),
            this.toIDLType(file, node.idlType, undefined), {
            fileName: file,
            extendedAttributes: this.toExtendedAttributes(node.extAttrs),
            documentation: this.makeDocs(node),
        })
        if (node.extAttrs.find(it => it.name === "Synthetic"))
            addSyntheticType(node.name, result)
        return this.withInfo(node, result)
    }
    toIDLTypedef(file: string, node: webidl2.TypedefType): idl.IDLTypedef {
        return this.withInfo(node, idl.createTypedef(
            node.name,
            this.toIDLType(file, node.idlType, undefined),
            this.findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","), {
            extendedAttributes: this.toExtendedAttributes(node.extAttrs),
            documentation: this.makeDocs(node),
            fileName: file,
        }))
    }
    toIDLConstant(file: string, node: webidl2.ConstantMemberType) {
        return this.withInfo(node, idl.createConstant(node.name, this.toIDLType(file, node.idlType, undefined), this.constantValue(node)))
    }
    toIDLDictionary(file: string, node: webidl2.DictionaryType): idl.IDLEnum {
        const result = idl.createEnum(
            node.name,
            [], {
            documentation: this.makeDocs(node),
            extendedAttributes: this.toExtendedAttributes(node.extAttrs),
            fileName: file,
        })
        result.elements = node.members.map(it => this.toIDLEnumMember(file, it, result))
        return this.withInfo(node, result)
    }
    toIDLNamespace(file: string, node: webidl2.NamespaceType): idl.IDLNamespace {
        const namespace = idl.createNamespace(
            node.name,
            [],
            {
                extendedAttributes: this.toExtendedAttributes(node.extAttrs),
                fileName: file
            }
        )
        namespace.members = node.members.map(it => this.toIDLNodeForward(file, it))
        return this.withInfo(node, namespace)
    }
    toIDLVersion(file: string, node: webidl2.VersionType): idl.IDLVersion {
        return this.withInfo(node, idl.createVersion(
            node.value,
            {
                extendedAttributes: this.toExtendedAttributes(node.extAttrs),
                fileName: file
            }
        ))
    }
    toIDLProperty(file: string, node: webidl2.AttributeMemberType): idl.IDLProperty {
        return this.withInfo(node, idl.createProperty(
            node.name,
            this.toIDLType(file, node.idlType, undefined),
            node.readonly,
            node.special === "static",
            isOptional(node), {
            documentation: this.makeDocs(node),
            fileName: file,
            extendedAttributes: this.toExtendedAttributes(node.extAttrs)
        }))
    }
    toIDLEnumMember(file: string, node: webidl2.DictionaryMemberType, parent: idl.IDLEnum): idl.IDLEnumMember {
        let initializer = undefined
        if (node.default?.type == "string") {
            initializer = this.unescapeString(node.default.value)
        } else if (node.default?.type == "number") {
            initializer = +(node.default?.value)
        } else if (node.default == null) {
            initializer = undefined
        } else {
            throw new Error(`Not representable enum initializer: ${node.default}`)
        }
        return this.withInfo(node, idl.createEnumMember(
            node.name,
            parent,
            this.toIDLType(file, node.idlType, undefined) as idl.IDLPrimitiveType,
            initializer, {
            extendedAttributes: this.toExtendedAttributes(node.extAttrs),
        }))
    }
    toExtendedAttributes(extAttrs: webidl2.ExtendedAttribute[]): idl.IDLExtendedAttribute[] | undefined {
        return extAttrs.map(it => {
            return this.withInfo(it, { name: it.name, value: this.toExtendedAttributeValue(it) })
        })
    }
    toExtendedAttributeValue(attr: webidl2.ExtendedAttribute): stringOrNone {
        // TODO: be smarter about RHS.
        if (attr.rhs?.value instanceof Array)
            return attr.rhs.value.map(v => v.value).join(",")
        if (typeof(attr.rhs?.value) === 'string')
            return this.unescapeString(attr.rhs.value)
        return
    }
    toIDLEnum(file: string, node: webidl2.EnumType): idl.IDLEnum {
        const result = idl.createEnum(
            node.name,
            [], {
            fileName: file,
            documentation: this.makeDocs(node),
            extendedAttributes: this.toExtendedAttributes(node.extAttrs),
        })
        result.elements = node.values.map((it: { value: string }) => idl.createEnumMember(
            it.value,
            result,
            idl.IDLNumberType,
            undefined
        ))
        return this.withInfo(node, result)
    }

    ///

    isNamespace(node: webidl2.IDLRootType): node is webidl2.NamespaceType {
        return node.type === 'namespace'
    }
    isVersion(node: webidl2.IDLRootType): node is webidl2.NamespaceType {
        return node.type === 'version'
    }
    isPackage(node: webidl2.IDLRootType): node is webidl2.PackageType {
        return node.type === 'package'
    }
    isImport(node: webidl2.IDLRootType): node is webidl2.ImportType {
        return node.type === 'import'
    }
    isCallable(node: webidl2.IDLInterfaceMemberType): boolean {
        return node.extAttrs.some(it => it.name == "Invoke")
    }

    ///

    extractTypeArguments(file: string,
        extAttrs: webidl2.ExtendedAttribute[] | undefined,
        attribute: idl.IDLExtendedAttributes
    ): idl.IDLType[] | undefined {
        const attr = extAttrs?.find(it => it.name === attribute)
        if (!attr)
            return undefined
        let value = this.toExtendedAttributeValue(attr)!
        return value
            ?.split(",")  // TODO need real parsing here. What about "<T, Map<K, Callback<K,R>>, U>"
            ?.map(it => this.toIDLType(file, it))
    }
    constantValue(node: webidl2.ConstantMemberType): string {
        switch (node.value.type) {
            case "string":
                return `"${(node.value as webidl2.ValueDescriptionString).value}"`
            case "number":
                return (node.value as webidl2.ValueDescriptionNumber).value
            case "boolean":
                return (node.value as webidl2.ValueDescriptionBoolean).value.toString()
            case "null":
                return "null"
            case "Infinity":
                return "Infinity"
            case "NaN":
                return "NaN"
            case "sequence":
                return `[${(node.value as webidl2.ValueDescriptionSequence).value.join(',')}]`
            case "dictionary":
                return `new Map()`
            default:
                return "undefined"
        }
    }
    unescapeString(value: string): string {
        if (!value.length || value[0] !== '"')
            return value
        value = value.slice(1,-1)
        value = value.replace(/\\((['"\\bfnrtv])|([0-7]{1-3})|x([0-9a-fA-F]{2})|u([0-9a-fA-F]{4}))/g, (_, all, c, oct, h2, u4) => {
            if (c !== undefined) {
                switch (c) {
                    case "'": return "'";
                    case '"': return '"';
                    case "\\": return "\\";
                    case "b": return "\b";
                    case "f": return "\f";
                    case "n": return "\n";
                    case "r": return "\r";
                    case "t": return "\t";
                    case "v": return "\v";
                }
            } else if (oct !== undefined) {
                return String.fromCharCode(parseInt(oct, 8));
            } else if (h2 !== undefined) {
                return String.fromCharCode(parseInt(h2, 16));
            } else if (u4 !== undefined) {
                return String.fromCharCode(parseInt(u4, 16));
            }
            throw new Error(`unknown escape sequence: ${_}`);
        });

        return value;
    }
    makeDocs(node: webidl2.AbstractBase): stringOrNone {
        let docs = undefined
        node.extAttrs.forEach(it => {
            if (it.name == "Documentation") docs = it.rhs?.value
        })
        return docs
    }
    findExtendedAttribute(extAttrs: webidl2.ExtendedAttribute[], name: idl.IDLExtendedAttributes): stringOrNone {
        const attr = extAttrs.find(it => it.name === name)
        return attr ? this.toExtendedAttributeValue(attr) : undefined
    }
}

export function toIDLFile(fileName: string, content?: string): [idl.IDLFile, IDLTokenInfoMap] {
    const lexicalInfo: IDLTokenInfoMap = new Map()
    const deserializer = new IDLDeserializer(lexicalInfo)
    if (undefined === content)
        content = fs.readFileSync(fileName).toString()
    let packageClause: string[] = []
    const entries = webidl2.parse(content)
        .filter(it => {
            if (!it.type)
                return false
            if (deserializer.isPackage(it)) {
                packageClause = it.clause.split(".")
                return false
            }
            return true
        })
        .map(it => deserializer.toIDLNode(fileName, it))
    const file = idl.createFile(entries, fileName, packageClause)
    file.text = content
    return [idl.linkParentBack(file), lexicalInfo]
}
