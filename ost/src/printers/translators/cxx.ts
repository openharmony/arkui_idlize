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

import { IndentPrinter } from "../indent.js";
import * as lw from "../../lws.js"
import { Op, std } from "../../stdlib.js";
import { S, T, utils } from "../../builders/index.js";

const varMapping = new Map([
  [std.names.vars.base, 'base'],
  [std.names.vars.null, 'nullptr'],
  [std.names.vars.undef, 'nullptr'],
  [std.names.vars.print, 'printf'],
  [std.names.vars.self, 'this'],
])

export class CXXPrinter {
  private readonly p = new IndentPrinter()
  private readonly parent: string[] = []

  printDirectType(type: lw.LWType, name: string) {
    switch (type.kind) {
      case lw.LWKind.ValueType: {
        /* std specification */
        // todo
        this.printAbstractType(type)
        this.p.put(' ', name)
        break
      }
      case lw.LWKind.FunctionalType: {
        this.printAbstractType(type.returnType)
        this.p.put(' ', '(', '*', name, ')', '(')
        type.params.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printAbstractType(param.type)
        })
        this.p.put(')')
        break
      }
    }
  }
  printAbstractType(type: lw.LWType) {
    switch (type.kind) {
      case lw.LWKind.HoleType: {
        this.p.put('/*', ' ', 'TYPE HOLE', ' ', '*/')
        break
      }
      case lw.LWKind.ValueType: {
        // stdlib specification
        switch (type.name) {
          case std.names.types.pointer: {
            this.printAbstractType(type.args[0])
            this.p.put('*')
            return
          }
          case std.names.types.reference: {
            this.printAbstractType(type.args[0])
            this.p.put('&')
            return
          }
          case std.names.types.constant: {
            this.p.put('const', ' ')
            this.printAbstractType(type.args[0])
            return
          }
          case std.names.types.struct: {
            this.p.put('struct', ' ')
            this.printAbstractType(type.args[0])
            return
          }
        }

        this.p.put(type.name)
        if (type.args.length) {
          this.p.put('<')
          type.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printAbstractType(arg)
          })
          this.p.put('>')
        }
        break
      }
      case lw.LWKind.FunctionalType: {
        this.printAbstractType(type.returnType)
        this.p.put(' ', '(', '*', ')', '(')
        type.params.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printAbstractType(param.type)
        })
        this.p.put(')')
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
        if (!expression.op.startsWith('_')) {
          const op =
            expression.op === Op.ref ? "&"
              : expression.op === Op.deref ? "*"
                : expression.op
          this.p.put(op)
        }
        this.printExpression(expression.expression)
        if (expression.op.startsWith('_')) {
          this.p.put(expression.op.substring(1))
        }
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
          if (utils.hasHint(expression, std.names.hints.staticMethod) || utils.hasHint(expression.base, std.names.hints.isType) || expression.base.kind === lw.LWKind.TypeExpression) {
            this.p.put('::')
          } else if (utils.hasHint(expression.base, std.names.hints.ptrVal)) {
            this.p.put('->')
          } else {
            this.p.put('.')
          }
          this.p.put(expression.accessor)
        } else {
          this.p.put('[')
          this.printExpression(expression.accessor)
          this.p.put(']')
        }
        break
      }
      case lw.LWKind.CallExpression: {
        if (
          expression.callee.kind === lw.LWKind.VariableExpression
          && expression.callee.name === std.names.vars.print
        ) {
          this.p.put('printf', '(', '"%d\\n"')
          expression.args.forEach(arg => {
            this.p.put(',', ' ')
            this.printExpression(arg)
          })
          this.p.put(')')
          return
        }
        this.printExpression(expression.callee)
        if (utils.hasHint(expression, std.names.hints.macroCall)) {
          this.p.put('(')
          expression.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printExpression(arg)
          })
          expression.typeArgs?.forEach(type => {
            this.p.put(',', ' ')
            this.printAbstractType(type)
          })
          this.p.put(')')
          return
        }
        if (expression.typeArgs && expression.typeArgs.length > 0) {
          this.p.put('<')
          expression.typeArgs.forEach((type, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printAbstractType(type)
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
        if (utils.hasHint(expression, std.names.hints.asStruct)) {
          if ('name' in expression.data) {
            this.p.put('(', expression.data.name, ')')
          } else {
            this.p.put('(')
            this.printAbstractType(expression.data.type)
            this.p.put(')')
          }
          this.p.put('{')
          expression.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printExpression(arg)
          })
          this.p.put('}')
          return
        }
        this.p.put('new', ' ',)
        if ('name' in expression.data) {
          this.p.put(expression.data.name)
          if (expression.data.typeArgs && expression.data.typeArgs.length > 0) {
            this.p.put('<')
            expression.data.typeArgs.forEach((type, i) => {
              if (i > 0) {
                this.p.put(',', ' ')
              }
              this.printAbstractType(type)
            })
            this.p.put('>')
          }
        } else {
          this.printAbstractType(expression.data.type)
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
      case lw.LWKind.CheckCastExpression: {
        const cast = utils.hasHint(expression, std.names.hints.staticMethod)
          ? 'static_cast' : 'reinterpret_cast'
        this.p.put(cast, '<')
        this.printAbstractType(expression.type)
        this.p.put('>', '(',)
        this.printExpression(expression.expression)
        this.p.put(')')
        break
      }
      case lw.LWKind.LambdaExpression: {
        if (expression.closure) {
          this.p.put('[')
          expression.closure.forEach((name, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.p.put(name)
          })
          this.p.put(']')
        }
        this.p.put('(')
        expression.parameters.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printDirectType(param.type, param.name)
        })
        this.p.put(')', ' ')
        const body = expression.body.kind === lw.LWKind.CompoundStatement
          ? expression.body
          : S.block([expression.body])
        this.printStatement(body)
        break
      }
      case lw.LWKind.TypeExpression: {
        this.printAbstractType(expression.type)
        break
      }
    }
  }
  printStatement(statement: lw.LWStatement, semicolon: boolean = true) {
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
        if (semicolon) this.p.put(';')
        break
      }
      case lw.LWKind.DeclarationStatement: {
        if (statement.static)
          this.p.put('static', ' ')
        if (!statement.mutable)
          this.p.put('const', ' ')
        this.printDirectType(statement.varType, statement.varName)
        if (statement.expression) {
          if (statement.expression.kind === lw.LWKind.ConstructorExpression) {
            let closer: string | undefined
            if (utils.hasHint(statement.expression, std.names.hints.asStruct)) {
              this.p.put(' ', '=', ' ', '{')
              closer = '}'
            } else if (utils.hasHint(statement.expression, std.names.hints.stackInstance)) {
              this.p.put(' ', '=', ' ')
              this.printAbstractType(statement.varType)
              this.p.put('(')
              closer = ')'
            } else if (utils.hasHint(statement.expression, std.names.hints.arrayInstance)) {
              this.p.put('[')
              closer = ']'
            }
            if (closer) {
              statement.expression.args.forEach((arg, i) => {
                if (i > 0) {
                  this.p.put(',', ' ')
                }
                this.printExpression(arg)
              })
              this.p.put(closer, ';')
              break
            }
          }
          this.p.put(' ', '=', ' ')
          this.printExpression(statement.expression)
        }
        this.p.put(';')
        break
      }
      case lw.LWKind.IfStatement: {
        this.p.put('if', ' ', '(')
        this.printExpression(statement.condition)
        this.p.put(')', ' ')
        this.printStatement(statement.thenBody)
        if (statement.elseBody) {
          this.p.put(' ', 'else', ' ')
          this.printStatement(statement.elseBody)
        }
        break
      }
      case lw.LWKind.SwitchStatement:
        this.p.put('switch', ' ', '(')
        this.printExpression(statement.selector)
        this.p.put(')', ' ', '{').inc()
        statement.cases.forEach(({value, body}) => {
          const values = Array.isArray(value) ? value : [value]
          values.forEach(v => {
            this.p.newline()
            this.p.put('case', ' ')
            this.printExpression(v)
            this.p.put(':')
          })
          this.p.inc()
          body.forEach(stmt => {
            this.p.newline()
            this.printStatement(stmt)
          })
          this.p.dec()
        })
        if (statement.default && statement.default.length) {
          this.p.newline()
          this.p.put('default', ':')
          this.p.inc()
          statement.default.forEach(stmt => {
            this.p.newline()
            this.printStatement(stmt)
          })
          this.p.dec()
        }
        this.p.dec().newline()
        this.p.put('}')
        break;
      case lw.LWKind.BreakStatement: {
        this.p.put('break', ';')
        break
      }
      case lw.LWKind.LoopStatement: {
        this.p.put('for', ' ', '(')
        if (statement.init)
          this.printStatement(statement.init)
        this.p.put(' ')
        this.printExpression(statement.condition)
        this.p.put(';', ' ')
        if (statement.step)
          this.printStatement(statement.step, false)
        this.p.put(')', ' ')
        this.printStatement(statement.body)
        break
      }
    }
  }

  private printField(name: string, type: lw.LWType) {
    if (type.kind === lw.LWKind.ValueType && type.name === std.names.types.union) {
        this.p.put('union', ' ', '{').inc().newline()
        type.args.forEach((arg, i) => {
          this.printDirectType(arg, 'value' + i)
          this.p.put(';').newline()
        })
        this.p.dec().put('}')
    } else {
      this.printDirectType(type, name)
    }
    this.p.put(';')
  }
  private maybePrintGenerics(generics: lw.GenericDescriptor[]): boolean {
    if (generics.length > 0) {
      this.p.put('template', ' ', '<')
      generics.forEach((g, i) => {
        if (i > 0) {
          this.p.put(',', ' ')
        }
        this.p.put('typename', ' ', g.name)
      })
      this.p.put('>')
      this.p.newline()
      return true
    }
    return false
  }
  printDeclaration(declaration: lw.LWDeclaration) {
    switch (declaration.kind) {
      case lw.LWKind.EnumDeclaration:
        this.p.put('typedef', ' ', 'enum', ' ', declaration.name, ' ', '{')
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
        this.p.put('}', ' ', declaration.name, ';')
        break
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
        this.p.put('}', ';')
        break
      }
      case lw.LWKind.ClassDeclaration: {
        this.maybePrintGenerics(declaration.generics)
        this.p.put('class', ' ', declaration.name)
        this.p.put(' ')
        if (declaration.oop !== undefined) {
          const bases = [declaration.oop.base].concat(declaration.oop.implementations)
            .filter(x => x !== undefined)

          if (bases.length > 0) {
            this.p.put(':', ' ')
            bases.forEach((type, i) => {
              if (i > 0) {
                this.p.put(',', ' ')
              }
              this.printAbstractType(type as lw.LWType)
            })
          }
        }
        this.p.put('{')
        this.p.newline()
        this.p.put('public', ':')
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
        this.p.put('}', ';')
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
        this.p.put('}', ';')
        break
      }
      case lw.LWKind.TypedefDeclaration: {
        this.p.put('typedef', ' ')
        this.printDirectType(declaration.type, declaration.name)
        this.p.put(';')
        break
      }
      case lw.LWKind.FunctionDeclaration: {
        this.maybePrintGenerics(declaration.generics)
        declaration.modifiers.forEach(mod => {
          switch (mod.name) {
            case 'externC': { this.p.put('extern', ' ', '"', 'C', '"'); break }
            case 'static': { this.p.put('static'); break }
            default: { this.p.put(mod.name); break }
          }
          this.p.put(' ')
        })
        const isCtor = std.names.members.ctor === declaration.name
        if (isCtor) {
          this.p.put(this.parent.at(-1)!)
        } else {
          this.printAbstractType(declaration.returnType)
          this.p.put(' ', declaration.name)
        }
        this.p.put('(')
        declaration.parameters.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.printDirectType(param.type, param.name)
        })
        this.p.put(')')
        if (declaration.body && declaration.body.kind !== lw.LWKind.NoneStatement) {
          this.p.put(' ')
          this.printStatement(declaration.body)
        } else {
          this.p.put(';')
        }
        declaration.annotations.forEach(ann => {
          if (ann.kind === lw.DecoratorKind.MacroInvocation) {
            this.p.newline()
            this.p.put(ann.name, '(')
            ann.args.forEach((arg, i) => {
              if (i > 0) {
                this.p.put(',', ' ')
              }
              if (typeof arg === 'string')
                this.p.put(arg)
              else if (arg.kind === lw.LWKind.ValueType || arg.kind === lw.LWKind.FunctionalType || arg.kind === lw.LWKind.HoleType)
                this.printAbstractType(arg)
              else
                this.printExpression(arg)
            })
            this.p.put(')')
          }
        })
        break
      }
      case lw.LWKind.TopLevelExpression: {
        this.printExpression(declaration.expression)
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

export function processNPrintCXX(decls: lw.LWDeclaration[]) {
  return decls.map(it => {
    const printer = new CXXPrinter()
    printer.printDeclaration(it)
    return printer.render()
  })
    .join('\n')
}
