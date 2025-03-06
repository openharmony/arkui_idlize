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

import * as idl from '@idlizer/core/idl'
import {
    ExpressionStatement,
    LanguageExpression,
    Method,
    MethodModifier,
    NamedMethodSignature,
    StringExpression
} from "../LanguageWriters";
import { LanguageWriter, PeerClassBase, PeerMethod, PeerLibrary } from "@idlizer/core"
import { isDefined, Language, throwException, collapseTypes } from '@idlizer/core'
import { ArgConvertor, UndefinedConvertor } from "@idlizer/core"
import { ReferenceResolver, UnionRuntimeTypeChecker, zipMany } from "@idlizer/core";
import { peerGeneratorConfiguration } from '../../DefaultConfiguration';

function collapseReturnTypes(types: idl.IDLType[], language?: Language) {
    let returnType: idl.IDLType = collapseTypes(types)
    if (idl.isUnionType(returnType) && language && (language == Language.ARKTS || language == Language.TS)) {
        let newTypes = returnType.types.map(it => idl.isVoidType(it) ? idl.IDLUndefinedType : it)
        returnType = idl.createUnionType(newTypes)
    }
    return returnType
}

export function groupSameSignatureMethodsIDL(methods: idl.IDLMethod[]): idl.IDLMethod[][] {
    if (methods.length < 2) return methods.map(it => [it])

    // get methods args
    let params = methods.map(it => it.parameters)
    // cut optional args
    params = params.map(methodParams => methodParams.filter(param => !param.isOptional))
    let types = params.map(methodParams => methodParams.map(param => idl.printType(param.type)))

    // compare methods signatures
    let sameSignatureGroups = new Map<string, idl.IDLMethod[]>()
    types.forEach((methodTypes, idx) => {
        let methodTypesStringify = methodTypes.join(":")
        if (sameSignatureGroups.has(methodTypesStringify)) {
            sameSignatureGroups.get(methodTypesStringify)?.push(methods[idx])
        } else {
            sameSignatureGroups.set(methodTypesStringify, [methods[idx]])
        }
    })

    return Array.from(sameSignatureGroups.values())
}

function groupSameSignatureMethods(methods: PeerMethod[]): PeerMethod[][] {
    if (methods.length < 2) return methods.map(it => [it])

    // get methods args
    let args = methods.map(it => it.method.signature.args)
    // cut optional args
    args = args.map(methArgs => methArgs.filter(type => !idl.isOptionalType(type)))
    let types = args.map(methArgs => methArgs.map(type => idl.printType(type)))

    // compare methods signatures
    let sameSignatureGroups = new Map<string, PeerMethod[]>()
    types.forEach((methodTypes, idx) => {
        let methodTypesStringify = methodTypes.join(":")
        if (sameSignatureGroups.has(methodTypesStringify)) {
            sameSignatureGroups.get(methodTypesStringify)?.push(methods[idx])
        } else {
            sameSignatureGroups.set(methodTypesStringify, [methods[idx]])
        }
    })

    return Array.from(sameSignatureGroups.values())
}

export function collapseSameNamedMethods(methods: Method[], selectMaxMethodArgs?: number[], language?: Language): Method {
    if (methods.some(it => it.signature.defaults?.length))
        throw new Error("Can not process defaults in collapsed method")
    const maxArgLength = Math.max(...methods.map(it => it.signature.args.length))
    const maxMethod = methods.find(it => it.signature.args.length === maxArgLength)!
    const collapsedArgs: idl.IDLType[] = Array.from({length: maxArgLength}, (_, argIndex) => {
        if (selectMaxMethodArgs?.includes(argIndex))
            return maxMethod.signature.args[argIndex]
        const types = methods.map(it => it.signature.args[argIndex]).filter(isDefined)
        const optional = methods.some(it => {
            if (argIndex < it.signature.args.length) {
                return idl.isOptionalType(it.signature.args[argIndex]) ?? false
            } else {
                return true
            }
        })
        return idl.maybeOptional(collapseTypes(types, "%PROXY_BEFORE_PEER%"), optional)
    })

    const returnType = collapseReturnTypes(methods.map(it => it.signature.returnType), language)
    return new Method(
        methods[0].name,
        new NamedMethodSignature(
            returnType,
            collapsedArgs,
            (maxMethod.signature as NamedMethodSignature).argsNames
        ),
        methods[0].modifiers?.includes(MethodModifier.PRIVATE) ?
        methods[0].modifiers :
        [MethodModifier.PUBLIC].concat(methods[0].modifiers ?? []),
        methods[0].generics,
    )
}

