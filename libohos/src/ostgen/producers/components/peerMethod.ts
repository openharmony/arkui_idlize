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

import { D, E, lw, S, T } from "../../../ost";
import * as idl from "@idlizer/core/idl"
import { ArgConvertor } from "./argConvertor";
import { AdvancedGeneratorContext } from "../common";

export function makePeerMethod(method: idl.IDLMethod, ctx: AdvancedGeneratorContext): lw.FunctionDeclaration {
  const serializerName = 'thisSerializer'
  const convertor = new ArgConvertor(ctx, E.v(serializerName), true)
  const stmts = method.parameters.map(param => convertor.write(E.v(param.name), param.type))
  return D.func(method.name,
    method.parameters.map(param => ({ name: param.name, type: ctx.useManaged(param.type).reference() })),
    ctx.useManaged(method.returnType).reference(),
    S.block([
      S.declaration(serializerName, T.c('SerializerBase'), false, E.instance('SerializerBase', [])),
      ...stmts,
      S.e(E.call(ctx.useManagedNativeModule(method).name(), [E.v(serializerName)])),
    ])
  )
}
