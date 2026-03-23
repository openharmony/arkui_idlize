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
 * Refactored formatter for splitting long lines
 * Uses AST-first approach with text fallback for ETS files
 */

import {
  FormatterConfig,
  LineLengthConfig,
  FormattingContext,
  FormattingStrategy,
  LineBreakInsertion,
  TransformationResult
} from './types';
import { ContentType } from '../common/common-types';
import { ResultValidator, ValidationIssue } from './result-validator';
import { TransformationManager } from './transformation-manager';
import { EnhancedASTFormattingStrategy } from './strategies/enhanced-ast-formatting-strategy';
import { getIndentUnit } from './utils';
import type { EnhancedASTWithQuery } from './types';
import { cancellationToken } from '../common/cancellation';

/**
 * Utility for building Enhanced AST
 * Encapsulates dependency on libs/arkts_enhanced_ast
 * 
 * ARCHITECTURE: All responsibility for building Enhanced AST
 * is delegated to libs/arkts_enhanced_ast library.
 * This class only calls its API.
 */
class ASTBuilder {
  /**
   * Builds Enhanced AST with query
   * Responsibility for building AST delegated to arkts_enhanced_ast library
   */
  static buildEnhancedAST(content: string, fileName: string): EnhancedASTWithQuery {
    // Dynamic import for lazy loading
    // TypeScript is also imported inside arkts_enhanced_ast
    const ts = require('typescript');
    const { createEnhancedASTWithQuery } = require('../arkts_enhanced_ast');

    // Create standard TypeScript AST (used as parser)
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Build Enhanced AST with query through arkts_enhanced_ast library
    return createEnhancedASTWithQuery(sourceFile, {
      preserveComments: true,
      preserveWhitespace: false,
      enableDiagnostics: false
    });
  }
}

export class LineLengthFormatter {
  private formatterConfig: FormatterConfig;
  private lineLengthConfig: LineLengthConfig;
  private strategies: FormattingStrategy[];
  private transformationManager: TransformationManager;

