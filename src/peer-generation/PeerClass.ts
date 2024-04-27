import * as path from "path"
import { IndentedPrinter } from "../IndentedPrinter"
import { indentedBy, renameDtsToPeer, throwException } from "../util"
import { ImportsCollector } from "./ImportsCollector"
import { determineInheritanceRole, determineParentRole, InheritanceRole, isCommonMethod, isHeir, isRoot, isStandalone } from "./inheritance"
import { PeerFile } from "./PeerFile"
import { PeerMethod } from "./PeerMethod"
import { Printers } from "./Printers"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import { DeclarationTable } from "./DeclarationTable"

export class PeerClass {
    constructor(
        public readonly file: PeerFile,
        public readonly componentName: string,
        public readonly originalFilename: string,
        public readonly declarationTable: DeclarationTable
    ) { }

    methods: PeerMethod[] = []
    get callableMethod(): PeerMethod | undefined {
        return this.methods.find(method => method.isCallSignature)
    }

    originalClassName: string | undefined = undefined
    originalInterfaceName: string | undefined = undefined
    originalParentName: string | undefined = undefined
    originalParentFilename: string | undefined = undefined
    parentComponentName: string | undefined = undefined
    attributesFields: string[] = []
    attributesTypes: string[] = []

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

    private peerClassHeader() {
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

    private get attributesParentName(): string | undefined {
        if (!isHeir(this.originalClassName!)) return undefined
        return this.componentToAttribute(this.parentComponentName!)
    }

    private attributeInterfaceHeader() {
        const parent = this.attributesParentName
        const extendsClause =
            parent
                ? ` extends ${parent} `
                : ""
        return `export interface ${this.componentToAttribute(this.componentName)} ${extendsClause} {`
    }
    private apiModifierHeader() {
        return `typedef struct ArkUI${this.componentName}Modifier {`
    }

    private generateConstructor(printer: IndentedPrinter): void {
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

    collectPeerImports(imports: ImportsCollector) {
        if (!this.originalParentFilename) return
        const parentBasename = renameDtsToPeer(path.basename(this.originalParentFilename))
        imports.addFeatureByBasename(this.peerParentName, parentBasename)
        if (this.attributesParentName)
            imports.addFeatureByBasename(this.attributesParentName, parentBasename)
    }

    collectComponentImports(imports: ImportsCollector) {
        if (!this.canGenerateComponent()) return
        imports.addFeature("NodeAttach", "@koalaui/runtime")
        const structPostfix = (this.callableMethod?.mappedParamsTypes?.length ?? 0) + 1
        imports.addFeature(`ArkCommonStruct${structPostfix}`, "./ArkStructCommon")
        imports.addFeatureByBasename(`${this.koalaComponentName}Peer`, renameDtsToPeer(path.basename(this.originalFilename)))
        imports.addFeature("ArkUINodeType", "./ArkUINodeType")
    }

    printComponent(printer: IndentedPrinter) {
        if (!this.canGenerateComponent()) return
        const method = this.callableMethod
        const componentClassName = `${this.koalaComponentName}Component`
        const componentFunctionName = this.koalaComponentName
        const peerClassName = `${this.koalaComponentName}Peer`
        const attributeClassName = `${this.componentName}Attribute`
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
    style: ((attributes: ${componentClassName}) => void) | undefined,
    /** @memo */
    content_: (() => void) | undefined,
    ${method?.mappedParams ?? ""} 
  ) {
    NodeAttach(() => new ${peerClassName}(ArkUINodeType.${this.componentName}, this), () => {
      style?.(this)
      ${method ? `this.${method?.methodName}(${method?.mappedParamValues})` : ""}
      content_?.()
      this.applyAttributesFinish()
    })
  }
}`)

        printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style: ((attributes: ${componentClassName}) => void) | undefined,
  /** @memo */
  content_: (() => void) | undefined,
  ${method?.mappedParams ?? ""}
) {
  ${componentClassName}._instantiate<
${parentStructClass.typesLines.map(it => indentedBy(it, 2)).join("\n")}
  >(
    style,
    () => new ${componentClassName}(),
    content_,
    ${method?.mappedParamValues ?? ""}
  )
}
`)
    }

    private printPeerAttributes(printer: IndentedPrinter) {
        for (const attributeType of this.attributesTypes)
            printer.print(attributeType)

        printer.print(this.attributeInterfaceHeader())
        if (this.attributesFields.length === 0) {
            printer.print('}')
            return
        }
        printer.pushIndent()
        for (const field of this.attributesFields)
            printer.print(field)
        printer.popIndent()
        printer.print('}')
    }

    printPeer(printer: IndentedPrinter) {
        printer.print(this.peerClassHeader())
        printer.pushIndent()
        this.generateConstructor(printer)
        for (const method of this.methods)
            method.printPeerMethod(printer)
        this.generateApplyMethod(printer)
        printer.popIndent()
        printer.print(`}`)
        this.printPeerAttributes(printer)
    }

    private printGlobalProlog(printers: Printers) {
        printers.api.print(this.apiModifierHeader())
        printers.api.pushIndent()
        printers.apiList.pushIndent()
        printers.apiList.print(`const ArkUI${this.componentName}Modifier* (*get${this.componentName}Modifier)();`)
    }

    private printGlobalEpilog(printers: Printers) {
        if (this.methods.length == 0) {
            printers.api.print("int dummy;")
        }
        printers.api.popIndent()
        printers.api.print(`} ArkUI${this.componentName}Modifier;\n`)
        printers.apiList.popIndent()
    }

    private printGlobalNativeModule(printers: Printers) {
        printers.nodeTypes.print(this.componentName)
        this.methods.forEach(method => {
            const component = method.isCallSignature ? this.originalInterfaceName : this.originalClassName
            this.declarationTable.setCurrentContext(`${method.isCallSignature ? "" : method.methodName}()`)
            const basicParameters = method.argConvertors
                .map(it => {
                    if (it.useArray) {
                        const array = `${it.param}Serializer`
                        return `${it.param}Array: Uint8Array, ${array}Length: int32`
                    } else {
                        return `${it.param}: ${it.interopType(true)}`
                    }
                })
            let maybeReceiver = method.hasReceiver ? [`ptr: KPointer`] : []
            const parameters = maybeReceiver
                .concat(basicParameters)
                .join(", ")

            const implDecl = `_${component}_${method.methodName}(${parameters}): void`

            printers.nativeModule.print(implDecl)
            printers.nativeModuleEmpty.print(`${implDecl} { console.log("${method.methodName}") }`)
            this.declarationTable.setCurrentContext(undefined)
        })
    }

    private canGenerateComponent(): boolean {
        return !PeerGeneratorConfig.skipComponentGeneration.includes(this.originalClassName!)
            && determineInheritanceRole(this.originalClassName!) == InheritanceRole.Heir
    }

    printGlobal(printers: Printers) {
        this.printGlobalProlog(printers)
        this.methods.forEach(it => it.printGlobal(printers))
        this.printGlobalEpilog(printers)
        this.printGlobalNativeModule(printers)
    }
}