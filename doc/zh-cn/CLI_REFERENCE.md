# IDLize CLI 参考

本文档面向需要直接调用 `runner` 的 IDLize 工具使用者和生成器开发者。标准生成流程
优先使用仓库根目录的 `bash generate.sh`；需要自定义 SDK 阶段、输入 IDL 或输出目标时，
再直接调用 `runner`。

## 1. 调用形式

从仓库根目录执行：

```bash
node runner <command> [options]
```

`runner` 使用 `commander` 定义命令，命令实现位于 `runner/src/main.ts`。

## 2. `m3`

```bash
node runner m3 <sdk-path> <idl-files...> [options]
```

`m3` 是主生成管线，负责 SDK 准备、声明到 IDL、scrape、IDL 到 peer 生成、格式化和
输出安装。

### 位置参数

| 参数 | 必需 | 说明 |
|---|---|---|
| `<sdk-path>` | 是 | SDK 目录路径。`--sdk-stage=prepared` 时传已准备 SDK；`idl` 阶段可传占位 SDK 路径。 |
| `<idl-files...>` | 是 | 一个或多个额外 IDL 文件或目录。 |

### 选项

| 选项 | 默认值 | 说明 |
|---|---|---|
| `--output <path>` | 必需 | 安装生成文件的输出目录。 |
| `--sdk-stage <stage>` | 必需 | `original`、`prepared` 或 `idl`。 |
| `--arkgen-options-file <file>` | 必需 | `arkgen` 生成配置路径。 |
| `--arkgen-interop-types <file>` | 必需 | `interop-types.h` 路径。 |
| `--scraper-options-file <file>` | 必需 | scraper 配置路径。 |
| `--etsgen-options-file <file>` | `original` / `prepared` 阶段必需 | `etsgen` 转换配置路径；`idl` 阶段不使用。 |
| `--etsgen <executable>` | `npx etsgen` | `etsgen` 可执行命令；`idl` 阶段忽略。 |
| `--arkgen <executable>` | `npx arkgen` | `arkgen` 可执行命令。 |
| `--target <target>` | `sig` | 生成目标：`sig`、`libace` 或 `all`。 |
| `--language <language>` | `arkts` | 输出语言：`ts` 或 `arkts`。 |
| `--no-arkgen-dummy-impl` | 关闭时生成测试实现 | 不生成 `dummy_impl.cc` 和 `real_impl.cc` 测试文件。 |

### 标准示例

```bash
node runner m3 sdk-patched-arkts ./interfaces/interfaces/arkui-extra/ \
    --sdk-stage prepared \
    --arkgen-options-file ./arkgen/generation-config/config.json \
    --etsgen-options-file ./etsgen/generator-config.json \
    --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
    --scraper-options-file ./runner/configs/scraper-config.json \
    --arkgen "node arkgen" \
    --etsgen "node etsgen" \
    --target all \
    --no-arkgen-dummy-impl \
    --output "./out"
```

### 仅从 IDL 生成

```bash
node runner m3 ./sdk ./my-component.idl \
  --output ./out \
  --sdk-stage idl \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
  --scraper-options-file ./runner/configs/scraper-config.json \
  --target all
```

## 3. `complete`

```bash
node runner complete <sdk-path> [options]
```

使用 `ohosgen` 管线从完整 SDK 生成 peer，是 `m3` 之外的生成路径。

| 选项 | 默认值 | 说明 |
|---|---|---|
| `--ohosgen-config <file>` | 必需 | `ohosgen` 配置路径。 |
| `--sdk-stage <stage>` | 必需 | `original`、`prepared` 或 `idl`。 |
| `--etsgen <executable>` | `npx etsgen` | `etsgen` 可执行命令；`idl` 阶段忽略。 |
| `--ohosgen <executable>` | `npx ohosgen` | `ohosgen` 可执行命令。 |
| `--target <target>` | `sig` | 生成目标：`sig`、`libace` 或 `all`。 |
| `--language <language>` | `arkts` | 输出语言：`ts` 或 `arkts`。 |

示例：

```bash
node runner complete ./sdk \
  --ohosgen-config ./ohosgen-config.json \
  --sdk-stage prepared \
  --target all
```

## 4. `sdk`

```bash
node runner sdk <sdk-path> <prepared-sdk-12> <prepared-sdk-11>
```

准备 SDK，但不运行代码生成。

| 参数 | 说明 |
|---|---|
| `<sdk-path>` | 原始 SDK 目录路径。 |
| `<prepared-sdk-12>` | API 12 prepared SDK 输出路径。 |
| `<prepared-sdk-11>` | API 11 prepared SDK 输出路径。 |

示例：

```bash
node runner sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts
```

## 5. `m3-sdk`

```bash
node runner m3-sdk <prepared-sdk-12> <absolute-prepared-sdk-12> [options]
```

生成适合 peer 链接使用的绝对路径 SDK。

| 选项 | 说明 |
|---|---|
| `--original-sdk` | 将第一个参数视为原始 SDK，并先执行准备流程。 |

示例：

```bash
node runner m3-sdk ./out/patched-sdk-arkts ./out/absolute-sdk
```

## 6. SDK 形态转换命令

### `sdk-new-shape`

```bash
node runner sdk-new-shape <path>
```

通过转换 builder 函数创建新的 SDK 形态。

### `transform-builder-functions`

```bash
node runner transform-builder-functions <api-path>
```

在预处理后的 SDK API 目录中转换组件 builder 函数。

## 7. 输出位置

| 场景 | 输出 |
|---|---|
| `m3 --target sig` | 将 `runner/out/peers/sig/` 安装到 `--output`。 |
| `m3 --target libace` | 将 `runner/out/peers/libace/` 安装到 `--output`。 |
| `m3 --target all` | 将整个 `runner/out/peers/` 安装到 `--output`，通常包含 `sig/` 和 `libace/`。 |
| 中间 IDL | `runner/out/idl/`。 |
| 中间 peer 输出 | `runner/out/peers/`。 |

## 8. 常用模式

### SDK 到完整生成输出

```bash
node runner sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts

node runner m3 ./out/patched-sdk-arkts ./custom.idl \
  --output ./out \
  --sdk-stage prepared \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --etsgen-options-file ./etsgen/generator-config.json \
  --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
  --scraper-options-file ./runner/configs/scraper-config.json \
  --target all \
  --language arkts
```

### 快速定位参数定义

命令参数的权威定义在 `runner/src/main.ts`。如果本文档与源码不一致，以源码为准。
