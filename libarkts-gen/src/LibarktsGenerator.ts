import * as path from "node:path"
import { BridgesPrinter } from "./BridgesPrinter"
import { IDLEntry, forceWriteFile } from "@idlize/core"
import { NativeModulePrinter } from "./NativeModulePrinter"
import * as fs from "fs"
import { IDLFile } from "./Es2PandaTransformer"

export class LibarktsConfig {
    static implPrefix = `impl_`
    static nativeModulePrefix = `_`
    static constructorPrefix = `Create`
    static typePrefix = `es2panda_`
    static nativeModuleName = "Es2pandaNativeModule"
    static constructorFunction(interfaceName: string): string {
        return `${LibarktsConfig.constructorPrefix}${interfaceName}`
    }
    static methodFunction(interfaceName: string, methodName: string): string {
        return `${interfaceName}${methodName}`
    }
    static implFunction(name: string): string {
        return `${LibarktsConfig.implPrefix}${name}`
    }
    static nativeModuleFunction(name: string): string {
        return `${LibarktsConfig.nativeModulePrefix}${name}`
    }
}

export function readTemplate(name: string): string {
    console.log(__dirname)
    return fs.readFileSync(path.join(__dirname, `./../templates/${name}`), 'utf8')
}

export class LibarktsGenerator {
    constructor(
        private outDir: string,
        private idl: IDLFile
    ) {}

    private libPrinter = new BridgesPrinter(this.idl)
    private libFile = 'native/src/bridges.cc'
    private nativeModulePrinter = new NativeModulePrinter(this.idl)
    private nativeModuleFile = 'native/src/ts/LibarktsNativeModule.ts'

    print(): void {
        forceWriteFile(
            path.join(this.outDir, this.libFile),
            this.libPrinter.print()
        )
        forceWriteFile(
            path.join(this.outDir, this.nativeModuleFile),
            readTemplate("Es2PandaNativeModule.ts")
                .replaceAll(
                    "%GENERATED_PART%",
                    this.nativeModulePrinter.print()
                )
        )
    }
}
