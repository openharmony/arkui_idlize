# <p> <img align="bottom" src="artwork/logo.svg" alt="logo" width="100"/> IDLize <p/>

[English](README.md)

## IDLize 是什么

IDLize 是面向 OpenHarmony/ArkUI 生态的编译器工具链，用于读取接口声明文件
（`.d.ts`、`.d.ets`、`.idl`）并生成原生绑定代码。生成的产物包括 ArkTS peer 类、
C++ libace modifier，以及 ArkUI 组件框架的序列化代码。

本仓库的对外文档主要面向 IDLize 工具开发者：为生成器增加能力、维护管线、
或排查生成结果的人。只需要运行 IDLize 生成代码的工具使用者，可以从
[作为工具使用 IDLize](#作为工具使用-idlize) 开始阅读。

## 工具开发者环境搭建

**步骤 1：克隆并安装**

```bash
git submodule update --init
npm i
cd external && npm i && cd ..
```

**步骤 2：准备 libarkts**

```bash
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../..
```

**步骤 3：编译管线**

```bash
cd runner && npm run compile && cd ..
```

**步骤 4：下载并准备 SDK**

```bash
npm run download:sdk
```

完成以上步骤后，本地环境即可编译管线并运行标准生成流程。

## 开发代码流程

1. 先确定变更由哪个 workspace 负责。

| 变更内容 | Workspace |
|---|---|
| IDL parser、AST、`LanguageWriter` | `core/` |
| `.d.ts` / `.d.ets` 到 IDL 的转换 | `etsgen/` |
| ArkUI peer 生成和生成配置 | `arkgen/` |
| 共享 printer、serializer、peer 基础设施 | `libohos/` |
| 端到端管线编排 | `runner/` |
| 声明检查 | `linter/`、`idlinter/` |

2. 编译受影响的 workspace；如果变更跨越多个管线阶段，可以通过 `runner`
   编译。

```bash
npm run -C core compile
npm run -C etsgen compile
npm run -C arkgen compile
npm run -C runner compile
```

3. 运行与变更匹配的测试或检查。

```bash
npm run -C core test
npm run -C etsgen test
npm run -C arkgen test
npm run sanity
```

4. 任何影响管线输出的变更，都需要重新生成。

```bash
bash generate.sh
```

安装后的生成输出位于 `./out` 目录；管线中间产物位于 `runner/out`。如果生成代码
不符合预期，请从 `out/` 回溯到 `runner/out/peers/`，再检查
`runner/out/idl/`，定位是哪一个阶段开始偏离。

不要手工修改生成目录，例如 `out/`、`build/`、`bundled/`，以及与 `src/`
相邻的 `lib/`。

## 架构

```mermaid
graph TD
    subgraph "1. IDL Core"
        etsgen["etsgen<br/>.d.ts / .d.ets → .idl"]
        parser["IDL Parser<br/>core/"]
        etsgen -->|"生成 .idl"| parser
    end

    subgraph "2. ArkUI Generator"
        arkgen["arkgen<br/>组件 peer 生成"]
    end

    subgraph "3. Generator Core"
        libohos["libohos<br/>printer、serializer"]
        writer["language writer<br/>ArkTS / C++ / CangJie"]
        libohos --> writer
    end

    input[".d.ts / .d.ets / .idl"] --> etsgen
    parser -->|"IDL AST"| arkgen
    arkgen --> libohos
    writer --> peers["ArkTS Peers"]
    writer --> modifiers["C++ modifier"]
    writer --> serializers["serializer"]
```

## 核心概念

**peer**
一个生成的类，镜像了 ArkUI 组件的 API 接口。每个 peer 封装一个原生
framenode，并将组件的属性和方法暴露给应用层。

**modifier**
一个生成的 C++ 对象，在运行时将属性变更应用到 framenode。Modifier 在
ArkTS peer 层和原生 ArkUI 渲染引擎之间搭建桥梁，将属性 setter 转换为
原生调用。

**serializer**
生成的代码，用于为进程间通信（IPC）调用编码属性值。Serializer 将 IDL
表示中的类型值转换为适合跨越 ArkTS/C++ 边界的线路格式。

**framenode**
一个原生 ArkUI 树节点，是 modifier 的运行时目标。UI 树中的每个可见组件
都对应一个 framenode；modifier 和 peer 操作 framenode 以更新属性、布局
和渲染状态。

**materialized**
一个组件，其 peer 是根据 IDL 定义完整生成的，而非 stub。
Materialization 通过 `arkgen/generation-config/config.json` 逐组件控制。
未被 materialized 的组件仅生成最小的 stub。

## 作为工具使用 IDLize

工具使用者通常提供 SDK 声明或手写 IDL，运行管线，然后消费生成的 ArkTS/C++
绑定代码。

```bash
bash generate.sh
```

如果需要自定义生成流程，可以使用 `runner m3` 指定 SDK 阶段、生成目标、输出路径
和配置文件。参见 [工具使用者指南](doc/zh-cn/USER_GUIDE.md)、
[CLI 参考](doc/zh-cn/CLI_REFERENCE.md) 和 [IDL 规范](doc/zh-cn/IDL_SPEC.md)。

## 工具

**Peer Generator**（`arkgen`）-- 从 IDL 定义生成 ArkTS peer、C++ libace modifier
和 Arkoala 绑定。主要模式：`--idl2peer`。参见
[工具使用者指南](doc/zh-cn/USER_GUIDE.md)。

**IDL Converter**（`etsgen`）-- 将 `.d.ts` 和 `.d.ets` 声明转换为 IDL 格式。
主要模式：`--ets2idl`。

**Pipeline Runner**（`runner`）-- 通过 `m3` 命令编排端到端生成管线，依次执行
SDK 准备、IDL 转换、抓取、peer 生成和输出安装。参见
[CLI 参考](doc/zh-cn/CLI_REFERENCE.md)。

**代码检查工具** -- `.d.ts` 检查工具（`@idlizer/linter`）和 `.idl` 检查工具
（`@idlizer/idlinter`）用于验证接口声明的质量和正确性。

**IDL Generator**（`dtsgen`）-- 从 IDL 定义生成 `.d.ts` 声明（与 `etsgen`
相反的方向）。

## 文档

### 工具开发者文档

| 文档 | 说明 |
|------|------|
| [工具开发者指南](doc_developer/zh-cn/DEVELOPER_GUIDE.md) | 面向新手工具开发者的环境搭建、开发流程、核心概念和代码导览 |
| [架构设计](doc_developer/zh-cn/ARCHITECTURE.md) | 管线架构和各工作区职责 |

### 工具使用者文档

| 文档 | 说明 |
|------|------|
| [工具使用者指南](doc/zh-cn/USER_GUIDE.md) | IDLize 工具使用者工作流：初始生成、新接口、参数变更 |
| [CLI 参考](doc/zh-cn/CLI_REFERENCE.md) | runner 的参数和用法 |
| [IDL 规范](doc/zh-cn/IDL_SPEC.md) | IDL 语言语法、类型、扩展属性 |
