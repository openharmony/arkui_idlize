import { assert, suite, test } from '@koalaui/harness';
import * as fs from 'fs';
import * as path from 'path';
import { LineLengthFormatter } from '../libs/arkts_formatter/line-length-formatter';
import { FormatterConfig } from '../src/types';
import type { LineLengthConfig } from '../libs/arkts_formatter/types';
import { ContentType } from '../libs/common/common-types';

interface LLFFixtureCase {
  description: string;
  original: string;
  expected: string;
}

interface LLFFixtureFile {
  equivalent?: LLFFixtureCase[];
  notEquivalent?: LLFFixtureCase[];
}

const FIXTURES_DIR = path.resolve(__dirname, '../libs/arkts_formatter/tests/fixtures/fixtures');

// Конфигурация форматтера подобрана под текущие эталоны в JSON
const formatterConfig: FormatterConfig = {
  tabSize: 2,
  useTabs: false,
  quoteStyle: 'single',
  semicolons: true,
  trailingCommas: false,
  maxLineLength: 120
};

const lineLengthConfig: LineLengthConfig = {
  maxLineLength: 120, // Соответствует конфигурации проекта
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

suite('Line-Length Formatter — JSON fixtures', () => {
  const files = loadFixtureFiles();

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as LLFFixtureFile;

    suite(`Fixture file: ${rel}`, () => {
      const eq = data.equivalent || [];
      for (const testCase of eq) {
        test(testCase.description, () => {
          const result = formatter.format(testCase.original, ContentType.TS);
          if (result !== testCase.expected) {
            // Диагностика различий для удобства
            // Покажем первые 200 символов
            const exp = testCase.expected.replace(/\n/g, '\\n');
            const got = result.replace(/\n/g, '\\n');
            console.log(`\n[DIFF] expected: ${exp.substring(0, 200)}...`);
            console.log(`[DIFF] received: ${got.substring(0, 200)}...`);
          }
          assert.equal(result, testCase.expected);
        });
      }
    });
  }
});

