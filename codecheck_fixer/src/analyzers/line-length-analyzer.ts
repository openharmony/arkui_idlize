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
 * Line length analyzer for TypeScript files
 * Uses TypeScript Compiler API for correct line context analysis
 */

import * as ts from 'typescript';
import { createEnhancedASTWithQuery, SyntaxTokenType } from '../../libs/arkts_enhanced_ast';
import type { EnhancedASTWithQuery } from '../../libs/arkts_formatter/types';
import { BaseAnalyzer } from '../core/analyzer';
import { ContentType } from '../../libs/common/common-types';
import {
  AnalysisResult,
  AnalysisIssue,
  AnalysisConfig
} from '@/types';

export interface LineLengthConfig {
  maxLineLength: number;
  ignoreUrls: boolean;
  ignoreStrings: boolean;
  ignoreComments: boolean;
  ignoreTemplateLiterals: boolean;
}

export class LineLengthAnalyzer extends BaseAnalyzer {
  private lineLengthConfig: LineLengthConfig;
  private sourceFile!: ts.SourceFile;
  private enhancedAST!: EnhancedASTWithQuery;

  /**
   * Creates line length analyzer.
   * @param config General analysis configuration.
   * @param lineLengthConfig Line length rule settings and ignores.
   */
  constructor(config: AnalysisConfig, lineLengthConfig: LineLengthConfig) {
    super(config);
    this.lineLengthConfig = lineLengthConfig;
  }

  /**
   * Analyzes file content and generates list of line length violations.
   * Takes content type into account for correct parsing and AST context calculation per line.
   * @param content Source file text.
   * @param contentType Content type (TS/TSX/ETS).
   * @returns Analysis result with list of found issues.
   */
  async analyze(content: string, contentType: ContentType): Promise<AnalysisResult> {
    const virtualFile = contentType === ContentType.ARKTS
      ? 'temp.ets'
      : contentType === ContentType.TSX
        ? 'temp.tsx'
        : 'temp.ts';

    this.sourceFile = ts.createSourceFile(
      virtualFile,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Build Enhanced AST and query once for entire file
    this.enhancedAST = createEnhancedASTWithQuery(this.sourceFile, {
      preserveComments: true,
      preserveWhitespace: false,
      enableDiagnostics: false
    });

    const issues: AnalysisIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      if (line.length > this.lineLengthConfig.maxLineLength) {
        const astCtx = this.getAstContextForLine(i);
        if (this.shouldIgnoreLine(line, i, astCtx)) {
          return;
        }

        const fixable = this.isLinePotentiallyFixable(line, i, astCtx);
        let message = `Line ${i + 1} length ${line.length} exceeds maximum length of ${this.lineLengthConfig.maxLineLength}`;
        if (!fixable) {
          const indentLen = this.getLeadingIndentLength(line);
          const longest = this.getLongestTokenLengthOnLine(i);
          message += ` (no safe breakpoints; indent=${indentLen}, longestToken=${longest})`;
          message += ` — consider shortening identifiers or refactoring expression formatting`;
        }
        issues.push({
          rule: 'line-length',
          message,
          line: i + 1,
          column: 1,
          severity: 'warning',
          type: 'style',
          isFixable: fixable,
          lineLength: line.length,
        });
      }
    });

