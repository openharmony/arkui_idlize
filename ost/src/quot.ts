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

import { ClassDeclaration, FunctionDeclaration, LWDeclaration, LWExpression, LWStatement, LWType } from "./lws.js";
import { E, S, T, D, DD } from "./builders/index.js";
import { Vs, Md } from "./stdlib.js";

enum TokenType {
  // Single-character tokens
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  COMMA = 'COMMA',
  DOT = 'DOT',
  SEMICOLON = 'SEMICOLON',
  COLON = 'COLON',

  // Operators
  EQUAL = 'EQUAL',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  DOLLAR = 'DOLLAR',
  LESS = 'LESS',
  GREATER = 'GREATER',
  ARROW = 'ARROW',
  BANG = 'BANG',
  OR = 'OR',
  AND = 'AND',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',
  BANG_EQUAL = 'BANG_EQUAL',
  EQUAL_EQUAL = 'EQUAL_EQUAL',

  // Keywords
  VAR = 'VAR',
  MUT = 'MUT',
  CONST = 'CONST',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  DO = 'DO',
  RETURN = 'RETURN',
  NEW = 'NEW',
  STATIC = 'STATIC',
  STRUCT = 'STRUCT',
  CLASS = 'CLASS',
  FIELD = 'FIELD',
  FUNCTION = 'FUNCTION',
  PRIVATE = 'PRIVATE',
  GET = 'GET',
  SET = 'SET',
  NATIVE = 'NATIVE',
  OPTIONAL = 'OPTIONAL',
  READONLY = 'READONLY',
  DECLARE = 'DECLARE',
  EXTERNC = 'EXTERNC',

  // Literals
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',

  // Special
  EOF = 'EOF'
}

interface Token {
  type: TokenType;
  lexeme: string;
  position: number;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  const isDigit = (ch: string) => /[0-9]/.test(ch);
  const isAlpha = (ch: string) => /[a-zA-Z_]/.test(ch);
  const isAlphaNumeric = (ch: string) => isAlpha(ch) || isDigit(ch);

  const keywords: Record<string, TokenType> = {
    'var': TokenType.VAR,
    'mut': TokenType.MUT,
    'const': TokenType.CONST,
    'if': TokenType.IF,
    'then': TokenType.THEN,
    'else': TokenType.ELSE,
    'while': TokenType.WHILE,
    'do': TokenType.DO,
    'return': TokenType.RETURN,
    'new': TokenType.NEW,
    'static': TokenType.STATIC,
    'struct': TokenType.STRUCT,
    'class': TokenType.CLASS,
    'field': TokenType.FIELD,
    'function': TokenType.FUNCTION,
    'private': TokenType.PRIVATE,
    'get': TokenType.GET,
    'set': TokenType.SET,
    'native': TokenType.NATIVE,
    'optional': TokenType.OPTIONAL,
    'readonly': TokenType.READONLY,
    'declare': TokenType.DECLARE,
    'externC': TokenType.EXTERNC,
  };

