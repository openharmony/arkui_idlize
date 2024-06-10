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

import * as fs from "fs"
import * as path from "path"
import { cStyleCopyright } from "./FileGenerators";

export interface CppFileOptions {
}

export abstract class CppFileWriter {
    protected readonly output: fs.WriteStream

    constructor(filePath: string, protected readonly options: Partial<CppFileOptions> = {}) {
        this.output = fs.createWriteStream(filePath, { encoding: "utf-8" })
        this.writeIntro()
    }

    get stream() {
        return this.output;
    }

    writePragma(pragma: string) {
        this.output.write(`#pragma ${pragma}\n`)
    }

    writeInclude(path: string) {
        this.output.write(`#include "${path}"\n`)
    }

    writeLine(line = "") {
        this.output.write(line + "\n")
    }

    write(code: string) {
        this.output.write(code)
    }

    beginNamespace(namespace: string) {
        this.writeLine(`namespace ${namespace} {`)
    }

    endNamespace() {
        this.writeLine(`}`)
        this.writeLine()
    }

    end() {
        this.writeOutro()
        this.output.end()
    }

    private writeIntro() {
        this.output.write(cStyleCopyright)
        this.writeLine()
    }

    private writeOutro() {
        this.writeLine()
    }
}

export interface CppHeaderFileGeneratorOptions extends CppFileOptions {
    includeGuardStyle: "pragma" | "ifndef"
}

export class CppHeaderFileGenerator extends CppFileWriter {
    private includeGuardDefine?: string;

    constructor(filePath: string, protected readonly options: Partial<CppHeaderFileGeneratorOptions> = {}) {
        super(filePath, options)
        if (options.includeGuardStyle == "pragma") {
            this.writePragma("once")
        } else {
            this.includeGuardDefine = makeIncludeGuardDefine(filePath)
            this.write(`#ifndef ${this.includeGuardDefine}\n`)
            this.write(`#define ${this.includeGuardDefine}\n`)
        }
        this.writeLine()
    }

    end() {
        if (this.includeGuardDefine) {
            this.writeLine(`\n#endif // ${this.includeGuardDefine}`)
        }
        super.end()
    }
}

export interface CppSourceFileGeneratorOptions extends CppFileOptions {
    
}

export class CppSourceFileGenerator extends CppFileWriter {
    constructor(filePath: string, protected readonly options: Partial<CppSourceFileGeneratorOptions> = {}) {
        super(filePath, options)
    }
}

function makeIncludeGuardDefine(filePath: string) {
    let basename = path.basename(filePath);
    return basename.replace(/[.\- ]/g, "_").toUpperCase()
}