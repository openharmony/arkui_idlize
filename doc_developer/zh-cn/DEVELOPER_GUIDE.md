# IDLize 开发者指南

本指南面向维护 IDLize 生成器和管线的工具开发者。读完后，应能够判断：

- IDLize 在 ArkUI 代码生成链路中负责什么。
- 一次标准生成经过哪些阶段。
- 不同类型的改动应从哪个 workspace 入手。
- 如何定位生成结果偏离预期的阶段。
- 改完代码后需要执行哪些验证。

如果只是使用 IDLize 生成代码，请先阅读
[工具使用者指南](../../doc/zh-cn/USER_GUIDE.md)。更完整的设计说明见
[架构设计](ARCHITECTURE.md)。

## 1. 项目定位

IDLize 是面向 OpenHarmony ArkUI 的编译期生成器工具。它读取 `.d.ets`、`.idl`
以及管线中仍需兼容的 `.d.ts` 声明，转换为 IDL 中间表示和 AST，然后生成：

- ArkTS 层 Peer / Component 类。
- C++ 层 Modifier。
- ArkTS 层和 C++ 层之间的类型转换、回调和 Serializer 代码。
- Arkoala 运行时消费的多语言接口和胶水代码。

主线管线可以概括为：

```text
SDK declarations / handwritten IDL
  -> etsgen converts declarations to .idl
  -> core parses .idl to IDL AST
  -> arkgen and libohos print target code
  -> runner installs generated output
```

## 2. 第一次搭建环境

在仓库根目录执行基础安装：

```bash
npm i --no-save /path/to/ace_ets2bundle/libarkts.tgz
```

libarkts 压缩包必须由 `ace_ets2bundle` 提供；其余 npm 依赖从已配置的 registry
安装。

编译主生成管线并下载 SDK：

```bash
cd runner
npm run compile
cd ..
npm run download:sdk
```

仓库安装和打包不再依赖 git 子模块。在 OpenHarmony 部件构建中，
`idlize_bundle` GN 目标从 `ace_ets2bundle` 获取 libarkts 和 Panda SDK，
两项依赖都不会写入源码树。

运行标准生成：

```bash
bash generate.sh
```

安装后的输出位于 `./out`，中间产物位于 `runner/out`。

## 3. 目录和改动入口

| 目录 | 主要职责 | 常见改动 |
|---|---|---|
| `core/` | IDL AST、parser、`LanguageWriter`、共享 peer 模型。 | 新增 IDL 语法、类型节点、诊断或目标语言 writer 行为。 |
| `etsgen/` | `.d.ts` / `.d.ets` 到 `.idl` 的转换。 | 修复声明到 IDL 的映射、泛型/联合/可选类型转换。 |
| `arkgen/` | ArkUI 组件代码生成。 | 修改 Peer、Component、Modifier、Arkoala 接口输出。 |
| `arkgen/generation-config/` | 组件 materialization、hook、类型转换配置。 | 调整生成范围或特殊组件生成策略。 |
| `libohos/` | 共享 printer、serializer、peer 基础设施。 | 多目标共用生成逻辑、序列化和 native module 绑定。 |
| `runner/` | `runner m3`、SDK 准备、安装输出、CLI。 | 调整管线阶段、参数、输出目录或安装规则。 |
| `sdk-patched/` | 上游 TypeScript SDK 声明 patch。 | 修补 `.d.ts` 输入；不要直接改 `interface_sdk-js/`。 |
| `sdk-patched-arkts/` | 上游 ArkTS SDK 声明 patch。 | 修补 `.d.ets` 输入。 |
| `interfaces/` | 额外手写 IDL 定义。 | 增加补充组件或手写接口。 |
| `linter/` / `idlinter/` | 声明和 IDL 检查规则。 | 新增或调整 lint 规则。 |
| `dtsgen/` | 从 IDL 反向生成 `.d.ts`。 | 维护反向生成能力。 |
| `scraper/` | SDK 抓取、缓存和规范化。 | 调整外部 SDK 内容处理。 |

不要手工修改生成产物：`out/`、`runner/out/`、`build/`、`bundled/`、`*.tgz`，以及与
`src/` 相邻的 `lib/`。

## 4. 核心概念

**IDL**
IDLize 的中间接口语言。`etsgen` 将 SDK 声明转换为 `.idl`，`core` 将 `.idl`
解析为 AST。下游生成器应依赖 AST，而不是重新理解 TypeScript 或 ArkTS 声明。

**AST**
`core/src/idl/node.ts` 定义的树形数据结构。常见节点包括 `IDLFile`、
`IDLInterface`、`IDLMethod`、`IDLProperty`、`IDLCallback`、`IDLTypedef` 和各种
`IDLType`。

**FrameNode**
ArkUI C++ 层组件节点，表示 UI 树中的一个组件实例。生成的 C++ Modifier 最终把属性
变化应用到对应 FrameNode。

