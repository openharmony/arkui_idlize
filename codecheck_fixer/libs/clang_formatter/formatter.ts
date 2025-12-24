/**
 * C++ code formatter using clang-format
 * 
 * This library provides a thin wrapper around clang-format for formatting
 * C/C++ sources in the project.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class ClangFormatError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ClangFormatError';
    this.cause = cause;
  }
}

export interface FormatCppOptions {
  /** Source code string to format. */
  code: string;
  /**
   * Path to file. Used for binding to .clang-format configuration
   * and passing to clang-format via -assume-filename.
   */
  filePath: string;
  /**
   * Path to repository (working directory for clang-format).
   * Used to search for .clang-format configuration.
   */
  repoPath?: string;
  /**
   * Explicit path to clang-format executable.
   * If not specified, automatic search is performed.
   */
  clangFormatPath?: string;
  /**
   * Controls reaction to formatting errors.
   * By default source code is returned as is, without interrupting execution.
   * In strict mode ClangFormatError exception is thrown.
   */
  strictParsing?: boolean;
  /**
   * Callback invoked on formatting error (before applying fallback).
   */
  onFormattingError?: (error: ClangFormatError) => void;
}

/**
 * Determines path to clang-format.
 */
function resolveClangFormatPath(explicitPath?: string, repoPath?: string): string | null {
  // 1. Use explicitly specified path
  if (explicitPath) {
    if (fs.existsSync(explicitPath)) {
      return explicitPath;
    }
    return null;
  }

  // 2. Check standard location in OHOS SDK (if OHOS_DIR is set)
  const ohosDir = process.env['OHOS_DIR'];
  if (ohosDir) {
    const candidate = path.resolve(ohosDir, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 3. Check standard location in repoPath (if this is a multi-language project)
  if (repoPath) {
    const candidate = path.resolve(repoPath, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 4. Try to find clang-format in PATH
  try {
    execFileSync('clang-format', ['--version'], { stdio: 'ignore' });
    return 'clang-format';
  } catch {
    // clang-format not found in PATH
    return null;
  }
}

/**
 * Formats C++ code using clang-format.
 */
export function formatCppCode(options: FormatCppOptions): string {
  const { code, filePath, repoPath, clangFormatPath, strictParsing, onFormattingError } = options;

  const resolvedClangFormat = resolveClangFormatPath(clangFormatPath, repoPath);
  
  if (!resolvedClangFormat) {
    const error = new ClangFormatError(
      `clang-format not found. Check installation or specify path via clangFormatPath.`
    );
    onFormattingError?.(error);
    
    if (strictParsing) {
      throw error;
    }
    
    return code;
  }

  const effectiveRepoPath = repoPath || path.dirname(filePath) || process.cwd();

  try {
    const formatted = execFileSync(
      resolvedClangFormat,
      ['-style=file', `-assume-filename=${filePath}`],
      {
        cwd: effectiveRepoPath,
        encoding: 'utf-8',
        input: code,
        maxBuffer: 1024 * 1024 * 100 // 100MB
      }
    );
    return formatted;
  } catch (error) {
    const formattingError = new ClangFormatError(
      `Failed to format C++ code for file ${filePath}.`,
      error
    );
    
    onFormattingError?.(formattingError);

    if (strictParsing) {
      throw formattingError;
    }

    return code;
  }
}

/**
 * Formats C++ code from file.
 */
export function formatCpp(
  code: string,
  filePath: string,
  options: Omit<FormatCppOptions, 'code' | 'filePath'> = {}
): string {
  return formatCppCode({
    code,
    filePath,
    ...options
  });
}

