/**
 * Модуль для запросов к расширенному AST
 * 
 * Предоставляет удобные методы для поиска и анализа узлов в расширенном AST.
 */

import * as ts from 'typescript';
import {
  EnhancedASTNode,
  EnhancedASTResult,
  SourceRange,
  NodeFlags,
  SyntaxTokenType
} from './enhanced-ast-types';

/**
 * Результат поиска узлов
 */
export interface NodeSearchResult {
  /** Найденные узлы */
  nodes: EnhancedASTNode[];
  
  /** Общее количество проверенных узлов */
  totalChecked: number;
  
  /** Время поиска в миллисекундах */
  searchTimeMs: number;
}

/**
 * Предикат для фильтрации узлов
 */
export type NodePredicate = (node: EnhancedASTNode) => boolean;

/**
 * Опции для поиска узлов
 */
export interface SearchOptions {
  /** Максимальная глубина поиска */
  maxDepth?: number;
  
  /** Включить ли дочерние узлы в результат */
  includeChildren?: boolean;
  
  /** Остановиться на первом найденном узле */
  stopOnFirst?: boolean;
}

/**
 * Класс для выполнения запросов к расширенному AST
 */
export class EnhancedASTQuery {
  private ast: EnhancedASTResult;

  constructor(ast: EnhancedASTResult) {
    this.ast = ast;
  }

  /**
   * Находит узел по абсолютной позиции в файле
   */
  public findNodeAtPosition(position: number): EnhancedASTNode | undefined {
    return this.ast.positionMap.get(position);
  }

  /**
   * Находит узел по позиции строки и колонки
   */
  public findNodeAtLineColumn(line: number, column: number): EnhancedASTNode | undefined {
    const position = this.ast.sourceFile.getPositionOfLineAndCharacter(line, column);
    return this.findNodeAtPosition(position);
  }

  /**
   * Находит все узлы в заданном диапазоне
   */
  public findNodesInRange(range: SourceRange): EnhancedASTNode[] {
    const nodes: EnhancedASTNode[] = [];
    
    for (let pos = range.start.offset; pos < range.end.offset; pos++) {
      const node = this.ast.positionMap.get(pos);
      if (node && !nodes.includes(node)) {
        nodes.push(node);
      }
    }
    
    return nodes;
  }

  /**
   * Находит минимальный узел, который полностью покрывает заданный диапазон
   */
  public findMinimalCoveringNode(range: SourceRange): EnhancedASTNode | undefined {
    let minimalNode: EnhancedASTNode | undefined;
    let minimalSize = Infinity;

    const checkNode = (node: EnhancedASTNode) => {
      // Узел должен полностью покрывать диапазон
      if (node.fullRange.start.offset <= range.start.offset && 
          node.fullRange.end.offset >= range.end.offset) {
        
        const nodeSize = node.fullRange.end.offset - node.fullRange.start.offset;
        if (nodeSize < minimalSize) {
          minimalSize = nodeSize;
          minimalNode = node;
        }
      }
    };

    this.traverseNodes(this.ast.root, checkNode);
    return minimalNode;
  }

