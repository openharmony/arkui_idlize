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
    createParameter,
    createPrimitiveType,
    createReferenceType,
    FieldModifier,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLReferenceType,
    IDLType,
    isInterface,
    isParameter,
    isReferenceType,
    isVoidType,
    LanguageExpression,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import {
    makeSignature,
    nativeType,
    innerTypeCommon,
    makeEnoughQualifiedName,
    isSequence,
    isString,
} from "../../utils/idl"
import {
    isAbstract,
    isCreate,
    isCreateOrUpdate,
    isDataClass,
    isGetter,
    isReal,
    isRegular,
    makeMethodName,
    mangleIfKeyword,
    peerMethod
} from "../../general/common"
import { Importer } from "./Importer"
import { pascalToCamel } from "../../utils/string"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import { Typechecker } from "../../general/Typechecker"
import { BindingParameterTypeConvertor } from "../../type-convertors/top-level/peers/BindingParameterTypeConvertor"
import { unpackWrapper, hasTypeHintArgument, typeHintArgument, hasFactoryArgument } from "../../type-convertors/top-level/peers/BindingReturnValueTypeConvertor"
import { Config } from "../../general/Config"
import { ExtraParameter } from "../../options/ExtraParameters"
import { CommonGenerator } from "../Generator"
import { Filter } from "../Filter";

export class PeerPrinter {
    private bindingParameterTypeConvertor = new BindingParameterTypeConvertor(this.typechecker)

    constructor(
        private config: Config,
        private typechecker: Typechecker, // = new Typechecker(this.idl)
        private importer: Importer // = new Importer(this.typechecker, `.`, this.node.name)

    ) {
    }

    public printInterface(iface: IDLInterface, writer: TSLanguageWriter): void {
        this.printPeer(iface, writer)
        if (!isDataClass(iface)) {
            this.printTypeGuard(iface, writer)
        }
        if (isReal(iface)) {
            this.printAddToNodeMap(iface, writer)
        }
    }

    private printPeer(iface: IDLInterface, writer: TSLanguageWriter): void {
        const _parent = iface.inheritance[0] ?? createReferenceType(Config.defaultAncestor)
        const parentName = makeEnoughQualifiedName(_parent, this.typechecker.resolveReference.bind(this.typechecker))

        this.importer.addSeen(PeersConstructions.peerName(iface.name))
        writer.writeClass(
            PeersConstructions.peerName(iface.name), // XXX: Change peer name to iface.name
            (writer: TSLanguageWriter) => this.printBody(iface, writer),
            this.importer.withPeerImport(parentName)
        )
    }

    private printBody(iface: IDLInterface, writer: TSLanguageWriter): void {
        this.printConstructor(iface, writer)
        this.printMethods(iface, writer)
        this.printFragment(iface, writer)
        this.printBrand(iface, writer)
    }

