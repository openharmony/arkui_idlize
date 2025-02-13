/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as idl from '@idlizer/core/idl'
import { ArgConvertor, CustomTypeConvertor, isMaterialized,
    isImportAttr, IdlNameConvertor, Language, PeerLibrary,
    LanguageWriter,
    IndentedPrinter,
    TSLanguageWriter,
    CppConvertor,
    CppLanguageWriter,
    JavaLanguageWriter,
    ETSLanguageWriter,
    CJLanguageWriter,
    CJIDLTypeToForeignStringConvertor
} from "@idlizer/core";
import { ArkoalaImportTypeConvertor, ArkoalaInterfaceConvertor, LengthConvertor } from './ArkoalaArgConvertors';
import { ArkoalaTSTypeNameConvertor, ArkoalaETSTypeNameConvertor,
    ArkoalaJavaTypeNameConvertor, ArkoalaCJTypeNameConvertor
} from './ArkoalaTypeNameConvertors';
import { ArkPrimitiveTypesInstance } from './ArkPrimitiveType';

export class ArkoalaPeerLibrary extends PeerLibrary {
    override createLanguageWriter(language?: Language): LanguageWriter {
        language ??= this.language
        const printer = new IndentedPrinter()
        switch (language) {
            case Language.TS: return new TSLanguageWriter(printer, this,
                new ArkoalaTSTypeNameConvertor(this))
            case Language.ARKTS: return new ETSLanguageWriter(printer, this,
                new ArkoalaETSTypeNameConvertor(this), new CppConvertor(this))
            case Language.JAVA: return new JavaLanguageWriter(printer, this,
                new ArkoalaJavaTypeNameConvertor(this))
            case Language.CPP: return new CppLanguageWriter(printer, this,
                new CppConvertor(this), ArkPrimitiveTypesInstance)
            case Language.CJ: return new CJLanguageWriter(printer, this,
                new ArkoalaCJTypeNameConvertor(this), new CJIDLTypeToForeignStringConvertor(this))
            default: return super.createLanguageWriter(language)
        }
    }
    override createTypeNameConvertor(language: Language): IdlNameConvertor {
        switch (language) {
            case Language.TS: return new ArkoalaTSTypeNameConvertor(this)
            case Language.ARKTS: return new ArkoalaETSTypeNameConvertor(this)
            case Language.JAVA: return new ArkoalaJavaTypeNameConvertor(this)
            case Language.CJ: return new ArkoalaCJTypeNameConvertor(this)
        }
        return super.createTypeNameConvertor(language)
    }
    override typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false): ArgConvertor {
        if (idl.isReferenceType(type)) {
            if (isImportAttr(type))
                return new ArkoalaImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
        }
        return super.typeConvertor(param, type, isOptionalParam)
    }
    override declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor {
        switch (type.name) {
            case `Dimension`:
            case `Length`:
                return new LengthConvertor(type.name, param, this.language)
            case `AnimationRange`:
                return new CustomTypeConvertor(param, "AnimationRange", false, "AnimationRange<number>")
            case `ContentModifier`:
                return new CustomTypeConvertor(param, "ContentModifier", false, "ContentModifier<any>")
        }
        if (declaration) {
            if (isImportAttr(declaration))
                return new ArkoalaImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
            if (idl.isInterface(declaration) &&
                !isMaterialized(declaration, this) &&
                declaration.subkind === idl.IDLInterfaceSubkind.Interface)
            {
                return new ArkoalaInterfaceConvertor(this, (declaration.name!), param, declaration)
            }
        }
        return super.declarationConvertor(param, type, declaration)
    }
}