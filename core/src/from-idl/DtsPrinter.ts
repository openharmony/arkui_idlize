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
import { indentedBy, isInNamespace, stringOrNone } from "../util"
import {
    IDLCallback,
    IDLConstructor,
    IDLEntity,
    IDLEntry,
    IDLEnum,
    IDLInterface,
    IDLKind,
    IDLMethod,
    IDLParameter,
    IDLProperty,
    IDLType,
    IDLTypedef,
    IDLNamespace,
    getExtAttribute,
    getVerbatimDts,
    hasExtAttribute,
    isCallback,
    isConstructor,
    isContainerType,
    isEnum,
    isInterface,
    isMethod,
    isPrimitiveType,
    isProperty,
    isReferenceType,
    isSyntheticEntry,
    isTypeParameterType,
    isTypedef,
    isUnionType,
    isImport,
    isVersion,
    isNamespace,
    IDLExtendedAttributes,
    IDLAccessorAttribute,
    IDLFile,
    IDLImport,
    IDLVoidType,
    IDLStringType,
    IDLUndefinedType,
    isCallable,
    getSuperType,
    IDLReferenceType,
    IDLCallable,
    IDLAnyType,
    IDLContainerUtils,
    IDLContainerType,
    DebugUtils,
    IDLConstant,
    mixMethodParametersAndTags,
    SignatureTag,
    createReferenceType,
    transformMethodsAsync2ReturnPromise,
    linearizeNamespaceMembers,
    isNamedNode,
    IDLNode,
    IDLThisType,
    isOptionalType,
    IDLVersion,
    IDLI8Type,
    IDLU8Type,
    IDLI16Type,
    IDLU16Type,
    IDLI32Type,
    IDLU32Type,
    IDLI64Type,
    IDLU64Type,
    IDLF16Type,
    IDLF32Type,
    IDLF64Type,
    IDLBufferType,
    isUnspecifiedGenericType,
    IDLUnknownType,
    IDLBooleanType,
    IDLNumberType,
    IDLPointerType,
    IDLInterfaceSubkind,
    escapeIDLKeyword,
    getNamespacesPathFor,
    IDLBigintType,
    IDLDate,
    IDLFunctionType,
    getQualifiedName
} from "../idl"
import { resolveSyntheticType, toIDLFile } from "./deserialize"
import { Language } from "../Language"
import { warn } from "../util"
import { isInIdlize } from "../idlize"

export class CustomPrintVisitor {
    output: string[] = []
    constructor(private resolver: (type: IDLReferenceType) => IDLEntry | undefined, private language: Language) {}

    currentInterface?: IDLInterface

