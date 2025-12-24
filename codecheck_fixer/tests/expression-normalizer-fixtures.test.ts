import { assert, suite, test } from '@koalaui/harness';
import * as ts from 'typescript';
import { ResultValidator } from '../libs/arkts_formatter/result-validator';
import { FormattingContext } from '../libs/arkts_formatter/types';
import { FormatterConfig } from '../src/types';
import type { LineLengthConfig } from '../libs/arkts_formatter/types';
import { createEnhancedASTWithQuery } from '../libs/arkts_enhanced_ast';
import cases from '../libs/arkts_formatter/tests/expression-normalizer/fixtures/pairs.json';

function makeContext(content: string): FormattingContext {
  // Use .ets to disable syntax checking for fragments
  const fileName = 'temp.ets';
  const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
  
  // Build Enhanced AST with query engine
  const enhancedAST = createEnhancedASTWithQuery(sourceFile, {
    preserveComments: true,
    preserveWhitespace: false,
    enableDiagnostics: false
  });
  
  const formatterConfig: FormatterConfig = {
    tabSize: 4,
    useTabs: false,
    quoteStyle: 'single',
    semicolons: true,
    trailingCommas: false,
    maxLineLength: 120
  };
  const lineLengthConfig: LineLengthConfig = {
    maxLineLength: 120,
    ignoreUrls: false,
    ignoreStrings: false,
    ignoreComments: false,
    ignoreTemplateLiterals: true
  };
  return {
    enhancedAST,
    content,
    lines: content.split('\n'),
    formatterConfig,
    lineLengthConfig,
    maxLineLength: lineLengthConfig.maxLineLength,
    indentUnit: '    ',
    fileName
  };
}

suite('Expression Normalizer fixtures (ResultValidator.normalizeCode)', () => {
  const logCaseResult = (
    kind: 'equivalent' | 'not-equivalent',
    description: string,
    actualIsValid: boolean,
    expectedIsValid: boolean,
    normalized?: { original: string; formatted: string }
  ) => {
    const isPass = actualIsValid === expectedIsValid;
    const RED = '\x1b[31m';
    const RESET = '\x1b[0m';
    if (!isPass) {
      const status = 'FAIL';
      const coloredStatus = `${RED}${status}${RESET}`;
      process.stdout.write(`[Normalizer][${kind}] ${description} => ${coloredStatus}\n`);
    }
    if (!isPass && normalized) {
      // Show normalized strings for quick diagnostics
      process.stdout.write(`  expected: ${normalized.original}\n`);
      process.stdout.write(`  received: ${normalized.formatted}\n`);
    }
  };

  suite('Equivalent pairs', () => {
    cases.equivalent.forEach(({ description, original, expected }) => {
      test(description, () => {
        const ctx = makeContext(original);
        const res = ResultValidator.validate(original, expected, ctx, 'temp.ts');
        
        logCaseResult('equivalent', description, res.isValid, true, res.normalized);
        assert(res.isValid, `Expected validation to pass for: ${description}`);
        assert.equal(res.normalized, undefined);
      });
    });
  });

  suite('Non-equivalent pairs', () => {
    cases.notEquivalent.forEach(({ description, original, expected }) => {
      test(description, () => {
        const ctx = makeContext(original);
        const res = ResultValidator.validate(original, expected, ctx, 'temp.ts');
        
        logCaseResult('not-equivalent', description, res.isValid, false, res.normalized);
        assert.equal(res.isValid, false, `Expected validation to fail for: ${description}`);
        assert.notEqual(res.normalized, undefined);
      });
    });
  });
});

