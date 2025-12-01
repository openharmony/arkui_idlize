import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResult } from '../types';

interface SummaryData {
  outputDir: string;
  filesProcessed: number;
  analysis: AnalysisResult[];
  changes: Array<{ filePath: string; before?: string; after?: string }>; // may be empty
  hasCpp: boolean;
  cppFormatted: number;
  cppBaselineLong: number;
  cppRemainingLong: number;
  cppRemainingRows: Array<{ file: string; line: number; message?: string }>;
  tsBaselineCount: number;
  tsRemainingCount: number;
  tsRemainingRows: Array<{ file: string; line: number; message: string }>;
  tsFilesWithIssuesBeforeCount: number;
}

export function generateSummaryMd(data: SummaryData): string {
  const {
    filesProcessed,
    analysis,
    hasCpp,
    cppFormatted,
    cppBaselineLong,
    cppRemainingLong,
    cppRemainingRows,
    tsBaselineCount,
    tsRemainingCount,
    tsRemainingRows,
    tsFilesWithIssuesBeforeCount,
  } = data;

  const analysisIssues = analysis.reduce((acc, r) => acc + r.issues.length, 0);

  const lines: string[] = [];
  lines.push('# CodeCheck Fixer Summary');
  lines.push('');
  lines.push(`- Files processed: ${filesProcessed}`);
  lines.push(`- Total issues detected (all analyzers): ${analysisIssues}`);
  lines.push('');
  lines.push('## Line length results');
  lines.push('');
  if (hasCpp) {
    lines.push('### C/C++');
    lines.push(`- Files formatted: ${cppFormatted}`);
    lines.push(`- Baseline long lines (before): ${cppBaselineLong}`);
    lines.push(`- Remaining long lines (after): ${cppRemainingLong}`);
    if (cppRemainingRows && cppRemainingRows.length > 0) {
      lines.push('');
      lines.push('#### Sample of remaining long lines (C/C++)');
      const sample = cppRemainingRows.slice(0, 50);
      sample.forEach(row => {
        lines.push(`- ${row.file}:${row.line}${row.message ? ` — ${row.message}` : ''}`);
      });
    }
    lines.push('');
  }

  lines.push('### TypeScript / ETS');
  lines.push(`- Files with issues before: ${tsFilesWithIssuesBeforeCount}`);
  lines.push(`- Baseline long lines (before): ${tsBaselineCount}`);
  lines.push(`- Remaining long lines (after): ${tsRemainingCount}`);
  if (tsRemainingRows && tsRemainingRows.length > 0) {
    lines.push('');
    lines.push('#### Sample of remaining long lines (TS/ETS)');
    const sample = tsRemainingRows.slice(0, 50);
    sample.forEach(row => {
      lines.push(`- ${row.file}:${row.line}${row.message ? ` — ${row.message}` : ''}`);
    });
  }

  return lines.join('\n');
}

export function writeSummary(dir: string, markdown: string, filename = 'SUMMARY.md'): void {
  const targetDir = dir || '.';
  const outPath = path.join(targetDir, filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, markdown, 'utf-8');
}


