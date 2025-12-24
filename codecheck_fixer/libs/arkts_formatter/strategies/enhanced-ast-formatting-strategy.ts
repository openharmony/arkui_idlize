/**
 * Enhanced AST formatting strategy using extended AST
 * 
 * This strategy uses new extended AST module to obtain
 * complete information about coordinates and tokens, which ensures
 * more accurate and reliable formatting.
 */

// Types are strictly controlled within the file; disabling checks not required

import * as ts from 'typescript';
import { FormattingStrategy, FormattingContext, FormatterResult, LineBreakInsertion } from '../types';
import { getLineInfo } from '../utils';
import {
  EnhancedASTNode,
  EnhancedASTQuery,
  SyntacticSeparator,
  SyntacticSeparatorCategory,
  SyntacticSeparatorRole,
  getSemanticSeparators,
  isSequenceSeparator,
  isTypeSeparator,
  preferBreakAfter,
  preferBreakBefore
} from '../../arkts_enhanced_ast';
import { cancellationToken } from '../../common/cancellation';

/**
 * Information about potential breakpoint
 * Stores both local and global positions
 */
interface BreakPoint {
  /** Local position relative to line start (for simulation) */
  position: number;
  
  /** Global position in file (for final application) */
  globalPosition: number;
  
  /** Indent level */
  indentLevel: number;
  
  /** Priority (lower = higher priority) */
  priority: number;
  
  /** Break reason */
  reason: string;
  
  /** AST node associated with this point */
  node: EnhancedASTNode;
  
  /** Break type */
  breakType: BreakType;

  /** Number of whitespace characters removed after applying break */
  trimmedWhitespace?: number;
}

/**
 * Break types
 */
enum BreakType {
  /** Break before node */
  BEFORE_NODE = 'before_node',
  
  /** Break after node */
  AFTER_NODE = 'after_node',
  
  /** Break inside node */
  INSIDE_NODE = 'inside_node',
  
  /** 
   * Break at semantic separator
   * Newline is inserted BEFORE or AFTER token depending on preferences,
   * calculated by separator classifier (see getSemanticSeparators).
   */
  AT_TOKEN = 'at_token'
}

/**
 * Line analysis result
 */
interface LineAnalysisResult {
  /** Original line */
  originalLine: string;
  
  /** Line index */
  lineIndex: number;
  
  /** Global line positions */
  globalStart: number;
  globalEnd: number;
  
  /** AST nodes covering line */
  coveringNodes: EnhancedASTNode[];
  
  /** Found breakpoints */
  breakPoints: BreakPoint[];
  
  /** Extended AST for analysis */
  ast: EnhancedASTQuery;

  /** Local index of position crossing line length limit */
  crossingLocalIndex: number;

  /** Upper covering node for prioritizing breaks */
  upperCoveringNode: EnhancedASTNode | undefined;

  /** Top-level comma positions (global) inside upperCoveringNode on this line */
  topLevelCommaGlobalPositions?: number[];

  /** Top-level comma positions (local relative to line start) */
  topLevelCommaLocalPositions?: number[];
}

export class EnhancedASTFormattingStrategy implements FormattingStrategy {
  private lineAnalysisCache = new Map<string, LineAnalysisResult>();

  private getLineCacheKey(lineIndex: number, line: string): string {
    return `${lineIndex}|${line}`;
  }

  // Returns true only when line length exceeds limit
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean {
    const lineInfo = getLineInfo(line, lineIndex, context.maxLineLength);
    return lineInfo.exceedsLimit;
  }

  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult {
    if (cancellationToken.isCancelled()) {
      return {
        lineBreaks: [],
        success: false,
        reason: 'User cancellation'
      };
    }

    const fallback = this.tryFormatMethodUnionSignature(line, lineIndex, context);
    if (fallback) {
      return fallback;
    }

    try {
      // Analyze line using extended AST
      const analysis = this.analyzeLineWithEnhancedAST(line, lineIndex, context);
      
      if (!analysis) {
        return {
          lineBreaks: [],
          success: false,
          reason: 'Failed to analyze line with extended AST'
        };
      }

      // Find optimal breakpoints
      const optimalBreaks = this.selectOptimalBreakPoints(analysis, context);
      
      if (optimalBreaks.length === 0) {
        return {
          lineBreaks: [],
          success: false,
          reason: 'No suitable breakpoints found'
        };
      }

      // Convert to LineBreakInsertion format
      const lineBreaks = this.convertToLineBreaks(optimalBreaks);
      
      // Validate result
      const isValid = this.validateBreaks(lineBreaks, analysis, context);
      
      if (!isValid) {
        return {
          lineBreaks: [],
          success: false,
          reason: 'Break validation failed'
        };
      }

      return {
        lineBreaks,
        success: true,
        reason: undefined
      };

    } catch (error) {
      return {
        lineBreaks: [],
        success: false,
        reason: `Internal error: ${error}`
      };
    }
  }

  getPriority(): number {
    return 150; // Maximum priority for Enhanced AST strategy
  }

