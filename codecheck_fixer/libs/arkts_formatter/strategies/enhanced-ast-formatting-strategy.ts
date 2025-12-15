/**
 * Улучшенная AST-стратегия форматирования с использованием расширенного AST
 * 
 * Эта стратегия использует новый модуль расширенного AST для получения
 * полной информации о координатах и токенах, что обеспечивает
 * более точное и надежное форматирование.
 */

// Типы строго контролируем внутри файла; отключение проверок не требуется

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
 * Информация о потенциальном месте разбиения
 * Хранит как локальную, так и глобальную позиции
 */
interface BreakPoint {
  /** Локальная позиция относительно начала строки (для симуляции) */
  position: number;
  
  /** Глобальная позиция в файле (для финального применения) */
  globalPosition: number;
  
  /** Уровень отступа */
  indentLevel: number;
  
  /** Приоритет (меньше = выше приоритет) */
  priority: number;
  
  /** Причина разбиения */
  reason: string;
  
  /** Узел AST, связанный с этой точкой */
  node: EnhancedASTNode;
  
  /** Тип разбиения */
  breakType: BreakType;

  /** Количество символов пробела, удалённых после применения переноса */
  trimmedWhitespace?: number;
}

/**
 * Типы разбиения
 */
enum BreakType {
  /** Разбиение перед узлом */
  BEFORE_NODE = 'before_node',
  
  /** Разбиение после узла */
  AFTER_NODE = 'after_node',
  
  /** Разбиение внутри узла */
  INSIDE_NODE = 'inside_node',
  
  /** 
   * Разбиение по семантическому разделителю
   * Перенос вставляется ДО или ПОСЛЕ токена в зависимости от предпочтений,
   * вычисленных классификатором разделителей (см. getSemanticSeparators).
   */
  AT_TOKEN = 'at_token'
}

/**
 * Результат анализа строки
 */
interface LineAnalysisResult {
  /** Исходная строка */
  originalLine: string;
  
  /** Индекс строки */
  lineIndex: number;
  
  /** Глобальные позиции строки */
  globalStart: number;
  globalEnd: number;
  
  /** Узлы AST, покрывающие строку */
  coveringNodes: EnhancedASTNode[];
  
  /** Найденные точки разбиения */
  breakPoints: BreakPoint[];
  
  /** Расширенный AST для анализа */
  ast: EnhancedASTQuery;

  /** Локальный индекс позиции пересечения лимита длины строки */
  crossingLocalIndex: number;

  /** Верхний покрывающий узел для приоритезации переносов */
  upperCoveringNode: EnhancedASTNode | undefined;

  /** Позиции верхнеуровневых запятых (глобальные) внутри upperCoveringNode на этой строке */
  topLevelCommaGlobalPositions?: number[];

  /** Позиции верхнеуровневых запятых (локальные относительно начала строки) */
  topLevelCommaLocalPositions?: number[];
}

export class EnhancedASTFormattingStrategy implements FormattingStrategy {
  private lineAnalysisCache = new Map<string, LineAnalysisResult>();

  private getLineCacheKey(lineIndex: number, line: string): string {
    return `${lineIndex}|${line}`;
  }

  // Возвращает true только тогда, когда длина строки превышает лимит
  canHandle(line: string, lineIndex: number, context: FormattingContext): boolean {
    const lineInfo = getLineInfo(line, lineIndex, context.maxLineLength);
    return lineInfo.exceedsLimit;
  }