    private printConstructor(iface: IDLInterface, writer: TSLanguageWriter): void {
        const isAstNodeDescendant = this.typechecker.isHeir(iface, Config.astNodeCommonAncestor)
        const args: IDLType[] = [createPrimitiveType('pointer')]
        const argNames: string[] = [PeersConstructions.pointerParameter]

        if (isAstNodeDescendant) {
            args.push(createReferenceType(Config.nodeTypeAttribute))
            argNames.push('astNodeType')
        }

        writer.writeConstructorImplementation(
            iface.name,
            new MethodSignature(
                createPrimitiveType('void'),
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
        type Methods = { creates: IDLMethod[], updates: IDLMethod[], other: IDLMethod[] }
        const methods = iface.methods
            .reduce((out, m) => {
                !isCreateOrUpdate(m.name) ? out.other.push(m):
                    isCreate(m.name) ? out.creates.push(m) : out.updates.push(m)
                return out
        }, { creates: [], updates: [], other: [] } as Methods)

        // TODO: isAbstract checks if an interface has AstNode type this is not
        // suitable for other namespaces than ir.
        if (isAbstract(iface) && nativeType(iface) === undefined) {
            console.log(`Skipped ${iface.name}.create/update methods`);
        } else {
            // Compatibility: keep only one create method if we found 'universal'
            // and all methods if not (updates is not filtered, why?).
            // TODO: Do not filter methods in peers
            const isCompat = ['ETSTuple', 'ExportNamedDeclaration', 'ETSParameterExpression']
                .includes(iface.name)

            const toPrint = isCompat ?
                methods.creates
                    .concat(methods.updates)
                    .sort((a, b) => iface.methods.indexOf(a) - iface.methods.indexOf(b)) :
                Filter.filterMoreSpecific(methods.creates)
                    .concat(methods.updates)

            toPrint.forEach(m =>
                 this.printCreateOrUpdate(iface, m, writer)
            )
        }

        Filter.filterMethods(methods.other)
            .forEach(method => {
                if (isGetter(method)) {
                    return this.printGetter(iface, method, writer)
                }
                if (isRegular(method)) {
                    return this.printRegular(iface, method, writer)
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
            Filter.makeMethod(
                peerMethod(node.name),
                node.returnType,
                [],
                [MethodModifier.GETTER],
                this.isNullable.bind(this, iface, node)
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

    public printFunction(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        const makeOptional = this.makeOptional.bind(this, iface, node)
        const returnTypeInner = innerTypeCommon(node.returnType)
        const nativeCall = this.wrapBindingCall(
            this.makeStaticBindingCall(undefined, node, writer),
            makeOptional(node.returnType),
            writer
        )

        writer.writeFunctionImplementation(
            pascalToCamel(node.name),
            makeSignature(
                Filter.removeArrayLengthParam(Filter.removeContextParam(node.parameters))
                    .map(p => ({
                        name: p.name,
                        type: makeOptional(p),
                        isOptional: p.isOptional
                    })),
                makeOptional(node.returnType)
                ),
            () => {
                writer.writeStatement(
                    isVoidType(node.returnType)
                        ? writer.makeStatement(nativeCall) : writer.makeReturn(nativeCall)
                )
            }
        )
    }

    private printRegular(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        writer.writeExpressionStatement(
            writer.makeString(`/** @deprecated */`)
        )
        writer.writeMethodImplementation(
            Filter.makeMethod(
                peerMethod(node.name),
                PeersConstructions.this.type,
                node.parameters
                    .map(it => createParameter(it.name, it.type)),
                [],
                this.isNullable.bind(this, iface, node)
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

    private makeStaticBindingCall(iface: IDLInterface|undefined, node: IDLMethod, writer: TSLanguageWriter): LanguageExpression {
        return writer.makeFunctionCall(
            PeersConstructions.callBinding(iface?.name ?? '', node.name),
            this.makeBindingArguments(node.parameters, writer)
        )
    }

    private makePeerBindingCall(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): LanguageExpression {
        const params = node.parameters.slice(0)
        params.splice(1, 0, createParameter(PeersConstructions.pointerUsage, createPrimitiveType('pointer')))
        return writer.makeFunctionCall(
            PeersConstructions.callBinding(iface.name, node.name),
            this.makeBindingArguments(params, writer)
        )
    }

    private makeReturnBindingCall(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): LanguageExpression {
        const makeOptional = this.makeOptional.bind(this, iface, node)
        return this.wrapBindingCall(
            this.makePeerBindingCall(iface, node, writer),
            makeOptional(node.returnType),
            writer
        )
    }

    private wrapBindingCall(
        nativeCall: LanguageExpression,
        returnType: IDLType,
        writer: TSLanguageWriter
    ): LanguageExpression {
        const wrapper = unpackWrapper(returnType, this.typechecker)
        const innerType = innerTypeCommon(returnType)

        if (wrapper) {
            const args = [nativeCall]
            if (hasFactoryArgument(wrapper) && isReferenceType(innerType)) {
                args.push(this.makeNativeObjectFactory(innerType, writer));
            }
            if (hasTypeHintArgument(wrapper)) {
                const hint = typeHintArgument(innerType, this.typechecker, this.importer)
                if (hint) {
                    args.push(writer.makeString(hint))
                }
            }
            return writer.makeFunctionCall(wrapper, args)
        }

        const convertName = (ref: IDLReferenceType): string =>
            makeEnoughQualifiedName(ref, this.typechecker.resolveReference.bind(this.typechecker))
        const resolvedType =
            isReferenceType(innerType) ? this.typechecker.resolveRecursive(innerType) : innerType

        return isReferenceType(innerType) && resolvedType && isInterface(resolvedType)
            ? writer.makeNewObject(convertName(innerType), [nativeCall]) : nativeCall
    }

    private makeNativeObjectFactory(type: IDLReferenceType, writer: TSLanguageWriter): LanguageExpression {
        const args = [{ name: 'peer', type: createPrimitiveType('pointer') }];
        const stmts = [
            writer.makeReturn(
                writer.makeNewObject(
                    makeEnoughQualifiedName(type, this.typechecker.resolveReference.bind(this.typechecker)),
                    args.map(a => writer.makeString(a.name))
                )
            )
        ];
        return writer.makeLambda(NamedMethodSignature.make(type, args), stmts);
    }

    private printCreateOrUpdate(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        const extraParameters = CommonGenerator.makeExtraParameters(iface, this.config, this.typechecker)
        writer.writeMethodImplementation(
            Filter.makeMethod(
                `${makeMethodName(node.name)}${iface.name}`,
                node.returnType,
                node.parameters
                    .concat(extraParameters),
                [MethodModifier.STATIC],
                this.isNullable.bind(this, iface, node)
            ),
            (writer: TSLanguageWriter) => {
                const nativeCall = this.makeStaticBindingCall(iface, node, writer)
                const varName = 'result'
                const makeStmt = (property: ExtraParameter) =>
                    CommonGenerator.makeExtraStatement(
                        property,
                        CommonGenerator.resolveProperty(property, iface, this.typechecker),
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

    private makeBindingArguments(parameters: readonly IDLParameter[], writer: TSLanguageWriter): LanguageExpression[] {
        return parameters
            .map(it => createParameter(mangleIfKeyword(it.name), it.type))
            .reduce((prev, param, index, arr) => {
                if (Filter.isArrayLengthParam(param)) {
                    const seqInd = index > 0 && isSequence(arr[index - 1].type) ? index - 1 :
                        index < arr.length && isSequence(arr[index + 1].type) ? index + 1 : -1;
                    if (seqInd !== -1) {
                        return [...prev, PeersConstructions.arrayLength(arr[seqInd].name)]
                    }
                    console.warn(`Parameter ${param.name} at index ${index} \
                                 matches array length heuristic but has no sequnce parameter!`);

                } else if (isSequence(param.type)) {
                    return [...prev, isString(param.type.elementType[0]) ?
                        PeersConstructions.passStringArray(param.name) : PeersConstructions.passNodeArray(param.name)]
                }

                return [...prev, this.bindingParameterTypeConvertor.convertType(param.type)(param.name)].flat()
            }, [] as string[])
            .map(it => writer.makeString(it))
    }

    private makeOptional(
        iface: IDLInterface,
        method: IDLMethod,
        param: IDLParameter|IDLType
    ): IDLType {
        return Filter.makeOptionalType(param, this.isNullable.bind(this, iface, method))
    }

    private isNullable(
        iface: IDLInterface,
        method: IDLMethod,
        param: IDLParameter|IDLType
    ): boolean {
        const isParam = isParameter(param)
        const type = isParam ? param.type : param
        if (!isParam && isCreateOrUpdate(method.name)) return false
        if (!isParam && this.config.nonNullable.isNonNullableReturnType(iface.name, method.name)) return false
        if (isParam && this.config.nonNullable.isNonNullableParameter(iface.name, method.name, param.name)) return false;
        return Filter.isNullableType(type, this.typechecker)
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
            createPrimitiveType('undefined'),
            [FieldModifier.PROTECTED, FieldModifier.READONLY]
        )
    }
}