**Peer**
IDLize 生成的 ArkTS 层类，用于暴露组件属性和方法，并把调用转发到 C++ 侧。

**Modifier**
IDLize 生成的 C++ 层 struct / 对象，用于把属性变化传递给 FrameNode。

**Serializer**
IDLize 生成的编码/解码逻辑，用于 ArkTS 和 C++ 之间的参数、回调和类型转换。
新增类型或修改跨语言参数形态时，必须确认 Serializer 和类型转换保持一致。

**materialized**
完整生成 Peer / Component / Modifier 的组件或接口。是否 materialized 主要由
`arkgen/generation-config/config.json` 控制。

**hook**
在生成阶段插入定制逻辑的配置机制。常用于某个组件或属性需要特殊生成代码，但不适合
大范围改 printer 的场景。

## 5. 标准生成流程

`generate.sh` 调用：

```bash
node runner m3 sdk-patched-arkts ./interfaces/interfaces/arkui-extra/ \
    --sdk-stage prepared \
    --arkgen-options-file ./arkgen/generation-config/config.json \
    --etsgen-options-file ./etsgen/generator-config.json \
    --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
    --scraper-options-file ./runner/configs/scraper-config.json \
    --arkgen "node arkgen" --etsgen "node etsgen" \
    --target all \
    --no-arkgen-dummy-impl \
    --output "./out"
```

关键阶段：

1. `runner/src/main.ts` 中的 `m3` 命令清理并创建 `runner/out`。
2. `sdkStage=prepared` 时，`etsgen` 将 `sdk-patched-arkts/` 转换为 `.idl`。
3. `scraper` 根据 `runner/configs/scraper-config.json` 处理 IDL 输入和额外 IDL。
4. `arkgen` 读取 IDL，构建 `ArkoalaPeerLibrary`，并运行各类 printer。
5. `runner` 将生成输出安装到 `./out`。

调试生成结果时按产物链路反向排查：

| 要确认什么 | 看哪里 |
|---|---|
| 安装后的最终输出是否正确 | `out/` |
| printer 实际生成了什么 | `runner/out/peers/sig/`、`runner/out/peers/libace/` |
| parser 收到的 IDL 是否正确 | `runner/out/idl/` |
| SDK 输入是否被正确准备 | `runner/out/patched-sdk-arkts/`、`runner/out/patched-sdk-ts/` |
| 输出目录常量是否与预期一致 | `runner/src/shared.ts` |

## 6. 核心代码入口

### 6.1 `runner/`：管线编排

| 文件 | 作用 |
|---|---|
| `runner/src/main.ts` | 定义 `m3`、`complete`、`sdk`、`m3-sdk` 等命令。 |
| `runner/src/shared.ts` | 定义 `runner/out` 下各阶段输出目录。 |
| `runner/src/commands/ets2idl.ts` | 调用 `etsgen` 生成 IDL。 |
| `runner/src/commands/idl2peer.ts` | 调用 `arkgen` 生成 peer 和 modifier。 |
| `runner/src/commands/sdk.ts` | 准备 patched SDK。 |
| `runner/src/commands/scrape.ts` | 处理并合并 IDL 输入。 |
| `runner/src/commands/install.ts` | 安装生成结果到目标目录。 |

### 6.2 `etsgen/`：声明到 IDL

| 文件 | 作用 |
|---|---|
| `etsgen/src/app.ts` | CLI 入口，处理 `--ets2idl`、输入目录和配置文件。 |
| `etsgen/src/generate.ts` | 声明转换核心逻辑。 |
| `etsgen/src/config.ts` | etsgen 配置加载。 |
| `etsgen/generator-config.json` | 标准管线使用的转换配置。 |

如果 `runner/out/idl/` 已经不符合预期，优先检查 `etsgen` 和 SDK patch。

### 6.3 `core/`：IDL AST 和语言抽象

| 文件 | 作用 |
|---|---|
| `core/src/from-idl/parser.ts` | 将 `.idl` 文本解析为 AST。 |
| `core/src/idl/node.ts` | 定义 AST 节点和扩展属性。 |
| `core/src/idl/builders.ts` | AST 节点构造函数。 |
| `core/src/idl/discriminators.ts` | AST 类型守卫。 |
| `core/src/idl/utils.ts` | AST 查询和辅助操作。 |
| `core/src/LanguageWriters/LanguageWriter.ts` | 目标语言无关的代码写入抽象。 |
| `core/src/LanguageWriters/writers/` | TS、ArkTS、C++、CangJie 等目标语言 writer。 |
| `core/src/LanguageWriters/convertors/` | IDL 类型到目标语言类型的转换器。 |
| `core/src/peer-generation/` | 共享 peer 模型、引用解析和布局基础设施。 |

新增 IDL 语法或 AST 节点时，通常需要同时检查 parser、builder、visitor、
discriminator 和所有下游生成器。

### 6.4 `arkgen/`：ArkUI 代码生成

