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

import { RuntimeType } from "./PeerGeneratorVisitor";
import { Method, MethodSignature, Type, LanguageWriter, MethodModifier, ExpressionStatement, StringExpression } from "./LanguageWriters";
import { PeerClass, PeerClassBase } from "./PeerClass";
import { PeerMethod } from "./PeerMethod";
import { isDefined } from "../util";
import { callbackIdByInfo, canProcessCallback, convertToCallback } from "./EventsPrinter";
import { PeerLibrary } from "./PeerLibrary";

export function collapseSameNamedMethods(methods: Method[]): Method {
    if (methods.some(it => it.signature.defaults?.length))
        throw "Can not process defaults in collapsed method"
    const maxArgLength = Math.max(...methods.map(it => it.signature.args.length))
    const collapsedArgs: Type[] = Array.from({length: maxArgLength}, (_, argIndex) => {
        const name = methods.map(it => it.signature.args[argIndex]?.name).filter(isDefined).join(' | ')
        const optional = methods.some(it => it.signature.args[argIndex]?.nullable ?? true)
        return new Type(name, optional)
    })
    return new Method(
        methods[0].name,
        new MethodSignature(
            methods[0].signature.returnType,
            collapsedArgs,
        ),
        methods[0].modifiers
    )
}

export function groupOverloads(peerMethods: PeerMethod[]): PeerMethod[][] {
    const seenNames = new Set<string>()
    const groups: PeerMethod[][] = []
    for (const method of peerMethods) {
        if (seenNames.has(method.method.name))
            continue
        seenNames.add(method.method.name)
        groups.push(peerMethods.filter(it => it.method.name === method.method.name))
    }
    return groups
}

export class OverloadsPrinter {

    constructor(private printer: LanguageWriter, private library: PeerLibrary, private isComponent: boolean = true) {}

    printGroupedComponentOverloads(peer: PeerClassBase, peerMethods: PeerMethod[]) {
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
                const argsNames = collapsedMethod.signature.args.map((_, index) => collapsedMethod.signature.argName(index))
                for (let i = 0; i < collapsedMethod.signature.args.length; i++) {
                    this.printer.print(`const ${argsNames[i]}_type = runtimeType(${argsNames[i]})`)
                }
                for (const peerMethod of orderedMethods)
                    this.printComponentOverloadSelector(peer, collapsedMethod, peerMethod)
                writer.print(`throw "Can not select appropriate overload"`)
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

    printComponentOverloadSelector(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod) {
        const argsConditions = collapsedMethod.signature.args.map((_, argIndex) => {
            const runtimeTypes = peerMethod.argConvertors[argIndex]?.runtimeTypes ?? [RuntimeType.UNDEFINED]
            const value = collapsedMethod.signature.argName(argIndex)
            let maybeComma1 = (runtimeTypes.length > 1) ? "(" : ""
            let maybeComma2 = (runtimeTypes.length > 1) ? ")" : ""
            return `(${runtimeTypes.map(it => `${maybeComma1}RuntimeType.${RuntimeType[it]} == ${value}_type${maybeComma2}`).join(" || ")})`
        })
        this.printer.print(`if (${argsConditions.join(" && ")}) {`)
        this.printer.pushIndent()
        this.printPeerCallAndReturn(peer, collapsedMethod, peerMethod)
        this.printer.popIndent()
        this.printer.print('}')
    }

    private printPeerCallAndReturn(peer: PeerClassBase, collapsedMethod: Method, peerMethod: PeerMethod) {
        const argsNames = peerMethod.argConvertors.map((conv, index) => {
            const argName = collapsedMethod.signature.argName(index)
            const castedArgName = `${argName}_casted`
            const castedType = peerMethod.method.signature.args[index].name
            this.printer.print(`const ${castedArgName} = ${argName} as (${castedType})`)
            return castedArgName
        })
        const isStatic = collapsedMethod.modifiers?.includes(MethodModifier.STATIC)
        const receiver = isStatic
            ? peerMethod.originalParentName
            : this.isComponent ? `this.peer` : `this`
        const postfix = this.isComponent ? "Attribute" : "_serialize"
        const methodName = `${peerMethod.overloadedName}${postfix}`

        peerMethod.declarationTargets.map((target, index) => {
            if (this.isComponent) { // TBD: Check for materialized classes
                const callback = convertToCallback(peer, peerMethod, target)
                if (!callback || !canProcessCallback(this.library.declarationTable, callback))
                    return
                const argName = argsNames[index]
                this.printer.writeStatement(new ExpressionStatement(this.printer.makeFunctionCall(`UseProperties`,[
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