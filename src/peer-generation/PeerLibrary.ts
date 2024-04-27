import { DeclarationTable } from "./DeclarationTable";
import { PeerFile } from "./PeerFile";
import { Printers } from "./Printers";

export class PeerLibrary {
    public readonly files: PeerFile[] = []
    public readonly commonMethods: string[] = []
    public readonly customComponentMethods: string[] = []

    constructor(
        public declarationTable: DeclarationTable
    ) {}
}