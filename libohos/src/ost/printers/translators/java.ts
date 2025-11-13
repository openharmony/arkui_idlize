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
  [std.names.vars.base, 'base'],
  [std.names.vars.null, 'nullptr'],
  [std.names.vars.undef, 'nullptr'],
  [std.names.vars.print, 'System.out.println'],
  [std.names.vars.self, 'this'],
])

export class ConvertJavaTypes extends IdentityTransformer {
  goConstType(type: lw.ValueType): lw.ValueType {
    switch (type.name) {
      case std.names.types.i32: return T.c('int')
      case std.names.types.string: return T.c('String')
      case std.names.types.void: return T.c('void')
    }
    return type
  }
}

export class JavaPrinter {
  private readonly p = new IndentPrinter()
  private readonly parent: string[] = []

  printType(type: lw.LWType) {
    switch (type.kind) {
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
      case lw.LWKind.FunctionalType: {
        this.p.put('/* not supported */')
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
        if (!statement.mutable) {
          this.p.put('final', ' ')
        }
        this.printType(statement.varType)
        this.p.put(' ')
        this.p.put(statement.varName)
        if (statement.expression) {
          this.p.put(' ', '=', ' ')
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
    this.p.put('public', ' ')
    this.printType(type)
    this.p.put(' ', name)
    this.p.put(';')
  }
  private maybePrintGenerics(generics: lw.GenericDescriptor[]): boolean {
    if (generics.length > 0) {
      this.p.put('<')
      generics.forEach((g, i) => {
        if (i > 0) {
          this.p.put(',', ' ')
        }
        this.p.put(g.name)
      })
      this.p.put('>')
      return true
    }
    return false
  }
  printDeclaration(declaration: lw.LWDeclaration) {
    switch (declaration.kind) {
      case lw.LWKind.StructureDeclaration: {
        this.p.put('class', ' ', declaration.name, ' ', '{')
        this.p.inc().newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.printField(member.name, member.type)
        })
        this.p.newline()
        // structure constructor
        this.p.put('public', ' ', declaration.name, '(')
        this.p.inc().newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.put(',').newline()
          }
          this.printType(member.type)
          this.p.put(' ', member.name)
        })
        this.p.dec().newline()
        this.p.put(')', ' ', '{')
        this.p.inc().newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.p.put('this', '.', member.name, ' ', '=', ' ', member.name, ';')
        })
        this.p.dec().newline()
        this.p.put('}')
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.ClassDeclaration: {
        const specifier = declaration.oop?.kind === 'interface'
          ? 'interface'
          : 'class'
        this.p.put(specifier, ' ', declaration.name)
        this.maybePrintGenerics(declaration.generics)
        this.p.put(' ')
        if (declaration.oop !== undefined) {
          if (declaration.oop.base) {
            this.p.put('extends', ' ')
            this.printType(declaration.oop.base)
          }
          if (declaration.oop.implementations && declaration.oop.implementations.length > 0) {
            this.p.put('implements', ' ')
            declaration.oop.implementations.forEach((iface, i) => {
              if (i > 0) {
                this.p.put(',', ' ')
              }
              this.printType(iface)
            })
          }
        }
        this.p.put('{')
        this.p.inc()
        declaration.fields.forEach(field => {
          this.p.newline()
          this.printField(field.name, field.type)
        })
        this.parent.push(declaration.name)
        declaration.methods.forEach(method => {
          this.p.newline()
          this.printDeclaration(method)
        })
        this.parent.pop()
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.NamespaceDeclaration: {
        this.p.put('class', ' ', declaration.name, ' ', '{')
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
        this.p.put('/* typedef: not supported declaration */')
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
          this.p.put(this.parent.at(-1)!)
        } else {
          if (this.maybePrintGenerics(declaration.generics)) {
            this.p.put(' ')
          }
          this.printType(declaration.returnType)
          this.p.put(' ', declaration.name)
        }
        this.p.put('(')
        declaration.parameters.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printType(param.type)
          this.p.put(' ', param.name)
        })
        this.p.put(')')
        if (declaration.body) {
          this.p.put(' ')
          this.printStatement(declaration.body)
        } else {
          this.p.put(';')
        }
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

export function processNPrintJava(chunk: lw.LWDeclaration) {
  let tree = chunk

  tree = new ConvertJavaTypes().goDeclaration(tree)

  const printer = new JavaPrinter()
  printer.printDeclaration(tree)
  return printer.render()
}
