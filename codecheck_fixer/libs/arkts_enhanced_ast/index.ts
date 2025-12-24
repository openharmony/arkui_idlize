/**
 * Main module for extended AST
 * 
 * Exports all necessary types and classes for working with extended AST.
 */

// Types
export * from './enhanced-ast-types';

// Main classes
export { EnhancedASTBuilder } from './enhanced-ast-builder';
export { EnhancedASTQuery } from './enhanced-ast-query';
export type {
  SyntacticSeparator
} from './syntactic-separators';
export {
  SyntacticSeparatorCategory,
  SyntacticSeparatorRole,
  SeparatorBreakAffinity,
  classifySyntacticSeparator,
  collectSyntacticSeparators,
  isLogicalSeparator,
  isStructuralSeparator,
  isSequenceSeparator,
  isTypeSeparator,
  preferBreakAfter,
  preferBreakBefore,
  isPotentialSeparatorTokenType,
  getSemanticSeparators,
  resetSemanticSeparators
} from './syntactic-separators';

// Convenience functions for quick usage
import * as ts from 'typescript';
import { EnhancedASTBuilder } from './enhanced-ast-builder';
import { EnhancedASTQuery } from './enhanced-ast-query';
import { EnhancedASTOptions, EnhancedASTResult } from './enhanced-ast-types';

/**
 * Creates extended AST for TypeScript source file
 * @param typescriptAST - root node of standard TypeScript AST (result of ts.createSourceFile)
 * @param options - Enhanced AST build options
 */
export function createEnhancedAST(
  typescriptAST: ts.SourceFile, 
  options?: Partial<EnhancedASTOptions>
): EnhancedASTResult {
  const builder = new EnhancedASTBuilder(typescriptAST, options);
  return builder.build();
}

/**
 * Creates query engine for extended AST
 */
export function createASTQuery(ast: EnhancedASTResult): EnhancedASTQuery {
  return new EnhancedASTQuery(ast);
}

/**
 * Convenience function for creating AST and query engine simultaneously
 * @param typescriptAST - root node of standard TypeScript AST (result of ts.createSourceFile)
 * @param options - Enhanced AST build options
 */
export function createEnhancedASTWithQuery(
  typescriptAST: ts.SourceFile,
  options?: Partial<EnhancedASTOptions>
): { ast: EnhancedASTResult; query: EnhancedASTQuery } {
  const ast = createEnhancedAST(typescriptAST, options);
  const query = createASTQuery(ast);
  
  return { ast, query };
}
