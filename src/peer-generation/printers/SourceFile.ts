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

import { Language } from "../../Language"
import { cStyleCopyright, makeIncludeGuardDefine } from "../FileGenerators"
import { ImportsCollector } from "../ImportsCollector"
import { CppLanguageWriter, createLanguageWriter, LanguageWriter, TSLanguageWriter } from "../LanguageWriters"
import { ReferenceResolver } from "../ReferenceResolver"


export abstract class SourceFile {
    public readonly content: LanguageWriter

    public static make(name: string, language: Language, resolver: ReferenceResolver) {
        if (language === Language.CPP) {
            return new CppSourceFile(name, resolver)
        } else if (language === Language.TS) {
            return new TsSourceFile(name, resolver)
        } else {
            return new GenericSourceFile(name, language, resolver)
        }
    }

    constructor (
        public readonly name: string,
        public readonly language: Language,
        protected readonly resolver: ReferenceResolver // TODO try to avoid this dependency
    ) {
        this.content = createLanguageWriter(language, resolver)
    }
    
    public merge(file: this) {
        if (this.language !== file.language) {
            throw new TypeError("language mismatch")
        }
        this.content.concat(file.content)
        this.onMerge(file)
    }
    
    public abstract printToString(): string;
    protected abstract onMerge(file: this): void;
}

export class CppSourceFile extends SourceFile {
    declare public readonly content: CppLanguageWriter

    public readonly includes: Set<string> = new Set();
    public readonly globalIncludes: Set<string> = new Set();

    constructor(name: string, resolver: ReferenceResolver) {
        super(name, Language.CPP, resolver)
    }

    public addInclude(...includes: string[]) {
        includes.forEach(inc => this.includes.add(inc))
    }

    public addGlobalInclude(...includes: string[]) {
        includes.forEach(inc => this.globalIncludes.add(inc))
    }

    protected onMerge(file: this): void {
        this.addInclude(...file.includes);
        this.addGlobalInclude(...file.globalIncludes)
    }

    private get isHeaderFile(): boolean {
        return this.name.endsWith(".h")
    }

    public printToString(): string {
        let fileWriter = createLanguageWriter(Language.CPP, this.resolver) as CppLanguageWriter
        let includeGuard = ""

        fileWriter.writeLines(cStyleCopyright);
        if (this.isHeaderFile) {
            includeGuard = makeIncludeGuardDefine(this.name)
            fileWriter.print(`#ifndef ${includeGuard}\n#define ${includeGuard}\n`)
        }
        
        for (const include of this.includes) {
            fileWriter.writeInclude(include)
        }
        for (const include of this.globalIncludes) {
            fileWriter.writeGlobalInclude(include)
        }
        fileWriter.print("")
        fileWriter.concat(this.content)

        if (this.isHeaderFile) {
            fileWriter.print(`#endif // ${includeGuard}\n`)
        }

        return fileWriter.getOutput().join("\n")
    }
}

export class TsSourceFile extends SourceFile {
    declare public readonly content: TSLanguageWriter

    public readonly imports: ImportsCollector = new ImportsCollector()

    constructor(name: string, resolver: ReferenceResolver) {
        super(name, Language.TS, resolver)
    }

    protected onMerge(file: this): void {
        this.imports.merge(file.imports)
    }

    private get moduleName(): string {
        // TODO set proper module name
        return `./${this.name.replace(/\.ts$/, "")}` 
    }

    public printToString(): string {
        let fileWriter = createLanguageWriter(Language.TS, this.resolver) as TSLanguageWriter
        fileWriter.print(cStyleCopyright)
        this.imports.print(fileWriter, this.moduleName)
        fileWriter.print("")
        fileWriter.concat(this.content)
        return fileWriter.getOutput().join("\n")
    }
}

/** @deprecated Each destination language should have its own SourceFile implementation */
export class GenericSourceFile extends SourceFile {
    public printToString(): string {
        return this.content.getOutput().join("\n")
    }
    protected onMerge(file: this): void {}
}