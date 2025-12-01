/**
 * Построитель расширенного AST с полной информацией о координатах и токенах
 *
 * Этот модуль отвечает за создание расширенного AST, который сохраняет всю
 * информацию, необходимую для точного восстановления оригинального текста.
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
 * Построитель расширенного AST
 */
export class EnhancedASTBuilder {
  /** Корневой узел стандартного TypeScript AST (не файл на диске!) */
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
   * Создаёт построитель расширенного AST
   * @param typescriptAST - корневой узел стандартного TypeScript AST (результат ts.createSourceFile)
   * @param options - опции построения
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
    
    // Создаём токенизатор для получения синтаксических токенов
    // Определяем LanguageVariant из SourceFile (JSX для .tsx файлов)
    const languageVariant = typescriptAST.languageVariant;
    this.tokenizer = createTokenizer(this.sourceText, typescriptAST.languageVersion, languageVariant);
    this.includeRanges = this.options.includeRanges;
  }

  /**
   * Строит расширенный AST для всего файла
   */
  public build(): EnhancedASTResult {
    try {
      this.log('Начинаем построение расширенного AST');
      
      const root = this.buildEnhancedNode(this.sourceFile) as EnhancedASTNode;
      this.statistics.buildTimeMs = Date.now() - this.startTime;
      
      this.log(`Построение завершено за ${this.statistics.buildTimeMs}ms`);
      this.log(`Создано узлов: ${this.statistics.totalNodes}`);
      
      return {
        root,
        sourceFile: this.sourceFile,
        positionMap: this.positionMap,
        statistics: this.statistics,
        errors: this.errors
      };
    } catch (error) {
      this.addError(ASTErrorType.INTERNAL_ERROR, `Критическая ошибка при построении AST: ${error}`);
      throw error;
    }
  }

  /**
   * Строит расширенный узел для TypeScript узла
   */
  private buildEnhancedNode(node: ts.Node, parent?: EnhancedASTNode, depth: number = 0): EnhancedASTNode | null {
    if (depth > this.options.maxDepth) {
      this.addError(ASTErrorType.INTERNAL_ERROR, 'Превышена максимальная глубина рекурсии', this.getSourcePosition(node.getStart()));
      throw new Error('Превышена максимальная глубина рекурсии');
    }

    this.statistics.totalNodes++;

    // Получаем полную информацию о позициях узла
    const fullRange = this.getFullRange(node);
    const contentRange = this.getContentRange(node);
    
    // Если включена фильтрация диапазонов и узел полностью вне интересующих диапазонов —
    // пропускаем построение этого поддерева (оптимизация производительности)
    if (this.includeRanges && !this.intersectsAny(fullRange, this.includeRanges)) {
      return null;
    }

    // Извлекаем текст узла (от start до end, без leading trivia)
    const nodeStart = node.getStart(this.sourceFile);
    const nodeEnd = node.getEnd();
    const text = this.sourceText.substring(nodeStart, nodeEnd);

    // Создаем метаданные узла
    const metadata = this.createNodeMetadata(node, depth);
    
    // Получаем синтаксические токены для узла
    const syntaxTokens = this.buildSyntaxTokens(node);
    
    // Обрабатываем модификаторы - передаем текущий node как родителя
    const modifiers: EnhancedASTNode[] = [];
    if ('modifiers' in node && node.modifiers && Array.isArray(node.modifiers)) {
      for (const modifier of node.modifiers) {
        const enhancedModifier = this.buildEnhancedNodeWithParentNode(modifier, node, depth + 1);
        modifiers.push(enhancedModifier);
      }
    }

    // Получаем флаги узла
    const nodeFlags = 'flags' in node ? (node.flags as ts.NodeFlags) : undefined;

    // Создаем расширенный узел
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

    // Добавляем в карту позиций
    for (let pos = fullRange.start.offset; pos < fullRange.end.offset; pos++) {
      this.positionMap.set(pos, enhancedNode);
    }

    // Обрабатываем дочерние узлы (исключая модификаторы)
    const children: EnhancedASTNode[] = [];
    const modifierNodes = new Set(modifiers.map(m => m.originalNode));
    
    ts.forEachChild(node, (child) => {
      // Если включена фильтрация и дочерний узел вне диапазонов — пропускаем его
      if (this.includeRanges) {
        const cFull = this.getFullRange(child);
        if (!this.intersectsAny(cFull, this.includeRanges)) {
          return;
        }
      }
      // Пропускаем модификаторы - они уже обработаны отдельно
      if (!modifierNodes.has(child)) {
        const enhancedChild = this.buildEnhancedNode(child, enhancedNode, depth + 1);
        if (enhancedChild) children.push(enhancedChild);
      }
    });

    // Сортируем дочерние узлы по позиции
    if (children.length > 0) {
      children.sort((a, b) => a.fullRange.start.offset - b.fullRange.start.offset);
    }

    // Узлы без дочерних элементов остаются как есть - никаких fallback разбиений

    enhancedNode.children = children;
    
    // Связываем синтаксические токены с покрывающими узлами
    // Это нужно делать после построения всех дочерних узлов
    this.linkSemanticNodesToTokens(enhancedNode);

    this.log(`Создан узел ${ts.SyntaxKind[node.kind]} в позиции ${fullRange.start.offset}-${fullRange.end.offset}, текст: "${text.substring(0, 30)}..."`);
    
    return enhancedNode;
  }

  /**
   * Строит расширенный узел с явным указанием оригинального родительского узла
   * Используется для модификаторов и других специальных узлов
   */
  private buildEnhancedNodeWithParentNode(node: ts.Node, _parentNode: ts.Node, depth: number = 0): EnhancedASTNode {
    if (depth > this.options.maxDepth) {
      this.addError(ASTErrorType.INTERNAL_ERROR, 'Превышена максимальная глубина рекурсии', this.getSourcePosition(node.getStart()));
      throw new Error('Превышена максимальная глубина рекурсии');
    }

    this.statistics.totalNodes++;

    // Получаем полную информацию о позициях узла
    const fullRange = this.getFullRange(node);
    const contentRange = this.getContentRange(node);
    
    // Извлекаем текст узла (от start до end, без leading trivia)
    const nodeStart = node.getStart(this.sourceFile);
    const nodeEnd = node.getEnd();
    const text = this.sourceText.substring(nodeStart, nodeEnd);

    // Создаем метаданные узла
    const metadata = this.createNodeMetadata(node, depth);
    
    // Получаем синтаксические токены для узла
    const syntaxTokens = this.buildSyntaxTokens(node);

    // Получаем флаги узла
    const nodeFlags = 'flags' in node ? (node.flags as ts.NodeFlags) : undefined;

    // Создаем расширенный узел (без parent, так как модификаторы хранятся отдельно)
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

    // Добавляем в карту позиций
    for (let pos = fullRange.start.offset; pos < fullRange.end.offset; pos++) {
      this.positionMap.set(pos, enhancedNode);
    }

    this.log(`Создан узел-модификатор ${ts.SyntaxKind[node.kind]} в позиции ${fullRange.start.offset}-${fullRange.end.offset}, текст: "${text}"`);
    
    return enhancedNode;
  }

  /**
   * Строит список синтаксических токенов для узла
   * Использует TypeScript Scanner API для получения токенов
   * 
   * Для дочерних узлов создаёт специальные токены типа SEMANTIC_NODE,
   * которые ссылаются на соответствующие Enhanced AST узлы.
   * Это будет сделано позже, после построения всех дочерних узлов.
   */
  private buildSyntaxTokens(node: ts.Node): SyntaxToken[] {
    const fullStart = node.getFullStart();
    const end = node.getEnd();
    
    // Токенизируем весь диапазон узла (включая leading trivia)
    // Замена токенов на SEMANTIC_NODE будет выполнена в linkSemanticNodesToTokens
    return this.tokenizer.tokenize(fullStart, end);
  }

  /**
   * Связывает покрывающие узлы с синтаксическими токенами
   * 
   * Заменяет диапазоны дочерних узлов на токены типа SEMANTIC_NODE,
   * которые содержат ссылки на соответствующие Enhanced AST узлы.
   * 
   * @param enhancedNode - узел Enhanced AST с построенными children
   */
  private linkSemanticNodesToTokens(enhancedNode: EnhancedASTNode): void {
    if (enhancedNode.children.length === 0 && 
        (!enhancedNode.modifiers || enhancedNode.modifiers.length === 0)) {
      // Нет дочерних узлов - токены остаются как есть
      return;
    }

    const newTokens: SyntaxToken[] = [];
    const allChildNodes = [
      ...(enhancedNode.modifiers || []),
      ...enhancedNode.children
    ];

    // Сортируем дочерние узлы по позиции
    allChildNodes.sort((a, b) => a.fullRange.start.offset - b.fullRange.start.offset);

    let tokenIndex = 0;
    let childIndex = 0;

    while (tokenIndex < enhancedNode.syntaxTokens.length) {
      const token = enhancedNode.syntaxTokens[tokenIndex];
      if (!token) break;
      
      // Проверяем, попадает ли текущий токен в диапазон дочернего узла
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

        // Токен полностью внутри дочернего узла - пропускаем
        if (tokenStart >= childStart && tokenEnd <= childEnd && !this.shouldExposeChildTokens(child)) {
          // Если это первый токен дочернего узла, создаём SEMANTIC_NODE
          // SEMANTIC_NODE будет пропущен при форматировании, а его дочерние узлы
          // будут обработаны рекурсивно, включая операторы, запятые и другие токены
          if (tokenStart === childStart) {
            newTokens.push({
              type: SyntaxTokenType.SEMANTIC_NODE,
              text: child.text,
              position: child.fullRange.start,
              semanticNode: child,
              tsKind: child.kind
            });
          }
          
          // Пропускаем все токены до конца дочернего узла
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
        
        // Токен перед дочерним узлом - добавляем как обычный токен
        if (tokenEnd <= childStart) {
          newTokens.push(token);
          tokenIndex++;
          continue;
        }
        
        // Токен пересекает границу дочернего узла - такого не должно быть
        // Добавляем токен и переходим к следующему дочернему узлу
        newTokens.push(token);
        tokenIndex++;
      } else {
        // Все дочерние узлы обработаны - добавляем оставшиеся токены
        newTokens.push(token);
        tokenIndex++;
      }
    }

    enhancedNode.syntaxTokens = newTokens;
    
    // Рекурсивно обрабатываем дочерние узлы
    for (const child of allChildNodes) {
      this.linkSemanticNodesToTokens(child);
    }
  }

  /**
   * Некоторые узлы (например, FirstAssignment/LastAssignment) должны сохранять свои токены,
   * чтобы операторы (например, '=') были доступны на родительском уровне.
   */
  private shouldExposeChildTokens(node: EnhancedASTNode): boolean {
    return (
      node.kind >= ts.SyntaxKind.FirstAssignment &&
      node.kind <= ts.SyntaxKind.LastAssignment
    );
  }

  /**
   * Получает полный диапазон узла (включая leading/trailing trivia)
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
   * Получает диапазон содержимого узла (без trivia)
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
   * Преобразует абсолютное смещение в позицию с номером строки и колонки
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
   * Создает метаданные для узла
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
   * Определяет, может ли узел быть разбит на несколько строк
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
        return node.getEnd() - node.getStart() > 40; // Эвристика: длинные узлы можно разбивать
    }
  }

  /**
   * Вычисляет приоритет разбиения узла
   */
  private calculateBreakPriority(node: ts.Node): number {
    if (this.options.breakPriorityCalculator) {
      return this.options.breakPriorityCalculator(node);
    }

    // Базовые приоритеты по типам узлов
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
        return 1; // Высший приоритет
      
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
        return 10; // Низкий приоритет
    }
  }

  /**
   * Определяет, является ли узел атомарным (неделимым)
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
   * Вычисляет флаги узла
   */
  private calculateNodeFlags(node: ts.Node): NodeFlags {
    let flags = NodeFlags.NONE;

    // Проверяем наличие комментариев
    const fullStart = node.getFullStart();
    const start = node.getStart(this.sourceFile);
    if (fullStart < start) {
      const triviaText = this.sourceText.substring(fullStart, start);
      if (triviaText.includes('//') || triviaText.includes('/*')) {
        flags |= NodeFlags.HAS_COMMENTS;
      }
    }

    // Проверяем контекст узла
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
   * Вычисляет длину для принудительного разбиения
   */
  private calculateForceBreakLength(node: ts.Node): number | undefined {
    const nodeLength = node.getEnd() - node.getStart();
    
    // Для очень длинных узлов устанавливаем принудительное разбиение
    if (nodeLength > 120) {
      return 80; // Разбиваем на части по 80 символов
    }
    
    return undefined;
  }


  // Fallback методы удалены - никаких принудительных разбиений

  // Вспомогательные методы для определения контекста узлов

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
   * Добавляет ошибку в список
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
   * Логирует сообщение (если включена диагностика)
   */
  private log(_message: string): void {
    if (this.options.enableDiagnostics) {
    }
  }

  /** Проверяет пересечение диапазонов */
  private intersectsAny(a: SourceRange, ranges: SourceRange[]): boolean {
    for (const r of ranges) {
      if (a.start.offset < r.end.offset && r.start.offset < a.end.offset) return true;
    }
    return false;
  }
}
