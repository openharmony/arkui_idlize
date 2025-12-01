/**
 * Форматтер C++ кода с использованием clang-format
 * 
 * Эта библиотека предоставляет тонкую обертку вокруг clang-format для форматирования
 * C/C++ исходников в проекте.
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
  /** Исходная строка кода, которую требуется отформатировать. */
  code: string;
  /**
   * Путь до файла. Используется для привязки к конфигурации .clang-format
   * и передачи в clang-format через -assume-filename.
   */
  filePath: string;
  /**
   * Путь к репозиторию (рабочая директория для clang-format).
   * Используется для поиска .clang-format конфигурации.
   */
  repoPath?: string;
  /**
   * Явный путь до исполняемого файла clang-format.
   * Если не указан, выполняется автоматический поиск.
   */
  clangFormatPath?: string;
  /**
   * Управляет реакцией на ошибки форматирования.
   * По умолчанию исходный код возвращается как есть, не прерывая выполнение.
   * В строгом режиме генерируется исключение ClangFormatError.
   */
  strictParsing?: boolean;
  /**
   * Колбэк, вызываемый при ошибке форматирования (до применения fallback).
   */
  onFormattingError?: (error: ClangFormatError) => void;
}

/**
 * Определяет путь к clang-format.
 */
function resolveClangFormatPath(explicitPath?: string, repoPath?: string): string | null {
  // 1. Используем явно указанный путь
  if (explicitPath) {
    if (fs.existsSync(explicitPath)) {
      return explicitPath;
    }
    return null;
  }

  // 2. Проверяем стандартное расположение в OHOS SDK (если OHOS_DIR установлен)
  const ohosDir = process.env['OHOS_DIR'];
  if (ohosDir) {
    const candidate = path.resolve(ohosDir, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 3. Проверяем стандартное расположение в repoPath (если это мульти-языковой проект)
  if (repoPath) {
    const candidate = path.resolve(repoPath, 'prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 4. Пытаемся найти clang-format в PATH
  try {
    execFileSync('clang-format', ['--version'], { stdio: 'ignore' });
    return 'clang-format';
  } catch {
    // clang-format не найден в PATH
    return null;
  }
}

/**
 * Форматирует C++ код с использованием clang-format.
 */
export function formatCppCode(options: FormatCppOptions): string {
  const { code, filePath, repoPath, clangFormatPath, strictParsing, onFormattingError } = options;

  const resolvedClangFormat = resolveClangFormatPath(clangFormatPath, repoPath);
  
  if (!resolvedClangFormat) {
    const error = new ClangFormatError(
      `clang-format не найден. Проверьте установку или укажите путь через clangFormatPath.`
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
      `Не удалось отформатировать C++ код для файла ${filePath}.`,
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
 * Форматирует C++ код из файла.
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

