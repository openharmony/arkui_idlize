/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LanguageWriter, PeerLibrary, PrimitiveTypeList } from "@idlizer/core";
import { DeclarationTargets } from "../DeclarationTargetCollector";

export const SELECTOR_ID_PREFIX = "SELECTOR_ID_"

class ConvertorsPrinter {
    constructor(
        private readonly library: PeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

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

        for (const [typename, selectors] of DeclarationTargets.allUnionTypes(this.library, "both")) {
            this.writer.print('template<typename T>')
            this.writer.print(`void AssignUnionTo(std::optional<T>& dst,`)
            this.writer.print(`                   const ${typename}& src)`)
            this.writer.print("{")
            this.writer.pushIndent()
            this.writer.print(`switch (src.selector) {`)
            this.writer.pushIndent()
            selectors.forEach(selector => {
                this.writer.print(`case ${SELECTOR_ID_PREFIX}${selector.id}: AssignTo(dst, src.${this.writer.escapeKeyword(selector.name)}); break;`)
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
        //this.writer.pushIndent()
        this.writer.print("template<typename T> \\")
        this.writer.print("void AssignOptionalTo(std::optional<T>& dst, const name& src) { \\")
        this.writer.pushIndent()
        this.writer.print(`if (src.tag != ${PrimitiveTypeList.UndefinedTag}) { \\`)
        this.writer.pushIndent()
        this.writer.print("AssignUnionTo(dst, src.value); \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.print("template<typename T> \\")
        this.writer.print("void WithOptional(const name& src, T call) { \\")
        this.writer.pushIndent()
        this.writer.print(`if (src.tag != ${PrimitiveTypeList.UndefinedTag}) { \\`)
        this.writer.pushIndent()
        this.writer.print("call(src.value); \\")
        this.writer.popIndent()
        this.writer.print("} \\")
        this.writer.popIndent()
        this.writer.print("}")
        this.writer.popIndent()
        this.writer.pushIndent()
        DeclarationTargets.allOptionalTypes(this.library, "both").forEach(optionalName => {
            this.writer.print(`ASSIGN_OPT(${optionalName})`)
        })
        //this.writer.popIndent()
        this.writer.print("#undef ASSIGN_OPT")
    }

    writeLiteralConvertors() {

        this.writer.print('template<typename T, typename P>')
        this.writer.print('void AssignLiteralTo(std::optional<T>& dst, const P& src);')
        this.writer.print("")

        for (const [name, fields] of DeclarationTargets.allLiteralTypes(this.library, "both")) {
            this.writer.print('template<typename T>')
            this.writer.print(`void AssignLiteralTo(std::optional<T>& dst,`)
            this.writer.print(`                     const ${this.writer.escapeKeyword(name)}& src)`)
            this.writer.print("{")
            this.writer.pushIndent()
            if (fields.length > 0) {
                this.writer.print(`AssignTo(dst, src.${this.writer.escapeKeyword(fields[0])});`)
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
