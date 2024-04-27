import * as path from "path"
import { IndentedPrinter } from "../IndentedPrinter"
import { indentedBy, renameDtsToPeer, throwException } from "../util"
import { ImportsCollector } from "./ImportsCollector"
import { determineParentRole, InheritanceRole, isCommonMethod, isHeir, isRoot, isStandalone } from "./inheritance"
import { PeerFile } from "./PeerFile"
import { PeerMethod } from "./PeerMethod"
import { Printers } from "./Printers"

export class PeerClass {
    constructor(
        public readonly file: PeerFile,
        public readonly componentName: string,
        public readonly originalFilename: string,
        public readonly printers: Printers,
    ) { }

    methods: PeerMethod[] = []
    get callableMethod(): PeerMethod | undefined {
        return this.methods.find(method => method.isCallSignature)
    }

    originalClassName: string | undefined = undefined
    originalParentName: string | undefined = undefined
    originalParentFilename: string | undefined = undefined
    parentComponentName: string | undefined = undefined

    get koalaComponentName(): string {
        return this.koalaComponentByComponent(this.componentName)
    }

    private koalaComponentByComponent(name: string): string {
        return "Ark" + name
    }

    get peerParentName(): string {
        const parentRole = determineParentRole(this.originalClassName!, this.parentComponentName)
        if ([InheritanceRole.Finalizable, InheritanceRole.PeerNode].includes(parentRole)) {
            return InheritanceRole[parentRole]
        }
        const parent = this.parentComponentName ?? throwException(`Expected component to have parent`)
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

    get attributesParentName(): string | undefined {
        if (!isHeir(this.originalClassName!)) return undefined
        return this.componentToAttribute(this.parentComponentName!)
    }

    attributeInterfaceHeader() {
        const parent = this.attributesParentName
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
            printer.print(`constructor(type?: ArkUINodeType, component?: ArkCommon, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(BigInt(42)) // for now`)
            printer.popIndent()
            printer.print(`}`)
            return
        }
        if (parentRole === InheritanceRole.PeerNode) {
            printer.print(`constructor(type: ArkUINodeType, component?: ArkCommon, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(type, flags)`)
            printer.print(`component?.setPeer(this.peer)`)
            printer.popIndent()
            printer.print(`}`)
            return
        }

        if (parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
            printer.print(`constructor(type: ArkUINodeType, component?: ArkCommon, flags: int32 = 0) {`)
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
    }

    collectPeerImports(imports: ImportsCollector) {
        if (!this.originalParentFilename) return
        const parentBasename = renameDtsToPeer(path.basename(this.originalParentFilename))
        imports.addFeatureByBasename(this.peerParentName, parentBasename)
        if (this.attributesParentName)
            imports.addFeatureByBasename(this.attributesParentName, parentBasename)
    }

    collectComponentImports(imports: ImportsCollector) {
        imports.addFeature(`${this.koalaComponentName}Attribute`, "@koalaui/arkui-common")
        imports.addFeature("NodeAttach", "@koalaui/runtime")
        const structPostfix = (this.callableMethod?.mappedParamsTypes?.length ?? 0) + 1
        imports.addFeature(`ArkCommonStruct${structPostfix}`, "./ArkStructCommon")
        imports.addFeatureByBasename(`${this.koalaComponentName}Peer`, renameDtsToPeer(path.basename(this.originalFilename)))
        imports.addFeature("ArkUINodeType", "@koalaui/arkoala")
    }

    printComponent() {
        const printer = this.printers.TSComponent
        const method = this.callableMethod
        const componentClassName = `${this.koalaComponentName}Component`
        const componentFunctionName = this.koalaComponentName
        const peerClassName = `${this.koalaComponentName}Peer`
        const attributeClassName = `${this.koalaComponentName}Attribute`
        const parentStructClass = {
            name: `ArkCommonStruct${(method?.mappedParamsTypes?.length ?? 0) + 1}`,
            typesLines: [
                `${componentClassName},`,
                `/** @memo */`,
                `() => void${method?.mappedParamsTypes?.length ? "," : ""}`,
                (method?.mappedParamsTypes ?? []).join(", ")
            ]
        }
        printer.print(`
export class ${componentClassName} extends ${parentStructClass.name}<
${parentStructClass.typesLines.map(it => indentedBy(it, 1)).join("\n")}
> implements ${attributeClassName} {

  protected peer?: ${peerClassName}
`)
        printer.pushIndent()
        for (const method of this.methods)
            method.printComponentMethod(printer)
        printer.popIndent()

        printer.print(`
  /** @memo */
  _build(
    /** @memo */
    style?: (attributes: ${componentClassName}) => void,
    /** @memo */
    content?: () => void,
    ${method?.mappedParams ?? ""}
  ) {
    NodeAttach(() => new ${peerClassName}(ArkUINodeType.${this.componentName}, this), () => {
      style?.(this)
      ${method ? `this.${method?.methodName}(${method?.mappedParamValues})` : ""}
      content?.()
      this.applyAttributesFinish()
    })
  }
}`)

        printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style?: (attributes: ${componentClassName}) => void,
  /** @memo */
  content?: () => void,
  ${method?.mappedParams ?? ""}
) {
  ${componentClassName}._instantiate<
${parentStructClass.typesLines.map(it => indentedBy(it, 2)).join("\n")}
  >(
    style,
    () => new ${componentClassName}(),
    content,
    ${method?.mappedParamValues ?? ""}
  )
}
`)
    }

    printProlog() {
        this.printers.TSPeer.print(this.peerClassHeader())
        this.printers.TSPeer.pushIndent()
        this.printers.api.print(this.apiModifierHeader())
        this.printers.api.pushIndent()
        this.printNodeModifier()
    }

    printEpilog() {
        this.printers.TSPeer.popIndent()
        this.printers.TSPeer.print(`}`)
        if (this.methods.length == 0) {
            this.printers.api.print("int dummy;")
        }
        this.printers.api.popIndent()
        this.printers.api.print(`} ArkUI${this.componentName}Modifier;\n`)
        this.printers.apiList.popIndent()
    }

    printMethods() {
        this.generateConstructor(this.printers.TSPeer)
        this.methods.forEach(it => it.processPeerMethod())
        this.generateApplyMethod(this.printers.TSPeer)
    }

    print() {
        this.printProlog()
        this.printMethods()
        this.printEpilog()
        this.printComponent()
    }
}