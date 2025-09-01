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
import { isDefined, stringOrNone, warn } from "../util"
import { collapseTypes, generateSyntheticUnionName } from "../peer-generation/idl/common"
import { commonRange, Location, Range } from "../diagnostictypes"
import { DiagnosticMessageGroup, LoadingFatal, ParsingFatal, InternalFatal } from "../diagnosticmessages"
import { FatalParserException, Parser } from "./parser"
import { outputDiagnosticMessageFormatted } from "../formatter"

export type WebIDLTokenCollection = Record<string, webidl2.Token | null | undefined>
export type IDLTokenInfoMap = Map<unknown, WebIDLTokenCollection>

function getTokens(node: webidl2.AbstractBase): WebIDLTokenCollection {
    return (node as any).tokens
}

const extendedAttributesWithTypesValue: string[] = [
    idl.IDLExtendedAttributes.TypeArguments,
    idl.IDLExtendedAttributes.TypeParametersDefaults,
]
const syntheticTypes = new Map<string, idl.IDLEntry>()

export function addSyntheticType(name: string, type: idl.IDLEntry) {
    if (syntheticTypes.has(name)) {
        warn(`duplicate synthetic type name "${name}"`)
    }
    syntheticTypes.set(name, type)
} // check

export function resolveSyntheticType(type: idl.IDLReferenceType): idl.IDLEntry | undefined {
    return syntheticTypes.get(type.name)
}

class IDLDeserializer {

    private namespacePathNames: string[] = []
    private currentPackage: string[] = []
    private genericsScopes: Set<string>[] = []

    enterGenericScope(generics: string[] | undefined) {
        this.genericsScopes.push(new Set(generics ?? []))
    }

    constructor(
        private info: IDLTokenInfoMap
    ) { }

    ///

    withInfo<T>(from: webidl2.AbstractBase, result: T): T {
        this.info.set(result, getTokens(from))
        return result
    }
    setPackage(pkg: string[]) {
        this.currentPackage = pkg
    }

    ///

    sanitizeTypeParameter(param: string): string {
        const extendsIdx = param.indexOf('extends')
        if (extendsIdx !== -1) {
            return param.substring(0, extendsIdx).trim()
        }
        const eqIdx = param.indexOf('=')
        if (eqIdx !== -1) {
            return param.substring(0, eqIdx).trim()
        }
        return param
    }

