/**
 * Source code tokenization using TypeScript Scanner API
 * 
 * This module is responsible for converting text into flat list of syntactic tokens (CST).
 * Uses built-in ts.createScanner() to obtain tokens.
 */

import * as ts from 'typescript';
import {
  SyntaxToken,
  SyntaxTokenType,
  SourcePosition
} from './enhanced-ast-types';

/**
 * Tokenizer for converting source code into syntactic tokens.
 * Is a wrapper over ts.Scanner, physical tokenization happens in TypeScript Compiler API.
 * This class adds line/column coordinates and our token types (remaining information
 * — via semantic separators).
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
      /* skipTrivia */ false, // We need all tokens, including whitespace and comments
      languageVariant,
      sourceText
    );
    
    // Compute line start positions for converting offset to line/column
    this.lineStarts = this.computeLineStarts(sourceText);
  }

  /**
   * Computes start positions of each line in source text
   */
  private computeLineStarts(text: string): number[] {
    const result: number[] = [0]; // First line starts at position 0
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        result.push(i + 1);
      }
    }
    
    return result;
  }

  /**
   * Converts absolute offset to position (line, column)
   */
  private offsetToPosition(offset: number): SourcePosition {
    // Binary search for line
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
   * Tokenizes range of source code
   * 
   * @param start - Starting position of range
   * @param end - Ending position of range
   * @returns Array of syntactic tokens
   * ??? why is manual tokenizer needed if tokens exist in CST?? TODO: check
   */
  tokenize(start: number, end: number): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    
    // Set scanner position
    this.scanner.setTextPos(start);
    
    while (this.scanner.getTextPos() < end) {
      const tokenStart = this.scanner.getTextPos();
      const tokenKind = this.scanner.scan();
      
      // Break if reached end
      if (tokenKind === ts.SyntaxKind.EndOfFileToken) {
        break;
      }
      
      const tokenEnd = this.scanner.getTextPos();
      
      // Break if went beyond range boundaries
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
   * Converts TypeScript SyntaxKind to our SyntaxTokenType
   */
  private mapTokenKindToType(kind: ts.SyntaxKind): SyntaxTokenType {
    // Keywords
    if (kind >= ts.SyntaxKind.FirstKeyword && kind <= ts.SyntaxKind.LastKeyword) {
      return SyntaxTokenType.KEYWORD;
    }
    
    // Specific tokens
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
      
      // Union/intersection operators and others
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
 * Creates tokenizer for source text
 * 
 * @param sourceText - source text
 * @param scriptTarget - target JavaScript version
 * @param languageVariant - language variant (Standard or JSX)
 */
export function createTokenizer(
  sourceText: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
  languageVariant: ts.LanguageVariant = ts.LanguageVariant.Standard
): SyntaxTokenizer {
  return new SyntaxTokenizer(sourceText, scriptTarget, languageVariant);
}

