# IDLize 开发者指南

本指南面向刚开始维护 IDLize 的工具开发者。读完后，你应该能知道：

- IDLize 解决什么问题。
- 一次生成流程经过哪些阶段。
- 常见改动应该从哪个 workspace 入手。
- 核心源码文件大致负责什么。
- 改完代码后如何编译、生成和验证。

更完整的架构说明见 [架构设计](ARCHITECTURE.md)。如果你只是使用
IDLize 生成代码，请先看 [工具使用者指南](../../doc/zh-cn/USER_GUIDE.md)。

## 1. 项目一句话

IDLize 是 OpenHarmony / ArkUI 生态的接口代码生成工具链。它读取
`.d.ts`、`.d.ets` 或 `.idl` 接口声明，经过 IDL 中间表示和 AST，生成：

- ArkTS / TypeScript peer 类。
- C++ libace modifier。
- Arkoala 运行时需要的绑定、类型转换和序列化胶水代码。

主线管线可以概括为：

```text
SDK declarations / handwritten IDL
  -> etsgen converts declarations to .idl
  -> core parses .idl to IDL AST
  -> arkgen and libohos print target code
  -> runner installs generated output
```

## 2. 第一次搭建环境

在仓库根目录执行：

```bash
git submodule update --init
npm i
cd external && npm i && cd ..
```

准备 `libarkts` 和 panda SDK：

```bash
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../..
```

编译主生成管线并准备 SDK：

```bash
cd runner && npm run compile && cd ..
npm run download:sdk
```

运行标准生成：

```bash
bash generate.sh
```

标准输出在 `./out`，中间产物在 `runner/out`。

## 3. 先知道这些目录

| 目录 | 你什么时候会改它 |
|---|---|
| `core/` | 改 IDL AST、IDL parser、类型节点、`LanguageWriter`、共享 peer 模型。 |
| `etsgen/` | 改 `.d.ts` / `.d.ets` 到 `.idl` 的转换逻辑。 |
| `arkgen/` | 改 ArkUI 组件 peer、C++ modifier、Arkoala 绑定的生成行为。 |
| `arkgen/generation-config/` | 调整哪些组件 materialized、hook、类型转换等生成配置。 |
| `libohos/` | 改共享 printer、serializer、peer 基础设施和语言工具。 |
| `runner/` | 改 `runner m3` 管线、SDK 准备、安装输出、命令参数。 |
| `sdk-patched/` / `sdk-patched-arkts/` | 修补上游 SDK 声明。不要直接改 `interface_sdk-js/`。 |
| `interfaces/` | 放置或维护额外的手写 IDL 定义。 |
| `linter/` / `idlinter/` | 改 `.d.ts` / `.idl` 检查规则。 |
| `dtsgen/` | 从 IDL 反向生成 `.d.ts`。 |
| `scraper/` | 拉取、缓存或规范化外部 SDK 内容。 |

不要手工修改生成产物：`out/`、`runner/out/`、`build/`、`bundled/`、以及与
`src/` 相邻的 `lib/`。

## 4. 核心概念

**IDL**

IDLize 的中间接口语言。`etsgen` 会把 SDK 声明转换为 `.idl`，`core` 再把
`.idl` 解析为 AST。下游生成器只应该依赖 AST，而不是重新理解 TypeScript。

**AST**

`core/src/idl/node.ts` 定义的树形数据结构。常见节点包括 `IDLFile`、
`IDLInterface`、`IDLMethod`、`IDLProperty`、`IDLCallback`、`IDLTypedef` 和
各种 `IDLType`。

**peer**

生成出来的组件封装类，镜像 ArkUI 组件 API。peer 把应用侧调用连接到原生
framenode 和 native module 调用。

**modifier**

生成出来的 C++ 对象，用来把属性变更应用到 ArkUI 原生 framenode。

**serializer**

生成出来的类型编码/解码逻辑，用来让 ArkTS/TypeScript 和 C++ 两侧交换参数。
当新增类型或改变跨语言参数形态时，通常要检查 serializer 和类型转换是否一致。

**materialized**

