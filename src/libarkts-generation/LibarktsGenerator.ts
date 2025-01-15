import * as path from "node:path"
import { PeerLibrary } from "../peer-generation/PeerLibrary"
import { BridgesPrinter } from "./BridgesPrinter"
import { forceWriteFile } from "@idlize/core"
import { NativeModulePrinter } from "./NativeModulePrinter"


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
export class LibarktsGenerator {
    constructor(
        private outDir: string,
        private library: PeerLibrary
    ) {}

    private libPrinter = new BridgesPrinter(this.library)
    private libFile = 'native/src/bridges.cc'
    private nativeModulePrinter = new NativeModulePrinter(this.library)
    private nativeModuleFile = 'native/src/ts/LibarktsNativeModule.ts'

    print(): void {
        forceWriteFile(
            path.join(this.outDir, this.libFile),
            this.libPrinter.print()
        )
        forceWriteFile(
            path.join(this.outDir, this.nativeModuleFile),
            this.nativeModulePrinter.print()
        )
    }
}