    return {
      issues,
    };
  }

  /**
   * Evaluates whether line wrapping can be safely automated for a long line.
   * Uses lightweight heuristics (punctuation, brackets, type annotations) and
   * checks for "unbreakable single token" without spaces.
   * @param line Analyzed line.
   * @param _astContext AST node for line (not used in current implementation).
   * @returns true — line is potentially auto-fixable; false — better to fix manually.
   */
  private isLinePotentiallyFixable(line: string, lineIndex: number, _astContext: ts.Node | null): boolean {
    const trimmed = line.trim();
    // Comments and doc lines typically fixable by wrapping
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return true;
    }
    // Heuristics: presence of common breakpoints
    if (/[|,]/.test(line)) return true; // union or list
    if (/(\sas\s)/.test(line)) return true; // type assertion
    if (/[()]/.test(line)) return true; // calls/params
    if (/{.*}/.test(line)) return true; // object literal
    if (/\+/.test(line)) return true; // string concat
    if (/:\s*\S/.test(line)) return true; // type annotation may be splittable
    if (/extends\s+\S/.test(line)) return true; // class heritage
    if (/implements\s+\S/.test(line)) return true;

    // Very long single-token with indent and no spaces -> not fixable
    const indentLen = this.getLeadingIndentLength(line);
    const longest = this.getLongestTokenLengthOnLine(lineIndex);
    if (indentLen + longest >= this.lineLengthConfig.maxLineLength) {
      return false;
    }
    // Default: try
    return true;
  }

  /**
   * Returns minimal AST node that fully fits within specified line boundaries.
   * @param lineNumber Line number (0-based).
   * @returns Found node or null if no suitable node exists.
   */
  private getAstContextForLine(lineNumber: number): ts.Node | null {
    const lineStart = this.sourceFile.getPositionOfLineAndCharacter(lineNumber, 0);
    const lineEnd = this.sourceFile.getPositionOfLineAndCharacter(lineNumber + 1, 0);

    const minimal = this.enhancedAST.query.findMinimalCoveringNode({
      start: { offset: lineStart, line: lineNumber, column: 0 },
      end: { offset: lineEnd, line: lineNumber, column: Math.max(0, lineEnd - lineStart) }
    });
    return minimal?.originalNode ?? null;
  }

  /**
   * Checks if line should be excluded from analysis per ignore settings.
   * Performs quick text checks, then refines by AST and applies fallbacks.
   * @param line Line text.
   * @param _lineNumber Line number (0-based).
   * @param astContext AST context for line, if available.
   * @returns true — line is ignored; false — line subject to analysis.
   */
  private shouldIgnoreLine(line: string, _lineNumber: number, astContext: ts.Node | null): boolean {
    const trimmedLine = line.trim();

    // Empty line — ignore
    if (trimmedLine.length === 0) {
      return true;
    }

    // Ignore lines with URLs if ignoreUrls flag is enabled
    if (this.lineLengthConfig.ignoreUrls && this.containsUrl(line)) {
      return true;
    }

    // If AST context available, apply precise ignores by node type
    if (astContext) {
      // Ignore string literals by AST when ignoreStrings is enabled
      if (this.lineLengthConfig.ignoreStrings && ts.isStringLiteral(astContext)) {
        return true;
      }

      // Ignore template literals by AST when ignoreTemplateLiterals is enabled
      if (this.lineLengthConfig.ignoreTemplateLiterals && ts.isTemplateLiteral(astContext)) {
        return true;
      }

      // Ignore JSDoc/comments by AST when ignoreComments is enabled
      if (this.lineLengthConfig.ignoreComments && ts.isJSDoc(astContext)) {
        return true;
      }
    }

    // Fallback: ignore string literals by text analysis
    if (this.lineLengthConfig.ignoreStrings && this.isStringLiteral(line)) {
      return true;
    }

    // Fallback: ignore comments by text analysis
    if (this.lineLengthConfig.ignoreComments && this.isComment(line)) {
      return true;
    }

    // Fallback: ignore template literals by text analysis
    if (this.lineLengthConfig.ignoreTemplateLiterals && this.isTemplateLiteral(line)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if line contains URL (http/https).
   * @param line Line text.
   * @returns true if URL detected in line.
   */
  private containsUrl(line: string): boolean {
    const urlRegex = /https?:\/\/[^\s]+/;
    return urlRegex.test(line);
  }

  /**
   * Rough text check: line is entirely a string literal.
   * @param line Line text.
   * @returns true if line starts and ends with quotes (", ' or `).
   */
  private isStringLiteral(line: string): boolean {
    const trimmed = line.trim();
    return (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
           (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
           (trimmed.startsWith('`') && trimmed.endsWith('`'));
  }

  /**
   * Rough text check: line is a comment line.
   * @param line Line text.
   * @returns true if line starts with //, /* or *.
   */
  private isComment(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }

  /**
   * Rough text check for template literal.
   * @param line Line text.
   * @returns true if line is surrounded by backticks (`).
   */
  private isTemplateLiteral(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('`') && trimmed.endsWith('`');
  }

  /**
   * Returns length of leading indent in line (in characters), accounting for spaces and tabs.
   * @param line Line text.
   */
  private getLeadingIndentLength(line: string): number {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === ' ' || ch === '\t') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Calculates length of longest token on specified line using TypeScript scanner.
   * Comment tokens and whitespace characters are ignored (skipTrivia=true).
   * @param lineIndex Line index (0-based).
   */
  private getLongestTokenLengthOnLine(lineIndex: number): number {
    const lineStart = this.sourceFile.getPositionOfLineAndCharacter(lineIndex, 0);
    let lineEnd: number;
    try {
      lineEnd = this.sourceFile.getPositionOfLineAndCharacter(lineIndex + 1, 0);
    } catch {
      lineEnd = this.sourceFile.getFullText().length;
    }

    const nodes = this.enhancedAST.query.findNodesInRange({
      start: { offset: lineStart, line: lineIndex, column: 0 },
      end: { offset: lineEnd, line: lineIndex, column: Math.max(0, lineEnd - lineStart) }
    });

    let maxLen = 0;
    for (const node of nodes) {
      for (const tok of node.syntaxTokens || []) {
        const pos = tok.position.offset;
        if (pos < lineStart || pos >= lineEnd) continue;
        // Skip whitespace and newlines
        if (tok.type === SyntaxTokenType.WHITESPACE || tok.type === SyntaxTokenType.NEWLINE) {
          continue;
        }
        const len = tok.text?.length || 0;
        if (len > maxLen) maxLen = len;
      }
    }
    return maxLen;
  }
}
