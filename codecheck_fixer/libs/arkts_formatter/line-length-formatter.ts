/**
 * Рефакторированный форматтер для разбиения длинных строк
 * Использует AST-first подход с текстовым fallback для ETS файлов
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
 * Утилита для построения Enhanced AST
 * Инкапсулирует зависимость от libs/arkts_enhanced_ast
 * 
 * АРХИТЕКТУРА: Вся ответственность за построение Enhanced AST
 * делегирована библиотеке libs/arkts_enhanced_ast.
 * Этот класс только вызывает её API.
 */
class ASTBuilder {
  /**
   * Строит Enhanced AST с запросником
   * Ответственность за построение AST делегирована библиотеке arkts_enhanced_ast
   */
  static buildEnhancedAST(content: string, fileName: string): EnhancedASTWithQuery {
    // Динамический импорт для отложенной загрузки
    // TypeScript также импортируется внутри arkts_enhanced_ast
    const ts = require('typescript');
    const { createEnhancedASTWithQuery } = require('../arkts_enhanced_ast');
    
    // Создаём стандартный TypeScript AST (используется как парсер)
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Строим Enhanced AST с запросником через библиотеку arkts_enhanced_ast
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
    
    // Инициализируем стратегии в порядке приоритета
    this.strategies = [
      new EnhancedASTFormattingStrategy()
    ].sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Основной метод форматирования
   * АРХИТЕКТУРА: Однопроходное форматирование без перестроения AST
   */
  public format(content: string, contentType: ContentType, providedContext?: FormattingContext): string {
    // 1. Тип контента передается явно вызывающей стороной; контекст можно передать или он будет построен

    // 2. Получаем контекст: используем переданный или строим ОДИН РАЗ
    const context = providedContext ?? this.createFormattingContext(content, contentType);

    // 3. Применяем форматирование за ОДИН ПРОХОД
    // Внутренний цикл в selectOptimalBreakPoints уже разбивает
    // очень длинные строки полностью (до 5 переносов на строку)
    const { result } = this.applyFormatting(content, context, contentType);

    if (cancellationToken.isCancelled()) {
      return content;
    }

    // 3.5. ПОСТ-ОБРАБОТКА: Разбиваем длинные комментарии (простым regexp)
    const resultWithComments = this.wrapLongComments(result, context);

    // 4. Валидируем результат (используем тот же контекст)
    const validation = ResultValidator.validate(content, resultWithComments, context, context.fileName);
    
    // 5. Если валидация не прошла - откатываемся к исходному коду
    if (!validation.isValid) {
      console.warn('\nAST трансформация не прошла валидацию, откатываемся к исходному коду\n');
      
      // Группируем ошибки по строкам и показываем детали
      const errorsByLine = new Map<number, ValidationIssue[]>();
      for (const issue of validation.issues.filter(i => i.severity === 'error')) {
        if (issue.line !== undefined) {
          if (!errorsByLine.has(issue.line)) {
            errorsByLine.set(issue.line, []);
          }
          errorsByLine.get(issue.line)!.push(issue);
        }
      }
      
      // Показываем первые 3 проблемные строки
      const sortedLines = Array.from(errorsByLine.keys()).sort((a, b) => a - b).slice(0, 3);
      const originalLines = content.split('\n');
      const formattedLines = result.split('\n');
      
      console.warn('Первые 3 проблемы:');
      
      if (sortedLines.length > 0) {
        // Если есть ошибки с номерами строк - показываем их
      for (const lineNum of sortedLines) {
        const issues = errorsByLine.get(lineNum) || [];
        const lineIdx = lineNum - 1; // 0-based index
        
        console.warn(`\n  Строка ${lineNum}:`);
        for (const issue of issues) {
          console.warn(`    ${issue.type}: ${issue.message}`);
        }
        
        // Показываем оригинал и результат (если строка существует)
        if (lineIdx >= 0 && lineIdx < originalLines.length) {
          const origLine = originalLines[lineIdx] || '';
          console.warn(`    Оригинал: ${origLine.substring(0, 100)}${origLine.length > 100 ? '...' : ''}`);
        }
        
        if (lineIdx >= 0 && lineIdx < formattedLines.length) {
          const formLine = formattedLines[lineIdx] || '';
          const origLine = originalLines[lineIdx] || '';
          if (formLine !== origLine) {
            console.warn(`    Результат: ${formLine.substring(0, 100)}${formLine.length > 100 ? '...' : ''}`);
            }
          }
        }
      } else {
        // Fallback: если нет ошибок с номерами строк, показываем первые ошибки из общего списка
        const errorIssues = validation.issues.filter(i => i.severity === 'error').slice(0, 3);
        for (const issue of errorIssues) {
          console.warn(`\n  ${issue.type}: ${issue.message}`);
        }
        
        // Показываем фрагменты normalized кода для сравнения
        if (validation.normalized) {
          const origNorm = validation.normalized.original;
          const formNorm = validation.normalized.formatted;
          
          // Находим первое отличие
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
            
            console.warn(`\n  Первое отличие на позиции ${diffPos} (показано ±50 символов контекста):`);
            console.warn(`\n  Оригинал:`);
            console.warn(`    ...${origContext.replace(/\n/g, '\\n').replace(/\s+/g, ' ')}...`);
            console.warn(`\n  Результат:`);
            console.warn(`    ...${formContext.replace(/\n/g, '\\n').replace(/\s+/g, ' ')}...`);
          } else if (origNorm.length !== formNorm.length) {
            console.warn(`\n  Длины различаются: ${origNorm.length} vs ${formNorm.length}`);
            console.warn(`\n  Конец оригинала:`);
            console.warn(`    ...${origNorm.substring(Math.max(0, origNorm.length - 100)).replace(/\n/g, '\\n')}...`);
            console.warn(`\n  Конец результата:`);
            console.warn(`    ...${formNorm.substring(Math.max(0, formNorm.length - 100)).replace(/\n/g, '\\n')}...`);
          }
        }
      }
      
      console.warn(''); // Пустая строка для читаемости
      return content;
    }
    
    // 6. Если валидация прошла - возвращаем результат
    return resultWithComments;
  }

