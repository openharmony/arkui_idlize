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
  
  // Вычисляем отступ (количество пробелов перед текстом)
  const leadingTrivia = fullStart !== start ? sourceText.substring(fullStart, start) : '';
  const leadingSpaces = leadingTrivia.match(/^ */)?.[0]?.length || 0;
  
  // Первым параметром - отступ и размер текста
  metadata.push(`{indent: ${leadingSpaces}, textLen: ${text.length}}`);
  
  metadata.push(`type: ${ts.SyntaxKind[node.kind]}`);
  
  // Добавляем позиции
  if (fullStart !== start) {
    metadata.push(`pos: ${fullStart}-${start}-${end}`);
  } else {
    metadata.push(`pos: ${start}-${end}`);
  }
  
  // Проверяем модификаторы
  if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
    const modifierNames = node.modifiers.map(m => ts.SyntaxKind[m.kind]).join(', ');
    metadata.push(`modifiers: [${modifierNames}]`);
  }
  
  // Проверяем флаги
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
  
  // Проверяем leading trivia
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
  
  // Добавляем количество детей
  const modifiersCount = ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) ? node.modifiers.length : 0;
  const childrenCount = modifiersCount + node.getChildCount(sourceFile);
  if (childrenCount > 0) {
    metadata.push(`children: ${childrenCount}`);
  }
  
  // Выводим узел в двухстрочном формате
  console.log(`${prefix}${connectorSymbol}"${escapedDisplayText}"`);
  const metadataLine = metadata.join('; ');
  console.log(`${childPrefix}┃(${metadataLine})`);
  
  // Собираем ВСЕ дочерние узлы, включая модификаторы
  const children: ts.Node[] = [];
  
  // Добавляем модификаторы если есть
  if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
    children.push(...node.modifiers);
  }
  
  // Добавляем обычные дочерние узлы
  ts.forEachChild(node, child => {
    // Избегаем дублирования модификаторов
    if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
      if (!node.modifiers.includes(child)) {
        children.push(child);
      }
    } else {
      children.push(child);
    }
  });
  
  // Рекурсивно выводим детей
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
  
  // Показываем модификаторы
  if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
    console.log(`${indent}  modifiers:`);
    for (const modifier of node.modifiers) {
      const modText = sourceText.substring(modifier.getStart(sourceFile), modifier.getEnd());
      console.log(`${indent}    ${ts.SyntaxKind[modifier.kind]}: "${modText}"`);
    }
  }
  
  // Показываем флаги
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
    console.log('Использование: npx ts-node ast-viewer.ts <файл>');
    console.log('Или: npx ts-node ast-viewer.ts --code "код"');
    process.exit(1);
  }
  
  let sourceCode: string;
  let fileName: string;
  
  if (args[0] === '--code') {
    if (!args[1]) {
      console.error('Не указан код после --code');
      process.exit(1);
    }
    sourceCode = args[1];
    fileName = 'inline.ts';
  } else {
    if (!args[0]) {
      console.error('Не указан файл');
      process.exit(1);
    }
    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
      console.error(`Файл не найден: ${filePath}`);
      process.exit(1);
    }
    sourceCode = fs.readFileSync(filePath, 'utf-8');
    fileName = path.basename(filePath);
  }
  
  console.log(`=== AST для файла: ${fileName} ===`);
  console.log(`Размер: ${sourceCode.length} символов`);
  console.log('');
  
  // Создание AST
  const sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, true);
  
  console.log('=== СТРУКТУРА ДЕРЕВА ===');
  printTreeStructure(sourceFile, sourceFile);
  console.log('');
  
  console.log('=== ПОДРОБНАЯ ИНФОРМАЦИЯ ===');
  printAST(sourceFile, sourceFile);
  
  // console.log('');
  // console.log('=== ИСХОДНЫЙ ТЕКСТ ===');
  // console.log(`"${sourceCode}"`);
}

main();
