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
import { indentedBy, stringOrNone, zip } from "../util"
import { IDLCallback, IDLConstructor, IDLEntity, IDLEntry, IDLEnum, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLType, IDLTypedef, getExtAttribute,
    getVerbatimDts,
    hasExtAttribute,
    isCallback,
    isClass, isConstructor, isContainerType, isEnum, isInterface, isMethod, isModuleType, isPrimitiveType, isProperty, isReferenceType, isSyntheticEntry, isTypeParameterType, isTypedef, isUnionType,
    isPackage, isImport,
    IDLExtendedAttributes,
    IDLAccessorAttribute,
    IDLImport,
    IDLPackage,
    IDLVoidType,
    IDLStringType,
    IDLUndefinedType,
    IDLNullType,
    isCallable,
    isAnonymousInterface,
    isTupleInterface,
    getSuperType,
    IDLReferenceType,
    IDLCallable,
    IDLSignature,
    IDLAnyType,
    getIDLTypeName,
    isIDLTypeName,
    IDLContainerUtils,
    IDLContainerType,
    DebugUtils,
    isType,
    createReferenceType,
    transformMethodsAsync2ReturnPromise,} from "../idl"
import * as webidl2 from "webidl2"
import { resolveSyntheticType, toIDLNode } from "./deserialize"

export class CustomPrintVisitor {
    constructor(private resolver: (type: IDLReferenceType) => IDLEntry | undefined) {}
    output: string[] = []
    currentInterface?: IDLInterface

    visit(node: IDLEntry) {
        if (isSyntheticEntry(node)) {
            return
        } else if (isInterface(node) || isAnonymousInterface(node) || isTupleInterface(node) || isClass(node)) {
            this.printInterface(node)
        } else if (isMethod(node) || isConstructor(node) || isCallable(node)) {
            this.printMethod(node)
        } else if (isPackage(node)) {
            this.printPackage(node)
        } else if (isImport(node)) {
            this.printImport(node)
        } else if (isProperty(node)) {
            this.printProperty(node)
        } else if (isTypedef(node)) {
            this.printTypedef(node)
        } else if (isEnum(node)) {
            this.printEnum(node)
        } else if (isCallback(node)) {
            this.printTypedef(node)
        } else if (isModuleType(node)) {
            this.printModuleType(node)
        } else {
            throw new Error(`Unexpected node kind: ${IDLKind[node.kind!]}`)
        }
    }

    printMetadata(node: IDLEnum) {
        const imports = node.elements
            .find(it => it.name === "imports")
            ?.initializer as string
        if (imports)
            this.print(imports)

        const exports = node.elements
            .find(it => it.name === "exports")
            ?.initializer as string
        if (exports)
            this.print(exports)
    }

    printInterface(node: IDLInterface) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.split(",").reverse()
        this.openNamespace(namespace)
        let typeSpec = this.toTypeName(node, IDLExtendedAttributes.TypeParameters)

        // Workaround for an SDK declaration clash between `WrappedBuilder` and `ContentModifier`
        if (node.name === "WrappedBuilder")
            typeSpec = "WrappedBuilder<Args extends any[]>"

