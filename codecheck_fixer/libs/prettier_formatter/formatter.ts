import { promises as fs } from 'fs';
import path from 'path';
import type { Options as PrettierOptions, Plugin as PrettierPlugin } from 'prettier';

type PrettierStandaloneModule = typeof import('prettier/standalone');
type PrettierTypeScriptPlugin = typeof import('prettier/plugins/typescript');
type PrettierEstreePlugin = typeof import('prettier/plugins/estree');

let prettierModulePromise: Promise<PrettierStandaloneModule> | null = null;
let prettierTypeScriptPluginPromise: Promise<PrettierTypeScriptPlugin> | null = null;
let prettierEstreePluginPromise: Promise<PrettierEstreePlugin> | null = null;

async function getPrettier(): Promise<PrettierStandaloneModule> {
  if (!prettierModulePromise) {
    prettierModulePromise = import('prettier/standalone');
  }
  return prettierModulePromise;
}

async function getTypeScriptPlugin(): Promise<PrettierTypeScriptPlugin> {
  if (!prettierTypeScriptPluginPromise) {
    prettierTypeScriptPluginPromise = import('prettier/plugins/typescript');
  }
  return prettierTypeScriptPluginPromise;
}

async function getEstreePlugin(): Promise<PrettierEstreePlugin> {
  if (!prettierEstreePluginPromise) {
    prettierEstreePluginPromise = import('prettier/plugins/estree');
  }
  return prettierEstreePluginPromise;
}

export type SupportedSourceType = 'ts' | 'tsx';

const EXTENSION_BY_LANGUAGE: Record<SupportedSourceType, string> = {
  ts: '.ts',
  tsx: '.tsx'
};

const DEFAULT_VIRTUAL_BASENAME = '__virtual_source__';
const MODULE_DEFAULT_CONFIG = path.resolve(__dirname, '.prettierrc');

export class PrettierConfigError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PrettierConfigError';
    this.cause = cause;
  }
}

export class PrettierFormattingError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PrettierFormattingError';
    this.cause = cause;
  }
}

export interface FormatSourceOptions {
  /** Source code string to format. */
  code: string;
  /** Source type affecting parser choice and virtual extension. */
  language: SupportedSourceType;
  /**
   * Path to file (can be virtual). Used for binding to configuration
   * and detecting Prettier parser.
   */
  filePath?: string;
  /**
   * Explicit path to Prettier configuration. Can pass file or directory
   * containing `.prettierrc`.
   */
  configPath?: string;
  /** Additional Prettier options overriding found settings. */
  prettierOptions?: Partial<PrettierOptions>;
  /**
   * Controls reaction to source parsing errors.
   * By default source code is returned as is, without interrupting execution.
   * In strict mode `PrettierFormattingError` exception is thrown.
   */
  strictParsing?: boolean;
  /**
   * Callback invoked on formatting error (before applying fallback).
   */
  onFormattingError?: (error: PrettierFormattingError) => void;
}

export type FormatOverrides = Omit<FormatSourceOptions, 'code' | 'language'>;

/**
 * Returns language by file extension.
 */
export function inferLanguageFromFilePath(filePath: string): SupportedSourceType {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.ts':
      return 'ts';
    case '.tsx':
      return 'tsx';
    default:
      throw new PrettierFormattingError(
        `Unknown file extension: ${extension || '[empty]'}`
      );
  }
}

/**
 * Formats code string according to Prettier settings.
 */
export async function formatSourceCode(options: FormatSourceOptions): Promise<string> {
  const effectiveFilePath = resolveFilePath(options.filePath, options.language);
  const resolvedConfigPath = options.configPath
    ? await normalizeConfigPath(options.configPath)
    : undefined;
  const configFromPrettier = await resolvePrettierConfig(effectiveFilePath, resolvedConfigPath);

  const parser = ensureParser(options.language, options.prettierOptions?.parser);

  const { rest: configRest, plugins: configPluginsRaw } = splitOptions(configFromPrettier);
  const { rest: overrideRest, plugins: overridePluginsRaw } = splitOptions(options.prettierOptions);
  const plugins = await composePlugins(configPluginsRaw, overridePluginsRaw);

  const strictParsing = options.strictParsing ?? false;

  const finalOptions: PrettierOptions = {
    ...configRest,
    ...overrideRest,
    parser,
    filepath: options.prettierOptions?.filepath
      ? path.resolve(options.prettierOptions.filepath)
      : effectiveFilePath,
    plugins
  };

  const prettier = await getPrettier();

  try {
    return await prettier.format(options.code, finalOptions);
  } catch (error) {
    const formattingError =
      error instanceof PrettierFormattingError
        ? error
        : new PrettierFormattingError(
            `Failed to format source code (${options.language}).`,
            error
          );

    options.onFormattingError?.(formattingError);

    if (strictParsing) {
      throw formattingError;
    }

    return options.code;
  }
}

/**
 * Formats TypeScript string.
 */
export async function formatTypeScript(
  code: string,
  overrides: FormatOverrides = {}
): Promise<string> {
  return formatSourceCode({ code, language: 'ts', ...overrides });
}

