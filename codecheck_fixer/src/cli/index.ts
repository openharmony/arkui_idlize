#!/usr/bin/env node

/**
 * CLI обертка для CodeCheck Fixer
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Orchestrator } from '../core/orchestrator';
import { FixCoordinator } from '../core/coordinator';
import { ProjectConfig, AnalysisConfig, FormatterConfig, PathsForCheckByType } from '../types';
import { execFileSync, spawnSync } from 'child_process';
import { generateSummaryMd, writeSummary } from '../reporting/summary';

const program = new Command();

type CliPathOverrides = {
  repoPath?: string;
  paths?: string[];
  pathsByType?: PathsForCheckByType;
};

const collectList = (value: string, previous: string[]) => {
  const parts = value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return previous.concat(parts);
};

const normalizePaths = (paths?: string[]) =>
  Array.from(new Set((paths || []).filter(Boolean)));

const hasAnyPaths = (byType?: PathsForCheckByType): boolean =>
  !!byType && Object.values(byType).some(v => Array.isArray(v) && v.length > 0);

const flattenByType = (byType?: PathsForCheckByType): string[] => {
  if (!byType) return [];
  return Object.values(byType)
    .flat()
    .filter((v): v is string => typeof v === 'string');
};

function buildPathsByTypeFromOptions(options: any): PathsForCheckByType | undefined {
  const next: PathsForCheckByType = {};
  if (options.ts && options.ts.length > 0) next.ts = normalizePaths(options.ts);
  if (options.ets && options.ets.length > 0) next.ets = normalizePaths(options.ets);
  if (options.cpp && options.cpp.length > 0) next.cpp = normalizePaths(options.cpp);
  return hasAnyPaths(next) ? next : undefined;
}

function buildPathOverrides(options: any): CliPathOverrides {
  const pathsByType = buildPathsByTypeFromOptions(options);
  const base: CliPathOverrides = {
    repoPath: options.repo,
    paths: normalizePaths(options.paths),
  };
  return pathsByType ? { ...base, pathsByType } : base;
}

function pickSourcePaths(config: ProjectConfig, allowedTypes?: string[]): string[] {
  const byType = config.pathsForCheckByType || {};
  let selected: string[] = [];

  if (allowedTypes && allowedTypes.length > 0) {
    for (const t of allowedTypes) {
      const value = (byType as any)[t];
      if (Array.isArray(value)) {
        selected.push(...value);
      }
    }
  } else if (hasAnyPaths(byType)) {
    selected = flattenByType(byType);
  }

  if (selected.length === 0) {
    selected.push(...(config.pathsForCheck || []));
  }

  return Array.from(new Set(selected));
}

function buildPatternsFromPaths(paths: string[], repoPath: string, globTail: string): string[] {
  const patterns: string[] = [];

  for (const raw of paths) {
    const resolvedPath = path.isAbsolute(raw) ? raw : path.resolve(repoPath, raw);
    const relativeBase = path.relative(repoPath, resolvedPath) || '.';
    const outsideRepo = relativeBase.startsWith('..');
    const exists = fs.existsSync(resolvedPath);
    const stat = exists ? fs.statSync(resolvedPath) : undefined;
    const isDir = stat?.isDirectory();

    if (isDir) {
      const base = outsideRepo ? resolvedPath : relativeBase;
      patterns.push(path.join(base, globTail));
      continue;
    }

    // если путь указывает на файл или ещё не существует — используем как есть
    patterns.push(outsideRepo ? resolvedPath : relativeBase);
  }

  return Array.from(new Set(patterns));
}

function attachPathOptions(cmd: Command): Command {
  return cmd
    .option('--repo <path>', 'Root repository path used as glob base (cwd)')
    .option('--paths <paths...>', 'Un-typed file/dir paths (comma or space separated)', collectList, [])
    .option('--ts <paths...>', 'TypeScript/TSX paths (comma or space separated)', collectList, [])
    .option('--ets <paths...>', 'ETS paths (comma or space separated)', collectList, [])
    .option('--cpp <paths...>', 'C/C++ paths (comma or space separated)', collectList, []);
}

program
  .name('codecheck-fixer')
  .description('A library for static analysis and automated formatting of TypeScript and C++ code')
  .version('1.0.0');

attachPathOptions(
  program
  .command('analyze')
)
  .description('Analyze code files for issues')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Output file for analysis results')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Quiet mode')
  .option('--line-length <number>', 'Maximum line length (default: 120)')
  .option('--ignore-urls', 'Ignore URLs in line length check')
  .option('--ignore-strings', 'Ignore string literals in line length check')
  .option('--ignore-comments', 'Ignore comments in line length check')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config, buildPathOverrides(options));
      const sourcePaths = pickSourcePaths(config, ['ts', 'ets', 'cpp']);

      const patterns = buildPatternsFromPaths(
        sourcePaths,
        config.repoPath,
        '**/*.{ts,tsx,ets,cpp,cc,cxx,c++,hpp,h}'
      );

      if (patterns.length === 0) {
        console.error(chalk.red('Error: no input paths provided. Use --ts/--ets/--cpp/--paths.'));
        process.exit(1);
      }

      const orchestrator = new Orchestrator(config);
      
      const spinner = ora('Analyzing files...').start();
      
      const results = await orchestrator.analyzeProject({
        config: options.config,
        output: options.output,
        format: false,
        fix: false,
        verbose: options.verbose,
        quiet: options.quiet,
        paths: patterns,
      });
      
      spinner.succeed(`Analysis complete. Found ${results.length} files with issues.`);
      
      if (options.output) {
        const report = orchestrator.generateReport(results);
        const outDir = path.dirname(options.output);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(options.output, report);
      } else {
      }
      
    } catch (error) {
      console.error(chalk.red('Error during analysis:'), error);
      process.exit(1);
    }
  });

