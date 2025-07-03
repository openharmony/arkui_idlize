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

import { removeExt, renameClassToBuilderClass, Language, generifiedTypeName, LayoutNodeRole, MethodSignature } from '@idlizer/core'
import { MethodModifier, Method, Field, NamedMethodSignature } from "../LanguageWriters";
import { LanguageWriter, PeerLibrary,
    BuilderClass, methodsGroupOverloads
} from "@idlizer/core";
import { collapseSameNamedMethods } from "./OverloadsPrinter";
import { TargetFile } from "./TargetFile"
import { ImportsCollector } from "../ImportsCollector"
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { createOptionalType, createReferenceType, forceAsNamedNode, IDLType, IDLVoidType, isOptionalType } from '@idlizer/core/idl'
import { collectDeclDependencies } from "../ImportsCollectorUtils";
import { PrinterResult } from '../LayoutManager';

interface BuilderClassFileVisitor {
    printFile(): PrinterResult[]
}

class TSBuilderClassFileVisitor implements BuilderClassFileVisitor {
    constructor(
        private readonly language: Language,
        private readonly builderClass: BuilderClass,
        private readonly peerLibrary: PeerLibrary) { }

    private printBuilderClass(builderClass: BuilderClass, imports: ImportsCollector, content: LanguageWriter) {
        const writer = content
        const clazz = processTSBuilderClass(builderClass)

        imports.addFeature('KBoolean', '@koalaui/interop')
        imports.addFeature('KStringPtr', '@koalaui/interop')
        collectDeclDependencies(this.peerLibrary, clazz.declaration, imports)
        if (clazz.declaration.inheritance.length) {
            const maybeParents = [
                ...this.peerLibrary.buildersToGenerate.values()
            ]
            const parentDecl = maybeParents.find(it => it.name === clazz.declaration.inheritance[0].name)
            collectDeclDependencies(this.peerLibrary, parentDecl!.declaration, imports)
        }
        const currentModule = removeExt(renameClassToBuilderClass(clazz.name, this.peerLibrary.language))

        const superType = generifiedTypeName(clazz.superClass)

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, isOptionalType(field.type))
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.name, ctor.signature, writer => {
                        ctor.signature.args
                            .forEach((it, i) => {
                                const argName = ctor.signature.argName(i)
                                const fieldName = syntheticName(argName)
                                writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                            })
                    }, superType ? {delegationArgs: []} : undefined)
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

    printFile(): PrinterResult[] {
        const content = this.peerLibrary.createLanguageWriter(this.language)
        const imports = new ImportsCollector()
        this.printBuilderClass(this.builderClass, imports, content)
        return [{
            over: {
                node: this.builderClass.declaration,
                role: LayoutNodeRole.INTERFACE
            },
            collector: imports,
            content: content,
        }]
    }
}

class JavaBuilderClassFileVisitor implements BuilderClassFileVisitor {

    private readonly printer: LanguageWriter = this.library.createLanguageWriter(this.library.language)

    constructor(
        private readonly library: PeerLibrary,
        private readonly builderClass: BuilderClass,
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

        const returnType = createReferenceType(clazz.declaration)
        const constructors = clazz.constructors.map(it => this.convertBuilderMethod(it, returnType, clazz.name))
        const methods = clazz.methods.map(it => this.convertBuilderMethod(it, returnType))

        return new BuilderClass(
            clazz.declaration,
            clazz.name,
            clazz.generics,
            clazz.isInterface,
            clazz.superClass,
            fields,
            constructors,
            methods,
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

    printFile(): PrinterResult[] {
        this.printBuilderClass(this.builderClass)
        return [{
            over: {
                node: this.builderClass.declaration,
                role: LayoutNodeRole.INTERFACE
            },
            collector: new ImportsCollector(),
            content: this.printer
        }]
    }
}

class CJBuilderClassFileVisitor implements BuilderClassFileVisitor {
    constructor(
        private readonly peerLibrary: PeerLibrary,
        private readonly builderClass: BuilderClass
    ) { }

    private printBuilderClass(builderClass: BuilderClass, imports: ImportsCollector, content: LanguageWriter) {
        const writer = content
        const clazz = processCJBuilderClass(builderClass)
        // processTSBuilderClass(builderClass)

        collectDeclDependencies(this.peerLibrary, clazz.declaration, imports)
        if (clazz.declaration.inheritance.length) {
            const maybeParents = [
                ...this.peerLibrary.buildersToGenerate.values()
            ]
            const parentDecl = maybeParents.find(it => it.name === clazz.declaration.inheritance[0].name)
            collectDeclDependencies(this.peerLibrary, parentDecl!.declaration, imports)
        }
        const currentModule = removeExt(renameClassToBuilderClass(clazz.name, this.peerLibrary.language))

        const superType = generifiedTypeName(clazz.superClass)

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, isOptionalType(field.type), writer.makeNull())
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation('init', ctor.signature, writer => {
                        ctor.signature.args
                            .forEach((it, i) => {
                                const argName = ctor.signature.argName(i)
                                const fieldName = syntheticName(argName)
                                writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                            })
                    }, superType ? {delegationArgs: []} : undefined)
                })

