/**
 * Синтаксические разделители и их ленивое кеширование на уровне Enhanced AST.
 *
 * Модуль реализует:
 *  - классификацию синтаксических токенов в соответствии с определениями из
 *    `docs/workflow/pipeline/top-level-semantic-break_ru.md`;
 *  - ленивую декорацию узлов Enhanced AST (см. `getSemanticSeparators()`), чтобы
 *    форматтеры могли получать дескрипторы без повторных обходов токенов.
 */

import type { EnhancedASTNode, SyntaxToken } from './enhanced-ast-types';
import { SyntaxTokenType } from './enhanced-ast-types';

/**
 * Категории синтаксических разделителей.
 */
export enum SyntacticSeparatorCategory {
  /** Разделители последовательностей: запятые, точки с запятой. */
  Sequence = 'sequence',
  /** Логические операторы: &&, || и т.п. */
  Logical = 'logical',
  /** Структурные границы: скобки, блоки. */
  Structural = 'structural',
  /** Типовые границы: union/intersection, аннотации. */
  Type = 'type',
  /** Прочие операционные разделители: арифметика, сравнение, присваивание. */
  Operational = 'operational'
}

/**
 * Предпочтительное направление переноса относительно разделителя.
 */
export enum SeparatorBreakAffinity {
  Before = 'before',
  After = 'after',
  Both = 'both'
}

/**
 * Детальная роль разделителя для уточнения эвристик переноса.
 */
export enum SyntacticSeparatorRole {
  Comma = 'comma',
  Semicolon = 'semicolon',
  Colon = 'colon',
  GroupStart = 'group_start',
  GroupEnd = 'group_end',
  ArrayStart = 'array_start',
  ArrayEnd = 'array_end',
  ObjectStart = 'object_start',
  ObjectEnd = 'object_end',
  LogicalAnd = 'logical_and',
  LogicalOr = 'logical_or',
  NullishCoalescing = 'nullish_coalescing',
  HeritageExtends = 'heritage_extends',
  HeritageImplements = 'heritage_implements',
  TypeUnion = 'type_union',
  TypeIntersection = 'type_intersection',
  ArithmeticOperator = 'arithmetic_operator',
  ComparisonOperator = 'comparison_operator',
  Assignment = 'assignment',
  Arrow = 'arrow_function'
}

/**
 * Описание синтаксического разделителя.
 */
export interface SyntacticSeparator {
  token: SyntaxToken;
  category: SyntacticSeparatorCategory;
  role: SyntacticSeparatorRole;
  breakAffinity: SeparatorBreakAffinity;
  /** Чем меньше значение, тем выше приоритет при выборе точки разбиения. */
  priority: number;
}

type SeparatorDescriptor = {
  category: SyntacticSeparatorCategory;
  role: SyntacticSeparatorRole;
  breakAffinity: SeparatorBreakAffinity;
};

const CATEGORY_PRIORITY: Record<SyntacticSeparatorCategory, number> = {
  [SyntacticSeparatorCategory.Sequence]: 1,
  [SyntacticSeparatorCategory.Structural]: 2,
  [SyntacticSeparatorCategory.Type]: 3,
  [SyntacticSeparatorCategory.Logical]: 4,
  [SyntacticSeparatorCategory.Operational]: 5
};

