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

import * as idl from "../../idl"
import { DeclarationConvertor } from "../../LanguageWriters/nameConvertor";
import { Language } from "../../Language";

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    convertEnum(decl: idl.IDLEnum): string {
        return `${idl.getNamespacesPathFor(decl).join('')}${decl.name}`
    }
    convertTypedef(decl: idl.IDLTypedef): string {
        return decl.name
    }
    convertCallback(decl: idl.IDLCallback): string {
        return decl.name ?? "MISSING CALLBACK NAME"
    }
    convertNamespace(node: idl.IDLNamespace): string {
        return node.name
    }
    convertMethod(node: idl.IDLMethod): string {
        return node.name
    }
    convertConstant(node: idl.IDLConstant): string {
        return node.name
    }

    static readonly I = new DeclarationNameConvertor()
}

export class TSFeatureNameConvertor extends DeclarationNameConvertor {
    override convertEnum(decl: idl.IDLEnum): string {
        const namespace = idl.getNamespacesPathFor(decl).map(it => it.name)
        if (namespace.length > 0)
            return namespace[0]
        return decl.name
    }
    static readonly I = new TSFeatureNameConvertor()
}

export class ETSDeclarationNameConvertor extends DeclarationNameConvertor {
    override convertInterface(decl: idl.IDLInterface): string {
        return idl.getFQName(decl)
    }
    override convertEnum(decl: idl.IDLEnum): string {
        return idl.getFQName(decl)
    }
    static readonly I = new ETSDeclarationNameConvertor()
}

export class CJDeclarationNameConvertor extends DeclarationNameConvertor {
    override convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    override convertEnum(decl: idl.IDLEnum): string {
        return decl.name
    }
    static readonly I = new CJDeclarationNameConvertor()
}

export class ETSFeatureNameConvertor extends DeclarationNameConvertor {
    override convertEnum(decl: idl.IDLEnum): string {
        const namespace = idl.getNamespacesPathFor(decl).map(it => it.name)
        if (namespace.length > 0)
            return namespace[0]
        return decl.name
    }
    static readonly I = new ETSFeatureNameConvertor()
}

export class CJFeatureNameConvertor extends DeclarationNameConvertor {
    override convertEnum(decl: idl.IDLEnum): string {
        return decl.name
    }
    static readonly I = new CJFeatureNameConvertor()
}

export function createDeclarationNameConvertor(language: Language): DeclarationNameConvertor {
    switch (language) {
        case Language.ARKTS: return ETSDeclarationNameConvertor.I
        case Language.JAVA:
        case Language.CPP:
        case Language.TS: return DeclarationNameConvertor.I
        case Language.CJ: CJDeclarationNameConvertor.I
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}

export function createFeatureNameConvertor(language: Language): DeclarationNameConvertor {
    switch (language) {
        case Language.ARKTS: return ETSFeatureNameConvertor.I
        case Language.JAVA:
        case Language.CPP:
        case Language.TS: return TSFeatureNameConvertor.I
        case Language.CJ: return CJFeatureNameConvertor.I
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}