attachPathOptions(
  program
  .command('format')
)
  .description('Format code files')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Output directory for formatted files')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Quiet mode')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config, buildPathOverrides(options));
      const sourcePaths = pickSourcePaths(config, ['ts', 'ets', 'cpp']);

      const patterns = buildPatternsFromPaths(
        sourcePaths,
        config.repoPath,
        '**/*.{ts,tsx,ets,cpp,cc,cxx,c++,hpp,h}'
      );

      if (patterns.length === 0) {
        console.error(chalk.red('Error: no input paths provided. Use --ts/--ets/--cpp/--paths.'));
        process.exit(1);
      }
      const orchestrator = new Orchestrator(config);
      
      const spinner = ora('Formatting files...').start();
      
      // Сначала анализируем файлы
      const results = await orchestrator.analyzeProject({
        config: options.config,
        output: options.output,
        format: true,
        fix: false,
        verbose: options.verbose,
        quiet: options.quiet,
        paths: patterns,
      });
      
      // Получаем список файлов для форматирования
      const filesToFormat = results
        .map(result => result.filePath)
        .filter((p): p is string => !!p);
      
      // Определяем выходную директорию
      const outputDir = options.output || './formatted';
      
      // Форматируем файлы в выходную директорию
      await orchestrator.formatFiles(filesToFormat, outputDir);
      
      spinner.succeed(`Formatted ${filesToFormat.length} files.`);
      
    } catch (error) {
      console.error(chalk.red('Error during formatting:'), error);
      process.exit(1);
    }
  });