const STATIC_TOKEN_DESCRIPTORS: Partial<Record<SyntaxTokenType, SeparatorDescriptor>> = {
  [SyntaxTokenType.COMMA]: {
    category: SyntacticSeparatorCategory.Sequence,
    role: SyntacticSeparatorRole.Comma,
    breakAffinity: SeparatorBreakAffinity.After
  },
  [SyntaxTokenType.SEMICOLON]: {
    category: SyntacticSeparatorCategory.Sequence,
    role: SyntacticSeparatorRole.Semicolon,
    breakAffinity: SeparatorBreakAffinity.After
  },
  [SyntaxTokenType.COLON]: {
    category: SyntacticSeparatorCategory.Type,
    role: SyntacticSeparatorRole.Colon,
    breakAffinity: SeparatorBreakAffinity.After
  },
  [SyntaxTokenType.OPEN_PAREN]: {
    category: SyntacticSeparatorCategory.Structural,
    role: SyntacticSeparatorRole.GroupStart,
    breakAffinity: SeparatorBreakAffinity.After
  },
  [SyntaxTokenType.CLOSE_PAREN]: {
    category: SyntacticSeparatorCategory.Structural,
    role: SyntacticSeparatorRole.GroupEnd,
    breakAffinity: SeparatorBreakAffinity.Before
  },
  [SyntaxTokenType.OPEN_BRACKET]: {
    category: SyntacticSeparatorCategory.Structural,
    role: SyntacticSeparatorRole.ArrayStart,
    breakAffinity: SeparatorBreakAffinity.After
  },
  [SyntaxTokenType.CLOSE_BRACKET]: {
    category: SyntacticSeparatorCategory.Structural,
    role: SyntacticSeparatorRole.ArrayEnd,
    breakAffinity: SeparatorBreakAffinity.Before
  },
  [SyntaxTokenType.OPEN_BRACE]: {
    category: SyntacticSeparatorCategory.Structural,
    role: SyntacticSeparatorRole.ObjectStart,
    breakAffinity: SeparatorBreakAffinity.After
  },
  [SyntaxTokenType.CLOSE_BRACE]: {
    category: SyntacticSeparatorCategory.Structural,
    role: SyntacticSeparatorRole.ObjectEnd,
    breakAffinity: SeparatorBreakAffinity.Before
  },
  [SyntaxTokenType.NULLISH_COALESCING]: {
    category: SyntacticSeparatorCategory.Logical,
    role: SyntacticSeparatorRole.NullishCoalescing,
    breakAffinity: SeparatorBreakAffinity.Both
  },
  [SyntaxTokenType.EQUALS]: {
    category: SyntacticSeparatorCategory.Operational,
    role: SyntacticSeparatorRole.Assignment,
    breakAffinity: SeparatorBreakAffinity.Both
  },
  [SyntaxTokenType.ARROW]: {
    category: SyntacticSeparatorCategory.Operational,
    role: SyntacticSeparatorRole.Arrow,
    breakAffinity: SeparatorBreakAffinity.Before
  },
  [SyntaxTokenType.PLUS]: {
    category: SyntacticSeparatorCategory.Operational,
    role: SyntacticSeparatorRole.ArithmeticOperator,
    breakAffinity: SeparatorBreakAffinity.Both
  },
  [SyntaxTokenType.MINUS]: {
    category: SyntacticSeparatorCategory.Operational,
    role: SyntacticSeparatorRole.ArithmeticOperator,
    breakAffinity: SeparatorBreakAffinity.Both
  }
};

const LOGICAL_OPERATOR_TEXTS = new Set(['&&', '||']);
const TYPE_UNION_TEXTS = new Set(['|']);
const TYPE_INTERSECTION_TEXTS = new Set(['&']);
const ARITHMETIC_OPERATOR_TEXTS = new Set(['+', '-', '*', '/', '%', '**']);
const COMPARISON_OPERATOR_TEXTS = new Set(['==', '===', '!=', '!==', '>=', '<=', '>', '<']);

function buildSeparator(token: SyntaxToken, descriptor: SeparatorDescriptor): SyntacticSeparator {
  return {
    token,
    category: descriptor.category,
    role: descriptor.role,
    breakAffinity: descriptor.breakAffinity,
    priority: CATEGORY_PRIORITY[descriptor.category]
  };
}

function classifyOperatorToken(token: SyntaxToken): SeparatorDescriptor | null {
  const text = token.text;

  if (LOGICAL_OPERATOR_TEXTS.has(text)) {
    return {
      category: SyntacticSeparatorCategory.Logical,
      role: text === '&&' ? SyntacticSeparatorRole.LogicalAnd : SyntacticSeparatorRole.LogicalOr,
      breakAffinity: SeparatorBreakAffinity.Both
    };
  }

  if (TYPE_UNION_TEXTS.has(text)) {
    return {
      category: SyntacticSeparatorCategory.Type,
      role: SyntacticSeparatorRole.TypeUnion,
      breakAffinity: SeparatorBreakAffinity.Both
    };
  }

  if (TYPE_INTERSECTION_TEXTS.has(text)) {
    return {
      category: SyntacticSeparatorCategory.Type,
      role: SyntacticSeparatorRole.TypeIntersection,
      breakAffinity: SeparatorBreakAffinity.Both
    };
  }

  if (ARITHMETIC_OPERATOR_TEXTS.has(text)) {
    return {
      category: SyntacticSeparatorCategory.Operational,
      role: SyntacticSeparatorRole.ArithmeticOperator,
      breakAffinity: SeparatorBreakAffinity.Both
    };
  }

  if (COMPARISON_OPERATOR_TEXTS.has(text)) {
    return {
      category: SyntacticSeparatorCategory.Operational,
      role: SyntacticSeparatorRole.ComparisonOperator,
      breakAffinity: SeparatorBreakAffinity.Both
    };
  }

  return null;
}

