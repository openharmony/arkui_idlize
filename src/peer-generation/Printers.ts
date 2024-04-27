import { IndentedPrinter } from "../IndentedPrinter";

export class Printers {
    constructor(
        public C: IndentedPrinter,
        public nativeModule: IndentedPrinter,
        public nativeModuleEmpty: IndentedPrinter,
        public nodeTypes: IndentedPrinter,
        public api: IndentedPrinter,
        public apiList: IndentedPrinter,
    ) { }
}
