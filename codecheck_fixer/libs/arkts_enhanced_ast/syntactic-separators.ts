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
 * Syntactic separators and their lazy caching at Enhanced AST level.
 *
 * Module implements:
 *  - classification of syntactic tokens according to definitions from
 *    `docs/workflow/pipeline/top-level-semantic-break_ru.md`;
 *  - lazy decoration of Enhanced AST nodes (see `getSemanticSeparators()`), so
 *    formatters can get descriptors without repeated token traversals.
 */

import type { EnhancedASTNode, SyntaxToken } from './enhanced-ast-types';
import { SyntaxTokenType } from './enhanced-ast-types';

/**
 * Categories of syntactic separators.
 */
export enum SyntacticSeparatorCategory {
  /** Sequence separators: commas, semicolons. */
  Sequence = 'sequence',
  /** Logical operators: &&, || etc. */
  Logical = 'logical',
  /** Structural boundaries: parentheses, blocks. */
  Structural = 'structural',
  /** Type boundaries: union/intersection, annotations. */
  Type = 'type',
  /** Other operational separators: arithmetic, comparison, assignment. */
  Operational = 'operational'
}

/**
 * Preferred break direction relative to separator.
 */
export enum SeparatorBreakAffinity {
  Before = 'before',
  After = 'after',
  Both = 'both'
}

/**
 * Detailed separator role for refining break heuristics.
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
 * Syntactic separator description.
 */
export interface SyntacticSeparator {
  token: SyntaxToken;
  category: SyntacticSeparatorCategory;
  role: SyntacticSeparatorRole;
  breakAffinity: SeparatorBreakAffinity;
  /** Lower value means higher priority when choosing break point. */
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
 * Classifies single token and returns separator description or `null`.
 */
export function classifySyntacticSeparator(token: SyntaxToken): SyntacticSeparator | null {
  const descriptor = classifyExplicitToken(token);
  return descriptor ? buildSeparator(token, descriptor) : null;
}

/**
 * Returns list of separators for set of tokens.
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

/** Checks if category is logical. */
export function isLogicalSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Logical;
}

/** Checks if category is structural. */
export function isStructuralSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Structural;
}

/** Checks if category is sequence (commas, semicolons). */
export function isSequenceSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Sequence;
}

/** Checks if separator relates to type constructs. */
export function isTypeSeparator(separator: SyntacticSeparator): boolean {
  return separator.category === SyntacticSeparatorCategory.Type;
}

/** Is it preferable to break after token. */
export function preferBreakAfter(separator: SyntacticSeparator): boolean {
  return (
    separator.breakAffinity === SeparatorBreakAffinity.After ||
    separator.breakAffinity === SeparatorBreakAffinity.Both
  );
}

/** Is it preferable to break before token. */
export function preferBreakBefore(separator: SyntacticSeparator): boolean {
  return (
    separator.breakAffinity === SeparatorBreakAffinity.Before ||
    separator.breakAffinity === SeparatorBreakAffinity.Both
  );
}

/** Quick check of token type for membership in separators. */
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
 * Lazy decoration of Enhanced AST node: computes and caches separator descriptors.
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
 * Resets separator cache for node (e.g., when rebuilding tokens).
 */
export function resetSemanticSeparators(node: EnhancedASTNode): void {
  delete node.semanticSeparators;
}


