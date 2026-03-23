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
 * Types for long line formatting system
 */

import * as ts from 'typescript';
import type { EnhancedASTResult, EnhancedASTQuery } from '../arkts_enhanced_ast';

/**
 * Result of building Enhanced AST with query
 */
export interface EnhancedASTWithQuery {
  ast: EnhancedASTResult;
  query: EnhancedASTQuery;
}

// Configuration types
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
 * Transformation result
 */
export interface TransformationResult {
  start: number;
  end: number;
  newText: string;
}

export interface LineBreakInsertion {
  position: number;
  indentLevel: number;
  reason: string; // for debugging: "after extends", "before parameter", etc.
}

/**
 * Formatting context
 */
export interface FormattingContext {
  /** Enhanced AST with query for formatting ArkTS/TypeScript code */
  enhancedAST: EnhancedASTWithQuery;

  /** Source text */
  content: string;

  /** Source text lines */
  lines: string[];

  /** Formatter configuration */
  formatterConfig: FormatterConfig;

  /** Line length check configuration */
  lineLengthConfig: LineLengthConfig;

  /** Maximum line length */
  maxLineLength: number;

  /** Indent unit (string with spaces or tabs) */
  indentUnit: string;

  /**
   * File name for caching and type determination
   * Examples: 'temp.ets' (ArkTS), 'temp.ts' (TypeScript)
   */
  fileName: string;
}

/**
 * Formatter result
 */
export interface FormatterResult {
  lineBreaks: LineBreakInsertion[];
  success: boolean;
  reason?: string | undefined;
}

/**
 * Formatting strategy interface
 */
export interface FormattingStrategy {
  /**
   * Checks if strategy can handle given line
   */
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean;

  /**
   * Formats line
   */
  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult;

  /**
   * Strategy priority (higher number means higher priority)
   */
  getPriority(): number;

  /**
   * Clears internal strategy cache (optional)
   * ADDED: For correct iterative formatting operation
   */
  clearCache?(): void;
}

/**
 * Specialized formatter interface
 */
export interface SpecializedFormatter {
  /**
   * Checks if formatter can handle given AST node
   */
  canFormat(node: ts.Node, context: FormattingContext): boolean;

  /**
   * Formats AST node
   */
  formatNode(node: ts.Node, context: FormattingContext): string;

  /**
   * Gets formatter name for debugging
   */
  getName(): string;
}

/**
 * Line information for analysis
 */
export interface LineInfo {
  content: string;
  index: number;
  trimmed: string;
  indent: string;
  length: number;
  exceedsLimit: boolean;
}
