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
 * Prints pseudographical tree of enhanced AST
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
 * Prints detailed information about each enhanced AST node
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
  
  // Add token display
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
 * Main function
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
    console.log('Usage:');
    console.log('  npx ts-node enhanced-ast-viewer.ts [--metadata] [--tokens] <file>');
    console.log('  npx ts-node enhanced-ast-viewer.ts [--metadata] [--tokens] --code "<code>"');
    console.log('  Additionally, you can use --full (equivalent to --metadata --tokens)');
    console.log('');
    return;
  }

  let sourceCode: string;
  let fileName: string;

  if (args[0] === '--code') {
    if (args.length < 2 || !args[1]) {
      console.error('Error: code to analyze not specified');
      return;
    }
    sourceCode = args[1];
    fileName = 'inline.ts';
  } else {
    const filePath = args[0];
    
    if (!filePath) {
      console.error('Error: file to analyze not specified');
      return;
    }
    
    fileName = filePath;
    
    // Check file existence
    if (!fs.existsSync(fileName)) {
      console.error(`Error: file "${fileName}" not found`);
      return;
    }
    
    try {
      sourceCode = fs.readFileSync(fileName, 'utf-8');
    } catch (error) {
      console.error(`Error reading file "${fileName}":`, error);
      return;
    }
  }

  console.log(`=== Enhanced AST for file: ${fileName} ===`);
  console.log('');

  try {
    // Create standard TypeScript AST
    const typescriptAST = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, true);
    
    // Create enhanced AST
    const builder = new EnhancedASTBuilder(typescriptAST);
    const enhancedAST = builder.build();
    
    if (enhancedAST.errors && enhancedAST.errors.length > 0) {
      console.error('Errors creating enhanced AST:');
      enhancedAST.errors.forEach(error => {
        console.error(`  ${error.type}: ${error.message}`);
      });
      return;
    }

    console.log('=== Tree structure ===');
    printEnhancedTreeStructure(enhancedAST.root, viewerOptions);
    
    console.log('\n=== Detailed information ===');
    printEnhancedAST(enhancedAST.root);
    
    // console.log('=== Source text ===');
    // console.log(sourceCode);
    
  } catch (error) {
    console.error('Processing error:', error);
  }
}

// Run if file is executed directly
if (require.main === module) {
  main();
}
