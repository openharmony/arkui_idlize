import { assert, suite, test } from '@koalaui/harness';
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/orchestrator';
import type { ProjectConfig } from '../src/types/index';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const INPUT_DIR = path.join(FIXTURES_DIR, 'input');
const EXPECTED_DIR = path.join(FIXTURES_DIR, 'expected');
const OUTPUT_DIR = path.join(FIXTURES_DIR, 'output');

interface TestFile {
  name: string;
  inputPath: string;
  expectedPath: string;
  outputPath: string;
  type: 'ts' | 'ets' | 'cpp';
}

/**
 * Создает минимальную конфигурацию для тестов форматирования
 */
function createTestConfig(): ProjectConfig {
  return {
    description: 'Format fixtures test',
    repoPath: path.resolve(__dirname, '..'),
    pathsForCheck: [],
    pathsForCheckByType: {
      ts: [],
      ets: [],
      cpp: []
    },
    analysis: {
      rules: [],
      includePatterns: ['**/*.ts', '**/*.ets', '**/*.cpp'],
      excludePatterns: ['node_modules/**'],
      maxFileSize: 1024 * 1024,
      timeout: 30000
    },
    formatting: {
      tabSize: 2,
      useTabs: false,
      quoteStyle: 'single',
      semicolons: true,
      trailingCommas: false,
      maxLineLength: 120
    }
  };
}

/**
 * Собирает список тестовых файлов для указанного типа
 */
function collectTestFiles(type: 'ts' | 'ets' | 'cpp'): TestFile[] {
  const files: TestFile[] = [];
  const inputSubdir = path.join(INPUT_DIR, type);
  const expectedSubdir = path.join(EXPECTED_DIR, type);
  const outputSubdir = path.join(OUTPUT_DIR, type);

  if (!fs.existsSync(inputSubdir)) {
    return files;
  }

  const entries = fs.readdirSync(inputSubdir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(`.${type}`)) {
      files.push({
        name: entry.name,
        inputPath: path.join(inputSubdir, entry.name),
        expectedPath: path.join(expectedSubdir, entry.name),
        outputPath: path.join(outputSubdir, entry.name),
        type
      });
    }
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Создает output директории если их нет
 */
function ensureOutputDirs() {
  for (const type of ['ts', 'ets', 'cpp']) {
    const dir = path.join(OUTPUT_DIR, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Очищает output директорию перед тестами
 */
function cleanOutputDir() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
}

suite('Format Fixtures — Input → Output → Expected comparison', () => {
  // Подготовка: очищаем и создаем output директории
  cleanOutputDir();
  ensureOutputDirs();
  
  // Создаем Orchestrator
  const config = createTestConfig();
  const orchestrator = new Orchestrator(config);

  // Тесты для TypeScript файлов
  const tsFiles = collectTestFiles('ts');
  if (tsFiles.length > 0) {
    suite('TypeScript files', () => {
      for (const file of tsFiles) {
        test(`should format ${file.name} correctly`, async () => {
          // Читаем входной файл
          const input = fs.readFileSync(file.inputPath, 'utf-8');
          
          // Форматируем
          const formatted = await orchestrator.formatFile(file.inputPath, input);
          
          // Сохраняем в output
          fs.writeFileSync(file.outputPath, formatted, 'utf-8');
          
          // Проверяем существование expected
          if (!fs.existsSync(file.expectedPath)) {
            console.log(`\n⚠️  Expected file not found: ${file.expectedPath}`);
            console.log(`   Output saved to: ${file.outputPath}`);
            console.log(`   Please review and copy output to expected if correct.\n`);
            // Не падаем, просто предупреждаем
            return;
          }
          
          // Читаем expected
          const expected = fs.readFileSync(file.expectedPath, 'utf-8');
          
          // Сравниваем
          if (formatted !== expected) {
            const outputRel = path.relative(process.cwd(), file.outputPath);
            const expectedRel = path.relative(process.cwd(), file.expectedPath);
            console.log(`\n❌ Formatting mismatch for ${file.name}`);
            console.log(`   Output:   ${outputRel}`);
            console.log(`   Expected: ${expectedRel}`);
            console.log(`   Run: diff ${outputRel} ${expectedRel}\n`);
          }
          
          assert.equal(formatted, expected, 
            `Formatted output does not match expected for ${file.name}`);
        });
      }
    });
  }

  // Тесты для ETS файлов
  const etsFiles = collectTestFiles('ets');
  if (etsFiles.length > 0) {
    suite('ArkTS/ETS files', () => {
      for (const file of etsFiles) {
        test(`should format ${file.name} correctly`, async () => {
          const input = fs.readFileSync(file.inputPath, 'utf-8');
          const formatted = await orchestrator.formatFile(file.inputPath, input);
          fs.writeFileSync(file.outputPath, formatted, 'utf-8');
          
          if (!fs.existsSync(file.expectedPath)) {
            console.log(`\n⚠️  Expected file not found: ${file.expectedPath}`);
            console.log(`   Output saved to: ${file.outputPath}`);
            console.log(`   Please review and copy output to expected if correct.\n`);
            return;
          }
          
          const expected = fs.readFileSync(file.expectedPath, 'utf-8');
          
          if (formatted !== expected) {
            const outputRel = path.relative(process.cwd(), file.outputPath);
            const expectedRel = path.relative(process.cwd(), file.expectedPath);
            console.log(`\n❌ Formatting mismatch for ${file.name}`);
            console.log(`   Output:   ${outputRel}`);
            console.log(`   Expected: ${expectedRel}`);
            console.log(`   Run: diff ${outputRel} ${expectedRel}\n`);
          }
          
          assert.equal(formatted, expected,
            `Formatted output does not match expected for ${file.name}`);
        });
      }
    });
  }

  // Тесты для C++ файлов
  const cppFiles = collectTestFiles('cpp');
  if (cppFiles.length > 0) {
    suite('C/C++ files', () => {
      for (const file of cppFiles) {
        test(`should format ${file.name} correctly`, async () => {
          const input = fs.readFileSync(file.inputPath, 'utf-8');
          const formatted = await orchestrator.formatFile(file.inputPath, input);
          fs.writeFileSync(file.outputPath, formatted, 'utf-8');
          
          if (!fs.existsSync(file.expectedPath)) {
            console.log(`\n⚠️  Expected file not found: ${file.expectedPath}`);
            console.log(`   Output saved to: ${file.outputPath}`);
            console.log(`   Please review and copy output to expected if correct.\n`);
            return;
          }
          
          const expected = fs.readFileSync(file.expectedPath, 'utf-8');
          
          if (formatted !== expected) {
            const outputRel = path.relative(process.cwd(), file.outputPath);
            const expectedRel = path.relative(process.cwd(), file.expectedPath);
            console.log(`\n❌ Formatting mismatch for ${file.name}`);
            console.log(`   Output:   ${outputRel}`);
            console.log(`   Expected: ${expectedRel}`);
            console.log(`   Run: diff ${outputRel} ${expectedRel}\n`);
          }
          
          assert.equal(formatted, expected,
            `Formatted output does not match expected for ${file.name}`);
        });
      }
    });
  }
});

