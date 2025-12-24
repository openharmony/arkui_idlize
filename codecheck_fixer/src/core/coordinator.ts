
import * as fs from 'fs/promises';
import * as path from 'path';
import { Orchestrator } from './orchestrator';
import { AnalysisResult, AnalysisIssue } from '../types';
import { LineLengthAnalyzer } from '../analyzers/line-length-analyzer';
import { ContentTypeDetector } from '../../libs/common/content-type-detector';
import { LineLengthConfig } from '../analyzers/line-length-analyzer';
import { cancellationToken } from '../../libs/common/cancellation';

interface FixOptions {
  fix: boolean;
  outputDir: string;
  repoPath: string;
  lineLengthConfig: LineLengthConfig;
  reportPath?: string;
  writeFixLog?: boolean;
}

interface ChangeLogEntry {
  filePath: string;
  originalPath: string;
  issuesFixed: AnalysisIssue[];
}

export class FixCoordinator {
  private orchestrator: Orchestrator;
  private filePaths: string[];
  private options: FixOptions;
  private changeLog: ChangeLogEntry[] = [];
  private analysisResults: AnalysisResult[] = [];
  private longLineCountCache = new Map<string, number>();
  private startTime: number;

  constructor(orchestrator: Orchestrator, filePaths: string[], options: FixOptions) {
    this.orchestrator = orchestrator;
    this.filePaths = filePaths;
    this.options = options;
    this.startTime = Date.now();
  }

  public async run(): Promise<void> {
    // Filter files early for accurate count
    const validFiles = this.filePaths.filter(filePath => /\.(ts|ets)$/.test(filePath));
    
    console.log(`Found files for processing: ${validFiles.length}`);
    
    let processed = 0;
    
    for (const filePath of validFiles) {
      if (cancellationToken.isCancelled()) {
        console.log('\nProcessing cancelled by user.');
        break;
      }

      const fileStartTime = Date.now();
      processed++;
      
      // Path relative to repository (if repoPath in options)
      let displayPath = filePath;
      if (this.options.repoPath) {
        displayPath = path.relative(this.options.repoPath, filePath);
      }

      const coloredDisplayPath = (() => {
        const match = displayPath.match(/^(.*[\\\/])([^\\\/]+)$/);
        if (!match) {
          return displayPath;
        }
        const [, dir, file] = match;
        return `\x1b[90m${dir}\x1b[0m${file}`;
      })();
      
      // Online indication of current file
      try { process.stdout.write(`[${processed}/${validFiles.length}] ${coloredDisplayPath} …`); } catch {}

      const preload = await this.prepareFileForProcessing(filePath);

      const quickCount = preload.longLineCount;

      if (cancellationToken.isCancelled()) {
        console.log('\nProcessing cancelled by user.');
        break;
      }

      try {
        process.stdout.write(`\r[${processed}/${validFiles.length}] ${coloredDisplayPath} … cases: \x1b[36m${quickCount}\x1b[0m`);
      } catch {}

      const result = await this.processFile(filePath, preload);
      
      // File processing time (seconds)
      const fileTime = (Date.now() - fileStartTime) / 1000;
      const timeColored = `\x1b[90m${fileTime.toFixed(1)}s\x1b[0m`;
      const suffix = ` (${timeColored}, cases: \x1b[36m${result.totalCases}\x1b[0m, fixed: ${result.fixedCases})`;
      try {
        process.stdout.write(`\r[${processed}/${validFiles.length}] ${coloredDisplayPath}${suffix}\n`);
      } catch {
        console.log(`[${processed}/${validFiles.length}] ${coloredDisplayPath}${suffix}`);
      }
    }

    const totalDurationMs = Date.now() - this.startTime;
    const finalMessage = this.formatFinalDuration(totalDurationMs);

    console.log(`✅ File processing complete! Summary generated. ${finalMessage}`);
    
    this.writeDryRunReport().catch(error => {
      console.error('Error writing dry-run report:', error);
    });
  }

  private formatFinalDuration(durationMs: number): string {
    const totalSeconds = durationMs / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
    return `Time spent: \x1b[36m${formatted}\x1b[0m`;
  }

