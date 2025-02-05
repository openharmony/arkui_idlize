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

import * as idl from "@idlizer/core/idl"
import { MethodSignature, FieldModifier, createLanguageWriter } from "../../LanguageWriters"
import { LanguageWriter, PeerLibrary } from "@idlizer/core"
import { writeDeserializer, writeSerializer } from "../SerializerPrinter"
import { TargetFile } from "../TargetFile"
import { ARKOALA_PACKAGE_PATH } from "./Cangjie"
import { IdlSyntheticTypeBase } from "./CommonUtils"

export function makeCJSerializer(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    let writer = createLanguageWriter(library.language, library)
    writeSerializer(library, writer, "")
    return { targetFile: new TargetFile('Serializer', ARKOALA_PACKAGE_PATH), writer: writer }
}

export function makeCJDeserializer(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    let writer = createLanguageWriter(library.language, library)
    writeDeserializer(library, writer, "")
    return { targetFile: new TargetFile('Deserializer', ARKOALA_PACKAGE_PATH), writer: writer }
}

export class CJEnum extends IdlSyntheticTypeBase {
    public readonly isStringEnum: boolean
    public readonly members: {
        name: string,
        stringId: string | undefined,
        numberId: number,
    }[] = []
    constructor(source: Object | undefined, public name: string, members: { name: string, id: string | number | undefined }[]) {
        super(source)
        this.isStringEnum = members.every(it => typeof it.id == 'string')
        // TODO: string enums
        if (this.isStringEnum) {
            throw new Error(`String enum ${this.name} not supported yet in CJ`)
        }

        let memberValue = 0
        for (const member of members) {
            if (typeof member.id == 'string') {
                this.members.push({name: member.name, stringId: member.id, numberId: memberValue})
            }
            else if (typeof member.id == 'number') {
                memberValue = member.id
                this.members.push({name: member.name, stringId: undefined, numberId: memberValue})
            }
            else {
                this.members.push({name: member.name, stringId: undefined, numberId: memberValue})
            }
            memberValue += 1
        }
    }

    print(writer: LanguageWriter): void {
        writer.writeClass(this.name, () => {
            const enumType = idl.createReferenceType(this.name)
            this.members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`${this.name}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.IDLI32Type
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(idl.IDLVoidType, [intType])
            writer.writeConstructorImplementation(this.name, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })
        })
    }
}