            // clazz.methods
            //     .filter(method => method.modifiers?.includes(MethodModifier.STATIC))
            //     .forEach(staticMethod => {
            //         writer.writeMethodImplementation(staticMethod, writer => {
            //             const sig = staticMethod.signature
            //             const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
            //             const obj = forceAsNamedNode(sig.returnType).name
            //             // TBD: Use writer.makeObjectAlloc()
            //             writer.writeStatement(writer.makeReturn(writer.makeString(`${obj}(${args})`)))
            //         })
            //     })

            // clazz.methods
            //     .filter(method => !method.modifiers?.includes(MethodModifier.STATIC))
            //     .forEach(method => {
            //         writer.writeMethodImplementation(method, writer => {
            //             const argName = method.signature.argName(0)
            //             const fieldName = syntheticName(method.name)
            //             writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
            //             writer.writeStatement(writer.makeReturn(writer.makeString("this")))
            //         })
            //     })
        }, superType, clazz.generics?.map(it => it))
    }

    printFile(): PrinterResult[] {
        const content = this.peerLibrary.createLanguageWriter(Language.CJ)
        const imports = new ImportsCollector()
        this.printBuilderClass(this.builderClass, imports, content)
        return [{
            over: {
                node: this.builderClass.declaration,
                role: LayoutNodeRole.INTERFACE
            },
            collector: imports,
            content: content,
        }]
    }
}

class KotlinBuilderClassFileVisitor implements BuilderClassFileVisitor {
    constructor(
        private readonly peerLibrary: PeerLibrary,
        private readonly builderClass: BuilderClass
    ) { }

    private printBuilderClass(builderClass: BuilderClass, imports: ImportsCollector, content: LanguageWriter) {
        const writer = content
        const clazz = processKotlinBuilderClass(builderClass)
        // processTSBuilderClass(builderClass)

        collectDeclDependencies(this.peerLibrary, clazz.declaration, imports)
        if (clazz.declaration.inheritance.length) {
            const maybeParents = [
                ...this.peerLibrary.buildersToGenerate.values()
            ]
            const parentDecl = maybeParents.find(it => it.name === clazz.declaration.inheritance[0].name)
            collectDeclDependencies(this.peerLibrary, parentDecl!.declaration, imports)
        }
        const currentModule = removeExt(renameClassToBuilderClass(clazz.name, this.peerLibrary.language))

        const superType = generifiedTypeName(clazz.superClass)

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, isOptionalType(field.type), writer.makeNull())
            })
        }, superType, clazz.generics?.map(it => it))
    }

    printFile(): PrinterResult[] {
        const content = this.peerLibrary.createLanguageWriter(Language.KOTLIN)
        const imports = new ImportsCollector()
        this.printBuilderClass(this.builderClass, imports, content)
        return [{
            over: {
                node: this.builderClass.declaration,
                role: LayoutNodeRole.INTERFACE
            },
            collector: imports,
            content: content,
        }]
    }
}

class BuilderClassVisitor {
    constructor(
        private readonly library: PeerLibrary,
    ) { }

    printBuilderClasses(): PrinterResult[] {
        const builderClasses = [
            ...this.library.buildersToGenerate.values()
        ]
        console.log(`Builder classes: ${builderClasses.length}`)

        const language = this.library.language
        return builderClasses.flatMap(clazz => {
            let visitor: BuilderClassFileVisitor
            if ([Language.ARKTS, Language.TS].includes(language)) {
                visitor = new TSBuilderClassFileVisitor(language, clazz, this.library)
            }
            else if ([Language.JAVA].includes(language)) {
                visitor = new JavaBuilderClassFileVisitor(this.library, clazz)
            }
            else if ([Language.CJ].includes(language)) {
                visitor = new CJBuilderClassFileVisitor(this.library, clazz)
            }
            else if (language === Language.KOTLIN) {
                visitor = new KotlinBuilderClassFileVisitor(this.library, clazz)
            }
            else {
                throw new Error(`Unsupported language ${language.toString()} in BuilderClassPrinter`)
            }

            return visitor.printFile()
        })
    }
}

export function printBuilderClasses(peerLibrary: PeerLibrary): PrinterResult[] {
    const visitor = new BuilderClassVisitor(peerLibrary)
    const result = visitor.printBuilderClasses()
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
        clazz.declaration,
        clazz.name,
        clazz.generics,
        clazz.isInterface,
        clazz.superClass,
        fields,
        constructors,
        methods,
    )
}

function processCJBuilderClass(clazz: BuilderClass): BuilderClass {
    const methods = clazz.methods
    let constructors = clazz.constructors

    if (!constructors || constructors.length == 0) {
        // make a constructor from a static method parameters
        const staticMethods = methods.
            filter(method => method.modifiers?.includes(MethodModifier.STATIC))

        if (staticMethods.length > 0) {
            const staticSig = staticMethods[0].signature
            const args = staticSig.args
            const ctorSig = new NamedMethodSignature(IDLVoidType, args, args.map((_, i) => staticSig.argName(i)))
            constructors = [new Method("init", ctorSig)]
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
        clazz.declaration,
        clazz.name,
        clazz.generics,
        clazz.isInterface,
        clazz.superClass,
        fields,
        constructors,
        methods,
    )
}

function processKotlinBuilderClass(clazz: BuilderClass): BuilderClass {
    const methods = clazz.methods
    let constructors = clazz.constructors

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
        clazz.declaration,
        clazz.name,
        clazz.generics,
        clazz.isInterface,
        clazz.superClass,
        fields,
        constructors,
        methods,
    )
}
