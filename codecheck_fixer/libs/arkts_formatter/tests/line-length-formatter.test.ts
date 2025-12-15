import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { LineLengthFormatter } from '../line-length-formatter';
import { FormatterConfig } from '../../../src/types';
import type { LineLengthConfig } from '../types';

interface LLFFixtureCase {
  description: string;
  original: string;
  expected: string;
}

interface LLFFixtureFile {
  equivalent?: LLFFixtureCase[];
  notEquivalent?: LLFFixtureCase[];
}

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures', 'fixtures');

// Конфигурация форматтера подобрана под текущие эталоны в JSON
const formatterConfig: FormatterConfig = {
  tabSize: 2,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: false,
  maxLineLength: 80
};

const lineLengthConfig: LineLengthConfig = {
  maxLineLength: 80, // Переопределяется в конфигурационном json-файле утилиты
  ignoreUrls: false,
  ignoreStrings: false,
  ignoreComments: false,
  ignoreTemplateLiterals: true
};

const formatter = new LineLengthFormatter(formatterConfig, lineLengthConfig);

function loadFixtureFiles(): string[] {
  const files = fs.readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((ent) => ent.isFile() && ent.name.endsWith('.json'))
    .map((ent) => path.join(FIXTURES_DIR, ent.name));
  return files.sort();
}

describe('Line-Length Formatter — JSON fixtures', () => {
  const files = loadFixtureFiles();

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as LLFFixtureFile;

    describe(`Fixture file: ${rel}`, () => {
      const eq = data.equivalent || [];
      for (const testCase of eq) {
        it(testCase.description, () => {
          const result = formatter.format(testCase.original, 'temp.ts');
          if (result !== testCase.expected) {
            // Диагностика различий для удобства
            // Покажем первые 200 символов
            const exp = testCase.expected.replace(/\n/g, '\\n');
            const got = result.replace(/\n/g, '\\n');
            // eslint-disable-next-line no-console
            console.log(`\n[DIFF] expected: ${exp.substring(0, 200)}...`);
            // eslint-disable-next-line no-console
            console.log(`[DIFF] received: ${got.substring(0, 200)}...`);
          }
          expect(result).toBe(testCase.expected);
        });
      }
    });
  }
});
