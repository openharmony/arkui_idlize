/**
 * Formatting result validator
 */

import * as ts from 'typescript';
import { FormattingContext } from './types';
import { cancellationToken } from '../common/cancellation';

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  metrics: ValidationMetrics;
  normalized?: {
    original: string;
    formatted: string;
  };
}

export interface ValidationIssue {
  type: 'syntax_error' | 'line_length' | 'formatting' | 'regression' | 'semantic_change' | 'validation_error';
  message: string;
  line?: number | undefined;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationMetrics {
  originalLongLines: number;
  resultLongLines: number;
  improvedLines: number;
  worsenedLines: number;
  totalLines: number;
  syntaxValid: boolean;
}

export class ResultValidator {
  private static normalizedOriginalCache = new WeakMap<object, string>();

  private static createCancellationIssue(): ValidationIssue {
    return {
      type: 'validation_error',
      message: 'Validation interrupted by user',
      severity: 'error'
    };
  }

  private static ensureNotCancelled(): void {
    if (!cancellationToken.isCancelled()) {
      return;
    }

    throw new ValidationCancelledError();
  }

  /**
   * Validates formatting result
   */
static validate(
    original: string,
    formatted: string,
    context: FormattingContext,
    filePath?: string
  ): ValidationResult {
    const issues: ValidationIssue[] = [];

    const checkCancellation = () => {
      try {
        this.ensureNotCancelled();
        return null;
      } catch (error) {
        if (error instanceof ValidationCancelledError) {
          return this.createCancellationIssue();
        }
        throw error;
      }
    };

    const cancellationIssue = checkCancellation();
    if (cancellationIssue) {
      return {
        isValid: false,
        issues: [cancellationIssue],
        metrics: {
          originalLongLines: 0,
          resultLongLines: 0,
          improvedLines: 0,
          worsenedLines: 0,
          totalLines: 0,
          syntaxValid: false
        }
      };
    }

    const originalLines = original.split('\n');
    const formattedLines = formatted.split('\n');

    let syntaxDiagnostics: readonly ts.Diagnostic[] | undefined;

    const isArkTs = this.isArkTsContent(original) || context.fileName.endsWith('.ets');

    // 1. Syntax check (only for TS, disabled for ArkTS)
    if (!isArkTs && (context.fileName.endsWith('.ts') || context.fileName.endsWith('.tsx'))) {
      const syntaxValidation = this.validateSyntax(formatted, context);
      syntaxDiagnostics = syntaxValidation.diagnostics;
      if (!syntaxValidation.isValid) {
        issues.push(...syntaxValidation.issues);
      }
    }

    const metrics = this.calculateMetrics(
      original,
      formatted,
      context,
      syntaxDiagnostics,
      originalLines,
      formattedLines
    );

    const cancellationIssueAfterMetrics = checkCancellation();
    if (cancellationIssueAfterMetrics) {
      return {
        isValid: false,
        issues: [...issues, cancellationIssueAfterMetrics],
        metrics
      };
    }

    // 2. Semantic equivalence check (main validation algorithm)
    const semanticValidation = this.validateSemanticEquivalence(original, formatted, filePath, context);
    issues.push(...semanticValidation.issues);

    // 3. Line length check (temporarily disabled - check only modified lines)
    // const lineLengthValidation = this.validateLineLength(formatted, context);
    // issues.push(...lineLengthValidation.issues);

    // 4. Regression check (only if there are changes)
    if (original !== formatted) {
      const cancellationBeforeRegressions = checkCancellation();
      if (cancellationBeforeRegressions) {
        return {
          isValid: false,
          issues: [...issues, cancellationBeforeRegressions],
          metrics
        };
      }

      const regressionValidation = this.validateRegressions(originalLines, formattedLines, context);
      issues.push(...regressionValidation.issues);
    }

    const isValid = issues.filter(i => i.severity === 'error').length === 0;

    const result: ValidationResult = {
      isValid,
      issues,
      metrics
    };

    if (semanticValidation.normalized) {
      result.normalized = semanticValidation.normalized;
    }

    return result;
  }