完整生成 peer 的组件或接口。是否 materialized 主要由
`arkgen/generation-config/config.json` 控制。

**hook**

在生成阶段插入定制逻辑的配置机制。常见场景是在不大改 printer 的前提下，
为某个组件或属性补充特殊生成代码。

## 5. 一次生成流程怎样跑

`generate.sh` 是标准入口，它实际调用：

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

1. `runner/src/main.ts` 的 `m3` 命令清理并创建 `runner/out`。
2. `sdkStage` 为 `prepared` 时，`etsgen` 把 `sdk-patched-arkts/` 转成 `.idl`。
3. `scraper` 根据 `runner/configs/scraper-config.json` 处理输入 IDL。
4. `arkgen` 读取 IDL、构建 `ArkoalaPeerLibrary`，运行各类 printer。
5. `runner` 把生成输出安装到 `./out`。

调试生成结果时，按这个顺序回溯：

| 要确认什么 | 看哪里 |
|---|---|
| 最终安装产物是否正确 | `out/` |
| printer 实际生成了什么 | `runner/out/peers/sig/`、`runner/out/peers/libace/` |
| parser 收到的 IDL 是否正确 | `runner/out/idl/` |
| SDK 输入是否被正确准备 | `runner/out/patched-sdk-arkts/`、`runner/out/patched-sdk-ts/` |

## 6. 核心代码入口

### 6.1 `runner/`：管线怎么串起来

| 文件 | 作用 |
|---|---|
| `runner/src/main.ts` | 定义 `m3`、`sdk`、`m3-sdk` 等命令；`m3` 是主生成流程。 |
| `runner/src/shared.ts` | 定义 `runner/out` 下各阶段输出目录。 |
| `runner/src/commands/ets2idl.ts` | 调用 `etsgen` 生成 IDL。 |
| `runner/src/commands/idl2peer.ts` | 调用 `arkgen` 生成 peer 和 modifier。 |
| `runner/src/commands/sdk.ts` | 准备 patched SDK。 |
| `runner/src/commands/install.ts` | 安装生成结果到目标目录。 |

如果你要加管线参数、改阶段顺序、调整输出路径，先看 `runner/src/main.ts`
和 `runner/src/shared.ts`。

### 6.2 `etsgen/`：声明怎么变成 IDL

| 文件 | 作用 |
|---|---|
| `etsgen/src/app.ts` | CLI 入口，处理 `--ets2idl`、输入目录、配置文件。 |
| `etsgen/src/generate.ts` | 转换核心逻辑。 |
| `etsgen/src/config.ts` | etsgen 配置加载。 |
| `etsgen/generator-config.json` | 标准管线使用的转换配置。 |

如果 `runner/out/idl/` 中的 IDL 已经不对，优先查 `etsgen` 或 SDK patch。

### 6.3 `core/`：IDL AST 和语言抽象

| 文件 | 作用 |
|---|---|
| `core/src/from-idl/parser.ts` | 把 `.idl` 文本解析为 AST。 |
| `core/src/idl/node.ts` | AST 节点和扩展属性定义。 |
| `core/src/idl/builders.ts` | AST 节点构造函数。 |
| `core/src/idl/discriminators.ts` | AST 类型守卫。 |
| `core/src/idl/utils.ts` | AST 查询和辅助操作。 |
| `core/src/LanguageWriters/LanguageWriter.ts` | 目标语言无关的代码写入抽象。 |
| `core/src/LanguageWriters/writers/` | TS、ArkTS、C++、CangJie、Kotlin writer。 |
| `core/src/LanguageWriters/convertors/` | IDL 类型到目标语言类型的转换器。 |
| `core/src/peer-generation/` | 共享 peer 模型、引用解析和布局基础设施。 |

如果要新增 IDL 语法或 AST 节点，通常从 `node.ts`、parser、builder、visitor、
discriminator 开始，然后检查所有生成器是否需要理解新节点。

### 6.4 `arkgen/`：ArkUI 代码怎么生成

