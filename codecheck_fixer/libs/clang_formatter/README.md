# `clang_formatter` Library

This library exposes a thin wrapper around `clang-format` tailored for formatting C/C++ sources inside the project.

## Purpose

- Provide consistent C/C++ formatting using clang-format without relying on global repository configuration.
- Plug into custom pipelines (e.g. analyzers or CLI) without touching the primary formatter stack.
- Serve as a centralized point for clang-format integration.

## Limitations

- Only `.cpp`, `.cc`, `.cxx`, `.c++`, `.hpp`, and `.h` files are supported.
- Requires `clang-format` binary to be available (searches OHOS SDK, PATH, or explicit path).
- Falls back to returning original code if clang-format is unavailable (non-strict mode).

## Usage in code

```ts
import { formatCpp } from 'libs/clang_formatter';

// Basic usage
const formatted = formatCpp(code, filePath, {
  repoPath: '/path/to/repo'
});

// With explicit clang-format path
const formatted = formatCpp(code, filePath, {
  repoPath: '/path/to/repo',
  clangFormatPath: '/custom/path/to/clang-format'
});

// With error handling
const formatted = formatCpp(code, filePath, {
  repoPath: '/path/to/repo',
  strictParsing: false,
  onFormattingError: (error) => {
    console.error('Formatting failed:', error.message);
  }
});
```

## API

### `formatCpp(code: string, filePath: string, options?: FormatCppOptions): string`

Formats C++ code using clang-format.

**Parameters:**
- `code`: Source code string to format
- `filePath`: Path to the file (used for `.clang-format` config resolution)
- `options`: Optional configuration

**Returns:** Formatted code string (or original code if formatting fails in non-strict mode)

### `FormatCppOptions`

```ts
interface FormatCppOptions {
  /** Repository path (working directory for clang-format). */
  repoPath?: string;
  /** Explicit path to clang-format executable. */
  clangFormatPath?: string;
  /** 
   * Strict parsing mode. If true, throws on errors.
   * Default: false (returns original code on error)
   */
  strictParsing?: boolean;
  /** Callback called on formatting errors (before fallback). */
  onFormattingError?: (error: ClangFormatError) => void;
}
```

## Clang-format Resolution

The library searches for `clang-format` in the following order:

1. Explicit path via `clangFormatPath` option
2. OHOS SDK: `$OHOS_DIR/prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format` (if `OHOS_DIR` is set)
3. Repository path: `repoPath/prebuilts/clang/ohos/linux-x86_64/llvm/bin/clang-format` (if `repoPath` is provided and contains OHOS structure)
4. System PATH: `clang-format` command

## Error Handling

By default, the library returns the original code if formatting fails. To enable strict mode:

```ts
const formatted = formatCpp(code, filePath, {
  strictParsing: true  // Throws ClangFormatError on failure
});
```

## Integration

The library is used in:
- `src/core/orchestrator.ts` - Main formatting pipeline
- `src/cli/index.ts` - CLI commands (`cpp-format`, `line-length`)

## Environment Variables

- `OHOS_DIR` - Path to OHOS SDK (for clang-format discovery)

