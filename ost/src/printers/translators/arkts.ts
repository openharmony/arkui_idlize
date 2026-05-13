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

import * as lw from "../../lws.js"
import { std } from "../../stdlib.js";
import { T } from "../../builders/index.js";
import { ConvertTSTypes, TSPrinter } from "./typescript.js";

export class ConvertArkTSTypes extends ConvertTSTypes {
  override goValueType(type: lw.ValueType): lw.ValueType {
    switch (type.name) {
      case std.names.types.u8: return T.c('byte')
      case std.names.types.i32: return T.c('int')
      case std.names.types.f32: return T.c('float')
      case std.names.types.u8: return T.c('byte')
      case std.names.types.u64: return T.c('long')
      case std.names.types.bigint: return T.c('long')
      case std.names.types.pointer: return T.c('long')
      case std.names.types.nativePointer: return T.c('long')
      case std.names.types.string: return T.c('string')
      case std.names.types.vector: return T.c('FixedArray', ...type.args.map(e => this.goType(e)))
    }
    return super.goValueType(type)
  }
}

export class ArkTSPrinter extends TSPrinter {
  printDeclaration(declaration: lw.LWDeclaration): void {
    if (declaration.kind === lw.LWKind.EnumDeclaration) {
      const needsLong = declaration.members.some(m => typeof m.value === 'number' && (m.value > 0x7FFFFFFF || m.value < -0x80000000))
      this.p.put('export', ' ', 'enum', ' ', declaration.name, ...(needsLong ? [':', ' ', 'long', ' '] : [' ']), '{')
      this.p.inc().newline()
      declaration.members.forEach((member, i) => {
        if (i > 0) {
          this.p.put(',')
          this.p.newline()
        }
        this.p.put(member.name)
        if (member.value !== undefined) {
          const val = typeof member.value === 'number' ? member.value.toString() : `"${member.value}"`
          this.p.put(' ', '=', ' ', val)
        }
      })
      this.p.dec().newline()
      this.p.put('}')
      return
    }
    if (declaration.kind === lw.LWKind.FunctionDeclaration && declaration.name === std.names.members.staticCtor) {
      this.p.put('static', ' ')
      if (declaration.body) {
        this.printStatement(declaration.body)
      }
      return
    }
    return super.printDeclaration(declaration)
  }
}

export function processNPrintArkTS(tree: lw.LWDeclaration, localPackage: string, packages: Set<string>) {
  tree = new ConvertArkTSTypes(localPackage, packages).goDeclaration(tree)

  const printer = new ArkTSPrinter()
  printer.printDeclaration(tree)
  return printer.render()
}