  constructor(formatterConfig: FormatterConfig, lineLengthConfig: LineLengthConfig) {
    this.formatterConfig = formatterConfig;
    this.lineLengthConfig = lineLengthConfig;
    this.transformationManager = new TransformationManager();

    // Initialize strategies in priority order
    this.strategies = [
      new EnhancedASTFormattingStrategy()
    ].sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Main formatting method
   * ARCHITECTURE: Single-pass formatting without AST rebuilding
   */
  public format(content: string, contentType: ContentType, providedContext?: FormattingContext): string {
    // 1. Content type passed explicitly by caller; context can be passed or will be built

    // 2. Get context: use provided or build ONCE
    const context = providedContext ?? this.createFormattingContext(content, contentType);

    // 3. Apply formatting in ONE PASS
    // Internal loop in selectOptimalBreakPoints already splits
    // very long lines completely (up to 5 wraps per line)
    const { result } = this.applyFormatting(content, context, contentType);

    if (cancellationToken.isCancelled()) {
      return content;
    }

    // 3.5. POST-PROCESSING: Wrap long comments (simple regexp)
    const resultWithComments = this.wrapLongComments(result, context);

    // 4. Validate result (use same context)
    const validation = ResultValidator.validate(content, resultWithComments, context, context.fileName);

    // 5. If validation failed - rollback to original code
    if (!validation.isValid) {
      console.warn('\nAST transformation failed validation, rolling back to original code\n');

      // Group errors by line and show details
      const errorsByLine = new Map<number, ValidationIssue[]>();
      for (const issue of validation.issues.filter(i => i.severity === 'error')) {
        if (issue.line !== undefined) {
          if (!errorsByLine.has(issue.line)) {
            errorsByLine.set(issue.line, []);
          }
          errorsByLine.get(issue.line)!.push(issue);
        }
      }

      // Show first 3 problematic lines
      const sortedLines = Array.from(errorsByLine.keys()).sort((a, b) => a - b).slice(0, 3);
      const originalLines = content.split('\n');
      const formattedLines = result.split('\n');

      console.warn('First 3 issues:');

      if (sortedLines.length > 0) {
        // If there are errors with line numbers - show them
      for (const lineNum of sortedLines) {
        const issues = errorsByLine.get(lineNum) || [];
        const lineIdx = lineNum - 1; // 0-based index

        console.warn(`\n  Line ${lineNum}:`);
        for (const issue of issues) {
          console.warn(`    ${issue.type}: ${issue.message}`);
        }

        // Show original and result (if line exists)
        if (lineIdx >= 0 && lineIdx < originalLines.length) {
          const origLine = originalLines[lineIdx] || '';
          console.warn(`    Original: ${origLine.substring(0, 100)}${origLine.length > 100 ? '...' : ''}`);
        }

        if (lineIdx >= 0 && lineIdx < formattedLines.length) {
          const formLine = formattedLines[lineIdx] || '';
          const origLine = originalLines[lineIdx] || '';
          if (formLine !== origLine) {
            console.warn(`    Result: ${formLine.substring(0, 100)}${formLine.length > 100 ? '...' : ''}`);
            }
          }
        }
      } else {
        // Fallback: if no errors with line numbers, show first errors from general list
        const errorIssues = validation.issues.filter(i => i.severity === 'error').slice(0, 3);
        for (const issue of errorIssues) {
          console.warn(`\n  ${issue.type}: ${issue.message}`);
        }

        // Show normalized code fragments for comparison
        if (validation.normalized) {
          const origNorm = validation.normalized.original;
          const formNorm = validation.normalized.formatted;

          // Find first difference
          let diffPos = -1;
          const minLen = Math.min(origNorm.length, formNorm.length);
          for (let i = 0; i < minLen; i++) {
            if (origNorm[i] !== formNorm[i]) {
              diffPos = i;
              break;
            }
          }

          if (diffPos >= 0) {
            const contextStart = Math.max(0, diffPos - 50);
            const contextEnd = Math.min(origNorm.length, diffPos + 150);
            const origContext = origNorm.substring(contextStart, contextEnd);
            const formContext = formNorm.substring(contextStart, Math.min(formNorm.length, contextEnd));

            console.warn(`\n  First difference at position ${diffPos} (showing ±50 characters context):`);
            console.warn(`\n  Original:`);
            console.warn(`    ...${origContext.replace(/\n/g, '\\n').replace(/\s+/g, ' ')}...`);
            console.warn(`\n  Result:`);
            console.warn(`    ...${formContext.replace(/\n/g, '\\n').replace(/\s+/g, ' ')}...`);
          } else if (origNorm.length !== formNorm.length) {
            console.warn(`\n  Lengths differ: ${origNorm.length} vs ${formNorm.length}`);
            console.warn(`\n  End of original:`);
            console.warn(`    ...${origNorm.substring(Math.max(0, origNorm.length - 100)).replace(/\n/g, '\\n')}...`);
            console.warn(`\n  End of result:`);
            console.warn(`    ...${formNorm.substring(Math.max(0, formNorm.length - 100)).replace(/\n/g, '\\n')}...`);
          }
        }
      }

      console.warn(''); // Empty line for readability
      return content;
    }

    // 6. If validation passed - return result
    return resultWithComments;
  }

  /**
   * Wraps long comments using simple regexp
   */
  private wrapLongComments(content: string, context: FormattingContext): string {
    const lines = content.split('\n');
    const maxLength = context.maxLineLength;

    const result: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip short lines
      if (line.length <= maxLength) {
        result.push(line);
        continue;
      }

      // Handle single-line comments //
      if (trimmed.startsWith('//')) {
        const wrapped = this.wrapSingleLineComment(line, maxLength);
        result.push(...wrapped);
        continue;
      }

      // Handle multi-line comment continuations (lines starting with *)
      if (trimmed.startsWith('*') && !trimmed.startsWith('*/')) {
        const wrapped = this.wrapMultiLineCommentContinuation(line, maxLength);
        result.push(...wrapped);
        continue;
      }

      // Handle block comments /* ... */
      if (trimmed.startsWith('/*')) {
        const wrapped = this.wrapBlockComment(line, maxLength);
        result.push(...wrapped);
        continue;
      }

      // Not a comment - leave as is
      result.push(line);
    }

    return result.join('\n');
  }

