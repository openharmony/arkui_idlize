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
import { accessorStructList, completeImplementations, dummyImplementations, modifierStructs } from "./FileGenerators";
import { Materialized, MaterializedClass, MaterializedMethod } from "./Materialized";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";

class AccessorVisitor {
    dummy = new IndentedPrinter()
    real = new IndentedPrinter()
    accessors = new IndentedPrinter()
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
        const apiParameters = method.generateAPIParameters().join(", ")
        const signature = `${method.retType} ${method.implName}(${apiParameters}) {`
        printer.print(signature)
        printer.pushIndent()
    }

    printMethodEpilog(printer: IndentedPrinter) {
        printer.popIndent()
        printer.print(`}`)
    }

    printRealAndDummyAccessor(clazz: MaterializedClass) {///mv all these smw close to Materialized
        this.accessorList.pushIndent()
        this.printMaterializedClassProlog(clazz)
        this.dummy.print(`/// ${clazz.className}`)
        this.printMaterializedMethod(this.dummy, clazz.ctor)
        this.printMaterializedMethod(this.dummy, clazz.dtor)
        clazz.methods.forEach(method => {
            this.printMaterializedMethod(this.dummy, method)
            ///real
            // const parameterList = m.params
            //     .map(([name, type]) => `${type} ${name}`)
            //     .join(", ")
            // this.dummy.print(`/// ${m.returnType} ${clazz.className}_${m.methodName}(${parameterList}) {`)
            // this.dummy.print(`///   ${m.returnType} result;`)
            // /// printDummyImplFunctionBody(method)
            // this.dummy.print(`///   return result;`)
            // this.dummy.print(`/// }`)
            // this.real.print(`/// ${m.returnType} ${clazz.className}_${m.methodName}(${parameterList}) {\n/// }`)
        })
        this.printMaterializedClassEpilog(clazz)
        this.accessorList.popIndent()
    }

    printMaterializedClassProlog(clazz: MaterializedClass) {
        const accessor = `${clazz.className}Accessor`
        this.accessors.print(`ArkUI${accessor} ${accessor}Impl {`)
        this.accessors.pushIndent()
        this.accessorList.print(`Get${accessor},`)
    }

    printMaterializedClassEpilog(clazz: MaterializedClass) {
        this.accessors.popIndent()
        this.accessors.print(`};\n`)
        const accessor = `${clazz.className}Accessor`
        this.accessors.print(`const ArkUI${accessor}* Get${accessor}() { return &${accessor}Impl; }\n\n`)
    }

    printMaterializedMethod(printer: IndentedPrinter, method: MaterializedMethod) {
        this.printMaterializedMethodProlog(printer, method)
        this.printDummyImplFunctionBody(method)
        this.printMethodEpilog(printer)
        this.accessors.print(`${method.originalParentName}_${method.methodName},`)
    }

    printMaterializedMethodProlog(printer: IndentedPrinter, method: MaterializedMethod) {
        const apiParameters = method.generateAPIParameters().join(", ")
        const signature = `${method.retType} ${method.originalParentName}_${method.methodName}(${apiParameters}) {`
        printer.print(signature)
        printer.pushIndent()
    }
}

export function printRealAndDummyAccessors(peerLibrary: PeerLibrary): {dummy: string, real: string} {
    const visitor = new AccessorVisitor(peerLibrary)
    Materialized.Instance.materializedClasses.forEach(c => visitor.printRealAndDummyAccessor(c))

    const dummy =
        visitor.dummy.getOutput().join("\n") +
        modifierStructs(visitor.accessors.getOutput()) +
        accessorStructList(visitor.accessorList.getOutput())

    const real =
        visitor.real.getOutput().join("\n") +
        modifierStructs(visitor.accessors.getOutput()) +
        accessorStructList(visitor.accessorList.getOutput())
    return {dummy, real}
}