attachPathOptions(
  program
  .command('line-length')
)
  .description('Check and fix long lines in TypeScript files')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Output directory for fixed files', './out/fixed')
  .option('-r, --report <path>', 'Output file for analysis results')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Quiet mode')
  .option('-l, --max-length <number>', 'Maximum line length (default: 120)')
  .option('--ignore-urls', 'Ignore URLs in line length check')
  .option('--ignore-strings', 'Ignore string literals in line length check')
  .option('--ignore-comments', 'Ignore comments in line length check')
  .option('--ignore-templates', 'Ignore template literals in line length check')
  .option('--fix', 'Automatically fix long lines')
  .option('--dry-run', 'Only show issues without fixing (default)')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config, buildPathOverrides(options));
      const sourcePaths = pickSourcePaths(config, ['ts', 'ets']);

      const patterns = buildPatternsFromPaths(
        sourcePaths,
        config.repoPath,
        '**/*.{ts,ets}'
      );

      if (options.verbose) {
      }

      if (patterns.length === 0) {
        console.error(chalk.red('Error: no input paths provided. Use --ts/--ets/--paths.'));
        process.exit(1);
      }
      
      const allFiles = await glob(patterns, { absolute: true, nodir: true, cwd: config.repoPath });

      console.log(`Найдено файлов по паттернам: ${allFiles.length}`);
      if (options.verbose) {
        console.log(`Паттерны поиска: ${patterns.join(', ')}`);
      }

      if (allFiles.length === 0) {
        console.error(chalk.yellow('No files matched the provided paths. Diagnostics:'));
        for (const p of sourcePaths) {
          const resolvedPath = path.isAbsolute(p) ? p : path.resolve(config.repoPath, p);
          if (!fs.existsSync(resolvedPath)) {
            console.error(chalk.red(`- ${p} -> [NOT FOUND] ${resolvedPath}`));
            continue;
          }
          const stat = fs.statSync(resolvedPath);
          if (stat.isDirectory()) {
            const matches = await glob('**/*.{ts,ets}', { cwd: resolvedPath, nodir: true });
            if (matches.length === 0) {
              console.error(chalk.yellow(`- ${p} -> [NO MATCH] ${resolvedPath} for **/*.{ts,ets}`));
            } else {
              console.error(chalk.yellow(`- ${p} -> [MATCHES NOT UNDER repo?] ${resolvedPath}`));
            }
          } else {
            const ext = path.extname(resolvedPath).toLowerCase();
            if (!['.ts', '.tsx', '.ets'].includes(ext)) {
              console.error(chalk.yellow(`- ${p} -> [UNSUPPORTED EXT] ${ext}`));
            } else {
              console.error(chalk.yellow(`- ${p} -> [FILE NOT GLOB-RESOLVED] ${resolvedPath}`));
            }
          }
        }
        return;
      }
        
      const orchestrator = new Orchestrator(config);
      
      const lineLengthConfig = {
        maxLineLength: parseInt(options.maxLength, 10) || config.formatting.maxLineLength || 120,
        ignoreUrls: options.ignoreUrls || false,
        ignoreStrings: options.ignoreStrings || false,
        ignoreComments: options.ignoreComments || false,
        ignoreTemplateLiterals: options.ignoreTemplates || false,
      };

      // Для dry-run по умолчанию сохраняем отчёт, если путь не задан
      const defaultReport = (!options.fix && !options.report) ? path.join('out', 'line-length-report.md') : undefined;
      if (defaultReport) {
        options.report = defaultReport;
      }

      console.log(`Запуск обработки файлов (режим: ${options.fix ? 'исправление' : 'анализ'})...`);
      const spinner = ora({
        text: 'Инициализация обработки файлов...',
        spinner: 'dots'
      }).start();
      
      const coordinator = new FixCoordinator(orchestrator, allFiles, {
        fix: !!options.fix,
        outputDir: options.output,
        repoPath: config.repoPath,
        lineLengthConfig: lineLengthConfig,
        reportPath: options.report,
        writeFixLog: false
      });

      spinner.stop(); // Останавливаем спиннер перед выводом прогресса
      await coordinator.run();
      // Автоматический запуск cpp-format, если в конфиге есть секция cpp
      const hasCpp = Array.isArray((config as any).pathsForCheckByType?.cpp) && (config as any).pathsForCheckByType.cpp.length > 0;
      let cppFormatted = 0;
      let cppBaselineLong = 0;
      let cppRemainingLong = 0;
      const cppRemainingRows: Array<{file: string; line: number; length: number}> = [];
      if (hasCpp && options.fix) {
        try {
          const ohosDir = process.env['OHOS_DIR'] || config.repoPath;
          const candidate = path.resolve(ohosDir, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
          const clangFormat = fs.existsSync(candidate) ? candidate : 'clang-format';
          const cppPaths = (config as any).pathsForCheckByType.cpp as string[];
          const exts = '{cpp,cc,cxx,c++,hpp,h}';
          const patterns = cppPaths.map(p => path.join(config.repoPath, p, `**/*.${exts}`));
          const files = await glob(patterns, { absolute: true, nodir: true });
          const cppFiles = files.filter(f => /\.(?:cpp|cc|cxx|c\+\+|hpp|h)$/i.test(f));
          const outputDirForCpp = options.output || path.join('out','fixed');
          const cppLogPath = path.join(outputDirForCpp, 'cpp-format.log');
          fs.mkdirSync(outputDirForCpp, { recursive: true });
          try { fs.writeFileSync(cppLogPath, `clang-format run at ${new Date().toISOString()}\n`); } catch {}
          for (const file of cppFiles) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              // Базовый подсчет длинных строк в исходнике
              const extLower = path.extname(file).toLowerCase();
              const isHeader = extLower === '.h' || extLower === '.hpp';
              if (!isHeader) {
                content.split('\n').forEach((ln) => {
                  if (ln.length > lineLengthConfig.maxLineLength) {
                    cppBaselineLong++;
                  }
                });
              }
              const res = spawnSync(
                clangFormat,
                ['-style=file', `-assume-filename=${file}`],
                { cwd: config.repoPath, input: content, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 100 }
              );
              if (res.error) {
                const details = [
                  `[FAIL] ${file}`,
                  `error: ${res.error?.message || res.error}`,
                  `status: ${res.status}`,
                  res.stderr ? `stderr: ${String(res.stderr).slice(0, 4000)}` : ''
                ].filter(Boolean).join('\n') + '\n';
                try { fs.appendFileSync(cppLogPath, details); } catch {}
                if (options.verbose) {
                  console.error(chalk.red(`Failed to format ${file}. See cpp-format.log for details.`));
                }
                continue;
              }
              // Лог stderr даже при успешном выполнении
              if (res.stderr && res.stderr.length > 0) {
                const warn = [`[STDERR] ${file}`, String(res.stderr).slice(0, 4000)].join('\n') + '\n';
                try { fs.appendFileSync(cppLogPath, warn); } catch {}
              }
              const formatted = res.stdout as string;
              const rel = path.relative(config.repoPath, file);
              const outPath = path.join(options.output || path.join('out','fixed'), rel);
              fs.mkdirSync(path.dirname(outPath), { recursive: true });
              fs.writeFileSync(outPath, formatted, 'utf-8');
              cppFormatted++;
              // Подсчет остатка длинных строк после форматирования
              const outExtLower = path.extname(outPath).toLowerCase();
              const outIsHeader = outExtLower === '.h' || outExtLower === '.hpp';
              if (!outIsHeader) {
                formatted.split('\n').forEach((ln, idx) => {
                  if (ln.length > lineLengthConfig.maxLineLength) {
                    cppRemainingLong++;
                    cppRemainingRows.push({ file: outPath, line: idx + 1, length: ln.length });
                  }
                });
              }
              try { fs.appendFileSync(cppLogPath, `[OK] ${file} -> ${outPath}\n`); } catch {}
            } catch (err: any) {
              const details = [
                `[FAIL] ${file}`,
                err?.message ? `message: ${err.message}` : '',
                err?.status !== undefined ? `status: ${err.status}` : '',
                err?.signal ? `signal: ${err.signal}` : '',
                err?.stderr ? `stderr: ${String(err.stderr).slice(0, 4000)}` : ''
              ].filter(Boolean).join('\n') + '\n';
              try { fs.appendFileSync(cppLogPath, details); } catch {}
              if (options.verbose) {
                console.error(chalk.red(`Failed to format ${file}. See cpp-format.log for details.`));
              }
            }
          }
        } catch (err) {
          if (options.verbose) {
            console.error(chalk.red('cpp-format auto-run failed:'), err);
          }
        }
      }

      // Генерация Markdown-отчёта с метриками до/после
      const outputDir = options.output || path.join('out','fixed');
      const analysis = coordinator.getAnalysisResults();
      const changes = coordinator.getChangeLog();

      // Пост-скан отформатированных TS/ETS файлов для точного остатка
      let tsRemainingCount = 0;
      let tsBaselineCount = 0;
      let tsFilesWithIssuesBeforeCount = 0;
      const tsRemainingRows: Array<{file: string; line: number; message: string}> = [];
      const maxLen = (lineLengthConfig.maxLineLength as number) || 120;
      const byType = (config as any).pathsForCheckByType || {};
      const scanExts: string[] = [];
      if (Array.isArray(byType.ts) && byType.ts.length > 0) { scanExts.push('.ts', '.tsx'); }
      if (Array.isArray(byType.ets) && byType.ets.length > 0) { scanExts.push('.ets'); }
      for (const r of analysis) {
        const issues = r.issues.filter(i => i.rule === 'line-length');
        if (issues.length > 0) tsFilesWithIssuesBeforeCount++;
        tsBaselineCount += issues.length;
        // Просканируем соответствующий выходной файл, если он был записан
        if (!r.filePath) { continue; }
        const rel = path.relative(config.repoPath, r.filePath);
        const outPath = path.join(outputDir, rel);
        const targetPath = fs.existsSync(outPath) ? outPath : r.filePath;
        if (scanExts.includes(path.extname(targetPath).toLowerCase()) && fs.existsSync(targetPath)) {
          const content = fs.readFileSync(targetPath, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((ln, idx) => {
            if (ln.length > maxLen) {
              tsRemainingCount++;
              tsRemainingRows.push({ file: targetPath, line: idx + 1, message: `TS/ETS line length ${ln.length}` });
            }
          });
        }
      }

      // Общее количество обработанных файлов = TS/ETS + C++
      const filesProcessed = allFiles.length + (hasCpp ? cppFormatted : 0);

      const md = generateSummaryMd({
        outputDir,
        filesProcessed,
        analysis,
        changes,
        hasCpp,
        cppFormatted,
        cppBaselineLong,
        cppRemainingLong,
        cppRemainingRows,
        tsBaselineCount,
        tsRemainingCount,
        tsRemainingRows,
        tsFilesWithIssuesBeforeCount,
      });
      writeSummary(outputDir, md);
      
    } catch (error) {
      console.error(chalk.red('Error during line length check:'), error);
      process.exit(1);
    }
  });

