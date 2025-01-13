import * as path from "node:path"
import { PeerLibrary } from "../peer-generation/PeerLibrary"
import { LibPrinter } from "./LibPrinter"
import { forceWriteFile } from "@idlize/core"

export class LibarktsGenerator {
    constructor(
        private outDir: string,
        private library: PeerLibrary
    ) {}

    private libPrinter = new LibPrinter(this.library)
    private libFile = 'native/src/es2panda.cc'

    print(): void {
        forceWriteFile(
            path.join(this.outDir, this.libFile),
            this.libPrinter.print()
        )
    }
}
