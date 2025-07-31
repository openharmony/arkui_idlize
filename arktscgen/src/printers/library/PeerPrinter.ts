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
    IDLType,
    IDLUndefinedType,
    IDLVoidType,
    IndentedPrinter,
    isProperty,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { flattenType, makeMethod, nodeNamespace, nodeType, parent, flatParents, baseNameString, nativeType } from "../../utils/idl"
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
import { ImporterTypeConvertor } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { BindingParameterTypeConvertor } from "../../type-convertors/top-level/peers/BindingParameterTypeConvertor"
import { BindingReturnValueTypeConvertor } from "../../type-convertors/top-level/peers/BindingReturnValueTypeConvertor"
import { composedConvertType } from "../../type-convertors/BaseTypeConvertor"
import { Config } from "../../general/Config"
import { ExtraParameter } from "../../options/ExtraParameters"
import assert from "node:assert"

export class PeerPrinter extends SingleFilePrinter {
    protected printInterface(node: IDLInterface): void {
        if (node != this.node) throw new Error("Must match")
        this.printPeer()
        if (!isDataClass(this.node)) {
            this.printTypeGuard()
        }
        if (isReal(this.node)) {
            this.printAddToNodeMap()
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

    protected typechecker = new Typechecker(this.idl.entries)

    protected importer = new Importer(this.typechecker, `.`, this.node.name)

    private bindingParameterTypeConvertor = new BindingParameterTypeConvertor(this.typechecker)

    private bindingReturnValueTypeConvertor = new BindingReturnValueTypeConvertor(this.typechecker)

    private parent = parent(this.node) ?? Config.defaultAncestor

    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => composedConvertType(
                new LibraryTypeConvertor(this.typechecker),
                new ImporterTypeConvertor(this.importer, this.typechecker),
                node
            )
        }
    )

    private printPeer(): void {
        this.writer.writeClass(
            this.node.name,
            () => this.printBody(),
            this.parent ? this.importer.withPeerImport(baseNameString(this.parent)) : undefined
        )
    }

    private printBody(): void {
        this.printConstructor()
        this.printMethods()
        this.printFragment()
        this.printBrand()
    }

    private printConstructor(): void {
        this.writer.writeConstructorImplementation(
            this.node.name,
            new MethodSignature(
                IDLVoidType,
                [
                    IDLPointerType
                ],
                undefined,
                undefined,
                undefined,
                [
                    PeersConstructions.pointerParameter
                ]
            ),
            () => {
                if (isReal(this.node)) {
                    this.writer.writeExpressionStatement(
                        this.writer.makeFunctionCall(
                            PeersConstructions.validatePeer,
                            [
                                this.writer.makeString(PeersConstructions.pointerParameter),
                                this.writer.makeString(
                                    nodeType(this.node)
                                        ?? throwException(`missing attribute node type: ${this.node.name}`)
                                ),
                            ]
                        )
                    )
                }
                this.writer.writeExpressionStatements(
                    this.writer.makeFunctionCall(
                        PeersConstructions.super,
                        [
                            this.writer.makeString(PeersConstructions.pointerParameter)
                        ]
                    )
                )
            }
        )
    }