function classifyExplicitToken(token: SyntaxToken): SeparatorDescriptor | null {
  if (token.type === SyntaxTokenType.KEYWORD) {
    const keywordDescriptor = classifyKeywordToken(token);
    if (keywordDescriptor) {
      return keywordDescriptor;
    }
  }

  const descriptor = STATIC_TOKEN_DESCRIPTORS[token.type];
  if (descriptor) {
    return descriptor;
  }

  switch (token.type) {
    case SyntaxTokenType.OPERATOR:
      return classifyOperatorToken(token);
    default:
      return null;
  }
}

function classifyKeywordToken(token: SyntaxToken): SeparatorDescriptor | null {
  switch (token.text) {
    case 'extends':
      return {
        category: SyntacticSeparatorCategory.Structural,
        role: SyntacticSeparatorRole.HeritageExtends,
        breakAffinity: SeparatorBreakAffinity.After
      };
    case 'implements':
      return {
        category: SyntacticSeparatorCategory.Structural,
        role: SyntacticSeparatorRole.HeritageImplements,
        breakAffinity: SeparatorBreakAffinity.Before
      };
    default:
      return null;
  }
}

/**
 * Классифицирует один токен и возвращает описание разделителя либо `null`.
 */
export function classifySyntacticSeparator(token: SyntaxToken): SyntacticSeparator | null {
  const descriptor = classifyExplicitToken(token);
  return descriptor ? buildSeparator(token, descriptor) : null;
}

/**
 * Возвращает список разделителей для набора токенов.
 */
export function collectSyntacticSeparators(tokens: SyntaxToken[]): SyntacticSeparator[] {
  const result: SyntacticSeparator[] = [];
  for (const token of tokens) {
    const separator = classifySyntacticSeparator(token);
    if (separator) {
      result.push(separator);
    }
  }
  return result;
}

/** Проверяет, является ли категория логической. */
export function isLogicalSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Logical;
}

/** Проверяет, является ли категория структурной. */
export function isStructuralSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Structural;
}

/** Проверяет, является ли категория последовательностью (запятые, точки с запятой). */
export function isSequenceSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Sequence;
}

/** Проверяет, относится ли разделитель к типовым конструкциям. */
export function isTypeSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Type;
}

/** Предпочтительно ли переносить после токена. */
export function preferBreakAfter(separator: SyntacticSeparator): boolean {
  return (
    separator.breakAffinity === SeparatorBreakAffinity.After ||
    separator.breakAffinity === SeparatorBreakAffinity.Both
  );
}

/** Предпочтительно ли переносить перед токеном. */
export function preferBreakBefore(separator: SyntacticSeparator): boolean {
  return (
    separator.breakAffinity === SeparatorBreakAffinity.Before ||
    separator.breakAffinity === SeparatorBreakAffinity.Both
  );
}

/** Быстрая проверка типа токена на принадлежность к разделителям. */
export function isPotentialSeparatorTokenType(tokenType: SyntaxTokenType): boolean {
  if (STATIC_TOKEN_DESCRIPTORS[tokenType]) {
    return true;
  }

  if (tokenType === SyntaxTokenType.KEYWORD) {
    return true;
  }

  if (tokenType === SyntaxTokenType.OPERATOR) {
    return true;
  }

  return false;
}

/**
 * Ленивая декорация узла Enhanced AST: вычисляет и кеширует дескрипторы разделителей.
 */
export function getSemanticSeparators(node: EnhancedASTNode): SyntacticSeparator[] {
  if (node.semanticSeparators) {
    return node.semanticSeparators;
  }

  const tokens = node.syntaxTokens ?? [];
  const separators = collectSyntacticSeparators(tokens);
  node.semanticSeparators = separators;
  return separators;
}

/**
 * Сбрасывает кеш разделителей для узла (например, при повторном построении токенов).
 */
export function resetSemanticSeparators(node: EnhancedASTNode): void {
  delete node.semanticSeparators;
}


