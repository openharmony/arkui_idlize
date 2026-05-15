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
  printExpression(expression: lw.LWExpression): void {
    switch (expression.kind) {
      case lw.LWKind.CallExpression: {
        if (expression.callee.kind == lw.LWKind.AccessorExpression) {
          if (expression.callee.accessor == "@Enum.fromOrdinal") {
            this.printExpression(expression.callee.base)
            this.p.put('.').put('fromValue').put('(')
            this.printExpression(expression.args[0])
            this.p.put(')')
            break
          } else if (expression.callee.accessor == "@Enum.toOrdinal") {
            this.printExpression(expression.callee.base)
            this.p.put('.').put('valueOf').put('(').put(')')
            break
          } else if (expression.callee.accessor == "@StringEnum.toOrdinal") {
            this.printExpression(expression.callee.base)
            this.p.put('.').put('getOrdinal').put('(').put(')')
            break
          }
        }
      }
      default: super.printExpression(expression)
    }
  }
  printDeclaration(declaration: lw.LWDeclaration): void {
    if (declaration.kind === lw.LWKind.FunctionDeclaration) {
      declaration.annotations.forEach(ann => {
        if (ann.kind === lw.DecoratorKind.SimpleAnnotation) {
          this.p.put('@', ann.name)
          this.p.newline()
        }
      })
      if (declaration.name === std.names.members.staticCtor) {
        this.p.put('static', ' ')
        if (declaration.body) {
          this.printStatement(declaration.body)
        }
        return
      }
      if (this.isNative(declaration)) {
        declaration.modifiers.forEach(mod => this.p.put(mod.name, ' '))
        this.p.put(declaration.name)
        this.printParameters(declaration.parameters)
        this.p.put(':', ' ')
        this.printType(declaration.returnType)
        return
      }
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