    visit(node: IDLEntry, wrapNamespaces: boolean = false) {
        const namespacesPath = wrapNamespaces ? getNamespacesPathFor(node) : []
        for(const namespace of namespacesPath) {
            const isTopmost = namespacesPath[0] === namespace
            this.print(`${!isTopmost ? "" : "declare "}namespace ${namespace.name} {`);
            this.pushIndent();
        }
        if (isInIdlize(node)) return
        if (isInterface(node)) {
            this.printInterface(node)
        } else if (isMethod(node) || isConstructor(node) || isCallable(node)) {
            this.printMethod(node)
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
        } else if (isVersion(node)) {
            this.printVersion(node)
        } else if (isNamespace(node)) {
            this.printNamespace(node)
        } else {
            throw new Error(`Unexpected node kind: ${IDLKind[node.kind!]}`)
        }
        for(const namespace of namespacesPath) {
            this.popIndent();
            this.print("}");
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

    printConstant(node: IDLConstant) {
        this.print(`${isInNamespace(node) ? "" : "declare "}const ${node.name} : ${isPrimitiveType(node.type) ? "" : "typeof"} ${this.printTypeForTS(node.type)} = ${node.value}`)
    }

    printInterface(node: IDLInterface) {
        let typeSpec = this.toTypeName(node)

        // Workaround for an SDK declaration clash between `WrappedBuilder` and `ContentModifier`
        if (node.name === "WrappedBuilder")
            typeSpec = "WrappedBuilder<Args extends any[]>"

        const entity = getExtAttribute(node, IDLExtendedAttributes.Entity) ?? IDLEntity.Interface
        if (entity === IDLEntity.Literal) {
            this.print(`${isInNamespace(node) ? "" : "declare "}type ${typeSpec} = ${this.literal(node, false, true)}`)
        } else if (entity === IDLEntity.Tuple) {
            this.print(`${isInNamespace(node) ? "" : "declare "}type ${typeSpec} = ${this.literal(node, true, false)}`)
        } else if (entity === IDLEntity.NamedTuple) {
            this.print(`${isInNamespace(node) ? "" : "declare "}type ${typeSpec} = ${this.literal(node, true, true)}`)
        } else {
            let interfaces = node.inheritance
            let keyword = "extends"
            if (node.subkind === IDLInterfaceSubkind.Class) {
                const superType = getSuperType(node)
                if (superType)
                    typeSpec += ` extends ${this.printTypeForTS(superType)}`
                interfaces = interfaces.slice(1)
                keyword = "implements"
            }
            if (interfaces.length > 0)
                typeSpec += ` ${keyword} ${interfaces.map(it => this.toTypeName(it)).join(", ")}`
            this.print(`${isInNamespace(node) ? "" : "declare "}${entity!.toLowerCase()} ${typeSpec} {`)
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
    }

    printMethod(node: IDLMethod | IDLConstructor | IDLCallable, forceAsFree: boolean = false) {
        const returnType = node.returnType && !(isConstructor(node) && this.currentInterface!.subkind === IDLInterfaceSubkind.Class)
            ? `: ${this.printTypeForTS(node.returnType, true)}` : ""
        const name = isConstructor(node)
            ? this.currentInterface!.subkind === IDLInterfaceSubkind.Class ? "constructor" : "new"
            : getName(node)
        const typeParams = (node.typeParameters && node.typeParameters.length > 0) ? `<${node.typeParameters.join(",")}>` : ""
        let preamble = ""
        if (!isCallable(node)) {
            let isStatic = isMethod(node) && node.isStatic
            const isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
            const isOptional = isMethod(node) && node.isOptional
            let isFree = isMethod(node) && node.isFree
            if (forceAsFree) {
                isStatic = false
                isFree = true
            }
            const inNamespace = getNamespacesPathFor(node).length > 0
            preamble = `${isFree ? `${isInNamespace(node) ? "" : "declare "}function `: ""}${isProtected ? "protected " : ""}${isStatic ? "static " : ""}${name}${isOptional ?"?":""}`
        }
        this.print(`${preamble}${typeParams}(${mixMethodParametersAndTags(node).map(p => this.paramText(p)).join(", ")})${returnType};`)
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
            // TODO: not very clean, but we don't need to print these so far.
            // if (peerGeneratorConfiguration().ignorePeerMethod.includes(node.name)) return
            const typeParams = this.currentInterface?.typeParameters
            const returnType = typeParams && typeParams.length > 0 ? typeParams[0] : this.currentInterface!.name
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
        this.print(`${isInNamespace(node) ? "" : "declare "}enum ${node.name} {`)
        this.pushIndent()
        node.elements.forEach(it => {
            const initializer = (it.type === IDLStringType ? `"${it.initializer}"` : `${it.initializer}`)
            this.print(`${getName(it)} = ${initializer},`)
            let originalName = getExtAttribute(it, IDLExtendedAttributes.OriginalEnumMemberName)
            if (originalName && originalName != getName(it)) {
                this.print(`${originalName} = ${initializer},`)
            }
        })
        this.popIndent()
        this.print("}")
    }
    printTypedef(node: IDLTypedef | IDLCallback) {
        // Let's skip imported declarations
        if (isTypedef(node) &&
            hasExtAttribute(node, IDLExtendedAttributes.Import)) {
            let definition = this.resolver(createReferenceType(node))
            // TODO: handle namespace case better!
            // TODO: namespace-related-to-rework
            //throw new Error("not implemented yet")
            warn("Typedef-with-Import is not implemented yet")
            // if (definition && !isTypedef(definition) && !hasExtAttribute(definition, IDLExtendedAttributes.Namespace)) {
            //     console.log(`Has better definition for ${node.name}: ${definition.fileName} ${definition.kind}`)
            //     return
            // }
        }
        const text = isCallback(node) ? this.callback(node)
            : hasExtAttribute(node, IDLExtendedAttributes.Import) ? IDLAnyType.name
            : this.printTypeForTS(node.type)
        const typeParams = node.typeParameters && node.typeParameters.length > 0 ? `<${node.typeParameters.join(",")}>` : ""
        this.print(`${isInNamespace(node) ? '' : 'declare '}type ${getName(node)}${typeParams} = ${text};`)
    }

    printVersion(node: IDLVersion) {
        let text = node.value.join(".")
        this.print(`// version ${text}`)
    }

    printNamespace(node: IDLNamespace) {
        let verbatimDts = getVerbatimDts(node)
        if (verbatimDts) {
            this.print(verbatimDts)
            return
        }
        this.print(`${isInNamespace(node) ? "" : "declare "} namespace ${node.name} {`);
        this.pushIndent();
        node.members.forEach(member => this.visit(member));
        this.popIndent();
        this.print("}");
    }

    printImport(node: IDLImport) {
        this.print(`// import ${node.clause.join(".")}${node.name ? " as " : ""}${node.name||""}`)
    }

    printPackage(node: IDLFile) {
        this.print(`// package ${node.packageClause.join(".")}`)
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
        if (isOptionalType(type)) return `${this.printTypeForTS(type.type, undefinedToVoid, sequenceToArrayInterface)} | undefined`
        if (isPrimitiveType(type)) {
            switch (type) {
                case IDLU8Type: case IDLI8Type:
                case IDLU16Type: case IDLI16Type:
                case IDLU32Type: case IDLI32Type:
                case IDLU64Type: case IDLI64Type:
                case IDLF16Type: case IDLF32Type: case IDLF64Type:
                case IDLNumberType:
                    return "number"
                case IDLAnyType: return "any"
                case IDLUnknownType: return "unknown"
                case IDLBufferType: return "ArrayBuffer"
                case IDLBooleanType: return "boolean"
                case IDLUndefinedType: return undefinedToVoid ? "void" : "undefined"
                case IDLStringType: return "string"
                case IDLVoidType: return "void"
                case IDLThisType: return "T"
                case IDLBigintType:
                case IDLPointerType: return "number|bigint"
                case IDLDate: return "Date"
                case IDLFunctionType: return "Function"
                default: throw new Error(`Unknown primitive type ${DebugUtils.debugPrintType(type)}`)
            }
        }
        if (isContainerType(type)) {
            if (!sequenceToArrayInterface && IDLContainerUtils.isSequence(type))
                return `${type.elementType.map(it => this.printTypeForTS(it)).join(",")}[]`
            return `${mapContainerType(type)}<${type.elementType.map(it => this.printTypeForTS(it)).join(",")}>`
        }
        if (isUnspecifiedGenericType(type))
            return `${type.name}<${type.typeArguments.map(it => this.printTypeForTS(it)).join(",")}>`
        if (isReferenceType(type)) return this.toTypeName(type)
        if (isUnionType(type)) return `(${type.types.map(it => this.printTypeForTS(it)).join("|")})`
        if (isTypeParameterType(type)) return type.name
        throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
    }

    private toTypeName(node: IDLNode): string {
        if (isReferenceType(node)) {
            const decl = this.resolver(node)
            if (decl) {
                if (isSyntheticEntry(decl)) {
                    if (isInterface(decl)) {
                        const isTuple = getExtAttribute(decl, IDLExtendedAttributes.Entity) === IDLEntity.Tuple
                        return this.literal(decl, isTuple, !isTuple)
                    }
                    if (isCallback(decl)) {
                        return this.callback(decl)
                    }
                }
                let typeSpec = getQualifiedName(decl, "namespace.name")
                if (node.typeArguments)
                    typeSpec = `${typeSpec}<${node.typeArguments.map(it => this.toTypeName(it))}>`
                return typeSpec
            }
        }
        if (hasExtAttribute(node, IDLExtendedAttributes.Import)) {
            return IDLAnyType.name
        }
        let typeSpec = isNamedNode(node) ? node.name : "MISSING_TYPE_NAME"
        if ((isInterface(node) || isCallback(node) || isTypedef(node)) && node.typeParameters?.length)
            typeSpec = `${typeSpec}<${node.typeParameters?.join(",")}>`
        if (isReferenceType(node) && node.typeArguments)
            typeSpec = `${typeSpec}<${node.typeArguments.map(it => this.toTypeName(it))}>`
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

export function idlToDtsString(name: string, content: string): string {
    let printer = new CustomPrintVisitor(resolveSyntheticType, Language.TS)
    const [idlFile] = toIDLFile(name, content)
    printer.printPackage(idlFile)
    linearizeNamespaceMembers(idlFile.entries).forEach(it => {
        transformMethodsAsync2ReturnPromise(it)
    })
    idlFile.entries.forEach(it => {
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
    return escapeIDLKeyword(getExtAttribute(node, IDLExtendedAttributes.DtsName) ?? node.name)
}
