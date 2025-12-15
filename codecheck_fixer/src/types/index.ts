/**
 * Основные типы для библиотеки CodeCheck Fixer
 */

export interface AnalysisIssue {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  type: 'syntax' | 'style' | 'performance' | 'best-practice' | 'security' | 'custom';
  isFixable?: boolean;
  lineLength?: number; // Длина строки для правила line-length
}

export interface AnalysisResult {
  filePath?: string;
  issues: AnalysisIssue[];
  performance?: {
    analysisTime: number;
    memoryUsage: number;
  };
  metrics?: CodeMetrics;
  timestamp?: Date;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: Severity;
  message: string;
  line: number;
  column: number;
  rule: string;
  fix?: FixSuggestion;
}

export enum IssueType {
  SYNTAX_ERROR = 'syntax_error',
  STYLE_VIOLATION = 'style_violation',
  TYPE_ERROR = 'type_error',
  PERFORMANCE_ISSUE = 'performance_issue',
  SECURITY_ISSUE = 'security_issue',
  BEST_PRACTICE = 'best_practice'
}

export enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  HINT = 'hint'
}

export interface FixSuggestion {
  description: string;
  replacement?: string;
  autoFixable: boolean;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage?: number;
}

export interface AnalysisConfig {
  rules: RuleConfig[];
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  timeout: number;
}

export interface RuleConfig {
  name: string;
  enabled: boolean;
  severity: Severity;
  options?: Record<string, any>;
}

export interface FormatterConfig {
  tabSize: number; // число пробелов для одного таба
  useTabs: boolean;
  quoteStyle: 'single' | 'double';
  semicolons: boolean;
  trailingCommas: boolean;
  maxLineLength: number;
}

export interface CliOptions {
  config?: string;
  output?: string;
  format?: boolean;
  fix?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  paths: string[];
}

export interface PathsForCheckByType {
  ts?: string[];
  ets?: string[];
  cpp?: string[];
  [key: string]: string[] | undefined;
}

export interface ProjectConfig {
  description: string;
  repoPath: string;
  pathsForCheck: string[];
  pathsForCheckByType?: PathsForCheckByType;
  analysis: AnalysisConfig;
  formatting: FormatterConfig;
}
