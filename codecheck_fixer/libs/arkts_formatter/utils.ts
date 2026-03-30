/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

/**
 * Utilities for formatting
 */

import * as ts from 'typescript';
import { LineInfo } from './types';

/**
 * Gets line information
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
 * Gets line indent
 */
export function getIndent(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] || '' : '';
}

/**
 * Gets indent unit
 */
export function getIndentUnit(useTabs: boolean, tabSize: number): string {
  return useTabs ? '\t' : ' '.repeat(tabSize);
}

/**
 * Gets indent for AST node
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
 * Extracts line for AST node
 */
export function extractLineForNode(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  const startLC = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  const lines = sourceFile.text.split('\n');
  return lines[startLC.line] || null;
}

/**
 * Checks if node is long (exceeds line limit)
 */
export function isNodeLong(node: ts.Node, sourceFile: ts.SourceFile, maxLength: number): boolean {
  const start = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  const end = ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd());
  if (start.line === end.line) {
    const lineText = sourceFile.text.split('\n')[start.line];
    return lineText ? lineText.length > maxLength : false;
  }
  return false; // Node is already multi-line
}

/**
 * Splits content by top-level commas
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
 * Checks if line contains URL
 */
export function containsUrl(line: string): boolean {
  const urlRegex = /https?:\/\/[^\s]+/;
  return urlRegex.test(line);
}

/**
 * Checks if line is a comment
 */
export function isComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

/**
 * Checks if line is a string literal
 */
export function isStringLiteral(line: string): boolean {
  const trimmed = line.trim();
  return (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
         (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
         (trimmed.startsWith('`') && trimmed.endsWith('`'));
}

/**
 * Removes trailing whitespace from lines
 */
export function removeTrailingWhitespace(content: string): string {
  return content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

/**
 * Checks if line can be safely broken
 */
export function canSafelyBreak(line: string): boolean {
  // Heuristics for determining breakability
  if (/[|,]/.test(line)) return true; // union or list
  if (/(\sas\s)/.test(line)) return true; // type assertion
  if (/[()]/.test(line)) return true; // calls/parameters
  if (/{.*}/.test(line)) return true; // object literal
  if (/\+/.test(line)) return true; // string concatenation
  if (/:\s*\S/.test(line)) return true; // type annotation
  
  return false;
}

/**
 * Gets AST context for line
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
