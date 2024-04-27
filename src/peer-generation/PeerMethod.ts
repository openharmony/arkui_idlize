import { IndentedPrinter } from "../IndentedPrinter"
import { capitalize, dropSuffix, isDefined } from "../util"
import { ArgConvertor, RetConvertor } from "./Convertors"
import { DeclarationTarget, PrimitiveType } from "./DeclarationTable"
import { PeerClass } from "./PeerClass"
import { Printers } from "./Printers"

export class PeerMethod {
    public readonly fullMethodName
    constructor(
        public originalParentName: string,
        public methodName: string,
        public declarationTargets: DeclarationTarget[],
        public argConvertors: ArgConvertor[],
        public retConvertor: RetConvertor,
        public hasReceiver: boolean,
        public isCallSignature: boolean,
        public mappedParams: string | undefined,
        public mappedParamValues: string | undefined,
        public mappedParamsTypes: string[] | undefined,
        private dumpSerialized: boolean
    ) {
        this.fullMethodName = isCallSignature ? methodName : this.peerMethodName()
    }

    peerMethodName() {
        const name = this.methodName
        if (!this.hasReceiver) return name
        if (name.startsWith("set") ||
            name.startsWith("get") ||
            name.startsWith("_set")
        ) return name
        return `set${capitalize(name)}`
    }

    get implName(): string {
        return `${capitalize(this.originalParentName)}_${capitalize(this.fullMethodName)}Impl`
    }

    get retType(): string {
        return this.maybeCRetType(this.retConvertor) ?? "void"
    }

    generateCMacroSuffix(): string {
        let counter = this.hasReceiver ? 1 : 0
        this.argConvertors.forEach(it => {
            if (it.useArray) {
                counter += 2
            } else {
                counter += 1
            }
        })
        return `${this.retConvertor.macroSuffixPart()}${counter}`
    }

    printComponentMethod(printer: IndentedPrinter) {
        printer.print(`/** @memo */`)
        printer.print(`${this.methodName}(${this.mappedParams}): this {`)
        printer.pushIndent()
        printer.print(`if (this.checkPriority("${this.methodName}")) {`)
        printer.pushIndent()
        printer.print(`this.peer?.${this.methodName}Attribute(${this.mappedParamValues})`)
        printer.popIndent()
        printer.print(`}`)
        printer.print("return this")
        printer.popIndent()
        printer.print(`}\n`)
    }