        const entity = getExtAttribute(node, IDLExtendedAttributes.Entity) ?? IDLEntity.Interface
        if (entity === IDLEntity.Literal) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${this.literal(node, false, true)}`)
        } else if (entity === IDLEntity.Tuple) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${this.literal(node, true, false)}`)
        } else if (entity === IDLEntity.NamedTuple) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${this.literal(node, true, true)}`)
        } else {
            // restore globalScope
            if (hasExtAttribute(node,IDLExtendedAttributes.GlobalScope)) {
                node.methods.map(it => this.printMethod(it, true))
                return
            }
            let interfaces = node.inheritance
            let keyword = "extends"
            let parentTypeArgs = getExtAttribute(node, IDLExtendedAttributes.ParentTypeArguments)?.split(",")
            if (isClass(node)) {
                const superType = getSuperType(node)
                const superTypeArg = parentTypeArgs?.shift()
                if (superType) {
                    // const typeArgs = superTypeArg ? `<${superTypeArg}>` : ""
                    typeSpec += ` extends ${this.printTypeForTS(superType)}`
                }
                interfaces = interfaces.slice(1)
                keyword = "implements"
            }
            if (interfaces.length > 0) {
                const interfaceList = zip(interfaces, parentTypeArgs ?? new Array(interfaces.length))
                    .map(([iface, typeArg]) => getIDLTypeName(iface) + (typeArg ? `<${typeArg}>` : ""))
                    .join(", ")
                typeSpec += ` ${keyword} ${interfaceList}`
            }
            this.print(`${namespace ? "" : "declare "}${entity!.toLowerCase()} ${typeSpec} {`)
            this.currentInterface = node
            this.pushIndent()
            node.constructors.map(it => this.visit(it))
            node.properties.map(it => this.visit(it))
            node.methods.map(it => this.visit(it))
            node.callables.map(it => this.visit(it))
            let verbatim = getVerbatimDts(node)
            if (verbatim) {
                verbatim
                    .split("\n")
                    .map(it => this.print(it))
            }

            this.popIndent()
            this.print("}")
        }
        this.closeNamespace(namespace)
    }

    printMethod(node: IDLMethod | IDLConstructor | IDLCallable, isGlobal: boolean = false) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.split(",").reverse()
        this.openNamespace(namespace)
        const returnType = node.returnType && !(isConstructor(node) && isClass(this.currentInterface!))
            ? `: ${this.printTypeForTS(node.returnType, true)}` : ""
        const name = isConstructor(node)
            ? isClass(this.currentInterface!) ? "constructor" : "new"
            : getName(node)
        const typeParamsAttr = getExtAttribute(node, IDLExtendedAttributes.TypeParameters)
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        let preamble = ""
        if (!isCallable(node)) {
            const isStatic = isMethod(node) && node.isStatic
            const isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
            const isOptional = isMethod(node) && node.isOptional
            preamble = `${isGlobal ? `${namespace ? "" : "declare "}function `: ""}${isProtected ? "protected " : ""}${isStatic ? "static " : ""}${name}${isOptional ?"?":""}`
        }
        this.print(`${preamble}${typeParams}(${mixMethodParametersAndTags(node).map(p => this.paramText(p)).join(", ")})${returnType};`)
        this.closeNamespace(namespace)
    }
    paramText(paramOrTag: IDLParameter | SignatureTag): string {
        const param = paramOrTag as IDLParameter
        if (param.kind === IDLKind.Parameter)
        return `${param.isVariadic ? "..." : ""}${getName(param)}${param.isOptional ? "?" : ""}: ${this.printTypeForTS(param.type)}`
        const tag = paramOrTag as SignatureTag
        return `${tag.name}: ${tag.value}`
    }
    printProperty(node: IDLProperty) {
        const isCommonMethod = hasExtAttribute(node, IDLExtendedAttributes.CommonMethod)
        let isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
        if (isCommonMethod) {
            const returnType = getExtAttribute(this.currentInterface!, IDLExtendedAttributes.TypeParameters) ?? this.currentInterface!.name
            this.print(`${getName(node)}(value: ${this.printTypeForTS(node.type, undefined, undefined, isCommonMethod)}): ${returnType};`)
        } else if (hasExtAttribute(node, IDLExtendedAttributes.Accessor)) {
            const accessorName = getExtAttribute(node, IDLExtendedAttributes.Accessor)
            if (accessorName == IDLAccessorAttribute.Getter) {
                this.print(`get ${getName(node)}(): ${this.printTypeForTS(node.type)};`)
            } else if (accessorName == IDLAccessorAttribute.Setter) {
                this.print(`set ${getName(node)}(value: ${this.printTypeForTS(node.type)});`)
            }
        } else {
            this.print(`${isProtected ? "protected " : ""}${node.isStatic ? "static " : ""}${node.isReadonly ? "readonly " : ""}${getName(node)}${node.isOptional ? "?" : ""}: ${this.printTypeForTS(node.type)};`)

        }
    }
    printEnum(node: IDLEnum) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.split(",").reverse()
        this.openNamespace(namespace)
        this.print(`declare enum ${node.name} {`)
        this.pushIndent()
        node.elements.forEach(it => {
            const initializer = it.initializer
                ? it.type === IDLStringType ? ` = "${it.initializer}"` : ` = ${it.initializer}`
                : undefined
            this.print(`${getName(it)}${initializer ?? ""},`)
        })
        this.popIndent()
        this.print("}")
        this.closeNamespace(namespace)
    }
    printTypedef(node: IDLTypedef | IDLCallback) {
        // Let's skip imported declarations
        if (isTypedef(node) &&
            hasExtAttribute(node, IDLExtendedAttributes.Import)) {
            let definition = this.resolver(createReferenceType(node.name))
            // TODO: handle namespace case better!
            if (definition && !isTypedef(definition) && !hasExtAttribute(definition, IDLExtendedAttributes.Namespace)) {
                console.log(`Has better definition for ${node.name}: ${definition.fileName} ${definition.kind}`)
                return
            }
        }
        const text = isCallback(node) ? this.callback(node)
            : hasExtAttribute(node, IDLExtendedAttributes.Import) ? getIDLTypeName(IDLAnyType)
            : this.printTypeForTS(node.type)
        const typeParamsAttr = getExtAttribute(node, IDLExtendedAttributes.TypeParameters)
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        this.print(`declare type ${getName(node)}${typeParams} = ${text};`)
    }

    printModuleType(node: IDLModuleType) {
        let text = getVerbatimDts(node) ?? ""
        this.print(`${text}`)
    }

    printImport(node: IDLImport) {
        this.print(`// import ${node.name}`)
    }

    printPackage(node: IDLPackage) {
        this.print(`// package ${node.name}`)
    }

    openNamespace(names: string[] | undefined) {
        names?.forEach((it, idx) => {
            if (it) {
                if (it.startsWith("Export ") && it.length > "Export ".length) {
                    it = it.split(' ')[1]
                    this.print(`export ${idx ? "" : "declare "}namespace ${it} {`)
                    this.pushIndent()
                } else {
                    this.print(`${idx ? "" : "declare "}namespace ${it} {`)
                    this.pushIndent()
                }
            }
        })
    }
    closeNamespace(names: string[] | undefined) {
        names?.forEach(it => {
            if (it) {
                this.popIndent()
                this.print("}")
            }
        })
    }

    checkVerbatim(node: IDLEntry) {
        let verbatim = getExtAttribute(node, IDLExtendedAttributes.VerbatimDts)
        if (verbatim) {
            verbatim
                .substring(1, verbatim.length - 2)
                .split('\n')
                .forEach(it => this.print(it))
        }
    }

    private indent = 0
    indented(input: string): string {
        return indentedBy(input, this.indent)
    }
    pushIndent() {
        this.indent++
    }
    popIndent() {
        this.indent--
    }
    print(value: stringOrNone) {
        if (value) this.output.push(this.indented(value))
    }

    private printTypeForTS(type: IDLType | undefined, undefinedToVoid?: boolean, sequenceToArrayInterface: boolean = false, isCommonMethod = false): string {
        if (!type) throw new Error("Missing type")
        if (type === IDLUndefinedType && undefinedToVoid) return "void"
        if (type === IDLStringType) return "string"
        if (isCommonMethod && isIDLTypeName(type, "this")) return "T"
        if (type === IDLNullType) return "null"
        if (type === IDLVoidType) return "void"
        if (isPrimitiveType(type)) return getIDLTypeName(type)
        if (isContainerType(type)) {
            if (!sequenceToArrayInterface && IDLContainerUtils.isSequence(type))
                return `${type.elementType.map(it => this.printTypeForTS(it)).join(",")}[]`
            return `${mapContainerType(type)}<${type.elementType.map(it => this.printTypeForTS(it)).join(",")}>`
        }
        if (isReferenceType(type)) return this.toTypeName(type, IDLExtendedAttributes.TypeArguments)
        if (isUnionType(type)) return `(${type.types.map(it => this.printTypeForTS(it)).join("|")})`
        if (isTypeParameterType(type)) return getIDLTypeName(type)
        throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
    }

    private toTypeName(node: IDLEntry, typeAttribute: IDLExtendedAttributes): string {
        if (isReferenceType(node)) {
            const synthDecl = this.resolver(node)
            if (synthDecl && isSyntheticEntry(synthDecl)) {
                if (isInterface(synthDecl) || isAnonymousInterface(synthDecl) || isTupleInterface(synthDecl)) {
                    const isTuple = getExtAttribute(synthDecl, IDLExtendedAttributes.Entity) === IDLEntity.Tuple
                    return this.literal(synthDecl, isTuple, !isTuple)
                }
                if (isCallback(synthDecl)) {
                    return this.callback(synthDecl)
                }
            }
        }
        if (hasExtAttribute(node, IDLExtendedAttributes.Import)) {
            return getIDLTypeName(IDLAnyType)
        }
        let typeSpec = (isType(node) ? getIDLTypeName(node) : node.name) ?? "MISSING_TYPE_NAME"
        const typeParams = getExtAttribute(node, typeAttribute)
        if (typeParams) {
            typeSpec = `${typeSpec}<${typeParams}>`
        }
        return typeSpec
    }

    private callback(node: IDLCallback): string {
        return `((${node.parameters.map(p => this.paramText(p)).join(", ")}) => ${this.printTypeForTS(node.returnType)})`
    }

    private literal(node: IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        return `${
                isTuple ? "[" : "{"
            } ${
                node.properties.map(it => {
                    const questionMark = it.isOptional ? "?" : ""
                    const type = this.printTypeForTS(it.type)
                    return includeFieldNames ? `${getName(it)}${questionMark}: ${type}` : `${type}${questionMark}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`
    }
}

export function idlToString(name: string, content: string): string {
    let printer = new CustomPrintVisitor(resolveSyntheticType)
    webidl2.parse(content)
        .map(it => toIDLNode(name, it))
        .forEach(it => {
            transformMethodsAsync2ReturnPromise(it)
            printer.visit(it)
        })
    return printer.output.join("\n")
}

function mapContainerType(idlType: IDLContainerType): string {///belongs to LW?
    if (IDLContainerUtils.isSequence(idlType)) {
        return "Array"
    }
    if (IDLContainerUtils.isRecord(idlType)) {
        return "Map"
    }
    if (IDLContainerUtils.isPromise(idlType)) {
        return "Promise"
    }
    throw new Error(`Unmapped container type: ${DebugUtils.debugPrintType(idlType)}`)
}

function getName(node: IDLEntry): stringOrNone {
    return getExtAttribute(node, IDLExtendedAttributes.DtsName) ?? node.name
}

interface SignatureTag {index: number, name: string, value: string}

function fetchSignatureTags(node: IDLSignature): SignatureTag[] {
    if (!node.extendedAttributes)
        return []
    return node.extendedAttributes
        .filter((ea) => ea.name === IDLExtendedAttributes.DtsTag)
        .map((ea):SignatureTag => {
            if (!ea.value)
                throw new Error('Empty DtsTag is not allowed')
            let indexNameValue = ea.value.split('|')
            if (indexNameValue.length === 1) {
                return {
                    index: 0, // zero is from the idl.DtsTag specification
                    name: 'type', // 'type' is from the idl.DtsTag specification
                    value: indexNameValue[0],
                }
            }
            if (indexNameValue.length !== 3)
                throw new Error(`Malformed DtsTag: "${ea.value}"`)
            return {
                index: Number(indexNameValue[0]),
                name: indexNameValue[1],
                value: indexNameValue[2],
            }
        })
        .sort((a, b) => a.index - b.index)
}

function mixMethodParametersAndTags(node: IDLSignature) : (IDLParameter | SignatureTag)[] {
    let mix: (IDLParameter | SignatureTag)[] = node.parameters.slice(0)
    for (const tag of fetchSignatureTags(node))
        mix.splice(tag.index, 0, tag)
    return mix
}
