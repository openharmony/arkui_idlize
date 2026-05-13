/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import * as idl from "./idl"
import { Language } from "./Language";
import { IdlNameConvertor } from "./LanguageWriters";
import { ArgConvertor } from "./LanguageWriters/ArgConvertors";
import { LayoutManager } from "./peer-generation/LayoutManager";
import { ReferenceResolver } from "./peer-generation/ReferenceResolver";

// todo: TypeProcessor? LibraryBase?
export interface LibraryInterface extends ReferenceResolver {
    language: Language
    get files(): idl.IDLFile[]
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor
    createTypeNameConvertor(language: Language): IdlNameConvertor
    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType
    getCurrentContext(): string | undefined
    layout: LayoutManager
    /**
     * todo: is it really needed?
     */
    libraryPrefix: string
}

export function getTransformer(library: LibraryInterface, from: idl.IDLNode, to: idl.IDLNode): { module: string, ns?: string, method: string } {
    const convertor = library.createTypeNameConvertor(Language.CPP)
    const withNS = Language.supportNS(library.language)
    const handwritten = library.layout.handwrittenPackage()
    return {
        module: withNS ? handwritten : `${handwritten}.extractors`,
        ns: withNS ? "extractors" : undefined,
        method: `transform_${convertor.convert(from)}_to_${convertor.convert(to)}`
    }
}
