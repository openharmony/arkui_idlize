# `prettier_formatter` Library

This library exposes a thin wrapper around `prettier/standalone` tailored for formatting TypeScript and TSX sources inside the project.

## Purpose

- Provide consistent TS/TSX formatting without relying on the global repository configuration.
- Plug into custom pipelines (e.g. analyzers or CLI) without touching the primary formatter stack.
- Serve as an experimentation point for alternative formatting engines.

> ⚠️ **Important.** This library is considered a forward-looking alternative. In the current solution it acts as a lightweight layer and does not fully replace existing formatting mechanisms (enhanced AST, etc.).

## Limitations

- Only `.ts` and `.tsx` files are supported.
- ArkTS (ETS) support is not provided — such files are handled by the main project tooling.
- The Prettier configuration is stored locally (`libs/prettier_formatter/.prettierrc`) and is expected to stay isolated from external settings.

## Testing

### Quick start

Switch to the library directory and run:

```bash
cd libs/prettier_formatter
npm test -- tests/prettier-based.test.ts
```

Alternatively, execute the helper script that wraps the same command:

```bash
cd libs/prettier_formatter
./run_prettier_test.sh
```

Fixtures are located in `tests/fixtures`. To update the expected `output.*` files, use the utility described below.

### Handy utility

The tooling lives in `tools/prettier_formatter` (details in that directory's README). The primary CLI script, `format-file.ts`, takes a file path and prints a formatted version to STDOUT. This makes it easy to refresh fixtures or use the library on demand:

```bash
cd <repo root>
npx ts-node tools/prettier_formatter/format-file.ts --file path/to/file.tsx > formatted.tsx
```

Script tips:

- Run it from the repository root so `ts-node` resolves local dependencies.
- Add `--transpile-only` if you want to skip strict type checking while debugging the script.
- You can pipe the result directly into `fixtures/.../output.*` or diff it against `input.*`.
- By default the utility does not fail on syntax errors and returns the original source unchanged. Use the `--strict` flag if you need the previous "fail-fast" behaviour.
- Available CLI options: `--file <path>` (required) and `--strict` (enables strict parsing; throws on syntax errors instead of returning the original source).
- The helper script `run_format-file.sh` (in `tools/prettier_formatter`) formats the bundled fixture. Run it from that directory, e.g. `cd tools/prettier_formatter && ./run_format-file.sh [--strict]`.
- See `tools/prettier_formatter/README.md` for more scenarios and usage tips.

## Usage in code

```ts
import { formatTypeScript, formatTsx, formatSourceCode } from 'libs/prettier_formatter';

const formatted = await formatTypeScript(sourceCode);
```

Additional options (config path override, explicit Prettier settings, etc.) can be passed to `formatSourceCode` / `formatTypeScript` / `formatTsx` via the corresponding parameters.
You can also toggle graceful error handling with the `strictParsing` option and react to parse issues via `onFormattingError`.
