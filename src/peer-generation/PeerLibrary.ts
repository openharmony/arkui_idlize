import { DeclarationTable } from "./DeclarationTable";
import { PeerFile } from "./PeerFile";
import { Printers } from "./Printers";

export type PeerLibraryOutput = {
    outputC: string[]
    nativeModuleMethods: string[]
    nativeModuleEmptyMethods: string[]
    nodeTypes: string[]
    apiHeaders: string[]
    apiHeadersList: string[]
    components: Map<string, string[]>
    peers: Map<string, string[]>
    commonMethods: string[]
    customComponentMethods: string[]
}

export class PeerLibrary {
    public readonly files: PeerFile[] = []

    constructor(
        public declarationTable: DeclarationTable
    ) {}

    private readonly commonMethods: string[] = []
    pushCommonMethods(...methods: string[]) {
        this.commonMethods.push(...methods)
    }

    private readonly customComponentMethods: string[] = []
    pushCustomComponentMethods(...methods: string[]) {
        this.customComponentMethods.push(...methods)
    }

    generate(): PeerLibraryOutput {
        const printers = new Printers()
        const components = new Map<string, string[]>()
        const peers = new Map<string, string[]>()
        for (const file of this.files) {
            file.printGlobal(printers)
            components.set(file.originalFilename, file.generateComponent())
            peers.set(file.originalFilename, file.generatePeer())
        }
        return {
            outputC: printers.C.getOutput(),
            nativeModuleMethods: printers.nativeModule.getOutput(),
            nativeModuleEmptyMethods: printers.nativeModuleEmpty.getOutput(),
            nodeTypes: printers.nodeTypes.getOutput(),
            apiHeaders: printers.api.getOutput(),
            apiHeadersList: printers.apiList.getOutput(),
            components: components,
            peers: peers,
            commonMethods: this.commonMethods,
            customComponentMethods: this.customComponentMethods,
        }
    }
}