  while (position < input.length) {
    const start = position;
    const ch = input[position];

    // Skip whitespace
    if (/\s/.test(ch)) {
      position++;
      continue;
    }

    // Single-character tokens
    switch (ch) {
      case '(':
        tokens.push({ type: TokenType.LEFT_PAREN, lexeme: ch, position: start });
        position++;
        continue;
      case ')':
        tokens.push({ type: TokenType.RIGHT_PAREN, lexeme: ch, position: start });
        position++;
        continue;
      case '{':
        tokens.push({ type: TokenType.LEFT_BRACE, lexeme: ch, position: start });
        position++;
        continue;
      case '}':
        tokens.push({ type: TokenType.RIGHT_BRACE, lexeme: ch, position: start });
        position++;
        continue;
      case '[':
        tokens.push({ type: TokenType.LEFT_BRACKET, lexeme: ch, position: start });
        position++;
        continue;
      case ']':
        tokens.push({ type: TokenType.RIGHT_BRACKET, lexeme: ch, position: start });
        position++;
        continue;
      case ',':
        tokens.push({ type: TokenType.COMMA, lexeme: ch, position: start });
        position++;
        continue;
      case '.':
        tokens.push({ type: TokenType.DOT, lexeme: ch, position: start });
        position++;
        continue;
      case ';':
        tokens.push({ type: TokenType.SEMICOLON, lexeme: ch, position: start });
        position++;
        continue;
      case ':':
        tokens.push({ type: TokenType.COLON, lexeme: ch, position: start });
        position++;
        continue;
      case '=':
        // Check for ==
        if (position + 1 < input.length && input[position + 1] === '=') {
          tokens.push({ type: TokenType.EQUAL_EQUAL, lexeme: '==', position: start });
          position += 2;
        } else {
          tokens.push({ type: TokenType.EQUAL, lexeme: ch, position: start });
          position++;
        }
        continue;
      case '+':
        tokens.push({ type: TokenType.PLUS, lexeme: ch, position: start });
        position++;
        continue;
      case '-':
        // Check for arrow operator ->
        if (position + 1 < input.length && input[position + 1] === '>') {
          tokens.push({ type: TokenType.ARROW, lexeme: '->', position: start });
          position += 2;
        } else {
          tokens.push({ type: TokenType.MINUS, lexeme: ch, position: start });
          position++;
        }
        continue;
      case '*':
        tokens.push({ type: TokenType.STAR, lexeme: ch, position: start });
        position++;
        continue;
      case '/':
        tokens.push({ type: TokenType.SLASH, lexeme: ch, position: start });
        position++;
        continue;
      case '$':
        tokens.push({ type: TokenType.DOLLAR, lexeme: ch, position: start });
        position++;
        continue;
      case '<':
        // Check for <=
        if (position + 1 < input.length && input[position + 1] === '=') {
          tokens.push({ type: TokenType.LESS_EQUAL, lexeme: '<=', position: start });
          position += 2;
        } else {
          tokens.push({ type: TokenType.LESS, lexeme: ch, position: start });
          position++;
        }
        continue;
      case '>':
        // Check for >=
        if (position + 1 < input.length && input[position + 1] === '=') {
          tokens.push({ type: TokenType.GREATER_EQUAL, lexeme: '>=', position: start });
          position += 2;
        } else {
          tokens.push({ type: TokenType.GREATER, lexeme: ch, position: start });
          position++;
        }
        continue;
      case '!':
        // Check for !=
        if (position + 1 < input.length && input[position + 1] === '=') {
          tokens.push({ type: TokenType.BANG_EQUAL, lexeme: '!=', position: start });
          position += 2;
        } else {
          tokens.push({ type: TokenType.BANG, lexeme: ch, position: start });
          position++;
        }
        continue;
      case '|':
        // Check for ||
        if (position + 1 < input.length && input[position + 1] === '|') {
          tokens.push({ type: TokenType.OR, lexeme: '||', position: start });
          position += 2;
        } else {
          throw new Error(`Unexpected character: | at position ${position}`);
        }
        continue;
      case '&':
        // Check for &&
        if (position + 1 < input.length && input[position + 1] === '&') {
          tokens.push({ type: TokenType.AND, lexeme: '&&', position: start });
          position += 2;
        } else {
          throw new Error(`Unexpected character: & at position ${position}`);
        }
        continue;
    }

    // Numbers
    if (isDigit(ch)) {
      let value = '';
      while (position < input.length && isDigit(input[position])) {
        value += input[position];
        position++;
      }
      tokens.push({ type: TokenType.NUMBER, lexeme: value, position: start });
      continue;
    }

    // Identifiers and keywords
    if (isAlpha(ch)) {
      let text = '';
      while (position < input.length && isAlphaNumeric(input[position])) {
        text += input[position];
        position++;
      }

      const type = keywords[text] || TokenType.IDENTIFIER;
      tokens.push({ type, lexeme: text, position: start });
      continue;
    }

    // Special variables starting with @
    if (ch === '@') {
      let text = '@';
      position++;
      while (position < input.length && isAlphaNumeric(input[position])) {
        text += input[position];
        position++;
      }
      tokens.push({ type: TokenType.IDENTIFIER, lexeme: text, position: start });
      continue;
    }

    throw new Error(`Unexpected character: ${ch} at position ${position}`);
  }

  tokens.push({ type: TokenType.EOF, lexeme: '', position });
  return tokens;
}

class LWParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  static consume(line: string): LWParser {
    const tokens = tokenize(line);
    return new LWParser(tokens);
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.position++;
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message?: string): Token {
    if (this.peek().type === type) {
      return this.tokens[this.position++];
    }
    throw new Error(message || `Expected ${type}, got ${this.peek().type} at position ${this.peek().position}`);
  }

  private expect(type: TokenType, message?: string): Token {
    return this.consume(type, message);
  }

  private parseQualifiedName(): string {
    let name = this.consume(TokenType.IDENTIFIER, "Expected identifier").lexeme;

    while (this.match(TokenType.DOT)) {
      const next = this.consume(TokenType.IDENTIFIER, "Expected identifier after '.'").lexeme;
      name += '.' + next;
    }

    return name;
  }

  // Type parsing
  parseType(): LWType {
    // Try function type first: (params) -> returnType
    if (this.match(TokenType.LEFT_PAREN)) {
      const params: [string, LWType][] = [];

      if (!this.match(TokenType.RIGHT_PAREN)) {
        do {
          const name = this.consume(TokenType.IDENTIFIER, "Expected parameter name").lexeme;
          this.expect(TokenType.COLON, "Expected ':' after parameter name");
          const type = this.parseType();
          params.push([name, type]);
        } while (this.match(TokenType.COMMA));

        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
      }

      this.expect(TokenType.ARROW, "Expected '->' in function type");
      const returnType = this.parseType();
      return T.fn(params, returnType);
    }

    // Simple or generic type
    const name = this.parseQualifiedName();

    // Check for generic type arguments
    if (this.match(TokenType.LESS)) {
      const typeArgs: LWType[] = [];

      if (!this.match(TokenType.GREATER)) {
        do {
          typeArgs.push(this.parseType());
        } while (this.match(TokenType.COMMA));

        this.expect(TokenType.GREATER, "Expected '>' after type arguments");
      }

      return T.c(name, ...typeArgs);
    }

    return T.c(name);
  }

  // Expression parsing
  parseExpression(): LWExpression {
    return this.parsePropertyAccess();
  }

  private parsePropertyAccess(): LWExpression {
    let expr = this.parsePrimary();

    // Handle property access: -> identifier
    while (this.match(TokenType.ARROW)) {
      const property = this.consume(TokenType.IDENTIFIER, "Expected property name after '->'").lexeme;
      expr = E.get(expr, property);
    }

    return expr;
  }

  private parsePrimary(): LWExpression {
    if (this.match(TokenType.NUMBER)) {
      const value = parseInt(this.tokens[this.position - 1].lexeme, 10);
      return E.c(value);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.tokens[this.position - 1].lexeme;

      // Check for special variables
      if (name.startsWith('@')) {
        switch (name) {
          case '@self': return Vs.self;
          case '@base': return Vs.base;
          case '@null': return Vs.null;
          case '@undefined': return Vs.undef;
          case '@print': return Vs.print;
          default: return E.v(name);
        }
      }

      return E.v(name);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      // Check for special forms
      const next = this.peek();

      // Check for constructor: (new Type [args])
      if (next.type === TokenType.NEW) {
        this.position++; // consume 'new'
        const type = this.parseType();
        this.expect(TokenType.LEFT_BRACKET, "Expected '[' after type name in constructor");

        const args: LWExpression[] = [];
        if (!this.match(TokenType.RIGHT_BRACKET)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
          this.expect(TokenType.RIGHT_BRACKET, "Expected ']' after constructor arguments");
        }

        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after constructor");
        return E.instance2(type, args);
      }

      // Check for static type expression: (static Type)
      if (next.type === TokenType.STATIC) {
        this.position++; // consume 'static'
        const type = this.parseType();
        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after static type");

        // Expect property access: -> identifier
        this.expect(TokenType.ARROW, "Expected '->' after static type expression");
        const property = this.consume(TokenType.IDENTIFIER, "Expected property name after '->'").lexeme;
        return E.get(E.type(type), property);
      }

      // Check for function call: ($ callee [args])
      if (next.type === TokenType.DOLLAR) {
        this.position++; // consume '$'
        const callee = this.parseExpression();
        this.expect(TokenType.LEFT_BRACKET, "Expected '[' after callee in function call");

        const args: LWExpression[] = [];
        if (!this.match(TokenType.RIGHT_BRACKET)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
          this.expect(TokenType.RIGHT_BRACKET, "Expected ']' after function arguments");
        }

        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after function call");
        return E.call(callee, args);
      }

      // Check for binary expression: (operator left right)
      // Save position for backtracking
      const savedPosition = this.position;

      const operatorToken = this.peek();
      // Check if it's a valid operator (identifier or single-character operator)
      let operator: string | null = null;

      if (operatorToken.type === TokenType.IDENTIFIER) {
        operator = operatorToken.lexeme;
      } else if (
        operatorToken.type === TokenType.EQUAL ||
        operatorToken.type === TokenType.PLUS ||
        operatorToken.type === TokenType.MINUS ||
        operatorToken.type === TokenType.STAR ||
        operatorToken.type === TokenType.SLASH ||
        operatorToken.type === TokenType.LESS ||
        operatorToken.type === TokenType.GREATER ||
        operatorToken.type === TokenType.BANG ||
        operatorToken.type === TokenType.OR ||
        operatorToken.type === TokenType.AND ||
        operatorToken.type === TokenType.LESS_EQUAL ||
        operatorToken.type === TokenType.GREATER_EQUAL ||
        operatorToken.type === TokenType.BANG_EQUAL ||
        operatorToken.type === TokenType.EQUAL_EQUAL
      ) {
        operator = operatorToken.lexeme;
      }

      if (operator !== null) {
        // Try to parse as unary or binary expression
        this.position++; // consume operator

        try {
          const operands: LWExpression[] = []
          while (this.peek().type !== TokenType.RIGHT_PAREN) {
            operands.push(this.parseExpression())
          }
          this.expect(TokenType.RIGHT_PAREN, "Expected ')' after expression");

          if (operands.length === 0) {
            throw new Error(`Unexpected token: ${this.peek().lexeme} (${this.peek().type}) at position ${this.peek().position}`)
          }
          if (operands.length === 1) {
            return E.unary(operator, operands[0])
          }
          let expression = E.bin(operator, operands[0], operands[1])
          operands.shift()
          operands.shift()
          while (operands.length) {
            expression = E.bin(operator, expression, operands.shift()!)
          }
          return expression
        } catch (e) {
          // Parsing failed, restore position
          this.position = savedPosition;
        }
      }

      // Regular parenthesized expression or property access like (@self->x)
      const expr = this.parseExpression();
      this.expect(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().lexeme} (${this.peek().type}) at position ${this.peek().position}`);
  }

  // Statement parsing
  parseStatement(): LWStatement {
    // Block statement
    if (this.match(TokenType.LEFT_BRACE)) {
      const statements: LWStatement[] = [];

      while (!this.match(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
        statements.push(this.parseStatement());
      }

      return S.block(statements);
    }

    // Variable declaration
    if (this.match(TokenType.VAR)) {
      const mutable = this.match(TokenType.MUT);
      if (!mutable) {
        this.expect(TokenType.CONST, "Expected 'mut' or 'const' after 'var'");
      }

      const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").lexeme;
      this.expect(TokenType.COLON, "Expected ':' after variable name");
      const type = this.parseType();

      let initializer: LWExpression | undefined;
      if (this.match(TokenType.EQUAL)) {
        initializer = this.parseExpression();
      }

      return S.declaration(name, type, mutable, initializer);
    }

    // If statement
    if (this.match(TokenType.IF)) {
      const condition = this.parseExpression();
      this.expect(TokenType.THEN, "Expected 'then' after if condition");
      const thenBranch = this.parseStatement();

      let elseBranch: LWStatement | undefined;
      if (this.match(TokenType.ELSE)) {
        elseBranch = this.parseStatement();
      }

      return S.if(condition, thenBranch, elseBranch);
    }

    // While statement
    if (this.match(TokenType.WHILE)) {
      const condition = this.parseExpression();
      this.expect(TokenType.DO, "Expected 'do' after while condition");
      const body = this.parseStatement();
      return S.loop(condition, body);
    }

    // Return statement
    if (this.match(TokenType.RETURN)) {
      let expression: LWExpression | undefined;
      if (!this.match(TokenType.SEMICOLON)) {
        expression = this.parseExpression();
        this.match(TokenType.SEMICOLON); // optional semicolon
      }
      return S.return(expression);
    }

    // Expression statement
    const expression = this.parseExpression();
    this.match(TokenType.SEMICOLON); // optional semicolon
    return S.e(expression);
  }

  parseClassMethod(methods: ClassDeclaration['methods']): boolean {
    if (!this.match(TokenType.FUNCTION)) {
      return false
    }
    const modifiers: any[] = [];
    while (
      this.peek().type === TokenType.PRIVATE ||
      this.peek().type === TokenType.STATIC ||
      this.peek().type === TokenType.GET ||
      this.peek().type === TokenType.SET ||
      this.peek().type === TokenType.NATIVE ||
      this.peek().type === TokenType.OPTIONAL ||
      this.peek().type === TokenType.READONLY ||
      this.peek().type === TokenType.DECLARE ||
      this.peek().type === TokenType.EXTERNC
    ) {
      if (this.match(TokenType.PRIVATE)) {
        modifiers.push(Md.private());
      } else if (this.match(TokenType.STATIC)) {
        modifiers.push(Md.static());
      } else if (this.match(TokenType.GET)) {
        modifiers.push(Md.getter());
      } else if (this.match(TokenType.SET)) {
        modifiers.push(Md.setter());
      } else if (this.match(TokenType.NATIVE)) {
        modifiers.push(Md.native());
      } else if (this.match(TokenType.OPTIONAL)) {
        modifiers.push(Md.optional());
      } else if (this.match(TokenType.READONLY)) {
        modifiers.push(Md.readonly());
      } else if (this.match(TokenType.DECLARE)) {
        modifiers.push(Md.declare());
      } else if (this.match(TokenType.EXTERNC)) {
        modifiers.push(Md.externC());
      }
    }

    const funcName = this.consume(TokenType.IDENTIFIER, "Expected function name").lexeme;
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after function name");

    const params: FunctionDeclaration['parameters'] = [];
    if (!this.match(TokenType.RIGHT_PAREN)) {
      do {
        const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").lexeme;
        this.expect(TokenType.COLON, "Expected ':' after parameter name");
        const paramType = this.parseType();
        params.push({ name: paramName, type: paramType });
        if (this.match(TokenType.EQUAL)) {
          const defaultExpression = this.parseExpression()
          params.at(-1)!.expression = defaultExpression
        }
      } while (this.match(TokenType.COMMA));

      this.expect(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    }

    this.expect(TokenType.COLON, "Expected ':' after function parameters");
    const returnType = this.parseType();

    const body = this.parseStatement();

    methods.push(DD({ modifiers }).func(funcName, params, returnType, body));

    this.match(TokenType.COMMA); // optional comma
    return true
  }

  parseClassField(fields: ClassDeclaration['fields']): boolean {
    // Field declaration
    if (!this.match(TokenType.FIELD)) {
      return false
    }
    const modifiers: any[] = [];
    while (
      this.peek().type === TokenType.PRIVATE ||
      this.peek().type === TokenType.STATIC ||
      this.peek().type === TokenType.GET ||
      this.peek().type === TokenType.SET ||
      this.peek().type === TokenType.NATIVE ||
      this.peek().type === TokenType.OPTIONAL ||
      this.peek().type === TokenType.READONLY ||
      this.peek().type === TokenType.DECLARE ||
      this.peek().type === TokenType.EXTERNC
    ) {
      if (this.match(TokenType.PRIVATE)) {
        modifiers.push(Md.private());
      } else if (this.match(TokenType.STATIC)) {
        modifiers.push(Md.static());
      } else if (this.match(TokenType.GET)) {
        modifiers.push(Md.getter());
      } else if (this.match(TokenType.SET)) {
        modifiers.push(Md.setter());
      } else if (this.match(TokenType.NATIVE)) {
        modifiers.push(Md.native());
      } else if (this.match(TokenType.OPTIONAL)) {
        modifiers.push(Md.optional());
      } else if (this.match(TokenType.READONLY)) {
        modifiers.push(Md.readonly());
      } else if (this.match(TokenType.DECLARE)) {
        modifiers.push(Md.declare());
      } else if (this.match(TokenType.EXTERNC)) {
        modifiers.push(Md.externC());
      }
    }

    const fieldName = this.consume(TokenType.IDENTIFIER, "Expected field name").lexeme;
    this.expect(TokenType.COLON, "Expected ':' after field name");
    const fieldType = this.parseType();

    let expression: LWExpression | undefined = undefined
    if (this.match(TokenType.EQUAL)) {
      expression = this.parseExpression()
    }

    fields.push({ name: fieldName, type: fieldType, modifiers, expression });

    this.match(TokenType.COMMA); // optional comma
    return true
  }

  // Declaration parsing
  parseDeclaration(): LWDeclaration {
    // Struct declaration
    if (this.match(TokenType.STRUCT)) {
      const name = this.consume(TokenType.IDENTIFIER, "Expected struct name").lexeme;
      this.expect(TokenType.LEFT_BRACE, "Expected '{' after struct name");

      const members: { name: string, type: LWType }[] = [];
      if (!this.match(TokenType.RIGHT_BRACE)) {
        do {
          const memberName = this.consume(TokenType.IDENTIFIER, "Expected field name").lexeme;
          this.expect(TokenType.COLON, "Expected ':' after field name");
          const memberType = this.parseType();
          members.push({ name: memberName, type: memberType });
        } while (this.match(TokenType.COMMA));

        this.expect(TokenType.RIGHT_BRACE, "Expected '}' after struct fields");
      }

      return D.struct(name, members);
    }

    // Class declaration
    if (this.match(TokenType.CLASS)) {
      const name = this.consume(TokenType.IDENTIFIER, "Expected class name").lexeme;
      this.expect(TokenType.LEFT_BRACE, "Expected '{' after class name");

      const fields: { name: string, type: LWType, modifiers: any[] }[] = [];
      const methods: any[] = [];

      while (!this.match(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
        const parsed = this.parseClassField(fields) || this.parseClassMethod(methods)
        if (!parsed) {
          throw new Error(`Unexpected token in class body: ${this.peek().type}`);
        }
      }

      return D.class(name, fields, methods);
    }

    // Function declaration
    if (this.match(TokenType.FUNCTION)) {
      const name = this.consume(TokenType.IDENTIFIER, "Expected function name").lexeme;
      this.expect(TokenType.LEFT_PAREN, "Expected '(' after function name");

      const params: { name: string, type: LWType }[] = [];
      if (!this.match(TokenType.RIGHT_PAREN)) {
        do {
          const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").lexeme;
          this.expect(TokenType.COLON, "Expected ':' after parameter name");
          const paramType = this.parseType();
          params.push({ name: paramName, type: paramType });
        } while (this.match(TokenType.COMMA));

        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
      }

      this.expect(TokenType.COLON, "Expected ':' after function parameters");
      const returnType = this.parseType();

      const body = this.parseStatement();

      return D.func(name, params, returnType, body);
    }

    throw new Error(`Unexpected token: ${this.peek().lexeme} (${this.peek().type}) at position ${this.peek().position}`);
  }
}

function quotType(template: TemplateStringsArray): LWType {
  return LWParser.consume(template.join('')).parseType()
}
function quotExpression(template: TemplateStringsArray): LWExpression {
  return LWParser.consume(template.join('')).parseExpression()
}
function quotStatement(template: TemplateStringsArray): LWStatement {
  return LWParser.consume(template.join('')).parseStatement()
}
function quotDeclaration(template: TemplateStringsArray): LWDeclaration {
  return LWParser.consume(template.join('')).parseDeclaration()
}

function quotClassField(decl:ClassDeclaration) {
  return (template: TemplateStringsArray) => {
    return LWParser.consume(template.join('')).parseClassField(decl.fields)
  }
}
function quotClassMethod(decl:ClassDeclaration) {
  return (template: TemplateStringsArray) => {
    return LWParser.consume(template.join('')).parseClassMethod(decl.methods)
  }
}

export const quot = {
  T: quotType,
  E: quotExpression,
  S: quotStatement,
  D: quotDeclaration,

  appendField: quotClassField,
  appendMethod: quotClassMethod,
}
