/**
 * Анализатор длинных строк для TypeScript файлов
 * Использует TypeScript Compiler API для корректного анализа контекста строк
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
   * Создаёт анализатор длины строк.
   * @param config Общая конфигурация анализа.
   * @param lineLengthConfig Настройки правила длины строки и игноров.
   */
  constructor(config: AnalysisConfig, lineLengthConfig: LineLengthConfig) {
    super(config);
    this.lineLengthConfig = lineLengthConfig;
  }

  /**
   * Анализирует содержимое файла и формирует список проблем по превышению длины строки.
   * Учитывает тип контента для корректного парсинга и вычисления AST-контекста по строкам.
   * @param content Исходный текст файла.
   * @param contentType Тип содержимого (TS/TSX/ETS).
   * @returns Результат анализа с перечнем найденных Issues.
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

    // Строим Enhanced AST и запросник один раз для всего файла
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
   * Оценивает, можно ли безопасно автоматизировать переносы в длинной строке.
   * Использует лёгкие эвристики (знаки препинания, скобки, аннотации типов) и
   * проверку на «неразбиваемый одиночный токен» без пробелов.
   * @param line Анализируемая строка.
   * @param _astContext AST-узел строки (не используется в текущей реализации).
   * @returns true — строка потенциально автоисправляема; false — лучше править вручную.
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
   * Возвращает минимальный AST-узел, полностью попадающий в границы указанной строки.
   * @param lineNumber Номер строки (0-based).
   * @returns Найденный узел или null, если подходящий узел отсутствует.
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
   * Проверяет, нужно ли исключить строку из анализа по настройкам игнора.
   * Выполняет быстрые текстовые проверки, затем уточняет по AST и применяет фоллбэки.
   * @param line Текст строки.
   * @param _lineNumber Номер строки (0-based).
   * @param astContext AST-контекст строки, если доступен.
   * @returns true — строка игнорируется; false — строка подлежит анализу.
   */
  private shouldIgnoreLine(line: string, _lineNumber: number, astContext: ts.Node | null): boolean {
    const trimmedLine = line.trim();

    // Пустая строка — игнорируем
    if (trimmedLine.length === 0) {
      return true;
    }

    // Игнорируем строки с URL, если включён флаг ignoreUrls
    if (this.lineLengthConfig.ignoreUrls && this.containsUrl(line)) {
      return true;
    }

    // Если есть AST-контекст, применяем точные игноры по типу узла
    if (astContext) {
      // Игнорируем строковые литералы по AST при включённом ignoreStrings
      if (this.lineLengthConfig.ignoreStrings && ts.isStringLiteral(astContext)) {
        return true;
      }

      // Игнорируем шаблонные литералы по AST при включённом ignoreTemplateLiterals
      if (this.lineLengthConfig.ignoreTemplateLiterals && ts.isTemplateLiteral(astContext)) {
        return true;
      }

      // Игнорируем JSDoc/комментарии по AST при включённом ignoreComments
      if (this.lineLengthConfig.ignoreComments && ts.isJSDoc(astContext)) {
        return true;
      }
    }

    // Фоллбэк: игнорируем строковые литералы по текстовому анализу
    if (this.lineLengthConfig.ignoreStrings && this.isStringLiteral(line)) {
      return true;
    }

    // Фоллбэк: игнорируем комментарии по текстовому анализу
    if (this.lineLengthConfig.ignoreComments && this.isComment(line)) {
      return true;
    }

    // Фоллбэк: игнорируем шаблонные литералы по текстовому анализу
    if (this.lineLengthConfig.ignoreTemplateLiterals && this.isTemplateLiteral(line)) {
      return true;
    }

    return false;
  }

  /**
   * Проверяет, содержит ли строка URL (http/https).
   * @param line Текст строки.
   * @returns true, если в строке обнаружен URL.
   */
  private containsUrl(line: string): boolean {
    const urlRegex = /https?:\/\/[^\s]+/;
    return urlRegex.test(line);
  }

  /**
   * Грубая текстовая проверка: строка целиком является строковым литералом.
   * @param line Текст строки.
   * @returns true, если строка начинается и заканчивается кавычками (", ' или `).
   */
  private isStringLiteral(line: string): boolean {
    const trimmed = line.trim();
    return (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
           (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
           (trimmed.startsWith('`') && trimmed.endsWith('`'));
  }

  /**
   * Грубая текстовая проверка: строка является комментариевой строкой.
   * @param line Текст строки.
   * @returns true, если строка начинается с //, /* или *.
   */
  private isComment(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }

  /**
   * Грубая текстовая проверка на шаблонный литерал (template literal).
   * @param line Текст строки.
   * @returns true, если строка окружена обратными кавычками (`).
   */
  private isTemplateLiteral(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('`') && trimmed.endsWith('`');
  }

  /**
   * Возвращает длину ведущего отступа строки (в символах), учитывая пробелы и табы.
   * @param line Текст строки.
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
   * Вычисляет длину самого длинного токена на указанной строке, используя сканер TypeScript.
   * Токены комментариев и пробельные символы игнорируются (skipTrivia=true).
   * @param lineIndex Индекс строки (0-based).
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
        // Пропускаем пробелы и переносы строк
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
