/**
 * Расширенные типы AST с полной информацией о координатах и токенах
 *
 * Этот модуль определяет структуры данных для построения полного AST,
 * который сохраняет всю информацию, необходимую для точного восстановления
 * оригинального текста файла.
 */

import * as ts from 'typescript';
import type { SyntacticSeparator } from './syntactic-separators';

/**
 * Позиция в исходном файле с полной информацией
 */
export interface SourcePosition {
  /** Абсолютное смещение от начала файла */
  offset: number;
  /** Номер строки (начиная с 0) */
  line: number;
  /** Позиция в строке (начиная с 0) */
  column: number;
}

/**
 * Диапазон в исходном файле
 */
export interface SourceRange {
  /** Начальная позиция (включительно) */
  start: SourcePosition;
  /** Конечная позиция (исключительно) */
  end: SourcePosition;
}

/**
 * Типы синтаксических токенов (CST)
 */
export enum SyntaxTokenType {
  /** Ключевое слово (export, class, interface, async, function, etc.) */
  KEYWORD = 'keyword',
  /** Идентификатор */
  IDENTIFIER = 'identifier',
  /** Открывающая фигурная скобка { */
  OPEN_BRACE = 'open_brace',
  /** Закрывающая фигурная скобка } */
  CLOSE_BRACE = 'close_brace',
  /** Открывающая круглая скобка ( */
  OPEN_PAREN = 'open_paren',
  /** Закрывающая круглая скобка ) */
  CLOSE_PAREN = 'close_paren',
  /** Открывающая угловая скобка < */
  OPEN_ANGLE = 'open_angle',
  /** Закрывающая угловая скобка > */
  CLOSE_ANGLE = 'close_angle',
  /** Открывающая квадратная скобка [ */
  OPEN_BRACKET = 'open_bracket',
  /** Закрывающая квадратная скобка ] */
  CLOSE_BRACKET = 'close_bracket',
  /** Запятая , */
  COMMA = 'comma',
  /** Точка с запятой ; */
  SEMICOLON = 'semicolon',
  /** Двоеточие : */
  COLON = 'colon',
  /** Точка . */
  DOT = 'dot',
  /** Оператор = */
  EQUALS = 'equals',
  /** Оператор => */
  ARROW = 'arrow',
  /** Оператор ? */
  QUESTION = 'question',
  /** Оператор ?? */
  NULLISH_COALESCING = 'nullish_coalescing',
  /** Оператор ... (spread/rest) */
  SPREAD = 'spread',
  /** Оператор - (минус) */
  MINUS = 'minus',
  /** Оператор + (плюс) */
  PLUS = 'plus',
  /** Оператор (|, &, ||, &&, и другие) */
  OPERATOR = 'operator',
  /** Пробел */
  WHITESPACE = 'whitespace',
  /** Перенос строки */
  NEWLINE = 'newline',
  /** Однострочный комментарий */
  LINE_COMMENT = 'line_comment',
  /** Многострочный комментарий */
  BLOCK_COMMENT = 'block_comment',
  /** Ссылка на покрывающий узел Enhanced AST */
  SEMANTIC_NODE = 'semantic_node',
  /** Другой токен */
  OTHER = 'other'
}

/**
 * Синтаксический токен (элемент CST)
 * 
 * Представляет атомарный синтаксический элемент кода.
 * Получается из TypeScript Scanner API.
 */
export interface SyntaxToken {
  /** Тип токена */
  type: SyntaxTokenType;
  
  /** Текст токена */
  text: string;
  
  /** Позиция токена в исходном файле */
  position: SourcePosition;
  
  /** Ссылка на покрывающий узел (для SEMANTIC_NODE) */
  semanticNode?: EnhancedASTNode;
  
  /** Оригинальный TypeScript SyntaxKind */
  tsKind: ts.SyntaxKind;
}

/**
 * Расширенный узел AST с полной информацией
 */
export interface EnhancedASTNode {
  /** Оригинальный TypeScript узел */
  originalNode: ts.Node;
  
  /** Тип узла (из TypeScript SyntaxKind) */
  kind: ts.SyntaxKind;
  
  /** Полный диапазон узла в исходном файле */
  fullRange: SourceRange;
  
  /** Диапазон только содержимого узла (без leading/trailing trivia) */
  contentRange: SourceRange;
  
  /** Исходный текст узла */
  text: string;
  
  /** Плоский список синтаксических токенов узла (CST) */
  syntaxTokens: SyntaxToken[];

  /** Лениво вычисляемые дескрипторы синтаксических разделителей */
  semanticSeparators?: SyntacticSeparator[];
  