  /**
   * Analyzes line using extended AST.
   * Converts global positions to local
   */
  private analyzeLineWithEnhancedAST(
    line: string, 
    lineIndex: number, 
    context: FormattingContext
  ): LineAnalysisResult | null {
    const cacheKey = this.getLineCacheKey(lineIndex, line);
    const cached = this.lineAnalysisCache.get(cacheKey);
    if (cached) {
        if (cancellationToken.isCancelled()) {
          return {
            ...cached,
            breakPoints: cached.breakPoints.map(bp => ({ ...bp }))
          };
        }
      return {
        ...cached,
        breakPoints: cached.breakPoints.map(bp => ({ ...bp }))
      };
    }

    try {
      // Get Enhanced AST from context (already built)
      const ast = context.enhancedAST.query;
      
      // Calculate global line positions
      const { globalStart, globalEnd } = this.calculateLinePositions(lineIndex, context);
      
      
      // Find MINIMAL node covering this line
      const minimalNode = ast.findMinimalCoveringNode({
        start: { offset: globalStart, line: lineIndex, column: 0 },
        end: { offset: globalEnd, line: lineIndex, column: line.length }
      });
      
      // Form list of nodes to analyze: minimal + target Call/New parent for lines inside parentheses
      const coveringNodes: EnhancedASTNode[] = [];
      if (minimalNode) {
        // Check if minimalNode is inside ASI-critical statement
        // If yes, analyze statement instead of minimalNode for correct ASI filtering
        let nodeToAnalyze: EnhancedASTNode = minimalNode;
        let currentParent = minimalNode.parent;
        
        while (currentParent) {
          // Don't block analysis for throw/return/break/continue/yield
          currentParent = currentParent.parent;
        }
        
        coveringNodes.push(nodeToAnalyze);
        
        // Ascend to nearest binary expressions (including || && chains)
        // This ensures breakpoints exist at operators inside long conditions
        let ascend: EnhancedASTNode | undefined = minimalNode.parent;
        let safetyCounter = 0;
        while (ascend && safetyCounter < 20) {
          safetyCounter++;
          if (
            (ascend.kind === ts.SyntaxKind.BinaryExpression ||
             ascend.kind === ts.SyntaxKind.ConditionalExpression)
            && !(ascend.fullRange.end.offset <= globalStart || ascend.fullRange.start.offset >= globalEnd)
          ) {
            coveringNodes.push(ascend);
          }
          ascend = ascend.parent;
        }

        // If original minimalNode is string, and we DID NOT replace it with ASI-critical statement,
        // also add Call/NewExpression parent for analysis
        const isStringish = (
          minimalNode.kind === ts.SyntaxKind.StringLiteral ||
          minimalNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
          minimalNode.kind === ts.SyntaxKind.TemplateExpression
        );
        
        if (isStringish && nodeToAnalyze === minimalNode) {
          const parent = minimalNode.parent;
          if (
            parent &&
            (parent.kind === ts.SyntaxKind.CallExpression || parent.kind === ts.SyntaxKind.NewExpression) &&
            !(parent.fullRange.end.offset <= globalStart || parent.fullRange.start.offset >= globalEnd)
          ) {
            coveringNodes.push(parent);
          }
        }
      }
      
      
      // Define position where line limit is crossed (local and global)
      const crossingLocalIndex = Math.min(context.maxLineLength, Math.max(0, line.length - 1));
      const crossingGlobalOffset = globalStart + crossingLocalIndex;

      // Find upper covering node around crossing position
      const upperCoveringNode = this.findUpperCoveringNodeAroundOffset(ast, crossingGlobalOffset, crossingGlobalOffset + 1, globalStart, globalEnd);
      if (upperCoveringNode && !coveringNodes.includes(upperCoveringNode)) {
        coveringNodes.push(upperCoveringNode);
      }

      // Analyze each node for breakpoints
      const breakPoints: BreakPoint[] = [];
      
      for (const node of coveringNodes) {
        const nodeBreaks = this.analyzeNodeForBreakPoints(node, globalStart, globalEnd, context);
        breakPoints.push(...nodeBreaks);
      }
      
      // ADDITIONAL: augment breakpoints for logical operators (|| &&) within line
      try {
        const nodesInRange = ast.findNodesInRange({
          start: { offset: globalStart, line: lineIndex, column: 0 },
          end: { offset: globalEnd, line: lineIndex, column: line.length }
        });
        for (const n of nodesInRange) {
          if (!n.syntaxTokens || n.syntaxTokens.length === 0) continue;
          for (const tok of n.syntaxTokens) {
            const tStart = tok.position.offset;
            const tEnd = tStart + (tok.text?.length ?? 0);
            if (tEnd <= globalStart || tStart >= globalEnd) continue;
            if (tok.type === 'operator' && (tok.text === '||' || tok.text === '&&')) {
              const position = tEnd; // break AFTER operator
              const augmented: BreakPoint = {
                position,
                globalPosition: position,
                indentLevel: this.calculateIndentLevelForInlineExpression(n, context),
                priority: 3,
                reason: `after logical operator '${tok.text}' (augmented)`,
                node: n,
                breakType: BreakType.AT_TOKEN
              };
              breakPoints.push(augmented);
            }
          }
        }
      } catch {}

      // If upper covering node is defined, find top-level commas within it on this line
      let topLevelCommaGlobalPositions: number[] = [];
      let topLevelCommaLocalPositions: number[] = [];
      if (upperCoveringNode) {
        topLevelCommaGlobalPositions = this.computeTopLevelCommaBreakPositions(upperCoveringNode, globalStart, globalEnd);
        topLevelCommaLocalPositions = topLevelCommaGlobalPositions.map(p => p - globalStart);
      }

      // Increase priority for top-level commas of this node and avoid duplicates
      if (topLevelCommaGlobalPositions.length > 0) {
        const preferred = new Set(topLevelCommaGlobalPositions);
        for (const bp of breakPoints) {
          if (preferred.has(bp.globalPosition)) {
            // Promote such breaks as most aesthetic
            bp.priority = Math.min(1, bp.priority);
            if (!bp.reason.includes('(top-level)')) {
              bp.reason = bp.reason + ' (top-level)';
            }
          }
        }
      }

      // Convert global positions to local
      // This is critical for correct simulateBreakApplication operation!
      const localBreakPoints = breakPoints.map(bp => ({
        ...bp,
        globalPosition: bp.globalPosition ?? bp.position,  // Use existing globalPosition if available
        position: bp.position - globalStart  // Convert to local position relative to line
      }));
      
      
      const analysisResult: LineAnalysisResult = {
        originalLine: line,
        lineIndex,
        globalStart,
        globalEnd,
        coveringNodes,
        breakPoints: localBreakPoints,  // Now with local positions!
        ast,
        crossingLocalIndex,
        upperCoveringNode,
        topLevelCommaGlobalPositions,
        topLevelCommaLocalPositions
      };

      this.lineAnalysisCache.set(cacheKey, analysisResult);

      return {
        ...analysisResult,
        breakPoints: analysisResult.breakPoints.map(bp => ({ ...bp }))
      };
      
    } catch (error: unknown) {
      return null;
    }
  }

  /**
   * Calculates global positions of line in file
   */
  private calculateLinePositions(lineIndex: number, context: FormattingContext): { globalStart: number; globalEnd: number } {
    const sourceFile = context.enhancedAST.ast.sourceFile;
    const globalStart = sourceFile.getPositionOfLineAndCharacter(lineIndex, 0);
    
    // Find end of line
    let globalEnd: number;
    try {
      globalEnd = sourceFile.getPositionOfLineAndCharacter(lineIndex + 1, 0) - 1; // -1 to exclude \n
    } catch {
      // Last line in file
      globalEnd = sourceFile.getEnd();
    }
    
    return { globalStart, globalEnd };
  }

  /**
   * Analyzes AST node for breakpoints
   */
  private analyzeNodeForBreakPoints(
    node: EnhancedASTNode, 
    lineStart: number, 
    lineEnd: number,
    context: FormattingContext
  ): BreakPoint[] {
    const breakPoints: BreakPoint[] = [];
    
    // Check if node intersects with analyzed line
    if (node.fullRange.end.offset <= lineStart || node.fullRange.start.offset >= lineEnd) {
      return breakPoints; // Node doesn't intersect with line
    }

    const parentKind = node.parent?.kind;
    if (
      (node.kind === ts.SyntaxKind.NewExpression || node.kind === ts.SyntaxKind.CallExpression) &&
      (parentKind === ts.SyntaxKind.ThrowStatement || parentKind === ts.SyntaxKind.ReturnStatement)
    ) {
      // Same breakpoint will be handled by specialized Throw/Return logic
      return breakPoints;
    }

    // Handlers for different node types
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        // breakPoints.push(...this.analyzeImportDeclaration(node));
        break;
        
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
        // Analyze class/interface declaration via syntax tokens.
        // Tokens allow precise determination of safe break locations.
        // 
        // Class declaration - everything up to opening brace { (inclusive).
        // Class body - everything after {.
        //
        // Solution: check that line is NOT completely after first body element.
        
        const firstBodyElement = node.children.find(child => 
          child.kind === ts.SyntaxKind.PropertyDeclaration ||
          child.kind === ts.SyntaxKind.MethodDeclaration ||
          child.kind === ts.SyntaxKind.Constructor ||
          child.kind === ts.SyntaxKind.GetAccessor ||
          child.kind === ts.SyntaxKind.SetAccessor
        );
        
        // If there are body elements AND line is completely after first element - it's body
        if (firstBodyElement && lineStart >= firstBodyElement.fullRange.start.offset) {
          break;
        }
        
        // Otherwise line contains declaration (possibly with part of body on same line)
        // Use tokens for precise class/interface declaration splitting
        const tokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...tokenBreaks);
        break;
        
