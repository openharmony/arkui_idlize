# Prettier Formatter Tools

Utility scripts for working with the `prettier_formatter` library from the command line. They live in the `tools/prettier_formatter` directory and are intended for quick formatting of TypeScript and TSX snippets or fixtures.

## Contents

- `format-file.ts` — CLI wrapper around `libs/prettier_formatter`.
- `run_format-file.sh` — convenience shell script that invokes `format-file.ts` against `input.fixture.ts` and writes the result to `output.fixture.ts`.
- `input.fixture.ts` / `output.fixture.ts` — sample fixture pair used in tests and manual checks.

## Requirements

- Node.js
- `ts-node` (pulled automatically when running inside the repository via `npx`)

## Usage

### Direct CLI (recommended for ad-hoc files)

```bash
npx ts-node tools/prettier_formatter/format-file.ts --file path/to/file.tsx > formatted.tsx
```

Available options:

- `--file <path>` — **required**, path to a `.ts`/`.tsx` file.
- `--strict` — optional flag enabling strict parsing (throws on syntax errors instead of returning the original source).

### Fixture workflow

The shell script runs from its own directory and keeps the input/output fixtures in sync:

```bash
cd tools/prettier_formatter
./run_format-file.sh              # formats input.fixture.ts -> output.fixture.ts
./run_format-file.sh --strict     # same, but with strict parsing enabled
```

Both scripts rely on the library entry points exported from `libs/prettier_formatter` (`formatSourceCode`, `formatTypeScript`, `formatTsx`).

## Notes

- Run commands from the repository root (or from within `tools/prettier_formatter` for the shell script) so that local dependencies are resolved correctly.
- The formatter is configured via `libs/prettier_formatter/.prettierrc`; do not place a separate config in the tools directory.
- If you need to inspect warnings, pass `--strict` to surface parse errors and check STDERR/STDOUT messages.

