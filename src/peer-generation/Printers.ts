import { IndentedPrinter } from "../IndentedPrinter";

export class Printers {
    constructor(
        public C: IndentedPrinter = new IndentedPrinter(),
        public nativeModule: IndentedPrinter = new IndentedPrinter(),
        public nativeModuleEmpty: IndentedPrinter = new IndentedPrinter(),
        public nodeTypes: IndentedPrinter = new IndentedPrinter(),
        public api: IndentedPrinter = new IndentedPrinter(),
        public apiList: IndentedPrinter = new IndentedPrinter(),
    ) { }
}
