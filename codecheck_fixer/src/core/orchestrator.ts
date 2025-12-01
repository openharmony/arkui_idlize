/**
 * Оркестратор для анализа и форматирования кода
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { TypeScriptAnalyzer } from '../analyzers/typescript-analyzer';
import { CppAnalyzer } from '../analyzers/cpp-analyzer';
import { LineLengthAnalyzer, LineLengthConfig } from '../analyzers/line-length-analyzer';
import { TypeScriptFormatter } from '../formatters/typescript-formatter';
import { CppFormatter } from '../formatters/cpp-formatter';
import { LineLengthFormatter } from '../../libs/arkts_formatter/line-length-formatter';
import { ContentTypeDetector } from '../../libs/common/content-type-detector';
import { ContentType } from '../../libs/common/common-types';
import {
  formatTypeScript as prettierFormatTypeScript,
  formatTsx as prettierFormatTsx
} from '../../libs/prettier_formatter';
import type { FormatOverrides } from '../../libs/prettier_formatter';
import { 
  AnalysisResult, 
  AnalysisConfig, 
  FormatterConfig, 
  ProjectConfig,
  CliOptions 
} from '@/types';

export class Orchestrator {
  private analysisConfig: AnalysisConfig;
  private formatterConfig: FormatterConfig;
  private projectConfig: ProjectConfig;

  constructor(projectConfig: ProjectConfig) {
    this.projectConfig = projectConfig;
    this.analysisConfig = projectConfig.analysis;
    this.formatterConfig = projectConfig.formatting;
  }

  async analyzeFiles(filePaths: string[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = await this.analyzeFileContent(filePath, content);
        results.push(result);
      } catch (error) {
        console.error(`Error analyzing file ${filePath}:`, error);
      }
    }
    
    return results;
  }

  async analyzeProject(options: CliOptions): Promise<AnalysisResult[]> {
    const allFiles: string[] = [];
    
    // Собираем все файлы для анализа
    for (const pattern of options.paths) {
      const files = await glob(pattern, { 
        cwd: this.projectConfig.repoPath,
        absolute: true 
      });
      allFiles.push(...files);
    }
    
    // Фильтруем файлы по типам
    const filteredFiles = allFiles.filter(file => 
      this.shouldAnalyzeFile(file)
    );
    
    return this.analyzeFiles(filteredFiles);
  }

  public async analyzeFileContent(filePath: string, content: string): Promise<AnalysisResult> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.ts':
      case '.tsx':
      case '.ets':
        return this.analyzeTypeScript(filePath, content);
      case '.cpp':
      case '.cc':
      case '.cxx':
      case '.c++':
      case '.hpp':
      case '.h':
        return this.analyzeCpp(filePath, content);
      default:
        // Возвращаем пустой результат для неподдерживаемых файлов вместо ошибки
        return {
          filePath,
          issues: [],
        };
    }
  }

  public async analyzeAndFixLineLength(filePath: string, content: string, lineLengthConfig: LineLengthConfig): Promise<{ result: AnalysisResult; fixedContent: string | null }> {
    const analyzer = new LineLengthAnalyzer(this.analysisConfig, lineLengthConfig);
    const contentType = ContentTypeDetector.detectFileType(filePath);
    const result = await analyzer.analyze(content, contentType);
    
    const fixableIssues = result.issues.filter(issue => issue.isFixable);
    
    if (fixableIssues.length > 0) {
      const formatter = new LineLengthFormatter(this.formatterConfig, lineLengthConfig);
      const contentType = ContentTypeDetector.detectFileType(filePath);
      const fixedContent = formatter.format(content, contentType);
      return { result: { ...result, filePath }, fixedContent };
    }
    
    return { result: { ...result, filePath }, fixedContent: null };
  }

  private async analyzeTypeScript(filePath: string, content: string): Promise<AnalysisResult> {
    const analyzer = new TypeScriptAnalyzer(this.analysisConfig);
    const contentType = ContentTypeDetector.detectFileType(filePath);
    const res = await analyzer.analyze(content, contentType);
    return { ...res, filePath };
  }

  private async analyzeCpp(filePath: string, content: string): Promise<AnalysisResult> {
    const analyzer = new CppAnalyzer(this.analysisConfig);
    const contentType = ContentTypeDetector.detectFileType(filePath);
    const res = await analyzer.analyze(content, contentType);
    return { ...res, filePath };
  }

  async analyzeLineLength(filePath: string, content: string, lineLengthConfig: any): Promise<AnalysisResult> {
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.ts' || extension === '.tsx' || extension === '.ets') {
      const analyzer = new LineLengthAnalyzer(this.analysisConfig, lineLengthConfig);
      const contentType = ContentTypeDetector.detectFileType(filePath);
      const res = await analyzer.analyze(content, contentType);
      return { ...res, filePath };
    }
    
    throw new Error(`Line length analysis not supported for file type: ${extension}`);
  }

  async formatLineLength(filePath: string, content: string, lineLengthConfig: any): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.ts' || extension === '.tsx' || extension === '.ets') {
      const formatter = new LineLengthFormatter(this.formatterConfig, lineLengthConfig);
      const contentType = ContentTypeDetector.detectFileType(filePath);
      return formatter.format(content, contentType);
    }
    
    throw new Error(`Line length formatting not supported for file type: ${extension}`);
  }

  async formatFiles(filePaths: string[], outputDir?: string): Promise<void> {
    if (!outputDir) {
      throw new Error('Output directory must be specified for formatting files');
    }

    for (const filePath of filePaths) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const formatted = await this.formatFile(filePath, content);
        
        // Создаем путь для исправленного файла, сохраняя структуру каталогов
        const relativePath = path.relative(process.cwd(), filePath);
        const outputPath = path.join(outputDir, relativePath);
        
        // Создаем директории если нужно
        const outputDirPath = path.dirname(outputPath);
        fs.mkdirSync(outputDirPath, { recursive: true });
        
        // Записываем исправленный файл
        fs.writeFileSync(outputPath, formatted);
      } catch (error) {
        console.error(`Error formatting file ${filePath}:`, error);
      }
    }
  }

  public async formatFile(filePath: string, content: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.ts':
      case '.tsx':
        return this.formatPreferPrettier(filePath, content, extension);
      case '.ets':
        return this.formatTypeScript(content);
      case '.cpp':
      case '.cc':
      case '.cxx':
      case '.c++':
      case '.hpp':
      case '.h':
        return this.formatCpp(content);
      default:
        // Возвращаем исходный контент для неподдерживаемых файлов
        return content;
    }
  }

  private async formatPreferPrettier(
    filePath: string,
    content: string,
    extension: string
  ): Promise<string> {
    try {
      return await this.formatWithPrettier(filePath, content, extension);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[prettier] Не удалось отформатировать ${filePath}. Переключаюсь на ArkTS-форматтер. Причина: ${message}`
      );
      return this.formatWithArkTsFallback(content, extension);
    }
  }

  private async formatWithPrettier(
    filePath: string,
    content: string,
    extension: string
  ): Promise<string> {
    const overrides = this.buildPrettierOverrides(filePath);
    if (extension === '.tsx') {
      return prettierFormatTsx(content, overrides);
    }
    return prettierFormatTypeScript(content, overrides);
  }

  private buildPrettierOverrides(filePath: string): FormatOverrides {
    const trailingComma = this.formatterConfig.trailingCommas ? 'all' : 'none';

    return {
      filePath,
      strictParsing: true,
      prettierOptions: {
        semi: this.formatterConfig.semicolons,
        singleQuote: this.formatterConfig.quoteStyle === 'single',
        trailingComma,
        useTabs: this.formatterConfig.useTabs,
        tabWidth: this.formatterConfig.tabSize,
        printWidth: this.formatterConfig.maxLineLength
      }
    };
  }

  private formatWithArkTsFallback(content: string, extension: string): string {
    const lineLengthConfig = this.getLineLengthFallbackConfig();
    const arktsFormatter = new LineLengthFormatter(this.formatterConfig, lineLengthConfig);
    const contentType = extension === '.tsx' ? ContentType.TSX : ContentType.TS;
    return arktsFormatter.format(content, contentType);
  }

  private getLineLengthFallbackConfig(): LineLengthConfig {
    return {
      maxLineLength: this.formatterConfig.maxLineLength,
      ignoreUrls: false,
      ignoreStrings: false,
      ignoreComments: false,
      ignoreTemplateLiterals: false
    };
  }

  private async formatTypeScript(content: string): Promise<string> {
    const formatter = new TypeScriptFormatter(this.formatterConfig);
    return formatter.format(content);
  }

  private async formatCpp(content: string): Promise<string> {
    const formatter = new CppFormatter(this.formatterConfig);
    return formatter.format(content);
  }

  private shouldAnalyzeFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    const supportedExtensions = ['.ts', '.tsx', '.ets', '.cpp', '.cc', '.cxx', '.c++', '.hpp', '.h'];
    
    if (!supportedExtensions.includes(extension)) {
      return false;
    }
    
    // Проверяем размер файла
    const stats = fs.statSync(filePath);
    if (stats.size > this.analysisConfig.maxFileSize) {
      return false;
    }
    
    // Проверяем исключения
    for (const excludePattern of this.analysisConfig.excludePatterns) {
      if (filePath.includes(excludePattern)) {
        return false;
      }
    }
    
    return true;
  }

  generateReport(results: AnalysisResult[]): string {
    let report = '# Code Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Files analyzed: ${results.length}\n\n`;
    
    let totalIssues = 0;
    const issuesByType: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};
    
    for (const result of results) {
      totalIssues += result.issues.length;
      
      for (const issue of result.issues) {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
      }
    }
    
    report += `Total issues found: ${totalIssues}\n\n`;
    
    if (totalIssues > 0) {
      report += '## Issues by Type\n';
      for (const [type, count] of Object.entries(issuesByType)) {
        report += `- ${type}: ${count}\n`;
      }
      
      report += '\n## Issues by Severity\n';
      for (const [severity, count] of Object.entries(issuesBySeverity)) {
        report += `- ${severity}: ${count}\n`;
      }
      
      report += '\n## Detailed Issues\n';
      for (const result of results) {
        if (result.issues.length > 0) {
          report += `\n### ${result.filePath}\n`;
          for (const issue of result.issues) {
            report += `- [${issue.severity.toUpperCase()}] ${issue.message} (${issue.rule})\n`;
            report += `  Line ${issue.line}, Column ${issue.column}`;
            if (issue.lineLength !== undefined) {
              report += `, Length: ${issue.lineLength}`;
            }
            report += `\n`;
          }
        }
      }
    }
    
    return report;
  }
}


