import * as fs from 'fs';
import * as path from 'path';
import {
  formatSourceCode,
  formatTsx,
  formatTypeScript,
  inferLanguageFromFilePath,
  PrettierFormattingError
} from '../../../libs/prettier_formatter';

const FIXTURES_ROOT = path.resolve(__dirname, 'fixtures');

function loadFixture(...segments: string[]): string {
  const filePath = path.join(FIXTURES_ROOT, ...segments);
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Prettier formatter', () => {
  it('formats TypeScript code according to the bundled config', async () => {
    const source = loadFixture('typescript', 'input.ts');
    const formatted = await formatTypeScript(source);

    expect(formatted).toBe(loadFixture('typescript', 'output.ts'));
  });

  it('formats TSX code preserving JSX structure', async () => {
    const source = loadFixture('tsx', 'input.tsx');
    const formatted = await formatTsx(source);

    expect(formatted).toBe(loadFixture('tsx', 'output.tsx'));
  });

  it('allows manual language inference from file path', () => {
    expect(inferLanguageFromFilePath('/tmp/file.ts')).toBe('ts');
    expect(inferLanguageFromFilePath('/tmp/file.tsx')).toBe('tsx');
  });

  it('throws descriptive error for unsupported extensions', () => {
    expect(() => inferLanguageFromFilePath('/tmp/file.ets')).toThrow(PrettierFormattingError);
  });

  it('provides a generic formatting entry point', async () => {
    const formatted = await formatSourceCode({
      code: loadFixture('generic', 'input.ts'),
      language: 'ts'
    });

    expect(formatted).toBe(loadFixture('generic', 'output.ts'));
  });

  it('preserves source on parse error unless strict parsing requested', async () => {
    const source = 'setGridOptionsAttribute(scroller?: Scroller): void {}';
    let capturedError: PrettierFormattingError | null = null;

    const formatted = await formatSourceCode({
      code: source,
      language: 'ts',
      onFormattingError: (error) => {
        capturedError = error;
      }
    });

    expect(formatted).toBe(source);
    expect(capturedError).toBeInstanceOf(PrettierFormattingError);

    await expect(
      formatSourceCode({
        code: source,
        language: 'ts',
        strictParsing: true
      })
    ).rejects.toThrow(PrettierFormattingError);
  });
});
