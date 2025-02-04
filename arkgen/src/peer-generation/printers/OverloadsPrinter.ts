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
import { LanguageWriter, PeerClassBase, PeerMethod } from "@idlizer/core"
import { isDefined, Language, throwException, typeOrUnion } from '@idlizer/core'
import { callbackIdByInfo, convertIdlToCallback } from "./EventsPrinter";
import { PeerLibrary } from "../PeerLibrary";
import { ArgConvertor, UndefinedConvertor } from "@idlizer/core"
import { ReferenceResolver, UnionRuntimeTypeChecker, zipMany } from "@idlizer/core";

export function collapseSameNamedMethods(methods: Method[], selectMaxMethodArgs?: number[]): Method {
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
        return idl.maybeOptional(typeOrUnion(types, "%PROXY_BEFORE_PEER%"), optional)
    })

    const returnType = typeOrUnion(methods.map(it => it.signature.returnType))
    return new Method(
        methods[0].name,
        new NamedMethodSignature(
            returnType,
            collapsedArgs,
            (maxMethod.signature as NamedMethodSignature).argsNames
        ),
        methods[0].modifiers,
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
        return typeOrUnion(overloads.flatMap(overload => {
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
    return new PeerMethod(
        overloads[0].originalParentName,
        typeConvertors,
        overloads[0].returnType,
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

export function collapseSameMethodsIDL(methods:idl.IDLMethod[]): CollapsedMethod {
    const parameters = zipMany(...methods.map(it => it.parameters))
        .map(it => {
            let defined: idl.IDLParameter | undefined = undefined
            let isOptional = false
            for (const param of it) {
                if (param) {
                    defined = param
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
                    typeOrUnion(
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

        return {
            methods,
            parameters,
            name: methods[0]?.name ?? throwException('No method to collapse'),
            returnType: methods[0]?.returnType ?? throwException('No method to collapse')
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
        const collapsedMethod = collapseSameNamedMethods(orderedMethods.map(it => it.method))
        if (this.isComponent) {
            this.printer.print(`/** @memo */`)
        }
        this.printer.writeMethodImplementation(collapsedMethod, (writer) => {
            if (this.isComponent) {
                writer.print(`if (this.checkPriority("${collapsedMethod.name}")) {`)
                this.printer.pushIndent()
            }
            if (orderedMethods.length > 1) {
                const runtimeTypeCheckers = collapsedMethod.signature.args.map((_, argIndex) => {
                    const argName = collapsedMethod.signature.argName(argIndex)
                    this.printer.language == Language.JAVA ?
                    this.printer.print(`final byte ${argName}_type = Ark_Object.getRuntimeType(${argName}).value;`) :
                    this.printer.print(`const ${argName}_type = runtimeType(${argName})`)
                    return new UnionRuntimeTypeChecker(
                        orderedMethods.map(m => m.argConvertors[argIndex] ?? OverloadsPrinter.undefinedConvertor))
                })
                orderedMethods.forEach((peerMethod, methodIndex) =>
                    this.printComponentOverloadSelector(peer, collapsedMethod, peerMethod, methodIndex, runtimeTypeCheckers))
                writer.makeThrowError(`Can not select appropriate overload`).write(writer)
            } else {
                this.printPeerCallAndReturn(peer, collapsedMethod, orderedMethods[0])
            }
            if (this.isComponent) {
                this.printer.popIndent()
                this.printer.print(`}`)
                this.printer.writeStatement(this.printer.makeReturn(collapsedMethod.signature.returnType == idl.IDLThisType ? this.printer.makeThis() : undefined))
            }
        })
    }

    printComponentOverloadSelector(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod, methodIndex: number, runtimeTypeCheckers: UnionRuntimeTypeChecker[]) {
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
        this.printer.print(`if (${this.printer.makeNaryOp("&&", argsConditions).asString()}) {`)
        this.printer.pushIndent()
        this.printPeerCallAndReturn(peer, collapsedMethod, peerMethod)
        this.printer.popIndent()
        this.printer.print('}')
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
        if ([Language.TS].includes(this.language))
            peerMethod.method.signature.args.forEach((target, index) => {
                if (this.isComponent) { // TBD: Check for materialized classes
                    const callback = convertIdlToCallback(this.resolver, peer, peerMethod, target)
                    if (!callback)
                        return
                    const argName = argsNames[index]
                    this.printer.writeStatement(new ExpressionStatement(this.printer.makeFunctionCall(`UseEventsProperties`,[
                        new StringExpression(`{${callbackIdByInfo(callback)}: ${argName}}`)
                    ])))
                }
            })
        const returnType = collapsedMethod.signature.returnType
        if (returnType === idl.IDLThisType || returnType === idl.IDLVoidType) {
            this.printer.writeMethodCall(receiver, methodName, argsNames, !isStatic)
            if (returnType === idl.IDLThisType) {
                this.printer.writeStatement(this.printer.makeReturn(this.printer.makeThis()))
            } else {
                this.printer.writeStatement(this.printer.makeReturn())
            }
        } else {
            this.printer.writeStatement(
                this.printer.makeReturn(
                    this.printer.makeMethodCall(receiver, methodName,
                        argsNames.map(it => this.printer.makeString(it)))
                ))
        }
    }
}
