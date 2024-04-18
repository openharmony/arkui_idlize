import { IndentedPrinter } from "../IndentedPrinter"
import { throwException } from "../util"
import { determineInheritanceRole, determineParentRole, InheritanceRole, isCommonMethod, isHeir, isRoot, isStandalone } from "./inheritance"
import { PeerMethod } from "./PeerMethod"
import { Printers } from "./Printers"

export class PeerClass {
    constructor(
        public componentName: string,
        public printers: Printers
    ) { }

    methods: PeerMethod[] = []

    originalClassName: string | undefined = undefined
    originalParentName: string | undefined = undefined
    parentComponentName: string | undefined = undefined

    get koalaComponentName(): string {
        return this.koalaComponentByComponent(this.componentName)
    }

    private koalaComponentByComponent(name: string): string {
        return "Ark" + name
    }

    get peerParentName(): string {
        const name = this.originalClassName
            ?? throwException(`By this time the class name should have been provided: ${this.componentName}`)

        if (isCommonMethod(name)) return "PeerNode"
        if (isStandalone(name)) return "PeerNode"
        if (isRoot(name)) return "Finalizable"

        const parent = this.parentComponentName
            ?? throwException(`Expected component to have parent: ${name}`)
        return `${this.koalaComponentByComponent(parent)}Peer`
    }

    peerClassHeader() {
        const peerParentName = this.peerParentName
        const extendsClause =
            peerParentName
                ? `extends ${peerParentName} `
                : ""
        return `export class ${this.koalaComponentName}Peer ${extendsClause} {`
    }

    private componentToAttribute(name: string): string {
        return "Ark" + name + "Attributes"
    }

    private parentAttributesName(): string | undefined {
        if (!isHeir(this.originalClassName!)) return undefined
        return this.componentToAttribute(this.parentComponentName!)
    }

    attributeInterfaceHeader() {
        const parent = this.parentAttributesName()
        const extendsClause =
            parent
                ? ` extends ${parent} `
                : ""
        return `export interface ${this.componentToAttribute(this.componentName)} ${extendsClause} {`
    }
    apiModifierHeader() {
        return `typedef struct ArkUI${this.componentName}Modifier {`
    }

    generateConstructor(printer: IndentedPrinter): void {
        const parentRole = determineParentRole(this.originalClassName!, this.originalParentName)

        if (parentRole === InheritanceRole.Finalizable) {
            printer.print(`constructor(type?: ArkUINodeType, component?: ArkComponent, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(BigInt(42)) // for now`)
            printer.popIndent()
            printer.print(`}`)
            return
        }
        if (parentRole === InheritanceRole.PeerNode) {
            printer.print(`constructor(type: ArkUINodeType, component?: ArkComponent, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(type, flags)`)
            printer.print(`component?.setPeer(this)`)
            printer.popIndent()
            printer.print(`}`)
            return
        }

        if (parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
            printer.print(`constructor(type: ArkUINodeType, component?: ArkComponent, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(type, component, flags)`)
            printer.popIndent()
            printer.print(`}`)
            return
        }

        throwException(`Unexpected parent inheritance role: ${parentRole}`)
    }

    private generateApplyMethod(printer: IndentedPrinter): void {
        const name = this.originalClassName!
        const typeParam = this.koalaComponentName + "Attributes"
        if (isRoot(name)) {
            printer.print(`applyAttributes(attributes: ${typeParam}): void {`)
            printer.pushIndent()
            printer.print(`super.constructor(42)`)
            printer.popIndent()
            printer.print(`}`)
            return
        }

        printer.print(`applyAttributes<T extends ${typeParam}>(attributes: T): void {`)
        printer.pushIndent()
        printer.print(`super.applyAttributes(attributes)`)
        printer.popIndent()
        printer.print(`}`)
    }

    printNodeModifier() {
        const component = this.componentName
        this.printers.apiList.pushIndent()
        this.printers.apiList.print(`const ArkUI${component}Modifier* (*get${component}Modifier)();`)

        const modifierStructImpl = `ArkUI${component}ModifierImpl`
        this.printers.dummyImplModifiers.print(`ArkUI${component}Modifier ${modifierStructImpl} {`)
        this.printers.dummyImplModifiers.pushIndent()

        this.printers.dummyImplModifierList.pushIndent()
        this.printers.dummyImplModifierList.print(`Get${component}Modifier,`)
        this.printers.dummyImplModifierList.popIndent()
    }

    printProlog() {
        this.printers.TS.print(this.peerClassHeader())
        this.printers.TS.pushIndent()
        this.printers.api.print(this.apiModifierHeader())
        this.printers.api.pushIndent()
        this.printNodeModifier()
    }

    printEpilog() {
        this.printers.TS.popIndent()
        this.printers.TS.print(`}`)
        this.printers.api.popIndent()
        this.printers.api.print(`} ArkUI${this.componentName}Modifier;\n`)
        this.printers.apiList.popIndent()
        this.printers.dummyImplModifiers.popIndent()
        this.printers.dummyImplModifiers.print(`};\n`)
        const name = this.componentName
        this.printers.dummyImplModifiers.print(`const ArkUI${name}Modifier* Get${name}Modifier() { return &ArkUI${name}ModifierImpl; }\n\n`)
    }

    printMethods() {
        this.generateConstructor(this.printers.TS)
        this.methods.forEach(it => it.processPeerMethod())
        this.generateApplyMethod(this.printers.TS)
    }

    print() {
        this.printProlog()
        this.printMethods()
        this.printEpilog()
    }
}