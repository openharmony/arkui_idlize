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
import { std } from "../../stdlib.js";
import { IdentityTransformer } from "../../visitors/identity.js";
import { T, utils } from "../../builders/index.js";

const varMapping = new Map([
  [std.names.vars.base, 'super'],
  [std.names.vars.null, 'null'],
  [std.names.vars.undef, 'undefined'],
  [std.names.vars.print, 'console.log'],
  [std.names.vars.self, 'this'],
])

export class ConvertTSTypes extends IdentityTransformer {
  private nameStack: string[]

  constructor(
    private readonly localPackage: string,
    private readonly packages: Set<string>
  ) {
    super()
    this.nameStack = [localPackage]
  }

  override goValueType(type: lw.ValueType): lw.ValueType {
    switch (type.name) {
      case std.names.types.bigint: return T.c('bigint')
      case std.names.types.boolean: return T.c('boolean')
      case std.names.types.buffer: return T.c('ArrayBuffer')
      case std.names.types.pointer: return T.c('bigint')
      case std.names.types.f32: return T.c('float32')
      case std.names.types.f64: return T.c('float64')
      case std.names.types.i8: return T.c('int8')
      case std.names.types.i32: return T.c('int32')
      case std.names.types.i64: return T.c('int64')
      case std.names.types.object: return T.c('object')
      case std.names.types.nativePointer: return T.c('bigint')
      case std.names.types.number:
      case std.names.types.interopNumber: return T.c('number')
      case std.names.types.interopReturnBuffer: return T.c('KInteropReturnBuffer')
      case std.names.types.serializerBuffer: return T.c('KSerializerBuffer')
      case std.names.types.string:
      case std.names.types.interopString: return T.c('string')
      case std.names.types.u8: return T.c('uint8')
      case std.names.types.u32: return T.c('uint32')
      case std.names.types.u64: return T.c('uint64')
      case std.names.types.undefined: return T.c('undefined')
      case std.names.types.void: return T.c('void')
      case std.names.types.self: return T.c('this')
    }
    if (type.args.length > 0) {
      type = super.goValueType(type) as lw.ValueType
      switch (type.name) {
        case std.names.types.array:
        case std.names.types.map:
        case std.names.types.vector:
        case std.names.types.promise:
          return T.c(this.convertSpecialName(type.name), ...type.args)
      }
    }
    // strip local package from type name
    const localPrefix = this.nameStack.map(it => it + '.').join('')
    if (type.name.startsWith(localPrefix))
      return T.c(type.name.substring(localPrefix.length))
    return type
  }
  override goConstructorExpression(expr: lw.ConstructorExpression): lw.ConstructorExpression {
    const ret = super.goConstructorExpression(expr)
    if ("name" in ret.data) {
      ret.data.name = this.convertSpecialName(ret.data.name)
    }
    return ret
  }
  override goNamespaceDeclaration(decl: lw.NamespaceDeclaration): lw.NamespaceDeclaration {
    this.nameStack.push(decl.name)
    const ret = super.goNamespaceDeclaration(decl)
    this.nameStack.pop()
    return ret
  }
  private convertSpecialName(name: string): string {
    switch (name) {
      case std.names.types.vector: return 'Array'
      case std.names.types.array: return 'Array'
      case std.names.types.map: return 'Map'
      case std.names.types.promise: return 'Promise'
    }
    return name
  }
}

const knownBinOperators: string[][] = [
  ['='],
  ['||'],
  ['&&'],
  ['|'],
  ['^'],
  ['&'],
  ['=='],
  ['<', '<=', '>', '>='],
  ['>>', '<<'],
  ['+','-'],
  ['*', '/'],
]

export class TSPrinter {
  protected readonly p = new IndentPrinter()
  protected readonly scope: ('global' | 'member')[] = ['global']