attachPathOptions(
  program
  .command('cpp-format')
)
  .description('Format C/C++ files using clang-format based on config paths')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Output directory for formatted files (writes in-place if omitted)')
  .option('--clang-format <path>', 'Path to clang-format binary')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config, buildPathOverrides(options));
      const cppPaths = pickSourcePaths(config, ['cpp']);
      if (!cppPaths || cppPaths.length === 0) {
        console.error(chalk.red('Error: no cpp paths provided. Use --cpp.'));
        process.exit(1);
      }

      const patterns = buildPatternsFromPaths(
        cppPaths,
        config.repoPath,
        '**/*.{cpp,cc,cxx,c++,hpp,h}'
      );

      if (patterns.length === 0) {
        console.error(chalk.red('Error: no patterns resolved for cpp paths'));
        process.exit(1);
      }

      const files = await glob(patterns, { absolute: true, nodir: true, cwd: config.repoPath });
      const cppFiles = files.filter(f => /\.(?:cpp|cc|cxx|c\+\+|hpp|h)$/i.test(f));
      if (options.verbose) {
      }
      if (cppFiles.length === 0) {
        console.error(chalk.yellow('No C/C++ files matched the provided paths.'));
        return;
      }

      // Determine clang-format path
      let clangFormat = options.clangFormat as string | undefined;
      if (!clangFormat) {
        const ohosDir = process.env['OHOS_DIR'] || config.repoPath;
        const candidate = path.resolve(ohosDir, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
        clangFormat = fs.existsSync(candidate) ? candidate : 'clang-format';
      }
      if (options.verbose) {
      }

      const outDir = options.output as string | undefined;
      const writeFormatted = (file: string, formatted: string) => {
        if (outDir) {
          const rel = path.relative(config.repoPath, file);
          const outPath = path.join(outDir, rel);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, formatted, 'utf-8');
        } else {
          // Если outDir не указан, по требованиям проекта исходники не должны изменяться
          // Поэтому по умолчанию пишем рядом во временную структуру under ./out/fixed
          const rel = path.relative(config.repoPath, file);
          const outPath = path.join('out', 'fixed', rel);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, formatted, 'utf-8');
        }
      };

      for (const file of cppFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const formatted = execFileSync(
            clangFormat,
            ['-style=file', `-assume-filename=${file}`],
            { cwd: config.repoPath, encoding: 'utf-8', input: content }
          );
          writeFormatted(file, formatted);
        } catch (err) {
          console.error(chalk.red(`Failed to format ${file}:`), err);
        }
      }

      outDir || path.join('out', 'fixed');
    } catch (error) {
      console.error(chalk.red('Error during cpp-format:'), error);
      process.exit(1);
    }
  });

