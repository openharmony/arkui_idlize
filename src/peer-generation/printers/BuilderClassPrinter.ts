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

import { removeExt, renameClassToBuilderClass } from "../../util"
import { LanguageWriter, MethodModifier, Method, createLanguageWriter, Field, NamedMethodSignature } from "../LanguageWriters";
import { BuilderClass, methodsGroupOverloads, CUSTOM_BUILDER_CLASSES } from "../BuilderClass";
import { collapseSameNamedMethods } from "./OverloadsPrinter";
import { TargetFile } from "./TargetFile";
import { PrinterContext } from "./PrinterContext";
import { ImportsCollector } from "../ImportsCollector";
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { PeerLibrary } from "../PeerLibrary";
import { Language } from "../../Language";
import { createOptionalType, createReferenceType, forceAsNamedNode, IDLType, IDLVoidType, isOptionalType } from "../../idl";
import { generifiedTypeName } from "../idl/common";

interface BuilderClassFileVisitor {
    printFile(): void
    getTargetFile(): TargetFile
    getOutput(): string[]
}

class TSBuilderClassFileVisitor implements BuilderClassFileVisitor {

    private readonly printer: LanguageWriter = createLanguageWriter(this.language, this.peerLibrary)

    constructor(
        private readonly language: Language,
        private readonly builderClass: BuilderClass,
        private readonly dumpSerialized: boolean,
        private readonly peerLibrary: PeerLibrary) { }

    private printBuilderClass(builderClass: BuilderClass) {
        const writer = this.printer
        const clazz = processTSBuilderClass(builderClass)

        const imports = new ImportsCollector()
        imports.addFeature('KBoolean', '@koalaui/interop')
        imports.addFeature('KStringPtr', '@koalaui/interop')
        clazz.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        const currentModule = removeExt(renameClassToBuilderClass(clazz.name, this.peerLibrary.language))
        imports.print(this.printer, currentModule)

        const superType = generifiedTypeName(clazz.superClass)

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, isOptionalType(field.type))
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.name, ctor.signature, writer => {
                        if (superType) {
                            writer.writeSuperCall([])
                        }
                        ctor.signature.args
                            .forEach((it, i) => {
                                const argName = ctor.signature.argName(i)
                                const fieldName = syntheticName(argName)
                                writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                            })
                    })
                })

            clazz.methods
                .filter(method => method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(staticMethod => {
                    writer.writeMethodImplementation(staticMethod, writer => {
                        const sig = staticMethod.signature
                        const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
                        const obj = forceAsNamedNode(sig.returnType).name
                        // TBD: Use writer.makeObjectAlloc()
                        writer.writeStatement(writer.makeReturn(writer.makeString(`new ${obj}(${args})`)))
                    })
                })

            clazz.methods
                .filter(method => !method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(method => {
                    writer.writeMethodImplementation(method, writer => {
                        const argName = method.signature.argName(0)
                        const fieldName = syntheticName(method.name)
                        writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                        writer.writeStatement(writer.makeReturn(writer.makeString("this")))
                    })
                })
        }, superType, undefined, clazz.generics?.map(it => it))
    }

    printFile(): void {
        this.printBuilderClass(this.builderClass)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(renameClassToBuilderClass(this.builderClass.name, this.language))
    }

    getOutput(): string[] {
        return this.printer.getOutput()
    }
}

class JavaBuilderClassFileVisitor implements BuilderClassFileVisitor {

    private readonly printer: LanguageWriter = createLanguageWriter(this.printerContext.language, this.library)

    constructor(
        private readonly library: PeerLibrary,
        private readonly printerContext: PrinterContext,
        private readonly builderClass: BuilderClass,
        private readonly dumpSerialized: boolean,
    ) { }

    // private synthesizeFieldTS(method: BuilderMethod): BuilderField {
    //     const fieldType = this.printerContext.synthesizedTypes!.getTargetType(method.declarationTargets[0], true)
    //     return new BuilderField(
    //         new Field(syntheticName(method.method.name), fieldType))
    // }

    // private convertBuilderMethodTS(method: BuilderMethod, returnType: IDLType, newMethodName?: string): BuilderMethod {
    //     const oldSignature = method.method.signature as NamedMethodSignature
    //     // const types = method.declarationTargets.map(it => this.printerContext.synthesizedTypes!.getTargetType(it, true))
    //     const signature = new NamedMethodSignature(returnType, types, oldSignature.argsNames, oldSignature.defaults);
    //     return new BuilderMethod(
    //         new Method(
    //             newMethodName ?? method.method.name,
    //             signature,
    //             method.method.modifiers,
    //             method.method.generics,
    //         ),
    //     )
    // }

