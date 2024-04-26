import { IndentedPrinter } from "../IndentedPrinter";
import { PrimitiveType } from "./DeclarationTable";
import { completeImplementations, dummyImplementations, modifierStructList, modifierStructs } from "./FileGenerators";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";

class ModifierVisitor {
    dummy = new IndentedPrinter()
    real = new IndentedPrinter()
    modifiers = new IndentedPrinter()
    modifierList = new IndentedPrinter()

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
                clazz.methods.forEach(method => {
                    this.printRealAndDummyModifier(method)
                })
                this.printClassEpilog(clazz)
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
        modifierStructList(visitor.modifierList.getOutput())

    const real =
        completeImplementations(visitor.real.getOutput()) +
        modifierStructs(visitor.modifiers.getOutput()) +
        modifierStructList(visitor.modifierList.getOutput())
    return {dummy, real}
}