attachPathOptions(
  program
  .command('fix')
)
  .description('Analyze and automatically fix issues where possible')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <path>', 'Output directory for fixed files', './out/fixed')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Quiet mode')
  .action(async (options: any) => {
    try {
      const config = await loadConfig(options.config, buildPathOverrides(options));
      const sourcePaths = pickSourcePaths(config, ['ts', 'ets']);

      const patterns = buildPatternsFromPaths(
        sourcePaths,
        config.repoPath,
        '**/*.{ts,ets}'
      );

      if (patterns.length === 0) {
        console.error(chalk.red('Error: no input paths provided. Use --ts/--ets/--paths.'));
        process.exit(1);
      }
      const orchestrator = new Orchestrator(config);
      
      const spinner = ora('Analyzing and fixing files...').start();
      
      // Создаем временную конфигурацию для line-length, т.к. fix теперь синоним
      const lineLengthConfig = {
        maxLineLength: config.formatting.maxLineLength || 120,
        ignoreUrls: false,
        ignoreStrings: false,
        ignoreComments: false,
        ignoreTemplateLiterals: false,
      };

      const allFiles = await glob(patterns, { absolute: true, nodir: true, cwd: config.repoPath });
      const coordinator = new FixCoordinator(orchestrator, allFiles, {
        fix: true,
        outputDir: options.output,
        repoPath: config.repoPath,
        lineLengthConfig: lineLengthConfig
      });

      await coordinator.run();
      
      spinner.succeed('Fixing process complete.');
      
    } catch (error) {
      console.error(chalk.red('Error during fixing:'), error);
      process.exit(1);
    }
  });