  /** Дочерние узлы */
  children: EnhancedASTNode[];
  
  /** Модификаторы узла (export, async, static и т.д.) */
  modifiers?: EnhancedASTNode[];
  
  /** Флаги узла TypeScript */
  nodeFlags?: ts.NodeFlags;
  
  /** Родительский узел */
  parent?: EnhancedASTNode;
  
  /** Дополнительные метаданные для форматирования */
  metadata: NodeMetadata;
}

/**
 * Метаданные узла для форматирования
 */
export interface NodeMetadata {
  /** Может ли узел быть разбит на несколько строк */
  canBreak: boolean;
  
  /** Приоритет для разбиения (меньше = выше приоритет) */
  breakPriority: number;
  
  /** Минимальная длина для принудительного разбиения */
  forceBreakLength?: number;
  
  /** Уровень вложенности для отступов */
  indentLevel: number;
  
  /** Является ли узел "атомарным" (не может быть разбит) */
  isAtomic: boolean;
  
  /** Дополнительные флаги для специальной обработки */
  flags: NodeFlags;
}

/**
 * Флаги для специальной обработки узлов
 */
export enum NodeFlags {
  /** Обычный узел */
  NONE = 0,
  
  /** Узел содержит комментарии */
  HAS_COMMENTS = 1 << 0,
  
  /** Узел является частью цепочки вызовов */
  IN_CALL_CHAIN = 1 << 1,
  
  /** Узел является частью типа union/intersection */
  IN_TYPE_UNION = 1 << 2,
  
  /** Узел содержит строковые литералы */
  HAS_STRING_LITERALS = 1 << 3,
  
  /** Узел является частью объявления функции */
  IN_FUNCTION_DECLARATION = 1 << 4,
  
  /** Узел является частью объявления класса/интерфейса */
  IN_CLASS_DECLARATION = 1 << 5,
  
  /** Узел требует особого внимания при форматировании */
  REQUIRES_SPECIAL_FORMATTING = 1 << 6
}

/**
 * Результат построения расширенного AST
 */
export interface EnhancedASTResult {
  /** Корневой узел AST */
  root: EnhancedASTNode;
  
  /** Исходный файл TypeScript */
  sourceFile: ts.SourceFile;
  
  /** Карта позиций для быстрого поиска узлов */
  positionMap: Map<number, EnhancedASTNode>;
  
  /** Статистика построения AST */
  statistics: ASTStatistics;
  
  /** Ошибки, возникшие при построении */
  errors: ASTError[];
}

/**
 * Статистика построения AST
 */
export interface ASTStatistics {
  /** Общее количество узлов */
  totalNodes: number;
  
  /** Количество комментариев */
  commentCount: number;
  
  /** Время построения в миллисекундах */
  buildTimeMs: number;
  
  /** Размер исходного файла в символах */
  sourceSize: number;
}

/**
 * Ошибка при построении AST
 */
export interface ASTError {
  /** Тип ошибки */
  type: ASTErrorType;
  
  /** Сообщение об ошибке */
  message: string;
  
  /** Позиция ошибки в файле */
  position?: SourcePosition;
  
  /** Узел, с которым связана ошибка */
  node?: ts.Node;
}

/**
 * Типы ошибок при построении AST
 */
export enum ASTErrorType {
  /** Ошибка парсинга TypeScript */
  TYPESCRIPT_PARSE_ERROR = 'typescript_parse_error',
  
  /** Несоответствие позиций */
  POSITION_MISMATCH = 'position_mismatch',
  
  /** Неожиданный символ */
  UNEXPECTED_CHARACTER = 'unexpected_character',
  
  /** Внутренняя ошибка */
  INTERNAL_ERROR = 'internal_error'
}

/**
 * Опции для построения расширенного AST
 */
export interface EnhancedASTOptions {
  /** Сохранять ли комментарии */
  preserveComments: boolean;
  
  /** Сохранять ли пробелы */
  preserveWhitespace: boolean;
  
  /** Максимальная глубина рекурсии */
  maxDepth: number;
  
  /** Включить ли детальную диагностику */
  enableDiagnostics: boolean;
  
  /** Функция для определения приоритета разбиения узлов */
  breakPriorityCalculator?: (node: ts.Node) => number;

  /**
   * Необязательный список диапазонов исходного файла, для которых нужно строить расширенный AST.
   * Если указан, узлы и токены вне этих диапазонов будут пропущены для ускорения.
   */
  includeRanges?: SourceRange[];
}
