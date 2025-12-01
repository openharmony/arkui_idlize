/**
 * Index file for test fixtures
 * Exports all fixtures for easy import in test files
 */

export { default as FunctionCall } from './function-call.json';
export * as ObjectLiteral from './object-literal';
export * as UnionType from './union-type';
export * as Comment from './comment';
export * as Import from './import';
export * as LogicalExpression from './logical-expression';
export * as ClassDeclaration from './class-declaration';
export { default as Assignment } from './assignment.json';
export * as TemplateLiteral from './template-literal';
export * as ReturnStatement from './return-statement';
export * as ThrowStatement from './throw-statement';
export * as ForLoop from './for-loop';
export * as TypeAssertion from './type-assertion';
export * as JsxTsx from './jsx-tsx';

/**
 * All fixtures organized by category
 */
export const fixtures = {
  basic: {
    functionCall: './function-call',
    objectLiteral: './object-literal',
    assignment: './assignment'
  },
  typescript: {
    unionType: './union-type',
    typeAssertion: './type-assertion',
    import: './import',
    classDeclaration: './class-declaration'
  },
  expressions: {
    logicalExpression: './logical-expression',
    forLoop: './for-loop'
  },
  critical: {
    returnStatement: './return-statement',
    throwStatement: './throw-statement',
    templateLiteral: './template-literal'
  },
  documentation: {
    comment: './comment'
  },
  ui: {
    jsxTsx: './jsx-tsx'
  }
};

/**
 * Fixture categories for testing
 */
export const categories = {
  /** Basic JavaScript/TypeScript constructs */
  BASIC: 'basic',
  /** TypeScript-specific features */
  TYPESCRIPT: 'typescript',
  /** Expression formatting */
  EXPRESSIONS: 'expressions',
  /** Critical cases (ASI, semantic changes) */
  CRITICAL: 'critical',
  /** Documentation and comments */
  DOCUMENTATION: 'documentation',
  /** UI framework specific (JSX/TSX) */
  UI: 'ui'
} as const;

export type FixtureCategory = typeof categories[keyof typeof categories];

