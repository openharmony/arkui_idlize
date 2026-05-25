# CLI 参数参考

本文档提供了 IDLize **runner** 命令行工具所有参数的综合参考。

---

## 目录

- [1. runner](#1-runner)
  - [m3](#命令-m3)
  - [complete](#命令-complete)
  - [sdk](#命令-sdk)
  - [m3-sdk](#命令-m3-sdk)
  - [sdk-new-shape](#命令-sdk-new-shape)
  - [transform-builder-functions](#命令-transform-builder-functions)
- [2. 常用模式](#2-常用模式)

---

## 1. runner

runner 是顶层管线编排器。它使用 `commander` 库，调用方式如下：

```bash
node runner -- <command> [options]
```

### 命令：`m3`

```
node runner -- m3 <sdk-path> <idl-files...>
```

使用 m3 管线生成 peer：SDK 准备、ETS 到 IDL 转换、scrape，以及 IDL 到 peer 生成。

#### 位置参数

| 参数 | 类型 | 必需 | 描述 |
|----------|------|----------|-------------|
| `<sdk-path>` | string | 是 | SDK 目录路径 |
| `<idl-files...>` | string[] | 是 | 一个或多个额外 IDL 文件路径 |

#### 选项

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--output <path>` | string | （必需） | 生成文件的输出路径 |
| `--sdk-stage <stage>` | `original \| prepared \| idl` | （必需） | SDK 处理阶段。`original`：从原始 SDK 开始；`prepared`：从已准备的 SDK 开始；`idl`：直接从 IDL 文件开始 |
| `--arkgen-options-file <file>` | string | （必需） | arkgen 配置文件路径 |
| `--arkgen-interop-types <file>` | string | （必需） | interop-types.h 文件路径 |
| `--scraper-options-file <file>` | string | （必需） | scraper 配置文件路径 |
| `--etsgen-options-file <file>` | string | `original` / `prepared` 阶段必需 | etsgen 配置文件路径。`--sdk-stage=idl` 时不使用 |
| `--etsgen <executable>` | string | `npx etsgen` | etsgen 可执行文件路径。当 `--sdk-stage=idl` 时忽略 |
| `--arkgen <executable>` | string | `npx arkgen` | arkgen 可执行文件路径 |
| `--target <target>` | `sig \| libace \| all` | `sig` | 生成目标 |
| `--language <language>` | `ts \| arkts` | `arkts` | 输出语言 |
| `--no-arkgen-dummy-impl` | flag | - | 不生成 `dummy_impl.cc` 和 `real_impl.cc` 测试文件 |

#### 示例

```bash
# 从原始 SDK 运行完整管线
node runner -- m3 ./sdk ./custom.idl \
  --output ./out \
  --sdk-stage original \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --etsgen-options-file ./etsgen/generator-config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper.json

# 仅从 IDL 文件（跳过 SDK 准备和 ets2idl）
node runner -- m3 ./sdk ./my-component.idl \
  --output ./out \
  --sdk-stage idl \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper.json \
  --target all
```

---

### 命令：`complete`

```
node runner -- complete <sdk-path>
```

使用 ohosgen 管线从完整 SDK 生成 peer（`m3` 的替代方案）。

#### 位置参数

| 参数 | 类型 | 必需 | 描述 |
|----------|------|----------|-------------|
| `<sdk-path>` | string | 是 | SDK 目录路径 |

#### 选项

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--ohosgen-config <file>` | string | （必需） | ohosgen 配置文件路径 |
| `--sdk-stage <stage>` | `original \| prepared \| idl` | （必需） | SDK 处理阶段 |
| `--etsgen <executable>` | string | `npx etsgen` | etsgen 可执行文件路径。当 `--sdk-stage=idl` 时忽略 |
| `--ohosgen <executable>` | string | `npx ohosgen` | ohosgen 可执行文件路径 |
| `--target <target>` | `sig \| libace \| all` | `sig` | 生成目标 |
| `--language <language>` | `ts \| arkts` | `arkts` | 输出语言 |

#### 示例

```bash
node runner -- complete ./sdk \
  --ohosgen-config ./ohosgen-config.json \
  --sdk-stage prepared \
  --target all
```

---

### 命令：`sdk`

```
node runner -- sdk <sdk-path> <prepared-sdk-12> <prepared-sdk-11>
```

通过克隆、打补丁和处理 API 文件来准备 SDK。
生成 API 版本 12 和 API 版本 11 的已准备 SDK 输出。

#### 位置参数

| 参数 | 类型 | 必需 | 描述 |
|----------|------|----------|-------------|
| `<sdk-path>` | string | 是 | 原始 SDK 目录路径 |
| `<prepared-sdk-12>` | string | 是 | 已准备 SDK（API 12）的输出路径 |
| `<prepared-sdk-11>` | string | 是 | 已准备 SDK（API 11）的输出路径 |

#### 示例

```bash
node runner -- sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts
```

---

### 命令：`m3-sdk`

```
node runner -- m3-sdk <prepared-sdk-12> <absolute-prepared-sdk-12>
```

准备一个适合链接 peer 的 SDK。生成一个使用绝对路径重写导入的"绝对" SDK。

#### 位置参数

| 参数 | 类型 | 必需 | 描述 |
|----------|------|----------|-------------|
| `<prepared-sdk-12>` | string | 是 | 已准备 SDK（API 12）路径 |
| `<absolute-prepared-sdk-12>` | string | 是 | 绝对 SDK 的输出路径 |

#### 选项

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--original-sdk` | flag | - | 将第一个参数视为需要先准备的原始 SDK |

#### 示例

```bash
node runner -- m3-sdk ./out/patched-sdk-arkts ./out/absolute-sdk
```

---

### 命令：`sdk-new-shape`

```
node runner -- sdk-new-shape <path>
```

通过转换 builder 函数创建新的 SDK 形态。

#### 位置参数

| 参数 | 类型 | 必需 | 描述 |
|----------|------|----------|-------------|
| `<path>` | string | 是 | 要转换的 SDK 目录路径 |

---

### 命令：`transform-builder-functions`

```
node runner -- transform-builder-functions <api-path>
```

在预处理后的 SDK API 目录中转换组件 builder 函数。

#### 位置参数

| 参数 | 类型 | 必需 | 描述 |
|----------|------|----------|-------------|
| `<api-path>` | string | 是 | SDK API 目录路径 |

---

## 2. 常用模式

### 完整管线：SDK 到 peer

```bash
# 步骤 1：准备 SDK
node runner -- sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts

# 步骤 2：运行 m3 管线
node runner -- m3 ./out/patched-sdk-arkts ./custom.idl \
  --output ./out \
  --sdk-stage prepared \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --etsgen-options-file ./etsgen/generator-config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper-config.json \
  --target all \
  --language arkts

# 安装后的输出位于 ./out/sig/ 和 ./out/libace/。
# 管线中间产物仍保留在 runner/out/peers/ 下。
```

### 仅从 IDL 快速生成

当已有 IDL 文件时，跳过 SDK 准备和 ETS 到 IDL 转换：

```bash
node runner -- m3 ./sdk ./my-component.idl \
  --output ./out \
  --sdk-stage idl \
  --arkgen-options-file ./config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper.json
```
