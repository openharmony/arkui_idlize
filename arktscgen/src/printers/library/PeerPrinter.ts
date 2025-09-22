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

import {
    capitalize,
    createEmptyReferenceResolver,
    createParameter,
    createProperty,
    createReferenceType,
    FieldModifier,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLPointerType,
    IDLProperty,
    IDLReferenceType,
    IDLType,
    IDLUndefinedType,
    IDLVoidType,
    IndentedPrinter,
    isOptionalType,
    isProperty,
    isReferenceType,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import {
    parent,
    flattenType,
    makeMethod,
    nodeNamespace,
    flatParents,
    baseNameString,
    nativeType, baseName,
    innerTypeCommon
} from "../../utils/idl"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import {
    isAbstract,
    isCreateOrUpdate,
    isDataClass,
    isGetter,
    isReal,
    isRegular,
    mangleIfKeyword,
    peerMethod
} from "../../general/common"
import { Importer } from "./Importer"
import { InteropConstructions } from "../../constuctions/InteropConstructions"
import { Typechecker } from "../../general/Typechecker"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor"
import { convertAndImport } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { BindingParameterTypeConvertor } from "../../type-convertors/top-level/peers/BindingParameterTypeConvertor"
import { unpackWrapper, hasTypeHintArgument, typeHintArgument } from "../../type-convertors/top-level/peers/BindingReturnValueTypeConvertor"
import { Config } from "../../general/Config"
import { ExtraParameter } from "../../options/ExtraParameters"
import assert from "node:assert"
import { dropPrefix } from "../../utils/string"

export class PeerPrinter extends SingleFilePrinter {
    protected printInterface(iface: IDLInterface): void {
        if (iface != this.node) throw new Error("Must match")
        this.printPeer(iface, this.writer)
        if (!isDataClass(iface)) {
            this.printTypeGuard(iface, this.writer)
        }
        if (isReal(iface)) {
            this.printAddToNodeMap(iface, this.writer)
        }
    }
    protected filterInterface(node: IDLInterface): boolean {
        return node != this.node
    }
    constructor(
        private config: Config,
        idl: IDLFile,
        private node: IDLInterface
    ) {
        super(idl)
    }

    protected typechecker = new Typechecker(this.idl)
    protected importer = new Importer(this.typechecker, `.`, this.node.name)
    private bindingParameterTypeConvertor = new BindingParameterTypeConvertor(this.typechecker)
    private parent = parent(this.node) ?? Config.defaultAncestor

    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => convertAndImport(
            this.importer,
            new class extends LibraryTypeConvertor {
                convertTypeReference(type: IDLReferenceType): string {
                    return dropPrefix(super.convertTypeReference(type), Config.dataClassPrefix)
                }
            } (this.typechecker),
            node
        )}
    )

    private printPeer(iface: IDLInterface, writer: TSLanguageWriter): void {
        writer.writeClass(
            PeersConstructions.peerName(iface.name), // XXX: Change peer name
            (writer: TSLanguageWriter) => this.printBody(iface, writer),
            this.parent ? this.importer.withPeerImport(baseNameString(this.parent)) : undefined
        )
    }

    private printBody(iface: IDLInterface, writer: TSLanguageWriter): void {
        this.printConstructor(iface, writer)
        this.printMethods(iface, writer)
        this.printFragment(iface, writer)
        this.printBrand(iface, writer)
    }

    private printConstructor(iface: IDLInterface, writer: TSLanguageWriter): void {
        const isRealNode = isReal(iface)
        const isAstNodeDescendant = this.typechecker.isHeir(iface, Config.astNodeCommonAncestor)
        const args: IDLType[] = [IDLPointerType]
        const argNames: string[] = [PeersConstructions.pointerParameter]

        if (isAstNodeDescendant) {
            args.push(createReferenceType(Config.nodeTypeAttribute))
            argNames.push('astNodeType')
        }

        writer.writeConstructorImplementation(
            iface.name,
            new MethodSignature(
                IDLVoidType,
                args,
                undefined,
                undefined,
                undefined,
                argNames
            ),
            () => {
                writer.writeExpressionStatements(
                    writer.makeFunctionCall(
                        PeersConstructions.super,
                         argNames.map(n => writer.makeString(n))
                    )
                )
            }
        )
    }

    private printTypeGuard(iface: IDLInterface, writer: TSLanguageWriter): void {
        writer.writeFunctionImplementation(
            PeersConstructions.typeGuard.name(iface.name),
            new MethodSignature(
                createReferenceType(
                    PeersConstructions.typeGuard.returnType(iface.name)
                ),
                [createReferenceType(PeersConstructions.typeGuard.parameter.type)],
                undefined,
                undefined,
                undefined,
                [PeersConstructions.typeGuard.parameter.name]
            ),
            () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(
                            PeersConstructions.typeGuard.body(iface.name)
                        )
                    )
                )
            }
        )
    }

    private printMethods(iface: IDLInterface, writer: TSLanguageWriter): void {
        iface.methods.forEach(it => {
            if (isCreateOrUpdate(it.name)) {
                // TODO: This condition is not clear - classes with c_type attribute
                // is not abstract too, is it?
                // The check for a native type allows types that is descendants of
                // AstNode but have not type attribute, for example, varbinder.FunctionDecl
                if (isAbstract(iface) && nativeType(iface) === undefined) {
                    console.log(`Skipped ${iface.name}.${it.name}`);
                    return
                }
                return this.printCreateOrUpdate(iface, it, writer)
            }
            if (isGetter(it)) {
                return this.printGetter(iface, it, writer)
            }
            if (isRegular(it)) {
                return this.printRegular(iface, it, writer)
            }
        })
    }

    private printFragment(iface: IDLInterface, writer: TSLanguageWriter): void {
        const methods = this.config.fragments.getCodeFragment(iface.name)
        if (methods !== undefined) {
            methods.forEach(it => {
                this.importer.withReexportImport(it.definition)
                writer.writeLines(`${it.name} = ${it.definition}`)
            })
        }
    }

    private printGetter(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        writer.writeMethodImplementation(
            new Method(
                peerMethod(node.name),
                new MethodSignature(
                    flattenType(node.returnType),
                    []
                ),
                [MethodModifier.GETTER]
            ),
            () => {
                writer.writeStatement(
                    writer.makeReturn(
                        this.makeReturnBindingCall(iface, node, writer)
                    )
                )
            }
        )
    }

    private printRegular(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        writer.writeExpressionStatement(
            writer.makeString(`/** @deprecated */`)
        )
        writer.writeMethodImplementation(
            makeMethod(
                peerMethod(node.name),
                node.parameters.map(it => createParameter(it.name, flattenType(it.type))),
                flattenType(PeersConstructions.this.type)
            ),
            () => {
                writer.writeExpressionStatement(
                    this.makeReturnBindingCall(iface, node, writer)
                )
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(
                            PeersConstructions.this.name
                        )
                    )
                )
            }
        )
    }

    private makeReturnBindingCall(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): LanguageExpression {
        const nativeCall = writer.makeFunctionCall(
            PeersConstructions.callBinding(iface.name, node.name, nodeNamespace(iface)),
            this.makeBindingArguments(
                [
                    createParameter(
                        PeersConstructions.pointerUsage,
                        IDLPointerType
                    ),
                    ...node.parameters
                ],
                writer
            )
        )

        const wrapper = unpackWrapper(node.returnType, this.typechecker)
        const innerType = innerTypeCommon(node.returnType)

        if (wrapper) {
            const args = [nativeCall]
            if (hasTypeHintArgument(wrapper)) {
                const hint = typeHintArgument(innerType, this.typechecker, this.importer)
                if (hint) {
                    args.push(writer.makeString(hint))
                }
            }
            return writer.makeFunctionCall(wrapper, args)
        }

        const convertName = (ref: IDLReferenceType): string => PeersConstructions.peerName(baseName(ref))
        return isOptionalType(node.returnType) && isReferenceType(innerType) ?
            writer.makeNewObject(convertName(innerType), [nativeCall]) : nativeCall
    }

    public static resolveProperty(
        property: ExtraParameter,
        iface: IDLInterface,
        idl: IDLFile
    ): [IDLMethod | IDLProperty, IDLMethod | IDLProperty] {
        const parents = flatParents(iface, idl)
        const methods = parents.flatMap(p => p.methods)
        const props = parents.flatMap(p => p.properties)
        const getters = methods.filter(isGetter)
        const regulars = methods.filter(isRegular)

        if (property.name === 'modifierFlags') { // TODO: handwritten AstNode property
            const method = createProperty(property.name, createReferenceType('Es2pandaModifierFlags'))
            return [method, method]
        }

        const removePrefix = (name: string): string => {
            for (const prefix of ["is", "can", "get"]) {
                if (name.startsWith(prefix)) {
                    return name.slice(prefix.length)
                }
            }
            return name
        }

        const getterName = property.getter ?? property.name
        const setterName = property.setter ?? `set${capitalize(removePrefix(property.name))}`

        // For now, properties are only synthetically generated in filters and they are uncapitalized.
        const index0 = props.findIndex((value, index) => peerMethod(value.name) === getterName)
        const index1 = getters.findIndex((value, index) => peerMethod(value.name) === getterName)
        const index2 = regulars.findIndex((value, index) => peerMethod(value.name) === setterName)

        assert((index0 >= 0 || index1 >= 0), `Cannot find getter '${getterName}' for parameter ${property.name}!`)
        assert(index2 >= 0, `Cannot find setter '${setterName}' for parameter ${property.name}!`)

        // TODO: validate types of getter and setter
        return [
            index0 >= 0 ? props.at(index0)! : getters.at(index1)!,
            regulars.at(index2)!
        ]
    }

    public static makeExtraParameter(
        param: ExtraParameter,
        iface: IDLInterface,
        idl: IDLFile
    ): IDLParameter {
        const type = (m: IDLMethod | IDLProperty) => 'type' in m ? m.type : m.returnType
        const [getter, setter] = this.resolveProperty(param, iface, idl)

        return createParameter(param.name, flattenType(type(getter)), param.optional)
    }

    public static makeExtraParameters(iface: IDLInterface, config: Config, idl: IDLFile): IDLParameter[] {
        return config.parameters.getParameters(iface.name)
            .map(param => this.makeExtraParameter(param, iface, idl))
    }

    public static makeExtraStatement(
        prop: ExtraParameter,
        methods: [IDLMethod | IDLProperty, IDLMethod | IDLProperty],
        varNames: [string, string],
        writer: TSLanguageWriter
    ) : LanguageStatement {
        const [getter, setter] = methods
        //console.log(`${prop.name} => ${getter?.name} ${setter?.name}`);

        const str = (n: string) => writer.makeString(n)
        const type = 'parameters' in setter ? setter.parameters.at(0)?.type : undefined
        const isParam = 'optional' in prop

        const [src, dst] = varNames
        const getExpr = str(isParam ? prop.name : `${src}.${peerMethod(getter.name)}`)
        const assignStmt = isProperty(setter) ?
            writer.makeAssign(`${dst}.${peerMethod(setter.name)}`, undefined, getExpr, false) :
            writer.makeStatement(
                writer.makeMethodCall(dst, peerMethod(setter.name), type !== undefined ? [getExpr] : [])
            )

        const needCondition = (isParam && prop.optional) || // is optional parameter
            //(type !== undefined && !isOptionalType(type)) || // setter has non-nullable type
            (type === undefined && !isProperty(setter)) // setter with no arguments

        return needCondition ? writer.makeCondition(getExpr, writer.makeBlock([assignStmt])) : assignStmt
    }

    private printCreateOrUpdate(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        const extraParameters = PeerPrinter.makeExtraParameters(iface, this.config, this.idl)
        writer.writeMethodImplementation(
            makeMethod(
                PeersConstructions.createOrUpdate(
                    iface.name,
                    node.name
                ),
                node.parameters
                    .map(it => createParameter(it.name, flattenType(it.type)))
                    .concat(extraParameters),
                flattenType(node.returnType),
                [MethodModifier.STATIC]
            ),
            (writer: TSLanguageWriter) => {
                const nativeCall = writer.makeFunctionCall(
                    writer.makeString(
                        PeersConstructions.callBinding(
                            iface.name,
                            node.name,
                            nodeNamespace(iface)
                        )
                    ),
                    this.makeBindingArguments(node.parameters, writer)
                )

                const varName = 'result'
                const makeStmt = (property: ExtraParameter) =>
                    PeerPrinter.makeExtraStatement(
                        property,
                        PeerPrinter.resolveProperty(property, iface, this.idl),
                        ['should_not_be_here', varName],
                        writer
                    )

                const extraStatements = this.config.parameters.getParameters(iface.name)
                    .map(makeStmt)

                if (isReal(iface)) {
                    const astNodeType = this.typechecker.nodeTypeName(iface)
                        ?? throwException(`missing attribute node type: ${iface.name}`)
                    const newExpr = writer.makeNewObject(
                        iface.name, [nativeCall, writer.makeString(astNodeType)]
                    )

                    writer.writeStatements(
                        writer.makeAssign(
                            varName, createReferenceType(iface.name), newExpr, true
                        ),
                        ...extraStatements,
                        writer.makeStatement(
                            writer.makeMethodCall(varName, PeersConstructions.setChildrenParentPtrMethod, [])
                        ),
                        writer.makeReturn(
                            writer.makeString(varName)
                        ),
                    )
                } else {
                    writer.writeStatement(writer.makeReturn(
                        writer.makeNewObject(iface.name, [nativeCall])
                    ))
                }
            }
        )
    }

    private makeBindingArguments(parameters: IDLParameter[], writer: TSLanguageWriter): LanguageExpression[] {
        return [
            createParameter(
                InteropConstructions.context.name,
                InteropConstructions.context.type
            )
        ]
            .concat(parameters)
            .map(it =>
                createParameter(
                    mangleIfKeyword(it.name),
                    it.type
                )
            )
            .flatMap(it =>
                this.bindingParameterTypeConvertor.convertType(it.type)(it.name)
            )
            .map(it => writer.makeString(it)) // todo: writer not needed
    }

    private printAddToNodeMap(iface: IDLInterface, writer: TSLanguageWriter): void {
        const enumValue = this.typechecker.nodeTypeName(iface)
        if (enumValue === undefined) {
            return
        }
        this.importer.withEnumImport(Config.nodeTypeAttribute)
        writer.writeExpressionStatements(
            writer.makeString(`if (!nodeByType.has(${enumValue})) {`),
            writer.makeString(`    nodeByType.set(${enumValue}, (peer: KNativePointer) => new ${iface.name}(peer, ${enumValue}))`),
            writer.makeString(`}`)
        )
    }

    private printBrand(iface: IDLInterface, writer: TSLanguageWriter): void {
        writer.writeProperty(
            PeersConstructions.brand(iface.name),
            IDLUndefinedType,
            [FieldModifier.PROTECTED, FieldModifier.READONLY]
        )
    }
}
