import * as ts from 'typescript';
import * as fs from 'fs';
import {
  EnhancedASTBuilder,
  EnhancedASTNode,
  SyntaxTokenType
} from '../../libs/arkts_enhanced_ast';

interface ViewerOptions {
  showMetadata: boolean;
  showTokens: boolean;
}

/**
 * Выводит псевдографическое дерево расширенного AST
 */
function printEnhancedTreeStructure(
  node: EnhancedASTNode,
  options: ViewerOptions,
  depth = 0,
  isLast = true,
  prefix = ''
) {
  const connectorSymbol = isLast ? '└───┨' : '├───┨';
  const childPrefix = prefix + (isLast ? '    ' : '│   ');

  const displayText = node.text
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\\/g, '\\\\');
  const escapedDisplayText = displayText.replace(/"/g, '\\"');

  const kindName = ts.SyntaxKind[node.kind];
  const codePrefix = options.showMetadata ? '' : `(${kindName}) `;
  console.log(`${prefix}${connectorSymbol}${codePrefix}"${escapedDisplayText}"`);

  const infoParts: string[] = [];

  if (options.showMetadata) {
    const metadataParts: string[] = [`kind: ${kindName} (${node.kind})`, `textLen: ${node.text.length}`];

  if (node.fullRange) {
      metadataParts.push(
        `fullRange: ${node.fullRange.start.offset}-${node.fullRange.end.offset}`
      );
  }
  
  if (node.contentRange) {
      metadataParts.push(
        `contentRange: ${node.contentRange.start.offset}-${node.contentRange.end.offset}`
      );
  }
  
    if (node.children && node.children.length > 0) {
      metadataParts.push(`children: ${node.children.length}`);
  }
  
    if (node.modifiers && node.modifiers.length > 0) {
    const modifierNames = node.modifiers.map(m => ts.SyntaxKind[m.kind]).join(', ');
      metadataParts.push(`modifiers: [${modifierNames}]`);
  }
  
  if (node.nodeFlags) {
      metadataParts.push(`flags: ${node.nodeFlags}`);
    }

  if (node.metadata) {
      metadataParts.push(`metadata: ${JSON.stringify(node.metadata)}`);
  }
  
    infoParts.push(`metadata: { ${metadataParts.join('; ')} }`);
  }

  if (options.showTokens && node.syntaxTokens && node.syntaxTokens.length > 0) {
    const tokensInfo = node.syntaxTokens
      .map((token, index) => {
        const displayTextToken = token.text
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
          .replace(/\s/g, '·');
        if (token.type === SyntaxTokenType.SEMANTIC_NODE) {
          const nodeKindToken = token.semanticNode ? ts.SyntaxKind[token.semanticNode.kind] : '?';
          const escapedTokenText = displayTextToken.replace(/"/g, '\\"');
          return `[${index}:${token.type}→${nodeKindToken}:"${escapedTokenText}"]`;
        }
        const escapedTokenText = displayTextToken.replace(/"/g, '\\"');
        return `[${index}:${token.type}:"${escapedTokenText}"]`;
      })
      .join(', ');
    infoParts.push(`tokens: ${tokensInfo}`);
  }
  
  if (infoParts.length > 0) {
    const infoPrefix = childPrefix;
    console.log(`${infoPrefix}┃(${infoParts.join(' | ')})`);
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children.length - 1;
      printEnhancedTreeStructure(child, options, depth + 1, isLastChild, childPrefix);
  });
  }
}

/**
 * Выводит подробную информацию о каждом узле расширенного AST
 */
