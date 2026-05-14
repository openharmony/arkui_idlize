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

import { hashCodeFromString } from "@idlizer/core";
import { Builders, lw, std } from "@idlizer/ost"
import { C_API_PREFIX } from "../producers/common.js";

export function monoName(type: lw.LWType, prefix: string = C_API_PREFIX): string {
    function monoName(type: lw.LWType): string {
        if (type.kind === lw.LWKind.HoleType) {
            throw new Error("WAS NOT PROCESSED PROPERLY")
        }
        if (type.kind === lw.LWKind.FunctionalType)
            return [
                'Callback',
                ...type.params.map(p => monoName(p.type)),
                monoName(type.returnType)
            ].join('_')
        switch (type.name) {
            case std.names.types.constant:
            case std.names.types.pointer:
            case std.names.types.reference:
            case std.names.types.struct:
                return monoName(type.args[0])
            case std.names.types.array:
                return ['Array', monoName(type.args[0])].join('_')
            case std.names.types.promise:
                return ['Promise', monoName(type.args[0])].join('_')
            case std.names.types.map:
                return ['Map', ...type.args.map(ty => monoName(ty))].join('_')
            case std.names.types.optional:
                return ['Opt', monoName(type.args[0])].join('_')
            case std.names.types.union:
                return ['Union', ...type.args.map(ty => monoName(ty))].join('_')
            default:
                return type.name.split('.').pop()!
        }
    }
    return prefix + '.@synthetic.mono.instance.' + monoName(type)
}

export function callbackKindDeclaration(callers: string[], nameFunc: (name: string) => string) {
    return Builders.enum(nameFunc('CallbackKind'))
        .members(callers.map(it => {
            const name = it.toUpperCase()
            return { name, value: hashCodeFromString(name) }
        })).$()
}
