import { Language, removeExt, renameClassToBuilderClass, renameClassToMaterialized } from "../../util"
import { LanguageWriter, MethodModifier, Method, Type, createLanguageWriter, Field, NamedMethodSignature } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary"
import { BuilderClass, methodsGroupOverloads, CUSTOM_BUILDER_CLASSES, BuilderMethod, BuilderField } from "../BuilderClass";
import { collapseSameNamedMethods } from "./OverloadsPrinter";
import { TargetFile } from "./TargetFile";
import { PrinterContext } from "./PrinterContext";
import { SuperElement } from "../Materialized";
import { ImportFeature, ImportsCollector } from "../ImportsCollector";
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";

interface BuilderClassFileVisitor {
    printFile(): void
    getTargetFile(): TargetFile
    getOutput(): string[]
}

class TSBuilderClass {
    constructor(
        public readonly name: string,
        public readonly generics: string[] | undefined,
        public readonly isInterface: boolean,
        public readonly superClass: SuperElement | undefined,
        public readonly fields: Field[],
        public readonly constructors: Method[],
        public readonly methods: Method[],
        public readonly importFeatures: ImportFeature[],
        public readonly needBeGenerated: boolean = true,
    ) { }
}

class TSBuilderClassFileVisitor implements BuilderClassFileVisitor {

    private readonly printer: LanguageWriter = createLanguageWriter(this.language)

    constructor(
        private readonly language: Language,
        private readonly builderClass: BuilderClass,
        private readonly dumpSerialized: boolean,
        private readonly peerLibrary: PeerLibrary | IdlPeerLibrary) { }

