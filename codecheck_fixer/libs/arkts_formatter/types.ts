/**
 * Типы для системы форматирования длинных строк
 */

import * as ts from 'typescript';
import type { EnhancedASTResult, EnhancedASTQuery } from '../arkts_enhanced_ast';

/**
 * Результат построения Enhanced AST с запросником
 */
export interface EnhancedASTWithQuery {
  ast: EnhancedASTResult;
  query: EnhancedASTQuery;
}

// Типы конфигурации
export interface FormatterConfig {
  tabSize: number;
  useTabs: boolean;
  quoteStyle: 'single' | 'double';
  semicolons: boolean;
  trailingCommas: boolean;
  maxLineLength: number;
}

export interface LineLengthConfig {
  maxLineLength: number;
  ignoreUrls: boolean;
  ignoreStrings: boolean;
  ignoreComments: boolean;
  ignoreTemplateLiterals: boolean;
}

/**
 * Результат трансформации
 */
export interface TransformationResult {
  start: number;
  end: number;
  newText: string;
}

export interface LineBreakInsertion {
  position: number;
  indentLevel: number;
  reason: string; // для отладки: "after extends", "before parameter", etc.
}

/**
 * Контекст форматирования
 */
export interface FormattingContext {
  /** Расширенное AST (Enhanced AST) с запросником для форматирования ArkTS/TypeScript кода */
  enhancedAST: EnhancedASTWithQuery;
  
  /** Исходный текст */
  content: string;
  
  /** Строки исходного текста */
  lines: string[];
  
  /** Конфигурация форматтера */
  formatterConfig: FormatterConfig;
  
  /** Конфигурация проверки длины строк */
  lineLengthConfig: LineLengthConfig;
  
  /** Максимальная длина строки */
  maxLineLength: number;
  
  /** Единица отступа (строка с пробелами или табуляцией) */
  indentUnit: string;
  
  /** 
   * Имя файла для кэширования и определения типа
   * Примеры: 'temp.ets' (ArkTS), 'temp.ts' (TypeScript)
   */
  fileName: string;
}

/**
 * Результат работы форматтера
 */
export interface FormatterResult {
  lineBreaks: LineBreakInsertion[];
  success: boolean;
  reason?: string | undefined;
}

/**
 * Интерфейс стратегии форматирования
 */
export interface FormattingStrategy {
  /**
   * Проверяет, может ли стратегия обработать данную строку
   */
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;

  /**
   * Форматирует строку
   */
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;

  /**
   * Приоритет стратегии (чем больше, тем выше приоритет)
   */
  getPriority(): number;

  /**
   * Очищает внутренний кэш стратегии (опционально)
   * ДОБАВЛЕНО: Для корректной работы итеративного форматирования
   */
  clearCache?(): void;
}

/**
 * Интерфейс специализированного форматтера
 */
export interface SpecializedFormatter {
  /**
   * Проверяет, может ли форматтер обработать данный узел AST
   */
  canFormat(node: ts.Node, context: FormattingContext): boolean;

  /**
   * Форматирует узел AST
   */
  formatNode(node: ts.Node, context: FormattingContext): string;

  /**
   * Получает имя форматтера для отладки
   */
  getName(): string;
}

/**
 * Информация о строке для анализа
 */
export interface LineInfo {
  content: string;
  index: number;
  trimmed: string;
  indent: string;
  length: number;
  exceedsLimit: boolean;
}
