/*
 * Copyright (c) 2025 Huawei Device Co., LtConf.
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

import { DiagnosticMessageGroup, DiagnosticResults, forEachChild, Location} from "@idlizer/core";
import { hasExtAttribute, IDLExtendedAttributes, IDLFile, IDLNode, IDLReferenceType, isInterface, isMethod, isPrimitiveType, isReferenceType } from "@idlizer/core/idl"
import { GeneratorLibrary } from "./library";

const InputFatal = new DiagnosticMessageGroup("error", "InputFatal", "Input error")
const InputWarning = new DiagnosticMessageGroup("warning", "InputWarning", "Input warning")

function over<T, U>(x:T | undefined, op:(x:T) => U): U | undefined {
    if (x === undefined) {
        return undefined
    }
    return op(x)
}

class DiagnosticRunner {
    constructor(
        private library: GeneratorLibrary
    ) {}

    private forEach(op:(node:IDLNode) => void) {
        this.library.files.forEach(file => {
            this.withFile(file, () => {
                forEachChild(file, node => op(node))
            })
        })
    }

    private currentFile: IDLFile | undefined = undefined
    private withFile<T>(file:IDLFile, op:() => T): T {
        this.currentFile = file
        const r = op()
        this.currentFile = undefined
        return r
    }

    private fileLocation(): Location[] {
        return over(this.currentFile?.fileName, documentPath => [{ documentPath }]) ?? []
    }

    private nodeLocation(node:IDLNode): Location[] {
        return over(node.nodeLocation, x => [x]) ?? this.fileLocation()
    }

    private nameLocation(node:IDLNode): Location[] {
        return over(node.nameLocation, x => [x]) ?? this.fileLocation()
    }

    private alreadyCheckedReferences: Set<IDLReferenceType> = new Set()
    checkLegacyTypes() {
        this.forEach(node => {
            if (isReferenceType(node) && node.name === 'KFloat32ArrayPtr') {
                this.alreadyCheckedReferences.add(node)
                InputFatal.reportDiagnosticMessage(
                    this.nodeLocation(node),
                    'Outdated type. Use buffer instead',
                    'This type was inherited from .d.ts, but should be replaced with buffer',
                )
            }
            if (isReferenceType(node) && node.name === 'KInt32ArrayPtr') {
                this.alreadyCheckedReferences.add(node)
                InputFatal.reportDiagnosticMessage(
                    this.nodeLocation(node),
                    'Outdated type. Use buffer instead',
                    'This type was inherited from .d.ts, but should be replaced with buffer',
                )
            }
        })
    }

    checkSupportedTypes() {
        this.forEach(node => {
            if (isPrimitiveType(node, 'number')) {
                InputFatal.reportDiagnosticMessage(
                    this.nodeLocation(node),
                    `'number' is not supported`,
                    `'number' type is not supported. Please use either 'i32 'or 'f32'`
                )
            }
        })
    }

    checkMethods() {
        this.forEach(node => {
            if (isMethod(node) && node.name === 'getFinalizer') {
                InputFatal.reportDiagnosticMessage(
                    this.nodeLocation(node),
                    'This method is collides with generated',
                    'Do not provide explicit getFinalizer method. It would be generated'
                )
            }
        })
    }

    checkUnresolvedReferences() {
        this.forEach(node => {
            if (isReferenceType(node)) {
                if (this.alreadyCheckedReferences.has(node)) {
                    return
                }
                const found = this.library.toDeclarationSafe(node)
                if (!found) {
                    InputFatal.reportDiagnosticMessage(
                        this.nodeLocation(node),
                        'Unresolved reference',
                        'The reference is not resolved'
                    )
                }
            }
        })
    }

    checkDataClasses() {
        this.forEach(node => {
            if (isInterface(node) && hasExtAttribute(node, IDLExtendedAttributes.DataClass)) {
                if (node.methods.length) {
                    InputWarning.reportDiagnosticMessage(
                        this.nameLocation(node),
                        'DataClass has methods',
                        'DataClass methods will be ignored. DataClass generated based on a constructor'
                    )
                }
            }
        })
    }
}

export function doInputDiagnostics(library:GeneratorLibrary): void {
    const runner = new DiagnosticRunner(library)
    runner.checkLegacyTypes()
    runner.checkSupportedTypes()
    runner.checkMethods()
    runner.checkUnresolvedReferences()
    runner.checkDataClasses()
}