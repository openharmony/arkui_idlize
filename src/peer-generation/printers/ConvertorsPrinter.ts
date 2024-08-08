import { DeclarationTable } from "../DeclarationTable";
import { LanguageWriter } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary";

export const SELECTOR_ID_PREFIX = "SELECTOR_ID_"

class ConvertorsPrinter {
    constructor(
        private readonly library: PeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private get table(): DeclarationTable {
        return this.library.declarationTable
    }

    writeUnionConvertors() {

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void AssignTo(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void AssignUnionTo(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void AssignOptionalTo(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        for (const [typename, selectors] of this.table.allUnionTypes()) {
            this.writer.print('template<typename T>')
            this.writer.print(`void AssignUnionTo(std::optional<T>& dst, const ${ typename }& src)`)
            this.writer.print("{")
            this.writer.pushIndent()
            this.writer.print(`switch (src.selector) {`)
            this.writer.pushIndent()
            selectors.forEach(selector => {
                this.writer.print(`case ${SELECTOR_ID_PREFIX}${ selector.id - 1 }: AssignTo(dst, src.${ selector.name }); break;`)
            })
            this.writer.print(`default:`)
            this.writer.print(`{`)
            this.writer.pushIndent()
            this.writer.print(`LOGE("Unexpected src->selector: %{public}d\\n", src.selector);`)
            this.writer.print(`return;`)
            this.writer.popIndent()
            this.writer.print(`}`)
            this.writer.popIndent()
            this.writer.print("}")
            this.writer.popIndent()
            this.writer.print("}")
            this.writer.print("")
        }

    }

    writeOptionalConvertors() {
        this.writer.print("#define ASSIGN_OPT(name) \\")
        this.writer.pushIndent()
        this.writer.print("template<typename T> \\")
        this.writer.print("void AssignOptionalTo(std::optional<T>& dst, const name& src) { \\")
        this.writer.pushIndent()
        this.writer.print("if (src.tag != ARK_TAG_UNDEFINED) { \\")
        this.writer.pushIndent()
        this.writer.print("AssignUnionTo(dst, src.value); \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.print("template<typename T> \\")
        this.writer.print("void WithOptional(const name& src, T call) { \\")
        this.writer.pushIndent()
        this.writer.print("if (src.tag != ARK_TAG_UNDEFINED) { \\")
        this.writer.pushIndent()
        this.writer.print("call(src.value); \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.popIndent()
        this.writer.print("}")
        this.writer.popIndent()
        this.table.allUnionTypes()
        this.writer.pushIndent()
        this.table.allOptionalTypes().forEach(optionalName => {
            this.writer.print(`ASSIGN_OPT(${optionalName})`)
        })
        this.writer.popIndent()
        this.writer.print("#undef ASSIGN_OPT")
    }

    writeLiteralConvertors() {

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void AssignLiteralTo(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        for (const [name, fields] of this.table.allLiteralTypes()) {
            this.writer.print('template<typename T>')
            this.writer.print(`void AssignLiteralTo(std::optional<T>& dst, const ${name}& src)`)
            this.writer.print("{")
            this.writer.pushIndent()
            if (fields.length > 0) {
                this.writer.print(`AssignTo(dst, src.${fields[0]});`)
            }
            this.writer.popIndent()
            this.writer.print(`}`)
            this.writer.print("")
        }
        this.writer.print("")
    }

    print() {
        this.writeUnionConvertors()
        this.writeLiteralConvertors()
        this.writeOptionalConvertors()
    }
}

export function writeConvertors(library: PeerLibrary, writer: LanguageWriter) {
    const printer = new ConvertorsPrinter(library, writer)
    printer.print()
}