    private printBuilderClass(builderClass: TSBuilderClass) {
        const writer = this.printer
        const clazz = processTSBuilderClass(builderClass)

        const imports = new ImportsCollector()
        clazz.importFeatures.map(it => imports.addFeature(it.feature, it.module))
        if (clazz.superClass)
            imports.addFeature(clazz.superClass.name, "./" + renameClassToBuilderClass(clazz.superClass.name, writer.language, false))
        const currentModule = removeExt(renameClassToBuilderClass(clazz.name, this.peerLibrary.language))
        imports.print(this.printer, currentModule)

        const superType = clazz.superClass?.getSyperType()

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, field.type.nullable)
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.name, ctor.signature, writer => {
                        if (superType) {
                            writer.writeSuperCall([])
                        }
                        /*
                        const typeFiledName = syntheticName("type")
                        writer.writeStatement(writer.makeAssign(`this.${typeFiledName}`, undefined, writer.makeString(`"${clazz.name}"`), false))
                        ctor.signature.args
                            .forEach((it, i) => {
                                const argName = ctor.signature.argName(i)
                                const fieldName = syntheticName(argName)
                                writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                            })
                        */
                    })
                })

            clazz.methods
                .filter(method => method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(staticMethod => {
                    writer.writeMethodImplementation(staticMethod, writer => {
                        const sig = staticMethod.signature
                        const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
                        const obj = sig.returnType.name
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
        this.printBuilderClass(toTSBuilderClass(this.builderClass))
    }

    getTargetFile(): TargetFile {
        return new TargetFile(renameClassToBuilderClass(this.builderClass.name, this.language))
    }

    getOutput(): string[] {
        return this.printer.getOutput()
    }
}

class JavaBuilderClassFileVisitor implements BuilderClassFileVisitor {

    private readonly printer: LanguageWriter = createLanguageWriter(this.printerContext.language)

    constructor(
        private readonly library: IdlPeerLibrary | PeerLibrary,
        private readonly printerContext: PrinterContext,
        private readonly builderClass: BuilderClass,
        private readonly dumpSerialized: boolean,
    ) { }

    private synthesizeFieldTS(method: BuilderMethod): BuilderField {
        const fieldType = this.printerContext.synthesizedTypes!.getTargetType(method.declarationTargets[0], true)
        return new BuilderField(
            new Field(syntheticName(method.method.name), fieldType),
            method.declarationTargets[0])
    }

    private convertBuilderMethodTS(method: BuilderMethod, returnType: Type, newMethodName?: string): BuilderMethod {
        const oldSignature = method.method.signature as NamedMethodSignature
        const types = method.declarationTargets.map(it => this.printerContext.synthesizedTypes!.getTargetType(it, true))
        const signature = new NamedMethodSignature(returnType, types, oldSignature.argsNames, oldSignature.defaults);
        return new BuilderMethod(
            new Method(
                newMethodName ?? method.method.name,
                signature,
                method.method.modifiers,
                method.method.generics,
            ),
            method.declarationTargets
        )
    }

    private processBuilderClassTS(clazz: BuilderClass): BuilderClass {
        const syntheticFields = clazz.methods
            .filter(it => !it.method.modifiers?.includes(MethodModifier.STATIC))
            .map(it => this.synthesizeFieldTS(it))
        const fields = [...clazz.fields, ...syntheticFields]

        const returnType = new Type(clazz.name)
        const constructors = clazz.constructors.map(it => this.convertBuilderMethodTS(it, returnType, clazz.name))
        const methods = clazz.methods.map(it => this.convertBuilderMethodTS(it, returnType))
    
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

    private printPackage(): void {
        this.printer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    private printBuilderClassTS(clazz: BuilderClass) {
        const writer = this.printer
        clazz = this.processBuilderClassTS(clazz)

        this.printPackage()

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.field.name, field.field.type, field.field.modifiers, field.field.type.nullable)
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.method.name, ctor.method.signature, writer => {})
                })

            clazz.methods
                .filter(method => method.method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(staticMethod => {
                    writer.writeMethodImplementation(staticMethod.method, writer => {
                        const sig = staticMethod.method.signature
                        const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
                        writer.writeStatement(writer.makeReturn(writer.makeString(`new ${clazz.name}(${args})`)))
                    })
                })

            clazz.methods
                .filter(method => !method.method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(method => {
                    writer.writeMethodImplementation(method.method, writer => {
                        const argName = method.method.signature.argName(0)
                        const fieldName = syntheticName(method.method.name)
                        writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                        writer.writeStatement(writer.makeReturn(writer.makeString("this")))
                    })
                })
        })
    }

    private synthesizeField(method: BuilderMethod): BuilderField {
        return new BuilderField(
            new Field(syntheticName(method.method.name), method.method.signature.args[0]),
            method.declarationTargets[0])
    }

    private convertBuilderMethod(method: BuilderMethod, returnType: Type, newMethodName?: string): BuilderMethod {
        const oldSignature = method.method.signature as NamedMethodSignature
        const signature = new NamedMethodSignature(returnType, oldSignature.args, oldSignature.argsNames, oldSignature.defaults);
        return new BuilderMethod(
            new Method(
                newMethodName ?? method.method.name,
                signature,
                method.method.modifiers,
                method.method.generics,
            ),
            method.declarationTargets
        )
    }
    
    private processBuilderClass(clazz: BuilderClass): BuilderClass {
        const syntheticFields = clazz.methods
            .filter(it => !it.method.modifiers?.includes(MethodModifier.STATIC))
            .map(it => this.synthesizeField(it))
        const fields = [...clazz.fields, ...syntheticFields]

        const returnType = new Type(clazz.name)
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
                writer.writeFieldDeclaration(field.field.name, field.field.type, field.field.modifiers, field.field.type.nullable)
            })

            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.method.name, ctor.method.signature, writer => {})
                })

            clazz.methods
                .filter(method => method.method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(staticMethod => {
                    writer.writeMethodImplementation(staticMethod.method, writer => {
                        const sig = staticMethod.method.signature
                        const args = sig.args.map((_, i) => sig.argName(i)).join(", ")
                        writer.writeStatement(writer.makeReturn(writer.makeString(`new ${clazz.name}(${args})`)))
                    })
                })

            clazz.methods
                .filter(method => !method.method.modifiers?.includes(MethodModifier.STATIC))
                .forEach(method => {
                    writer.writeMethodImplementation(method.method, writer => {
                        const argName = method.method.signature.argName(0)
                        const fieldName = syntheticName(method.method.name)
                        writer.writeStatement(writer.makeAssign(`this.${fieldName}`, undefined, writer.makeString(`${argName}`), false))
                        writer.writeStatement(writer.makeReturn(writer.makeString("this")))
                    })
                })
        })
    }

    printFile(): void {
        if (this.library instanceof PeerLibrary) {
            this.printBuilderClassTS(this.builderClass)
            return
        }
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
        private readonly library: PeerLibrary | IdlPeerLibrary,
        private printerContext: PrinterContext, 
        private readonly dumpSerialized: boolean,
    ) { }

    printBuilderClasses(): void {
        const builderClasses = [...CUSTOM_BUILDER_CLASSES, ...this.library.buildersToGenerate.values()]
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

export function printBuilderClasses(peerLibrary: PeerLibrary | IdlPeerLibrary, printerContext: PrinterContext, dumpSerialized: boolean): Map<TargetFile, string> {
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
    return new Field(syntheticName(method.name), new Type(type.name, true))
}

function collapse(methods: Method[]): Method[] {
    const groups = methodsGroupOverloads(methods)
    return groups.map(it => it.length == 1 ? it[0] : collapseSameNamedMethods(it))
}

function toTSBuilderClass(clazz: BuilderClass): TSBuilderClass {
    return new TSBuilderClass(
        clazz.name,
        clazz.generics,
        clazz.isInterface,
        clazz.superClass,
        clazz.fields.map(it => it.field),
        clazz.constructors.map(it => it.method),
        clazz.methods.map(it => it.method),
        clazz.importFeatures,
        clazz.needBeGenerated,
    )
}

function processTSBuilderClass(clazz: TSBuilderClass): TSBuilderClass {
    const methods = collapse(clazz.methods)
    let constructors = collapse(clazz.constructors)

    if (!constructors || constructors.length == 0) {
        // make a constructor from a static method parameters
        const staticMethods = methods.
            filter(method => method.modifiers?.includes(MethodModifier.STATIC))

        if (staticMethods.length > 0) {
            const staticSig = staticMethods[0].signature
            const args = staticSig.args
            const ctorSig = new NamedMethodSignature(Type.Void, args, args.map((it, i) => staticSig.argName(i)))
            constructors = [new Method("constructor", ctorSig)]
        }
    }

    // generate synthetic properties for the constructor parameters
    // const ctorSig = constructors[0].signature
    // const ctorFields = ctorSig.args
    //     .map((type, i) => new Field(syntheticName(ctorSig.argName(i)), type))

    const syntheticFields = methods
        .filter(it => !it.modifiers?.includes(MethodModifier.STATIC))
        .map(it => toSyntheticField(it))

    const typeField = new Field(syntheticName("type"), new Type("string"))
    // TBD: Add type field and constructor fields for serialization
    const fields = [...clazz.fields, ...syntheticFields]
    //const fields = [typeField, ...clazz.fields, ...ctorFields, ...syntheticFields]

    return new TSBuilderClass(
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
