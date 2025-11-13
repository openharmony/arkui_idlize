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

import { IndentPrinter } from "../indent";
import * as lw from "../../lws"
import { std } from "../../stdlib";
import { IdentityTransformer } from "../../visitors/identity";
import { T } from "../../builder";

const varMapping = new Map([
  [std.names.vars.base, '/* not supported */'],
  [std.names.vars.null, '/* not supported */'],
  [std.names.vars.undef, '/* not supported */'],
  [std.names.vars.print, 'print'],
  [std.names.vars.self, 'this'],
])

export class ConvertCJTypes extends IdentityTransformer {
  goValueType(type: lw.ValueType): lw.ValueType {
    switch (type.name) {
      case std.names.types.i32: return T.c('Int32')
      case std.names.types.string: return T.c('String')
      case std.names.types.void: return T.c('Unit')
    }
    return type
  }
}

export class CangjiePrinter {

  private readonly p = new IndentPrinter()
  printType(type: lw.LWType) {
    switch (type.kind) {
      case lw.LWKind.FunctionalType: {
        this.p.put('(')
        type.params.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.p.put(param.name)
          this.p.put(':')
          this.printType(param.type)
        })
        this.p.put(')', ' ', '->', ' ')
        this.printType(type.returnType)
        break
      }
      case lw.LWKind.ValueType: {
        // stdlib specification
        switch (type.name) {
          case std.names.types.pointer: { this.printType(type.args[0]); return }
          case std.names.types.reference: { this.printType(type.args[0]); return }
          case std.names.types.constant: { this.printType(type.args[0]); return }
        }

        this.p.put(type.name)
        if (type.args.length) {
          this.p.put('<')
          type.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printType(arg)
          })
          this.p.put('>')
        }
        break
      }
    }
  }

  printExpression(expression: lw.LWExpression) {
    switch (expression.kind) {
      case lw.LWKind.ConstantExpression: {
        this.p.put(expression.value)
        break
      }
      case lw.LWKind.VariableExpression: {
        /* stdlib specification */
        if (varMapping.has(expression.name)) {
          this.p.put(varMapping.get(expression.name)!)
        } else {
          this.p.put(expression.name)
        }
        break
      }
      case lw.LWKind.StringExpression: {
        this.p.put('"', expression.value, '"')
        break
      }
      case lw.LWKind.UnaryExpression: {
        this.p.put(expression.op)
        this.printExpression(expression.expression)
        break
      }
      case lw.LWKind.BinaryExpression: {
        this.printExpression(expression.left)
        this.p.put(' ', expression.op, ' ')
        this.printExpression(expression.right)
        break
      }
      case lw.LWKind.AccessorExpression: {
        this.printExpression(expression.base)
        if (typeof expression.accessor === 'string') {
          this.p.put('.', expression.accessor)
        } else {
          this.p.put('[')
          this.printExpression(expression.accessor)
          this.p.put(']')
        }
        break
      }
      case lw.LWKind.CallExpression: {
        this.printExpression(expression.callee)
        if (expression.typeArgs && expression.typeArgs.length > 0) {
          this.p.put('<')
          expression.typeArgs.forEach((type, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printType(type)
          })
          this.p.put('>')
        }
        this.p.put('(')
        expression.args.forEach((arg, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printExpression(arg)
        })
        this.p.put(')')
        break
      }
      case lw.LWKind.ConstructorExpression: {
        this.p.put(expression.name)
        if (expression.typeArgs && expression.typeArgs.length > 0) {
          this.p.put('<')
          expression.typeArgs.forEach((type, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printType(type)
          })
          this.p.put('>')
        }
        this.p.put('(')
        expression.args.forEach((arg, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printExpression(arg)
        })
        this.p.put(')')
      }
    }
  }
  printStatement(statement: lw.LWStatement) {
    switch (statement.kind) {
      case lw.LWKind.CompoundStatement: {
        this.p.put('{')
        this.p.inc().newline()
        statement.statements.forEach((stmt, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.printStatement(stmt)
        })
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.ReturnStatement: {
        this.p.put('return')
        if (statement.expression) {
          this.p.put(' ')
          this.printExpression(statement.expression)
        }
        break
      }
      case lw.LWKind.ExpressionStatement: {
        if (statement.expression) {
          this.printExpression(statement.expression)
        }
        break
      }
      case lw.LWKind.DeclarationStatement: {
        let specifier = 'let'
        if (statement.mutable) {
          specifier = 'var'
        }
        this.p.put(specifier, ' ', statement.varName, ':')
        this.printType(statement.varType)
        if (statement.expression) {
          this.p.put(' ', '=', ' ')
          this.printExpression(statement.expression)
        }
        break
      }
      case lw.LWKind.IfStatement: {
        this.p.put('if', '(')
        this.printExpression(statement.condition)
        this.p.put(')', ' ')
        this.printStatement(statement.thenBody)
        if (statement.elseBody) {
          this.p.put(' ', 'else', ' ')
          this.printStatement(statement.elseBody)
        }
        break
      }
      case lw.LWKind.LoopStatement: {
        this.p.put('while', '(')
        this.printExpression(statement.condition)
        this.p.put(')', ' ')
        this.printStatement(statement.body)
        break
      }
    }
  }

  private printField(name: string, type: lw.LWType) {
    this.p.put('var', ' ')
    this.p.put(name)
    this.p.put(':')
    this.printType(type)
  }
  private printGeneric(generic: lw.GenericDescriptor) {
    this.p.put(generic.name)
  }
  private printGenerics(generics: lw.GenericDescriptor[]) {
    if (generics.length > 0) {
      this.p.put('<')
      generics.forEach((gen, i) => {
        if (i > 0) {
          this.p.put(',', ' ')
        }
        this.printGeneric(gen)
      })
      this.p.put('>')
    }
  }
  printDeclaration(declaration: lw.LWDeclaration) {
    switch (declaration.kind) {
      case lw.LWKind.StructureDeclaration: {
        this.p.put('struct', ' ', declaration.name, ' ', ' {')
        this.p.inc().newline()
        this.p.put('public', ' ', declaration.name, '(')
        this.p.inc()
        declaration.members.forEach((mem, i) => {
          if (i > 0) {
            this.p.put(',')
          }
          this.p.newline()
          this.p.put('var', ' ')
          this.p.put(mem.name)
          this.p.put(':')
          this.printType(mem.type)
        })
        this.p.dec().newline()
        this.p.put(')', ' ', '{', '}')
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.ClassDeclaration: {
        this.p.put('class', ' ', declaration.name)
        this.printGenerics(declaration.generics)
        this.p.put(' ')
        if (declaration.oop !== undefined) {
          const bases = [declaration.oop.base].concat(declaration.oop.implementations)
            .filter(x => x !== undefined)

          if (bases.length > 0) {
            this.p.put('<:', ' ')
            bases.forEach((type, i) => {
              if (i > 0) {
                this.p.put(' ', '&', ' ')
              }
              this.printType(type as lw.LWType)
            })
          }
        }
        this.p.put('{')
        this.p.inc()
        declaration.fields.forEach((field) => {
          this.p.newline()
          this.printField(field.name, field.type)
        })
        declaration.methods.forEach((method) => {
          this.p.newline()
          this.printDeclaration(method)
        })
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.NamespaceDeclaration: {
        this.p.put(`/* omitted namespace "${declaration.name}" */`)
        this.p.newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.printDeclaration(member)
        })
        this.p.newline()
        this.p.put(`/* end of namespace "${declaration.name}" */`)
        break
      }
      case lw.LWKind.TypedefDeclaration: {
        this.p.put('type', ' ', declaration.name)
        this.p.put(' ', '=', ' ')
        this.printType(declaration.type)
        break
      }
      case lw.LWKind.FunctionDeclaration: {
        declaration.modifiers.forEach(mod => {
          switch (mod.name) {
            case 'static': { this.p.put('static'); break }
          }
          this.p.put(' ')
        })
        const isCtor = std.names.members.ctor === declaration.name
        if (isCtor) {
          this.p.put('public', ' ', 'init', '(')
        } else {
          this.p.put('public', ' ', 'func', ' ', declaration.name)
          this.printGenerics(declaration.generics)
          this.p.put('(')
        }
        declaration.parameters.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.p.put(param.name)
          this.p.put(':')
          this.printType(param.type)
        })
        this.p.put(')')
        if (!isCtor) {
          this.p.put(':')
          this.printType(declaration.returnType)
        }
        this.p.put(' ')
        this.printStatement(declaration.body!)
        break
      }
    }
  }

  printProgramChunk() {
    /// does nothing for now
  }

  render(): string {
    return this.p.render()
  }
}

export function processNPrintCJ(chunk: lw.LWDeclaration) {
  let tree = chunk

  tree = new ConvertCJTypes().goDeclaration(tree)

  const printer = new CangjiePrinter()
  printer.printDeclaration(tree)
  return printer.render()
}
