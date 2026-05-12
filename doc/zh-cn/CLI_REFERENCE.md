# CLI 参数参考

本文档提供了 IDLize 三个主要工具（**runner**、**arkgen** 和 **etsgen**）
所接受的所有命令行参数的综合参考。

---

## 目录

- [1. runner](#1-runner)
  - [m3](#命令-m3)
  - [complete](#命令-complete)
  - [sdk](#命令-sdk)
  - [m3-sdk](#命令-m3-sdk)
  - [sdk-new-shape](#命令-sdk-new-shape)
  - [transform-builder-functions](#命令-transform-builder-functions)
- [2. arkgen](#2-arkgen)
- [3. etsgen](#3-etsgen)
- [4. 常用模式](#4-常用模式)

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
| `--etsgen-options-file <file>` | string | - | etsgen 配置文件路径 |
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

## 2. arkgen

ArkUI Component Generator。从 IDL 定义生成 ArkTS peer、C++ libace modifier
和 Arkoala 绑定。调用方式如下：

```bash
arkgen [options]
# 或
node /path/to/arkgen [options]
```

### 输入 / 输出

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--input-dir <path>` | string | - | 输入目录路径（多个以逗号分隔） |
| `--aux-input-dir <path>` | string | - | 辅助输入目录路径（多个以逗号分隔） |
| `--base-dir <path>` | string | `--input-dir` | IDL 模块打包的基础目录（多个以逗号分隔）。省略时默认为 `--input-dir` |
| `--output-dir <path>` | string | `./out` | 输出目录 |
| `--input-files <files...>` | string[] | - | 要处理的特定文件（逗号分隔）。支持 `@response-file.txt` 语法处理大文件列表 |
| `--aux-input-files <files...>` | string[] | - | 要处理的特定辅助文件（逗号分隔） |

### 操作模式

| 选项 | 描述 |
|--------|-------------|
| `--dts2peer` | 将 `.d.ts` 转换为 peer 草稿。**已弃用** -- 请改用 `dtsgen --dts2idl` 后跟 `--idl2peer` |
| `--ets2ts` | 将 `.ets` 转换为 `.ts` |
| `--idl2peer` | 将 IDL 转换为 peer 草稿 |
| `--show-config-schema` | 打印生成器配置的 JSON 模式并退出 |

### 语言和格式

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--language <lang>` | `ts \| arkts \| cangjie` | `ts` | 输出语言 |
| `--arkts-extension <ext>` | string | `.ts` | 生成的 ArkTS 文件的扩展名 |

### 代码生成

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--generator-target <target>` | `all \| arkoala \| libace \| none` | `all` | 生成输出的目标框架 |
| `--arkoala-destination <path>` | string | - | Arkoala 仓库的位置（用于复制 peer） |
| `--libace-destination <path>` | string | - | libace 仓库的位置（用于复制 peer） |
| `--copy-peers-components <names...>` | string[] | - | 要复制的特定组件列表。省略则复制全部 |
| `--only-integrated` | flag | `false` | 仅生成可集成到目标中的文件 |
| `--no-commented-code` | flag | `false` | 不在 modifier 中生成被注释掉的代码 |
| `--api-prefix <string>` | string | - | 用于兼容手动 Arkoala 实现的 C++ 前缀 |
| `--api-version <version>` | number | `9999` | 生成 peer 的 API 版本 |
| `--default-idl-package <name>` | string | - | 生成的 IDL 的默认包名 |
| `--library-packages <packages>` | string | - | 要包含在库中的包列表（逗号分隔） |

### 原生桥接和互操作

| 选项 | 类型 | 描述 |
|--------|------|-------------|
| `--native-bridge-path <path>` | string | 原生桥接文件路径 |
| `--interop-bridges <string>` | string | 生成互操作桥接宏 |
| `--interop-types <path>` | string | `interop-types.h` 文件路径 |

### 组件和属性选项

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--attribute-modifier-hooks` | flag | `false` | 为组件属性 modifier 方法生成 hook |
| `--use-memo-m3` | flag | `false` | 生成带有 `@memo` 注解和 `@ComponentBuilder` 函数的代码 |
| `--use-component-optional` | flag | `false` | 使所有组件属性可空 |
| `--no-component-named-overloads` | flag | `false` | 禁用组件的命名重载 |

### 测试和验证

| 选项 | 类型 | 描述 |
|--------|------|-------------|
| `--verify-idl` | flag | 使用 linter 验证生成的 IDL |
| `--test-interface <name>` | string | 要测试的接口（逗号分隔） |
| `--test-method <name>` | string | 要测试的方法（逗号分隔） |
| `--test-property <name>` | string | 要测试的属性（逗号分隔） |

### 文档和调试

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--docs <mode>` | `all \| opt \| none` | - | 文档处理方式：包含全部、优化或跳过 |
| `--disable-enum-initializers` | flag | - | 不在生成的接口中包含枚举成员初始值 |
| `--verbose` | flag | - | 启用详细处理输出 |
| `--dump-serialized` | flag | - | 转储序列化数据用于调试 |
| `--call-log` | flag | - | 启用调用日志 |
| `--enable-log` | flag | - | 启用常规日志 |
| `--version` | flag | - | 打印版本并退出 |

### 配置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--reference-names <string>` | string | `dts` | 引用映射模式：`ets` 表示 ArkTS 引用，`dts` 表示 TypeScript 引用，或自定义配置文件路径 |
| `--plugin <file>` | string | - | 生成器插件文件路径 |
| `--options-file <path...>` | string[] | - | 配置选项文件路径。除非设置了 `--ignore-default-config`，否则追加到默认配置 |
| `--ignore-default-config` | flag | `false` | 与 `--options-file` 一起使用时，覆盖默认配置而非追加 |

### 子集和预定义

| 选项 | 描述 |
|--------|-------------|
| `--no-subset` | 不从外部仓库或 `external-subset` 目录复制子集文件 |
| `--no-implicit-predefined` | 从生成器输入中移除预定义文件 |
| `--no-arkgen-dummy-impl` | 不生成 `dummy_impl.cc` 和 `real_impl.cc` 测试文件 |

### 遗留选项

| 选项 | 描述 |
|--------|-------------|
| `--common-to-attributes` | 将通用属性转换为 IDL 属性 |

#### 示例

```bash
# 从 IDL 生成 Arkoala peer
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --generator-target arkoala \
  --language arkts \
  --api-version 12

# 生成 libace C++ modifier
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --generator-target libace \
  --interop-types ./interop-types.h

# 显示配置模式
arkgen --show-config-schema

# 使用自定义配置生成
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --options-file ./custom-config.json \
  --ignore-default-config \
  --verbose
```

---

## 3. etsgen

`.d.ts` / `.d.ets` 到 IDL Converter。将 TypeScript 和 ArkTS 声明文件转换为 IDL 定义。
调用方式如下：

```bash
etsgen [options]
# 或
node /path/to/etsgen [options]
```

### 核心选项

| 选项 | 类型 | 描述 |
|--------|------|-------------|
| `--ets2idl` | flag | 将 `.d.ts` / `.d.ets` 文件转换为 IDL 定义 |

### 输入 / 输出

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--input-dir <path>` | string | - | 输入目录路径（多个以逗号分隔） |
| `--exclude <patterns>` | string | - | 要从输入目录扫描中排除的路径 |
| `--base-dir <path>` | string | `--input-dir` | IDL 模块打包的基础目录（多个以逗号分隔）。省略时默认为 `--input-dir` |
| `--output-dir <path>` | string | - | 输出目录 |
| `--input-files <files...>` | string[] | - | 要处理的特定文件（逗号分隔）。支持 `@response-file.txt` 语法处理大文件列表 |

### 处理

| 选项 | 类型 | 描述 |
|--------|------|-------------|
| `--verify-idl` | flag | 验证生成的 IDL |
| `--docs <mode>` | `all \| opt \| none` | 文档处理方式：包含全部、优化或跳过 |

### 配置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `--options-file <path...>` | string[] | - | 生成器配置选项文件路径。除非设置了 `--ignore-default-config`，否则追加到默认配置 |
| `--ignore-default-config` | flag | `false` | 与 `--options-file` 一起使用时，覆盖默认配置而非追加 |
| `--ets-config <path>` | string | `<etsgen-root>/config.json` | ETS 配置文件路径 |

### 调试

| 选项 | 类型 | 描述 |
|--------|------|-------------|
| `--trace-status <filename>` | string | 向生成的 IDL 添加跟踪信息，并将状态保存到指定文件 |
| `--version` | flag | 打印版本并退出 |

#### 示例

```bash
# 将 .d.ts 转换为 IDL
etsgen --ets2idl \
  --input-dir ./sdk/api \
  --output-dir ./idl

# 使用验证和自定义配置进行转换
etsgen --ets2idl \
  --input-dir ./sdk \
  --output-dir ./out/idl \
  --verify-idl \
  --options-file ./etsgen-config.json

# 使用响应文件转换特定文件
etsgen --ets2idl \
  --input-files @response-file.txt \
  --output-dir ./idl
```

---

## 4. 常用模式

### 完整管线：SDK 到 peer

```bash
# 步骤 1：准备 SDK
node runner -- sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts

# 步骤 2：运行 m3 管线
node runner -- m3 ./out/patched-sdk-arkts ./custom.idl \
  --output ./out \
  --sdk-stage prepared \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper-config.json \
  --target all \
  --language arkts

# 生成输出放置在 ./out/peers/sig/ 和 ./out/peers/libace/ 中
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

### 独立运行 arkgen

直接运行 arkgen，无需 runner 编排器：

```bash
cd arkgen && npm run compile
node . --idl2peer \
  --input-dir ../interfaces \
  --output-dir ../out/peers \
  --generator-target arkoala \
  --language arkts \
  --api-version 12
```

### 独立运行 etsgen

直接运行 etsgen 将声明转换为 IDL：

```bash
cd etsgen && npm run compile
node . --ets2idl \
  --input-dir ../sdk/api \
  --output-dir ../out/idl \
  --verify-idl
```

### 使用响应文件处理大量输入

arkgen 和 etsgen 都支持使用响应文件传递大文件列表：

```bash
# 创建列出 IDL 文件的响应文件
find ./idl -name "*.idl" > files.txt

# 使用 @ 前缀的响应文件
arkgen --idl2peer \
  --input-files @files.txt \
  --output-dir ./out
```

### 检查和自定义配置

```bash
# 打印 arkgen 配置的 JSON 模式
arkgen --show-config-schema

# 使用自定义配置并覆盖默认值
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --options-file ./my-config.json \
  --ignore-default-config
```
