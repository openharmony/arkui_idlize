/**
 * Утилиты для форматирования
 */

import * as ts from 'typescript';
import { LineInfo } from './types';

/**
 * Получает информацию о строке
 */
export function getLineInfo(line: string, index: number, maxLength: number): LineInfo {
  const trimmed = line.trim();
  const indent = getIndent(line);
  
  return {
    content: line,
    index,
    trimmed,
    indent,
    length: line.length,
    exceedsLimit: line.length > maxLength
  };
}

/**
 * Получает отступ строки
 */
export function getIndent(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] || '' : '';
}

/**
 * Получает единицу отступа
 */
export function getIndentUnit(useTabs: boolean, tabSize: number): string {
  return useTabs ? '\t' : ' '.repeat(tabSize);
}

/**
 * Получает отступ для узла AST
 */
export function getIndentForNode(node: ts.Node, sourceFile: ts.SourceFile): string {
  const { line } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  const lineText = sourceFile.text.split('\n')[line];
  if (!lineText) {
    return '';
  }
  return getIndent(lineText);
}

/**
 * Извлекает строку для узла AST
 */
export function extractLineForNode(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  const startLC = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  const lines = sourceFile.text.split('\n');
  return lines[startLC.line] || null;
}

/**
 * Проверяет, является ли узел длинным (превышает лимит строки)
 */
export function isNodeLong(node: ts.Node, sourceFile: ts.SourceFile, maxLength: number): boolean {
  const start = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  const end = ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd());
  if (start.line === end.line) {
    const lineText = sourceFile.text.split('\n')[start.line];
    return lineText ? lineText.length > maxLength : false;
  }
  return false; // Узел уже многострочный
}

/**
 * Разбивает содержимое по запятым на верхнем уровне
 */
export function splitByTopLevelCommas(content: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    
    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket--;
    
    if (ch === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  
  if (current.trim().length > 0) {
    parts.push(current.trim());
  }
  
  return parts;
}

/**
 * Проверяет, содержит ли строка URL
 */
export function containsUrl(line: string): boolean {
  const urlRegex = /https?:\/\/[^\s]+/;
  return urlRegex.test(line);
}

/**
 * Проверяет, является ли строка комментарием
 */
export function isComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

/**
 * Проверяет, является ли строка строковым литералом
 */
export function isStringLiteral(line: string): boolean {
  const trimmed = line.trim();
  return (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
         (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
         (trimmed.startsWith('`') && trimmed.endsWith('`'));
}

/**
 * Удаляет пробелы в конце строк
 */
export function removeTrailingWhitespace(content: string): string {
  return content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

/**
 * Проверяет, может ли строка быть безопасно разбита
 */
export function canSafelyBreak(line: string): boolean {
  // Эвристики для определения возможности разбиения
  if (/[|,]/.test(line)) return true; // union или список
  if (/(\sas\s)/.test(line)) return true; // type assertion
  if (/[()]/.test(line)) return true; // вызовы/параметры
  if (/{.*}/.test(line)) return true; // объектный литерал
  if (/\+/.test(line)) return true; // конкатенация строк
  if (/:\s*\S/.test(line)) return true; // аннотация типа
  
  return false;
}

/**
 * Получает AST контекст для строки
 */
export function getASTContextForLine(lineNumber: number, sourceFile: ts.SourceFile): ts.Node | null {
  const lineStart = sourceFile.getPositionOfLineAndCharacter(lineNumber, 0);
  const lineEnd = sourceFile.getPositionOfLineAndCharacter(lineNumber + 1, 0);

  let foundNode: ts.Node | null = null;

  const visitNode = (node: ts.Node) => {
    if (node.getStart() >= lineStart && node.getEnd() <= lineEnd) {
      foundNode = node;
      return;
    }
    ts.forEachChild(node, visitNode);
  };

  visitNode(sourceFile);
  return foundNode;
}