  private async processFile(
    filePath: string,
    preload?: { content: string; longLineCount: number }
  ): Promise<{ totalCases: number; fixedCases: number }> {
    try {
      if (cancellationToken.isCancelled()) {
        return { totalCases: 0, fixedCases: 0 };
      }
      const content = preload?.content ?? await fs.readFile(filePath, 'utf-8');
      if (cancellationToken.isCancelled()) {
        return { totalCases: 0, fixedCases: 0 };
      }
      const { result, fixedContent } = await this.orchestrator.analyzeAndFixLineLength(filePath, content, this.options.lineLengthConfig);
      this.analysisResults.push(result);
      const unfixable = result.issues.filter(issue => issue.rule === 'line-length' && issue.isFixable === false);
      if (unfixable.length > 0) {
        console.warn(`Unfixable long lines in ${filePath}: ${unfixable.map(i => i.line).join(', ')}`);
      }
      
      if (this.options.fix && fixedContent) {
        await this.applyFixes(filePath, fixedContent, result);
      }

      // Calculate case totals for this file
      const totalCases = result.issues.length;
      let fixedCases = 0;
      if (fixedContent) {
        const contentType = ContentTypeDetector.detectFileType(filePath);
        const analyzer = new LineLengthAnalyzer((this as any).orchestrator['analysisConfig'] ?? ({} as any), this.options.lineLengthConfig);
        const after = await analyzer.analyze(fixedContent, contentType);
        const afterCount = after.issues.length;
        fixedCases = Math.max(0, totalCases - afterCount);
      }
      return { totalCases, fixedCases };
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return { totalCases: 0, fixedCases: 0 };
    }
  }

  private async prepareFileForProcessing(filePath: string): Promise<{ content: string; longLineCount: number }> {
    if (cancellationToken.isCancelled()) {
      return { content: '', longLineCount: 0 };
    }

    const cachedCount = this.longLineCountCache.get(filePath);
    const content = await fs.readFile(filePath, 'utf-8');

    if (cancellationToken.isCancelled()) {
      return { content, longLineCount: cachedCount ?? 0 };
    }
    if (cachedCount !== undefined) {
      return { content, longLineCount: cachedCount };
    }
    const longLineCount = this.countLongLines(content, this.options.lineLengthConfig.maxLineLength);
    this.longLineCountCache.set(filePath, longLineCount);
    return { content, longLineCount };
  }

  private countLongLines(content: string, maxLength: number): number {
    let count = 0;
    let currentLength = 0;
    for (let i = 0; i < content.length; i++) {
      const ch = content.charCodeAt(i);
      if (ch === 10) { // \n
        if (currentLength > maxLength) count++;
        currentLength = 0;
      } else if (ch === 13) { // \r
        // handle CRLF: next character is \n
        continue;
      } else {
        currentLength++;
      }
    }
    if (currentLength > maxLength) count++;
    return count;
  }

  private async writeDryRunReport(): Promise<void> {
    if (this.options.fix) {
      return;
    }
    if (!this.options.reportPath) {
      return;
    }
    const filesWithIssues = this.analysisResults.filter(r => r.issues.length > 0);
    const totalIssues = filesWithIssues.reduce((acc, r) => acc + r.issues.length, 0);

    let reportContent = `# Line Length Report - ${new Date().toISOString()}\n\n`;
    reportContent += `Found ${totalIssues} issues in ${filesWithIssues.length} files.\n\n---\n\n`;
    let issueCount = 1;
    for (const result of filesWithIssues) {
      for (const issue of result.issues) {
        reportContent += `${issueCount}. \`${result.filePath}\` - **[${issue.rule}]**: ${issue.message} (Line: ${issue.line})\n`;
        issueCount++;
      }
    }

    const reportDir = path.dirname(this.options.reportPath);
    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(this.options.reportPath, reportContent);
  }

  // buildFixLogContent removed as obsolete

  private async applyFixes(originalPath: string, fixedContent: string, result: AnalysisResult): Promise<void> {
    const relativePath = path.relative(this.options.repoPath, originalPath);
    const outputPath = path.join(this.options.outputDir, relativePath);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    await fs.writeFile(outputPath, fixedContent);

    this.changeLog.push({
      filePath: outputPath,
      originalPath: originalPath,
      issuesFixed: result.issues.filter(issue => issue.isFixable),
    });
  }

  // writeChangeLog removed as obsolete

  // Report data for external report collector
  public getAnalysisResults(): AnalysisResult[] {
    return this.analysisResults;
  }

  public getChangeLog(): ChangeLogEntry[] {
    return this.changeLog;
  }
}
