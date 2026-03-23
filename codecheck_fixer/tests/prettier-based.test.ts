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

import { assert, suite, test } from '@koalaui/harness';
import * as fs from 'fs';
import * as path from 'path';
import {
  formatSourceCode,
  formatTsx,
  formatTypeScript,
  inferLanguageFromFilePath,
  PrettierFormattingError
} from '../libs/prettier_formatter';

const FIXTURES_ROOT = path.resolve(__dirname, '../libs/prettier_formatter/tests/fixtures');

function loadFixture(...segments: string[]): string {
  const filePath = path.join(FIXTURES_ROOT, ...segments);
  return fs.readFileSync(filePath, 'utf-8');
}

suite('Prettier formatter', () => {
  test('formats TypeScript code according to the bundled config', async () => {
    const source = loadFixture('typescript', 'input.ts');
    const formatted = await formatTypeScript(source);

    assert.equal(formatted, loadFixture('typescript', 'output.ts'));
  });

  test('formats TSX code preserving JSX structure', async () => {
    const source = loadFixture('tsx', 'input.tsx');
    const formatted = await formatTsx(source);

    assert.equal(formatted, loadFixture('tsx', 'output.tsx'));
  });

  test('allows manual language inference from file path', () => {
    assert.equal(inferLanguageFromFilePath('/tmp/file.ts'), 'ts');
    assert.equal(inferLanguageFromFilePath('/tmp/file.tsx'), 'tsx');
  });

  test('throws descriptive error for unsupported extensions', () => {
    assert.throws(() => {
      inferLanguageFromFilePath('/tmp/file.ets');
    }, PrettierFormattingError);
  });

  test('provides a generic formatting entry point', async () => {
    const formatted = await formatSourceCode({
      code: loadFixture('generic', 'input.ts'),
      language: 'ts'
    });

    assert.equal(formatted, loadFixture('generic', 'output.ts'));
  });

  test('preserves source on parse error unless strict parsing requested', async () => {
    const source = 'setGridOptionsAttribute(scroller?: Scroller): void {}';
    let capturedError: Error | null = null;

    const formatted = await formatSourceCode({
      code: source,
      language: 'ts',
      onFormattingError: (error: Error) => {
        capturedError = error;
      }
    });

    assert.equal(formatted, source);
    assert(capturedError !== null, 'Expected error to be captured');
    assert.equal(capturedError!.name, 'PrettierFormattingError');

    // Test strict parsing mode
    let errorThrown = false;
    try {
      await formatSourceCode({
        code: source,
        language: 'ts',
        strictParsing: true
      });
    } catch (error) {
      errorThrown = true;
      assert(error instanceof Error);
      assert.equal((error as Error).name, 'PrettierFormattingError');
    }
    assert(errorThrown, 'Expected PrettierFormattingError to be thrown');
  });
});

