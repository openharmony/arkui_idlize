#!/usr/bin/env node

/**
 * CLI wrapper for CodeCheck Fixer
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
import { spawnSync } from 'child_process';
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

    // if path points to a file or doesn't exist yet — use as is
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
  .version('0.10.0');

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
      
      // First analyze files
      const results = await orchestrator.analyzeProject({
        config: options.config,
        output: options.output,
        format: true,
        fix: false,
        verbose: options.verbose,
        quiet: options.quiet,
        paths: patterns,
      });
      
      // Get list of files for formatting
      const filesToFormat = results
        .map(result => result.filePath)
        .filter((p): p is string => !!p);
      
      // Determine output directory
      const outputDir = options.output || './formatted';
      
      // Format files to output directory
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

      console.log(`Found files by patterns: ${allFiles.length}`);
      if (options.verbose) {
        console.log(`Search patterns: ${patterns.join(', ')}`);
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

      // For dry-run save report by default if path not specified
      const defaultReport = (!options.fix && !options.report) ? path.join('out', 'line-length-report.md') : undefined;
      if (defaultReport) {
        options.report = defaultReport;
      }

      console.log(`Running file processing (mode: ${options.fix ? 'fix' : 'analyze'})...`);
      const spinner = ora({
        text: 'Initializing file processing...',
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

      spinner.stop(); // Stop spinner before progress output
      await coordinator.run();
      
      // Automatic execution of cpp-format if config has cpp section
      const hasCpp = Array.isArray((config as any).pathsForCheckByType?.cpp) && (config as any).pathsForCheckByType.cpp.length > 0;
      let cppFormatted = 0;
      let cppFailed = 0;
      let cppBaselineLong = 0;
      let cppRemainingLong = 0;
      const cppRemainingRows: Array<{file: string; line: number; length: number}> = [];
      
      if (hasCpp && options.fix) {
        console.log('\n' + chalk.cyan('Running C++ formatting...'));
        try {
          // Find clang-format with OHOS_DIR priority
          let clangFormat: string = '';
          const ohosDir = process.env['OHOS_DIR'];
          if (ohosDir) {
            const candidate = path.resolve(ohosDir, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
            if (fs.existsSync(candidate)) {
              clangFormat = candidate;
            }
          }
          
          if (!clangFormat) {
            const candidate = path.resolve(config.repoPath, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
            if (fs.existsSync(candidate)) {
              clangFormat = candidate;
            }
          }
          
          if (!clangFormat) {
            try {
              const result = spawnSync('which', ['clang-format'], { encoding: 'utf-8' });
              if (result.status === 0 && result.stdout.trim()) {
                clangFormat = result.stdout.trim();
              } else {
                const resultWin = spawnSync('where', ['clang-format'], { encoding: 'utf-8' });
                if (resultWin.status === 0 && resultWin.stdout.trim()) {
                  clangFormat = resultWin.stdout.trim().split('\n')[0] || 'clang-format';
                }
              }
            } catch {
              clangFormat = 'clang-format';
            }
          }
          
          if (!clangFormat) {
            clangFormat = 'clang-format';
          }
          
          // Check clang-format availability
          const testResult = spawnSync(clangFormat, ['--version'], { encoding: 'utf-8' });
          if (testResult.error || testResult.status !== 0) {
            console.error(chalk.yellow('⚠ clang-format unavailable, skipping C++ formatting'));
            if (options.verbose) {
              console.error(chalk.yellow(`  Path: ${clangFormat}`));
            }
          } else {
            if (options.verbose) {
              console.log(`Using clang-format: ${clangFormat}`);
              if (testResult.stdout) {
                console.log(`Version: ${testResult.stdout.trim()}`);
              }
            }

            const clangFormatConfigPath = resolveUtilityClangFormatConfigPath();
            const clangFormatStyleArg = buildClangFormatStyleArg(clangFormatConfigPath);
            if (options.verbose) {
              console.log(`Using tool .clang-format: ${clangFormatConfigPath}`);
            }
            
            const cppPaths = (config as any).pathsForCheckByType.cpp as string[];
            const exts = '{cpp,cc,cxx,c++,hpp,h}';
            const patterns = cppPaths.map(p => {
              const resolvedPath = path.resolve(config.repoPath, p);
              const relativeBase = path.relative(config.repoPath, resolvedPath) || '.';
              if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                return path.join(relativeBase, `**/*.${exts}`);
              }
              return relativeBase;
            });
            
            const files = await glob(patterns, { absolute: true, nodir: true, cwd: config.repoPath });
            const cppFiles = files.filter(f => /\.(?:cpp|cc|cxx|c\+\+|hpp|h)$/i.test(f));
            
            if (cppFiles.length === 0) {
              console.log(chalk.yellow('No C++ files found for formatting'));
            } else {
              const outputDirForCpp = options.output || path.join('out','fixed');
              const cppLogPath = path.join(outputDirForCpp, 'cpp-format.log');
              fs.mkdirSync(outputDirForCpp, { recursive: true });
              fs.writeFileSync(cppLogPath, `clang-format run at ${new Date().toISOString()}\n`);
              
              for (let i = 0; i < cppFiles.length; i++) {
                const file = cppFiles[i];
                if (!file) continue;
                
                const displayPath = path.relative(config.repoPath, file);
                const coloredDisplayPath = (() => {
                  const match = displayPath.match(/^(.*[\\\/])([^\\\/]+)$/);
                  if (!match) return displayPath;
                  const [, dir, filename] = match;
                  return `\x1b[90m${dir}\x1b[0m${filename}`;
                })();
                
                try {
                  process.stdout.write(`[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} …`);
                  
                  const content = fs.readFileSync(file, 'utf-8');
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
                    [clangFormatStyleArg, `-assume-filename=${file}`],
                    { cwd: config.repoPath, input: content, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 100 }
                  );
                  
                  if (res.error) {
                    const errorMsg = res.error?.message || String(res.error);
                    const shortError = errorMsg.includes('ENOENT') 
                      ? 'clang-format not found'
                      : errorMsg.includes('EACCES')
                      ? 'no access permissions'
                      : errorMsg.length > 50 
                      ? errorMsg.substring(0, 47) + '...'
                      : errorMsg;
                    
                    const details = [
                      `[FAIL] ${file}`,
                      `error: ${errorMsg}`,
                      `status: ${res.status}`,
                      res.stderr ? `stderr: ${String(res.stderr).slice(0, 4000)}` : ''
                    ].filter(Boolean).join('\n') + '\n';
                    fs.appendFileSync(cppLogPath, details);
                    cppFailed++;
                    process.stdout.write(`\r[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} ${chalk.red(`✗ ${shortError}`)}\n`);
                    continue;
                  }
                  
                  if (res.stderr && res.stderr.length > 0) {
                    const warn = [`[STDERR] ${file}`, String(res.stderr).slice(0, 4000)].join('\n') + '\n';
                    fs.appendFileSync(cppLogPath, warn);
                  }
                  
                  const formatted = res.stdout as string;
                  const rel = path.relative(config.repoPath, file);
                  const outPath = path.join(outputDirForCpp, rel);
                  fs.mkdirSync(path.dirname(outPath), { recursive: true });
                  fs.writeFileSync(outPath, formatted, 'utf-8');
                  cppFormatted++;
                  
                  const outExtLower = path.extname(outPath).toLowerCase();
                  const outIsHeader = outExtLower === '.h' || outExtLower === '.hpp';
                  let remainingInFile = 0;
                  
                  if (!outIsHeader) {
                    formatted.split('\n').forEach((ln, idx) => {
                      if (ln.length > lineLengthConfig.maxLineLength) {
                        cppRemainingLong++;
                        remainingInFile++;
                        cppRemainingRows.push({ file: outPath, line: idx + 1, length: ln.length });
                      }
                    });
                  }
                  
                  fs.appendFileSync(cppLogPath, `[OK] ${file} -> ${outPath}\n`);
                  
                  const statusColor = remainingInFile > 0 ? chalk.yellow : chalk.green;
                  const statusText = remainingInFile > 0 ? `⚠ ${remainingInFile} long` : '✓';
                  process.stdout.write(`\r[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} ${statusColor(statusText)}\n`);
                  
                } catch (err: any) {
                  const errorMsg = err?.message || String(err);
                  const shortError = errorMsg.includes('ENOENT')
                    ? 'file not found'
                    : errorMsg.includes('EACCES')
                    ? 'no access permissions'
                    : errorMsg.includes('parse')
                    ? 'parsing error'
                    : errorMsg.length > 50
                    ? errorMsg.substring(0, 47) + '...'
                    : errorMsg;
                  
                  const details = [
                    `[FAIL] ${file}`,
                    err?.message ? `message: ${err.message}` : '',
                    err?.status !== undefined ? `status: ${err.status}` : '',
                    err?.signal ? `signal: ${err.signal}` : '',
                    err?.stderr ? `stderr: ${String(err.stderr).slice(0, 4000)}` : ''
                  ].filter(Boolean).join('\n') + '\n';
                  fs.appendFileSync(cppLogPath, details);
                  cppFailed++;
                  process.stdout.write(`\r[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} ${chalk.red(`✗ ${shortError}`)}\n`);
                }
              }
              
              console.log(chalk.green(`\n✓ C++ formatting complete: ${cppFormatted}/${cppFiles.length} files`));
              if (cppFailed > 0) {
                console.log(chalk.yellow(`  Errors: ${cppFailed}, see ${cppLogPath}`));
              }
            }
          }
        } catch (err) {
          console.error(chalk.red('Error during C++ formatting:'), err);
          if (options.verbose && err instanceof Error) {
            console.error(err.stack);
          }
        }
      }

      // Generate Markdown report with before/after metrics
      const outputDir = options.output || path.join('out','fixed');
      const analysis = coordinator.getAnalysisResults();
      const changes = coordinator.getChangeLog();

      // Post-scan formatted TS/ETS files for accurate remaining count
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
        // Scan corresponding output file if it was written
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

      // Total processed files = TS/ETS + C++
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
  .option('-o, --output <path>', 'Output directory for formatted files', './out/fixed')
  .option('-l, --max-length <number>', 'Maximum line length for statistics (default: 120)')
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
      
      console.log(`Found C++ files: ${cppFiles.length}`);
      
      if (cppFiles.length === 0) {
        console.error(chalk.yellow('No C/C++ files matched the provided paths.'));
        return;
      }

      // Determine clang-format path
      let clangFormat: string = options.clangFormat as string | undefined || '';
      
      if (!clangFormat) {
        // 1. Check OHOS_DIR (if set)
        const ohosDir = process.env['OHOS_DIR'];
        if (ohosDir) {
          const candidate = path.resolve(ohosDir, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
          if (fs.existsSync(candidate)) {
            clangFormat = candidate;
          }
        }
        
        // 2. Check in repoPath (standard OHOS SDK location)
        if (!clangFormat) {
          const candidate = path.resolve(config.repoPath, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
          if (fs.existsSync(candidate)) {
            clangFormat = candidate;
          }
        }
        
        // 3. Check in system PATH
        if (!clangFormat) {
          try {
            const result = spawnSync('which', ['clang-format'], { encoding: 'utf-8' });
            if (result.status === 0 && result.stdout.trim()) {
              clangFormat = result.stdout.trim();
            } else {
              // Fallback for Windows
              const resultWin = spawnSync('where', ['clang-format'], { encoding: 'utf-8' });
              if (resultWin.status === 0 && resultWin.stdout.trim()) {
                clangFormat = resultWin.stdout.trim().split('\n')[0] || 'clang-format';
              }
            }
          } catch {
            // If which/where don't work, use command name
            clangFormat = 'clang-format';
          }
        }
        
        // 4. If still not found, use command name as fallback
        if (!clangFormat) {
          clangFormat = 'clang-format';
        }
      }
      
      const clangFormatFinal = clangFormat;
      
      if (options.verbose) {
        console.log(`Using clang-format: ${clangFormatFinal}`);
      }
      
      // Check clang-format availability
      try {
        const testResult = spawnSync(clangFormatFinal, ['--version'], { encoding: 'utf-8' });
        if (testResult.error || testResult.status !== 0) {
          console.error(chalk.red(`✗ clang-format unavailable: ${clangFormatFinal}`));
          console.error(chalk.yellow('Install clang-format or specify path via --clang-format'));
          process.exit(1);
        }
        if (options.verbose && testResult.stdout) {
          console.log(`clang-format version: ${testResult.stdout.trim()}`);
        }
      } catch (err: any) {
        console.error(chalk.red(`✗ Failed to run clang-format: ${clangFormatFinal}`));
        console.error(chalk.yellow(`Error: ${err.message}`));
        console.error(chalk.yellow('Install clang-format or specify path via --clang-format'));
        process.exit(1);
      }

      const clangFormatConfigPath = resolveUtilityClangFormatConfigPath();
      const clangFormatStyleArg = buildClangFormatStyleArg(clangFormatConfigPath);
      if (options.verbose) {
        console.log(`Using tool .clang-format: ${clangFormatConfigPath}`);
      }

      const outputDir: string = options.output || path.join('out', 'fixed');
      const maxLineLength = parseInt(options.maxLength, 10) || config.formatting?.maxLineLength || 120;
      
      // Statistics
      let cppFormatted = 0;
      let cppFailed = 0;
      let cppBaselineLong = 0;
      let cppRemainingLong = 0;
      const cppRemainingRows: Array<{file: string; line: number; length: number}> = [];
      
      const cppLogPath: string = path.join(outputDir, 'cpp-format.log');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(cppLogPath, `clang-format run at ${new Date().toISOString()}\n`);

      console.log(`Running C++ formatting...`);
      const startTime = Date.now();

      for (let i = 0; i < cppFiles.length; i++) {
        const file = cppFiles[i];
        if (!file) continue;
        
        const displayPath = path.relative(config.repoPath, file);
        const coloredDisplayPath = (() => {
          const match = displayPath.match(/^(.*[\\\/])([^\\\/]+)$/);
          if (!match) return displayPath;
          const [, dir, filename] = match;
          return `\x1b[90m${dir}\x1b[0m${filename}`;
        })();

        try {
          process.stdout.write(`[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} …`);

          const content = fs.readFileSync(file, 'utf-8');
          
          // Count long lines in source (only for .cpp/.cc/.cxx/.c++, not for headers)
          const extLower = path.extname(file).toLowerCase();
          const isHeader = extLower === '.h' || extLower === '.hpp';
          if (!isHeader) {
            content.split('\n').forEach((ln) => {
              if (ln.length > maxLineLength) {
                cppBaselineLong++;
              }
            });
          }

          const res = spawnSync(
            clangFormatFinal,
            [clangFormatStyleArg, `-assume-filename=${file}`],
            { cwd: config.repoPath, input: content, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 100 }
          );

          if (res.error) {
            const errorMsg = res.error?.message || String(res.error);
            const shortError = errorMsg.includes('ENOENT') 
              ? 'clang-format not found'
              : errorMsg.includes('EACCES')
              ? 'no access permissions'
              : errorMsg.length > 50 
              ? errorMsg.substring(0, 47) + '...'
              : errorMsg;
            
            const details = [
              `[FAIL] ${file}`,
              `error: ${errorMsg}`,
              `status: ${res.status}`,
              res.stderr ? `stderr: ${String(res.stderr).slice(0, 4000)}` : ''
            ].filter(Boolean).join('\n') + '\n';
            fs.appendFileSync(cppLogPath, details);
            cppFailed++;
            process.stdout.write(`\r[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} ${chalk.red(`✗ ${shortError}`)}\n`);
            continue;
          }

          // Log stderr even on successful execution
          if (res.stderr && res.stderr.length > 0) {
            const warn = [`[STDERR] ${file}`, String(res.stderr).slice(0, 4000)].join('\n') + '\n';
            fs.appendFileSync(cppLogPath, warn);
          }

          const formatted = res.stdout as string;
          const rel = path.relative(config.repoPath, file);
          const outPath = path.join(outputDir, rel);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, formatted, 'utf-8');
          cppFormatted++;

          // Count remaining long lines after formatting
          const outExtLower = path.extname(outPath).toLowerCase();
          const outIsHeader = outExtLower === '.h' || outExtLower === '.hpp';
          let remainingInFile = 0;
          if (!outIsHeader) {
            formatted.split('\n').forEach((ln, idx) => {
              if (ln.length > maxLineLength) {
                cppRemainingLong++;
                remainingInFile++;
                cppRemainingRows.push({ file: outPath, line: idx + 1, length: ln.length });
              }
            });
          }

          fs.appendFileSync(cppLogPath, `[OK] ${file} -> ${outPath}\n`);
          
          const statusColor = remainingInFile > 0 ? chalk.yellow : chalk.green;
          const statusText = remainingInFile > 0 ? `⚠ ${remainingInFile} long` : '✓';
          process.stdout.write(`\r[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} ${statusColor(statusText)}\n`);

        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          const shortError = errorMsg.includes('ENOENT')
            ? 'file not found'
            : errorMsg.includes('EACCES')
            ? 'no access permissions'
            : errorMsg.includes('parse')
            ? 'parsing error'
            : errorMsg.length > 50
            ? errorMsg.substring(0, 47) + '...'
            : errorMsg;
          
          const details = [
            `[FAIL] ${file}`,
            err?.message ? `message: ${err.message}` : '',
            err?.status !== undefined ? `status: ${err.status}` : '',
            err?.signal ? `signal: ${err.signal}` : '',
            err?.stderr ? `stderr: ${String(err.stderr).slice(0, 4000)}` : ''
          ].filter(Boolean).join('\n') + '\n';
          fs.appendFileSync(cppLogPath, details);
          cppFailed++;
          process.stdout.write(`\r[${i + 1}/${cppFiles.length}] ${coloredDisplayPath} ${chalk.red(`✗ ${shortError}`)}\n`);
        }
      }

      const totalDuration = (Date.now() - startTime) / 1000;
      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);
      const seconds = totalDuration % 60;
      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;

      console.log('\n' + '═'.repeat(70));
      console.log(chalk.bold('C++ Formatting Statistics'));
      console.log('═'.repeat(70));
      console.log(`Total files: ${cppFiles.length}`);
      console.log(`Successfully formatted: ${chalk.green(cppFormatted)}`);
      if (cppFailed > 0) {
        console.log(`Errors: ${chalk.red(cppFailed)}`);
      }
      console.log(`Long lines before: ${cppBaselineLong}`);
      console.log(`Long lines after: ${cppRemainingLong > 0 ? chalk.yellow(cppRemainingLong) : chalk.green(cppRemainingLong)}`);
      if (cppBaselineLong > 0) {
        const fixed = cppBaselineLong - cppRemainingLong;
        const percent = ((fixed / cppBaselineLong) * 100).toFixed(1);
        console.log(`Fixed: ${chalk.green(fixed)} (${percent}%)`);
      }
      console.log(`Execution time: ${formattedTime}`);
      console.log(`Output directory: ${outputDir}`);
      console.log(`Log: ${cppLogPath}`);
      console.log('═'.repeat(70));

      // Save CSV with remaining long lines
      if (cppRemainingRows.length > 0) {
        const csvPath = path.join(outputDir, 'long_lines_cpp_remaining.csv');
        const csvContent = 'file,line,length\n' + 
          cppRemainingRows.map(r => `${r.file},${r.line},${r.length}`).join('\n');
        fs.writeFileSync(csvPath, csvContent);
        console.log(`\n${chalk.yellow('!')} Remaining long lines saved to: ${csvPath}`);
      }

      console.log(`\n${chalk.green('✓')} C++ formatting complete`);

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
      
      // Create temporary configuration for line-length, as fix is now a synonym
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
  
  // Create default configuration
  const defaultAnalysisConfig: AnalysisConfig = {
    /** analysis rules, currently not used. Does not affect rule selection. */
    rules: [
      { name: 'syntax_errors', enabled: true, severity: 'error' as any },
      { name: 'type_errors', enabled: true, severity: 'error' as any },
      { name: 'style_violations', enabled: true, severity: 'warning' as any },
      { name: 'best_practices', enabled: true, severity: 'warning' as any }
    ],
    /** include files for analysis, currently not used. Does not affect file selection. */
    includePatterns: ['**/*.ts', '**/*.tsx', '**/*.cpp', '**/*.hpp'],
    /** exclude directories for analysis
     * used in Orchestrator.shouldAnalyzeFile to filter out paths by substring;
     * excludes files whose paths contain specified fragments (not glob-matching).
     */
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
    /** 1MB maximum file size for analysis */
    maxFileSize: 1024 * 1024,
    /** 30 seconds timeout for file analysis, currently not used/enforced */
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

function findPackageRoot(startDir: string): string | null {
  let currentDir = path.resolve(startDir);
  const rootDir = path.parse(currentDir).root;

  while (true) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    if (currentDir === rootDir) {
      return null;
    }
    currentDir = path.dirname(currentDir);
  }
}

function resolveUtilityClangFormatConfigPath(): string {
  const packageRoot = findPackageRoot(__dirname);
  if (!packageRoot) {
    throw new Error('Failed to resolve tool package root for .clang-format lookup');
  }

  const clangFormatConfigPath = path.join(packageRoot, '.clang-format');
  if (!fs.existsSync(clangFormatConfigPath)) {
    throw new Error(`.clang-format not found in tool directory: ${clangFormatConfigPath}`);
  }

  return clangFormatConfigPath;
}

function buildClangFormatStyleArg(configPath: string): string {
  const normalizedPath = path.resolve(configPath).replace(/\\/g, '/');
  return `-style=file:${normalizedPath}`;
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

// Error handling
process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});
// Program entry point
program.parse();
