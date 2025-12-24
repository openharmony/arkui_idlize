/**
 * Extended AST builder with complete coordinate and token information
 *
 * This module is responsible for creating extended AST that preserves all
 * information necessary for accurate reconstruction of original text.
 */

import * as ts from 'typescript';
import {
  EnhancedASTNode,
  EnhancedASTResult,
  EnhancedASTOptions,
  SourcePosition,
  SourceRange,
  NodeMetadata,
  NodeFlags,
  ASTStatistics,
  ASTError,
  ASTErrorType,
  SyntaxToken,
  SyntaxTokenType
} from './enhanced-ast-types';
import { SyntaxTokenizer, createTokenizer } from './syntax-tokenizer';

/**
 * Extended AST builder
 */
export class EnhancedASTBuilder {
  /** Root node of standard TypeScript AST (not file on disk!) */
  private sourceFile: ts.SourceFile;
  private sourceText: string;
  private options: EnhancedASTOptions;
  private positionMap: Map<number, EnhancedASTNode>;
  private errors: ASTError[];
  private statistics: ASTStatistics;
  private startTime: number;
  private tokenizer: SyntaxTokenizer;
  private includeRanges: SourceRange[] | undefined;

  /**
   * Creates extended AST builder
   * @param typescriptAST - root node of standard TypeScript AST (result of ts.createSourceFile)
   * @param options - build options
   */
  constructor(typescriptAST: ts.SourceFile, options: Partial<EnhancedASTOptions> = {}) {
    this.sourceFile = typescriptAST;
    this.sourceText = typescriptAST.getFullText();
    this.options = {
      preserveComments: true,
      preserveWhitespace: true,
      maxDepth: 50,
      enableDiagnostics: false,
      ...options
    };
    this.positionMap = new Map();
    this.errors = [];
    this.statistics = {
      totalNodes: 0,
      commentCount: 0,
      buildTimeMs: 0,
      sourceSize: this.sourceText.length
    };
    this.startTime = Date.now();
    
    // Create tokenizer for obtaining syntactic tokens
    // Determine LanguageVariant from SourceFile (JSX for .tsx files)
    const languageVariant = typescriptAST.languageVariant;
    this.tokenizer = createTokenizer(this.sourceText, typescriptAST.languageVersion, languageVariant);
    this.includeRanges = this.options.includeRanges;
  }

  /**
   * Builds extended AST for entire file
   */
  public build(): EnhancedASTResult {
    try {
      this.log('Starting extended AST construction');
      
      const root = this.buildEnhancedNode(this.sourceFile) as EnhancedASTNode;
      this.statistics.buildTimeMs = Date.now() - this.startTime;
      
      this.log(`Construction completed in ${this.statistics.buildTimeMs}ms`);
      this.log(`Nodes created: ${this.statistics.totalNodes}`);
      
      return {
        root,
        sourceFile: this.sourceFile,
        positionMap: this.positionMap,
        statistics: this.statistics,
        errors: this.errors
      };
    } catch (error) {
      this.addError(ASTErrorType.INTERNAL_ERROR, `Critical error during AST construction: ${error}`);
      throw error;
    }
  }

  /**
   * Builds extended node for TypeScript node
   */
  private buildEnhancedNode(node: ts.Node, parent?: EnhancedASTNode, depth: number = 0): EnhancedASTNode | null {
    if (depth > this.options.maxDepth) {
      this.addError(ASTErrorType.INTERNAL_ERROR, 'Maximum recursion depth exceeded', this.getSourcePosition(node.getStart()));
      throw new Error('Maximum recursion depth exceeded');
    }

    this.statistics.totalNodes++;

    // Get complete position information for node
    const fullRange = this.getFullRange(node);
    const contentRange = this.getContentRange(node);
    
    // If range filtering is enabled and node is completely outside interesting ranges —
    // skip building this subtree (performance optimization)
    if (this.includeRanges && !this.intersectsAny(fullRange, this.includeRanges)) {
      return null;
    }

    // Extract node text (from start to end, without leading trivia)
    const nodeStart = node.getStart(this.sourceFile);
    const nodeEnd = node.getEnd();
    const text = this.sourceText.substring(nodeStart, nodeEnd);

    // Create node metadata
    const metadata = this.createNodeMetadata(node, depth);
    
    // Get syntactic tokens for node
    const syntaxTokens = this.buildSyntaxTokens(node);
    
    // Process modifiers - pass current node as parent
    const modifiers: EnhancedASTNode[] = [];
    if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
      for (const modifier of node.modifiers) {
        const enhancedModifier = this.buildEnhancedNodeWithParentNode(modifier, node, depth + 1);
        modifiers.push(enhancedModifier);
      }
    }