    // private processBuilderClassTS(clazz: BuilderClass): BuilderClass {
    //     const syntheticFields = clazz.methods
    //         .filter(it => !it.method.modifiers?.includes(MethodModifier.STATIC))
    //         .map(it => this.synthesizeFieldTS(it))
    //     const fields = [...clazz.fields, ...syntheticFields]
    //
    //     const returnType = toIDLType(clazz.name)
    //     const constructors = clazz.constructors.map(it => this.convertBuilderMethodTS(it, returnType, clazz.name))
    //     const methods = clazz.methods.map(it => this.convertBuilderMethodTS(it, returnType))
    //
    //     return new BuilderClass(
    //         clazz.name,
    //         clazz.generics,
    //         clazz.isInterface,
    //         clazz.superClass,
    //         fields,
    //         constructors,
    //         methods,
    //         clazz.importFeatures
    //     )
    // }

    private printPackage(): void {
        this.printer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    // private printBuilderClassTS(clazz: BuilderClass) {
    //     const writer = this.printer
    //     clazz = this.processBuilderClassTS(clazz)
    //
    //     this.printPackage()
    //
    //     writer.writeClass(clazz.name, writer => {
    //
    //         clazz.fields.forEach(field => {
    //             writer.writeFieldDeclaration(field.field.name, field.field.type, field.field.modifiers, isOptionalType(field.field.type))
    //         })
    //
    //         clazz.constructors
    //             .forEach(ctor => {
    //                 writer.writeConstructorImplementation(ctor.method.name, ctor.method.signature, writer => {})
    //             })
    //
    //         clazz.methods
    //             .filter(method => method.method.modifiers?.includes(MethodModifier.STATIC))
    //             .forEach(staticMethod => {
    //                 writer.writeMethodImplementation(staticMethod.method, writer => {
    //                     const sig = staticMethod.method.signature
    //                     const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
    //                     writer.writeStatement(writer.makeReturn(writer.makeString(`new ${clazz.name}(${args})`)))
    //                 })
    //             })
    //
    //         clazz.methods
    //             .filter(method => !method.method.modifiers?.includes(MethodModifier.STATIC))
    //             .forEach(method => {
    //                 writer.writeMethodImplementation(method.method, writer => {
    //                     const argName = method.method.signature.argName(0)
    //                     const fieldName = syntheticName(method.method.name)
    //                     writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
    //                     writer.writeStatement(writer.makeReturn(writer.makeString("this")))
    //                 })
    //             })
    //     })
    // }

    private synthesizeField(method: Method): Field {
        return new Field(syntheticName(method.name), method.signature.args[0])
    }

    private convertBuilderMethod(method: Method, returnType: IDLType, newMethodName?: string): Method {
        const oldSignature = method.signature as NamedMethodSignature
        const signature = new NamedMethodSignature(returnType, oldSignature.args, oldSignature.argsNames, oldSignature.defaults);
        return new Method(
            newMethodName ?? method.name,
            signature,
            method.modifiers,
            method.generics)
    }

    private processBuilderClass(clazz: BuilderClass): BuilderClass {
        const syntheticFields = clazz.methods
            .filter(it => !it.modifiers?.includes(MethodModifier.STATIC))
            .map(it => this.synthesizeField(it))
        const fields = [...clazz.fields, ...syntheticFields]

        const returnType = createReferenceType(clazz.name)
        const constructors = clazz.constructors.map(it => this.convertBuilderMethod(it, returnType, clazz.name))
        const methods = clazz.methods.map(it => this.convertBuilderMethod(it, returnType))

        return new BuilderClass(
            clazz.name,
            clazz.generics,
            clazz.isInterface,
            clazz.superClass,
            fields,
            constructors,
            methods,
            clazz.importFeatures
        )
    }

    private printBuilderClass(clazz: BuilderClass) {
        const writer = this.printer
        clazz = this.processBuilderClass(clazz)

        this.printPackage()

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, isOptionalType(field.type))
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.name, ctor.signature, writer => {})
                })

            clazz.methods
                .filter(method => method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(staticMethod => {
                    writer.writeMethodImplementation(staticMethod, writer => {
                        const sig = staticMethod.signature
                        const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
                        writer.writeStatement(writer.makeReturn(writer.makeString(`new ${clazz.name}(${args})`)))
                    })
                })

            clazz.methods
                .filter(method => !method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(method => {
                    writer.writeMethodImplementation(method, writer => {
                        const argName = method.signature.argName(0)
                        const fieldName = syntheticName(method.name)
                        writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                        writer.writeStatement(writer.makeReturn(writer.makeString("this")))
                    })
                })
        })
    }

    printFile(): void {
        this.printBuilderClass(this.builderClass)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(this.builderClass.name + this.printerContext.language.extension, ARKOALA_PACKAGE_PATH)
    }

    getOutput(): string[] {
        return this.printer.getOutput()
    }
}

