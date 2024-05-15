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
import { accessorStructList, modifierStructs } from "./FileGenerators";
import { Materialized, MaterializedClass, MaterializedMethod } from "./Materialized";
import { ModifierVisitor } from "./ModifierPrinter";
import { PeerLibrary } from "./PeerLibrary";

class AccessorVisitor extends ModifierVisitor {
    accessors = new IndentedPrinter()
    accessorList = new IndentedPrinter()

    constructor(library: PeerLibrary) {
        super(library)
    }

    printRealAndDummyAccessor(clazz: MaterializedClass) {
        this.accessorList.pushIndent()
        this.printMaterializedClassProlog(clazz);
        [clazz.ctor, clazz.dtor].concat(clazz.methods).forEach(method => {
            this.printMaterializedMethod(this.dummy, method, m => this.printDummyImplFunctionBody(m))
            this.printMaterializedMethod(this.real, method, m => this.printModifierImplFunctionBody(m))
            this.accessors.print(`${method.originalParentName}_${method.method.name},`)
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

    printMaterializedMethod(printer: IndentedPrinter, method: MaterializedMethod, printBody: (m: MaterializedMethod) => void) {
        this.printMethodProlog(printer, method)
        printBody(method)
        this.printMethodEpilog(printer)
    }
}

export function printRealAndDummyAccessors(peerLibrary: PeerLibrary): {dummy: string, real: string} {
    const visitor = new AccessorVisitor(peerLibrary)
    Materialized.Instance.materializedClasses.forEach(c => visitor.printRealAndDummyAccessor(c))

    const dummy =
        visitor.dummy.getOutput().join("\n") + "\n" +
        modifierStructs(visitor.accessors.getOutput()) +
        accessorStructList(visitor.accessorList.getOutput())

    const real =
        visitor.real.getOutput().join("\n") + "\n" +
        modifierStructs(visitor.accessors.getOutput()) +
        accessorStructList(visitor.accessorList.getOutput())
    return {dummy, real}
}