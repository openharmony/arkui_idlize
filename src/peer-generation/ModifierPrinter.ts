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

import { IndentedPrinter } from "../IndentedPrinter";
import { PrimitiveType } from "./DeclarationTable";
import { accessorStructList, completeImplementations, dummyImplementations, modifierStructList, modifierStructs } from "./FileGenerators";
import { Materialized, MaterializedClass } from "./Materialized";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";

class ModifierVisitor {
    dummy = new IndentedPrinter()
    real = new IndentedPrinter()
    modifiers = new IndentedPrinter()
    modifierList = new IndentedPrinter()
    accessorList = new IndentedPrinter()

    constructor(
        private library: PeerLibrary,
    ) { }

    printDummyImplFunctionBody(method: PeerMethod) {
        this.dummy.print(`string out("${method.methodName}(");`)
        method.argConvertors.forEach((argConvertor, index) => {
            if (index > 0) this.dummy.print(`out.append(", ");`)
            this.dummy.print(`WriteToString(&out, ${argConvertor.param});`)
        })
        this.dummy.print(`out.append(")");`)
        this.dummy.print(`appendGroupedLog(1, out);`)
        if (method.retType != "void") this.dummy.print(`return 0;`)
    }

    printModifierImplFunctionBody(method: PeerMethod) {
        const firstDeclarationTarget = method.declarationTargets[0]
        const firstArgConvertor = method.argConvertors[0]
        if (firstDeclarationTarget && !(firstDeclarationTarget instanceof PrimitiveType)) {
            const declarationTable = this.library.declarationTable
            declarationTable.generateFirstArgDestruct(firstArgConvertor, firstDeclarationTarget, this.real, firstArgConvertor.isPointerType())
        }
        if (method.retType != "void") this.real.print(`return 0;`)
    }

    printMethodProlog(printer: IndentedPrinter, method: PeerMethod) {
        const apiParameters = method.generateAPIParameters(method.argConvertors).join(", ")
        const signature = `${method.retType} ${method.implName}(${apiParameters}) {`
        printer.print(signature)
        printer.pushIndent()
    }

    printMethodEpiog(printer: IndentedPrinter) {
        printer.popIndent()
        printer.print(`}`)
    }

    printRealAndDummyModifier(method: PeerMethod) {
        this.printMethodProlog(this.dummy, method)
        this.printMethodProlog(this.real, method)
        this.printDummyImplFunctionBody(method)
        this.printModifierImplFunctionBody(method)
        this.printMethodEpiog(this.dummy)
        this.printMethodEpiog(this.real)

        this.modifiers.print(`${method.implName},`)
    }

    printMaterializedMethodProlog(printer: IndentedPrinter, method: PeerMethod) {
        printer.print(`/// matmethod ${method.methodName}: ${method.retType}`)
        const apiParameters = method.generateAPIParameters(method.argConvertors).join(", ")
        const signature = `${method.retType} ${method.implName}(${apiParameters}) {`
        printer.print(signature)
        printer.pushIndent()
    }

    printRealAndDummyAccessor(clazz: MaterializedClass) {
        this.accessorList.pushIndent()
        this.printMaterializedClassProlog(clazz)
        this.dummy.print(`/// matmethod ${clazz.className}_construct`)
        this.modifiers.print(`// ${clazz.className}_construct,`) ///uncomment
        // this.printMaterializedMethodProlog(this.dummy, matClass.cons)
        clazz.methods.forEach(m => {
            this.modifiers.print(`// ${clazz.className}_${m.methodName},`) ///uncomment
            const parameterList = m.params
                .map(([name, type]) => `${type} ${name}`)
                .join(", ")
            this.dummy.print(`/// ${m.returnType} ${clazz.className}_${m.methodName}(${parameterList}) {`)
            this.dummy.print(`///   ${m.returnType} result;`)
            /// printDummyImplFunctionBody(method)
            this.dummy.print(`///   return result;`)
            this.dummy.print(`/// }`)
            this.real.print(`/// ${m.returnType} ${clazz.className}_${m.methodName}(${parameterList}) {\n/// }`)
        })
        this.printMaterializedClassEpilog(clazz)
        this.accessorList.popIndent()
    }

    printMaterializedClassProlog(clazz: MaterializedClass) {
        const accessor = `${clazz.className}Accessor`
        this.modifiers.print(`ArkUI${accessor} ${accessor}Impl {`)
        this.modifiers.pushIndent()
        this.accessorList.print(`Get${accessor},`)
    }

    printMaterializedClassEpilog(clazz: MaterializedClass) {
        this.modifiers.popIndent()
        this.modifiers.print(`};\n`)
        const accessor = `${clazz.className}Accessor`
        this.modifiers.print(`const ArkUI${accessor}* Get${accessor}() { return &${accessor}Impl; }\n\n`)
    }

    printClassProlog(clazz: PeerClass) {
        const component = clazz.componentName
        const modifierStructImpl = `ArkUI${component}ModifierImpl`

        this.modifiers.print(`ArkUI${component}Modifier ${modifierStructImpl} {`)
        this.modifiers.pushIndent()

        this.modifierList.pushIndent()
        this.modifierList.print(`Get${component}Modifier,`)
        this.modifierList.popIndent()
    }

    printClassEpilog(clazz: PeerClass) {
        this.modifiers.popIndent()
        this.modifiers.print(`};\n`)
        const name = clazz.componentName
        this.modifiers.print(`const ArkUI${name}Modifier* Get${name}Modifier() { return &ArkUI${name}ModifierImpl; }\n\n`)
    }

    // TODO: have a proper Peer module visitor
    printRealAndDummyModifiers() {
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => {
                this.printClassProlog(clazz)
                clazz.methods.forEach(method => this.printRealAndDummyModifier(method))
                this.printClassEpilog(clazz)
                //Materialized.Instance.materializedClasses.forEach(c => this.printRealAndDummyAccessor(c))
            })
        })
    }
}

export function printRealAndDummyModifiers(peerLibrary: PeerLibrary): {dummy: string, real: string} {
    const visitor = new ModifierVisitor(peerLibrary)
    visitor.printRealAndDummyModifiers()

    const dummy =
        dummyImplementations(visitor.dummy.getOutput()) +
        modifierStructs(visitor.modifiers.getOutput()) +
        modifierStructList(visitor.modifierList.getOutput()) +
        accessorStructList(visitor.accessorList.getOutput())

    const real =
        completeImplementations(visitor.real.getOutput()) +
        modifierStructs(visitor.modifiers.getOutput()) +
        modifierStructList(visitor.modifierList.getOutput()) +
        accessorStructList(visitor.accessorList.getOutput())
    return {dummy, real}
}