    // Get node flags
    const nodeFlags = 'flags' in node ? (node.flags as ts.NodeFlags) : undefined;

    // Create extended node
    const enhancedNode: EnhancedASTNode = {
      originalNode: node,
      kind: node.kind,
      fullRange,
      contentRange,
      text,
      syntaxTokens,
      children: [],
      ...(modifiers.length > 0 && { modifiers }),
      ...(nodeFlags !== undefined && { nodeFlags }),
      ...(parent && { parent }),
      metadata
    };

    // Add to position map
    for (let pos = fullRange.start.offset; pos < fullRange.end.offset; pos++) {
      this.positionMap.set(pos, enhancedNode);
    }

    // Process child nodes (excluding modifiers)
    const children: EnhancedASTNode[] = [];
    const modifierNodes = new Set(modifiers.map(m => m.originalNode));
    
    ts.forEachChild(node, (child) => {
      // If filtering is enabled and child node is outside ranges — skip it
      if (this.includeRanges) {
        const cFull = this.getFullRange(child);
        if (!this.intersectsAny(cFull, this.includeRanges)) {
          return;
        }
      }
      // Skip modifiers - they are already processed separately
      if (!modifierNodes.has(child)) {
        const enhancedChild = this.buildEnhancedNode(child, enhancedNode, depth + 1);
        if (enhancedChild) children.push(enhancedChild);
      }
    });

    // Sort child nodes by position
    if (children.length > 0) {
      children.sort((a, b) => a.fullRange.start.offset - b.fullRange.start.offset);
    }

    // Nodes without child elements remain as is - no fallback splits

    enhancedNode.children = children;
    
    // Link syntactic tokens with covering nodes
    // This needs to be done after building all child nodes
    this.linkSemanticNodesToTokens(enhancedNode);

    this.log(`Created node ${ts.SyntaxKind[node.kind]} at position ${fullRange.start.offset}-${fullRange.end.offset}, text: "${text.substring(0, 30)}..."`);
    
