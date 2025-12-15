/**
 * Тест для проверки работы токенизатора и Enhanced AST с токенами
 */

import * as ts from 'typescript';
import { createEnhancedAST } from '../index';
import { SyntaxTokenType } from '../enhanced-ast-types';

// Простой тестовый код
const testCode = `export class MyClass {
  private field: string;
}`;

console.log('Исходный код:');
console.log(testCode);
console.log('\n' + '='.repeat(80) + '\n');

// Создаём TypeScript AST
const sourceFile = ts.createSourceFile(
  'test.ts',
  testCode,
  ts.ScriptTarget.Latest,
  true
);

// Создаём Enhanced AST с токенами
const enhancedAST = createEnhancedAST(sourceFile);

console.log('Enhanced AST построен успешно!');
console.log(`Всего узлов: ${enhancedAST.statistics.totalNodes}`);
console.log(`Время построения: ${enhancedAST.statistics.buildTimeMs}ms`);
console.log('\n' + '='.repeat(80) + '\n');

// Функция для вывода токенов узла
function printTokens(node: any, depth: number = 0): void {
  const indent = '  '.repeat(depth);
  const kindName = ts.SyntaxKind[node.kind];
  
  console.log(`${indent}${kindName}: "${node.text.substring(0, 30)}..."`);
  console.log(`${indent}  Токенов: ${node.syntaxTokens.length}`);
  
  // Показываем первые несколько токенов
  const tokensToShow = Math.min(5, node.syntaxTokens.length);
  for (let i = 0; i < tokensToShow; i++) {
    const token = node.syntaxTokens[i];
    if (token.type === SyntaxTokenType.SEMANTIC_NODE) {
      console.log(`${indent}    ${i}: SEMANTIC_NODE "${token.text.substring(0, 20)}..."`);
    } else {
      const displayText = token.text.replace(/\n/g, '\\n').replace(/\s/g, '·');
      console.log(`${indent}    ${i}: ${token.type} "${displayText}"`);
    }
  }
  
  if (node.syntaxTokens.length > tokensToShow) {
    console.log(`${indent}    ... (ещё ${node.syntaxTokens.length - tokensToShow} токенов)`);
  }
  
  // Рекурсивно обрабатываем дочерние узлы
  if (node.children && node.children.length > 0) {
    console.log(`${indent}  Дочерних узлов: ${node.children.length}`);
    for (const child of node.children) {
      printTokens(child, depth + 1);
    }
  }
}

console.log('Структура Enhanced AST с токенами:\n');
printTokens(enhancedAST.root);

console.log('\n' + '='.repeat(80) + '\n');
console.log('Тест завершён успешно!');

