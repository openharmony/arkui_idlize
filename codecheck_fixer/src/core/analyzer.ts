/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Base class for code analysis
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
    // Placeholder for cyclomatic complexity calculation
    // Improve: Implement via Compiler API
    // Currently returns base value
    return 1;
  }

  private calculateMaintainabilityIndex(_content: string): number {
    // Placeholder for maintainability index calculation
    // Improve: Implement via Compiler API
    // Currently returns base value
    return 50;
  }

  private calculateTechnicalDebt(_content: string): number {
    // Placeholder for technical debt calculation
    // Improve: Implement via Compiler API
    // Currently returns base value
    return 0;
  }
}