  /**
   * Wraps single-line comment //
   */
  private wrapSingleLineComment(line: string, maxLength: number): string[] {
    const indent = line.substring(0, line.indexOf('//'));
    const trimmed = line.trim();
    const commentContent = trimmed.substring(2).trim();

    if (commentContent.length === 0) {
      return [line];
    }

    const commentPrefix = indent + '// ';
    const availableLength = maxLength - commentPrefix.length;

    if (availableLength < 20) {
      return [line];
    }

    return this.wrapCommentText(commentContent, commentPrefix, availableLength);
  }

  /**
   * Wraps multi-line comment continuation ( * ...)
   */
  private wrapMultiLineCommentContinuation(line: string, maxLength: number): string[] {
    const indent = line.substring(0, line.indexOf('*'));
    const trimmed = line.trim();
    const commentContent = trimmed.substring(1).trim(); // Remove * and spaces

    if (commentContent.length === 0) {
      return [line];
    }

    const commentPrefix = indent + ' * ';
    const availableLength = maxLength - commentPrefix.length;

    if (availableLength < 20) {
      return [line];
    }

    return this.wrapCommentText(commentContent, commentPrefix, availableLength);
  }

  /**
   * Wraps block comment slash-star ... star-slash
   */
  private wrapBlockComment(line: string, maxLength: number): string[] {
    const indent = line.substring(0, line.indexOf('/*'));
    const trimmed = line.trim();

    // Check if comment closes on same line
    const hasClosing = trimmed.endsWith('*/');

    if (!hasClosing) {
      // Multi-line comment starts but doesn't end - leave as is
      return [line];
    }

    // Extract content between /* and */
    let commentContent = trimmed.substring(2, trimmed.length - 2).trim();

    if (commentContent.length === 0) {
      return [line];
    }

    // For JSDoc comments (/** ... */)
    const isJSDoc = trimmed.startsWith('/**');
    const openingPrefix = isJSDoc ? '/**' : '/*';

    const firstLinePrefix = indent + openingPrefix + ' ';
    const continuationPrefix = indent + ' * ';
    const availableFirstLine = maxLength - firstLinePrefix.length;
    const availableContinuation = maxLength - continuationPrefix.length - 3; // -3 for " */"

    if (availableFirstLine < 20 || availableContinuation < 20) {
      return [line];
    }

    // Split content into words
    const words = commentContent.split(/\s+/);
    const result: string[] = [];
    let currentLine = '';
    let isFirstLine = true;

    for (const word of words) {
      if (!word) continue;

      const testLine = currentLine ? currentLine + ' ' + word : word;
      const available = isFirstLine ? availableFirstLine : availableContinuation;

      if (testLine.length <= available) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          if (isFirstLine) {
            result.push(firstLinePrefix + currentLine);
            isFirstLine = false;
          } else {
            result.push(continuationPrefix + currentLine);
          }
          currentLine = word;
        } else {
          // Even single word doesn't fit
          if (isFirstLine) {
            result.push(firstLinePrefix + word);
            isFirstLine = false;
          } else {
            result.push(continuationPrefix + word);
          }
        }
      }
    }

    // Add last line with closing */
    if (currentLine) {
      if (isFirstLine) {
        // Everything fit on one line - return as is
        result.push(firstLinePrefix + currentLine + ' */');
      } else {
        result.push(continuationPrefix + currentLine + ' */');
      }
    } else if (result.length > 0) {
      // Close comment
      result[result.length - 1] += ' */';
    }

    return result.length > 0 ? result : [line];
  }

  /**
   * Helper method: wraps comment text into lines
   */
  private wrapCommentText(text: string, prefix: string, availableLength: number): string[] {
    const words = text.split(/\s+/);
    const result: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;

      const testLine = currentLine ? currentLine + ' ' + word : word;

      if (testLine.length <= availableLength) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          result.push(prefix + currentLine);
          currentLine = word;
        } else {
          // Even single word doesn't fit
          result.push(prefix + word);
        }
      }
    }

    if (currentLine) {
      result.push(prefix + currentLine);
    }

    return result.length > 0 ? result : [];
  }

  /**
   * Creates formatting context
   * ARCHITECTURE: Enhanced AST building delegated to ASTBuilder,
   * which encapsulates call to libs/arkts_enhanced_ast
   */
  private createFormattingContext(content: string, contentType: ContentType): FormattingContext {
    const fileName = contentType === ContentType.ARKTS
      ? 'temp.ets'
      : contentType === ContentType.TSX
        ? 'temp.tsx'
        : 'temp.ts';

    // Build Enhanced AST through ASTBuilder utility
    // Responsibility for building AST lies with libs/arkts_enhanced_ast
    const enhancedAST = ASTBuilder.buildEnhancedAST(content, fileName);

    return {
      enhancedAST,
      content,
      lines: content.split('\n'),
      formatterConfig: this.formatterConfig,
      lineLengthConfig: this.lineLengthConfig,
      maxLineLength: this.lineLengthConfig.maxLineLength,
      indentUnit: getIndentUnit(this.formatterConfig.useTabs, this.formatterConfig.tabSize),
      fileName
    };
  }



  /**
   * Applies formatting using strategies
   * Apply immediately from end to beginning, validating each step
   */
  private applyFormatting(content: string, context: FormattingContext, _contentType: ContentType): {
    result: string; processedLines: number; unbreakableLongLines: number } {
    let currentContent = content;
    let processedLines = 0;
    let unbreakableLongLines = 0;

    let lines = currentContent.split('\n');
    let i = lines.length - 1;

    while (i >= 0) {
      if (cancellationToken.isCancelled()) {
        break;
      }

      const line = lines[i] ?? '';

      if (line.length > context.maxLineLength) {
        let handled = false;

        for (const strategy of this.strategies) {
          if (cancellationToken.isCancelled()) {
            break;
          }
          if (!strategy.canHandle(line, i, context)) continue;
          const stratResult = strategy.format(line, i, context);
          if (!stratResult.success || stratResult.lineBreaks.length === 0) continue;

          this.transformationManager.clear();
          const transformations = this.convertLineBreaksToTransformations(stratResult.lineBreaks, lines, i);

          for (const t of transformations) {
            const width = t.end - t.start;
            this.transformationManager.addTransformation(t.start, width, t.newText);
          }

          const candidate = this.transformationManager.applyTransformations(currentContent);

          const validation = ResultValidator.validate(content, candidate, context, context.fileName);
          if (validation.isValid) {
            currentContent = candidate;
            lines = currentContent.split('\n');
            processedLines++;
            handled = true;
            break;
          }
        }

        if (!handled) {
          unbreakableLongLines++;
        }
      }

      i--;
    }

    return { result: currentContent, processedLines, unbreakableLongLines };
  }


  /**
   * Gets formatting statistics
   */
  public getFormattingStats(original: string, formatted: string): FormattingStats {
    const originalLines = original.split('\n');
    const formattedLines = formatted.split('\n');
    const maxLength = this.lineLengthConfig.maxLineLength;

    let originalLongLines = 0;
    let formattedLongLines = 0;
    let improvedLines = 0;

    originalLines.forEach(line => {
      if (line.length > maxLength) originalLongLines++;
    });

    formattedLines.forEach(line => {
      if (line.length > maxLength) formattedLongLines++;
    });

    // Count improved lines
    for (let i = 0; i < Math.min(originalLines.length, formattedLines.length); i++) {
      const originalLength = originalLines[i]?.length || 0;
      const formattedLength = formattedLines[i]?.length || 0;

      if (originalLength > maxLength && formattedLength <= maxLength) {
        improvedLines++;
      }
    }

    return {
      originalLongLines,
      formattedLongLines,
      improvedLines,
      totalLines: formattedLines.length,
      improvementRatio: originalLongLines > 0 ? improvedLines / originalLongLines : 0
    };
  }

  /**
   * Checks if formatting is needed
   */
  public needsFormatting(content: string): boolean {
    const lines = content.split('\n');
    return lines.some(line => line.length > this.lineLengthConfig.maxLineLength);
  }

  /**
   * Gets list of long lines
   */
  public getLongLines(content: string): LongLineInfo[] {
    const lines = content.split('\n');
    const longLines: LongLineInfo[] = [];

    lines.forEach((line, index) => {
      if (line.length > this.lineLengthConfig.maxLineLength) {
        longLines.push({
          lineNumber: index + 1,
          length: line.length,
          content: line,
          excess: line.length - this.lineLengthConfig.maxLineLength
        });
      }
    });

    return longLines;
  }

  /**
   * Converts line break positions to transformations for applying to text
   * IMPORTANT: AST returns absolute positions in file, we use them directly for insertion
   */
  private convertLineBreaksToTransformations(
    lineBreaks: LineBreakInsertion[],
    lines: string[],
    lineIndex: number
  ): TransformationResult[] {
    const transformations: TransformationResult[] = [];

    if (lineBreaks.length === 0) {
      return transformations;
    }

    // Sort positions descending to apply from end of file
    const sortedBreaks = [...lineBreaks].sort((a, b) => b.position - a.position);

    // Calculate absolute offset of current line start
    let lineStartOffset = 0;
    for (let j = 0; j < lineIndex; j++) {
      // +1 for newline character \n between lines
      lineStartOffset += (lines[j]?.length ?? 0) + 1;
    }

    const contentText = lines.join('\n');

    for (const lineBreak of sortedBreaks) {
      // Create indent using configuration value
      const indentChar = this.formatterConfig.useTabs ? '\t' : ' ';
      const indentSize = this.formatterConfig.useTabs ? 1 : this.formatterConfig.tabSize;
      const indent = indentChar.repeat(lineBreak.indentLevel * indentSize);

      // Trim spaces around break point within line
      let start = lineBreak.position;
      let end = lineBreak.position;

      // Current line boundaries in absolute coordinates
      const currentLineText = lines[lineIndex] ?? '';
      const lineEndOffset = lineStartOffset + currentLineText.length;

      // Trim spaces/tabs to the right of position
      if (contentText) {
        while (end < lineEndOffset) {
          const ch = contentText.charAt(end);
          if (ch === ' ' || ch === '\t') {
            end++;
          } else {
            break;
          }
        }
      }

      // Trim spaces/tabs to the left of position
      if (contentText) {
        while (start > lineStartOffset) {
          const ch = contentText.charAt(start - 1);
          if (ch === ' ' || ch === '\t') {
            start--;
          } else {
            break;
          }
        }
      }

      // Replace range [start, end) with newline and indent
      // Special case: insertion exactly at end of line — consume existing newline,
      // so empty visual row doesn't form
      if (lineBreak.position === lineEndOffset && contentText.charAt(lineEndOffset) === '\n') {
        end = Math.max(end, lineEndOffset + 1);
      }

      transformations.push({
        start,
        end,
        newText: '\n' + indent
      });

    }

    return transformations;
  }

}

export interface FormattingStats {
  originalLongLines: number;
  formattedLongLines: number;
  improvedLines: number;
  totalLines: number;
  improvementRatio: number;
}

export interface LongLineInfo {
  lineNumber: number;
  length: number;
  content: string;
  excess: number;
}
