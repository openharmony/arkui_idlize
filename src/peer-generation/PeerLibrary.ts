import { DeclarationTable } from "./DeclarationTable";
import { PeerFile } from "./PeerFile";
import { Printers } from "./Printers";

export class PeerLibrary {
    public readonly files: PeerFile[] = []
    constructor(
        public declarationTable: DeclarationTable
    ) {}
}