  format(line: string, lineIndex: number, context: FormattingContext): FormatterResult {
    if (cancellationToken.isCancelled()) {
      return {
        lineBreaks: [],
        success: false,
        reason: 'Отмена пользователем'
      };
    }

    const fallback = this.tryFormatMethodUnionSignature(line, lineIndex, context);
    if (fallback) {
      return fallback;
    }

    try {
      // Анализируем строку с помощью расширенного AST
      const analysis = this.analyzeLineWithEnhancedAST(line, lineIndex, context);
      
      if (!analysis) {
        return {
          lineBreaks: [],
          success: false,
          reason: 'Не удалось проанализировать строку с помощью расширенного AST'
        };
      }

      // Находим оптимальные точки разбиения
      const optimalBreaks = this.selectOptimalBreakPoints(analysis, context);
      
      if (optimalBreaks.length === 0) {
        return {
          lineBreaks: [],
          success: false,
          reason: 'Не найдены подходящие точки разбиения'
        };
      }

      // Преобразуем в формат LineBreakInsertion
      const lineBreaks = this.convertToLineBreaks(optimalBreaks);
      
      // Валидируем результат
      const isValid = this.validateBreaks(lineBreaks, analysis, context);
      
      if (!isValid) {
        return {
          lineBreaks: [],
          success: false,
          reason: 'Валидация переносов не прошла'
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
        reason: `Внутренняя ошибка: ${error}`
      };
    }
  }

  getPriority(): number {
    return 150; // Максимальный приоритет для Enhanced AST стратегии
  }

  /**
   * Анализирует строку с помощью расширенного AST.
   * Преобразует глобальные позиции в локальные
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
      // Получаем Enhanced AST из контекста (уже построен)
      const ast = context.enhancedAST.query;
      
      // Вычисляем глобальные позиции строки
      const { globalStart, globalEnd } = this.calculateLinePositions(lineIndex, context);
      
      
      // Находим МИНИМАЛЬНЫЙ узел, покрывающий эту строку
      const minimalNode = ast.findMinimalCoveringNode({
        start: { offset: globalStart, line: lineIndex, column: 0 },
        end: { offset: globalEnd, line: lineIndex, column: line.length }
      });
      
      // Формируем список узлов для анализа: минимальный + целевой родитель Call/New при строках внутри скобок
      const coveringNodes: EnhancedASTNode[] = [];
      if (minimalNode) {
        // Проверяем, находится ли minimalNode внутри ASI-критичного statement
        // Если да, анализируем statement вместо minimalNode для правильной ASI-фильтрации
        let nodeToAnalyze: EnhancedASTNode = minimalNode;
        let currentParent = minimalNode.parent;
        
        while (currentParent) {
          // Не блокируем анализ для throw/return/break/continue/yield
          currentParent = currentParent.parent;
        }
        
        coveringNodes.push(nodeToAnalyze);
        
        // Поднимаемся к ближайшим бинарным выражениям (включая цепочки || &&)
        // Это обеспечивает наличие breakpoints по операторам внутри длинных условий
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

        // Если исходный minimalNode - строка, и мы НЕ заменили его на ASI-критичный statement,
        // добавляем также родителя Call/NewExpression для анализа
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
      
      
      // Определяем позицию пересечения лимита строки (локально и глобально)
      const crossingLocalIndex = Math.min(context.maxLineLength, Math.max(0, line.length - 1));
      const crossingGlobalOffset = globalStart + crossingLocalIndex;

      // Определяем верхний покрывающий узел вокруг позиции пересечения
      const upperCoveringNode = this.findUpperCoveringNodeAroundOffset(ast, crossingGlobalOffset, crossingGlobalOffset + 1, globalStart, globalEnd);
      if (upperCoveringNode && !coveringNodes.includes(upperCoveringNode)) {
        coveringNodes.push(upperCoveringNode);
      }

      // Анализируем каждый узел на предмет точек разбиения
      const breakPoints: BreakPoint[] = [];
      
      for (const node of coveringNodes) {
        const nodeBreaks = this.analyzeNodeForBreakPoints(node, globalStart, globalEnd, context);
        breakPoints.push(...nodeBreaks);
      }
      
      // ДОПОЛНИТЕЛЬНО: усиливаем breakpoints для логических операторов (|| &&) в пределах строки
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
              const position = tEnd; // перенос ПОСЛЕ оператора
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

      // Если определён верхний покрывающий узел, находим верхнеуровневые запятые в его пределах на этой строке
      let topLevelCommaGlobalPositions: number[] = [];
      let topLevelCommaLocalPositions: number[] = [];
      if (upperCoveringNode) {
        topLevelCommaGlobalPositions = this.computeTopLevelCommaBreakPositions(upperCoveringNode, globalStart, globalEnd);
        topLevelCommaLocalPositions = topLevelCommaGlobalPositions.map(p => p - globalStart);
      }

      // Повышаем приоритет верхнеуровневых запятых этого узла и избегаем дубликатов
      if (topLevelCommaGlobalPositions.length > 0) {
        const preferred = new Set(topLevelCommaGlobalPositions);
        for (const bp of breakPoints) {
          if (preferred.has(bp.globalPosition)) {
            // Продвигаем такие переносы как наиболее эстетичные
            bp.priority = Math.min(1, bp.priority);
            if (!bp.reason.includes('(top-level)')) {
              bp.reason = bp.reason + ' (top-level)';
            }
          }
        }
      }

      // Преобразуем глобальные позиции в локальные
      // Это критично для корректной работы simulateBreakApplication!
      const localBreakPoints = breakPoints.map(bp => ({
        ...bp,
        globalPosition: bp.globalPosition ?? bp.position,  // Используем существующую globalPosition если есть
        position: bp.position - globalStart  // Преобразуем в локальную позицию относительно строки
      }));
      
      
      const analysisResult: LineAnalysisResult = {
        originalLine: line,
        lineIndex,
        globalStart,
        globalEnd,
        coveringNodes,
        breakPoints: localBreakPoints,  // Теперь с локальными позициями!
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
   * Вычисляет глобальные позиции строки в файле
   */
  private calculateLinePositions(lineIndex: number, context: FormattingContext): { globalStart: number; globalEnd: number } {
    const sourceFile = context.enhancedAST.ast.sourceFile;
    const globalStart = sourceFile.getPositionOfLineAndCharacter(lineIndex, 0);
    
    // Находим конец строки
    let globalEnd: number;
    try {
      globalEnd = sourceFile.getPositionOfLineAndCharacter(lineIndex + 1, 0) - 1; // -1 для исключения \n
    } catch {
      // Последняя строка файла
      globalEnd = sourceFile.getEnd();
    }
    
    return { globalStart, globalEnd };
  }

  /**
   * Анализирует узел AST на предмет точек разбиения
   */
  private analyzeNodeForBreakPoints(
    node: EnhancedASTNode, 
    lineStart: number, 
    lineEnd: number,
    context: FormattingContext
  ): BreakPoint[] {
    const breakPoints: BreakPoint[] = [];
    
    // Проверяем, пересекается ли узел с анализируемой строкой
    if (node.fullRange.end.offset <= lineStart || node.fullRange.start.offset >= lineEnd) {
      return breakPoints; // Узел не пересекается со строкой
    }

    const parentKind = node.parent?.kind;
    if (
      (node.kind === ts.SyntaxKind.NewExpression || node.kind === ts.SyntaxKind.CallExpression) &&
      (parentKind === ts.SyntaxKind.ThrowStatement || parentKind === ts.SyntaxKind.ReturnStatement)
    ) {
      // Та же точка разрыва будет обработана специализированной логикой Throw/Return
      return breakPoints;
    }

    // Обработчики для различных типов узлов
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        // breakPoints.push(...this.analyzeImportDeclaration(node));
        break;
        
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
        // Анализируем декларацию класса/интерфейса через синтаксические токены.
        // Токены позволяют точно определить безопасные места для переносов.
        // 
        // Декларация класса - это всё до открывающей скобки { (включительно).
        // Тело класса - это всё после {.
        //
        // Решение: проверяем, что строка НЕ находится полностью после первого элемента тела.
        
        const firstBodyElement = node.children.find(child => 
          child.kind === ts.SyntaxKind.PropertyDeclaration ||
          child.kind === ts.SyntaxKind.MethodDeclaration ||
          child.kind === ts.SyntaxKind.Constructor ||
          child.kind === ts.SyntaxKind.GetAccessor ||
          child.kind === ts.SyntaxKind.SetAccessor
        );
        
        // Если есть элементы тела И строка полностью после первого элемента - это тело
        if (firstBodyElement && lineStart >= firstBodyElement.fullRange.start.offset) {
          break;
        }
        
        // Иначе строка содержит декларацию (возможно с частью тела на той же строке)
        // Используем токены для точного разбиения декларации класса/интерфейса
        const tokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...tokenBreaks);
        break;
        
      case ts.SyntaxKind.HeritageClause:
        // HeritageClause (extends/implements) анализируем через токены
        // Ключевые слова extends/implements имеют высокий приоритет (2)
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
        // Анализируем функции/методы через токены
        const functionTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...functionTokenBreaks);
        break;
        
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.IntersectionType:
        // Анализируем union/intersection типы через специальный метод
        // Используется calculateIndentLevelForInlineExpression для правильных отступов
        const unionTokenBreaks = this.findBreakableTokensForTypeExpression(node, lineStart, lineEnd, context);
        breakPoints.push(...unionTokenBreaks);
        break;
        
