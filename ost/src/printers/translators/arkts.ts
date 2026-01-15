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

import * as lw from "../../lws"
import { std } from "../../stdlib";
import { T } from "../../builder";
import { ConvertTSTypes, TSPrinter } from "./typescript";

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
      case std.names.types.string: return T.c('String')
      case std.names.types.vector: return T.c('FixedArray', ...type.args.map(e => this.goType(e)))
    }
    return super.goValueType(type)
  }
}

export class ArkTSPrinter extends TSPrinter {
  printDeclaration(declaration: lw.LWDeclaration): void {
    if (declaration.kind === lw.LWKind.FunctionDeclaration && declaration.name === std.names.members.staticCtor) {
      this.p.put('static', ' ')
      if (declaration.body) {
        this.printStatement(declaration.body)
      }
      return
    }
    return super.printDeclaration(declaration)
  }
  printExpression(expression: lw.LWExpression): void {
    if (expression.kind === lw.LWKind.ConstructorExpression) {
      if ("type" in expression.data) {
        if (expression.data.type.kind === lw.LWKind.ValueType) {
          if (expression.data.type.name === 'FixedArray') {
            this.p.put('new', ' ')
            this.printType(expression.data.type.args[0])
            this.p.put('[')
            this.printExpression(expression.args[0])
            this.p.put(']')
            return
          }
        }
      }
    }
    return super.printExpression(expression)
  }
}

export function processNPrintArkTS(tree: lw.LWDeclaration, localPackage: string, packages: Set<string>) {
  tree = new ConvertArkTSTypes(localPackage, packages).goDeclaration(tree)

  const printer = new ArkTSPrinter()
  printer.printDeclaration(tree)
  return printer.render()
}
