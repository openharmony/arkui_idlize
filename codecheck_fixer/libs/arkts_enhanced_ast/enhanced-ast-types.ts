/**
 * Extended AST types with complete coordinate and token information
 *
 * This module defines data structures for building complete AST,
 * that preserves all information necessary for accurate reconstruction
 * of original file text.
 */

import * as ts from 'typescript';
import type { SyntacticSeparator } from './syntactic-separators';

/**
 * Position in source file with complete information
 */
export interface SourcePosition {
  /** Absolute offset from file start */
  offset: number;
  /** Line number (starting from 0) */
  line: number;
  /** Position in line (starting from 0) */
  column: number;
}

/**
 * Range in source file
 */
export interface SourceRange {
  /** Starting position (inclusive) */
  start: SourcePosition;
  /** Ending position (exclusive) */
  end: SourcePosition;
}

/**
 * Syntactic token types (CST)
 */
export enum SyntaxTokenType {
  /** Keyword (export, class, interface, async, function, etc.) */
  KEYWORD = 'keyword',
  /** Identifier */
  IDENTIFIER = 'identifier',
  /** Opening curly brace { */
  OPEN_BRACE = 'open_brace',
  /** Closing curly brace } */
  CLOSE_BRACE = 'close_brace',
  /** Opening parenthesis ( */
  OPEN_PAREN = 'open_paren',
  /** Closing parenthesis ) */
  CLOSE_PAREN = 'close_paren',
  /** Opening angle bracket < */
  OPEN_ANGLE = 'open_angle',
  /** Closing angle bracket > */
  CLOSE_ANGLE = 'close_angle',
  /** Opening square bracket [ */
  OPEN_BRACKET = 'open_bracket',
  /** Closing square bracket ] */
  CLOSE_BRACKET = 'close_bracket',
  /** Comma , */
  COMMA = 'comma',
  /** Semicolon ; */
  SEMICOLON = 'semicolon',
  /** Colon : */
  COLON = 'colon',
  /** Dot . */
  DOT = 'dot',
  /** Equals operator = */
  EQUALS = 'equals',
  /** Arrow operator => */
  ARROW = 'arrow',
  /** Question operator ? */
  QUESTION = 'question',
  /** Nullish coalescing operator ?? */
  NULLISH_COALESCING = 'nullish_coalescing',
  /** Spread/rest operator ... */
  SPREAD = 'spread',
  /** Minus operator - */
  MINUS = 'minus',
  /** Plus operator + */
  PLUS = 'plus',
  /** Operator (|, &, ||, &&, and others) */
  OPERATOR = 'operator',
  /** Whitespace */
  WHITESPACE = 'whitespace',
  /** Newline */
  NEWLINE = 'newline',
  /** Single-line comment */
  LINE_COMMENT = 'line_comment',
  /** Multi-line comment */
  BLOCK_COMMENT = 'block_comment',
  /** Reference to covering Enhanced AST node */
  SEMANTIC_NODE = 'semantic_node',
  /** Other token */
  OTHER = 'other'
}

/**
 * Syntactic token (CST element)
 * 
 * Represents atomic syntactic code element.
 * Obtained from TypeScript Scanner API.
 */
export interface SyntaxToken {
  /** Token type */
  type: SyntaxTokenType;
  
  /** Token text */
  text: string;
  
  /** Token position in source file */
  position: SourcePosition;
  
  /** Reference to covering node (for SEMANTIC_NODE) */
  semanticNode?: EnhancedASTNode;
  
  /** Original TypeScript SyntaxKind */
  tsKind: ts.SyntaxKind;
}

/**
 * Extended AST node with complete information
 */
export interface EnhancedASTNode {
  /** Original TypeScript node */
  originalNode: ts.Node;
  
  /** Node type (from TypeScript SyntaxKind) */
  kind: ts.SyntaxKind;
  
  /** Full node range in source file */
  fullRange: SourceRange;
  
  /** Range of node content only (without leading/trailing trivia) */
  contentRange: SourceRange;
  
  /** Source text of node */
  text: string;
  
  /** Flat list of node's syntactic tokens (CST) */
  syntaxTokens: SyntaxToken[];