      case ts.SyntaxKind.HeritageClause:
        // Analyze HeritageClause (extends/implements) via tokens
        // Keywords extends/implements have high priority (2)
        const heritageTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...heritageTokenBreaks);
        break;

      case ts.SyntaxKind.CaseClause:
        const caseTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        for (const bp of caseTokenBreaks) {
          if (bp.reason?.includes('after colon')) {
            bp.indentLevel = Math.max(bp.indentLevel + 1, this.calculateIndentLevel(node, context) + 1);
          }
        }
        breakPoints.push(...caseTokenBreaks);
        break;
        
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.ArrowFunction:
        // Analyze functions/methods via tokens
        const functionTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...functionTokenBreaks);
        break;
        
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.IntersectionType:
        // Analyze union/intersection types via specialized method
        // Uses calculateIndentLevelForInlineExpression for correct indents
        const unionTokenBreaks = this.findBreakableTokensForTypeExpression(node, lineStart, lineEnd, context);
        breakPoints.push(...unionTokenBreaks);
        break;
        
      case ts.SyntaxKind.CallExpression:
      case ts.SyntaxKind.NewExpression:
        // Analyze function calls and constructors via tokens
        // Break after commas in arguments, after opening paren
        const callTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...callTokenBreaks);
        break;
        
      case ts.SyntaxKind.BinaryExpression:
        // Analyze binary expressions via tokens
        // Break after operators (+, -, *, /, &&, ||, etc.)
        const binaryTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...binaryTokenBreaks);
        break;
        
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.ForStatement:
        // Analyze conditional operators and loops via tokens
        // Break after logical operators in conditions
        const conditionalTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...conditionalTokenBreaks);
        break;
        
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclaration:
        // Analyze variable declarations via tokens
        // Break after =, commas, etc.
        const varTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...varTokenBreaks);
        break;
        
      case ts.SyntaxKind.ObjectLiteralExpression:
        // Analyze object literals via tokens
        // Break after commas between properties, after opening brace
        const objTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...objTokenBreaks);
        break;
        
      case ts.SyntaxKind.ArrayLiteralExpression:
        // Analyze arrays via tokens
        // Break after commas between elements, after opening bracket
        const arrTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...arrTokenBreaks);
        break;
        
      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        // CRITICAL: DON'T break template literals - break inside ${} changes semantics!
        // Any break and indent inside `${}` becomes part of runtime string
        // DON'T analyze tokens of this node, DON'T analyze child nodes
        break;
        
      case ts.SyntaxKind.TaggedTemplateExpression:
        // CRITICAL: DON'T break tagged template expressions
        // DON'T analyze tokens of this node, DON'T analyze child nodes
        break;
        
      case ts.SyntaxKind.ReturnStatement:
        // CRITICAL: DON'T break immediately after 'return' - this is ASI error!
        // return\n{ → return; { (returns undefined instead of object)
        // Can break INSIDE returned expression, but not immediately after return
        const returnTokenBreaks = this.findBreakableTokensForASICritical(node, lineStart, lineEnd, context, 'return');
        breakPoints.push(...returnTokenBreaks);
        // CRITICAL: DON'T analyze child nodes recursively!
        // findBreakableTokensForASICritical ALREADY analyzed them with correct filtering!
        return breakPoints;
        
      case ts.SyntaxKind.ThrowStatement:
        const throwTokenBreaks = this.findBreakableTokensForASICritical(node, lineStart, lineEnd, context, 'throw');
        breakPoints.push(...throwTokenBreaks);
        return breakPoints;
        
      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        // CRITICAL: DON'T break template literals - break inside ${} changes semantics!
        // Any break and indent inside `${}` becomes part of runtime string
        // DON'T analyze tokens of this node, DON'T analyze child nodes
        break;
        
      case ts.SyntaxKind.TaggedTemplateExpression:
        // CRITICAL: DON'T break tagged template expressions - this is ASI error!
        // "str"\n`template` → "str"`template` (string as function - runtime error)
        // DON'T analyze tokens of this node, DON'T analyze child nodes
        break;
        
      case ts.SyntaxKind.AsExpression:
        // Analyze as-expressions via tokens
        // Can break after 'as', inside type
        const asTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...asTokenBreaks);
        break;

      case ts.SyntaxKind.ParenthesizedType:
        const parenthesizedTypeBreaks = this.findBreakableTokensForParenthesizedType(node, lineStart, lineEnd, context);
        breakPoints.push(...parenthesizedTypeBreaks);
        break;

      case ts.SyntaxKind.FunctionType:
        const functionTypeBreaks = this.findBreakableTokensForFunctionType(node, lineStart, lineEnd, context);
        breakPoints.push(...functionTypeBreaks);
        break;

      case ts.SyntaxKind.TypeAssertionExpression:
        // Analyze type assertion (<Type>value) via tokens
        const assertTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...assertTokenBreaks);
        break;
        
      default:
        // For other node types use recursive analysis of child elements
        break;
    }

    // Analyze child nodes, only if they intersect with line
    for (const child of node.children) {
      // Skip child nodes that don't intersect with analyzed line
      if (child.fullRange.end.offset <= lineStart || child.fullRange.start.offset >= lineEnd) {
        continue;
      }
      
      // Skip modifiers - they are already included in syntaxTokens of parent node
      const isModifier = child.kind === ts.SyntaxKind.ExportKeyword ||
                         child.kind === ts.SyntaxKind.PublicKeyword ||
                         child.kind === ts.SyntaxKind.PrivateKeyword ||
                         child.kind === ts.SyntaxKind.ProtectedKeyword ||
                         child.kind === ts.SyntaxKind.StaticKeyword ||
                         child.kind === ts.SyntaxKind.ReadonlyKeyword ||
                         child.kind === ts.SyntaxKind.AsyncKeyword ||
                         child.kind === ts.SyntaxKind.AbstractKeyword;
      
      if (isModifier) {
        continue; // Don't analyze modifiers separately
      }
      
      // CRITICAL: Skip child nodes of critical constructs
      // Template literals - break inside ${} changes semantics
      const isCriticalNode = child.kind === ts.SyntaxKind.TemplateExpression ||
                             child.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
                             child.kind === ts.SyntaxKind.TaggedTemplateExpression ||
                             child.kind === ts.SyntaxKind.TemplateSpan ||
                             child.kind === ts.SyntaxKind.TemplateMiddle ||
                             child.kind === ts.SyntaxKind.TemplateTail ||
                             child.kind === ts.SyntaxKind.TemplateHead;
      
      if (isCriticalNode) {
        continue; // DON'T analyze critical constructs
      }
      
      const childBreaks = this.analyzeNodeForBreakPoints(child, lineStart, lineEnd, context);
      breakPoints.push(...childBreaks);
    }

    return breakPoints;
  }

  /**
   * Finds breakpoints for Union/Intersection types
   * Uses specialized indent logic for nested expressions
   */
  private findBreakableTokensForTypeExpression(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number,
    context: FormattingContext
  ): BreakPoint[] {
    const separators = this.getSeparatorsWithinRange(node, lineStart, lineEnd).filter(isTypeSeparator);
    if (separators.length === 0) {
      return [];
    }

    const baseIndent = this.calculateIndentLevelForInlineExpression(node, context);
    return this.createBreakPointsFromSeparators(node, separators, baseIndent, { allowBefore: false });
  }

  private findBreakableTokensForParenthesizedType(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number,
    context: FormattingContext
  ): BreakPoint[] {
    const separators = this.getSeparatorsWithinRange(node, lineStart, lineEnd);
    if (separators.length === 0) {
      return [];
    }

    const baseIndent = this.calculateIndentLevelForInlineExpression(node, context);
    const breakPoints = this.createBreakPointsFromSeparators(node, separators, baseIndent, { allowBefore: false });

    for (const bp of breakPoints) {
      if (bp.reason?.includes('after open paren')) {
        bp.priority = Math.min(bp.priority, 4);
        bp.indentLevel = Math.max(bp.indentLevel + 1, baseIndent + 2);
      }
    }

    return breakPoints;
  }

  private findBreakableTokensForFunctionType(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number,
    context: FormattingContext
  ): BreakPoint[] {
    const separators = this.getSeparatorsWithinRange(node, lineStart, lineEnd);
    if (separators.length === 0) {
      return [];
    }

    const baseIndent = this.calculateIndentLevelForInlineExpression(node, context);
    const breakPoints = this.createBreakPointsFromSeparators(node, separators, baseIndent, { allowBefore: false });

    if (node.parent?.kind === ts.SyntaxKind.ParenthesizedType) {
      return [];
    }

    let hasOpenParen = false;
    for (const bp of breakPoints) {
      if (bp.reason?.includes('after open paren')) {
        bp.priority = Math.min(bp.priority, 5);
        hasOpenParen = true;
      } else if (bp.reason?.includes('after comma')) {
        bp.priority = Math.max(bp.priority, 6);
      }
    }

    if (hasOpenParen) {
      return breakPoints.filter(bp => bp.reason?.includes('after open paren'));
    }

    return breakPoints;
  }

  private tryFormatMethodUnionSignature(
    line: string,
    lineIndex: number,
    context: FormattingContext
  ): FormatterResult | null {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//')) {
      return null;
    }

    if (!trimmed.includes('AttributeModifier<') || !trimmed.includes('): this {')) {
      return null;
    }

    const openParenIndex = line.indexOf('(');
    if (openParenIndex < 0) {
      return null;
    }

    const closingSignatureIndex = line.indexOf('): this {');
    if (closingSignatureIndex < 0) {
      return null;
    }

    const pipePositions: number[] = [];
    let searchStart = 0;
    while (true) {
      const idx = line.indexOf('| ', searchStart);
      if (idx === -1 || idx >= closingSignatureIndex) {
        break;
      }
      pipePositions.push(idx);
      searchStart = idx + 2;
    }

    if (pipePositions.length < 2) {
      return null;
    }
    const breakPipeIndex = pipePositions[pipePositions.length - 2] ?? -1;
    if (breakPipeIndex < 0) {
      return null;
    }

    const indentUnit = context.indentUnit || '  ';
    const indentWidth = indentUnit.length;
    const leadingWhitespace = line.match(/^\s*/)?.[0].length ?? 0;
    const baseIndentLevel = Math.floor(leadingWhitespace / Math.max(indentWidth, 1));
    const indentLevel = baseIndentLevel + 1;

    const sourceFile = context.enhancedAST.ast.sourceFile;
    const lineStartOffset = sourceFile.getPositionOfLineAndCharacter(lineIndex, 0);

    const firstBreakPos = lineStartOffset + openParenIndex + 1;
    const secondBreakPos = lineStartOffset + breakPipeIndex + 1;

    // Protection against invalid calculations
    if (secondBreakPos <= firstBreakPos) {
      return null;
    }

    const lineBreaks: LineBreakInsertion[] = [
      {
        position: firstBreakPos,
        indentLevel,
        reason: 'method-union fallback: after open paren'
      },
      {
        position: secondBreakPos,
        indentLevel,
        reason: 'method-union fallback: after union pipe'
      }
    ];

    return {
      lineBreaks,
      success: true,
      reason: undefined
    };
  }

  /**
   * Finds breakpoints using semantic separators of node.
   */
  private findBreakableTokens(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number,
    context: FormattingContext
  ): BreakPoint[] {
    const separators = this.getSeparatorsWithinRange(node, lineStart, lineEnd);
    if (separators.length === 0) {
      return [];
    }

    const baseIndent = this.calculateIndentLevel(node, context);
    const breakPoints = this.createBreakPointsFromSeparators(node, separators, baseIndent);

    const isMethodLike =
      node.kind === ts.SyntaxKind.MethodDeclaration ||
      node.kind === ts.SyntaxKind.MethodSignature ||
      node.kind === ts.SyntaxKind.FunctionDeclaration ||
      node.kind === ts.SyntaxKind.FunctionExpression ||
      node.kind === ts.SyntaxKind.Constructor;

    if (node.kind === ts.SyntaxKind.CallExpression || node.kind === ts.SyntaxKind.NewExpression) {
      for (const bp of breakPoints) {
        if (bp.reason?.includes('after open paren (call)')) {
          bp.indentLevel = Math.max(bp.indentLevel + 1, baseIndent + 1);
        }
      }
    }

    if (isMethodLike) {
      for (const bp of breakPoints) {
        if (bp.reason?.includes('after open paren')) {
          bp.priority = Math.min(bp.priority, 3);
          bp.indentLevel = Math.max(bp.indentLevel + 1, baseIndent + 1);
        }
      }
    }

    return breakPoints;
  }

  private getSeparatorsWithinRange(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number
  ): SyntacticSeparator[] {
    const separators = getSemanticSeparators(node);
    if (separators.length === 0) {
      return [];
    }

    return separators.filter(separator => {
      const tokenStart = separator.token.position.offset;
      const tokenEnd = tokenStart + separator.token.text.length;
      return tokenEnd > lineStart && tokenStart < lineEnd;
    });
  }

  private createBreakPointsFromSeparators(
    node: EnhancedASTNode,
    separators: SyntacticSeparator[],
    baseIndent: number,
    options?: { allowBefore?: boolean; allowAfter?: boolean }
  ): BreakPoint[] {
    const allowAfter = options?.allowAfter ?? true;
    const allowBefore = options?.allowBefore ?? true;

    const candidates = new Map<number, BreakPoint>();

    for (const separator of separators) {
      const tokenStart = separator.token.position.offset;
      const tokenEnd = tokenStart + separator.token.text.length;

      if (allowAfter && preferBreakAfter(separator)) {
        const meta = this.getAfterBreakMeta(separator, node);
        if (meta) {
          this.upsertBreakPoint(candidates, tokenEnd, baseIndent, meta.priority, meta.reason, node);
        }
      }

      if (allowBefore && preferBreakBefore(separator)) {
        const meta = this.getBeforeBreakMeta(separator, node);
        if (meta) {
          this.upsertBreakPoint(candidates, tokenStart, baseIndent, meta.priority, meta.reason, node);
        }
      }
    }

    return Array.from(candidates.values());
  }

  private upsertBreakPoint(
    store: Map<number, BreakPoint>,
    globalPosition: number,
    indentLevel: number,
    priority: number,
    reason: string,
    node: EnhancedASTNode
  ): void {
    const existing = store.get(globalPosition);
    if (existing && existing.priority <= priority) {
      return;
    }

    store.set(globalPosition, {
      position: globalPosition,
      globalPosition,
      indentLevel,
      priority,
      reason,
      node,
      breakType: BreakType.AT_TOKEN
    });
  }

  private getAfterBreakMeta(
    separator: SyntacticSeparator,
    node: EnhancedASTNode
  ): { priority: number; reason: string } | null {
    const text = separator.token.text;

    switch (separator.role) {
      case SyntacticSeparatorRole.Comma:
        return { priority: 2, reason: 'after comma' };
      case SyntacticSeparatorRole.Semicolon:
        return { priority: 1, reason: 'after semicolon' };
      case SyntacticSeparatorRole.Colon:
        return { priority: 3, reason: 'after colon' };
      case SyntacticSeparatorRole.GroupStart:
        if (node.kind === ts.SyntaxKind.CallExpression || node.kind === ts.SyntaxKind.NewExpression) {
          return { priority: 3, reason: 'after open paren (call)' };
        }
        return { priority: 9, reason: 'after open paren' };
      case SyntacticSeparatorRole.ArrayStart:
        return { priority: 3, reason: 'after array start' };
      case SyntacticSeparatorRole.ObjectStart:
        return { priority: 3, reason: 'after object start' };
      case SyntacticSeparatorRole.LogicalAnd:
      case SyntacticSeparatorRole.LogicalOr:
        return { priority: 3, reason: `after logical operator '${text}'` };
      case SyntacticSeparatorRole.NullishCoalescing:
        return { priority: 4, reason: `after operator '${text}'` };
      case SyntacticSeparatorRole.HeritageExtends:
        return { priority: 3, reason: 'after extends' };
      case SyntacticSeparatorRole.TypeUnion:
      case SyntacticSeparatorRole.TypeIntersection:
        return { priority: 4, reason: `after type operator '${text}'` };
      case SyntacticSeparatorRole.ArithmeticOperator:
      case SyntacticSeparatorRole.ComparisonOperator:
        return { priority: 4, reason: `after operator '${text}'` };
      case SyntacticSeparatorRole.Assignment:
        return { priority: 5, reason: 'after assignment operator' };
      case SyntacticSeparatorRole.Arrow:
        return null;
      default:
        break;
    }

    if (separator.category === SyntacticSeparatorCategory.Structural) {
      return { priority: 5, reason: `after structural token '${text}'` };
    }

    if (separator.category === SyntacticSeparatorCategory.Logical) {
      return { priority: 4, reason: `after logical token '${text}'` };
    }

    return { priority: 6, reason: `after token '${text}'` };
  }

  private getBeforeBreakMeta(
    separator: SyntacticSeparator,
    node: EnhancedASTNode
  ): { priority: number; reason: string } | null {
    const text = separator.token.text;

    switch (separator.role) {
      case SyntacticSeparatorRole.GroupEnd:
        if (node.kind === ts.SyntaxKind.CallExpression || node.kind === ts.SyntaxKind.NewExpression) {
          return { priority: 3, reason: 'before close paren (call)' };
        }
        return { priority: 6, reason: 'before close paren' };
      case SyntacticSeparatorRole.ObjectEnd:
        return { priority: 5, reason: 'before object end' };
      case SyntacticSeparatorRole.ArrayEnd:
        return { priority: 5, reason: 'before array end' };
      case SyntacticSeparatorRole.LogicalAnd:
      case SyntacticSeparatorRole.LogicalOr:
        return { priority: 4, reason: `before logical operator '${text}'` };
      case SyntacticSeparatorRole.HeritageImplements:
        return { priority: 3, reason: 'before implements' };
      case SyntacticSeparatorRole.TypeUnion:
      case SyntacticSeparatorRole.TypeIntersection:
        return { priority: 5, reason: `before type operator '${text}'` };
      case SyntacticSeparatorRole.ArithmeticOperator:
      case SyntacticSeparatorRole.ComparisonOperator:
        return { priority: 4, reason: `before operator '${text}'` };
      case SyntacticSeparatorRole.Assignment:
        return { priority: 6, reason: 'before assignment operator' };
      default:
        break;
    }

    if (isSequenceSeparator(separator)) {
      return null;
    }

    if (separator.category === SyntacticSeparatorCategory.Structural) {
      return { priority: 6, reason: `before structural token '${text}'` };
    }

    return null;
  }

  /**
   * Calculates indent level for node based on its position in file
   * 
   * Returns base line indent + 1 fixed level for nesting.
   * This ensures uniform formatting for all construct types.
   */
  private calculateIndentLevel(node: EnhancedASTNode, context: FormattingContext): number {
    // Don't use node.metadata.indentLevel - it contains depth in AST, not line indent
    // if (node.metadata.indentLevel !== undefined) {
    //   return node.metadata.indentLevel;
    // }

    // Find line where node starts
    const startPosition = node.fullRange.start;
    const lineStart = startPosition.offset - startPosition.column;
    
    // Get line text from start to node position
    const sourceText = context.enhancedAST.ast.sourceFile.text;
    if (!sourceText) {
      return 0; // Can't determine indent - return 0
    }
    
    const lineText = sourceText.substring(lineStart, startPosition.offset);
    
    // Count whitespace equivalent in configuration "indent units"
    const indentUnitWidth = context.formatterConfig.useTabs ? 1 : context.formatterConfig.tabSize;
    let leadingEquivalent = 0;
    for (const char of lineText) {
      if (char === ' ') leadingEquivalent++;
      else if (char === '\t') leadingEquivalent += indentUnitWidth;
      else break;
    }
    
    // Return base indent (in units) + 1 level for nesting
    return Math.floor(leadingEquivalent / Math.max(1, indentUnitWidth)) + 1;
  }

  /**
   * Calculates indent level for nested expressions (UnionType, IntersectionType, etc.)
   * Uses base line indent + 1 fixed level
   * 
   * Now uses ONLY base line indent, not node position in line.
   * This prevents huge indents for inline expressions in middle of line.
   */
  private calculateIndentLevelForInlineExpression(node: EnhancedASTNode, context: FormattingContext): number {
    const startPosition = node.fullRange.start;
    const lineStart = startPosition.offset - startPosition.column;
    
    // Get line text from start to node position
    const sourceText = context.enhancedAST.ast.sourceFile.text;
    if (!sourceText) {
      return 0;
    }
    
    // Get full line to determine base indent
    const lineEndOffset = sourceText.indexOf('\n', lineStart);
    const fullLineText = lineEndOffset >= 0 
      ? sourceText.substring(lineStart, lineEndOffset)
      : sourceText.substring(lineStart);
    
    // Count ONLY leading whitespace equivalent in configuration units
    const indentUnitWidth = context.formatterConfig.useTabs ? 1 : context.formatterConfig.tabSize;
    let leadingEquivalent = 0;
    for (const char of fullLineText) {
      if (char === ' ') leadingEquivalent++;
      else if (char === '\t') leadingEquivalent += indentUnitWidth;
      else break; // Stop at first non-whitespace character
    }
    
    // Base line indent (in units) + 1 fixed level
    return Math.floor(leadingEquivalent / Math.max(1, indentUnitWidth)) + 1;
  }

  /**
   * Selects optimal breakpoints
   * Prefers non-paren breakpoints, but uses paren if non-paren doesn't solve problem
   */
  private selectOptimalBreakPoints(analysis: LineAnalysisResult, context: FormattingContext): BreakPoint[] {
    if (analysis.breakPoints.length === 0) {
      return [];
    }

    // Separate breakpoints into paren and non-paren
    const parenBreaks = analysis.breakPoints.filter(bp =>
      bp.reason?.includes('open_paren') || bp.reason?.includes('close_paren')
    );
    const nonParenBreaks = analysis.breakPoints.filter(bp =>
      !bp.reason?.includes('open_paren') && !bp.reason?.includes('close_paren')
    );

    // 1) Try non-paren first
    if (nonParenBreaks.length > 0) {
      const result = this.trySelectBreaksFromList(nonParenBreaks, analysis, context);
      if (result.length > 0) return result;
    }

    // 2) Try combination with paren
    const mixed = [...nonParenBreaks, ...parenBreaks];
    if (mixed.length > 0) {
      const result = this.trySelectBreaksFromList(mixed, analysis, context);
      if (result.length > 0) return result;
    }
    
    // 3) Try all remaining
    return this.trySelectBreaksFromList(analysis.breakPoints, analysis, context);
  }

  /**
   * Attempts to select breakpoints from list
   * Returns empty array if breakpoints don't solve line length problem
   */
  private trySelectBreaksFromList(
    breakPoints: BreakPoint[],
    analysis: LineAnalysisResult,
    context: FormattingContext
  ): BreakPoint[] {
    const sortedBreaks = [...breakPoints].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.position - a.position;
    });

    const selectedBreaks: BreakPoint[] = [];
    let currentText = analysis.originalLine;
    const maxIterations = Math.min(analysis.breakPoints.length, 50);
    let iterations = 0;

    while (this.hasLongLines(currentText, context.maxLineLength) && iterations < maxIterations) {
      if (cancellationToken.isCancelled()) {
        return [];
      }
      iterations++;
      
      const nextBreak = this.findNextOptimalBreak(sortedBreaks, selectedBreaks, currentText, context, analysis);
      if (!nextBreak) {
        break;
      }

      selectedBreaks.push(nextBreak);
      currentText = this.simulateBreakApplication(currentText, nextBreak, analysis, context, selectedBreaks.slice(0, -1));
    }

    // Return result ONLY if problem is solved
    // Otherwise return empty array to try other options
    if (this.hasLongLines(currentText, context.maxLineLength)) {
      return [];
    }

    return selectedBreaks;
  }

  /**
   * Checks if text has long lines
   */
  private hasLongLines(text: string, maxLength: number): boolean {
    return text.split('\n').some(line => line.length > maxLength);
  }

  /**
   * Finds next optimal break
   * DYNAMIC EVALUATION: selects break that gives maximum improvement
   */
  private findNextOptimalBreak(
    candidates: BreakPoint[],
    alreadySelected: BreakPoint[],
    currentText: string,
    context: FormattingContext,
    analysis: LineAnalysisResult
  ): BreakPoint | null {
    const selectedPositions = new Set(alreadySelected.map(b => b.position));

    let bestCandidate: BreakPoint | null = null;
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      if (cancellationToken.isCancelled()) {
        return bestCandidate;
      }
      if (selectedPositions.has(candidate.position)) {
        continue;
      }

      // Simulate break application
      const simulatedText = this.simulateBreakApplication(currentText, candidate, analysis, context, alreadySelected);
      
      // Evaluate improvement
      const score = this.calculateImprovementScore(currentText, simulatedText, context.maxLineLength, candidate, analysis);
      
      // Select candidate with best score
      if (score > 0 && score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Calculates improvement score (higher is better)
   * Considers: length reduction, number of fixed lines, priority
   * Relaxed requirements, partial improvements are considered
   */
  private calculateImprovementScore(
    original: string, 
    modified: string, 
    maxLength: number,
    breakPoint: BreakPoint,
    analysis: LineAnalysisResult | null
  ): number {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    if (cancellationToken.isCancelled()) {
      return 0;
    }
    
    const originalLongCount = originalLines.filter(line => line.length > maxLength).length;
    const modifiedLongCount = modifiedLines.filter(line => line.length > maxLength).length;
    
    // Base score: how many lines became short
    let score = (originalLongCount - modifiedLongCount) * 100;
    
    // Even if count of long lines didn't decrease,
    // give significant bonus for reducing maximum length
    if (score <= 0) {
      const originalMaxLength = Math.max(...originalLines.map(l => l.length));
      const modifiedMaxLength = Math.max(...modifiedLines.map(l => l.length));
      
      if (modifiedMaxLength < originalMaxLength) {
        // INCREASED coefficient from 0.5 to 3.0 for greater weight of partial improvements
        score = (originalMaxLength - modifiedMaxLength) * 3.0;
      } else {
        // No improvement — don't increase score
        score = 0;
      }
    }
    
    // Increased priorityBonus from 0.5 to 2.0 for greater priority influence
    const priorityBonus = Math.max(0, 10 - breakPoint.priority) * 2.0;
    score += priorityBonus;
    
    // Bonus for even distribution of line lengths
    const modifiedLengths = modifiedLines.map(l => l.length);
    const avgLength = modifiedLengths.reduce((a, b) => a + b, 0) / modifiedLengths.length;
    const variance = modifiedLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / modifiedLengths.length;
    const balanceBonus = variance < 1000 ? 5 : 0;
    score += balanceBonus;
    
    // TIE-BREAKER: With other things equal prefer maximizing first line
    // (more logical than splitting in half)
    if (modifiedLines.length > 1 && score > 0) {
      const firstLineLength = (modifiedLines[0] ?? '').length;
      if (firstLineLength <= maxLength) {
        // Very small bonus, doesn't affect main decisions: 0..0.5
        score += (firstLineLength / maxLength) * 0.5;
      }
    }
    
    // AESTHETIC METRIC (new):
    // - Prefer breaks located closer to limit boundary
    // - Strongly prefer breaks AFTER top-level commas of selected covering node
    // - Penalize break IMMEDIATELY after opening paren if top-level commas available
    // - Slightly penalize breaks outside upper covering node (except logical operators)

    if (analysis) {
      const crossing = analysis.crossingLocalIndex ?? Math.floor(maxLength * 0.9);
      const distance = Math.abs((breakPoint.position ?? 0) - crossing);
      // Closer to boundary is better (decay 0.5 points per character)
      const nearLimitBonus = Math.max(0, 30 - distance * 0.5);
      score += nearLimitBonus;

      const isTopLevelCovering = analysis.upperCoveringNode && breakPoint.node === analysis.upperCoveringNode;
      const isComma = /comma/.test(breakPoint.reason || '');
      const hasPreferredCommas = (analysis.topLevelCommaLocalPositions?.length || 0) > 0;

      if (isTopLevelCovering && isComma) {
        score += 40; // Strong bonus for break after top-level comma
      }

      // Penalty for break immediately after opening paren in call
      if (/after open_paren/.test(breakPoint.reason || '')) {
        score += hasPreferredCommas ? -20 : -5;
      }

      // Small penalty for break outside target covering node (except logical operators)
      if (!isTopLevelCovering && !/logical operator/.test(breakPoint.reason || '')) {
        score -= 10;
      }
    }

    if (/after open paren \(call\)/.test(breakPoint.reason || '')) {
      score += 80;
    }

    if (/after open paren/.test(breakPoint.reason || '') &&
        (breakPoint.node.kind === ts.SyntaxKind.MethodDeclaration ||
         breakPoint.node.kind === ts.SyntaxKind.MethodSignature ||
         breakPoint.node.kind === ts.SyntaxKind.FunctionDeclaration ||
         breakPoint.node.kind === ts.SyntaxKind.FunctionExpression ||
         breakPoint.node.kind === ts.SyntaxKind.Constructor)) {
      score += 70;
    }

    if (/after type operator/.test(breakPoint.reason || '') &&
        (breakPoint.node.kind === ts.SyntaxKind.UnionType ||
         breakPoint.node.kind === ts.SyntaxKind.IntersectionType)) {
      score += 30;
    }

    if (breakPoint.node.kind === ts.SyntaxKind.ParenthesizedType) {
      score -= 10;
    }

    return score;
  }

  /**
   * Simulates break application
   * Uses LOCAL positions
   */
  private simulateBreakApplication(
    text: string,
    breakPoint: BreakPoint,
    analysis: LineAnalysisResult | null,
    context: FormattingContext,
    alreadySelected: BreakPoint[]
  ): string {
    // Build indent according to configuration (like in real application)
    const unit = context.indentUnit || '  ';
    const indent = unit.repeat(Math.max(0, breakPoint.indentLevel));
    
    // Find relative position in line
    if (!analysis) {
      return text; // Can't simulate without analysis - return original
    }
    
    // breakPoint.position is now ALREADY LOCAL position!
    // No longer need to subtract globalStart
    let relativePos = breakPoint.position;

    for (const selected of alreadySelected) {
      if (selected.position <= breakPoint.position) {
        const selectedIndent = unit.repeat(Math.max(0, selected.indentLevel));
        const trimmed = selected.trimmedWhitespace ?? 0;
        relativePos += 1 + selectedIndent.length - trimmed;
      }
    }

    if (relativePos >= 0 && relativePos <= text.length) {
      let leftTrim = 0;
      while (
        relativePos - leftTrim - 1 >= 0 &&
        /\s/.test(text.charAt(relativePos - leftTrim - 1))
      ) {
        leftTrim++;
      }

      let rightTrim = 0;
      while (
        relativePos + rightTrim < text.length &&
        /\s/.test(text.charAt(relativePos + rightTrim))
      ) {
        rightTrim++;
      }

      const totalTrimmed = leftTrim + rightTrim;
      breakPoint.trimmedWhitespace = totalTrimmed;
      return (
        text.substring(0, Math.max(0, relativePos - leftTrim)) +
        '\n' +
        indent +
        text.substring(relativePos + rightTrim)
      );
    }

    return text;
  }

  /**
   * Finds upper covering node around specified offset
   * Ascends through parents, selecting nearest "grouping" node,
   * that has top-level separators on its tokens on this line.
   */
  private findUpperCoveringNodeAroundOffset(
    ast: EnhancedASTQuery,
    offsetStart: number,
    offsetEnd: number,
    lineStart: number,
    lineEnd: number
  ): EnhancedASTNode | undefined {
    const nodeAt = ast.findMinimalCoveringNode({
      start: { offset: offsetStart, line: 0, column: 0 },
      end: { offset: offsetEnd, line: 0, column: 0 }
    });
    if (!nodeAt) return undefined;

    // Go up maximum 30 steps searching for suitable node
    let current: EnhancedASTNode | undefined = nodeAt;
    let fallback: EnhancedASTNode | undefined = undefined;
    let steps = 0;
    while (current && steps < 30) {
      steps++;
      if (this.isGroupingNode(current.kind)) {
        const commaPositions = this.computeTopLevelCommaBreakPositions(current, lineStart, lineEnd);
        if (commaPositions.length > 0) {
          return current;
        }
        if (!fallback) fallback = current; // remember nearest grouping node as fallback
      }
      current = current.parent;
    }
    return fallback;
  }

  /**
   * Checks if node is "grouping" with top-level separators
   */
  private isGroupingNode(kind: ts.SyntaxKind): boolean {
    return (
      kind === ts.SyntaxKind.CallExpression ||
      kind === ts.SyntaxKind.NewExpression ||
      kind === ts.SyntaxKind.ArrayLiteralExpression ||
      kind === ts.SyntaxKind.ObjectLiteralExpression ||
      kind === ts.SyntaxKind.TupleType ||
      kind === ts.SyntaxKind.TypeLiteral ||
      kind === ts.SyntaxKind.UnionType ||
      kind === ts.SyntaxKind.IntersectionType ||
      kind === ts.SyntaxKind.BinaryExpression
    );
  }

  /**
   * Returns break positions AFTER top-level commas for node (global positions)
   * Handles () / {} / [] depending on node type.
   */
  private computeTopLevelCommaBreakPositions(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number
  ): number[] {
    const positions: number[] = [];
    if (!node.syntaxTokens || node.syntaxTokens.length === 0) return positions;

    let parenDepth = 0; // ()
    let braceDepth = 0; // {}
    let bracketDepth = 0; // []

    // Which bracket type to consider top-level for node
    const trackParen = node.kind === ts.SyntaxKind.CallExpression || node.kind === ts.SyntaxKind.NewExpression;
    const trackBrace = node.kind === ts.SyntaxKind.ObjectLiteralExpression;
    const trackBracket = node.kind === ts.SyntaxKind.ArrayLiteralExpression;

    const commaSeparators = new Set(
      getSemanticSeparators(node)
        .filter(separator => separator.role === SyntacticSeparatorRole.Comma)
        .map(separator => separator.token.position.offset)
    );

    for (const token of node.syntaxTokens) {
      if (!token) continue;
      const tokenStart = token.position?.offset ?? 0;
      const tokenEnd = tokenStart + (token.text?.length ?? 0);

      // only interested in tokens on analyzed line
      if (tokenEnd <= lineStart || tokenStart >= lineEnd) {
        continue;
      }

      // track depth
      if (token.type === 'open_paren') parenDepth++;
      if (token.type === 'close_paren') parenDepth = Math.max(0, parenDepth - 1);
      if (token.type === 'open_brace') braceDepth++;
      if (token.type === 'close_brace') braceDepth = Math.max(0, braceDepth - 1);
      if (token.type === 'open_bracket') bracketDepth++;
      if (token.type === 'close_bracket') bracketDepth = Math.max(0, bracketDepth - 1);

      // select only top-level commas for corresponding node type
      if (token.type === 'comma' && commaSeparators.has(tokenStart)) {
        const isTopLevelParen = trackParen && parenDepth === 1 && braceDepth === 0 && bracketDepth === 0;
        const isTopLevelBrace = trackBrace && braceDepth === 1 && parenDepth === 0 && bracketDepth === 0;
        const isTopLevelBracket = trackBracket && bracketDepth === 1 && parenDepth === 0 && braceDepth === 0;
        if (isTopLevelParen || isTopLevelBrace || isTopLevelBracket) {
          positions.push(tokenEnd); // break AFTER comma
        }
      }
    }

    return positions;
  }

  /**
   * Converts breakpoints to LineBreakInsertion format
   * Uses global positions for final application
   */
  private convertToLineBreaks(breakPoints: BreakPoint[]): LineBreakInsertion[] {
    return breakPoints.map(bp => ({
      position: bp.globalPosition,  // Use global position for TransformationManager!
      indentLevel: bp.indentLevel,
      reason: bp.reason
    }));
  }

  /**
   * Validates breaks
   */
  private validateBreaks(
    lineBreaks: LineBreakInsertion[], 
    analysis: LineAnalysisResult, 
    _context: FormattingContext
  ): boolean {
    // Strict validation - without breaks makes no sense
    if (lineBreaks.length === 0) {
      return false;
    }

    // CORRECT validation: break positions must be ONLY within analyzed line
    const validBreaks: LineBreakInsertion[] = [];
    
    for (const lineBreak of lineBreaks) {
      // Position MUST be strictly within analyzed line
      if (lineBreak.position >= analysis.globalStart && lineBreak.position <= analysis.globalEnd) {
        validBreaks.push(lineBreak);
      }
      // If position outside line - this is error in AST analysis logic, just ignore
    }

    // Update breaks array, keeping only valid ones
    lineBreaks.length = 0;
    lineBreaks.push(...validBreaks);

    return validBreaks.length > 0;
  }

  /**
   * Finds breakpoints for ASI-critical constructs (return, throw)
   * Blocks break between keyword and first significant token (for ASI safety)
   * Recursively analyzes child nodes
   */
  private findBreakableTokensForASICritical(
    node: EnhancedASTNode,
    lineStart: number,
    lineEnd: number,
    context: FormattingContext,
    keyword: 'return' | 'throw'
  ): BreakPoint[] {
    const breakPoints: BreakPoint[] = [];
    
    if (!node.syntaxTokens || node.syntaxTokens.length === 0) {
      return breakPoints;
    }
    
    // Find keyword position in tokens
    let keywordIndex = -1;
    for (let i = 0; i < node.syntaxTokens.length; i++) {
      const token = node.syntaxTokens[i];
      if (token && token.type === 'keyword' && token.text === keyword) {
        keywordIndex = i;
        break;
      }
    }
    
    if (keywordIndex === -1) {
      // Didn't find keyword, use regular logic
      return this.findBreakableTokens(node, lineStart, lineEnd, context);
    }
    
    // Find end of first significant token after keyword
    // All breakpoints BEFORE this position will be filtered (for ASI safety)
    let firstSignificantTokenEnd: number | null = null;
    
    for (let i = keywordIndex + 1; i < node.syntaxTokens.length; i++) {
      const token = node.syntaxTokens[i];
      if (!token || token.type === 'whitespace' || token.type === 'newline') {
        continue;
      }
      
      if (token.type === 'semantic_node' && token.semanticNode) {
        // For semantic_node find first significant token inside
        let firstToken = null;
        for (const childToken of token.semanticNode.syntaxTokens || []) {
          if (childToken && childToken.type !== 'whitespace' && childToken.type !== 'newline') {
            firstToken = childToken;
            break;
          }
        }
        
        firstSignificantTokenEnd = firstToken?.position
          ? firstToken.position.offset + (firstToken.text?.length ?? 0)
          : token.semanticNode.fullRange.start.offset;
      } else {
        // For regular tokens take end of token
        firstSignificantTokenEnd = (token.position?.offset ?? 0) + (token.text?.length ?? 0);
      }
      break;
    }
    
    const throwBaseIndent = this.calculateIndentLevel(node, context);
    const indentCap = throwBaseIndent + 1;
    const processedPositions = new Set<number>();

    for (let i = keywordIndex + 1; i < node.syntaxTokens.length; i++) {
      const token = node.syntaxTokens[i];
      if (!token) continue;

      if (token.type === 'semantic_node' && token.semanticNode) {
        const childBreaks = this.findBreakableTokens(token.semanticNode, lineStart, lineEnd, context);
        for (const childBreak of childBreaks) {
          if (firstSignificantTokenEnd !== null && childBreak.position < firstSignificantTokenEnd!) {
            continue;
          }

          let adjustedIndent = Math.min(childBreak.indentLevel ?? indentCap, indentCap);
          if (childBreak.reason.includes('before close paren')) {
            adjustedIndent = throwBaseIndent;
          }

          if (processedPositions.has(childBreak.position)) {
            // Already processed break with this global position – do nothing.
            continue;
          }

          processedPositions.add(childBreak.position);
          breakPoints.push({
            ...childBreak,
            indentLevel: adjustedIndent
          });
        }
      }
    }
    
    return breakPoints;
  }

}
