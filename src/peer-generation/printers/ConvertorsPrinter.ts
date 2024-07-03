import { DeclarationTable } from "../DeclarationTable";
import { LanguageWriter } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary";

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
        this.writer.print('void assign_to(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void assign_union_to(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void assign_optional_to(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        for (const [typename, selectors] of this.table.allUnionTypes()) {
            this.writer.print('template<typename T>')
            this.writer.print(`void assign_union_to(std::optional<T>& dst, const ${ typename }& src) {`)
            this.writer.pushIndent()
            this.writer.print(`switch (src.selector) {`)
            this.writer.pushIndent()
            selectors.forEach(selector => {
                this.writer.print(`case ${ selector.id - 1 }: assign_to(dst, src.${ selector.name }); break;`)
            })
            this.writer.print(`default: LOGE("Unexpected src->selector: %{public}d\\n", src.selector); abort(); `)
            this.writer.popIndent()
            this.writer.print("}")
            this.writer.popIndent()
            this.writer.print("}")
            this.writer.print("")
        }

    }

    writeOptionalConvertors() {
        this.writer.print("#define ASSIGN_OPT(name)\\")
        this.writer.pushIndent()
        this.writer.print("template<typename T> \\")
        this.writer.print("void assign_optional_to(std::optional<T>& dst, const name& src) { \\")
        this.writer.pushIndent()
        this.writer.print("if (src.tag != ARK_TAG_UNDEFINED) { \\")
        this.writer.pushIndent()
        this.writer.print("assign_union_to(dst, src.value); \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.print("template<typename T> \\")
        this.writer.print("void with_optional(const name& src, T call) { \\")
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
        this.writer.print('void assign_literal_to(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        for (const [name, type] of this.table.allLiteralTypes()) {
            this.writer.print('template<typename T>')
            this.writer.print(`void assign_literal_to(std::optional<T>& dst, const ${name}& src) {`)
            this.writer.pushIndent()
            this.writer.print(`assign_to(dst, src.${type}); `)
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
