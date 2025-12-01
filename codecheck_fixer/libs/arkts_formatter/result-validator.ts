/**
 * Валидатор результатов форматирования
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
      message: 'Валидация прервана пользователем',
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
   * Валидирует результат форматирования
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

    // 1. Проверка синтаксиса (только для TS, для ArkTS отключена)
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

    // 2. Проверка семантической эквивалентности (основной алгоритм валидации)
    const semanticValidation = this.validateSemanticEquivalence(original, formatted, filePath, context);
    issues.push(...semanticValidation.issues);

    // 3. Проверка длины строк (временно отключена - проверяем только измененные строки)
    // const lineLengthValidation = this.validateLineLength(formatted, context);
    // issues.push(...lineLengthValidation.issues);

    // 4. Проверка регрессий (только если есть изменения)
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
   * Проверяет синтаксическую корректность
   */
  private static validateSyntax(
    content: string,
    _context: FormattingContext
  ): { isValid: boolean; issues: ValidationIssue[]; diagnostics: readonly ts.Diagnostic[] } {
    const issues: ValidationIssue[] = [];
    let diagnostics: readonly ts.Diagnostic[] = [];

    try {
      // Создаем временный SourceFile для проверки синтаксиса
      const sourceFile = ts.createSourceFile(
        'temp.ts',
        content,
        ts.ScriptTarget.Latest,
        true
      );

      // Проверяем наличие синтаксических ошибок
      diagnostics = (sourceFile as any).parseDiagnostics || [];
      
      for (const diagnostic of diagnostics) {
        const line = diagnostic.file 
          ? ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0).line + 1
          : undefined;

        issues.push({
          type: 'syntax_error',
          message: `Синтаксическая ошибка: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
          line,
          severity: 'error'
        });
      }
    } catch (error) {
      issues.push({
        type: 'syntax_error',
        message: `Критическая ошибка парсинга: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * Проверяет семантическую эквивалентность: если убрать переносы, отступы и комментарии,
   * должно получиться то же самое (строки сохраняются)
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
      // 1. Проверяем код без комментариев
      const normalizedOriginal = this.getOrNormalizeOriginal(context, original);
      this.ensureNotCancelled();
      const normalizedFormatted = this.normalizeCode(formatted);

      // DEBUG (опционально): запись нормализованных версий отключена по умолчанию
      // Для включения задайте переменную окружения CCF_WRITE_DEBUG=1
      // if (process.env.CCF_WRITE_DEBUG === '1' && filePath) { ... }

      if (normalizedOriginal !== normalizedFormatted) {
        // Семантическая разница обнаружена
          issues.push({
            type: 'semantic_change',
            message: 'Трансформация изменила семантику кода',
            severity: 'error'
          });
        
        // Возвращаем normalized данные для диагностики
        return { 
          issues, 
          normalized: { 
            original: normalizedOriginal, 
            formatted: normalizedFormatted 
          } 
        };
      }

      this.ensureNotCancelled();
      // 2. Проверяем комментарии отдельно (пока заглушка)
      const commentsValid = this.validateComments(original, formatted);
      if (!commentsValid) {
        issues.push({
          type: 'semantic_change',
          message: 'Трансформация некорректно обработала комментарии',
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
        message: `Ошибка при проверке семантической эквивалентности: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * Проверяет корректность обработки комментариев (заглушка)
   */
  private static validateComments(_original: string, _formatted: string): boolean {
    // TODO: Реализовать проверку комментариев
    // Пока всегда возвращаем true (комментарии считаются корректными)
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
   * Нормализует код: убирает переносы, отступы и комментарии, сохраняет строки
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

      // Обработка многострочных комментариев - УБИРАЕМ их
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

      // Обработка однострочных комментариев - УБИРАЕМ их
      if (!inString && !inMultiLineComment && char === '/' && nextChar === '/') {
        inComment = true;
        i += 2;
        continue;
      }

      if (inComment && char === '\n') {
        // Завершение однострочного комментария: перенос входит в конструкцию комментария и удаляется вместе с ним
        inComment = false;
        i++;
        continue;
      }

      // Если мы в комментарии - пропускаем символы
      if (inComment || inMultiLineComment) {
        i++;
        continue;
      }

      // Обработка строк - СОХРАНЯЕМ как есть
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

      // Если мы в строке - сохраняем как есть
      if (inString) {
        append(char);
        i++;
        continue;
      }

      // Схлопываем whitespace последовательности, различая значащие/незначащие переносы и пробелы
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        let hadNewline = false;
        // Собираем ВСЮ последовательность whitespace
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
        
        // Незначащие пробелы всегда удаляются (ничего не добавляем),
        // значащие пробелы превращаются в один пробел, а значащие переносы — сохраняются как перенос
        const nextNonWs = i < code.length ? code.charAt(i) : '';

        if (hadNewline && keywordNeedsLineBreak(lastWord)) {
          append('\n');
          continue;
        }
        
        // Значащий пробел между двумя «словами» (идентификаторы/числа/доллар/подчерк)
        if (this.needsSpaceBetween(lastCharOut, nextNonWs)) {
          append(' ');
        }
        // Во всех остальных случаях пробелы/переносы удаляются
        continue;
      }

      // Обычные символы кода
      append(char);
      i++;
    }

    return builder.join('').trim();
  }

  /**
   * Определяет, нужен ли пробел между двумя символами
   * Используется для определения значащих переносов строк
   */
  private static needsSpaceBetween(prev: string, next: string): boolean {
    // Если один из символов пустой - пробел не нужен
    if (!prev || !next) {
      return false;
    }
    
    // Проверяем являются ли символы буквенно-цифровыми (идентификаторы, ключевые слова, числа)
    const isAlphaNum = (c: string) => /[a-zA-Z0-9_$]/.test(c);
    
    // Если оба символа буквенно-цифровые - нужен пробел как разделитель
    // Примеры: const\na → const a, return\nvalue → return value
    if (isAlphaNum(prev) && isAlphaNum(next)) {
      return true;
    }
    
    // Во всех остальных случаях пробел не нужен:
    // - Скобки: (\n  → (
    // - Операторы: +\n  → +
    // - Точка с запятой: ;\n → ;
    return false;
  }

  // /**
  //  * Проверяет длину строк (временно не используется)
  //  */
  // private static _validateLineLength(
  //   _content: string,
  //   _context: FormattingContext
  // ): { issues: ValidationIssue[] } {
  //   // Временно отключено - проверяем только измененные строки
  //   return { issues: [] };
  // }

  /**
   * Проверяет регрессии в форматировании
   */
  private static validateRegressions(
    originalLines: string[],
    formattedLines: string[],
    context: FormattingContext
  ): { issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // Проверяем, что форматирование не сделало ситуацию хуже
    let worsenedCount = 0;
    const maxLength = context.maxLineLength;

    for (let i = 0; i < Math.min(originalLines.length, formattedLines.length); i++) {
      const originalLength = originalLines[i]?.length || 0;
      const formattedLength = formattedLines[i]?.length || 0;

      if (originalLength > maxLength && formattedLength > originalLength) {
        worsenedCount++;
        issues.push({
          type: 'regression',
          message: `Строка ${i + 1} стала длиннее после форматирования (${originalLength} -> ${formattedLength})`,
          line: i + 1,
          severity: 'warning'
        });
      }
    }

    // Проверяем новые длинные строки
    for (let i = originalLines.length; i < formattedLines.length; i++) {
      const lineLength = formattedLines[i]?.length || 0;
      if (lineLength > maxLength) {
        issues.push({
          type: 'regression',
          message: `Новая строка ${i + 1} превышает максимальную длину (${lineLength})`,
          line: i + 1,
          severity: 'warning'
        });
      }
    }

    return { issues };
  }

  // /**
  //  * Проверяет общее качество форматирования
  //  */
  // private static _validateQuality(_metrics: ValidationMetrics): { issues: ValidationIssue[] } {
  //   // Временно отключено
  //   return { issues: [] };
  // }

  /**
   * Вычисляет метрики валидации
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

    // Подсчитываем длинные строки в оригинале
    originalSplit.forEach(line => {
      if (line.length > maxLength) {
        originalLongLines++;
      }
    });

    // Подсчитываем длинные строки в результате
    formattedSplit.forEach(line => {
      if (line.length > maxLength) {
        resultLongLines++;
      }
    });

    // Анализируем изменения построчно
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

    // Проверяем синтаксис
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
  //  * Проверяет, является ли длинная строка допустимой
  //  */
  // private static _isAcceptableLongLine(line: string): boolean {
  //   const trimmed = line.trim();
  //   
  //   // URL в комментариях
  //   if (trimmed.startsWith('//') && /https?:\/\//.test(trimmed)) {
  //     return true;
  //   }
  //
  //   // Длинные строковые литералы
  //   if (trimmed.startsWith('"') && trimmed.endsWith('"') ||
  //       trimmed.startsWith("'") && trimmed.endsWith("'") ||
  //       trimmed.startsWith('`') && trimmed.endsWith('`')) {
  //     return true;
  //   }
  //
  //   // Импорты с длинными путями
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
