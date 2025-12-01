/**
 * Главный модуль расширенного AST
 * 
 * Экспортирует все необходимые типы и классы для работы с расширенным AST.
 */

// Типы
export * from './enhanced-ast-types';

// Основные классы
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

// Удобные функции для быстрого использования
import * as ts from 'typescript';
import { EnhancedASTBuilder } from './enhanced-ast-builder';
import { EnhancedASTQuery } from './enhanced-ast-query';
import { EnhancedASTOptions, EnhancedASTResult } from './enhanced-ast-types';

/**
 * Создает расширенный AST для исходного файла TypeScript
 * @param typescriptAST - корневой узел стандартного TypeScript AST (результат ts.createSourceFile)
 * @param options - опции построения Enhanced AST
 */
export function createEnhancedAST(
  typescriptAST: ts.SourceFile, 
  options?: Partial<EnhancedASTOptions>
): EnhancedASTResult {
  const builder = new EnhancedASTBuilder(typescriptAST, options);
  return builder.build();
}

/**
 * Создает запросник для расширенного AST
 */
export function createASTQuery(ast: EnhancedASTResult): EnhancedASTQuery {
  return new EnhancedASTQuery(ast);
}

/**
 * Удобная функция для создания AST и запросника одновременно
 * @param typescriptAST - корневой узел стандартного TypeScript AST (результат ts.createSourceFile)
 * @param options - опции построения Enhanced AST
 */
export function createEnhancedASTWithQuery(
  typescriptAST: ts.SourceFile,
  options?: Partial<EnhancedASTOptions>
): { ast: EnhancedASTResult; query: EnhancedASTQuery } {
  const ast = createEnhancedAST(typescriptAST, options);
  const query = createASTQuery(ast);
  
  return { ast, query };
}