| 文件 | 作用 |
|---|---|
| `arkgen/src/app.ts` | CLI 入口，解析 `--idl2peer` 并加载配置和 IDL。 |
| `arkgen/src/arkoala.ts` | 组织 Arkoala 和 libace 输出。 |
| `arkgen/src/ArkoalaPeerLibrary.ts` | ArkUI 生成使用的 peer library。 |
| `arkgen/src/printers/ComponentsPrinter.ts` | 生成组件类和属性 setter。 |
| `arkgen/src/printers/PeersPrinter.ts` | 生成 Peer 类。 |
| `arkgen/src/printers/ModifierPrinter.ts` | 生成 C++ Modifier。 |
| `arkgen/src/printers/ArkoalaInterfacePrinter.ts` | 生成 Arkoala 接口声明。 |
| `arkgen/generation-config/config.json` | 标准生成配置。 |
| `arkgen/generation-config/schema.json` | 生成配置 schema。 |

如果生成文件结构正确但某个组件方法不对，通常从相关 printer 和
`generation-config/config.json` 查起。

### 6.5 `libohos/`：共享生成基础设施

| 文件或目录 | 作用 |
|---|---|
| `libohos/src/peer-generation/printers/` | 共享 printer：接口、声明、peer、native module、serializer 等。 |
| `libohos/src/peer-generation/ComponentsCollector.ts` | 收集组件声明。 |
| `libohos/src/peer-generation/PeersCollector.ts` | 收集和组织 Peer 类。 |
| `libohos/src/peer-generation/ImportsCollector.ts` | 管理生成文件的 import。 |
| `libohos/src/peer-generation/LayoutManager.ts` | 决定生成文件放置位置。 |
| `libohos/src/peer-generation/NativeModule.ts` | native module 绑定描述。 |
| `libohos/src/ost/`、`libohos/src/ostgen/` | 对象序列化模板和生成辅助设施。 |

如果多个目标出现类似问题，不要只在 `arkgen` 局部修；先判断是否应该修改
`libohos` 的共享 printer、collector 或 serializer。

## 7. 常见开发任务

| 任务 | 起点 | 验证方式 |
|---|---|---|
| 改 ArkUI 组件 Peer / Component 生成 | `arkgen/src/printers/ComponentsPrinter.ts`、`PeersPrinter.ts` | `npm run -C arkgen test`，再运行 `bash generate.sh` 对比 `runner/out/peers/`。 |
| 改 C++ Modifier 生成 | `arkgen/src/printers/ModifierPrinter.ts` 或 `libohos/src/peer-generation/printers/ModifierPrinter.ts` | 生成 `--target libace` 或运行标准 `generate.sh`。 |
| 改 `.d.ets` / `.d.ts` 到 IDL 转换 | `etsgen/src/generate.ts` | `npm run -C etsgen test`，检查 `runner/out/idl/`。 |
| 新增 IDL 语法或类型节点 | `core/src/idl/node.ts`、`core/src/from-idl/parser.ts` | `npm run -C core test`，再跑下游生成。 |
| 改生成配置字段 | `arkgen/generation-config/schema.json`、`arkgen/src/config.ts` | `npm run -C arkgen generate-schema`，再跑标准生成。 |
| 改主流程参数或目录 | `runner/src/main.ts`、`runner/src/shared.ts` | `npm run -C runner compile`，再跑 `bash generate.sh`。 |
| 修补上游 SDK 声明 | `sdk-patched/` 或 `sdk-patched-arkts/` | `npm run download:sdk` 或 `bash generate.sh`，检查 IDL 差异。 |

## 8. 编译和验证命令

常用编译：

```bash
npm run -C core compile
npm run -C etsgen compile
npm run -C arkgen compile
npm run -C libohos compile
npm run -C runner compile
```

常用测试和检查：

```bash
npm run -C core test
npm run -C etsgen test
npm run -C arkgen test
npm run sanity
```

标准端到端生成：

```bash
bash generate.sh
```

打包：

```bash
npm run bundle
```

该命令向 `./bundled` 写入六个 idlizer 包。在 OpenHarmony 构建中，请构建
`//foundation/arkui/idlize:idlize_bundle`；隔离工作副本位于
`target_gen_dir`，校验后的产物写入 `$root_out_dir/arkui_idlize`。

## 9. 提交前检查清单

- 修改了代码生成逻辑：已重新运行 `bash generate.sh`，并检查 `runner/out/peers/`。
- 修改了 IDL 解析或 AST：已运行 `npm run -C core test`，并确认下游生成没有异常。
- 修改了 `etsgen`：已检查 `runner/out/idl/` 的变化。
- 修改了 `arkgen` 或 `libohos`：已检查 ArkTS / C++ 输出和 Serializer 变化。
- 修改了 SDK 声明：没有直接修改 `interface_sdk-js/`，而是修改 patch 目录。
- 修改了 README 或文档：中文和英文入口保持同步。
- 没有提交生成目录、bundle、tgz 或 vendored SDK 目录中的直接改动。