function printEnhancedAST(node: EnhancedASTNode, depth = 0) {
  const indent = '  '.repeat(depth);
  const nodeTextEscaped = node.text.replace(/"/g, '\\"');
  
  console.log(`${indent}Node: ${ts.SyntaxKind[node.kind]} (${node.kind})`);
  console.log(`${indent}  Text: "${nodeTextEscaped}"`);
  
  if (node.fullRange) {
    console.log(`${indent}  Full Range: ${node.fullRange.start.offset} - ${node.fullRange.end.offset}`);
  }
  
  if (node.contentRange) {
    console.log(`${indent}  Content Range: ${node.contentRange.start.offset} - ${node.contentRange.end.offset}`);
  }
  
  if (node.nodeFlags) {
    console.log(`${indent}  Node Flags: ${node.nodeFlags}`);
  }
  
  if (node.metadata) {
    console.log(`${indent}  Metadata:`, node.metadata);
  }
  
  if (node.modifiers && node.modifiers.length > 0) {
    console.log(`${indent}  Modifiers: ${node.modifiers.length}`);
    node.modifiers.forEach((modifier, index) => {
      const modifierText = modifier.text.replace(/"/g, '\\"');
      console.log(`${indent}    [${index}] ${ts.SyntaxKind[modifier.kind]}: "${modifierText}"`);
    });
  }
  
  // Добавляем отображение токенов
  if (node.syntaxTokens && node.syntaxTokens.length > 0) {
    console.log(`${indent}  Syntax Tokens: ${node.syntaxTokens.length}`);
    node.syntaxTokens.forEach((token, index) => {
      const displayText = token.text.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\s/g, '·');
      
      if (token.type === SyntaxTokenType.SEMANTIC_NODE) {
        const nodeKind = token.semanticNode ? ts.SyntaxKind[token.semanticNode.kind] : 'unknown';
        const escapedDisplay = displayText.replace(/"/g, '\\"');
        console.log(`${indent}    [${index}] SEMANTIC_NODE → ${nodeKind}: "${escapedDisplay}"`);
      } else {
        const escapedDisplay = displayText.replace(/"/g, '\\"');
        console.log(`${indent}    [${index}] ${token.type}: "${escapedDisplay}"`);
      }
    });
  }
  
  if (node.children && node.children.length > 0) {
    console.log(`${indent}  Children: ${node.children.length}`);
    node.children.forEach((child, index) => {
      console.log(`${indent}    [${index}] ${ts.SyntaxKind[child.kind]}`);
      printEnhancedAST(child, depth + 2);
    });
  }
  
  console.log('');
}

/**
 * Главная функция
 */
function main() {
  const rawArgs = process.argv.slice(2);
  const viewerOptions: ViewerOptions = {
    showMetadata: false,
    showTokens: false
  };
  const args: string[] = [];

  for (const arg of rawArgs) {
    if (arg === '--full') {
      viewerOptions.showMetadata = true;
      viewerOptions.showTokens = true;
      continue;
    }
    if (arg === '--metadata') {
      viewerOptions.showMetadata = true;
      continue;
    }
    if (arg === '--tokens') {
      viewerOptions.showTokens = true;
      continue;
    }
    args.push(arg);
  }

  if (args.length === 0) {
    console.log('Использование:');
    console.log('  npx ts-node enhanced-ast-viewer.ts [--metadata] [--tokens] <файл>');
    console.log('  npx ts-node enhanced-ast-viewer.ts [--metadata] [--tokens] --code "<код>"');
    console.log('  Дополнительно можно использовать --full (эквивалентно --metadata --tokens)');
    console.log('');
    return;
  }

  let sourceCode: string;
  let fileName: string;

  if (args[0] === '--code') {
    if (args.length < 2 || !args[1]) {
      console.error('Ошибка: не указан код для анализа');
      return;
    }
    sourceCode = args[1];
    fileName = 'inline.ts';
  } else {
    const filePath = args[0];
    
    if (!filePath) {
      console.error('Ошибка: не указан файл для анализа');
      return;
    }
    
    fileName = filePath;
    
    // Проверяем существование файла
    if (!fs.existsSync(fileName)) {
      console.error(`Ошибка: файл "${fileName}" не найден`);
      return;
    }
    
    try {
      sourceCode = fs.readFileSync(fileName, 'utf-8');
    } catch (error) {
      console.error(`Ошибка чтения файла "${fileName}":`, error);
      return;
    }
  }

  console.log(`=== Enhanced AST для файла: ${fileName} ===`);
  console.log('');

  try {
    // Создаем стандартный TypeScript AST
    const typescriptAST = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, true);
    
    // Создаем расширенный AST
    const builder = new EnhancedASTBuilder(typescriptAST);
    const enhancedAST = builder.build();
    
    if (enhancedAST.errors && enhancedAST.errors.length > 0) {
      console.error('Ошибки при создании расширенного AST:');
      enhancedAST.errors.forEach(error => {
        console.error(`  ${error.type}: ${error.message}`);
      });
      return;
    }

    console.log('=== Структура дерева ===');
    printEnhancedTreeStructure(enhancedAST.root, viewerOptions);
    
    console.log('\n=== Подробная информация ===');
    printEnhancedAST(enhancedAST.root);
    
    // console.log('=== Исходный текст ===');
    // console.log(sourceCode);
    
  } catch (error) {
    console.error('Ошибка обработки:', error);
  }
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  main();
}