  /**
   * Находит все узлы заданного типа
   */
  public findNodesByKind(kind: ts.SyntaxKind, options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => node.kind === kind, options);
  }

  /**
   * Находит все узлы с заданными флагами
   */
  public findNodesByFlags(flags: NodeFlags, options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => (node.metadata.flags & flags) !== 0, options);
  }

  /**
   * Находит все узлы, которые можно разбить
   */
  public findBreakableNodes(options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => node.metadata.canBreak, options);
  }

  /**
   * Находит все длинные узлы (превышающие заданную длину)
   */
  public findLongNodes(maxLength: number, options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => {
      const nodeLength = node.fullRange.end.offset - node.fullRange.start.offset;
      return nodeLength > maxLength;
    }, options);
  }

  /**
   * Находит все узлы с комментариями
   */
  public findNodesWithComments(options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => {
      // Проверяем наличие комментариев в синтаксических токенах
      return node.syntaxTokens.some(token => 
        token.type === SyntaxTokenType.LINE_COMMENT || 
        token.type === SyntaxTokenType.BLOCK_COMMENT
      );
    }, options);
  }

  /**
   * Находит все узлы, соответствующие предикату
   */
  public findNodes(predicate: NodePredicate, options: SearchOptions = {}): NodeSearchResult {
    const startTime = Date.now();
    const nodes: EnhancedASTNode[] = [];
    let totalChecked = 0;

    const search = (node: EnhancedASTNode, depth: number = 0) => {
      totalChecked++;

      // Проверяем ограничение глубины
      if (options.maxDepth !== undefined && depth > options.maxDepth) {
        return;
      }

      // Проверяем предикат
      if (predicate(node)) {
        nodes.push(node);
        
        // Останавливаемся на первом найденном, если требуется
        if (options.stopOnFirst) {
          return;
        }
      }

      // Обрабатываем дочерние узлы
      if (options.includeChildren !== false) {
        for (const child of node.children) {
          search(child, depth + 1);
          
          // Проверяем, нужно ли остановиться
          if (options.stopOnFirst && nodes.length > 0) {
            return;
          }
        }
      }
    };

    search(this.ast.root);

    return {
      nodes,
      totalChecked,
      searchTimeMs: Date.now() - startTime
    };
  }

  /**
   * Получает путь от корня до заданного узла
   */
  public getNodePath(targetNode: EnhancedASTNode): EnhancedASTNode[] {
    const path: EnhancedASTNode[] = [];
    let current: EnhancedASTNode | undefined = targetNode;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  /**
   * Получает соседние узлы (предыдущий и следующий)
   */
  public getSiblings(node: EnhancedASTNode): { previous?: EnhancedASTNode; next?: EnhancedASTNode } {
    if (!node.parent) {
      return {}; // Корневой узел не имеет соседей
    }

    const siblings = node.parent.children;
    const index = siblings.indexOf(node);

    const result: { previous?: EnhancedASTNode; next?: EnhancedASTNode } = {};
    
    const previousSibling = index > 0 ? siblings[index - 1] : undefined;
    const nextSibling = index < siblings.length - 1 ? siblings[index + 1] : undefined;
    
    if (previousSibling) {
      result.previous = previousSibling;
    }
    
    if (nextSibling) {
      result.next = nextSibling;
    }
    
    return result;
  }

  /**
   * Получает все узлы на заданном уровне вложенности
   */
  public getNodesAtDepth(depth: number): EnhancedASTNode[] {
    const nodes: EnhancedASTNode[] = [];

    const traverse = (node: EnhancedASTNode, currentDepth: number = 0) => {
      if (currentDepth === depth) {
        nodes.push(node);
        return; // Не углубляемся дальше
      }

      if (currentDepth < depth) {
        for (const child of node.children) {
          traverse(child, currentDepth + 1);
        }
      }
    };

    traverse(this.ast.root);
    return nodes;
  }

  /**
   * Получает статистику по типам узлов
   */
  public getNodeTypeStatistics(): Map<ts.SyntaxKind, number> {
    const statistics = new Map<ts.SyntaxKind, number>();

    this.traverseNodes(this.ast.root, (node) => {
      const count = statistics.get(node.kind) || 0;
      statistics.set(node.kind, count + 1);
    });

    return statistics;
  }

  /**
   * Проверяет, содержит ли узел заданную позицию
   */
  public nodeContainsPosition(node: EnhancedASTNode, position: number): boolean {
    return node.fullRange.start.offset <= position && position < node.fullRange.end.offset;
  }

  /**
   * Проверяет, пересекаются ли два узла
   */
  public nodesIntersect(node1: EnhancedASTNode, node2: EnhancedASTNode): boolean {
    return !(node1.fullRange.end.offset <= node2.fullRange.start.offset ||
             node2.fullRange.end.offset <= node1.fullRange.start.offset);
  }

  /**
   * Получает текст узла с учетом всех токенов
   */
  public getFullNodeText(node: EnhancedASTNode): string {
    // Восстанавливаем текст из синтаксических токенов
    return node.syntaxTokens.map(token => token.text).join('');
  }

  /**
   * Восстанавливает оригинальный текст из AST узлов
   */
  public reconstructOriginalText(): string {
    // НАСТОЯЩЕЕ восстановление из узлов AST
    return this.reconstructFromNode(this.ast.root);
  }

  /**
   * Рекурсивно восстанавливает текст из узла AST
   */
  private reconstructFromNode(node: EnhancedASTNode): string {
    let result = '';

    // Сначала добавляем модификаторы (export, async и т.д.)
    if (node.modifiers && node.modifiers.length > 0) {
      for (const modifier of node.modifiers) {
        result += this.reconstructFromNode(modifier);
      }
    }

    // Добавляем ключевые слова на основе флагов узла
    result += this.getKeywordsFromFlags(node);

    // Для всех узлов используем их собственный текст
    // (он уже включает все содержимое, включая детей)
    result += node.text;

    return result;
  }

  /**
   * Извлекает ключевые слова на основе флагов узла
   */
  private getKeywordsFromFlags(node: EnhancedASTNode): string {
    if (!node.nodeFlags) {
      return '';
    }

    let keywords = '';
    
    // Обрабатываем флаги VariableDeclarationList
    if (node.kind === ts.SyntaxKind.VariableDeclarationList) {
      if (node.nodeFlags & ts.NodeFlags.Const) {
        keywords += 'const ';
      } else if (node.nodeFlags & ts.NodeFlags.Let) {
        keywords += 'let ';
      } else if (node.nodeFlags & ts.NodeFlags.Using) {
        keywords += 'using ';
      } else if (node.nodeFlags & ts.NodeFlags.AwaitUsing) {
        keywords += 'await using ';
      } else {
        keywords += 'var ';
      }
    }

    return keywords;
  }

  /**
   * Проверяет корректность восстановления текста
   */
  public validateTextReconstruction(): { isValid: boolean; differences?: string[] } {
    const reconstructed = this.reconstructOriginalText();
    const original = this.ast.sourceFile.getFullText();

    if (reconstructed === original) {
      return { isValid: true };
    }

    // Анализируем различия
    const differences: string[] = [];
    const minLength = Math.min(reconstructed.length, original.length);

    for (let i = 0; i < minLength; i++) {
      if (reconstructed[i] !== original[i]) {
        const context = 20;
        const start = Math.max(0, i - context);
        const end = Math.min(minLength, i + context);
        
        differences.push(
          `Позиция ${i}: ` +
          `оригинал="${original.substring(start, end)}", ` +
          `восстановлено="${reconstructed.substring(start, end)}"`
        );
        
        if (differences.length >= 5) break; // Ограничиваем количество различий
      }
    }

    if (reconstructed.length !== original.length) {
      differences.push(
        `Различие в длине: оригинал=${original.length}, восстановлено=${reconstructed.length}`
      );
    }

    return { isValid: false, differences };
  }

  /**
   * Вспомогательный метод для обхода всех узлов
   */
  private traverseNodes(node: EnhancedASTNode, callback: (node: EnhancedASTNode) => void): void {
    callback(node);
    
    for (const child of node.children) {
      this.traverseNodes(child, callback);
    }
  }
}