    return enhancedNode;
  }

  /**
   * Builds extended node with explicit specification of original parent node
   * Used for modifiers and other special nodes
   */
  private buildEnhancedNodeWithParentNode(node: ts.Node, _parentNode: ts.Node, depth: number = 0): EnhancedASTNode {
    if (depth > this.options.maxDepth) {
      this.addError(ASTErrorType.INTERNAL_ERROR, 'Maximum recursion depth exceeded', this.getSourcePosition(node.getStart()));
      throw new Error('Maximum recursion depth exceeded');
    }

    this.statistics.totalNodes++;

    // Get complete position information for node
    const fullRange = this.getFullRange(node);
    const contentRange = this.getContentRange(node);
    
    // Extract node text (from start to end, without leading trivia)
    const nodeStart = node.getStart(this.sourceFile);
    const nodeEnd = node.getEnd();
    const text = this.sourceText.substring(nodeStart, nodeEnd);

    // Create node metadata
    const metadata = this.createNodeMetadata(node, depth);
    
    // Get syntactic tokens for node
    const syntaxTokens = this.buildSyntaxTokens(node);

    // Get node flags
    const nodeFlags = 'flags' in node ? (node.flags as ts.NodeFlags) : undefined;

    // Create extended node (without parent, as modifiers are stored separately)
    const enhancedNode: EnhancedASTNode = {
      originalNode: node,
      kind: node.kind,
      fullRange,
      contentRange,
      text,
      syntaxTokens,
      children: [],
      ...(nodeFlags !== undefined && { nodeFlags }),
      metadata
    };

    // Add to position map
    for (let pos = fullRange.start.offset; pos < fullRange.end.offset; pos++) {
      this.positionMap.set(pos, enhancedNode);
    }

    this.log(`Created modifier node ${ts.SyntaxKind[node.kind]} at position ${fullRange.start.offset}-${fullRange.end.offset}, text: "${text}"`);
    
    return enhancedNode;
  }

  /**
   * Builds list of syntactic tokens for node
   * Uses TypeScript Scanner API to obtain tokens
   * 
   * For child nodes creates special tokens of type SEMANTIC_NODE,
   * that reference corresponding Enhanced AST nodes.
   * This will be done later, after building all child nodes.
   */
  private buildSyntaxTokens(node: ts.Node): SyntaxToken[] {
    const fullStart = node.getFullStart();
    const end = node.getEnd();
    
    // Tokenize entire node range (including leading trivia)
    // Token replacement with SEMANTIC_NODE will be performed in linkSemanticNodesToTokens
    return this.tokenizer.tokenize(fullStart, end);
  }

  /**
   * Links covering nodes with syntactic tokens
   * 
   * Replaces child node ranges with tokens of type SEMANTIC_NODE,
   * that contain references to corresponding Enhanced AST nodes.
   * 
   * @param enhancedNode - Enhanced AST node with built children
   */
  private linkSemanticNodesToTokens(enhancedNode: EnhancedASTNode): void {
    if (enhancedNode.children.length === 0 && 
        (!enhancedNode.modifiers || enhancedNode.modifiers.length === 0)) {
      // No child nodes - tokens remain as is
      return;
    }

    const newTokens: SyntaxToken[] = [];
    const allChildNodes = [
      ...(enhancedNode.modifiers || []),
      ...enhancedNode.children
    ];

    // Sort child nodes by position
    allChildNodes.sort((a, b) => a.fullRange.start.offset - b.fullRange.start.offset);

    let tokenIndex = 0;
    let childIndex = 0;

    while (tokenIndex < enhancedNode.syntaxTokens.length) {
      const token = enhancedNode.syntaxTokens[tokenIndex];
      if (!token) break;
      
      // Check if current token falls within child node range
      if (childIndex < allChildNodes.length) {
        const child = allChildNodes[childIndex];
        if (!child) {
          tokenIndex++;
          continue;
        }
        
        const childStart = child.fullRange.start.offset;
        const childEnd = child.fullRange.end.offset;
        const tokenStart = token.position.offset;
        const tokenEnd = tokenStart + token.text.length;

        // Token completely inside child node - skip
        if (tokenStart >= childStart && tokenEnd <= childEnd && !this.shouldExposeChildTokens(child)) {
          // If this is first token of child node, create SEMANTIC_NODE
          // SEMANTIC_NODE will be skipped during formatting, and its child nodes
          // will be processed recursively, including operators, commas and other tokens
          if (tokenStart === childStart) {
            newTokens.push({
              type: SyntaxTokenType.SEMANTIC_NODE,
              text: child.text,
              position: child.fullRange.start,
              semanticNode: child,
              tsKind: child.kind
            });
          }
          
          // Skip all tokens until end of child node
          while (tokenIndex < enhancedNode.syntaxTokens.length) {
            const t = enhancedNode.syntaxTokens[tokenIndex];
            if (!t) break;
            const tEnd = t.position.offset + t.text.length;
            if (tEnd <= childEnd) {
              tokenIndex++;
            } else {
              break;
            }
          }
          
          childIndex++;
          continue;
        }
        
        // Token before child node - add as regular token
        if (tokenEnd <= childStart) {
          newTokens.push(token);
          tokenIndex++;
          continue;
        }
        
        // Token crosses child node boundary - shouldn't happen
        // Add token and move to next child node
        newTokens.push(token);
        tokenIndex++;
      } else {
        // All child nodes processed - add remaining tokens
        newTokens.push(token);
        tokenIndex++;
      }
    }

    enhancedNode.syntaxTokens = newTokens;
    
    // Recursively process child nodes
    for (const child of allChildNodes) {
      this.linkSemanticNodesToTokens(child);
    }
  }

  /**
   * Some nodes (e.g., FirstAssignment/LastAssignment) should preserve their tokens,
   * so operators (e.g., '=') are available at parent level.
   */
  private shouldExposeChildTokens(node: EnhancedASTNode): boolean {
    return (
      node.kind >= ts.SyntaxKind.FirstAssignment &&
      node.kind <= ts.SyntaxKind.LastAssignment
    );
  }

  /**
   * Gets full node range (including leading/trailing trivia)
   */
  private getFullRange(node: ts.Node): SourceRange {
    const fullStart = node.getFullStart();
    const end = node.getEnd();
    
    return {
      start: this.getSourcePosition(fullStart),
      end: this.getSourcePosition(end)
    };
  }

  /**
   * Gets node content range (without trivia)
   */
  private getContentRange(node: ts.Node): SourceRange {
    const start = node.getStart(this.sourceFile);
    const end = node.getEnd();
    
    return {
      start: this.getSourcePosition(start),
      end: this.getSourcePosition(end)
    };
  }

  /**
   * Converts absolute offset to position with line and column number
   */
  private getSourcePosition(offset: number): SourcePosition {
    const lineAndChar = this.sourceFile.getLineAndCharacterOfPosition(offset);
    return {
      offset,
      line: lineAndChar.line,
      column: lineAndChar.character
    };
  }

  /**
   * Creates metadata for node
   */
  private createNodeMetadata(node: ts.Node, depth: number): NodeMetadata {
    const canBreak = this.canNodeBreak(node);
    const breakPriority = this.calculateBreakPriority(node);
    const indentLevel = depth;
    const isAtomic = this.isAtomicNode(node);
    const flags = this.calculateNodeFlags(node);

    const forceBreakLength = this.calculateForceBreakLength(node);
    
    return {
      canBreak,
      breakPriority,
      indentLevel,
      isAtomic,
      flags,
      ...(forceBreakLength !== undefined && { forceBreakLength })
    };
  }

  /**
   * Determines if node can be split into multiple lines
   */
  private canNodeBreak(node: ts.Node): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.Identifier:
        return false;
      
      case ts.SyntaxKind.CallExpression:
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.IntersectionType:
        return true;
      
      default:
        return node.getEnd() - node.getStart() > 40; // Heuristic: long nodes can be split
    }
  }

  /**
   * Calculates node break priority
   */
  private calculateBreakPriority(node: ts.Node): number {
    if (this.options.breakPriorityCalculator) {
      return this.options.breakPriorityCalculator(node);
    }

    // Base priorities by node types
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
        return 1; // Highest priority
      
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
        return 2;
      
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.IntersectionType:
        return 3;
      
      case ts.SyntaxKind.CallExpression:
        return 4;
      
      case ts.SyntaxKind.BinaryExpression:
        return 5;
      
      default:
        return 10; // Low priority
    }
  }

  /**
   * Determines if node is atomic (indivisible)
   */
  private isAtomicNode(node: ts.Node): boolean {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.BooleanKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.UndefinedKeyword:
      case ts.SyntaxKind.Identifier:
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Calculates node flags
   */
  private calculateNodeFlags(node: ts.Node): NodeFlags {
    let flags = NodeFlags.NONE;

    // Check for comments
    const fullStart = node.getFullStart();
    const start = node.getStart(this.sourceFile);
    if (fullStart < start) {
      const triviaText = this.sourceText.substring(fullStart, start);
      if (triviaText.includes('//') || triviaText.includes('/*')) {
        flags |= NodeFlags.HAS_COMMENTS;
      }
    }

    // Check node context
    if (this.isInCallChain(node)) {
      flags |= NodeFlags.IN_CALL_CHAIN;
    }

    if (this.isInTypeUnion(node)) {
      flags |= NodeFlags.IN_TYPE_UNION;
    }

    if (this.hasStringLiterals(node)) {
      flags |= NodeFlags.HAS_STRING_LITERALS;
    }

    if (this.isInFunctionDeclaration(node)) {
      flags |= NodeFlags.IN_FUNCTION_DECLARATION;
    }

    if (this.isInClassDeclaration(node)) {
      flags |= NodeFlags.IN_CLASS_DECLARATION;
    }

    return flags;
  }

  /**
   * Calculates length for forced break
   */
  private calculateForceBreakLength(node: ts.Node): number | undefined {
    const nodeLength = node.getEnd() - node.getStart();
    
    // For very long nodes set forced break
    if (nodeLength > 120) {
      return 80; // Split into parts of 80 characters
    }
    
    return undefined;
  }


  // Fallback methods removed - no forced splits

  // Helper methods for determining node context

  private isInCallChain(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isCallExpression(parent) || ts.isPropertyAccessExpression(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private isInTypeUnion(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isUnionTypeNode(parent) || ts.isIntersectionTypeNode(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private hasStringLiterals(node: ts.Node): boolean {
    let hasStrings = false;
    
    const visit = (n: ts.Node) => {
      if (ts.isStringLiteral(n)) {
        hasStrings = true;
        return;
      }
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    return hasStrings;
  }

  private isInFunctionDeclaration(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isFunctionDeclaration(parent) || ts.isMethodDeclaration(parent) || ts.isArrowFunction(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private isInClassDeclaration(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isClassDeclaration(parent) || ts.isInterfaceDeclaration(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Adds error to list
   */
  private addError(type: ASTErrorType, message: string, position?: SourcePosition, node?: ts.Node): void {
    this.errors.push({
      type,
      message,
      ...(position && { position }),
      ...(node && { node })
    });
  }

  /**
   * Logs message (if diagnostics enabled)
   */
  private log(_message: string): void {
    if (this.options.enableDiagnostics) {
    }
  }

  /** Checks range intersection */
  private intersectsAny(a: SourceRange, ranges: SourceRange[]): boolean {
    for (const r of ranges) {
      if (a.start.offset < r.end.offset && r.start.offset < a.end.offset) return true;
    }
    return false;
  }
}