| 文件 | 作用 |
|---|---|
| `arkgen/src/app.ts` | CLI 入口；解析 `--idl2peer` 等参数，加载配置和 IDL。 |
| `arkgen/src/arkoala.ts` | 组织 Arkoala 和 libace 两类输出。 |
| `arkgen/src/ArkoalaPeerLibrary.ts` | ArkUI 生成使用的 peer library。 |
| `arkgen/src/printers/ComponentsPrinter.ts` | 生成组件类和属性 setter。 |
| `arkgen/src/printers/PeersPrinter.ts` | 生成 peer 类。 |
| `arkgen/src/printers/ModifierPrinter.ts` | 生成 C++ modifier。 |
| `arkgen/src/printers/ArkoalaInterfacePrinter.ts` | 生成 Arkoala 接口声明。 |
| `arkgen/generation-config/config.json` | 标准生成配置。 |
| `arkgen/generation-config/schema.json` | 生成配置 schema。 |

如果生成的 ArkTS/C++ 文件结构对，但某个组件方法不对，通常从对应 printer
和 `generation-config/config.json` 查起。

### 6.5 `libohos/`：共享生成基础设施

| 文件或目录 | 作用 |
|---|---|
| `libohos/src/peer-generation/printers/` | 共享 printer：接口、声明、peer、native module、serializer 等。 |
| `libohos/src/peer-generation/ComponentsCollector.ts` | 收集组件声明。 |
| `libohos/src/peer-generation/PeersCollector.ts` | 收集和组织 peer 类。 |
| `libohos/src/peer-generation/ImportsCollector.ts` | 管理生成文件的 import。 |
| `libohos/src/peer-generation/LayoutManager.ts` | 决定生成文件放在哪里。 |
| `libohos/src/peer-generation/NativeModule.ts` | native module 绑定描述。 |
| `libohos/src/ost/`、`libohos/src/ostgen/` | 对象序列化模板和生成辅助设施。 |

如果多个生成目标有类似问题，不要只在 `arkgen` 局部修；先判断是否应该改
`libohos` 的共享 printer 或 collector。

## 7. 常见开发任务从哪里开始

| 任务 | 起点 | 验证方式 |
|---|---|---|
| 改某个 ArkUI 组件的 peer 生成 | `arkgen/src/printers/ComponentsPrinter.ts`、`PeersPrinter.ts` | `npm run -C arkgen test`，然后 `bash generate.sh` 对比 `runner/out/peers/`。 |
| 改 C++ modifier 生成 | `arkgen/src/printers/ModifierPrinter.ts` 或 `libohos/src/peer-generation/printers/ModifierPrinter.ts` | 生成 `--target libace` 或运行标准 `generate.sh`。 |
| 改 `.d.ets` 转 IDL | `etsgen/src/generate.ts` | `npm run -C etsgen test`，检查 `runner/out/idl/`。 |
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

## 9. 开发时的判断顺序

遇到生成错误时，按管线从后往前查：

1. 最终输出缺文件或内容不对：先看 `out/`。
2. 安装阶段是否搬错：看 `runner/out/peers/` 和 `runner/src/commands/install.ts`。
3. printer 是否发射错：看 `arkgen/src/printers/` 和 `libohos/src/peer-generation/printers/`。
4. AST 是否符合预期：用 `runner/out/idl/` 对照 `core` parser 和 transformer。
5. IDL 是否从 SDK 就转换错了：查 `etsgen` 和 `sdk-patched-arkts/`。
6. 上游 SDK 内容是否有变化：不要改 `interface_sdk-js/`，在 patch 目录处理。

这个顺序能减少“在生成器里修输入问题”的误判。

## 10. 提交前检查清单

- 修改了代码生成逻辑：已重新运行 `bash generate.sh`。
- 修改了 IDL 解析或 AST：已运行 `npm run -C core test`，并确认下游生成没有异常。
- 修改了 `etsgen`：已检查 `runner/out/idl/` 的变化。
- 修改了 `arkgen` 或 `libohos`：已检查 `runner/out/peers/` 的变化。
- 修改了 README 或用户文档：中英文入口保持一致。
- 没有手工提交生成目录、bundle、tgz 或 vendored SDK 子模块中的直接改动。
