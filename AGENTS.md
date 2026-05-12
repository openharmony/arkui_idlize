# idlize

idlize is a monorepo of tools that ingest interface declarations
(`.d.ts`, `.d.ets`, `.idl`) and emit native bindings for the
OpenHarmony / ArkUI ecosystem — ArkTS peers, C++ libace modifiers,
and Arkoala glue code.

**Pipeline:** `declarations → IDL → parser → AST → printers → generated peers / modifiers / serializers`.
The `runner m3` command drives the end-to-end flow; individual workspaces
own each stage.

Pipeline stages:

1. **Scrape** — pull external SDK content (`scraper/`).
2. **ETS → IDL** — convert `.d.ts` / `.d.ets` to `.idl` (`etsgen/`).
3. **Parse → AST** — `core/` reads the `.idl` files and builds the IDL AST.
4. **Print / generate** — `arkgen/` and `libohos/` walk the AST through
   printers to emit peers, modifiers, serializers.
5. **Install** — place output files into the target directory (`runner/`).

**Intermediate artifacts to inspect when debugging** (under `runner/out/`,
populated by `bash generate.sh`):

- `runner/out/idl/` — converted `.idl` files (input to the AST stage).
  Diff here to see what `etsgen` produced.
- `runner/out/peers/sig/`, `runner/out/peers/libace/` — generated peer
  code per target. Diff here to see what the printers emitted.
- `runner/out/scraper/`, `runner/out/response-files/`,
  `runner/out/patched-sdk-{arkts,ts}/` — staging areas for earlier
  stages.

When a generated file looks wrong, work backwards through these dirs
to find which stage diverged. Authoritative paths live in
`runner/src/shared.ts`.

For setup, read `.claude/skills/INSTRUCTION.md`.
For architecture deep-dives, see §Setup & deeper docs.

## Common tasks → where to start

Before non-trivial work in any workspace, invoke the matching `idl-*`
skill (see §Skills index). This table is the primary routing guide.

| Task | Workspace | Skill |
|---|---|---|
| Modify ArkUI component peer generation | `arkgen/` | `idl-arkgen` |
| Tune `generation-config/config.json` | `arkgen/generation-config/` | `idl-arkgen-config` |
| Change pipeline / `runner m3` | `runner/` | `idl-runner` |
| Convert `.d.ts` / `.d.ets` → IDL | `etsgen/` | `idl-etsgen` |
| Touch IDL parser / AST / `LanguageWriter` | `core/` | `idl-core` |
| Edit serializers / printers / peer infra | `libohos/` | `idl-libohos` |
| Add/edit a `.d.ts` lint rule | `linter/` | — |
| Add/edit an IDL lint rule | `idlinter/` | — |
| Patch an SDK declaration | `sdk-patched/` or `sdk-patched-arkts/` | — |
| Modify ArkTS-specific codegen | `arktscgen/` | — |
| Generate `.d.ts` (reverse direction) | `dtsgen/` | — |
| Update packaged interface definitions | `interfaces/` | — |
| Pull/process external SDK content | `scraper/` | — |
| OHOS-target generation or demos | `ohosgen/` | — |

**Cross-cutting heuristics** (not covered by a single table row):

- **Type serialization** across the ArkTS/C++ boundary:
  `idl-libohos` → `doc/SERIALIZATION.md`.
- **New IDL construct** (node type, keyword): start in `idl-core`;
  changes ripple to every generator.
- **Type error in generated C++ or ArkTS code**:
  check `interop-types` and serializer alignment via `idl-libohos`.
- **Upstream SDK declaration changed** (new API, renamed attribute):
  patch in `sdk-patched/` or `sdk-patched-arkts/`, then re-run the
  pipeline.
- **Tracing why a `.idl` file looks the way it does**:
  `idl-etsgen` for how it was produced; `idl-core` for the AST shape.

## Workspace map

- `core/` — IDL AST node types, parser, `LanguageWriter` abstractions,
  config merging, and diagnostics; every generator depends on this.
- `arkgen/` — ArkUI component generator producing ArkTS peers, C++ libace
  modifiers, and Arkoala bindings; houses `src/printers/` and
  `generation-config/` (`config.json`, `schema.json`).
- `etsgen/` — `.d.ts` / `.d.ets` → IDL transformer; the `dts2idl` stage.
- `arktscgen/` — ArkTS-specific codegen path distinct from main `arkgen`.
- `dtsgen/` — reverse generator: emits `.d.ts` from IDL definitions.
- `runner/` — top-level pipeline orchestrator; `m3` runs the full flow
  with flags like `--sdk-stage`, `--target`, and `--*-options-file`
  config pointers. Subcommands live in `src/commands/`; consult
  `runner/src/main.ts` for the authoritative flag list.
- `libohos/` — shared peer-gen infrastructure: printers, serializers,
  `ost` / `ostgen` helpers, and language-specific utilities.
- `linter/` — lint rules that validate `.d.ts` / `.d.ets` declarations.
- `idlinter/` — lint rules that validate `.idl` intermediate files.
- `interfaces/` — packaged interface definitions consumed downstream.
- `scraper/` — pulls, caches, and normalises external SDK content for
  subsequent pipeline stages.
- `ohosgen/` — OHOS-target generator and integration demos under
  `demos/`.
- `external/` — vendored deps: `ui2abc`, `libarkts`, `interop`,
  `incremental`.