    printPeerMethod(printer: IndentedPrinter) {
        let maybeStatic = this.hasReceiver ? "" : `static `
        let genMethodName = this.hasReceiver ? `${this.methodName}Attribute` : this.methodName
        printer.print(`${maybeStatic}${genMethodName}(${this.mappedParams}) {`)

        printer.pushIndent()
        let scopes = this.argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            printer.pushIndent()
            printer.print(it.scopeStart?.(it.param))
        })
        this.argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                printer.print(`const ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToTSSerial(it.param, it.param, printer)
            }
        })
        // Enable to see serialized data.
        if (this.dumpSerialized) {
            this.argConvertors.forEach((it, index) => {
                if (it.useArray) {
                    printer.print(`console.log("${it.param}:", ${it.param}Serializer.asArray(), ${it.param}Serializer.length())`)
                }
            })
        }
        let maybeThis = this.hasReceiver ? `this.peer.ptr${this.argConvertors.length > 0 ? ", " : ""}` : ``
        printer.print(`nativeModule()._${this.originalParentName}_${this.methodName}(${maybeThis}`)
        printer.pushIndent()
        this.argConvertors.forEach((it, index) => {
            let maybeComma = index == this.argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                printer.print(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
            printer.print(it.convertorTSArg(it.param))
            printer.print(maybeComma)
        })
        printer.popIndent()
        printer.print(`)`)
        scopes.reverse().forEach(it => {
            printer.popIndent()
            printer.print(it.scopeEnd!(it.param))
        })
        printer.popIndent()

        printer.print(`}`)
    }

    printGlobal(printers: Printers) {
        const retConvertor = this.retConvertor
        const argConvertors = this.argConvertors
        const apiParameters = this.generateAPIParameters(argConvertors).join(", ")

        printers.api.print(`${this.retType} (*${this.fullMethodName})(${apiParameters});`)

        let cName = `${this.originalParentName}_${this.methodName}`
        printers.C.print(`${retConvertor.nativeType()} impl_${cName}(${this.generateCParameters(argConvertors).join(", ")}) {`)
        printers.C.pushIndent()
        this.generateNativeBody(printers.C)
        printers.C.popIndent()
        printers.C.print(`}`)
        let macroArgs = [cName, this.maybeCRetType(retConvertor)].concat(this.generateCParameterTypes(argConvertors, this.hasReceiver))
            .filter(isDefined)
            .join(", ")
        const suffix = this.generateCMacroSuffix()
        printers.C.print(`KOALA_INTEROP_${suffix}(${macroArgs})`)
        printers.C.print(` `)
    }

    generateCParameters(argConvertors: ArgConvertor[]): string[] {
        let maybeReceiver = this.hasReceiver ? [`${PrimitiveType.NativePointer.getText()} nodePtr`] : []
        return (maybeReceiver.concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t* ${it.param}Array, int32_t ${it.param}Length`
            } else {
                let type = it.interopType(false)
                return `${type == "KStringPtr" ? "const KStringPtr&" : type} ${it.param}`
            }
        })))
    }

    generateCParameterTypes(argConvertors: ArgConvertor[], hasReceiver: boolean): string[] {
        const receiver = hasReceiver ? [PrimitiveType.NativePointer.getText()] : []
        return receiver.concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t*, int32_t`
            } else {
                return it.interopType(false)
            }
        }))
    }

    maybeCRetType(retConvertor: RetConvertor): string | undefined {
        if (retConvertor.isVoid) return undefined
        return retConvertor.nativeType()
    }

    modifierSection(clazzName: string) {
        // TODO: may be need some translation tables?
        let clazz = dropSuffix(dropSuffix(dropSuffix(clazzName, "Method"), "Attribute"), "Interface")
        return `get${capitalize(clazz)}Modifier()`
    }

    generateAPIParameters(argConvertors: ArgConvertor[]): string[] {
        let maybeReceiver = this.hasReceiver ? [`${PrimitiveType.NativePointer.getText()} node`] : []
        return (maybeReceiver.concat(argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
        })))
    }

    // TODO: may be this is another method of ArgConvertor?
    private apiArgument(argConvertor: ArgConvertor): string {
        const prefix = argConvertor.isPointerType() ? "&": "    "
        if (argConvertor.useArray) return `${prefix}${argConvertor.param}_value`
        return `${argConvertor.convertorCArg(argConvertor.param)}`
    }

    private generateAPICall(printer: IndentedPrinter) {
        const clazzName = this.originalParentName
        const hasReceiver = this.hasReceiver
        const argConvertors = this.argConvertors
        const isVoid = this.retConvertor.isVoid
        const api = "GetNodeModifiers()"
        const modifier = this.modifierSection(clazzName)
        const method = this.peerMethodName()
        const receiver = hasReceiver ? ['node'] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.apiArgument(it))).join(", ")
        printer.print(`${isVoid ? "" : "return "}${api}->${modifier}->${method}(${args});`)
    }

    private generateNativeBody(printer: IndentedPrinter) {
        printer.pushIndent()
        if (this.hasReceiver) {
            printer.print("ArkUINodeHandle node = reinterpret_cast<ArkUINodeHandle>(nodePtr);")
        }
        this.argConvertors.forEach(it => {
            if (it.useArray) {
                printer.print(`Deserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                let result = `${it.param}_value`
                printer.print(`${it.nativeType(false)} ${result};`)
                it.convertorToCDeserial(it.param, result, printer)
            }
        })
        this.generateAPICall(printer)
        printer.popIndent()
    }

}
