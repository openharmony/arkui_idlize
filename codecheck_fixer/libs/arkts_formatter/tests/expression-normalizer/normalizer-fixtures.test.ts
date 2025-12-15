import { describe, it, expect } from '@jest/globals';
import * as ts from 'typescript';
import { ResultValidator } from '../../result-validator';
import { FormattingContext } from '../../types';
import { FormatterConfig } from '../../../../src/types';
import type { LineLengthConfig } from '../../types';
import { createEnhancedASTWithQuery } from '../../../arkts_enhanced_ast';
import cases from './fixtures/pairs.json';

function makeContext(content: string): FormattingContext {
  // Используем .ets, чтобы отключить синтаксическую проверку для фрагментов
  const fileName = 'temp.ets';
  const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
  
  // Строим Enhanced AST с запросником
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
    maxLineLength: 80
  };
  const lineLengthConfig: LineLengthConfig = {
    maxLineLength: 80,
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

// Fallback нормализатор для диагностики в тестах, если ResultValidator не вернул normalized
function normalizeForDebug(code: string): string {
  let result = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inMultiLineComment = false;
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inMultiLineComment = true; i += 2; continue;
    }
    if (inMultiLineComment && char === '*' && nextChar === '/') {
      inMultiLineComment = false; i += 2; continue;
    }
    if (!inString && !inMultiLineComment && char === '/' && nextChar === '/') {
      inComment = true; i += 2; continue;
    }
    if (inComment && char === '\n') { inComment = false; i++; continue; }
    if (inComment || inMultiLineComment) { i++; continue; }

    if (char === '"' || char === "'" || char === '`') {
      if (!inString) { inString = true; stringChar = char; }
      else if (char === stringChar && code[i - 1] !== '\\') { inString = false; stringChar = ''; }
      result += char; i++; continue;
    }
    if (inString) { result += char; i++; continue; }

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      while (i < code.length && (code[i] === ' ' || code[i] === '\t' || code[i] === '\n' || code[i] === '\r')) { i++; }
      const prevChar = result[result.length - 1] || '';
      const nextNonWs = (i < code.length ? code[i] : '') || '';
      const isAlphaNum = (c: string) => /[a-zA-Z0-9_$]/.test(c);
      if (isAlphaNum(prevChar) && isAlphaNum(nextNonWs)) { result += ' '; }
      continue;
    }

    result += char; i++;
  }

  return result.trim();
}

describe('Expression Normalizer fixtures (ResultValidator.normalizeCode)', () => {
  const logCaseResult = (
    kind: 'equivalent' | 'not-equivalent',
    description: string,
    actualIsValid: boolean,
    expectedIsValid: boolean,
    normalized?: { original: string; formatted: string }
  ) => {
    const isPass = actualIsValid === expectedIsValid;
    const GREEN = '\x1b[32m';
    const RED = '\x1b[31m';
    const RESET = '\x1b[0m';
    if (!isPass) {
      const status = 'FAIL';
      const coloredStatus = `${RED}${status}${RESET}`;
      // Выводим только при провале, чтобы не дублировать успешные кейсы
      process.stdout.write(`[Normalizer][${kind}] ${description} => ${coloredStatus}\n`);
    }
    if (!isPass && normalized) {
      // Показываем нормализованные строки для быстрой диагностики
      process.stdout.write(`  expected: ${normalized.original}\n`);
      process.stdout.write(`  received: ${normalized.formatted}\n`);
    } else if (!isPass && !normalized) {
      // Fallback: вычисляем нормализованные строки сами, чтобы показать ожидаемое/полученное
      // NB: мы не знаем raw строки здесь, поэтому посчитаем по последним вычисленным в текущем it
      // Решение: логирование ниже в it перед expect
    }
  };

  describe('Equivalent pairs', () => {
    cases.equivalent.forEach(({ description, original, expected }) => {
      it(description, () => {
        const ctx = makeContext(original);
        const res = ResultValidator.validate(original, expected, ctx, 'temp.ts');
        // Явная проверка: нормализованное выражение из original должно совпасть с expected
        const normOrig = normalizeForDebug(original);
        const normExp = normalizeForDebug(expected);
        if (normOrig !== expected) {
          process.stdout.write(`  expected (fixture): ${expected}\n`);
          process.stdout.write(`  received (normalized original): ${normOrig}\n`);
        }
        expect(normOrig).toBe(expected);
        // expected сам должен быть в нормализованной форме
        expect(normExp).toBe(expected);
        if (!res.isValid && !res.normalized) {
          const exp = normalizeForDebug(original);
          const rec = normalizeForDebug(expected);
          process.stdout.write(`  expected: ${exp}\n`);
          process.stdout.write(`  received: ${rec}\n`);
        }
        logCaseResult('equivalent', description, res.isValid, true, res.normalized);
        expect(res.isValid).toBe(true);
        expect(res.normalized).toBeUndefined();
      });
    });
  });

  describe('Non-equivalent pairs', () => {
    cases.notEquivalent.forEach(({ description, original, expected }) => {
      it(description, () => {
        const ctx = makeContext(original);
        const res = ResultValidator.validate(original, expected, ctx, 'temp.ts');
        // Явная проверка: нормализованное выражение из original НЕ должно совпасть с expected
        const normOrig = normalizeForDebug(original);
        if (normOrig === expected) {
          process.stdout.write(`  not-equivalent mismatch: normalized original equals expected\n`);
          process.stdout.write(`  normalized original: ${normOrig}\n`);
          process.stdout.write(`  expected (fixture): ${expected}\n`);
        }
        expect(normOrig).not.toBe(expected);
        if (!res.isValid && !res.normalized) {
          const exp = normalizeForDebug(original);
          const rec = normalizeForDebug(expected);
          process.stdout.write(`  expected: ${exp}\n`);
          process.stdout.write(`  received: ${rec}\n`);
        }
        logCaseResult('not-equivalent', description, res.isValid, false, res.normalized);
        expect(res.isValid).toBe(false);
        expect(res.normalized).toBeDefined();
      });
    });
  });
});