      case ts.SyntaxKind.CallExpression:
      case ts.SyntaxKind.NewExpression:
        // Анализируем вызовы функций и конструкторов через токены
        // Разрыв после запятых в аргументах, после открывающей скобки
        const callTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...callTokenBreaks);
        break;
        
      case ts.SyntaxKind.BinaryExpression:
        // Анализируем бинарные выражения через токены
        // Разрыв после операторов (+, -, *, /, &&, ||, и т.д.)
        const binaryTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...binaryTokenBreaks);
        break;
        
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.ForStatement:
        // Анализируем условные операторы и циклы через токены
        // Разрыв после логических операторов в условиях
        const conditionalTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...conditionalTokenBreaks);
        break;
        
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclaration:
        // Анализируем объявления переменных через токены
        // Разрыв после =, запятых, и т.д.
        const varTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...varTokenBreaks);
        break;
        
      case ts.SyntaxKind.ObjectLiteralExpression:
        // Анализируем объектные литералы через токены
        // Разрыв после запятых между свойствами, после открывающей скобки
        const objTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...objTokenBreaks);
        break;
        
      case ts.SyntaxKind.ArrayLiteralExpression:
        // Анализируем массивы через токены
        // Разрыв после запятых между элементами, после открывающей скобки
        const arrTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...arrTokenBreaks);
        break;
        
      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        // КРИТИЧНО: НЕ разбиваем template literals - перенос внутри ${} меняет семантику!
        // Любой перенос и отступ внутри `${}` становится частью строки в runtime
        // НЕ анализируем токены этого узла, НЕ анализируем дочерние узлы
        break;
        
      case ts.SyntaxKind.TaggedTemplateExpression:
        // КРИТИЧНО: НЕ разбиваем tagged template expressions
        // НЕ анализируем токены этого узла, НЕ анализируем дочерние узлы
        break;
        
      case ts.SyntaxKind.ReturnStatement:
        // КРИТИЧНО: НЕ разрываем сразу после 'return' - это ASI ошибка!
        // return\n{ → return; { (возвращает undefined вместо объекта)
        // Можем разрывать ВНУТРИ возвращаемого выражения, но не сразу после return
        const returnTokenBreaks = this.findBreakableTokensForASICritical(node, lineStart, lineEnd, context, 'return');
        breakPoints.push(...returnTokenBreaks);
        // КРИТИЧНО: НЕ анализируем дочерние узлы рекурсивно!
        // findBreakableTokensForASICritical УЖЕ проанализировал их с правильной фильтрацией!
        return breakPoints;
        
      case ts.SyntaxKind.ThrowStatement:
        const throwTokenBreaks = this.findBreakableTokensForASICritical(node, lineStart, lineEnd, context, 'throw');
        breakPoints.push(...throwTokenBreaks);
        return breakPoints;
        
      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        // КРИТИЧНО: НЕ разбиваем template literals - перенос внутри ${} меняет семантику!
        // Любой перенос и отступ внутри `${}` становится частью строки в runtime
        // НЕ анализируем токены этого узла, НЕ анализируем дочерние узлы
        break;
        
      case ts.SyntaxKind.TaggedTemplateExpression:
        // КРИТИЧНО: НЕ разбиваем tagged template expressions - это ASI ошибка!
        // "str"\n`template` → "str"`template` (строка как функция - runtime error)
        // НЕ анализируем токены этого узла, НЕ анализируем дочерние узлы
        break;
        
      case ts.SyntaxKind.AsExpression:
        // Анализируем as-выражения через токены
        // Можем разрывать после 'as', внутри типа
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
        // Анализируем type assertion (<Type>value) через токены
        const assertTokenBreaks = this.findBreakableTokens(node, lineStart, lineEnd, context);
        breakPoints.push(...assertTokenBreaks);
        break;
        
      default:
        // Для остальных типов узлов используется рекурсивный анализ дочерних элементов
        break;
    }

    // Анализируем дочерние узлы, только если они пересекаются со строкой
    for (const child of node.children) {
      // Пропускаем дочерние узлы, которые не пересекаются с анализируемой строкой
      if (child.fullRange.end.offset <= lineStart || child.fullRange.start.offset >= lineEnd) {
        continue;
      }
      
      // Пропускаем modifiers - они уже включены в syntaxTokens родительского узла
      const isModifier = child.kind === ts.SyntaxKind.ExportKeyword ||
                         child.kind === ts.SyntaxKind.PublicKeyword ||
                         child.kind === ts.SyntaxKind.PrivateKeyword ||
                         child.kind === ts.SyntaxKind.ProtectedKeyword ||
                         child.kind === ts.SyntaxKind.StaticKeyword ||
                         child.kind === ts.SyntaxKind.ReadonlyKeyword ||
                         child.kind === ts.SyntaxKind.AsyncKeyword ||
                         child.kind === ts.SyntaxKind.AbstractKeyword;
      
      if (isModifier) {
        continue; // Не анализируем modifiers отдельно
      }
      
      // КРИТИЧНО: Пропускаем дочерние узлы критических конструкций
      // Template literals - перенос внутри ${} меняет семантику
      const isCriticalNode = child.kind === ts.SyntaxKind.TemplateExpression ||
                             child.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
                             child.kind === ts.SyntaxKind.TaggedTemplateExpression ||
                             child.kind === ts.SyntaxKind.TemplateSpan ||
                             child.kind === ts.SyntaxKind.TemplateMiddle ||
                             child.kind === ts.SyntaxKind.TemplateTail ||
                             child.kind === ts.SyntaxKind.TemplateHead;
      
      if (isCriticalNode) {
        continue; // НЕ анализируем критические конструкции
      }
      
      const childBreaks = this.analyzeNodeForBreakPoints(child, lineStart, lineEnd, context);
      breakPoints.push(...childBreaks);
    }

    return breakPoints;
  }

  /**
   * Находит точки разбиения для Union/Intersection типов
   * Использует специальную логику отступов для вложенных выражений
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

    // Защита от некорректных вычислений
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
   * Находит точки разбиения, используя семантические разделители узла.
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
   * Вычисляет уровень отступа для узла на основе его позиции в файле
   * 
   * Возвращает базовый отступ строки + 1 фиксированный уровень для вложенности.
   * Это обеспечивает единообразное форматирование для всех типов конструкций.
   */
  private calculateIndentLevel(node: EnhancedASTNode, context: FormattingContext): number {
    // Не используем node.metadata.indentLevel - он содержит глубину в AST, а не отступ строки
    // if (node.metadata.indentLevel !== undefined) {
    //   return node.metadata.indentLevel;
    // }

    // Находим строку, на которой начинается узел
    const startPosition = node.fullRange.start;
    const lineStart = startPosition.offset - startPosition.column;
    
    // Получаем текст строки от начала до позиции узла
    const sourceText = context.enhancedAST.ast.sourceFile.text;
    if (!sourceText) {
      return 0; // Не можем определить отступ - возвращаем 0
    }
    
    const lineText = sourceText.substring(lineStart, startPosition.offset);
    
    // Считаем эквивалент пробельных символов в "единицах отступа" конфигурации
    const indentUnitWidth = context.formatterConfig.useTabs ? 1 : context.formatterConfig.tabSize;
    let leadingEquivalent = 0;
    for (const char of lineText) {
      if (char === ' ') leadingEquivalent++;
      else if (char === '\t') leadingEquivalent += indentUnitWidth;
      else break;
    }
    
    // Возвращаем базовый отступ (в единицах) + 1 уровень для вложенности
    return Math.floor(leadingEquivalent / Math.max(1, indentUnitWidth)) + 1;
  }

  /**
   * Вычисляет уровень отступа для вложенных выражений (UnionType, IntersectionType, и т.д.)
   * Использует базовый отступ строки + 1 фиксированный уровень
   * 
   * Теперь использует ТОЛЬКО базовый отступ строки, а не позицию узла в строке.
   * Это предотвращает огромные отступы для inline-выражений в середине строки.
   */
  private calculateIndentLevelForInlineExpression(node: EnhancedASTNode, context: FormattingContext): number {
    const startPosition = node.fullRange.start;
    const lineStart = startPosition.offset - startPosition.column;
    
    // Получаем текст строки от начала до позиции узла
    const sourceText = context.enhancedAST.ast.sourceFile.text;
    if (!sourceText) {
      return 0;
    }
    
    // Получаем полную строку для определения базового отступа
    const lineEndOffset = sourceText.indexOf('\n', lineStart);
    const fullLineText = lineEndOffset >= 0 
      ? sourceText.substring(lineStart, lineEndOffset)
      : sourceText.substring(lineStart);
    
    // Считаем ТОЛЬКО ведущий эквивалент пробелов в единицах конфигурации
    const indentUnitWidth = context.formatterConfig.useTabs ? 1 : context.formatterConfig.tabSize;
    let leadingEquivalent = 0;
    for (const char of fullLineText) {
      if (char === ' ') leadingEquivalent++;
      else if (char === '\t') leadingEquivalent += indentUnitWidth;
      else break; // Останавливаемся на первом не-пробельном символе
    }
    
    // Базовый отступ строки (в единицах) + 1 фиксированный уровень
    return Math.floor(leadingEquivalent / Math.max(1, indentUnitWidth)) + 1;
  }

  /**
   * Выбирает оптимальные точки разбиения
   * Предпочитает non-paren breakpoints, но использует paren если non-paren не решают проблему
   */
  private selectOptimalBreakPoints(analysis: LineAnalysisResult, context: FormattingContext): BreakPoint[] {
    if (analysis.breakPoints.length === 0) {
      return [];
    }

    // Разделяем breakpoints на paren и non-paren
    const parenBreaks = analysis.breakPoints.filter(bp =>
      bp.reason?.includes('open_paren') || bp.reason?.includes('close_paren')
    );
    const nonParenBreaks = analysis.breakPoints.filter(bp =>
      !bp.reason?.includes('open_paren') && !bp.reason?.includes('close_paren')
    );

    // 1) Пробуем non-paren в приоритете
    if (nonParenBreaks.length > 0) {
      const result = this.trySelectBreaksFromList(nonParenBreaks, analysis, context);
      if (result.length > 0) return result;
    }

    // 2) Пробуем сочетание с paren
    const mixed = [...nonParenBreaks, ...parenBreaks];
    if (mixed.length > 0) {
      const result = this.trySelectBreaksFromList(mixed, analysis, context);
      if (result.length > 0) return result;
    }
    
    // 3) Пробуем все оставшиеся
    return this.trySelectBreaksFromList(analysis.breakPoints, analysis, context);
  }

  /**
   * Пытается выбрать breakpoints из списка
   * Возвращает пустой массив если breakpoints не решают проблему с длиной строк
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

    // Возвращаем результат ТОЛЬКО если проблема решена
    // Иначе возвращаем пустой массив, чтобы попробовать другие варианты
    if (this.hasLongLines(currentText, context.maxLineLength)) {
      return [];
    }

    return selectedBreaks;
  }

  /**
   * Проверяет, есть ли в тексте длинные строки
   */
  private hasLongLines(text: string, maxLength: number): boolean {
    return text.split('\n').some(line => line.length > maxLength);
  }

  /**
   * Находит следующий оптимальный перенос
   * ДИНАМИЧЕСКАЯ ОЦЕНКА: выбирает тот перенос, который даёт максимальное улучшение
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

      // Симулируем применение переноса
      const simulatedText = this.simulateBreakApplication(currentText, candidate, analysis, context, alreadySelected);
      
      // Оцениваем улучшение
      const score = this.calculateImprovementScore(currentText, simulatedText, context.maxLineLength, candidate, analysis);
      
      // Выбираем кандидата с наилучшим score
      if (score > 0 && score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Вычисляет score улучшения (чем больше - тем лучше)
   * Учитывает: сокращение длины, количество исправленных строк, приоритет
   * Ослаблены требования, учитываются частичные улучшения
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
    
    // Базовый score: сколько строк стали короткими
    let score = (originalLongCount - modifiedLongCount) * 100;
    
    // Даже если количество длинных строк не уменьшилось, 
    // даем существенный бонус за сокращение максимальной длины
    if (score <= 0) {
      const originalMaxLength = Math.max(...originalLines.map(l => l.length));
      const modifiedMaxLength = Math.max(...modifiedLines.map(l => l.length));
      
      if (modifiedMaxLength < originalMaxLength) {
        // УВЕЛИЧЕН коэффициент с 0.5 до 3.0 для большего веса частичных улучшений
        score = (originalMaxLength - modifiedMaxLength) * 3.0;
      } else {
        // Нет улучшения — не повышаем score
        score = 0;
      }
    }
    
    // Увеличен priorityBonus с 0.5 до 2.0 для большего влияния приоритета
    const priorityBonus = Math.max(0, 10 - breakPoint.priority) * 2.0;
    score += priorityBonus;
    
    // Бонус за равномерное распределение длины строк
    const modifiedLengths = modifiedLines.map(l => l.length);
    const avgLength = modifiedLengths.reduce((a, b) => a + b, 0) / modifiedLengths.length;
    const variance = modifiedLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / modifiedLengths.length;
    const balanceBonus = variance < 1000 ? 5 : 0;
    score += balanceBonus;
    
    // ТАЙ-БРЕЙКЕР: При равных других условиях предпочитаем максимизацию первой строки
    // (более логично чем разбиение пополам)
    if (modifiedLines.length > 1 && score > 0) {
      const firstLineLength = (modifiedLines[0] ?? '').length;
      if (firstLineLength <= maxLength) {
        // Очень малый бонус, не влияет на основные решения: 0..0.5
        score += (firstLineLength / maxLength) * 0.5;
      }
    }
    
    // ЭСТЕТИЧЕСКАЯ МЕТРИКА (новая):
    // - Предпочитаем переносы, находящиеся ближе к границе лимита
    // - Сильно предпочитаем переносы ПОСЛЕ верхнеуровневых запятых выбранного покрывающего узла
    // - Наказываем перенос СРАЗУ после открывающей скобки, если доступны запятые верхнего уровня
    // - Слегка штрафуем переносы вне верхнего покрывающего узла (кроме логических операторов)

    if (analysis) {
      const crossing = analysis.crossingLocalIndex ?? Math.floor(maxLength * 0.9);
      const distance = Math.abs((breakPoint.position ?? 0) - crossing);
      // Чем ближе к границе — тем лучше (затухание 0.5 балла за символ)
      const nearLimitBonus = Math.max(0, 30 - distance * 0.5);
      score += nearLimitBonus;

      const isTopLevelCovering = analysis.upperCoveringNode && breakPoint.node === analysis.upperCoveringNode;
      const isComma = /comma/.test(breakPoint.reason || '');
      const hasPreferredCommas = (analysis.topLevelCommaLocalPositions?.length || 0) > 0;

      if (isTopLevelCovering && isComma) {
        score += 40; // Сильный бонус за перенос после верхнеуровневой запятой
      }

      // Штраф за перенос сразу после открывающей скобки в вызове
      if (/after open_paren/.test(breakPoint.reason || '')) {
        score += hasPreferredCommas ? -20 : -5;
      }

      // Небольшой штраф за перенос вне целевого покрывающего узла (кроме логических операторов)
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
   * Симулирует применение переноса
   * Использует ЛОКАЛЬНЫЕ позиции
   */
  private simulateBreakApplication(
    text: string,
    breakPoint: BreakPoint,
    analysis: LineAnalysisResult | null,
    context: FormattingContext,
    alreadySelected: BreakPoint[]
  ): string {
    // Строим отступ по конфигурации (как в реальном применении)
    const unit = context.indentUnit || '  ';
    const indent = unit.repeat(Math.max(0, breakPoint.indentLevel));

    // Находим относительную позицию в строке
    if (!analysis) {
      return text; // Не можем симулировать без анализа - возвращаем оригинал
    }

    // breakPoint.position теперь УЖЕ ЛОКАЛЬНАЯ позиция!
    // Больше не нужно вычитать globalStart
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
   * Находит верхний покрывающий узел вокруг указанного оффсета
   * Поднимается вверх по родителям, выбирая ближайший "группирующий" узел,
   * на токенах которого на этой строке есть верхнеуровневые разделители.
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

    // Идём вверх максимум 30 шагов в поиске подходящего узла
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
        if (!fallback) fallback = current; // запомним ближайший групповой узел как запасной
      }
      current = current.parent;
    }
    return fallback;
  }

  /**
   * Проверяет, является ли узел "группирующим" с разделителями верхнего уровня
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
   * Возвращает позиции переносов ПОСЛЕ верхнеуровневых запятых для узла (глобальные позиции)
   * Обрабатывает () / {} / [] в зависимости от типа узла.
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

    // Какой тип скобок считать верхнеуровневым для узла
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

      // интересуют только токены в анализируемой строке
      if (tokenEnd <= lineStart || tokenStart >= lineEnd) {
        continue;
      }

      // учёт глубины
      if (token.type === 'open_paren') parenDepth++;
      if (token.type === 'close_paren') parenDepth = Math.max(0, parenDepth - 1);
      if (token.type === 'open_brace') braceDepth++;
      if (token.type === 'close_brace') braceDepth = Math.max(0, braceDepth - 1);
      if (token.type === 'open_bracket') bracketDepth++;
      if (token.type === 'close_bracket') bracketDepth = Math.max(0, bracketDepth - 1);

      // выбираем только запятые верхнего уровня для соответствующего типа узла
      if (token.type === 'comma' && commaSeparators.has(tokenStart)) {
        const isTopLevelParen = trackParen && parenDepth === 1 && braceDepth === 0 && bracketDepth === 0;
        const isTopLevelBrace = trackBrace && braceDepth === 1 && parenDepth === 0 && bracketDepth === 0;
        const isTopLevelBracket = trackBracket && bracketDepth === 1 && parenDepth === 0 && braceDepth === 0;
        if (isTopLevelParen || isTopLevelBrace || isTopLevelBracket) {
          positions.push(tokenEnd); // перенос ПОСЛЕ запятой
        }
      }
    }

    return positions;
  }

  /**
   * Преобразует точки разбиения в формат LineBreakInsertion
   * Использует глобальные позиции для финального применения
   */
  private convertToLineBreaks(breakPoints: BreakPoint[]): LineBreakInsertion[] {
    return breakPoints.map(bp => ({
      position: bp.globalPosition,  // Используем глобальную позицию для TransformationManager!
      indentLevel: bp.indentLevel,
      reason: bp.reason
    }));
  }

  /**
   * Валидирует переносы
   */
  private validateBreaks(
    lineBreaks: LineBreakInsertion[], 
    analysis: LineAnalysisResult, 
    _context: FormattingContext
  ): boolean {
    // Строгая валидация - без переносов нет смысла
    if (lineBreaks.length === 0) {
      return false;
    }

    // ПРАВИЛЬНАЯ валидация: позиции переносов должны быть ТОЛЬКО внутри анализируемой строки
    const validBreaks: LineBreakInsertion[] = [];
    
    for (const lineBreak of lineBreaks) {
      // Позиция ДОЛЖНА быть строго внутри анализируемой строки
      if (lineBreak.position >= analysis.globalStart && lineBreak.position <= analysis.globalEnd) {
        validBreaks.push(lineBreak);
      }
      // Если позиция вне строки - это ошибка в логике AST анализа, просто игнорируем
    }

    // Обновляем массив переносов, оставляя только валидные
    lineBreaks.length = 0;
    lineBreaks.push(...validBreaks);

    return validBreaks.length > 0;
  }

  /**
   * Находит точки разбиения для ASI-критичных конструкций (return, throw)
   * Блокирует перенос между ключевым словом и первым значимым токеном (для безопасности ASI)
   * Рекурсивно анализирует дочерние узлы
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
    
    // Находим позицию ключевого слова в токенах
    let keywordIndex = -1;
    for (let i = 0; i < node.syntaxTokens.length; i++) {
      const token = node.syntaxTokens[i];
      if (token && token.type === 'keyword' && token.text === keyword) {
        keywordIndex = i;
        break;
      }
    }
    
    if (keywordIndex === -1) {
      // Не нашли ключевое слово, используем обычную логику
      return this.findBreakableTokens(node, lineStart, lineEnd, context);
    }
    
    // Находим конец первого значимого токена после ключевого слова
    // Все breakpoints ДО этой позиции будут отфильтрованы (для безопасности ASI)
    let firstSignificantTokenEnd: number | null = null;
    
    for (let i = keywordIndex + 1; i < node.syntaxTokens.length; i++) {
      const token = node.syntaxTokens[i];
      if (!token || token.type === 'whitespace' || token.type === 'newline') {
        continue;
      }
      
      if (token.type === 'semantic_node' && token.semanticNode) {
        // Для semantic_node находим первый значимый токен внутри
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
        // Для обычных токенов берём конец токена
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
            // Уже обработали перенос с этой глобальной позицией – ничего не делаем.
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
