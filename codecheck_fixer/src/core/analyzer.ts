/**
 * Базовый класс для анализа кода
 */

import { AnalysisResult, AnalysisConfig, Issue, CodeMetrics, IssueType, Severity } from '@/types';
import { ContentType } from '../../libs/common/common-types';

export abstract class BaseAnalyzer {
  protected config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
  }

  abstract analyze(content: string, contentType: ContentType): Promise<AnalysisResult>;

  protected createIssue(
    type: IssueType,
    severity: Severity,
    message: string,
    line: number,
    column: number,
    rule: string
  ): Issue {
    return {
      id: `${type}_${line}_${column}`,
      type,
      severity,
      message,
      line,
      column,
      rule
    };
  }

  protected calculateMetrics(content: string): CodeMetrics {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => 
      line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
    ).length;

    return {
      linesOfCode,
      cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
      maintainabilityIndex: this.calculateMaintainabilityIndex(content),
      technicalDebt: this.calculateTechnicalDebt(content)
    };
  }

  private calculateCyclomaticComplexity(_content: string): number {
    // Заглушка для расчета цикломатической сложности
    // TODO: Реализовать через Compiler API
    // Пока возвращаем базовое значение
    return 1;
  }

  private calculateMaintainabilityIndex(_content: string): number {
    // Заглушка для расчета индекса поддерживаемости
    // TODO: Реализовать через Compiler API
    // Пока возвращаем базовое значение
    return 50;
  }

  private calculateTechnicalDebt(_content: string): number {
    // Заглушка для расчета технического долга
    // TODO: Реализовать через Compiler API
    // Пока возвращаем базовое значение
    return 0;
  }
}
