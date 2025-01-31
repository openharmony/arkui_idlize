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
import { ArgConvertor, CustomTypeConvertor, isImportAttr } from "@idlizer/core";
import { PeerLibrary } from "../peer-generation/PeerLibrary";
import { ArkoalaImportTypeConvertor, ArkoalaInterfaceConvertor, LengthConvertor } from './ArkoalaArgConvertors';
import { isMaterialized } from '../peer-generation/idl/IdlPeerGeneratorVisitor';

export class ArkoalaPeerLibrary extends PeerLibrary {
    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false): ArgConvertor {
        if (idl.isReferenceType(type)) {
            if (isImportAttr(type))
                return new ArkoalaImportTypeConvertor(param, this.targetNameConvertorInstance.convert(type))
        }
        return super.typeConvertor(param, type, isOptionalParam)
    }
    declarationConvertor(param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor {
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