/**
 * Formats TSX string.
 */
export async function formatTsx(
  code: string,
  overrides: FormatOverrides = {}
): Promise<string> {
  const { filePath: explicitFilePath, ...rest } = overrides;
  const filePath = explicitFilePath ?? buildVirtualPath('tsx');
  return formatSourceCode({ code, language: 'tsx', filePath, ...rest });
}

async function resolvePrettierConfig(
  filePath: string,
  configPath?: string
): Promise<Partial<PrettierOptions> | undefined> {
  if (configPath) {
    return readJsonConfig(configPath).catch(() => undefined);
  }

  const workspaceConfig = await findWorkspaceConfig(path.dirname(filePath));
  if (workspaceConfig) {
    return workspaceConfig;
  }

  const moduleConfig = await readJsonConfig(MODULE_DEFAULT_CONFIG).catch(() => undefined);
  return moduleConfig ?? undefined;
}

async function normalizeConfigPath(configPath: string): Promise<string> {
  const resolvedPath = path.resolve(configPath);

  try {
    const stats = await fs.stat(resolvedPath);
    if (stats.isFile()) {
      return resolvedPath;
    }
    if (stats.isDirectory()) {
      const candidate = path.join(resolvedPath, '.prettierrc');
      const exists = await fileExists(candidate);
      if (!exists) {
        throw new PrettierConfigError(
          `.prettierrc file not found in directory ${resolvedPath}.`
        );
      }
      return candidate;
    }
    throw new PrettierConfigError(`Path ${resolvedPath} is not a file or directory.`);
  } catch (error) {
    if (error instanceof PrettierConfigError) {
      throw error;
    }
    throw new PrettierConfigError(
      `Failed to read Prettier configuration at path ${resolvedPath}.`,
      error
    );
  }
}

async function readJsonConfig(configPath: string): Promise<Partial<PrettierOptions>> {
  const exists = await fileExists(configPath);
  if (!exists) {
    throw new PrettierConfigError(`Configuration file not found: ${configPath}`);
  }

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw) as PrettierOptions;
  } catch (error) {
    throw new PrettierConfigError(
      `Failed to parse Prettier configuration file: ${configPath}.`,
      error
    );
  }
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function findWorkspaceConfig(startDir: string): Promise<Partial<PrettierOptions> | undefined> {
  let currentDir = path.resolve(startDir);
  const visited = new Set<string>();

  while (!visited.has(currentDir)) {
    visited.add(currentDir);
    for (const candidateName of ['.prettierrc', '.prettierrc.json']) {
      const candidatePath = path.join(currentDir, candidateName);
      if (await fileExists(candidatePath)) {
        try {
          return await readJsonConfig(candidatePath);
        } catch (error) {
          throw new PrettierConfigError(
            `Failed to read Prettier configuration: ${candidatePath}.`,
            error
          );
        }
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return undefined;
}

function resolveFilePath(filePath: string | undefined, language: SupportedSourceType): string {
  if (filePath) {
    return path.resolve(filePath);
  }
  return buildVirtualPath(language);
}

function buildVirtualPath(language: SupportedSourceType): string {
  const extension = EXTENSION_BY_LANGUAGE[language];
  return path.resolve(process.cwd(), `${DEFAULT_VIRTUAL_BASENAME}${extension}`);
}

function splitOptions(
  options?: Partial<PrettierOptions>
): { rest: Partial<PrettierOptions>; plugins: unknown } {
  if (!options) {
    return { rest: {}, plugins: undefined };
  }

  const { plugins, parser: _parser, ...rest } = options as Partial<PrettierOptions> & {
    plugins?: unknown;
    parser?: PrettierOptions['parser'];
  };
  return { rest, plugins };
}

async function composePlugins(
  configPlugins: unknown,
  overridePlugins: unknown
): Promise<PrettierPlugin[]> {
  const normalized = [...normalizePlugins(configPlugins), ...normalizePlugins(overridePlugins)];
  const [typeScriptPlugin, estreePlugin] = await Promise.all([
    getTypeScriptPlugin(),
    getEstreePlugin()
  ]);

  const requiredPlugins = [typeScriptPlugin, estreePlugin] as unknown as PrettierPlugin[];

  for (const required of requiredPlugins) {
    if (!normalized.includes(required)) {
      normalized.push(required);
    }
  }

  return normalized;
}

function normalizePlugins(value: unknown): PrettierPlugin[] {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : [value];
  const normalized: PrettierPlugin[] = [];

  for (const item of items) {
    if (item && typeof item === 'object') {
      normalized.push(item as PrettierPlugin);
      continue;
    }

    throw new PrettierConfigError(
      'Only Prettier plugin objects are supported. Pass plugin module instead of path or name.'
    );
  }

  return normalized;
}

function ensureParser(
  language: SupportedSourceType,
  parserOverride: PrettierOptions['parser'] | undefined
): NonNullable<PrettierOptions['parser']> {
  if (parserOverride) {
    return parserOverride as NonNullable<PrettierOptions['parser']>;
  }

  switch (language) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    default:
      return 'typescript';
  }
}