export function collapseIdlPeerMethods(library: PeerLibrary, overloads: PeerMethod[], selectMaxMethodArgs?: number[]): PeerMethod {
    const method = collapseSameNamedMethods(overloads.map(it => it.method), selectMaxMethodArgs)
    const maxArgsLength = Math.max(...overloads.map(it => it.method.signature.args.length))
    const maxMethod = overloads.find(it => it.method.signature.args.length === maxArgsLength)!
    const targets: idl.IDLType[] = Array.from({length: maxArgsLength}, (_, argIndex) => {
        if (selectMaxMethodArgs?.includes(argIndex))
            return idl.entityToType(maxMethod.method.signature.args[argIndex])
        return collapseTypes(overloads.flatMap(overload => {
            if (overload.method.signature.args.length <= argIndex)
                return []
            const target = idl.entityToType(overload.method.signature.args[argIndex])
            if (idl.isUnionType(target))
                return target.types
            return [target]
        }))
    })
    const typeConvertors: ArgConvertor[] = targets.map((target, index) => {
        if (selectMaxMethodArgs?.includes(index)) {
            const convertor = maxMethod.argConvertors[index]
            convertor.param = method.signature.argName(index)
            return convertor
        }
        return library.typeConvertor(
            method.signature.argName(index),
            target,
            idl.isOptionalType(method.signature.args[index])
        )
    })

    const returnType = collapseReturnTypes(overloads.map(it => it.returnType), library.language)
    return new PeerMethod(
        overloads[0].originalParentName,
        typeConvertors,
        returnType,
        overloads[0].isCallSignature,
        method,
    )
}

export function groupOverloads<T extends PeerMethod>(peerMethods: T[]): T[][] {
    const seenNames = new Set<string>()
    const groups: T[][] = []
    for (const method of peerMethods) {
        if (seenNames.has(method.method.name))
            continue
        seenNames.add(method.method.name)
        groups.push(peerMethods.filter(it => it.method.name === method.method.name))
    }
    return groups
}

export function groupOverloadsIDL<T extends idl.IDLSignature>(methods:T[]): T[][] {
    const groups = new Map<string, T[]>()
    for (const method of methods) {
        if (!groups.has(method.name)) {
            groups.set(method.name, [])
        }
        const bucket = groups.get(method.name)
        bucket?.push(method)
    }
    return Array.from(groups.values())
}

interface CollapsedMethod {
    methods: idl.IDLMethod[]
    name: string
    parameters: idl.IDLParameter[]
    returnType: idl.IDLType
}

export function collapseSameMethodsIDL(methods:idl.IDLMethod[], language?: Language): CollapsedMethod {
    const parameters = zipMany(...methods.map(it => it.parameters))
        .map(it => {
            let defined: idl.IDLParameter | undefined = undefined
            let isOptional = false
            for (const param of it) {
                if (param) {
                    defined = param
                    isOptional = isOptional || param.isOptional
                } else {
                    isOptional = true
                }
            }
            if (!defined) {
                throw new Error("Not found defined parameter")
            }
            return idl.createParameter(
                defined.name,
                idl.maybeOptional(
                    collapseTypes(
                        it.filter(it => it !== undefined)
                            .map(it => it as idl.IDLParameter /* rollup problems */)
                            .map(it => it.type)
                        ),
                        isOptional
                    ),
                isOptional,
                false
            )
        })

        const returnType = collapseReturnTypes(methods.map(it => it.returnType), language)
        return {
            methods,
            parameters,
            name: methods[0]?.name ?? throwException('No method to collapse'),
            returnType: returnType
        }
}

