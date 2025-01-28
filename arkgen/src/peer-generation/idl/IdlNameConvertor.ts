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

import * as idl from '@idlizer/core/idl'
import { Language } from '@idlizer/core'
import { DeclarationConvertor } from '@idlizer/core'
import { qualifiedName } from '@idlizer/core'

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    convertNamespace(decl: idl.IDLNamespace): string {
        return decl.name
    }
    convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    convertEnum(decl: idl.IDLEnum): string {
        // TODO: namespace-related-to-rework
        throw new Error("not implemented yet")
        // strange logic here..
        //return `${idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace) ?? ""}${decl.name}`
    }
    convertTypedef(decl: idl.IDLTypedef): string {
        return decl.name
    }
    convertCallback(decl: idl.IDLCallback): string {
        return decl.name ?? "MISSING CALLBACK NAME"
    }
    convertMethod(decl: idl.IDLMethod): string {
        return decl.name
    }
    convertConstant(decl: idl.IDLConstant): string {
        return decl.name
    }

    static readonly I = new DeclarationNameConvertor()
}

export class TSFeatureNameConvertor extends DeclarationNameConvertor {
    override convertEnum(decl: idl.IDLEnum): string {
        // TODO: namespace-related-to-rework
        throw new Error("not implemented yet")
        // strange logic here..
        //return `${idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace) ?? decl.name}`
    }
    static readonly I = new TSFeatureNameConvertor()
}

export class ETSDeclarationNameConvertor extends DeclarationNameConvertor {
    override convertEnum(decl: idl.IDLEnum): string {
        return qualifiedName(decl, "_");
    }
    static readonly I = new ETSDeclarationNameConvertor()
}

export class ETSFeatureNameConvertor extends DeclarationNameConvertor {
    override convertEnum(decl: idl.IDLEnum): string {
        return qualifiedName(decl, "_");
    }
    static readonly I = new ETSFeatureNameConvertor()
}

export function createDeclarationNameConvertor(language: Language): DeclarationNameConvertor {
    switch (language) {
        case Language.ARKTS: return ETSDeclarationNameConvertor.I
        case Language.JAVA:
        case Language.CPP:
        case Language.CJ:
        case Language.TS: return DeclarationNameConvertor.I
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}

export function createFeatureNameConvertor(language: Language): DeclarationNameConvertor {
    switch (language) {
        case Language.ARKTS: return ETSFeatureNameConvertor.I
        case Language.JAVA:
        case Language.CPP:
        case Language.CJ:
        case Language.TS: return TSFeatureNameConvertor.I
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}