class BuilderClassVisitor {
    readonly builderClasses: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private printerContext: PrinterContext,
        private readonly dumpSerialized: boolean,
    ) { }

    customBuildersToGenerate(): BuilderClass[] {
        return CUSTOM_BUILDER_CLASSES
    }

    printBuilderClasses(): void {
        const builderClasses = [
            ...this.customBuildersToGenerate(),
            ...this.library.buildersToGenerate.values()
        ]
        console.log(`Builder classes: ${builderClasses.length}`)

        const language = this.printerContext.language
        for (const clazz of builderClasses) {
            let visitor: BuilderClassFileVisitor
            if ([Language.ARKTS, Language.TS].includes(language)) {
                visitor = new TSBuilderClassFileVisitor(language, clazz, this.dumpSerialized, this.library)
            }
            else if ([Language.JAVA].includes(language)) {
                visitor = new JavaBuilderClassFileVisitor(this.library, this.printerContext, clazz, this.dumpSerialized)
            }
            else {
                throw new Error(`Unsupported language ${language.toString()} in BuilderClassPrinter`)
            }

            visitor.printFile()
            const targetFile = visitor.getTargetFile()
            this.builderClasses.set(targetFile, visitor.getOutput())
        }
    }
}

export function printBuilderClasses(peerLibrary: PeerLibrary, printerContext: PrinterContext, dumpSerialized: boolean): Map<TargetFile, string> {
    // TODO: support other output languages
    if (printerContext.language != Language.TS && printerContext.language != Language.ARKTS && printerContext.language != Language.JAVA) {
        return new Map()
    }

    const visitor = new BuilderClassVisitor(peerLibrary, printerContext, dumpSerialized)
    visitor.printBuilderClasses()
    const result = new Map<TargetFile, string>()
    for (const [key, content] of visitor.builderClasses) {
        if (content.length === 0) continue
        result.set(key, content.join('\n'))
    }
    return result
}

function syntheticName(name: string): string {
    return `_${name}`
}

function toSyntheticField(method: Method): Field {
    const type = method.signature.args[0]
    return new Field(syntheticName(method.name), createOptionalType(type))
}

function collapse(methods: Method[]): Method[] {
    const groups = methodsGroupOverloads(methods)
    return groups.map(it => it.length == 1 ? it[0] : collapseSameNamedMethods(it))
}

function processTSBuilderClass(clazz: BuilderClass): BuilderClass {
    const methods = collapse(clazz.methods)
    let constructors = collapse(clazz.constructors)

    if (!constructors || constructors.length == 0) {
        // make a constructor from a static method parameters
        const staticMethods = methods.
            filter(method => method.modifiers?.includes(MethodModifier.STATIC))

        if (staticMethods.length > 0) {
            const staticSig = staticMethods[0].signature
            const args = staticSig.args
            const ctorSig = new NamedMethodSignature(IDLVoidType, args, args.map((_, i) => staticSig.argName(i)))
            constructors = [new Method("constructor", ctorSig)]
        }
    }

    const ctorFields = constructors.flatMap(cons => {
        const ctorSig = cons.signature
        return ctorSig.args.map((type, index) => new Field(syntheticName(ctorSig.argName(index)), createOptionalType(type)))
    })

    const syntheticFields = methods
        .filter(it => !it.modifiers?.includes(MethodModifier.STATIC))
        .map(it => toSyntheticField(it))

    const fields = [...clazz.fields, ...ctorFields, ...syntheticFields]

    return new BuilderClass(
        clazz.name,
        clazz.generics,
        clazz.isInterface,
        clazz.superClass,
        fields,
        constructors,
        methods,
        clazz.importFeatures
    )
}