  /**
   * Checks syntax correctness
   */
  private static validateSyntax(
    content: string,
    _context: FormattingContext
  ): { isValid: boolean; issues: ValidationIssue[]; diagnostics: readonly ts.Diagnostic[] } {
    const issues: ValidationIssue[] = [];
    let diagnostics: readonly ts.Diagnostic[] = [];

    try {
      // Create temporary SourceFile for syntax check
      const sourceFile = ts.createSourceFile(
        'temp.ts',
        content,
        ts.ScriptTarget.Latest,
        true
      );

      // Check for syntax errors
      diagnostics = (sourceFile as any).parseDiagnostics || [];
      
      for (const diagnostic of diagnostics) {
        const line = diagnostic.file 
          ? ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0).line + 1
          : undefined;

        issues.push({
          type: 'syntax_error',
          message: `Syntax error: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
          line,
          severity: 'error'
        });
      }
    } catch (error) {
      issues.push({
        type: 'syntax_error',
        message: `Critical parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      diagnostics
    };
  }

  /**
   * Checks semantic equivalence: if you remove newlines, indents and comments,
   * should get the same thing (strings are preserved)
   */
  private static validateSemanticEquivalence(
    original: string,
    formatted: string,
    _filePath: string | undefined,
    context: FormattingContext
  ): { issues: ValidationIssue[]; normalized?: { original: string; formatted: string } } {
    const issues: ValidationIssue[] = [];

    try {
      this.ensureNotCancelled();
      // 1. Check code without comments
      const normalizedOriginal = this.getOrNormalizeOriginal(context, original);
      this.ensureNotCancelled();
      const normalizedFormatted = this.normalizeCode(formatted);

      // DEBUG (optional): writing normalized versions disabled by default
      // To enable set environment variable CCF_WRITE_DEBUG=1
      // if (process.env.CCF_WRITE_DEBUG === '1' && filePath) { ... }

      if (normalizedOriginal !== normalizedFormatted) {
        // Semantic difference detected
          issues.push({
            type: 'semantic_change',
            message: 'Transformation changed code semantics',
            severity: 'error'
          });
        
        // Return normalized data for diagnostics
        return { 
          issues, 
          normalized: { 
            original: normalizedOriginal, 
            formatted: normalizedFormatted 
          } 
        };
      }

      this.ensureNotCancelled();
      // 2. Check comments separately (placeholder for now)
      const commentsValid = this.validateComments(original, formatted);
      if (!commentsValid) {
        issues.push({
          type: 'semantic_change',
          message: 'Transformation incorrectly handled comments',
          severity: 'error'
        });
      }
    } catch (error) {
      if (error instanceof ValidationCancelledError) {
        return {
          issues: [this.createCancellationIssue()]
        };
      }

      issues.push({
        type: 'validation_error',
        message: `Error during semantic equivalence check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }

    return { issues };
  }

  private static getOrNormalizeOriginal(context: FormattingContext, original: string): string {
    const cacheKey = context.enhancedAST || context;
    if (this.normalizedOriginalCache.has(cacheKey)) {
      return this.normalizedOriginalCache.get(cacheKey)!;
    }
    const normalized = this.normalizeCode(original);
    this.normalizedOriginalCache.set(cacheKey, normalized);
    return normalized;
  }

  /**
   * Checks comment handling correctness (placeholder)
   */
  private static validateComments(_original: string, _formatted: string): boolean {
    // TODO: Implement comment validation
    // For now always return true (comments considered correct)
    return true;
  }

  private static isArkTsContent(content: string): boolean {
    const sample = content.length > 200000 ? content.slice(0, 200000) : content;
    const patterns = [
      /\bnative\s+(static|async|let|const|function)\b/,
      /@Entry\b/,
      /@Component\b/,
      /@State\b/,
      /@Prop\b/,
      /@Link\b/,
      /@Provide\b/,
      /@Consume\b/,
      /@Observed\b/,
      /@ObjectLink\b/,
      /\bstruct\s+[A-Z]\w*\s*\{/,
      /\bfinal\s+class\b/,
      /\boverload\s+[A-Za-z_]/,
      /\boverride\s+[A-Za-z_]/,
      /\bpublic\s+override\b/,
      /\bprivate\s+override\b/,
      /:\s*(int|short|long|byte|char|float|double)\b/,
      /\bas\s*\(\)\s*=>/
    ];
    return patterns.some(pattern => pattern.test(sample));
  }

  /**
   * Normalizes code: removes newlines, indents and comments, preserves strings
   */
  private static normalizeCode(code: string): string {
    const builder: string[] = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inMultiLineComment = false;
    let i = 0;
    let lastWord = '';
    let lastCharOut = '';

    const append = (ch: string) => {
      builder.push(ch);
      lastCharOut = ch;
      if (/[a-zA-Z0-9_$]/.test(ch)) {
        lastWord += ch;
      } else {
        lastWord = '';
      }
    };

    const keywordNeedsLineBreak = (w: string) => w === 'return' || w === 'throw' || w === 'break' || w === 'continue' || w === 'yield';

    while (i < code.length) {
      const char = code.charAt(i);
      const nextChar = code.charAt(i + 1);

      // Handle multi-line comments - REMOVE them
      if (!inString && !inComment && char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        i += 2;
        continue;
      }

      if (inMultiLineComment && char === '*' && nextChar === '/') {
        inMultiLineComment = false;
        i += 2;
        continue;
      }

      // Handle single-line comments - REMOVE them
      if (!inString && !inMultiLineComment && char === '/' && nextChar === '/') {
        inComment = true;
        i += 2;
        continue;
      }

      if (inComment && char === '\n') {
        // End of single-line comment: newline is part of comment construct and removed with it
        inComment = false;
        i++;
        continue;
      }

      // If we're in a comment - skip characters
      if (inComment || inMultiLineComment) {
        i++;
        continue;
      }

      // Handle strings - PRESERVE as is
      if (char === '"' || char === '\'' || char === '`') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && code.charAt(i - 1) !== '\\') {
          inString = false;
          stringChar = '';
        }
        append(char);
        i++;
        continue;
      }

      // If we're in a string - preserve as is
      if (inString) {
        append(char);
        i++;
        continue;
      }

      // Collapse whitespace sequences, distinguishing significant/insignificant newlines and spaces
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        let hadNewline = false;
        // Collect ENTIRE whitespace sequence
        while (i < code.length) {
          const wsChar = code.charAt(i);
          if (wsChar === ' ' || wsChar === '\t') {
            i++;
            continue;
          }
          if (wsChar === '\n' || wsChar === '\r') {
            hadNewline = true;
            i++;
            continue;
          }
          break;
        }
        
        // Insignificant spaces always removed (add nothing),
        // significant spaces converted to single space, and significant newlines — preserved as newline
        const nextNonWs = i < code.length ? code.charAt(i) : '';

        if (hadNewline && keywordNeedsLineBreak(lastWord)) {
          append('\n');
          continue;
        }
        
        // Significant space between two "words" (identifiers/numbers/dollar/underscore)
        if (this.needsSpaceBetween(lastCharOut, nextNonWs)) {
          append(' ');
        }
        // In all other cases spaces/newlines are removed
        continue;
      }

      // Regular code characters
      append(char);
      i++;
    }

    return builder.join('').trim();
  }

  /**
   * Determines if space is needed between two characters
   * Used to determine significant newlines
   */
  private static needsSpaceBetween(prev: string, next: string): boolean {
    // If one of characters is empty - space not needed
    if (!prev || !next) {
      return false;
    }
    
    // Check if characters are alphanumeric (identifiers, keywords, numbers)
    const isAlphaNum = (c: string) => /[a-zA-Z0-9_$]/.test(c);
    
    // If both characters are alphanumeric - space needed as separator
    // Examples: const\na → const a, return\nvalue → return value
    if (isAlphaNum(prev) && isAlphaNum(next)) {
      return true;
    }
    
    // In all other cases space not needed:
    // - Brackets: (\n  → (
    // - Operators: +\n  → +
    // - Semicolon: ;\n → ;
    return false;
  }

  // /**
  //  * Checks line length (temporarily not used)
  //  */
  // private static _validateLineLength(
  //   _content: string,
  //   _context: FormattingContext
  // ): { issues: ValidationIssue[] } {
  //   // Temporarily disabled - check only modified lines
  //   return { issues: [] };
  // }

  /**
   * Checks formatting regressions
   */
  private static validateRegressions(
    originalLines: string[],
    formattedLines: string[],
    context: FormattingContext
  ): { issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // Check that formatting didn't make situation worse
    let worsenedCount = 0;
    const maxLength = context.maxLineLength;

    for (let i = 0; i < Math.min(originalLines.length, formattedLines.length); i++) {
      const originalLength = originalLines[i]?.length || 0;
      const formattedLength = formattedLines[i]?.length || 0;

      if (originalLength > maxLength && formattedLength > originalLength) {
        worsenedCount++;
        issues.push({
          type: 'regression',
          message: `Line ${i + 1} became longer after formatting (${originalLength} -> ${formattedLength})`,
          line: i + 1,
          severity: 'warning'
        });
      }
    }

    // Check new long lines
    for (let i = originalLines.length; i < formattedLines.length; i++) {
      const lineLength = formattedLines[i]?.length || 0;
      if (lineLength > maxLength) {
        issues.push({
          type: 'regression',
          message: `New line ${i + 1} exceeds maximum length (${lineLength})`,
          line: i + 1,
          severity: 'warning'
        });
      }
    }

    return { issues };
  }

  // /**
  //  * Checks overall formatting quality
  //  */
  // private static _validateQuality(_metrics: ValidationMetrics): { issues: ValidationIssue[] } {
  //   // Temporarily disabled
  //   return { issues: [] };
  // }

  /**
   * Calculates validation metrics
   */
  private static calculateMetrics(
    original: string,
    formatted: string,
    context: FormattingContext,
    syntaxDiagnostics?: readonly ts.Diagnostic[],
    originalLines?: string[],
    formattedLines?: string[]
  ): ValidationMetrics {
    const originalSplit = originalLines ?? original.split('\n');
    const formattedSplit = formattedLines ?? formatted.split('\n');
    const maxLength = context.maxLineLength;

    let originalLongLines = 0;
    let resultLongLines = 0;
    let improvedLines = 0;
    let worsenedLines = 0;

    // Count long lines in original
    originalSplit.forEach(line => {
      if (line.length > maxLength) {
        originalLongLines++;
      }
    });

    // Count long lines in result
    formattedSplit.forEach(line => {
      if (line.length > maxLength) {
        resultLongLines++;
      }
    });

    // Analyze changes line by line
    for (let i = 0; i < Math.min(originalSplit.length, formattedSplit.length); i++) {
      const originalLength = originalSplit[i]?.length || 0;
      const formattedLength = formattedSplit[i]?.length || 0;

      if (originalLength > maxLength) {
        if (formattedLength <= maxLength) {
          improvedLines++;
        } else if (formattedLength > originalLength) {
          worsenedLines++;
        }
      }
    }

    // Check syntax
    let syntaxValid = true;
    if (context.fileName.endsWith('.ts')) {
      syntaxValid = !syntaxDiagnostics || syntaxDiagnostics.length === 0;
    }

    return {
      originalLongLines,
      resultLongLines,
      improvedLines,
      worsenedLines,
      totalLines: formattedSplit.length,
      syntaxValid
    };
  }

  // /**
  //  * Checks if long line is acceptable
  //  */
  // private static _isAcceptableLongLine(line: string): boolean {
  //   const trimmed = line.trim();
  //   
  //   // URLs in comments
  //   if (trimmed.startsWith('//') && /https?:\/\//.test(trimmed)) {
  //     return true;
  //   }
  //
  //   // Long string literals
  //   if (trimmed.startsWith('"') && trimmed.endsWith('"') ||
  //       trimmed.startsWith("'") && trimmed.endsWith("'") ||
  //       trimmed.startsWith('`') && trimmed.endsWith('`')) {
  //     return true;
  //   }
  //
  //   // Imports with long paths
  //   if (trimmed.startsWith('import') && trimmed.includes('from')) {
  //     return true;
  //   }
  //
  //   return false;
  // }
}

class ValidationCancelledError extends Error {
  constructor() {
    super('Validation cancelled');
  }
}
