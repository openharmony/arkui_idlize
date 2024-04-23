import { IndentedPrinter } from "../IndentedPrinter"
import { capitalize, dropSuffix, isDefined } from "../util"
import { ArgConvertor, RetConvertor } from "./Convertors"
import { PeerClass } from "./PeerClass"
import { Printers } from "./Printers"

export class PeerMethod {
    public readonly fullMethodName
    private printers: Printers
    constructor(
        public clazz: PeerClass,
        public originalParentName: string,
        public methodName: string,
        public argConvertors: ArgConvertor[],
        public retConvertor: RetConvertor,
        public hasReceiver: boolean,
        public isCallSignature: boolean,
        public mappedParams: string | undefined,
        public mappedParamValues: string | undefined,
        private dumpSerialized: boolean
    ) {
        this.fullMethodName = isCallSignature ? methodName : this.peerMethodName()
        this.printers = clazz.printers
    }

    peerMethodName() {
        const name = this.methodName
        if (name.startsWith("set") ||
            name.startsWith("get") ||
            name.startsWith("_set")
        ) return name
        return `set${capitalize(name)}`
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

    printComponentMethodBody(printer: IndentedPrinter) {
        printer.print(`if (this.checkPriority("${this.methodName}")) {`)
        printer.pushIndent()
        printer.print(`this.peer?.${this.methodName}Attribute(${this.mappedParamValues}`)
        printer.popIndent()
        printer.print(`}`)
    }

    processPeerMethod() {
        const methodName = this.methodName
        const retConvertor = this.retConvertor
        const argConvertors = this.argConvertors
        const fullMethodName = this.fullMethodName

        const apiParameters = this.generateAPIParameters(argConvertors).join(", ")
        const implName = `${capitalize(this.originalParentName)}_${capitalize(fullMethodName)}Impl`
        const retType = this.maybeCRetType(retConvertor) ?? "void"

        this.printers.api.print(`${retType} (*${fullMethodName})(${apiParameters});`)
        this.printers.modifiers.print(`${implName},`)
        this.printImplFunction(retType, implName, apiParameters, true) // dummy
        this.printImplFunction(retType, implName, apiParameters, false) // real

        this.printers.TS.print(`${methodName}Attribute(${this.mappedParams}) {`)
        let cName = `${this.originalParentName}_${methodName}`
        this.printers.C.print(`${retConvertor.nativeType()} impl_${cName}(${this.generateCParameters(argConvertors).join(", ")}) {`)
        this.printers.C.pushIndent()
        // This is to generate TS component, not TS peer.
        let isComponent = false
        if (isComponent) {
            this.printComponentMethodBody(this.printers.TS)
        } else {
            let isStub = false
            if (isStub) {
                this.printers.TS.print(`throw new Error("${methodName}Attribute() is not implemented")`)
            } else {
                this.generateNativeBody(this)
            }
        }
        this.printers.C.popIndent()
        this.printers.C.print(`}`)
        let macroArgs = [cName, this.maybeCRetType(retConvertor)].concat(this.generateCParameterTypes(argConvertors, this.hasReceiver))
            .filter(isDefined)
            .join(", ")
        const suffix = this.generateCMacroSuffix()
        this.printers.C.print(`KOALA_INTEROP_${suffix}(${macroArgs})`)
        this.printers.C.print(` `)

        this.printers.TS.print(`}`)
    }


    printDummyImplFunctionBody(retType: string, implName: string, apiParameters: string, printer: IndentedPrinter) {
        printer.print(`string out("${this.methodName}(");`)
        this.argConvertors.forEach((argConvertor, index) => {
            if (index > 0) this.printers.dummyImpl.print(`out.append(", ");`)
            printer.print(`WriteToString(&out, ${argConvertor.param});`)
        })
        printer.print(`out.append(")");`)
        printer.print(`appendGroupedLog(1, out);`)
        if (retType != "void") printer.print(`return 0;`)
    }

    printModifierImplFunctionBody(retType: string, implName: string, apiParameters: string, printer: IndentedPrinter) {
        printer.print(`// ${implName} `)
        if (retType != "void") printer.print(`return 0;`)
    }

    printImplFunction(retType: string, implName: string, apiParameters: string, dummy: boolean) {
        const printer = dummy ? this.printers.dummyImpl : this.printers.modifierImpl

        printer.print(`${retType} ${implName}(${apiParameters}) {`)
        printer.pushIndent()
        if (dummy) {
            this.printDummyImplFunctionBody(retType, implName, apiParameters, printer)
        } else {
            this.printModifierImplFunctionBody(retType, implName, apiParameters, printer)
        }
        printer.popIndent()
        printer.print(`}`)
    }

    generateCParameters(argConvertors: ArgConvertor[]): string[] {
        return (["KNativePointer nodePtr"].concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t* ${it.param}Array, int32_t ${it.param}Length`
            } else {
                let type = it.interopType(false)
                return `${type == "KStringPtr" ? "const KStringPtr&" : type} ${it.param}`
            }
        })))
    }

    generateCParameterTypes(argConvertors: ArgConvertor[], hasReceiver: boolean): string[] {
        const receiver = hasReceiver ? ['KNativePointer'] : []
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
        return (["ArkUINodeHandle node"].concat(argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
        })))
    }

    // TODO: may be this is another method of ArgConvertor?
    apiArgument(argConvertor: ArgConvertor): string {
        const prefix = argConvertor.isPointerType() ? "&": "    "
        if (argConvertor.useArray) return `${prefix}${argConvertor.param}Value`
        return `${argConvertor.convertorCArg(argConvertor.param)}`
    }

    generateAPICall(peerMethod: PeerMethod) {
        const clazzName = peerMethod.originalParentName
        const hasReceiver = peerMethod.hasReceiver
        const argConvertors = peerMethod.argConvertors
        const isVoid = peerMethod.retConvertor.isVoid
        const api = "GetNodeModifiers()"
        const modifier = this.modifierSection(clazzName)
        const method = peerMethod.peerMethodName()
        const receiver = hasReceiver ? ['node'] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.apiArgument(it))).join(", ")
        this.printers.C.print(`${isVoid ? "" : "return "}${api}->${modifier}->${method}(${args});`)
    }

    generateNativeBody(peerMethod: PeerMethod) {
        this.printers.C.pushIndent()
        this.printers.TS.pushIndent()
        if (peerMethod.hasReceiver) {
            this.printers.C.print("ArkUINodeHandle node = reinterpret_cast<ArkUINodeHandle>(nodePtr);")
        }
        let scopes = peerMethod.argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            this.printers.TS.pushIndent()
            this.printers.TS.print(it.scopeStart?.(it.param))
        })
        peerMethod.argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                this.printers.TS.print(`const ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToTSSerial(it.param, it.param, this.printers.TS)
                this.printers.C.print(`Deserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                this.printers.C.print(`${it.nativeType(false)} ${it.param}Value;`)
                it.convertorToCDeserial(it.param, `${it.param}Value`, this.printers.C)
            }
        })
        // Enable to see serialized data.
        if (this.dumpSerialized) {
            peerMethod.argConvertors.forEach((it, index) => {
                if (it.useArray) {
                    this.printers.TS.print(`console.log("${it.param}:", ${it.param}Serializer.asArray(), ${it.param}Serializer.length())`)
                }
            })
        }
        this.printers.TS.print(`nativeModule()._${peerMethod.originalParentName}_${peerMethod.methodName}(this.ptr${peerMethod.argConvertors.length > 0 ? ", " : ""}`)
        this.printers.TS.pushIndent()
        peerMethod.argConvertors.forEach((it, index) => {
            let maybeComma = index == peerMethod.argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.printers.TS.print(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
                this.printers.TS.print(it.convertorTSArg(it.param))
            this.printers.TS.print(maybeComma)
        })
        this.printers.TS.popIndent()
        this.printers.TS.print(`)`)
        scopes.reverse().forEach(it => {
            this.printers.TS.popIndent()
            this.printers.TS.print(it.scopeEnd!(it.param))
        })
        this.generateAPICall(peerMethod)
        this.printers.C.popIndent()
        this.printers.TS.popIndent()
    }

}