  /** Lazily computed descriptors of syntactic separators */
  semanticSeparators?: SyntacticSeparator[];
  
  /** Child nodes */
  children: EnhancedASTNode[];
  
  /** Node modifiers (export, async, static, etc.) */
  modifiers?: EnhancedASTNode[];
  
  /** TypeScript node flags */
  nodeFlags?: ts.NodeFlags;
  
  /** Parent node */
  parent?: EnhancedASTNode;
  
  /** Additional metadata for formatting */
  metadata: NodeMetadata;
}

/**
 * Node metadata for formatting
 */
export interface NodeMetadata {
  /** Can node be split into multiple lines */
  canBreak: boolean;
  
  /** Priority for breaking (lower = higher priority) */
  breakPriority: number;
  
  /** Minimum length for forced break */
  forceBreakLength?: number;
  
  /** Nesting level for indentation */
  indentLevel: number;
  
  /** Is node "atomic" (cannot be split) */
  isAtomic: boolean;
  
  /** Additional flags for special handling */
  flags: NodeFlags;
}

/**
 * Flags for special node handling
 */
export enum NodeFlags {
  /** Regular node */
  NONE = 0,
  
  /** Node contains comments */
  HAS_COMMENTS = 1 << 0,
  
  /** Node is part of call chain */
  IN_CALL_CHAIN = 1 << 1,
  
  /** Node is part of union/intersection type */
  IN_TYPE_UNION = 1 << 2,
  
  /** Node contains string literals */
  HAS_STRING_LITERALS = 1 << 3,
  
  /** Node is part of function declaration */
  IN_FUNCTION_DECLARATION = 1 << 4,
  
  /** Node is part of class/interface declaration */
  IN_CLASS_DECLARATION = 1 << 5,
  
  /** Node requires special attention during formatting */
  REQUIRES_SPECIAL_FORMATTING = 1 << 6
}

/**
 * Result of building extended AST
 */
export interface EnhancedASTResult {
  /** Root AST node */
  root: EnhancedASTNode;
  
  /** TypeScript source file */
  sourceFile: ts.SourceFile;
  
  /** Position map for quick node lookup */
  positionMap: Map<number, EnhancedASTNode>;
  
  /** AST build statistics */
  statistics: ASTStatistics;
  
  /** Errors that occurred during build */
  errors: ASTError[];
}

/**
 * AST build statistics
 */
export interface ASTStatistics {
  /** Total number of nodes */
  totalNodes: number;
  
  /** Number of comments */
  commentCount: number;
  
  /** Build time in milliseconds */
  buildTimeMs: number;
  
  /** Source file size in characters */
  sourceSize: number;
}

/**
 * Error during AST build
 */
export interface ASTError {
  /** Error type */
  type: ASTErrorType;
  
  /** Error message */
  message: string;
  
  /** Error position in file */
  position?: SourcePosition;
  
  /** Node associated with error */
  node?: ts.Node;
}

/**
 * Types of errors during AST build
 */
export enum ASTErrorType {
  /** TypeScript parsing error */
  TYPESCRIPT_PARSE_ERROR = 'typescript_parse_error',
  
  /** Position mismatch */
  POSITION_MISMATCH = 'position_mismatch',
  
  /** Unexpected character */
  UNEXPECTED_CHARACTER = 'unexpected_character',
  
  /** Internal error */
  INTERNAL_ERROR = 'internal_error'
}

/**
 * Options for building extended AST
 */
export interface EnhancedASTOptions {
  /** Whether to preserve comments */
  preserveComments: boolean;
  
  /** Whether to preserve whitespace */
  preserveWhitespace: boolean;
  
  /** Maximum recursion depth */
  maxDepth: number;
  
  /** Whether to enable detailed diagnostics */
  enableDiagnostics: boolean;
  
  /** Function for determining node break priority */
  breakPriorityCalculator?: (node: ts.Node) => number;

  /**
   * Optional list of source file ranges for which to build extended AST.
   * If specified, nodes and tokens outside these ranges will be skipped for faster build.
   */
  includeRanges?: SourceRange[];
}
