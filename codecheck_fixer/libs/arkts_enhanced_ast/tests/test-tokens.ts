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
 * Test to verify tokenizer and Enhanced AST work with tokens
 */

import * as ts from 'typescript';
import { createEnhancedAST } from '../index';
import { SyntaxTokenType } from '../enhanced-ast-types';

// Simple test code
const testCode = `export class MyClass {
  private field: string;
}`;

console.log('Source code:');
console.log(testCode);
console.log('\n' + '='.repeat(80) + '\n');

// Create TypeScript AST
const sourceFile = ts.createSourceFile(
  'test.ts',
  testCode,
  ts.ScriptTarget.Latest,
  true
);

// Create Enhanced AST with tokens
const enhancedAST = createEnhancedAST(sourceFile);

console.log('Enhanced AST built successfully!');
console.log(`Total nodes: ${enhancedAST.statistics.totalNodes}`);
console.log(`Build time: ${enhancedAST.statistics.buildTimeMs}ms`);
console.log('\n' + '='.repeat(80) + '\n');

// Function for printing node tokens
function printTokens(node: any, depth: number = 0): void {
  const indent = '  '.repeat(depth);
  const kindName = ts.SyntaxKind[node.kind];

  console.log(`${indent}${kindName}: "${node.text.substring(0, 30)}..."`);
  console.log(`${indent}  Tokens: ${node.syntaxTokens.length}`);

  // Show first few tokens
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
    console.log(`${indent}    ... (${node.syntaxTokens.length - tokensToShow} more tokens)`);
  }

  // Recursively process child nodes
  if (node.children && node.children.length > 0) {
    console.log(`${indent}  Child nodes: ${node.children.length}`);
    for (const child of node.children) {
      printTokens(child, depth + 1);
    }
  }
}

console.log('Enhanced AST structure with tokens:\n');
printTokens(enhancedAST.root);

console.log('\n' + '='.repeat(80) + '\n');
console.log('Test completed successfully!');