    private printTypeGuard(): void {
        this.writer.writeFunctionImplementation(
            PeersConstructions.typeGuard.name(this.node.name),
            new MethodSignature(
                createReferenceType(
                    PeersConstructions.typeGuard.returnType(this.node.name)
                ),
                [createReferenceType(PeersConstructions.typeGuard.parameter.type)],
                undefined,
                undefined,
                undefined,
                [PeersConstructions.typeGuard.parameter.name]
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.writer.makeString(
                            PeersConstructions.typeGuard.body(this.node.name)
                        )
                    )
                )
            }
        )
    }

    private printMethods(): void {
        this.node.methods.forEach(it => {
            if (isCreateOrUpdate(it.name)) {
                // TODO: This condition is not clear - classes with c_type attribute
                // is not abstract too, is it?
                if (isAbstract(this.node) && nativeType(this.node) === undefined) {
                    return
                }
                return this.printCreateOrUpdate(it)
            }
            if (isGetter(it)) {
                return this.printGetter(it)
            }
            if (isRegular(it)) {
                return this.printRegular(it)
            }
        })
    }

    private printFragment(): void {
        const methods = this.config.fragments.getCodeFragment(this.node.name)
        if (methods !== undefined) {
            methods.forEach(it => {
                this.importer.withReexportImport(it.definition)
                this.writer.writeLines(`${it.name} = ${it.definition}`)
            })
        }
    }

    private printGetter(node: IDLMethod): void {
        this.writer.writeMethodImplementation(
            new Method(
                peerMethod(node.name),
                new MethodSignature(
                    flattenType(node.returnType),
                    []
                ),
                [MethodModifier.GETTER]
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.makeReturnBindingCall(node)
                    )
                )
            }
        )
    }

    private printRegular(node: IDLMethod): void {
        this.writer.writeExpressionStatement(
            this.writer.makeString(`/** @deprecated */`)
        )
        this.writer.writeMethodImplementation(
            makeMethod(
                peerMethod(node.name),
                node.parameters.map(it => createParameter(it.name, flattenType(it.type))),
                flattenType(PeersConstructions.this.type)
            ),
            () => {
                this.writer.writeExpressionStatement(
                    this.makeReturnBindingCall(node)
                )
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.writer.makeString(
                            PeersConstructions.this.name
                        )
                    )
                )
            }
        )
    }

    private makeReturnBindingCall(node: IDLMethod): LanguageExpression {
        const nativeCall = this.writer.makeFunctionCall(
            PeersConstructions.callBinding(this.node.name, node.name, nodeNamespace(this.node)),
            this.makeBindingArguments(
                [
                    createParameter(
                        PeersConstructions.pointerUsage,
                        IDLPointerType
                    ),
                    ...node.parameters
                ]
            )
        )
        return this.bindingReturnValueTypeConvertor.convertType(node.returnType)(this.writer, nativeCall)
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

    private printCreateOrUpdate(node: IDLMethod): void {
        const extraParameters = PeerPrinter.makeExtraParameters(this.node, this.config, this.idl)
        this.writer.writeMethodImplementation(
            makeMethod(
                PeersConstructions.createOrUpdate(
                    this.node.name,
                    node.name
                ),
                node.parameters
                    .map(it => createParameter(it.name, flattenType(it.type)))
                    .concat(extraParameters),
                flattenType(node.returnType),
                [MethodModifier.STATIC]
            ),
            (writer: TSLanguageWriter) => {
                const newExpr = this.writer.makeNewObject(
                    this.node.name, [
                        this.writer.makeFunctionCall(
                            this.writer.makeString(
                                PeersConstructions.callBinding(
                                    this.node.name,
                                    node.name,
                                    nodeNamespace(this.node)
                                )
                            ),
                            this.makeBindingArguments(node.parameters)
                        ),
                    ]
                )

                const varName = 'result'
                const makeStmt = (property: ExtraParameter) =>
                    PeerPrinter.makeExtraStatement(
                        property,
                        PeerPrinter.resolveProperty(property, this.node, this.idl),
                        ['should_not_be_here', varName],
                        this.writer
                    )

                const extraStatements = this.config.parameters.getParameters(this.node.name)
                    .map(makeStmt)

                if (isReal(this.node)) {
                    this.writer.writeStatements(
                        this.writer.makeAssign(
                            varName, createReferenceType(this.node.name), newExpr, true
                        ),
                        ...extraStatements,
                        this.writer.makeStatement(
                            this.writer.makeMethodCall(varName, PeersConstructions.setChildrenParentPtrMethod, [])
                        ),
                        this.writer.makeReturn(
                            this.writer.makeString(varName)
                        ),
                    )
                } else {
                    this.writer.writeStatement(
                        this.writer.makeReturn(newExpr)
                    )
                }
            }
        )
    }

    private makeBindingArguments(parameters: IDLParameter[]): LanguageExpression[] {
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
            .map(it => this.writer.makeString(it))
    }

    private printAddToNodeMap(): void {
        const enumValue = this.typechecker.nodeTypeName(this.node)
        if (enumValue === undefined) {
            return
        }
        const qualified = `${this.importer.withEnumImport(Config.nodeTypeAttribute)}.${enumValue}`
        this.writer.writeExpressionStatements(
            this.writer.makeString(`if (!nodeByType.has(${qualified})) {`),
            this.writer.makeString(`    nodeByType.set(${qualified}, (peer: KNativePointer) => new ${this.node.name}(peer))`),
            this.writer.makeString(`}`)
        )
    }

    private printBrand(): void {
        this.writer.writeProperty(
            PeersConstructions.brand(this.node.name),
            IDLUndefinedType,
            [FieldModifier.PROTECTED, FieldModifier.READONLY]
        )
    }
}