  printType(type: lw.LWType) {
    switch (type.kind) {
      case lw.LWKind.FunctionalType: {
        this.p.put('(')
        type.params.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.p.put(param.name)
          this.p.put(':', ' ')
          this.printType(param.type)
        })
        this.p.put(')', ' ', '=>', ' ')
        this.printType(type.returnType)
        break
      }
      case lw.LWKind.ValueType: {
        // stdlib specification
        switch (type.name) {
          case std.names.types.pointer: { this.printType(type.args[0]); return }
          case std.names.types.reference: { this.printType(type.args[0]); return }
          case std.names.types.constant: { this.printType(type.args[0]); return }
          case std.names.types.optional: {
            this.printType(type.args[0])
            this.p.put(' ', '|', ' ', 'undefined')
            return
          }
          case std.names.types.intersection:
            this.p.put('[')
            type.args.forEach((arg, i) => {
              if (i > 0) this.p.put(',', ' ')
              this.printType(arg)
            })
            this.p.put(']')
            return
          case std.names.types.union:
            type.args.forEach((arg, i) => {
              if (i > 0) this.p.put(' ', '|', ' ')
              this.printType(arg)
            })
            return
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

  private maybeUseParen(cond:boolean, op:() => void) {
    if (cond) {
      this.p.put('(')
    }
    op()
    if (cond) {
      this.p.put(')')
    }
  }

  printExpression(expression: lw.LWExpression) {
    switch (expression.kind) {
      case lw.LWKind.ConstantExpression: {
        this.p.put(expression.value)
        if (utils.hasHint(expression, std.names.hints.excl)) {
          this.p.put('!')
        }
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
        if (!expression.op.startsWith('_'))
          this.p.put(expression.op)
        this.maybeUseParen(
          [lw.LWKind.BinaryExpression, lw.LWKind.UnaryExpression].includes(expression.expression.kind),
          () => this.printExpression(expression.expression)
        )
        if (expression.op.startsWith('_'))
          this.p.put(expression.op.substring(1))
        break
      }
      case lw.LWKind.TypeExpression: {
        this.printType(expression.type)
        break
      }
      case lw.LWKind.BinaryExpression: {
        this.maybeUseParen(
          expression.left.kind === lw.LWKind.BinaryExpression
            && knownBinOperators.findIndex(lvl => lvl.includes((expression.left as lw.BinaryExpression).op)) < knownBinOperators.findIndex(lvl => lvl.includes(expression.op)),
          () => this.printExpression(expression.left)
        )
        this.p.put(' ', expression.op, ' ')
        this.maybeUseParen(
          expression.right.kind === lw.LWKind.BinaryExpression
            && knownBinOperators.findIndex(lvl => lvl.includes((expression.right as lw.BinaryExpression).op)) < knownBinOperators.findIndex(lvl => lvl.includes(expression.op)),
          () => this.printExpression(expression.right)
        )
        break
      }
      case lw.LWKind.AccessorExpression: {
        this.maybeUseParen([lw.LWKind.BinaryExpression, lw.LWKind.UnaryExpression].includes(expression.base.kind), () => this.printExpression(expression.base))
        if (utils.hasHint(expression, std.names.hints.questionMark)) {
          this.p.put('?')
        }
        if (typeof expression.accessor === 'string') {
          this.p.put('.', expression.accessor)
        } else {
          this.p.put('[')
          this.printExpression(expression.accessor)
          this.p.put(']')
        }
        if (utils.hasHint(expression, std.names.hints.excl)) {
          this.p.put('!')
        }
        break
      }
      case lw.LWKind.CallExpression: {
        this.maybeUseParen([lw.LWKind.BinaryExpression, lw.LWKind.UnaryExpression].includes(expression.callee.kind), () => this.printExpression(expression.callee))
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
        if (utils.hasHint(expression, std.names.hints.arrayInstance)) {
          this.p.put('[')
          expression.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            this.printExpression(arg)
          })
          this.p.put(']')
          return
        }
        if (utils.hasHint(expression, std.names.hints.asStruct)) {
          this.p.put('{')
          expression.args.forEach((arg, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            const fieldName = utils.getHint(arg, std.names.hints.named)
            if (!fieldName) {
              throw new Error("Field has no name in ConstructorExpression with `asStruct` hint")
            }
            this.p.put(fieldName, ':')
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
              this.printType(type)
            })
            this.p.put('>')
          }
        } else {
          this.printType(expression.data.type)
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
        const op = expression.op === 'cast' ? 'as' : expression.op
        this.p.put('(')
        this.printExpression(expression.expression)
        this.p.put(' ', op, ' ')
        this.printType(expression.type)
        this.p.put(')')
        break
      }
      case lw.LWKind.LambdaExpression: {
        this.p.put('(')
        expression.parameters.forEach((param, i) => {
          if (i > 0) {
            this.p.put(',', ' ')
          }
          this.p.put(param.name)
        })
        this.p.put(')', ' ', '=>', ' ')
        this.printStatement(expression.body)
        break
      }
      case lw.LWKind.HoleExpression: {
        this.p.put('/*', ' HOLE ', '*/')
        break
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
        const specifier = statement.mutable ? 'let' : 'const'
        this.p.put(specifier, ' ', statement.varName)
        if (statement.varType.kind !== lw.LWKind.ValueType || statement.varType.name !== std.names.types.auto) {
          this.p.put(':', ' ')
          this.printType(statement.varType)
        }
        if (statement.expression) {
          this.p.put(' ', '=', ' ')
          if (statement.expression.kind === lw.LWKind.ConstructorExpression &&
            utils.hasHint(statement.expression, std.names.hints.asStruct)
          ) {
            this.p.put('{')
            statement.expression.args.forEach((arg, i) => {
              if (i > 0) {
                this.p.put(',', ' ')
              }
              this.printExpression(arg)
            })
            this.p.put('}')
          } else {
            this.printExpression(statement.expression)
          }
        }
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
        statement.cases.forEach(({ value, body }) => {
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
        this.p.put('break')
        break
      }
      case lw.LWKind.LoopStatement: {
        this.p.put('for', ' ', '(')
        if (statement.init)
          this.printStatement(statement.init)
        this.p.put(';', ' ')
        this.printExpression(statement.condition)
        this.p.put(';', ' ')
        if (statement.step)
          this.printStatement(statement.step)
        this.p.put(')', ' ')
        this.printStatement(statement.body)
        break
      }
      case lw.LWKind.ThrowStatement: {
        this.p.put('throw', ' ')
        this.printExpression(statement.error)
        break
      }
    }
  }

  private printField(name: string, type: lw.LWType, modifiers?: lw.Modifier[], initializer?: lw.LWExpression) {
    modifiers
      ?.filter(it => it.name !== std.names.modifiers.optional)
      .forEach(it => this.p.put(it.name, ' '))
    this.p.put(name)
    if (modifiers?.map(it => it.name).includes(std.names.modifiers.optional))
      this.p.put('?')
    this.p.put(':', ' ')
    this.printType(type)
    if (initializer) {
      this.p.put(' ', '=', ' ')
      this.printExpression(initializer)
    }
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
      case lw.LWKind.EnumDeclaration: {
        this.p.put('export', ' ', 'enum', ' ', declaration.name, ' ', '{')
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
        break
      }
      case lw.LWKind.StructureDeclaration: {
        this.p.put('export', ' ', 'interface', ' ', declaration.name, ' ', '{')
        this.p.inc().newline()
        declaration.members.forEach((member, i) => {
          if (i > 0) {
            this.p.newline()
          }
          this.printField(member.name, member.type, member.modifiers)
        })
        this.p.dec().newline()
        this.p.put('}')
        break
      }
      case lw.LWKind.ClassDeclaration: {
        const specifier = declaration.oop?.kind === 'interface'
          ? 'interface'
          : 'class'
        this.p.put('export', ' ')
        if (declaration.modifiers.find(m => m.name === std.names.modifiers.declare)) {
          this.p.put('declare', ' ')
        }
        this.p.put(specifier, ' ', declaration.name)
        this.printGenerics(declaration.generics)
        this.p.put(' ')
        if (declaration.oop !== undefined) {
          if (declaration.oop.base) {
            this.p.put('extends', ' ')
            this.printType(declaration.oop.base)
            this.p.put(' ')
          }
          if (declaration.oop.implementations?.length) {
            this.p.put('implements', ' ')
            declaration.oop.implementations.forEach((iface, i) => {
              if (i > 0)
                this.p.put(',', ' ')
              this.printType(iface)
            })
            this.p.put(' ')
          }
        }
        this.scope.push('member')
        this.p.put('{')
        this.p.inc()
        declaration.fields.forEach((field, i) => {
          this.p.newline()
          this.printField(field.name, field.type, field.modifiers, field.expression)
        })
        declaration.methods.forEach((method, i) => {
          this.p.newline()
          this.printDeclaration(method)
        })
        this.p.dec().newline()
        this.p.put('}')
        this.scope.pop()
        break
      }
      case lw.LWKind.NamespaceDeclaration: {
        if (utils.hasHint(declaration, std.names.hints.asDefault)) {
          this.p.put('export', ' ', 'default', ' ', declaration.name)
          this.p.newline()
        }
        this.p.put('export', ' ', 'namespace', ' ', declaration.name, ' ', '{')
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
        this.p.put('export', ' ', 'type', ' ', declaration.name)
        this.p.put(' ', '=', ' ')
        this.printType(declaration.type)
        break
      }
      case lw.LWKind.TopLevelExpression: {
        this.p.put('export', ' ', 'const', ' ', declaration.name)
        if (declaration.type) {
          this.p.put(':', ' ')
          this.printType(declaration.type)
        }
        this.p.put(' ', '=', ' ')
        this.printExpression(declaration.expression)
        break
      }
      case lw.LWKind.FunctionDeclaration: {
        declaration.annotations.forEach(ann => {
          if (ann.kind === lw.DecoratorKind.SimpleAnnotation) {
            this.p.put('@', ann.name)
            this.p.newline()
          }
        })
        if (declaration.name) {
          if (this.scope.at(-1) !== 'member') {
            this.p.put('export', ' ')
          }
          declaration.modifiers.forEach(mod => this.p.put(mod.name, ' '))
          if (this.scope.at(-1) !== 'member') {
            this.p.put('function', ' ')
          }
          const isCtor = std.names.members.ctor === declaration.name
          if (isCtor) {
            this.p.put('constructor')
          } else {
            this.p.put(declaration.name)
          }
          this.printGenerics(declaration.generics)
          this.p.put('(')
          declaration.parameters.forEach((param, i) => {
            if (i > 0) {
              this.p.put(',', ' ')
            }
            param.modifiers
              ?.filter(mod => mod.name !== std.names.modifiers.optional)
              .forEach(mod => this.p.put(mod.name, ' '))
            this.p.put(param.name)
            if (param.modifiers?.find(mod => mod.name === std.names.modifiers.optional))
              this.p.put('?')
            this.p.put(':', ' ')
            this.printType(param.type)
            if (param.expression) {
              this.p.put(' ', '=', ' ')
              this.printExpression(param.expression)
            }
          })
          this.p.put(')')
          if (!isCtor && !declaration.modifiers.find(it => it.name === std.names.modifiers.setter)) {
            this.p.put(':', ' ')
            this.printType(declaration.returnType)
          }
        }
        if (declaration.body) {
          this.p.put(' ')
          this.printStatement(declaration.body)
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

export function processNPrintTS(tree: lw.LWDeclaration, localPackage: string, packages: Set<string>) {
  tree = new ConvertTSTypes(localPackage, packages).goDeclaration(tree)

  const printer = new TSPrinter()
  printer.printDeclaration(tree)
  return printer.render()
}
