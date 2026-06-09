# IDLize部件

<p><img align="bottom" src="artwork/logo.svg" alt="IDLize logo" width="100"/></p>

[English](README.md)

## 简介

IDLize是面向OpenHarmony ArkUI生态的编译器工具链，用于读取接口声明文件
（`.d.ts`、`.d.ets`、`.idl`）并生成原生绑定代码。生成产物包括ArkTS peer类、
C++ libace modifier，以及ArkUI组件框架使用的序列化代码。

本仓库属于ArkUI框架子系统，提供IDL转换、解析、代码生成和管线编排工具，
用于为ArkUI生成面向ArkTS、Cangjie等目标语言的桥接层代码。更多ArkUI框架子系统
相关概念，请参考
[ArkUI框架子系统README](https://gitcode.com/openharmony/docs/blob/master/zh-cn/readme/ArkUI%E6%A1%86%E6%9E%B6%E5%AD%90%E7%B3%BB%E7%BB%9F.md)。

本仓库文档主要面向IDLize工具开发者，用于为生成器增加能力、维护管线，或排查
生成结果。本仓库的工具使用者是把IDLize用于ArkUI绑定流程的ArkUI系统开发者，
可以从[作为工具使用IDLize](#作为工具使用idlize)开始阅读。

### 核心概念

**Arkoala**
Arkoala是多语言ArkUI运行时项目，用于消费IDLize生成的绑定代码。本仓库中与
Arkoala相关的产物包括peer接口、语言绑定，以及面向ArkTS、Cangjie等目标的
序列化胶水代码。

**framenode**
原生ArkUI树节点，表示运行时UI树中的一个组件实例。它保存属性、布局和渲染所需
的原生状态。

**peer**
生成的应用层类，镜像ArkUI组件的API接口。Peer暴露组件的属性和方法，并把对应
framenode的更新转发到原生侧。

**modifier**
生成的C++ libace对象，在运行时将属性变更应用到framenode。Modifier接收序列化
后的setter数据，并将其转换为ArkUI原生调用。

**serializer**
生成的代码，用于为进程间通信（IPC）调用编码属性值。Serializer将IDL表示中的
类型值转换为适合跨越ArkTS/C++边界的线路格式。

**materialized**
组件的peer根据IDL定义完整生成，而不是只生成stub。Materialization通过
`arkgen/generation-config/config.json`逐组件控制。未被materialized的组件仅生成
最小stub。

### 架构

![idlize_architecture_zh](doc/img/idlize_architecture_zh.png)

图1 IDLize架构图

IDLize使用如下管线：

1. `scraper/`拉取并规范化外部SDK内容。
2. `etsgen/`将`.d.ts`和`.d.ets`声明转换为`.idl`。
3. `core/`解析IDL文件并构建IDL抽象语法树（AST）。
4. `arkgen/`和`libohos/`遍历AST，输出ArkTS peer、C++ libace modifier、
   serializer和Arkoala胶水代码。
5. `runner/`将生成结果安装到目标目录。

## 目录

仓库根目录包含以下关键目录：

```text
/arkui_idlize
├── arkgen                 # ArkUI组件peer生成器和生成配置
├── arktscgen              # ArkTS专用代码生成路径
├── artwork                # 文档使用的项目图形资源
├── core                   # IDL AST、parser、LanguageWriter、配置和诊断
├── doc                    # 工具使用者文档
├── doc_developer          # 工具开发者文档
├── dtsgen                 # 从IDL反向生成.d.ts声明
├── etsgen                 # .d.ts/.d.ets到IDL的转换器
├── external               # 工具链使用的外部依赖
├── idlinter               # IDL检查规则
├── interface_sdk-js       # 上游SDK子模块，只读
├── interfaces             # 下游消费的接口定义包
├── libohos                # 共享printer、serializer和peer基础设施
├── linter                 # .d.ts/.d.ets声明检查规则
├── ohosgen                # OHOS目标生成器和集成示例
├── runner                 # 端到端管线编排器和m3命令
├── scraper                # SDK抓取、缓存和规范化工具
├── sdk-patched            # 修补后的上游TypeScript SDK声明
├── sdk-patched-arkts      # 修补后的上游ArkTS SDK声明
└── tools                  # 仓库搭建、SDK下载和发布工具
```

`out/`、`build/`、`bundled/`，以及与`src/`相邻的`lib/`等生成目录是管线产物，
不要手工修改。

## 约束

- 使用Node.js 18或更高版本。当前验证过的命令行环境使用Node.js 18。
- 除非步骤明确切换目录，否则从仓库根目录执行命令。
- 安装或编译依赖前，先初始化子模块。
- 编译完整管线前，使用`PANDA_SDK_VERSION=1.5.0-dev.58082`准备
  `external/libarkts`。
- 不要手工修改`interface_sdk-js/`；如需修补上游声明，请通过`sdk-patched/`
  或`sdk-patched-arkts/`处理。
- 任何影响管线输出的变更，都需要执行`bash generate.sh`重新生成。

## 编译构建/使用方法

### 构建开发环境

1. 克隆子模块并安装根目录依赖。

```bash
git submodule update --init
npm i
cd external
npm i
cd ..
```

2. 准备`libarkts`，使ArkTS相关生成器可以编译。

```bash
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../..
```

3. 编译管线入口。

```bash
cd runner
npm run compile
cd ..
```

4. 下载并准备标准生成流程使用的SDK输入。

```bash
npm run download:sdk
```

以上命令无错误完成后，开发环境即准备完成。

### 运行标准生成流程

在仓库根目录运行标准管线：

```bash
bash generate.sh
```

安装后的生成输出位于`./out`目录；管线中间产物位于`runner/out`。当生成代码与
源声明或IDL结构不一致时，可以认为“不符合预期”，例如组件、方法或属性缺失；参数
类型、可选标记或返回类型错误；目标文件未生成；或生成的ArkTS/C++代码编译失败。

定位偏离阶段时，请按产物链路反向检查：

1. 先在`out/`中确认安装后产物的现象。
2. 对比`runner/out/peers/sig/`或`runner/out/peers/libace/`中的中间peer输出，
   确认生成API形态是否符合预期。
3. 检查`runner/out/idl/`，确认parser实际接收到的IDL内容。
4. 如果IDL已经错误，继续检查`runner/out/patched-sdk-arkts/`、
   `runner/out/patched-sdk-ts/`和`runner/out/scraper/`等更早的暂存目录。

### 常见问题与排查

| 现象 | 检查项 | 处理方法 |
|---|---|---|
| `node`或`npm`报版本或语法错误 | 在仓库根目录执行`node -v`。 | 使用Node.js 18或更高版本；必要时重新安装依赖。 |
| 依赖安装失败 | 确认子模块已初始化，且安装命令在正确目录执行。 | 执行`git submodule update --init`，再分别在仓库根目录和`external/`执行`npm i`。如果npm无法下载包，检查网络或代理配置。 |
| `external/libarkts`找不到panda SDK | 确认命令在`external/libarkts`目录执行，并带有要求的`PANDA_SDK_VERSION`。 | 执行`PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall`，然后执行`npm run compile`。 |
| 生成结果缺少预期API | 对比`out/`、`runner/out/peers/`和`runner/out/idl/`。 | 确认源声明已进入SDK补丁或额外IDL输入，然后重新执行`bash generate.sh`。 |

### 开发管线变更

1. 先确定变更由哪个workspace负责。

| 变更内容 | Workspace |
|---|---|
| IDL parser、AST、`LanguageWriter` | `core/` |
| `.d.ts`或`.d.ets`到IDL的转换 | `etsgen/` |
| ArkUI peer生成和生成配置 | `arkgen/` |
| 共享printer、serializer、peer基础设施 | `libohos/` |
| 端到端管线编排 | `runner/` |
| 声明检查 | `linter/`、`idlinter/` |

2. 编译受影响的workspace；如果变更跨越多个管线阶段，可以通过`runner`编译。

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

## 说明

### 接口说明

IDLize通过npm workspace包提供命令行工具。

| 工具 | 包或workspace | 功能 |
|---|---|---|
| Peer Generator | `arkgen` | 从IDL定义生成ArkTS peer、C++ libace modifier和Arkoala绑定。 |
| IDL Converter | `etsgen` | 将`.d.ts`和`.d.ets`声明转换为IDL格式。 |
| Pipeline Runner | `runner` | 通过`m3`编排SDK准备、IDL转换、抓取、peer生成和输出安装。 |
| 声明检查工具 | `linter`、`idlinter` | 验证`.d.ts`、`.d.ets`和`.idl`声明。 |
| IDL Generator | `dtsgen` | 从IDL定义生成`.d.ts`声明。 |

命令参数和示例请参考[工具使用者指南](doc/zh-cn/USER_GUIDE.md)、
[CLI参考](doc/zh-cn/CLI_REFERENCE.md)和[IDL规范](doc/zh-cn/IDL_SPEC.md)。

### 作为工具使用IDLize

工具使用者通常提供SDK声明或手写IDL，运行管线，然后消费生成的ArkTS/C++绑定代码。

```bash
bash generate.sh
```

如果需要自定义生成流程，可以使用`runner m3`指定SDK阶段、生成目标、输出路径和
配置文件。常见工作流请参考[工具使用者指南](doc/zh-cn/USER_GUIDE.md)。

## 文档

### 工具开发者文档

| 文档 | 说明 |
|---|---|
| [工具开发者指南](doc_developer/zh-cn/DEVELOPER_GUIDE.md) | 面向工具开发者的环境搭建、开发流程、核心概念和代码导览。 |
| [架构设计](doc_developer/zh-cn/ARCHITECTURE.md) | 管线架构和各工作区职责。 |

### 工具使用者文档

| 文档 | 说明 |
|---|---|
| [工具使用者指南](doc/zh-cn/USER_GUIDE.md) | IDLize工具使用者工作流：初始生成、新接口、参数变更。 |
| [CLI参考](doc/zh-cn/CLI_REFERENCE.md) | `runner`的参数和用法。 |
| [IDL规范](doc/zh-cn/IDL_SPEC.md) | IDL语言语法、类型和扩展属性。 |

## 相关仓

[ArkUI框架子系统](https://gitcode.com/openharmony/docs/blob/master/zh-cn/readme/ArkUI%E6%A1%86%E6%9E%B6%E5%AD%90%E7%B3%BB%E7%BB%9F.md)

[arkui_ace_engine](https://gitcode.com/openharmony/arkui_ace_engine)

[arkui_ace_engine_lite](https://gitcode.com/openharmony/arkui_ace_engine_lite)

[arkui_napi](https://gitcode.com/openharmony/arkui_napi)

[**arkui_idlize**](https://gitcode.com/openharmony-sig/arkui_idlize)
