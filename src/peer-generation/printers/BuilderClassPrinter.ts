import { Language, renameClassToBuilderClass } from "../../util"
import { LanguageWriter, MethodModifier, Method, Type, createLanguageWriter, Field, NamedMethodSignature } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary"
import { BuilderClass, methodsGroupOverloads, CUSTOM_BUILDER_CLASSES } from "../BuilderClass";
import { collapseSameNamedMethods } from "./OverloadsPrinter";
import { collectDtsImports } from "../DtsImportsGenerator";

class BuilderClassFileVisitor {

    readonly printer: LanguageWriter = createLanguageWriter(this.language)

    constructor(
        private readonly language: Language,
        private readonly library: PeerLibrary,
        private readonly builderClass: BuilderClass,
        private readonly dumpSerialized: boolean,
    ) { }

    private printBuilderClass(clazz: BuilderClass) {
        const writer = this.printer
        clazz = processBuilderClass(clazz)

        //TODO: in the future it is necessary to import elements from generated ets files
        if (writer.language == Language.ARKTS) {
            writer.print(collectDtsImports().trim())
            writer.print("import { SelectedMode, IndicatorStyle, BoardStyle } from '@arkoala/arkui/ArkTabContentInterfaces'")
            writer.print("import { Dimension, Length, LengthMetrics, Resource, ResourceColor, ResourceStr, LocalizedPadding } from '@arkoala/arkui/ArkUnitsInterfaces'")
            writer.print("import { SheetTitleOptions, Padding, ComponentContent } from '@arkoala/arkui/ArkCommonInterfaces'")
            writer.print("import { LabelStyle } from '@arkoala/arkui/ArkButtonInterfaces'")
            writer.print("import { NativeEmbedDataInfo } from '@arkoala/arkui/ArkWebInterfaces'")
        }

        writer.writeClass(clazz.name, writer => {

            clazz.fields.forEach(field => {
                writer.writeFieldDeclaration(field.name, field.type, field.modifiers, field.type.nullable)
            })


            clazz.constructors
                .forEach(ctor => {
                    writer.writeConstructorImplementation(ctor.name, ctor.signature, writer => {
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
        })
    }

    printFile(): void {
        this.printBuilderClass(this.builderClass)
    }
}

class BuilderClassVisitor {
    readonly builderClasses: Map<string, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) { }

    printBuilderClasses(): void {
        const builderClasses = [...CUSTOM_BUILDER_CLASSES, ...this.library.buildersToGenerate.values()]
        console.log(`Builder classes: ${builderClasses.length}`)
        for (const clazz of builderClasses) {
            const visitor = new BuilderClassFileVisitor(
                this.library.declarationTable.language, this.library, clazz, this.dumpSerialized)
            visitor.printFile()
            const fileName = renameClassToBuilderClass(clazz.name, this.library.declarationTable.language)
            this.builderClasses.set(fileName, visitor.printer.getOutput())
        }
    }
}

export function printBuilderClasses(peerLibrary: PeerLibrary, dumpSerialized: boolean): Map<string, string> {

    // TODO: support other output languages
    if (peerLibrary.declarationTable.language != Language.TS && peerLibrary.declarationTable.language != Language.ARKTS)
        return new Map()

    const visitor = new BuilderClassVisitor(peerLibrary, dumpSerialized)
    visitor.printBuilderClasses()
    const result = new Map<string, string>()
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

function processBuilderClass(clazz: BuilderClass): BuilderClass {

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

    return new BuilderClass(
        clazz.name,
        clazz.isInterface,
        clazz.superClass,
        fields,
        constructors,
        methods,
        clazz.importFeatures
    )
}
