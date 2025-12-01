/**
 * Анализатор для TypeScript кода с использованием TypeScript Compiler API
 */

import * as ts from 'typescript';
import { BaseAnalyzer } from '../core/analyzer';
import { ContentType } from '../../libs/common/common-types';
import { AnalysisResult, AnalysisIssue, AnalysisConfig } from '../types';

export class TypeScriptAnalyzer extends BaseAnalyzer {
  constructor(config: AnalysisConfig) {
    super(config);
  }

  async analyze(content: string, contentType: ContentType): Promise<AnalysisResult> {
    const virtualFile = contentType === ContentType.TSX ? 'temp.tsx' : 'temp.ts';

    const sourceFile = ts.createSourceFile(
      virtualFile,
      content,
      ts.ScriptTarget.ES2020,
      true
    );

    const issues: AnalysisIssue[] = [];

    // 1. Анализ с помощью TypeScript Compiler API (синтаксис, типы)
    const program = this.createProgram(virtualFile, content);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    
    diagnostics.forEach(diagnostic => {
        if (diagnostic.file && diagnostic.file.fileName === virtualFile) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            issues.push({
                rule: `ts(${diagnostic.code})`,
                message: message,
                line: line + 1,
                column: character + 1,
                severity: this.mapDiagnosticSeverity(diagnostic.category),
                type: 'syntax' // Обобщаем как синтаксис/тип
            });
        }
    });


    // 2. Дополнительный анализ AST (стиль, лучшие практики)
    this.visitNode(sourceFile, issues);

    return {
      issues,
    };
  }
  
  private mapDiagnosticSeverity(category: ts.DiagnosticCategory): 'error' | 'warning' | 'info' {
      switch(category) {
          case ts.DiagnosticCategory.Error:
              return 'error';
          case ts.DiagnosticCategory.Warning:
              return 'warning';
          case ts.DiagnosticCategory.Suggestion:
          case ts.DiagnosticCategory.Message:
              return 'info';
          default:
              return 'warning';
      }
  }

  private createProgram(filePath: string, content: string): ts.Program {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: true,
    };

    const host: ts.CompilerHost = {
      getSourceFile: (fileName: string) => {
        if (fileName === filePath) {
          return ts.createSourceFile(fileName, content, ts.ScriptTarget.ES2020, true);
        }
        return undefined;
      },
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (fileName: string) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getDefaultLibFileName: () => "lib.d.ts",
    };

    return ts.createProgram([filePath], compilerOptions, host);
  }

  private visitNode(node: ts.Node, issues: AnalysisIssue[]): void {
    // Проверка на использование 'any'
    if (ts.isTypeNode(node) && node.kind === ts.SyntaxKind.AnyKeyword) {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
            rule: 'no-any',
            message: 'Avoid using the "any" type',
            line: line + 1,
            column: character + 1,
            severity: 'warning',
            type: 'best-practice'
        });
    }

    // Проверка на переменные с '_'
    if (ts.isVariableDeclaration(node) && node.name.getText().startsWith('_')) {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
            rule: 'no-leading-underscore',
            message: 'Variable names should not start with an underscore',
            line: line + 1,
            column: character + 1,
            severity: 'warning',
            type: 'style'
        });
    }

    ts.forEachChild(node, (child) => this.visitNode(child, issues));
  }
}