- `sdk-patched/` — patched upstream `.d.ts` SDK declarations.
- `sdk-patched-arkts/` — patched upstream `.d.ets` SDK declarations.
- `interface_sdk-js/` — vendored upstream SDK submodule (read-only;
  do not hand-edit).
- `bundled/` — release artifacts from `npm run bundle`; **do not edit**.

Nested sub-workspaces (`core/webidl2.js`, `external/ui2abc/libarkts`,
`arkgen/tests-template/arkts`, `ohosgen/demos/*`, etc.) are not listed
individually — they inherit context from their parent workspace.

## Skills index

Invoke the matching `idl-*` skill **before** non-trivial work in the
corresponding workspace. Skills carry per-workspace architecture detail
not duplicated here. See §Common tasks for the full routing map.

| Skill | Workspace | When to invoke |
|---|---|---|
| `idl-core` | `core/` | IDL parsing, AST nodes, `LanguageWriter` |
| `idl-runner` | `runner/` | Pipeline orchestration, SDK stages, `runner m3` |
| `idl-arkgen` | `arkgen/` | ArkUI peers, Arkoala, libace, C++ modifiers |
| `idl-arkgen-config` | `arkgen/generation-config/` | `config.json`, `transformOnSerialize` |
| `idl-libohos` | `libohos/` | Printers, serializers, peer-gen infrastructure |
| `idl-etsgen` | `etsgen/` | `.d.ts` / `.d.ets` → IDL conversion |

## Glossary

Terms marked (*) appear in source code, config files, or IDL files.

**Stack / platform**

- `ArkUI` — OpenHarmony's declarative UI framework; primary codegen target.
- `OHOS` — OpenHarmony OS; the runtime platform.
- `ArkTS` — TypeScript dialect for OHOS apps; some codegen targets it.
- `Arkoala` — multi-language ArkUI runtime project; flavors
  (`arkoala`, `arkoala-arkts`, `arkoala-cj`, `arkoala-java`,
  `arkoala-kotlin`) live under `external/` and consume generated peers.
- `libace` — ArkUI native engine; C++ modifiers plug into it.
- `panda SDK` — pinned native VM/runtime toolchain; see
  `.claude/skills/INSTRUCTION.md` for `PANDA_SDK_VERSION` and install steps.
- `koalaui` (*) — upstream UI runtime library imported as `@koalaui/*`
  by generated peers and `libohos/templates/`.

**File formats**

- `.d.ts` — TypeScript declaration file; primary input from
  `interface_sdk-js`.
- `.d.ets` — ArkTS declaration extension; parsed like `.d.ts`.
- `.idl` — idlize's intermediate representation between declarations and
  generated code.

**Pipeline commands and flags**

- `dts2peer` (*) — end-to-end workflow: `.d.ts` → IDL → peer code.
- `dts2idl` (*) — first stage only: `.d.ts` / `.d.ets` → IDL.
- `m3` (*) — the main `runner` sub-command driving the full pipeline.
- `--sdk-stage` (*) — selects SDK input phase: `original | prepared | idl`.
- `--target` (*) — selects codegen output: `sig | libace | all`.

**Codegen concepts**

- `peer` (*) — generated class mirroring an ArkUI component's API surface.
- `modifier` (*) — generated C++ libace object applying property changes to
  a framenode at runtime.
- `serializer` (*) — generated code encoding property values for IPC calls.
- `materialized` (*) — component with a fully generated peer (not a stub);
  controlled in `generation-config/config.json`.
- `hook` (*) — code-gen callback injected at a printer phase
  (e.g. `applyAttributesFinish`); configured in `config.json`.
- `attributeDeclaration` (*) — IDL AST node for a component attribute;
  key for hook class lookup in `arkgen/src/printers/ComponentsPrinter.ts`.
- `framenode` (*) — native ArkUI tree node targeted by a modifier.
- `interop-types` (*) — shared C++ type header bridging ArkTS and C++.

## Non-negotiable rules

- **Invoke the matching `idl-*` skill before non-trivial work.**
  The skill carries per-workspace detail not duplicated here.
- **Do not edit generated output:** `out/`, `build/`, `bundled/`, `lib/`
  (when adjacent to a `src/`), `*.tgz` — these are pipeline products.
- **Do not hand-edit `interface_sdk-js/`** — it is a vendored upstream
  submodule; patch via `sdk-patched/` or `sdk-patched-arkts/` instead.
- **Regenerate via `runner m3`** (see `.claude/skills/INSTRUCTION.md`) after any
  pipeline-affecting change; do not claim done from code review of
  generators alone — verify generated output.
- **For architecture deep-dives**, read `doc/DESIGN.md`,
  `doc/SERIALIZATION.md`, `doc/CALLBACKS.md` as relevant to the task
  at hand.

## Setup & deeper docs

For environment setup, regeneration commands, and bundle publishing,
read `.claude/skills/INSTRUCTION.md` — setup details are not duplicated
here.

For architecture deep-dives, read the relevant file under `doc/`:

- `doc/DESIGN.md` — overall architecture and design decisions.
- `doc/SERIALIZATION.md` — serialization protocol and value encoding.
- `doc/CALLBACKS.md` — callback and event binding patterns.

Read those when the task calls for it; do not skip them on the assumption
that this file covers the same ground.
