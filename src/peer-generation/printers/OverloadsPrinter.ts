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

import * as idl from "../../idl"
import { UndefinedConvertor, UnionRuntimeTypeChecker } from "../Convertors"
import { Method, MethodSignature, Type, LanguageWriter, MethodModifier, ExpressionStatement, StringExpression, NamedMethodSignature } from "../LanguageWriters";
import { PeerClass, PeerClassBase } from "../PeerClass";
import { PeerMethod } from "../PeerMethod";
import { isDefined, Language } from "../../util";
import { callbackIdByInfo, canProcessCallback, convertToCallback } from "./EventsPrinter";
import { IdlPeerMethod } from "../idl/IdlPeerMethod";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { typeOrUnion } from "../idl/common";
// import { ArgConvertor as IdlArgConvertor } from "../idl/IdlArgConvertors"
import { ArgConvertor } from "../ArgConvertors";

export function collapseSameNamedMethods(methods: Method[], selectMaxMethodArgs?: number[]): Method {
    if (methods.some(it => it.signature.defaults?.length))
        throw "Can not process defaults in collapsed method"
    const maxArgLength = Math.max(...methods.map(it => it.signature.args.length))
    const maxMethod = methods.find(it => it.signature.args.length === maxArgLength)!
    const collapsedArgs: Type[] = Array.from({length: maxArgLength}, (_, argIndex) => {
        if (selectMaxMethodArgs?.includes(argIndex))
            return maxMethod.signature.args[argIndex]
        const name = methods.map(it => it.signature.args[argIndex]?.name).filter(isDefined).join(' | ')
        const optional = methods.some(it => it.signature.args[argIndex]?.nullable ?? true)
        return new Type(name, optional)
    })
    return new Method(
        methods[0].name,
        new NamedMethodSignature(
            methods[0].signature.returnType,
            collapsedArgs,
            (maxMethod.signature as NamedMethodSignature).argsNames
        ),
        methods[0].modifiers,
        methods[0].generics,
    )
}

export function collapseIdlPeerMethods(library: IdlPeerLibrary, overloads: IdlPeerMethod[], selectMaxMethodArgs?: number[]): IdlPeerMethod {
    const method = collapseSameNamedMethods(overloads.map(it => it.method), selectMaxMethodArgs)
    const maxArgsLength = Math.max(...overloads.map(it => it.declarationTargets.length))
    const maxMethod = overloads.find(it => it.declarationTargets.length === maxArgsLength)!
    const targets: idl.IDLType[] = Array.from({length: maxArgsLength}, (_, argIndex) => {
        if (selectMaxMethodArgs?.includes(argIndex))
            return maxMethod.declarationTargets[argIndex]
        return typeOrUnion(overloads.flatMap(overload => {
            if (overload.declarationTargets.length <= argIndex)
                return []
            const target = overload.declarationTargets[argIndex]
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
            method.signature.args[index].nullable, 
            true
        )
    })
    return new IdlPeerMethod(
        overloads[0].originalParentName,
        targets,
        typeConvertors,
        overloads[0].retConvertor,
        overloads[0].isCallSignature,
        method,
    )
}

export function groupOverloads<T extends PeerMethod | IdlPeerMethod>(peerMethods: T[]): T[][] {
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

export class OverloadsPrinter {
    private static undefinedConvertor = new UndefinedConvertor("OverloadsPrinter")

    constructor(private printer: LanguageWriter, private language: Language, private isComponent: boolean = true) {}

    printGroupedComponentOverloads(peer: PeerClassBase, peerMethods: (PeerMethod | IdlPeerMethod)[]) {
        const orderedMethods = Array.from(peerMethods)
            .sort((a, b) => b.argConvertors.length - a.argConvertors.length)
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
                    this.printer.print(`const ${argName}_type = runtimeType(${argName})`)
                    return new UnionRuntimeTypeChecker(
                        orderedMethods.map(m => m.argConvertors[argIndex] ?? OverloadsPrinter.undefinedConvertor))
                })
                orderedMethods.forEach((peerMethod, methodIndex) =>
                    this.printComponentOverloadSelector(peer, collapsedMethod, peerMethod, methodIndex, runtimeTypeCheckers))
                writer.print(`throw new Error("Can not select appropriate overload")`)
            } else {
                this.printPeerCallAndReturn(peer, collapsedMethod, orderedMethods[0])
            }
            if (this.isComponent) {
                this.printer.popIndent()
                this.printer.print(`}`)
                this.printer.print("return this")
            }
        })
    }

    printComponentOverloadSelector(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod | IdlPeerMethod, methodIndex: number, runtimeTypeCheckers: UnionRuntimeTypeChecker[]) {
        const argsConditions = collapsedMethod.signature.args.map((_, argIndex) =>
            runtimeTypeCheckers[argIndex].makeDiscriminator(collapsedMethod.signature.argName(argIndex), methodIndex, this.printer))
        this.printer.print(`if (${this.printer.makeNaryOp("&&", argsConditions).asString()}) {`)
        this.printer.pushIndent()
        this.printPeerCallAndReturn(peer, collapsedMethod, peerMethod)
        this.printer.popIndent()
        this.printer.print('}')
    }

    private printPeerCallAndReturn(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod | IdlPeerMethod) {
        const argsNames = peerMethod.argConvertors.map((conv, index) => {
            const argName = collapsedMethod.signature.argName(index)
            const castedArgName = `${argName}_casted`
            const castedType = peerMethod.method.signature.args[index]
            if (this.language == Language.ARKTS
                && collapsedMethod.signature.args[index].nullable) {
                this.printer.writeStatement(
                    this.printer.makeCondition(this.printer.makeNaryOp("==",
                            [this.printer.makeString(argName), this.printer.makeString("undefined")]),
                        this.printer.makeStatement(this.printer.makeString(`throw new Error(\"Arg '${argName}' is null\")`))
                    )
                )
            }
            this.printer.print(`const ${castedArgName} = ${argName} as (${this.printer.mapType(castedType)})`)
            return castedArgName
        })
        const isStatic = collapsedMethod.modifiers?.includes(MethodModifier.STATIC)
        const receiver = isStatic
            ? peerMethod.originalParentName
            : this.isComponent ? `this.peer` : `this`
        const postfix = this.isComponent ? "Attribute" : "_serialize"
        const methodName = `${peerMethod.overloadedName}${postfix}`

        if ([Language.TS].includes(this.language))
            peerMethod.declarationTargets.map((target, index) => {
                if (this.isComponent) { // TBD: Check for materialized classes
                    const callback = convertToCallback(peer, peerMethod, target)
                    if (!callback || !canProcessCallback(callback))
                        return
                    const argName = argsNames[index]
                    this.printer.writeStatement(new ExpressionStatement(this.printer.makeFunctionCall(`UseEventsProperties`,[
                        new StringExpression(`{${callbackIdByInfo(callback)}: ${argName}}`)
                    ])))
                }
            })

        const returnType = collapsedMethod.signature.returnType
        if (returnType === Type.This || returnType === Type.Void) {
            this.printer.writeMethodCall(receiver, methodName, argsNames, !isStatic)
            if (returnType === Type.This) {
                this.printer.print(`return this`)
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
