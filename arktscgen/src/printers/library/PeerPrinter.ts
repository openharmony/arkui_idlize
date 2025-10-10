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
    createParameter,
    createProperty,
    createReferenceType,
    FieldModifier,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLPointerType,
    IDLProperty,
    IDLReferenceType,
    IDLType,
    IDLUndefinedType,
    IDLVoidType,
    isInterface,
    isOptionalType,
    isPrimitiveType,
    isProperty,
    isReferenceType,
    isVoidType,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import {
    makeSignature,
    nativeType,
    innerTypeCommon,
    makeEnoughQualifiedName,
    makeMethod,
    isSequence,
    isString,
} from "../../utils/idl"
import {
    isAbstract,
    isContext,
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
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import { Typechecker } from "../../general/Typechecker"
import { BindingParameterTypeConvertor } from "../../type-convertors/top-level/peers/BindingParameterTypeConvertor"
import { unpackWrapper, hasTypeHintArgument, typeHintArgument } from "../../type-convertors/top-level/peers/BindingReturnValueTypeConvertor"
import { Config } from "../../general/Config"
import { ExtraParameter } from "../../options/ExtraParameters"
import assert from "node:assert"
import { pascalToCamel } from "../../utils/string"

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
        this.importer.addSeen(PeersConstructions.peerName(iface.name))
        writer.writeClass(
            PeersConstructions.peerName(iface.name), // XXX: Change peer name to iface.name
            (writer: TSLanguageWriter) => this.printBody(iface, writer),
            this.importer.withPeerImport(_parent)
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
                PeerPrinter.filterMoreSpecific(methods.creates)
                    .concat(methods.updates)

            toPrint.forEach(m =>
                 this.printCreateOrUpdate(iface, m, writer)
            )
        }

        methods.other.forEach(node => {
            if (isGetter(node)) {
                return this.printGetter(iface, node, writer)
            }
            if (isRegular(node)) {
                return this.printRegular(iface, node, writer)
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
            this.makeMethod2(
                peerMethod(node.name),
                node.returnType,
                [],
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

    public printFunction(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): void {
        const returnTypeInner = innerTypeCommon(node.returnType)
        const nativeCall = this.wrapBindingCall(
            this.makeStaticBindingCall(undefined, node, writer),
            node.returnType,
            writer
        )

        writer.writeFunctionImplementation(
            pascalToCamel(node.name),
            makeSignature(
                PeerPrinter.removeArrayLengthParam(PeerPrinter.removeContextParam(node.parameters)),
                node.returnType
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
            this.makeMethod2(
                peerMethod(node.name),
                PeersConstructions.this.type,
                node.parameters
                    .map(it => createParameter(it.name, it.type)),
                []
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
        params.splice(1, 0, createParameter(PeersConstructions.pointerUsage, IDLPointerType))
        return writer.makeFunctionCall(
            PeersConstructions.callBinding(iface.name, node.name),
            this.makeBindingArguments(params, writer)
        )
    }

    private makeReturnBindingCall(iface: IDLInterface, node: IDLMethod, writer: TSLanguageWriter): LanguageExpression {
        return this.wrapBindingCall(
            this.makePeerBindingCall(iface, node, writer),
            node.returnType,
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

        return isOptionalType(returnType) && isReferenceType(innerType) ?
            writer.makeNewObject(convertName(innerType), [nativeCall]) : nativeCall
    }

    public static resolveProperty(
        property: ExtraParameter,
        iface: IDLInterface,
        typechecker: Typechecker
    ): [IDLMethod | IDLProperty, IDLMethod | IDLProperty] {
        const parents = typechecker.flatParents(iface)
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
        typechecker: Typechecker
    ): IDLParameter {
        const type = (m: IDLMethod | IDLProperty) => 'type' in m ? m.type : m.returnType
        const [getter, setter] = this.resolveProperty(param, iface, typechecker)

        return createParameter(param.name, type(getter), param.optional)
    }

    public static makeExtraParameters(
        iface: IDLInterface,
        config: Config,
        typechecker: Typechecker
    ): IDLParameter[] {
        return config.parameters.getParameters(iface.name)
            .map(param => this.makeExtraParameter(param, iface, typechecker))
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
        const extraParameters = PeerPrinter.makeExtraParameters(iface, this.config, this.typechecker)
        writer.writeMethodImplementation(
            this.makeMethod2(
                `${makeMethodName(node.name)}${iface.name}`,
                node.returnType,
                node.parameters
                    .concat(extraParameters),
                [MethodModifier.STATIC]
            ),
            (writer: TSLanguageWriter) => {
                const nativeCall = this.makeStaticBindingCall(iface, node, writer)
                const varName = 'result'
                const makeStmt = (property: ExtraParameter) =>
                    PeerPrinter.makeExtraStatement(
                        property,
                        PeerPrinter.resolveProperty(property, iface, this.typechecker),
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
                if (PeerPrinter.isArrayLengthParam(param)) {
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

    private makeMethod2( name: string, returnType: IDLType, parameters: IDLParameter[], modifiers?: MethodModifier[]): Method {
        return makeMethod(name, PeerPrinter.filterParameters(parameters), returnType, modifiers)
    }

    public static filterMoreSpecific(methods: IDLMethod[]): IDLMethod[] {
        const ifaceName = methods.length && methods[0].parent && isInterface(methods[0].parent) ?  methods[0].parent.name : ''
        const compat = ['ETSTuple', 'ExportNamedDeclaration']

        const noCopyCtor = methods
            .filter(m => !(m.parameters.length === 2 && isContext(m.parameters[0]) && m.parameters[1].name === 'other'))

        if (compat.includes(ifaceName)) {
            return methods
        }

        // This is a simplified algo of UniversalCreateTransformer
        return noCopyCtor.length ?  [
            noCopyCtor.reduce((prev, curr) =>
                curr.parameters.length > prev.parameters.length ? curr : prev,
                noCopyCtor[0]
            )
        ] : noCopyCtor
    }

    public static filterParameters(params: IDLParameter[]): IDLParameter[] {
        return PeerPrinter.removeArrayLengthParam(PeerPrinter.removeContextParam(params))
    }

    public static isArrayLengthParam(param: IDLParameter): boolean {
        return isPrimitiveType(param.type) &&
            ['u32', 'i32', 'u64', 'i64'].includes(param.type.name) &&
            ['Len', 'Count', 'Num', 'argc'].some(m => param.name.endsWith(m))
    }

    public static findArrayLengthParam(parameters: readonly IDLParameter[], startIndex: number = 0): number {
        let seqInd = parameters.findIndex((p, index) => index >= startIndex && isSequence(p.type))
        while (seqInd !== -1) {
            if (seqInd > 0 && this.isArrayLengthParam(parameters[seqInd - 1])) {
                return seqInd - 1
            }
            if (seqInd + 1 < parameters.length && this.isArrayLengthParam(parameters[seqInd + 1])) {
                return seqInd + 1
            }
            seqInd = parameters.findIndex((p, index) => index >= (startIndex + seqInd + 1) && isSequence(p.type))

        }
        return -1;
    }

    public static removeArrayLengthParam(parameters: readonly IDLParameter[]): IDLParameter[] {
        const params = [...parameters]
        let index = this.findArrayLengthParam(params)
        while (index !== -1) {
            params.splice(index, 1)
            index = this.findArrayLengthParam(params, index)
        }
        return params
    }

    public static removeContextParam(parameters: readonly IDLParameter[]): IDLParameter[] {
        const first = parameters.at(0)
        return first && isContext(first) ? parameters.slice(1) : [...parameters]
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