  /**
   * Разбивает длинные комментарии простым regexp-ом
   */
  private wrapLongComments(content: string, context: FormattingContext): string {
    const lines = content.split('\n');
    const maxLength = context.maxLineLength;
    
    const result: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Пропускаем короткие строки
      if (line.length <= maxLength) {
        result.push(line);
        continue;
      }
      
      // Обрабатываем однострочные комментарии //
      if (trimmed.startsWith('//')) {
        const wrapped = this.wrapSingleLineComment(line, maxLength);
        result.push(...wrapped);
        continue;
      }
      
      // Обрабатываем продолжения многострочных комментариев (строки начинающиеся с *)
      if (trimmed.startsWith('*') && !trimmed.startsWith('*/')) {
        const wrapped = this.wrapMultiLineCommentContinuation(line, maxLength);
        result.push(...wrapped);
        continue;
      }
      
      // Обрабатываем блочные комментарии /* ... */
      if (trimmed.startsWith('/*')) {
        const wrapped = this.wrapBlockComment(line, maxLength);
        result.push(...wrapped);
        continue;
      }
      
      // Не комментарий - оставляем как есть
      result.push(line);
    }
    
    return result.join('\n');
  }

  /**
   * Разбивает однострочный комментарий //
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
   * Разбивает продолжение многострочного комментария ( * ...)
   */
  private wrapMultiLineCommentContinuation(line: string, maxLength: number): string[] {
    const indent = line.substring(0, line.indexOf('*'));
    const trimmed = line.trim();
    const commentContent = trimmed.substring(1).trim(); // Убираем * и пробелы
    
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
   * Разбивает блочный комментарий slash-star ... star-slash
   */
  private wrapBlockComment(line: string, maxLength: number): string[] {
    const indent = line.substring(0, line.indexOf('/*'));
    const trimmed = line.trim();
    
    // Проверяем, закрывается ли комментарий на той же строке
    const hasClosing = trimmed.endsWith('*/');
    
    if (!hasClosing) {
      // Многострочный комментарий начинается, но не заканчивается - оставляем как есть
      return [line];
    }
    
    // Извлекаем содержимое между /* и */
    let commentContent = trimmed.substring(2, trimmed.length - 2).trim();
    
    if (commentContent.length === 0) {
      return [line];
    }
    
    // Для JSDoc-комментариев (/** ... */)
    const isJSDoc = trimmed.startsWith('/**');
    const openingPrefix = isJSDoc ? '/**' : '/*';
    
    const firstLinePrefix = indent + openingPrefix + ' ';
    const continuationPrefix = indent + ' * ';
    const availableFirstLine = maxLength - firstLinePrefix.length;
    const availableContinuation = maxLength - continuationPrefix.length - 3; // -3 для " */"
    
    if (availableFirstLine < 20 || availableContinuation < 20) {
      return [line];
    }
    
    // Разбиваем содержимое на слова
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
          // Даже одно слово не помещается
          if (isFirstLine) {
            result.push(firstLinePrefix + word);
            isFirstLine = false;
          } else {
            result.push(continuationPrefix + word);
          }
        }
      }
    }
    
    // Добавляем последнюю строку с закрывающим */
    if (currentLine) {
      if (isFirstLine) {
        // Все поместилось на одну строку - возвращаем как есть
        result.push(firstLinePrefix + currentLine + ' */');
      } else {
        result.push(continuationPrefix + currentLine + ' */');
      }
    } else if (result.length > 0) {
      // Закрываем комментарий
      result[result.length - 1] += ' */';
    }
    
    return result.length > 0 ? result : [line];
  }

  /**
   * Вспомогательный метод: разбивает текст комментария на строки
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
          // Даже одно слово не помещается
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
   * Создает контекст форматирования
   * АРХИТЕКТУРА: Построение Enhanced AST делегировано ASTBuilder,
   * который инкапсулирует вызов libs/arkts_enhanced_ast
   */
  private createFormattingContext(content: string, contentType: ContentType): FormattingContext {
    const fileName = contentType === ContentType.ARKTS
      ? 'temp.ets'
      : contentType === ContentType.TSX
        ? 'temp.tsx'
        : 'temp.ts';
    
    // Строим Enhanced AST через утилиту ASTBuilder
    // Ответственность за построение AST у libs/arkts_enhanced_ast
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
   * Применяет форматирование с использованием стратегий
   * Применяем немедленно от конца к началу, валидируя каждый шаг
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
   * Получает статистику форматирования
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
    
    // Подсчитываем улучшенные строки
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
   * Проверяет, нужно ли форматирование
   */
  public needsFormatting(content: string): boolean {
    const lines = content.split('\n');
    return lines.some(line => line.length > this.lineLengthConfig.maxLineLength);
  }

  /**
   * Получает список длинных строк
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
   * Конвертирует позиции переносов в трансформации для применения к тексту
   * ВАЖНО: AST возвращает абсолютные позиции в файле, мы используем их напрямую для вставки
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
    
    // Сортируем позиции по убыванию, чтобы применять с конца файла
    const sortedBreaks = [...lineBreaks].sort((a, b) => b.position - a.position);
    
    // Вычисляем абсолютный offset начала текущей строки
    let lineStartOffset = 0;
    for (let j = 0; j < lineIndex; j++) {
      // +1 для символа переноса строки \n между строками
      lineStartOffset += (lines[j]?.length ?? 0) + 1;
    }

    const contentText = lines.join('\n');

    for (const lineBreak of sortedBreaks) {
      // Создаем отступ используя конфигурационное значение
      const indentChar = this.formatterConfig.useTabs ? '\t' : ' ';
      const indentSize = this.formatterConfig.useTabs ? 1 : this.formatterConfig.tabSize;
      const indent = indentChar.repeat(lineBreak.indentLevel * indentSize);
      
      // Тримминг пробелов вокруг точки разрыва в пределах строки
      let start = lineBreak.position;
      let end = lineBreak.position;

      // Границы текущей строки в абсолютных координатах
      const currentLineText = lines[lineIndex] ?? '';
      const lineEndOffset = lineStartOffset + currentLineText.length;

      // Обрезаем пробелы/табы справа от позиции
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

      // Обрезаем пробелы/табы слева от позиции
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

      // Заменяем диапазон [start, end) на перенос с отступом
      // Спец-случай: вставка ровно в конец строки — поглощаем существующий перевод строки,
      // чтобы не образовывался пустой визуальный ряд
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
