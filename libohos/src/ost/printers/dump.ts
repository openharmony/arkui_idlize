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

import { IndentPrinter } from "./indent";
import * as lw from "../lws"

export class DumpPrinter {
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
        this.p.put(')', ' ', '=>', ' ')
        this.printType(type.returnType)
        break
      }
      case lw.LWKind.ValueType: {
        // stdlib specification
        // TODO

        this.p.put(type.name)
        if (type.args.length) {
          this.p.put('(')
          type.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printType(arg)
          })
          this.p.put(')')
        }
        break
      }
    }
  }

  private maybePrintHints(expr: lw.LWExpression, wrap: boolean) {
    if (expr.hints.length > 0) {
      this.p.put('[')
      expr.hints.forEach((hint, i) => {
        if (i > 0) {
          this.p.put(',', ' ')
        }
        this.p.put(hint.name)
        if (hint.value) {
          this.p.put('(', hint.value, ')')
        }
      })
      this.p.put(']')
      if (wrap) {
        this.p.newline()
      } else {
        this.p.put(' ')
      }
    }
  }
  printExpression(expression: lw.LWExpression) {
    this.maybePrintHints(
      expression,
      [
        lw.LWKind.BinaryExpression,
      ].includes(expression.kind)
    )
    switch (expression.kind) {
      case lw.LWKind.ConstantExpression: {
        this.p.put(expression.value)
        break
      }
      case lw.LWKind.VariableExpression: {
        this.p.put(expression.name)
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
        this.p.put('(', expression.op)
        this.p.inc().newline()
        this.printExpression(expression.left)
        this.p.newline()
        this.printExpression(expression.right)
        this.p.dec().newline()
        this.p.put(')')
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
        this.p.put('new', ' ', expression.name)
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
        this.p.put(';')
        break
      }
      case lw.LWKind.ExpressionStatement: {
        if (statement.expression) {
          this.printExpression(statement.expression)
        }
        this.p.put(';')
        break
      }
      case lw.LWKind.DeclarationStatement: {
        let specifier = statement.mutable
          ? 'mutable'
          : 'immutable'
        this.p.put(specifier, ' ', statement.varName, ':')
        this.printType(statement.varType)
        if (statement.expression) {
          this.p.put(' ', '<-', ' ')
          this.printExpression(statement.expression)
        }
        this.p.put(';')
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
    this.p.put(name)
    this.p.put(':')
    this.printType(type)
  }
  private maybePrintGenerics(decl: lw.LWDeclaration) {
    if (decl.kind === lw.LWKind.NamespaceDeclaration) {
      return
    }
    if (decl.generics.length > 0) {
      this.p.put('generic', ' ', '<')
      decl.generics.forEach((gen, i) => {
        if (i > 0) {
          this.p.put(',', ' ')
        }
        this.p.put(gen.name)
      })
      this.p.put('>')
      this.p.newline()
    }
  }
  printDeclaration(declaration: lw.LWDeclaration) {
    this.maybePrintGenerics(declaration)
    switch (declaration.kind) {
      case lw.LWKind.StructureDeclaration: {
        this.p.put('struct', ' ', declaration.name, ' ', '{')
        this.p.inc().newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.printField(member.name, member.type)
        })
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.ClassDeclaration: {
        this.p.put('class', ' ', declaration.name, ' ', '{')
        this.p.inc()
        declaration.fields.forEach((field, i) => {
          this.p.newline()
          this.printField(field.name, field.type)
        })
        declaration.methods.forEach((method, i) => {
          this.p.newline()
          this.printDeclaration(method)
        })
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.NamespaceDeclaration: {
        this.p.put('namespace', ' ', declaration.name, ' ', '{')
        this.p.inc().newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.printDeclaration(member)
        })
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.TypedefDeclaration: {
        this.p.put('typedef', ' ', declaration.name)
        this.p.put(' ', '=', ' ')
        this.printType(declaration.type)
        break
      }
      case lw.LWKind.FunctionDeclaration: {
        this.p.put('fn', ' ', declaration.name)
        this.p.put('(')
        declaration.parameters.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.p.put(param.name)
          this.p.put(':')
          this.printType(param.type)
        })
        this.p.put(')')
        this.p.put(':', ' ')
        this.printType(declaration.returnType)
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

export function dumpToString(chunk: lw.LWDeclaration) {
  const printer = new DumpPrinter()
  printer.printDeclaration(chunk)
  return printer.render()
}
