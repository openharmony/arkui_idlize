import * as path from "node:path"
import { PeerLibrary } from "../peer-generation/PeerLibrary"
import { BridgesPrinter } from "./BridgesPrinter"
import { forceWriteFile } from "@idlize/core"

export class LibarktsGenerator {
    constructor(
        private outDir: string,
        private library: PeerLibrary
    ) {}

    private libPrinter = new BridgesPrinter(this.library)
    private libFile = 'native/src/bridges.cc'

    print(): void {
        forceWriteFile(
            path.join(this.outDir, this.libFile),
            this.libPrinter.print()
        )
    }
}