async function loadConfig(configPath?: string, overrides?: CliPathOverrides): Promise<ProjectConfig> {
  let configData: any = {};
  
  if (configPath && fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    configData = JSON.parse(configContent);
  } else if (fs.existsSync('config.json')) {
    const configContent = fs.readFileSync('config.json', 'utf-8');
    configData = JSON.parse(configContent);
  }
  
  // Создаем конфигурацию по умолчанию
  const defaultAnalysisConfig: AnalysisConfig = {
    /** правила анализа, сейчас не используется. На выбор правил не влияет. */
    rules: [
      { name: 'syntax_errors', enabled: true, severity: 'error' as any },
      { name: 'type_errors', enabled: true, severity: 'error' as any },
      { name: 'style_violations', enabled: true, severity: 'warning' as any },
      { name: 'best_practices', enabled: true, severity: 'warning' as any }
    ],
    /** включаем файлы для анализа, сейчас не используется. На выбор файлов не влияет. */
    includePatterns: ['**/*.ts', '**/*.tsx', '**/*.cpp', '**/*.hpp'],
    /** исключаем директории для анализа
     * используется в Orchestrator.shouldAnalyzeFile для отбрасывания путей по подстроке;
     * исключает файлы, чьи пути содержат указанные фрагменты (не glob-матчинг).
     */
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
    /** 1MB максимальный размер файла для анализа */
    maxFileSize: 1024 * 1024,
    /** 30 seconds таймаут для анализа файла, пока не используется/не применяется */
    timeout: 30000
  };
  
  const defaultFormatterConfig: FormatterConfig = {
    tabSize: 4,
    useTabs: false,
    quoteStyle: 'single',
    semicolons: true,
    trailingCommas: true,
    maxLineLength: 120
  };
  
  const byTypeFromConfig = parsePathsForCheck(configData.paths_for_check);
  const byTypeFromCli = overrides?.pathsByType && hasAnyPaths(overrides.pathsByType)
    ? overrides.pathsByType
    : undefined;
  const effectiveByType = byTypeFromCli || byTypeFromConfig;

  const flatFromConfig = effectiveByType ? flattenByType(effectiveByType) : [];
  const flatFromCli = normalizePaths(overrides?.paths);
  const normalizedPaths: string[] = flatFromCli.length > 0 ? flatFromCli : flatFromConfig;

  const repoPath = overrides?.repoPath || configData.repo_path || configData.repoPath || process.cwd();
  if (normalizedPaths.length === 0) {
    throw new Error('No input paths provided. Use CLI flags (--ts/--ets/--cpp/--paths) or specify paths_for_check in config.json (deprecated).');
  }

  const baseConfig = {
    description: configData.description || 'CodeCheck Fixer Project',
    repoPath,
    pathsForCheck: normalizedPaths,
    analysis: { ...defaultAnalysisConfig, ...configData.analysis },
    formatting: { ...defaultFormatterConfig, ...mapFormattingConfig(configData.formatting) }
  } as ProjectConfig;

  if (effectiveByType && hasAnyPaths(effectiveByType)) {
    (baseConfig as any).pathsForCheckByType = effectiveByType;
  }

  return baseConfig;
}

function parsePathsForCheck(pathsForCheck: any): PathsForCheckByType | undefined {
  if (pathsForCheck === undefined) {
    return undefined;
  }
  if (typeof pathsForCheck !== 'object' || Array.isArray(pathsForCheck)) {
    throw new Error('Invalid config: "paths_for_check" must be an object grouped by file types (e.g., { "ts": ["..."], "ets": ["..."], "cpp": ["..."] }).');
  }

  const byType: PathsForCheckByType = pathsForCheck as PathsForCheckByType;
  for (const [key, value] of Object.entries(byType)) {
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error(`Invalid config: paths_for_check.${key} must be an array of paths`);
    }
  }

  return byType;
}

function mapFormattingConfig(userFmt: any | undefined): Partial<FormatterConfig> {
  if (!userFmt) return {};
  const mapped: any = { ...userFmt };
  // backward compatibility: indentSize -> tabSize
  if (mapped.indentSize !== undefined && mapped.tabSize === undefined) {
    mapped.tabSize = mapped.indentSize;
  }
  delete mapped.indentSize;
  return mapped;
}

// Обработка ошибок
process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});
// Точка входа в программу
program.parse();
