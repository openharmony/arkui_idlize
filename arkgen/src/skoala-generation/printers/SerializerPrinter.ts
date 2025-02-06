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

import { Language, LanguageWriter, createLanguageWriter, Method, NamedMethodSignature } from "@idlizer/core"
import * as idl from '@idlizer/core/idl'
import { IdlSkoalaLibrary } from "../idl/idlSkoalaLibrary"

export function makeTSSerializerFromIdl(library: IdlSkoalaLibrary): string {
    let printer = createLanguageWriter(Language.TS, library)
    const serializorPrinter = new IdlSerializerPrinter(library, printer)
    serializorPrinter.print()
    return `
${printer.getOutput().join("\n")}
`
}

class IdlSerializerPrinter {
    constructor(
        private readonly library: IdlSkoalaLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private generateSerializer(target: idl.IDLInterface, prefix: string = "") {
        const methodName = target.name
        this.writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType(target.name, undefined, target)], ["value"])),
            writer => {
                const properties = collectProperties(target, this.library)
                if (properties.length > 0) {
                    writer.writeStatement(
                        writer.makeAssign("valueSerializer", writer.makeRef(idl.createReferenceType("Serializer")), writer.makeThis(), true, false))
                }
                properties.forEach(it => {
                    let field = `value_${it.name}`
                    writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${writer.escapeKeyword(it.name)}`), true))
                    let typeConvertor = this.library.typeConvertor(`value`, it.type!, it.isOptional)
                    typeConvertor.convertorSerialize(`value`, field, writer)
                })
            })
    }

    private printImports(writer: LanguageWriter, serializerDeclarations?: Set<idl.IDLInterface>) {
        writer.print(`import { SerializerBase, Tags, RuntimeType, runtimeType, isInstanceOf } from "@koalaui/interop"`)
        writer.print(`import { int32 } from "@koalaui/common"`)
        writer.print(`import { unsafeCast } from "./generated-utils"`)

        // serializerDeclarations?.forEach(decl => {
        //     const basename = path.basename(decl.fileName ?? "")
        //     if (basename) {
        //         const basenameNoExt = basename.slice(0, basename.indexOf('.'))
        //         writer.print(`import { ${decl.name} } from "./${basenameNoExt}"`)
        //     }
        // })
    }

    print() {
        this.printImports(this.writer, this.library.serializerDeclarations)

        const className = "Serializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        switch (this.writer.language) {
            case Language.ARKTS:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType("uint8_t*")], ["data"])
                break;
            case Language.JAVA:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
        }
        const serializerDeclarations = this.library.serializerDeclarations
        // just a separator
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {
                }, ctorMethod)
            }
            serializerDeclarations.forEach(decl => this.generateSerializer(decl))
        }, superName)
    }
}

export function collectProperties(decl: idl.IDLInterface, library: IdlSkoalaLibrary): idl.IDLProperty[] {
    const superType = idl.getSuperType(decl)
    const superDecl = superType ? library.resolveTypeReference(superType as idl.IDLReferenceType) : undefined
    return [
        ...(superDecl ? collectProperties(superDecl as idl.IDLInterface, library) : []),
        ...decl.properties,
    ].filter(it => !it.isStatic && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.CommonMethod))
}