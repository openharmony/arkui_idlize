/**
 * Токенизация исходного кода с использованием TypeScript Scanner API
 * 
 * Этот модуль отвечает за преобразование текста в плоский список синтаксических токенов (CST).
 * Использует встроенный ts.createScanner() для получения токенов.
 */

import * as ts from 'typescript';
import {
  SyntaxToken,
  SyntaxTokenType,
  SourcePosition
} from './enhanced-ast-types';

/**
 * Токенизатор для преобразования исходного кода в синтаксические токены.
 * Является обёрткой над ts.Scanner, физически токенизация происходит в TypeScript Compiler API.
 * Этот класс добавляет координаты line/column и наши типы токенов (остальная информация
 * — через семантические разделители).
 */
export class SyntaxTokenizer {
  private scanner: ts.Scanner;
  private sourceText: string;
  private lineStarts: number[];

  constructor(
    sourceText: string, 
    scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
    languageVariant: ts.LanguageVariant = ts.LanguageVariant.Standard
  ) {
    this.sourceText = sourceText;
    this.scanner = ts.createScanner(
      scriptTarget,
      /* skipTrivia */ false, // Нам нужны все токены, включая пробелы и комментарии
      languageVariant,
      sourceText
    );
    
    // Вычисляем позиции начала строк для преобразования offset в line/column
    this.lineStarts = this.computeLineStarts(sourceText);
  }

  /**
   * Вычисляет позиции начала каждой строки в исходном тексте
   */
  private computeLineStarts(text: string): number[] {
    const result: number[] = [0]; // Первая строка начинается с позиции 0
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        result.push(i + 1);
      }
    }
    
    return result;
  }

  /**
   * Преобразует абсолютный offset в позицию (line, column)
   */
  private offsetToPosition(offset: number): SourcePosition {
    // Бинарный поиск строки
    let line = 0;
    for (let i = 0; i < this.lineStarts.length; i++) {
      const lineStart = this.lineStarts[i];
      if (lineStart !== undefined && lineStart > offset) {
        break;
      }
      line = i;
    }
    
    const lineStart = this.lineStarts[line];
    const column = lineStart !== undefined ? offset - lineStart : 0;
    
    return {
      offset,
      line,
      column
    };
  }

  /**
   * Токенизирует диапазон исходного кода
   * 
   * @param start - Начальная позиция диапазона
   * @param end - Конечная позиция диапазона
   * @returns Массив синтаксических токенов
   * ??? зачем нужен ручной токенизер, если токены есть в CST?? TODO: проверить
   */
  tokenize(start: number, end: number): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    
    // Устанавливаем позицию сканера
    this.scanner.setTextPos(start);
    
    while (this.scanner.getTextPos() < end) {
      const tokenStart = this.scanner.getTextPos();
      const tokenKind = this.scanner.scan();
      
      // Прерываем, если достигли конца
      if (tokenKind === ts.SyntaxKind.EndOfFileToken) {
        break;
      }
      
      const tokenEnd = this.scanner.getTextPos();
      
      // Прерываем, если вышли за границы диапазона
      if (tokenEnd > end) {
        break;
      }
      
      const tokenText = this.sourceText.substring(tokenStart, tokenEnd);
      const position = this.offsetToPosition(tokenStart);
      const type = this.mapTokenKindToType(tokenKind);
      
      tokens.push({
        type,
        text: tokenText,
        position,
        tsKind: tokenKind
      });
    }
    
    return tokens;
  }

  /**
   * Преобразует TypeScript SyntaxKind в наш SyntaxTokenType
   */
  private mapTokenKindToType(kind: ts.SyntaxKind): SyntaxTokenType {
    // Ключевые слова
    if (kind >= ts.SyntaxKind.FirstKeyword && kind <= ts.SyntaxKind.LastKeyword) {
      return SyntaxTokenType.KEYWORD;
    }
    
    // Специфичные токены
    switch (kind) {
      case ts.SyntaxKind.Identifier:
        return SyntaxTokenType.IDENTIFIER;
      
      case ts.SyntaxKind.OpenBraceToken:
        return SyntaxTokenType.OPEN_BRACE;
      case ts.SyntaxKind.CloseBraceToken:
        return SyntaxTokenType.CLOSE_BRACE;
      
      case ts.SyntaxKind.OpenParenToken:
        return SyntaxTokenType.OPEN_PAREN;
      case ts.SyntaxKind.CloseParenToken:
        return SyntaxTokenType.CLOSE_PAREN;
      
      case ts.SyntaxKind.LessThanToken:
        return SyntaxTokenType.OPEN_ANGLE;
      case ts.SyntaxKind.GreaterThanToken:
        return SyntaxTokenType.CLOSE_ANGLE;
      
      case ts.SyntaxKind.OpenBracketToken:
        return SyntaxTokenType.OPEN_BRACKET;
      case ts.SyntaxKind.CloseBracketToken:
        return SyntaxTokenType.CLOSE_BRACKET;
      
      case ts.SyntaxKind.CommaToken:
        return SyntaxTokenType.COMMA;
      case ts.SyntaxKind.SemicolonToken:
        return SyntaxTokenType.SEMICOLON;
      case ts.SyntaxKind.ColonToken:
        return SyntaxTokenType.COLON;
      case ts.SyntaxKind.DotToken:
        return SyntaxTokenType.DOT;
      
      case ts.SyntaxKind.EqualsToken:
        return SyntaxTokenType.EQUALS;
      case ts.SyntaxKind.EqualsGreaterThanToken:
        return SyntaxTokenType.ARROW;
      case ts.SyntaxKind.QuestionToken:
        return SyntaxTokenType.QUESTION;
      case ts.SyntaxKind.QuestionQuestionToken:
        return SyntaxTokenType.NULLISH_COALESCING;
      case ts.SyntaxKind.DotDotDotToken:
        return SyntaxTokenType.SPREAD;
      
      case ts.SyntaxKind.MinusToken:
        return SyntaxTokenType.MINUS;
      case ts.SyntaxKind.PlusToken:
        return SyntaxTokenType.PLUS;
      
      // Операторы union/intersection и другие
      case ts.SyntaxKind.BarToken:  // |
      case ts.SyntaxKind.AmpersandToken:  // &
      case ts.SyntaxKind.BarBarToken:  // ||
      case ts.SyntaxKind.AmpersandAmpersandToken:  // &&
        return SyntaxTokenType.OPERATOR;
      
      case ts.SyntaxKind.WhitespaceTrivia:
        return SyntaxTokenType.WHITESPACE;
      case ts.SyntaxKind.NewLineTrivia:
        return SyntaxTokenType.NEWLINE;
      
      case ts.SyntaxKind.SingleLineCommentTrivia:
        return SyntaxTokenType.LINE_COMMENT;
      case ts.SyntaxKind.MultiLineCommentTrivia:
        return SyntaxTokenType.BLOCK_COMMENT;
      
      default:
        return SyntaxTokenType.OTHER;
    }
  }

}

/**
 * Создаёт токенизатор для исходного текста
 * 
 * @param sourceText - исходный текст
 * @param scriptTarget - целевая версия JavaScript
 * @param languageVariant - вариант языка (Standard или JSX)
 */
export function createTokenizer(
  sourceText: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
  languageVariant: ts.LanguageVariant = ts.LanguageVariant.Standard
): SyntaxTokenizer {
  return new SyntaxTokenizer(sourceText, scriptTarget, languageVariant);
}