export class OverloadsPrinter {
    private static undefinedConvertor: UndefinedConvertor | undefined

    constructor(private resolver: ReferenceResolver, private printer: LanguageWriter, private language: Language, private isComponent: boolean = true) {
        // TODO: UndefinedConvertor is not known during static initialization because of cyclic dependencies
        if (!OverloadsPrinter.undefinedConvertor) {
            OverloadsPrinter.undefinedConvertor = new UndefinedConvertor("OverloadsPrinter")
        }
    }

    printGroupedComponentOverloads(peer: PeerClassBase, peerMethods: (PeerMethod)[]) {
        const orderedMethods = Array.from(peerMethods)
            .sort((a, b) => b.argConvertors.length - a.argConvertors.length)
            // Methods with a large number of runtime types should have low priority(place below) and we go from specific to general
            .sort((a, b) => {
                const cardinalityA = a.argConvertors
                    .reduce((acc, it) => it.runtimeTypes.length + acc, 0)
                const cardinalityB = b.argConvertors
                    .reduce((acc, it) => it.runtimeTypes.length + acc, 0)
                return cardinalityA - cardinalityB
            })

        if (this.language != Language.ARKTS || peerGeneratorConfiguration().CollapseOverloadsARKTS) {
            this.printCollapsedOverloads(peer, orderedMethods)
        } else {
            // Handle special case for same name AND same signature methods.
            // Collapse same signature methods
            let copy = Array.from([...orderedMethods])
            const groups = groupSameSignatureMethods([...copy])
            for (let group of groups) {
                this.printCollapsedOverloads(peer, group)
            }
        }
    }

    private printCollapsedOverloads(peer: PeerClassBase, methods: PeerMethod[]) {
        if (this.isComponent) {
            this.printer.print(`/** @memo */`)
        }
        const collapsedMethod = collapseSameNamedMethods(methods.map(it => it.method), undefined, this.language)
        this.printer.writeMethodImplementation(collapsedMethod, (writer) => {
            if (this.isComponent) {
                writer.print(`if (this.checkPriority("${collapsedMethod.name}")) {`)
                this.printer.pushIndent()
            }
            if (methods.length > 1) {
                const runtimeTypeCheckers = collapsedMethod.signature.args.map((_, argIndex) => {
                    const argName = collapsedMethod.signature.argName(argIndex)
                    this.printer.language == Language.JAVA ?
                        this.printer.print(`final byte ${argName}_type = Ark_Object.getRuntimeType(${argName}).value;`) :
                        this.printer.print(`const ${argName}_type = runtimeType(${argName})`)
                    return new UnionRuntimeTypeChecker(
                        methods.map(m => m.argConvertors[argIndex] ?? OverloadsPrinter.undefinedConvertor))
                })
                let shallStop = false
                methods.forEach((peerMethod, methodIndex) => {
                    if (!shallStop) {
                        shallStop ||= this.printComponentOverloadSelector(peer, collapsedMethod, peerMethod, methodIndex, runtimeTypeCheckers)
                    }
                })
                if (!shallStop)
                    writer.makeThrowError(`Can not select appropriate overload`).write(writer)
            } else {
                this.printPeerCallAndReturn(peer, collapsedMethod, methods[0])
            }
            if (this.isComponent) {
                this.printer.popIndent()
                this.printer.print(`}`)
                this.printer.writeStatement(this.printer.makeReturn(collapsedMethod.signature.returnType == idl.IDLThisType ? this.printer.makeThis() : undefined))
            }
        })
    }

