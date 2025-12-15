# AST Viewers

Tools for visualizing AST files.

### Display Modes

The enhanced viewer (`enhanced-ast-viewer.ts`) supports optional flags that control the tree details:
- `--metadata` — adds a second line with node metadata (ranges, flags, etc.).
- `--tokens` — adds a second line with a compact list of syntax tokens.
- `--full` — shortcut for `--metadata --tokens` (default output is code-only with the node kind shown in parentheses).

## Standard AST Viewer

Tool for visualizing standard TypeScript AST files.

### Features

- **Pseudographic tree** - visual representation of AST structure
- **Detailed information** - complete data about each node (positions, text, flags, modifiers)
- **File and code support** - analysis of both files and code directly

### Launch Commands

### File Analysis
```bash
# From project root
npx ts-node tools/ast_viewer/standard-ast-viewer.ts path/to/file.ts

# Examples
npx ts-node tools/ast_viewer/standard-ast-viewer.ts libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts
npx ts-node tools/ast_viewer/standard-ast-viewer.ts /absolute/path/to/file.ts
```

### Direct Code Analysis
```bash
npx ts-node tools/ast_viewer/standard-ast-viewer.ts --code "const x = 42;"
npx ts-node tools/ast_viewer/standard-ast-viewer.ts --code "function test() { return 42; }"
npx ts-node tools/ast_viewer/standard-ast-viewer.ts --code "export interface MyInterface { prop: string; }"
```

### Using Launch Scripts
```bash
cd tools/ast_viewer
./view-standart-file.sh   # reads the file configured inside the script
./view-standart-code.sh   # runs against the inline snippet from the script
```

## Enhanced AST Viewer

Tool for visualizing our Enhanced AST with additional metadata and syntax tokens.

### Features

- **Pseudographic tree** - visual representation of Enhanced AST structure
- **Detailed information** - complete data about each node including metadata
- **File and code support** - analysis of both files and code directly
- **Syntax tokens** - displays `syntaxTokens` array (hybrid AST + CST v0.7.0)
- **Extended metadata** - all node properties displayed inline
- **Compact format** - tokens displayed inline for better readability

### Launch Commands

#### File Analysis
```bash
# From project root
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts path/to/file.ts

# Examples
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts /absolute/path/to/file.ts
```

#### Direct Code Analysis
```bash
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "const x = 42;"
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "function test() { return 42; }"
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "export interface MyInterface { prop: string; }"
```

#### Using Launch Scripts
```bash
cd tools/ast_viewer
./view-enhanced-file.sh                 # analyze code loaded from file (default ./test01.ets)
./view-enhanced-file.sh --metadata      # same code with an extra metadata line per node
./view-enhanced-file.sh --tokens        # same code with an extra tokens line
./view-enhanced-file.sh --full --code "..."  # full mode for inline code
./view-enhanced-code.sh --metadata      # inline snippet + metadata
./view-enhanced-code.sh --tokens        # inline snippet + tokens
```

## Output Format

1. **Header** – file information (name, size, snippet)
2. **Tree structure** – pseudographic representation of the Enhanced AST
3. **Node information** – optional second line per node depending on flags:
   - Metadata: type, ranges, modifiers, flags, etc.
   - `syntaxTokens`: compact list of tokens with escaped text

### Example Output

```
└── "export class MyClass { private field: string; }"
    (metadata: { indent: 0, textLen: 47, type: SourceFile, pos: 0-47, children: 2 } | tokens: [...])
    ├── "export class MyClass { private field: string; }"
    │   (metadata: { indent: 0, textLen: 47, type: ClassDeclaration, modifiers: [ExportKeyword], children: 3 } | tokens: [{type: KEYWORD, text: "export"}, ...])
```

## Usage Examples

### Simple variable
```bash
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "const x = 42;"
```

### Function with parameters
```bash
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "function test(a: string): number { return 42; }"
```

### Export with modifier
```bash
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts --code "export const x = 42;"
```

### Large file analysis
```bash
npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts
```

## Useful Tips

- For large files the output can be very long – redirect to a file:
  ```bash
  npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts file.ts > ast-output.txt
  ```
- To inspect only the top of the tree, pipe through `head`:
  ```bash
  npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts file.ts | head -50
  ```
- To search for specific nodes, combine with `grep`:
  ```bash
  npx ts-node tools/ast_viewer/enhanced-ast-viewer.ts file.ts | grep "InterfaceDeclaration"
  ```