    extractGenerics(extAttrs: webidl2.ExtendedAttribute[]): string[] | undefined {
        return this.findExtendedAttribute(extAttrs, idl.IDLExtendedAttributes.TypeParameters)
            ?.split(",")
            ?.map(it => this.sanitizeTypeParameter(it))
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
        return this.withInfo(node, idl.createImport(node.clause.split("."), node.alias || undefined))
    }
    interfaceSubkind(node: webidl2.InterfaceType): idl.IDLInterfaceSubkind {
        const nodeIDLEntity = node.extAttrs.find(it => it.name === "Entity")?.rhs?.value
        switch (nodeIDLEntity) {
            case idl.IDLEntity.Class: return idl.IDLInterfaceSubkind.Class
            case idl.IDLEntity.Literal: return idl.IDLInterfaceSubkind.AnonymousInterface
            case idl.IDLEntity.Tuple: return idl.IDLInterfaceSubkind.Tuple
            default: return idl.IDLInterfaceSubkind.Interface
        }
    }
    toIDLInterface(file: string, node: webidl2.InterfaceType): idl.IDLInterface {
        const generics = this.extractGenerics(node.extAttrs)
        this.enterGenericScope(generics)
        const subkind = this.interfaceSubkind(node)
        const result = idl.createInterface(
            node.name,
            subkind,
            (() => {
                if (!node.inheritance) {
                    return []
                }
                const implementations: idl.IDLReferenceType[] = []
                node.inheritance.forEach(it => {
                    const attributes = it.extAttrs
                    const parentTypeArgs = this.extractTypeArguments(file, attributes ?? [], idl.IDLExtendedAttributes.TypeArguments)
                    const attrs = this.toExtendedAttributes(file, attributes ?? []) // ?.filter(it => it.name !== idl.IDLExtendedAttributes.TypeArguments)
                    const ref = idl.createReferenceType(it.inheritance, parentTypeArgs, {
                        extendedAttributes: attrs
                    })
                    implementations.push(ref)
                })
                return implementations
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
                .map(it => this.toIDLMethod(file, it, false)),
            node.members
                .filter(isOperation)
                .filter(it => this.isCallable(it))
                .map(it => this.toIDLCallable(file, it)),
            generics,
            {
                fileName: file,
                documentation: this.makeDocs(node),
                extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
            }
        )
        this.genericsScopes.pop()
        this.info.set(result, getTokens(node))
        if (node.extAttrs.find(it => it.name === "Synthetic")) {
            const fqName = this.currentPackage.concat(this.namespacePathNames).concat([node.name]).join('.')
            addSyntheticType(fqName, result)
        }
        return result
    }
    toIDLType(file: string, type: webidl2.IDLTypeDescription | string, extAttrs?: webidl2.ExtendedAttribute[], suggestedName?: string): idl.IDLType {
        if (typeof type === "string") {
            // is it IDLStringType?
            const refType = idl.createReferenceType(type)
            refType.fileName = file
            // Here is a bug: type.extAttrs are ignored, so typeArguments on ([TypeArguments="T"] Something) are always lost
            // That must be fixed together with fixing non-generic placeholders on generic types in pipelines (like WrappedBuilder)
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
            let types = type.idlType
                .map(it => this.toIDLType(file, it, undefined))
                .filter(isDefined)
            if (types.includes(idl.IDLUndefinedType)) {
                types = types.filter(it => it !== idl.IDLUndefinedType)
                return this.withInfo(type, idl.createOptionalType(collapseTypes(types)))
            }
            const name = suggestedName ?? generateSyntheticUnionName(types)
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
            let idlRefType: idl.IDLType
            if (this.genericsScopes.some(it => it.has(type.idlType))) {
                idlRefType = idl.createTypeParameterReference(type.idlType)
            } else {
                const ref = idl.createReferenceType(type.idlType)
                ref.typeArguments = this.extractTypeArguments(file, combinedExtAttrs, idl.IDLExtendedAttributes.TypeArguments)
                idlRefType = ref
            }
            idlRefType.fileName = file
            idlRefType.extendedAttributes = this.toExtendedAttributes(file, combinedExtAttrs)
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
        const generics = this.extractGenerics(node.extAttrs)
        this.enterGenericScope(generics)
        const returnType = this.toIDLType(file, node.idlType, node.extAttrs)
        if (idl.isReferenceType(returnType)) {
            const returnTypeArgs = this.extractTypeArguments(file, node.extAttrs, idl.IDLExtendedAttributes.TypeArguments)
            returnType.typeArguments = returnTypeArgs
        }
        const result = this.withInfo(node, idl.createCallable(
            node.name ?? "",
            node.arguments.map(it => this.toIDLParameter(file, it)),
            returnType,
            {
                isStatic: node.special === "static",
                isAsync: node.async,
            }, {
            documentation: this.makeDocs(node),
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
        }, generics))
        this.genericsScopes.pop()
        return result
    }
    toIDLMethod(file: string, node: webidl2.OperationMemberType, isFree: boolean = false): idl.IDLMethod {
        if (!node.idlType) {
            throw new Error(`method with no type ${toString(node)}`)
        }
        const generics = this.extractGenerics(node.extAttrs)
        this.enterGenericScope(generics)
        const returnType = this.toIDLType(file, node.idlType, node.extAttrs)
        const result = this.withInfo(node, idl.createMethod(
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
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
        }, generics,
        ))
        this.genericsScopes.pop()
        return result
    }
    toIDLConstructor(file: string, node: webidl2.ConstructorMemberType): idl.IDLConstructor {
        return this.withInfo(node, idl.createConstructor(
            node.arguments.map(it => this.toIDLParameter(file, it)),
            undefined, {
            documentation: this.makeDocs(node),
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
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
        const generics = this.extractGenerics(node.extAttrs)
        this.enterGenericScope(generics)
        const result = idl.createCallback(
            node.name,
            node.arguments.map(it => this.toIDLParameter(file, it)),
            this.toIDLType(file, node.idlType, undefined),
            {
                fileName: file,
                extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
                documentation: this.makeDocs(node),
            },
            generics
        )
        if (node.extAttrs.find(it => it.name === "Synthetic")) {
            const fqName = this.currentPackage.concat(this.namespacePathNames).concat([node.name]).join('.')
            addSyntheticType(fqName, result)
        }
        this.genericsScopes.pop()
        return this.withInfo(node, result)
    }
    toIDLTypedef(file: string, node: webidl2.TypedefType): idl.IDLTypedef {
        const generics = this.extractGenerics(node.extAttrs)
        this.enterGenericScope(generics)
        const result = this.withInfo(node, idl.createTypedef(
            node.name,
            this.toIDLType(file, node.idlType, undefined, node.name),
            generics,
            {
                extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
                documentation: this.makeDocs(node),
                fileName: file,
            }))
        this.genericsScopes.pop()
        return result
    }
    toIDLConstant(file: string, node: webidl2.ConstantMemberType) {
        return this.withInfo(node, idl.createConstant(node.name, this.toIDLType(file, node.idlType, undefined), this.constantValue(node)))
    }
    toIDLDictionary(file: string, node: webidl2.DictionaryType): idl.IDLEnum {
        const result = idl.createEnum(
            node.name,
            [], {
            documentation: this.makeDocs(node),
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
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
                extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
                fileName: file
            }
        )
        this.namespacePathNames.push(node.name)
        namespace.members = node.members.map(it => this.toIDLNodeForward(file, it))
        this.namespacePathNames.pop()
        return this.withInfo(node, namespace)
    }
    toIDLVersion(file: string, node: webidl2.VersionType): idl.IDLVersion {
        return this.withInfo(node, idl.createVersion(
            node.value,
            {
                extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
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
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs)
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
            throw new Error(`Not representable enum initializer: ${JSON.stringify(node.default)}. Found in ${file}`)
        }
        return this.withInfo(node, idl.createEnumMember(
            node.name,
            parent,
            this.toIDLType(file, node.idlType, undefined) as idl.IDLPrimitiveType,
            initializer, {
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
        }))
    }
    toExtendedAttributes(file: string, extAttrs: webidl2.ExtendedAttribute[]): idl.IDLExtendedAttribute[] | undefined {
        return extAttrs.map(it => {
            return this.withInfo(it, {
                name: it.name,
                value: this.toExtendedAttributeValue(it),
                typesValue: extendedAttributesWithTypesValue.includes(it.name) 
                    ? this.extractTypeArguments(file, extAttrs, it.name as idl.IDLExtendedAttributes)
                    : undefined
            })
        })
    }
    toExtendedAttributeValue(attr: webidl2.ExtendedAttribute): stringOrNone {
        // TODO: be smarter about RHS.
        if (attr.rhs?.value instanceof Array)
            return attr.rhs.value.map(v => v.value).join(",")
        if (typeof (attr.rhs?.value) === 'string')
            return this.unescapeString(attr.rhs.value)
        return
    }
    toIDLEnum(file: string, node: webidl2.EnumType): idl.IDLEnum {
        const result = idl.createEnum(
            node.name,
            [], {
            fileName: file,
            documentation: this.makeDocs(node),
            extendedAttributes: this.toExtendedAttributes(file, node.extAttrs),
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
        return node.extAttrs.some(it => it.name == idl.IDLExtendedAttributes.CallSignature)
    }

    ///

    splitTypeArguments(line: string): string[] {
        let buffer: string = ""
        let brackets: number = 0
        const result: string[] = []
        for (const letter of line) {
            if (letter === ',' && brackets === 0) {
                result.push(buffer)
                buffer = ''
                continue
            }
            if (letter === '<') {
                brackets += 1
            }
            if (letter === '>') {
                brackets -= 1
            }
            buffer += letter
        }
        if (buffer.length) {
            result.push(buffer)
        }
        return result
    }

    extractTypeArguments(file: string,
        extAttrs: webidl2.ExtendedAttribute[] | undefined,
        attribute: idl.IDLExtendedAttributes
    ): idl.IDLType[] | undefined {
        const attr = extAttrs?.find(it => it.name === attribute)
        if (!attr)
            return undefined
        let value = this.toExtendedAttributeValue(attr)!
        return this.splitTypeArguments(value)
            ?.map(it => this.toIDLType(file, webidl2.parseType(it.replaceAll('\'', '"'), file) ?? it))
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
        value = value.slice(1, -1)
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

export function toIdlType(fileName: string, content: string): idl.IDLType {
    const lexicalInfo: IDLTokenInfoMap = new Map()
    const deserializer = new IDLDeserializer(lexicalInfo)
    return deserializer.toIDLType(fileName, webidl2.parseType(content, fileName))
}

interface ParsedFileInfo {
    fileName: string
    lines: string[]
    offsets: number[]
    lexicalInfo: IDLTokenInfoMap
}

const DifferenceFound = new DiagnosticMessageGroup("error", "DifferenceFound", "Difference found")

interface Diff {
    path: string
    oldValue: any
    newValue: any
}

const noCompare = new Set(["parent", "fileName", "nodeLocation", "nameLocation", "valueLocation", "typesValue", "text"])
const canContainMoreCompare = new Set(["extendedAttributes", "typeParameters", "typeArguments"])

function safeString(value: any) {
    if (typeof value == "symbol") {
        return String(value)
    }
    return JSON.stringify(value, (k, v) => { return noCompare.has(k) ? undefined : v})
}

function joinPath(left: string, right?: string) {
    if (!right) {
        return left
    }
    return `${left}.${right}`
}

function compareDeep(oldData: any, newData: any, paths: Set<string>): Diff[] {
    const location = newData?.kind && (newData?.nameLocation ?? newData?.nodeLocation)
    const diffs: Diff[] = []
    if (typeof oldData != typeof newData) {
        diffs.push({path: "", oldValue: safeString(oldData), newValue: safeString(newData)})
    } else if (Array.isArray(oldData) && Array.isArray(newData)) {
        const len = Math.max(oldData.length, newData.length)
        if (oldData.length != newData.length) {
            diffs.push({path: "", oldValue: `(length=${oldData.length})`, newValue: `(length=${newData.length})`})
        }
        for (let i = 0; i < len; ++i) {
            const deeperDiffs = compareDeep(oldData[i], newData[i], paths)
            if (deeperDiffs.length > 0) {
                diffs.push(...deeperDiffs.map(x => {x.path = joinPath("" + i, x.path); return x}))
            }
        }
    } else if (typeof newData == "object") {
        const keys = [...new Set([...Object.getOwnPropertyNames(oldData), ...Object.getOwnPropertyNames(newData)])].filter(x => !noCompare.has(x))
        for (const k of keys) {
            let oldValue = oldData[k]
            let newValue = newData[k]
            if (canContainMoreCompare.has(k)) {
                if (newValue == null && Array.isArray(oldValue) && oldValue.length == 0) {
                    continue
                }
                if (oldValue == null && Array.isArray(newValue)) {
                    continue
                }
                if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                    if (newValue.length > oldValue.length) {
                        // Cases when old parser takes attributes from outer declaration and ignores the right ones
                        newValue = newValue.slice(newValue.length - oldValue.length)
                    } else  if (oldValue.length > newValue.length) {
                        // Cases when types in parentheses have own attributes, but old parser adds attributes from outer declaration
                        oldValue = oldValue.slice(0, newValue.length)
                    }
                } 
            }
            const deeperDiffs = compareDeep(oldValue, newValue, paths)
            if (deeperDiffs.length > 0) {
                diffs.push(...deeperDiffs.map(x => {x.path = joinPath(k, x.path); return x}))
            }
        }
    } else {
        if (oldData != newData) {
            diffs.push({path: "", oldValue: safeString(oldData), newValue: safeString(newData)})
        }
    }
    if (!location) {
        return diffs
    }
    for (const diff of diffs) {
        paths.add(diff.path)
        DifferenceFound.reportDiagnosticMessage([location], `path: ${diff.path} oldValue: ${diff.oldValue} newValue: ${diff.newValue}`)
    }
    return []
}

export function compareParsingResults(oldFile: idl.IDLFile, newFile: idl.IDLFile): boolean {
    const paths = new Set<string>()
    compareDeep(oldFile, newFile, paths)
    if (paths.size > 0) {
        DifferenceFound.reportDiagnosticMessage([newFile.nodeLocation!], "Differences found in those paths:\n" + [...paths].join("\n"))
    }
    return paths.size == 0
}

export function parseIDLFile(fileName: string, content?: string, quiet?: boolean): idl.IDLFile {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    try {
        let newFile!: idl.IDLFile
        // Temporarily is set to use old parser by default
        // Old parser has a bug, it ignores extended attributes on return types, but some pipelines depend on that behavior
        // So pipelines and old parser must be fixed before permanent switch to a new parser
        const mode = process.env.IDLPARSE
        if (mode === "compare" || mode === "old") {
            newFile = parseIDLFileOld(fileName, content)
            if (mode === "old") {
                return newFile
            }
        }
        const file = parseIDLFileNew(fileName, content, mode !== "compare")
        if (mode === "compare") {
            compareParsingResults(file, newFile)
            return newFile
        }
        return file
    } finally {
        if (!quiet && DiagnosticMessageGroup.allGroupsEntries.length != previousDiagnosticsCount) {
            DiagnosticMessageGroup.allGroupsEntries.slice(previousDiagnosticsCount).map(it => outputDiagnosticMessageFormatted(it))
        }
    }
}

export function parseIDLFileNew(fileName: string, content?: string, registerSynthetics?: boolean) {
    let file = new Parser(fileName, content).parseIDL()
    const ancestors: idl.IDLNode[] = []
    const namespaces: string[] = []
    // Mimic old parser and deserialize.ts behavior:
    // 1. Add `fileName`.
    // 2. Add `parent`.
    // 3. Possibly register node with `addSyntheticType` if "Synthetic" is in attributes
    idl.forEachChild(file, (node) => {
        if (idl.isPrimitiveType(node)) {
            return
        }
        node.fileName = fileName
        if (registerSynthetics && idl.isEntry(node) && node.extendedAttributes?.some(it => it.name === "Synthetic")) {
            const fqName = file.packageClause.concat(namespaces).concat([node.name]).join('.')
            addSyntheticType(fqName, node)
        }
        if (ancestors.length) {
            node.parent = ancestors[ancestors.length - 1]
        }
        if (idl.isNamespace(node)) {
            namespaces.push(node.name)
        }
        ancestors.push(node)
    }, (node) => {
        if (idl.isPrimitiveType(node)) {
            return
        }
        if (idl.isNamespace(node)) {
            namespaces.pop()
        }
        ancestors.pop()
    })
    return file
}

function parseIDLFileOld(fileName: string, content?: string): idl.IDLFile {
    const lexicalInfo: IDLTokenInfoMap = new Map()
    const deserializer = new IDLDeserializer(lexicalInfo)
    if (undefined === content) {
        try {
            content = fs.readFileSync(fileName).toString()
        } catch (e: any) {
            content = ""
            throw new FatalParserException([LoadingFatal.reportDiagnosticMessage([{documentPath: fileName}], e.message ?? "")])
        }
    }
    let lines = content.match(/[^\r\n]*(\n|\r\n)?/g) as string[] ?? []
    const offsets = prepareOffsets(lines)
    lines = lines.map((s) => s.replace(/(\n|\r\n)$/, ""))
    const parsed: ParsedFileInfo = {fileName, lines, offsets, lexicalInfo}
    let packageClause: string[] = []
    let rawParsingResults: webidl2.IDLRootType[]
    try {
        rawParsingResults = webidl2.parse(content)
    } catch (e: any) {
        if (e.name == "WebIDLParseError") {
            let tokens = (e as webidl2.WebIDLParseError).tokens
            let range = tokens.length > 0 ? rangeForToken(offsets, tokens[0]) : undefined
            throw new FatalParserException([ParsingFatal.reportDiagnosticMessage([{documentPath: fileName, range, lines}], e.bareMessage)])
        }
        throw new FatalParserException([InternalFatal.reportDiagnosticMessage([{documentPath: fileName, lines}], e.message ?? "")])
    }
    const entries = rawParsingResults!
        .filter(it => {
            if (!it.type)
                return false
            if (deserializer.isPackage(it)) {
                packageClause = it.clause.split(".")
                deserializer.setPackage(packageClause)
                return false
            }
            return true
        })
        .map(it => deserializer.toIDLNode(fileName, it))
    let file = idl.createFile(entries, fileName, packageClause)
    file.text = content
    file = idl.linkParentBack(file)
    idl.forEachChild(file, (node) => {
        node.nodeLocation = locationForNode(parsed, node)
        const nameLocation = locationForNode(parsed, node, "name")
        if (nameLocation.range) {
            node.nameLocation = nameLocation
        }
    })
    return file
}

function prepareOffsets(lines: string[]): number[] {
    let offsets: number[] = []
    let offset = 0
    for (let line of lines) {
        let plus = line.length
        offsets.push(offset)
        offset += plus
    }
    return offsets
}

function locationForNode(parsed: ParsedFileInfo, node: idl.IDLNode, component?: string): Location {
    if (node.kind == idl.IDLKind.File) {
        return {documentPath: parsed.fileName, lines: parsed.lines}
    }
    return {documentPath: parsed.fileName, range: rangeForNode(parsed, node, component), lines: parsed.lines}
}

function rangeForNode(parsed: ParsedFileInfo, node: idl.IDLNode, component?: string): Range|undefined {
    let info = parsed.lexicalInfo.get(node)
    if (info == null) {
        // Proper solution will require fixes with inheritance tokens in Idlize/core and custom webidl2.js
        // So now we are extracting from what we have
        if (node.parent) {
            return rangeForNode(parsed, node.parent, "inheritance") ?? rangeForNode(parsed, node.parent)
        }
        return
    }

    let range: Range|undefined
    for (let k of Object.keys(info)) {
        if (component && k != component) {
            continue
        }
        let named = info[k]
        if (named == null) {
            continue
        }
        if (named.value == null) {
            if (k == "inheritance" && Array.isArray(named)) {
                for (let inh of named) {
                    if (inh.inheritance == null) {
                        continue
                    }
                    let newRange = rangeForToken(parsed.offsets, inh.inheritance)
                    range = range ? commonRange(range, newRange) : newRange
                }
            }
            continue
        }
        let newRange = rangeForToken(parsed.offsets, named)
        range = range ? commonRange(range, newRange) : newRange
    }
    return range
}

function rangeForToken(offsets: number[], token: webidl2.Token): Range {
    let dif = token.value.length - 1
    if (dif < 0) {
        dif = 0
    }
    let endline = token.line + (token.value.match(/\n/g)||[]).length
    let character = token.position - offsets[token.line - 1] + 1
    let endcharacter = token.position + dif - offsets[endline - 1] + 1
    return {start: {line: token.line, character: character}, end: {line: endline, character: endcharacter}}
}