    private printComponentOverloadSelector(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod, methodIndex: number, runtimeTypeCheckers: UnionRuntimeTypeChecker[]): boolean {
        const argsConditions: LanguageExpression[] = []
        collapsedMethod.signature.args
            .forEach((type, argIndex) => {
                    // Create a type selector for Optional, Union and Enum types
                    let isNeedDiscriminator = idl.isOptionalType(type) || idl.isUnionType(type)
                    if (idl.isReferenceType(type) && !isNeedDiscriminator) {
                        const resolved = this.resolver.resolveTypeReference(idl.createReferenceType(type.name))
                        isNeedDiscriminator = resolved !== undefined && idl.isEnum(resolved)
                    }
                    if (isNeedDiscriminator) {
                        argsConditions.push(runtimeTypeCheckers[argIndex].makeDiscriminator(collapsedMethod.signature.argName(argIndex), methodIndex, this.printer))
                    }
                }
            )
        if (argsConditions.length > 0) {
            this.printer.print(`if (${this.printer.makeNaryOp("&&", argsConditions).asString()}) {`)
            this.printer.pushIndent()
        }
        this.printPeerCallAndReturn(peer, collapsedMethod, peerMethod)
        if (argsConditions.length > 0) {
            this.printer.popIndent()
            this.printer.print('}')
        }
        return argsConditions.length == 0
    }

    private printPeerCallAndReturn(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod) {
        const argsNames = peerMethod.argConvertors.map((conv, index) => {
            const argName = collapsedMethod.signature.argName(index)
            const castedArgName = `${(peerMethod.method.signature as NamedMethodSignature).argsNames[index]}_casted`
            const castedType = peerMethod.method.signature.args[index]
            if (this.printer.language == Language.CJ) {
                this.printer.makeAssign(castedArgName, castedType, this.printer.makeString(argName), true, true).write(this.printer)
            } else if (this.printer.language == Language.JAVA) {
                this.printer.print(`final ${this.printer.getNodeName(castedType)} ${castedArgName} = (${this.printer.getNodeName(castedType)})${argName};`)
            }
            else {
                this.printer.print(`const ${castedArgName} = ${this.printer.escapeKeyword(argName)} as (${this.printer.getNodeName(castedType)})`)
            }
            return castedArgName
        })
        const isStatic = collapsedMethod.modifiers?.includes(MethodModifier.STATIC)
        const receiver = isStatic
            ? peerMethod.getImplementationName()
            : this.isComponent ? `this.getPeer()` : `this`
        const postfix = this.isComponent ? "Attribute" : "_serialize"
        const methodName = `${peerMethod.overloadedName}${postfix}`
        if (collapsedMethod.signature.returnType === idl.IDLThisType) {
            this.printer.writeMethodCall(receiver, methodName, argsNames, !isStatic)
            this.printer.writeStatement(this.printer.makeReturn(this.printer.makeThis()))
        } else if (collapsedMethod.signature.returnType === idl.IDLVoidType) {
            this.printer.writeMethodCall(receiver, methodName, argsNames, !isStatic)
            this.printer.writeStatement(this.printer.makeReturn())
        } else if (peerMethod.returnType === idl.IDLVoidType && idl.isUnionType(collapsedMethod.signature.returnType)) {
            // handling case when there is two original functions:
            // foo(): boolean
            // foo(cb: (boolean) => void): void
            // and collapsed return type is `boolean | undefined`, so we want to return `undefined` on the second overload
            this.printer.writeMethodCall(receiver, methodName, argsNames, !isStatic)
            this.printer.writeStatement(this.printer.makeReturn(this.printer.makeUndefined()))
        } else {
            this.printer.writeStatement(
                this.printer.makeReturn(
                    this.printer.makeMethodCall(receiver, methodName,
                        argsNames.map(it => this.printer.makeString(it)))
                ))
        }
    }
}
