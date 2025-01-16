import * as path from "node:path"
import { BridgesPrinter } from "./BridgesPrinter"
import { IDLEntry, forceWriteFile } from "@idlize/core"
import { NativeModulePrinter } from "./NativeModulePrinter"
import * as fs from "fs"
import { IDLFile } from "./Es2PandaTransformer"
import { Config } from "./Config"

export function readTemplate(name: string): string {
    console.log(__dirname)
    return fs.readFileSync(path.join(__dirname, `./../templates/${name}`), 'utf8')
}

export class LibarktsGenerator {
    constructor(
        private outDir: string,
        private idl: IDLFile,
        private config = new Config()
    ) {}

    private libPrinter = new BridgesPrinter(this.idl, this.config)
    private libFile = 'native/src/bridges.cc'
    private nativeModulePrinter = new NativeModulePrinter(this.idl, this.config)
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
