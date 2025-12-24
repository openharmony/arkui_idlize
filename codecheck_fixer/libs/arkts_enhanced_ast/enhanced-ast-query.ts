/**
 * Module for querying extended AST
 * 
 * Provides convenient methods for finding and analyzing nodes in extended AST.
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
 * Node search result
 */
export interface NodeSearchResult {
  /** Found nodes */
  nodes: EnhancedASTNode[];
  
  /** Total number of checked nodes */
  totalChecked: number;
  
  /** Search time in milliseconds */
  searchTimeMs: number;
}

/**
 * Predicate for filtering nodes
 */
export type NodePredicate = (node: EnhancedASTNode) => boolean;

/**
 * Options for node search
 */
export interface SearchOptions {
  /** Maximum search depth */
  maxDepth?: number;
  
  /** Whether to include child nodes in result */
  includeChildren?: boolean;
  
  /** Stop on first found node */
  stopOnFirst?: boolean;
}

/**
 * Class for executing queries to extended AST
 */
export class EnhancedASTQuery {
  private ast: EnhancedASTResult;

  constructor(ast: EnhancedASTResult) {
    this.ast = ast;
  }

  /**
   * Finds node by absolute position in file
   */
  public findNodeAtPosition(position: number): EnhancedASTNode | undefined {
    return this.ast.positionMap.get(position);
  }

  /**
   * Finds node by line and column position
   */
  public findNodeAtLineColumn(line: number, column: number): EnhancedASTNode | undefined {
    const position = this.ast.sourceFile.getPositionOfLineAndCharacter(line, column);
    return this.findNodeAtPosition(position);
  }

  /**
   * Finds all nodes in given range
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
   * Finds minimal node that completely covers given range
   */
  public findMinimalCoveringNode(range: SourceRange): EnhancedASTNode | undefined {
    let minimalNode: EnhancedASTNode | undefined;
    let minimalSize = Infinity;

    const checkNode = (node: EnhancedASTNode) => {
      // Node must completely cover range
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
   * Finds all nodes of given type
   */
  public findNodesByKind(kind: ts.SyntaxKind, options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => node.kind === kind, options);
  }

  /**
   * Finds all nodes with given flags
   */
  public findNodesByFlags(flags: NodeFlags, options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => (node.metadata.flags & flags) !== 0, options);
  }

  /**
   * Finds all nodes that can be broken
   */
  public findBreakableNodes(options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => node.metadata.canBreak, options);
  }

  /**
   * Finds all long nodes (exceeding given length)
   */
  public findLongNodes(maxLength: number, options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => {
      const nodeLength = node.fullRange.end.offset - node.fullRange.start.offset;
      return nodeLength > maxLength;
    }, options);
  }

  /**
   * Finds all nodes with comments
   */
  public findNodesWithComments(options: SearchOptions = {}): NodeSearchResult {
    return this.findNodes(node => {
      // Check for comments in syntactic tokens
      return node.syntaxTokens.some(token => 
        token.type === SyntaxTokenType.LINE_COMMENT || 
        token.type === SyntaxTokenType.BLOCK_COMMENT
      );
    }, options);
  }

  /**
   * Finds all nodes matching predicate
   */
  public findNodes(predicate: NodePredicate, options: SearchOptions = {}): NodeSearchResult {
    const startTime = Date.now();
    const nodes: EnhancedASTNode[] = [];
    let totalChecked = 0;

    const search = (node: EnhancedASTNode, depth: number = 0) => {
      totalChecked++;

      // Check depth limit
      if (options.maxDepth !== undefined && depth > options.maxDepth) {
        return;
      }

      // Check predicate
      if (predicate(node)) {
        nodes.push(node);
        
        // Stop on first found if required
        if (options.stopOnFirst) {
          return;
        }
      }

      // Process child nodes
      if (options.includeChildren !== false) {
        for (const child of node.children) {
          search(child, depth + 1);
          
          // Check if need to stop
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
   * Gets path from root to given node
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
   * Gets sibling nodes (previous and next)
   */
  public getSiblings(node: EnhancedASTNode): { previous?: EnhancedASTNode; next?: EnhancedASTNode } {
    if (!node.parent) {
      return {}; // Root node has no siblings
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
   * Gets all nodes at given nesting level
   */
  public getNodesAtDepth(depth: number): EnhancedASTNode[] {
    const nodes: EnhancedASTNode[] = [];

    const traverse = (node: EnhancedASTNode, currentDepth: number = 0) => {
      if (currentDepth === depth) {
        nodes.push(node);
        return; // Don't go deeper
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
   * Gets statistics by node types
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
   * Checks if node contains given position
   */
  public nodeContainsPosition(node: EnhancedASTNode, position: number): boolean {
    return node.fullRange.start.offset <= position && position < node.fullRange.end.offset;
  }

  /**
   * Checks if two nodes intersect
   */
  public nodesIntersect(node1: EnhancedASTNode, node2: EnhancedASTNode): boolean {
    return !(node1.fullRange.end.offset <= node2.fullRange.start.offset ||
             node2.fullRange.end.offset <= node1.fullRange.start.offset);
  }

  /**
   * Gets node text including all tokens
   */
  public getFullNodeText(node: EnhancedASTNode): string {
    // Reconstruct text from syntactic tokens
    return node.syntaxTokens.map(token => token.text).join('');
  }

  /**
   * Reconstructs original text from AST nodes
   */
  public reconstructOriginalText(): string {
    // REAL reconstruction from AST nodes
    return this.reconstructFromNode(this.ast.root);
  }

  /**
   * Recursively reconstructs text from AST node
   */
  private reconstructFromNode(node: EnhancedASTNode): string {
    let result = '';

    // First add modifiers (export, async, etc.)
    if (node.modifiers && node.modifiers.length > 0) {
      for (const modifier of node.modifiers) {
        result += this.reconstructFromNode(modifier);
      }
    }

    // Add keywords based on node flags
    result += this.getKeywordsFromFlags(node);

    // For all nodes use their own text
    // (it already includes all content, including children)
    result += node.text;

    return result;
  }

  /**
   * Extracts keywords based on node flags
   */
  private getKeywordsFromFlags(node: EnhancedASTNode): string {
    if (!node.nodeFlags) {
      return '';
    }

    let keywords = '';
    
    // Handle VariableDeclarationList flags
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
   * Validates correctness of text reconstruction
   */
  public validateTextReconstruction(): { isValid: boolean; differences?: string[] } {
    const reconstructed = this.reconstructOriginalText();
    const original = this.ast.sourceFile.getFullText();

    if (reconstructed === original) {
      return { isValid: true };
    }

    // Analyze differences
    const differences: string[] = [];
    const minLength = Math.min(reconstructed.length, original.length);

    for (let i = 0; i < minLength; i++) {
      if (reconstructed[i] !== original[i]) {
        const context = 20;
        const start = Math.max(0, i - context);
        const end = Math.min(minLength, i + context);
        
        differences.push(
          `Position ${i}: ` +
          `original="${original.substring(start, end)}", ` +
          `reconstructed="${reconstructed.substring(start, end)}"`
        );
        
        if (differences.length >= 5) break; // Limit number of differences
      }
    }

    if (reconstructed.length !== original.length) {
      differences.push(
        `Length difference: original=${original.length}, reconstructed=${reconstructed.length}`
      );
    }

    return { isValid: false, differences };
  }

  /**
   * Helper method for traversing all nodes
   */
  private traverseNodes(node: EnhancedASTNode, callback: (node: EnhancedASTNode) => void): void {
    callback(node);
    
    for (const child of node.children) {
      this.traverseNodes(child, callback);
    }
  }
}
