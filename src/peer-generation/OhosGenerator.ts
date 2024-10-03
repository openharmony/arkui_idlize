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
import * as fs from 'fs'
import * as path from 'path'

import { IndentedPrinter } from "../IndentedPrinter"
import { IdlPeerLibrary } from './idl/IdlPeerLibrary'
import { CppLanguageWriter, Method, Type } from './LanguageWriters'
import { IDLEntry, IDLInterface, IDLType, IDLVoidType, isClass, isInterface, isReferenceType } from '../idl'
import { readLangTemplate } from './FileGenerators'
import { capitalize, Language } from '../util'
import { PrimitiveType } from './DeclarationTable'
import { isMaterialized } from './idl/IdlPeerGeneratorVisitor'

class OHOSVisitor {
    hWriter = new CppLanguageWriter(new IndentedPrinter())
    cppWriter = new CppLanguageWriter(new IndentedPrinter())

    libraryName: string = ""

    interfaces = new Array<IDLInterface>()
    data = new Array<IDLInterface>()

    constructor(
        protected library: IdlPeerLibrary
    ) { }

    mapType(type: IDLType): string {
        if (isReferenceType(type)) {
            return `${PrimitiveType.Prefix}${this.libraryName}_${type.name!}`
        }
        return this.hWriter.mapIDLType(type)
    }

    private writeData(clazz: IDLInterface) {
        let name = `${PrimitiveType.Prefix}${this.libraryName}_${clazz.name}`
        let _ = this.hWriter
        _.print(`typedef struct ${name}`)
        _.pushIndent()
        clazz.properties.forEach(it => {
            _.print(`${this.mapType(it.type)} ${it.name};`)
        })
        _.popIndent()
        _.print(`} ${name};`)

    }

    private writeModifier(clazz: IDLInterface) {
        let name = this.modifierName(clazz.name)
        let handleType = this.handleType(clazz.name)
        let _ = this.hWriter
        _.print(`typedef struct ${handleType}Opaque;`)
        _.print(`typedef struct ${handleType}Opaque* ${handleType};`)
        _.print(`typedef struct ${name} {`)
        _.pushIndent()
        clazz.constructors.forEach((_, index) => {
            let name = `construct${(index > 0) ? index.toString() : ""}`
            this.hWriter.print(`${handleType} (*${name})();`)
        })
        clazz.methods.forEach((method, index) => {
            let params = new Array<[string, string]>()
            if (!method.isStatic) {
                params.push(["thiz", handleType])
            }
            params = params.concat(method.parameters.map(it => [it.name, this.hWriter.mapIDLType(it.type!)]))
            this.hWriter.print(`${this.mapType(method.returnType)} (*${method.name})(${params.map(it => `${it[1]} ${it[0]}`).join(", ")});`)
        })
        clazz.properties.forEach(property => {
            this.hWriter.print(`${this.mapType(property.type)} (*get${capitalize(property.name)})(${handleType} thiz);`)
            if (!property.isReadonly) {
                this.hWriter.print(`void (*set${capitalize(property.name)})(${handleType} thiz, ${this.mapType(property.type)} value);`)
            }
        })
        this.hWriter.popIndent()
        this.hWriter.print(`} ${name};`)
    }

    private modifierName(name: string): string {
        return `${PrimitiveType.Prefix}${this.libraryName}_${name}Modifier`
    }
    private handleType(name: string): string {
        return `${PrimitiveType.Prefix}${this.libraryName}_${name}Handle`
    }

    private writeModifiers() {
        this.libraryName = 'xml' // TODO: deduce from package/smth.

        this.interfaces.forEach(it => {
            this.writeModifier(it)
        })
        this.data.forEach(it => {
            this.writeData(it)
        })
        let name = `${PrimitiveType.Prefix}${this.libraryName}_API`
        this.hWriter.print(`typedef struct ${name} {`)
        this.hWriter.pushIndent()
        this.hWriter.print(`${PrimitiveType.Prefix}Int32 version;`)
        this.interfaces.forEach(it => {
            this.hWriter.print(`const ${this.modifierName(it.name)}* (*${capitalize(it.name)})();`)
        })
        this.hWriter.popIndent()
        this.hWriter.print(`} ${name};`)
    }

    private writeClass(clazz: IDLInterface) {
        this.cppWriter.writeClass(clazz.name, (writer) => {
            clazz.constructors.forEach(it => {
                writer.writeConstructorImplementation(clazz.name,
                    this.cppWriter.makeSignature(IDLVoidType, it.parameters), (writer) => {
                })
            })
            clazz.methods.forEach(it => {
                writer.writeMethodImplementation(new Method(it.name,
                    this.cppWriter.makeSignature(it.returnType, it.parameters)), (writer) => {
                })
            })
        })
    }

    visitDeclaration(entry: IDLEntry): void {
        if (isClass(entry)) {
            this.writeClass(entry)
        }
    }

    execute(outDir: string) {
        PrimitiveType.Prefix = "OH_"

        this.library.files.forEach(file => {
            file.entries.forEach(entry => {
                if (isInterface(entry) || isClass(entry)) {
                    if (isMaterialized(entry))
                        this.interfaces.push(entry)
                    else
                        this.data.push(entry)
                }
            })
        })

        this.hWriter.writeLines(readLangTemplate('ohos_api_prologue.h', Language.CPP))
        this.writeModifiers()
        this.library.files.forEach(file => {
            file.entries.forEach(entry => this.visitDeclaration(entry))
        })
        this.hWriter.writeLines(readLangTemplate('ohos_api_epilogue.h', Language.CPP))

        this.hWriter.printTo(path.join(outDir, "xml.h"))
        this.cppWriter.printTo(path.join(outDir, "xml.cc"))
    }
}

export function generateOhos(outDir: string, peerLibrary: IdlPeerLibrary): void {
    console.log("GENERATE OHOS API")

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

    const visitor = new OHOSVisitor(peerLibrary)
    visitor.execute(outDir)
}
