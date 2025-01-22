import * as path from "path"
import { Language, toIDL } from "@idlize/core"
import { createReferenceType, IDLEntry } from "@idlize/core/idl"
import { PeerLibrary } from "../src/peer-generation/PeerLibrary"
import { PeerFile } from "../src/peer-generation/PeerFile"


export class IDLTestData {
    readonly peerLibrary: PeerLibrary

    constructor(idlFiles: string[]) {
        this.peerLibrary = new PeerLibrary(Language.TS)
        idlFiles.forEach(file =>
            this.peerLibrary.files.push(new PeerFile(file, toIDL(path.join(__dirname, file)))))
    }

    lookup<T extends IDLEntry>(name: string): T {
        return this.peerLibrary.resolveTypeReference(createReferenceType(name)) as T
    }
}

export function withDataFrom(idlFiles: string | string[], testFunc: (data: IDLTestData) => void) {
    testFunc(new IDLTestData(typeof idlFiles === "string" ? [idlFiles] : idlFiles))
}