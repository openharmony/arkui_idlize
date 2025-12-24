#!/usr/bin/env node

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

function printTreeStructure(node: ts.Node, sourceFile: ts.SourceFile, depth = 0, isLast = true, prefix = '') {
  const sourceText = sourceFile.getFullText();
  const fullStart = node.getFullStart();
  const start = node.getStart(sourceFile);
  const end = node.getEnd();
  const text = sourceText.substring(start, end);
  
  const connectorSymbol = isLast ? '└───┨' : '├───┨';
  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  
  const displayText = text
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\\/g, '\\\\');
  const escapedDisplayText = displayText.replace(/"/g, '\\"');
  
  const metadata: string[] = [];
  
  // Calculate indent (number of spaces before text)
  const leadingTrivia = fullStart !== start ? sourceText.substring(fullStart, start) : '';
  const leadingSpaces = leadingTrivia.match(/^ */)?.[0]?.length || 0;
  
  // First parameter - indent and text size
  metadata.push(`{indent: ${leadingSpaces}, textLen: ${text.length}}`);
  
  metadata.push(`type: ${ts.SyntaxKind[node.kind]}`);
  
  // Add positions
  if (fullStart !== start) {
    metadata.push(`pos: ${fullStart}-${start}-${end}`);
  } else {
    metadata.push(`pos: ${start}-${end}`);
  }
  
  // Check modifiers
  if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
    const modifierNames = node.modifiers.map(m => ts.SyntaxKind[m.kind]).join(', ');
    metadata.push(`modifiers: [${modifierNames}]`);
  }
  
  // Check flags
  if ('flags' in node && node.flags) {
    const flagNames: string[] = [];
    if (node.flags & ts.NodeFlags.Const) flagNames.push('Const');
    if (node.flags & ts.NodeFlags.Let) flagNames.push('Let');
    if (node.flags & ts.NodeFlags.Using) flagNames.push('Using');
    if (node.flags & ts.NodeFlags.AwaitUsing) flagNames.push('AwaitUsing');
    
    if (flagNames.length > 0) {
      metadata.push(`flags: [${flagNames.join(', ')}]`);
    } else {
      metadata.push(`flags: ${node.flags}`);
    }
  }
  
  // Check leading trivia
  if (fullStart !== start) {
    const leadingTrivia = sourceText.substring(fullStart, start);
    if (leadingTrivia.length > 0) {
      const triviaDisplay = leadingTrivia
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      metadata.push(`trivia: "${triviaDisplay}"`);
    }
  }
  
  // Add number of children
  const modifiersCount = ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) ? node.modifiers.length : 0;
  const childrenCount = modifiersCount + node.getChildCount(sourceFile);
  if (childrenCount > 0) {
    metadata.push(`children: ${childrenCount}`);
  }
  
  // Output node in two-line format
  console.log(`${prefix}${connectorSymbol}"${escapedDisplayText}"`);
  const metadataLine = metadata.join('; ');
  console.log(`${childPrefix}┃(${metadataLine})`);
  
  // Collect ALL child nodes, including modifiers
  const children: ts.Node[] = [];
  
  // Add modifiers if any
  if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
    children.push(...node.modifiers);
  }
  
  // Add regular child nodes
  ts.forEachChild(node, child => {
    // Avoid duplicating modifiers
    if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
      if (!node.modifiers.includes(child)) {
        children.push(child);
      }
    } else {
      children.push(child);
    }
  });
  
  // Recursively output children
  children.forEach((child, index) => {
    const isLastChild = index === children.length - 1;
    printTreeStructure(child, sourceFile, depth + 1, isLastChild, childPrefix);
  });
}

function printAST(node: ts.Node, sourceFile: ts.SourceFile, depth = 0) {
  const indent = '  '.repeat(depth);
  const sourceText = sourceFile.getFullText();
  
  const fullStart = node.getFullStart();
  const start = node.getStart(sourceFile);
  const end = node.getEnd();
  
  const fullText = sourceText.substring(fullStart, end);
  const text = sourceText.substring(start, end);
  const leadingTrivia = sourceText.substring(fullStart, start);
  
  console.log(`${indent}${ts.SyntaxKind[node.kind]} (${fullStart}-${start}-${end})`);
  console.log(`${indent}  fullText: "${fullText}"`);
  console.log(`${indent}  text: "${text}"`);
  if (leadingTrivia) {
    console.log(`${indent}  leadingTrivia: "${leadingTrivia}"`);
  }
  
  // Show modifiers
  if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
    console.log(`${indent}  modifiers:`);
    for (const modifier of node.modifiers) {
      const modText = sourceText.substring(modifier.getStart(sourceFile), modifier.getEnd());
      console.log(`${indent}    ${ts.SyntaxKind[modifier.kind]}: "${modText}"`);
    }
  }
  
  // Show flags
  if ('flags' in node && node.flags) {
    const flagNames: string[] = [];
    if (node.flags & ts.NodeFlags.Const) flagNames.push('Const');
    if (node.flags & ts.NodeFlags.Let) flagNames.push('Let');
    if (node.flags & ts.NodeFlags.Using) flagNames.push('Using');
    if (node.flags & ts.NodeFlags.AwaitUsing) flagNames.push('AwaitUsing');
    
    if (flagNames.length > 0) {
      console.log(`${indent}  flags: ${node.flags} (${flagNames.join(', ')})`);
    } else {
      console.log(`${indent}  flags: ${node.flags}`);
    }
  }
  
  console.log('');
  
  ts.forEachChild(node, child => printAST(child, sourceFile, depth + 1));
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx ts-node ast-viewer.ts <file>');
    console.log('Or: npx ts-node ast-viewer.ts --code "code"');
    process.exit(1);
  }
  
  let sourceCode: string;
  let fileName: string;
  
  if (args[0] === '--code') {
    if (!args[1]) {
      console.error('Code not specified after --code');
      process.exit(1);
    }
    sourceCode = args[1];
    fileName = 'inline.ts';
  } else {
    if (!args[0]) {
      console.error('File not specified');
      process.exit(1);
    }
    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    sourceCode = fs.readFileSync(filePath, 'utf-8');
    fileName = path.basename(filePath);
  }
  
  console.log(`=== AST for file: ${fileName} ===`);
  console.log(`Size: ${sourceCode.length} characters`);
  console.log('');
  
  // Create AST
  const sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, true);
  
  console.log('=== TREE STRUCTURE ===');
  printTreeStructure(sourceFile, sourceFile);
  console.log('');
  
  console.log('=== DETAILED INFORMATION ===');
  printAST(sourceFile, sourceFile);
  
  // console.log('');
  // console.log('=== SOURCE TEXT ===');
  // console.log(`"${sourceCode}"`);
}

main();
