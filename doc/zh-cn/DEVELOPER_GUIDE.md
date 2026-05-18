# IDLize 开发者工作流指南

本指南面向 ArkUI 开发者，介绍如何使用 IDLize 工具链以 IDL 格式定义组件接口，
并为 OpenHarmony / ArkUI 生态系统生成 native bindings 代码。

完整的 IDL 语言规范请参见 [IDL_SPEC.md](IDL_SPEC.md)。
架构细节请参见 [ARCHITECTURE.md](ARCHITECTURE.md)。

---

## 前提条件

在生成代码之前，请先配置构建环境：

```bash
# 克隆并安装依赖
git submodule update --init
npm install
cd external && npm install && cd ..

# 准备 libarkts
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../../

# 编译所有工作区
cd runner && npm run compile && cd ..

# 下载 SDK
npm run download:sdk
```

---

## 场景 1：从零开始创建新组件

本场景将演示如何定义一个名为 `MyButton` 的全新 ArkUI 组件，
运行管线，并集成生成的输出代码。

### 1.1 定义 IDL 接口

创建一个新的 `.idl` 文件。文件必须以 `package` 声明开头，
并可以导入其他 IDL 包中的类型。

```idl
package arkui.component.mybutton;

import arkui.component.units;
import arkui.component.common;

// 点击事件的回调
callback MyButtonClickCallback = void (i32 clickCount);

// 带 [Component] 扩展属性的组件接口
[Component]
interface MyButton {
    constructor();

    // 属性
    attribute String label;
    attribute ResourceColor backgroundColor;
    attribute Length width;
    attribute Length height;
    attribute boolean enabled;

    // 方法（属性 setter 返回组件类型以支持链式调用）
    MyButton onClick(MyButtonClickCallback callback);
    MyButton fontSize(Length size);
    MyButton borderRadius(Length radius);
};

// 属性接口（modifier 模式的 peer）
[ComponentInterface]
interface MyButtonAttribute {
    MyButtonAttribute label(String value);
    MyButtonAttribute backgroundColor(ResourceColor color);
    MyButtonAttribute onClick(MyButtonClickCallback callback);
    MyButtonAttribute fontSize(Length size);
    MyButtonAttribute borderRadius(Length radius);
    MyButtonAttribute enabled(boolean value);
};
```

关键要点：

- `package` 将接口放置在命名空间层次结构中。
- `import` 将其他 IDL 包中的类型引入当前作用域。
- `[Component]` 将接口标记为 ArkUI 组件，使管线识别该接口并生成完整的
  peer/modifier/serializer 栈。
- `[ComponentInterface]` 标记 modifier 模式使用的属性 setter 接口。
- 属性 setter 通常返回组件类型或属性类型，以支持方法链式调用。
- 使用标准 IDL 类型（`String`、`boolean`、`i32`、`number`、`Length`、
  `ResourceColor` 等）或引用在导入包中定义的类型。

### 1.2 放置 IDL 文件

IDL 文件可以放置在以下两个位置之一：

**选项 A：`interfaces/` 目录**（推荐用于手写 IDL）。

```
interfaces/interfaces/arkui-extra/mybutton.idl
```

`interfaces/interfaces/arkui-extra/` 目录下的文件会在 `generate.sh`
将该目录作为额外 IDL 输入时自动被拾取。

**选项 B：自定义目录**，通过 `runner m3` 的 `<idl-files>` 位置参数传入。

### 1.3 配置生成

编辑 `arkgen/generation-config/config.json` 以注册组件。

默认情况下，组件不会被 materialized（仅生成 stub）。
要生成完整的 peer 和 modifier，组件不能出现在 `ignoreMaterialized` 列表中。
大多数情况下新组件默认就会被 materialized，但如果需要强制 materialize，
可以将完全限定名添加到 `forceMaterialized`：

```json
{
    "forceMaterialized": [
        "arkui.component.mybutton.MyButton",
        "arkui.component.mybutton.MyButtonAttribute"
    ]
}
```

完全限定名是包路径加上接口名称：`<package>.<InterfaceName>`。

### 1.4 运行管线

使用 `generate.sh` 进行标准运行，或直接调用 `runner m3`：

```bash
# 使用提供的脚本
bash generate.sh
```

或使用显式参数：

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
    --output "./out"
```

关键标志：

| 标志 | 用途 |
|---|---|
| `--sdk-stage prepared` | 使用已打补丁的 SDK。当直接输入 `.idl` 文件时使用 `idl`。 |
| `--arkgen-options-file` | 生成配置（`config.json`）的路径。 |
| `--etsgen-options-file` | etsgen 转换配置路径。`original` 和 `prepared` SDK 阶段需要该参数。 |
| `--arkgen-interop-types` | 共享 C++ interop 类型头文件的路径。 |
| `--scraper-options-file` | 控制处理哪些包的 scraper 配置。 |
| `--target` | `sig`（仅 ArkTS peer）、`libace`（仅 C++ modifier）或 `all`。 |

### 1.5 定位输出

运行成功后，中间产物保留在 `runner/out/` 下，选定的 peer 输出会安装到
`--output` 指定的目录：

```
out/
  sig/                            # Arkoala peer（ArkTS / TypeScript）
    arkoala-arkts/
      ...
  libace/                         # C++ libace modifier
    generated/
      ...
```

生成文件的命名约定：

| 生成产物 | 命名模式 |
|---|---|
| Peer 类 | `Ark<Component>Peer`（如 `ArkMyButtonPeer`） |
| Component 类 | `Ark<Component>Component`（如 `ArkMyButtonComponent`） |
| C++ modifier | `<Component>Modifier`（如 `MyButtonModifier`） |
| Materialized 接口实现 | `<Name>Internal`（如 `MyButtonInternal`） |
| 原生模块调用 | `ArkUIGeneratedNativeModule._<method>` |

### 1.6 集成生成的 Peer

生成的 ArkTS peer 可以在应用代码中导入和使用：

```typescript
import { ArkMyButtonComponent } from "./generated/ArkMyButtonComponent"

const button = new ArkMyButtonComponent()
button.label("Submit")
    .backgroundColor(Color.Blue)
    .fontSize(16)
    .borderRadius(8)
    .onClick((clickCount) => {
        console.log(`Clicked ${clickCount} times`)
    })
```

在原生端，当 peer 的 setter 方法通过序列化桥接被调用时，
C++ modifier 会将属性变更应用到 framenode。

### 1.7 验证输出

生成完成后，检查输出文件以确认正确性：

```bash
# 检查 peer 文件是否已生成
find out/sig -name "*MyButton*"

# 检查 C++ modifier 文件是否已生成
find out/libace -name "*MyButton*"
```

如果文件缺失或内容不正确，请沿管线阶段向前回溯排查：

1. 检查 `out/sig/` 或 `out/libace/` 中安装后的输出。
2. 检查 `runner/out/peers/sig/` 或 `runner/out/peers/libace/` 中的中间生成输出。
3. 检查 `runner/out/idl/` 中转换后的 IDL，验证解析器接收到的内容。
4. 检查生成配置（`arkgen/generation-config/config.json`），
   确认组件不在 `ignoreMaterialized` 中。

---

## 场景 2：为现有组件添加新接口

本场景涵盖为现有组件扩展新属性或方法。

### 2.1 定位 IDL 文件

管线生成的 IDL 文件放置在 `runner/out/idl/` 中。
手写或补充的 IDL 文件位于 `interfaces/interfaces/` 下。

```bash
# 查找特定组件的 IDL 文件
find runner/out/idl/ -name "*.idl" | xargs grep -l "ExistingComponent"
```

如果组件是从 `.d.ts` / `.d.ets` 声明派生的，则 IDL 由 `etsgen` 阶段生成，
存放在 `runner/out/idl/` 中。如果是手写的，请检查 `interfaces/interfaces/arkui-extra/`。

### 2.2 编辑 IDL

打开 IDL 文件，向接口中添加新的属性或方法：

```idl
package arkui.component.existing;

import arkui.component.common;
import arkui.component.units;

[Component]
interface ExistingComponent {
    // ... 已有属性和方法 ...

    // 新增：添加新属性
    attribute String tooltip;

    // 新增：添加带参数的新方法
    ExistingComponent shadow(number radius, number offsetX, number offsetY, ResourceColor color);

    // 新增：添加带可选参数的方法
    ExistingComponent animation(optional Duration duration);
};
```

向属性接口添加方法时：

```idl
[ComponentInterface]
interface ExistingComponentAttribute {
    // ... 已有 setter ...

    // 新增：tooltip 属性的 setter
    ExistingComponentAttribute tooltip(String value);

    // 新增：shadow 的 setter
    ExistingComponentAttribute shadow(number radius, number offsetX, number offsetY, ResourceColor color);
};
```

### 2.3 重新生成

重新运行管线：

```bash
bash generate.sh
```

生成器会检测 IDL 文件中的变更，并仅重新生成受影响的输出文件。

### 2.4 更新集成代码

重新生成后，新方法会出现在生成的 peer 和 modifier 类中。
更新应用代码以使用新 API：

```typescript
// 新方法在生成的组件上可用
component.tooltip("Click to submit")
    .shadow(4, 2, 2, Color.Gray)
    .animation(Duration.seconds(300))
```

### 2.5 生成方法的命名约定

生成的方法和属性名称遵循以下规则：

| IDL 声明 | 生成的 peer 方法 | 生成的 C++ modifier 方法 |
|---|---|---|
| `attribute String label` | `getLabel()`、`setLabel(value)` | `setLabel(value)` |
| `void onClick(Callback cb)` | `onClick(cb)` | `onClick(cb)` |
| `ExistingComponent shadow(...)` | `shadow(...)` 返回 `this` | `shadow(...)` |
| `static void foo()` | peer 上的 `static foo()` | 原生模块中的 `foo()` |

生成代码中的方法名称直接与 IDL 方法名称一致。
首字母不会进行大小写转换。

---

## 场景 3：修改现有接口参数

本场景涵盖更改现有方法或属性的参数，包括类型变更、可选参数和重载。

### 3.1 编辑 IDL

打开 IDL 文件并修改目标方法或属性。以下展示了几种常见的参数变更。

**添加可选参数：**

```idl
interface ExistingComponent {
    // 修改前：
    // ExistingComponent borderWidth(Length width);

    // 修改后：添加可选的 color 参数
    ExistingComponent borderWidth(Length width, optional ResourceColor color);
};
```

**更改参数类型：**

```idl
interface ExistingComponent {
    // 修改前：
    // void setData(String data);

    // 修改后：更改为序列类型
    void setData(sequence<String> data);
};
```

**使用可选参数添加重载：**

```idl
interface ExistingComponent {
    // 原始方法
    ExistingComponent padding(Length value);

    // 使用容器类型的重载
    ExistingComponent padding(record<String, Length> edges);
};
```

IDL 支持重载方法——即名称相同但参数签名不同的函数：

```idl
interface ExistingComponent {
    void resize(number width, number height);
    void resize(SizeOptions size);
};
```

### 3.2 处理向后兼容性

更改现有接口可能会破坏已生成代码的使用者。
请考虑以下准则：

- **添加可选参数**是向后兼容的。现有调用处无需修改即可继续工作。
- **更改参数类型**是破坏性变更。使用者必须更新其代码以匹配新的签名。
- **添加新重载**是向后兼容的。现有调用处仍然有效。
- **删除参数或方法**是破坏性变更。请先使用 `[Deprecated]` 扩展属性标记为已弃用：

```idl
interface ExistingComponent {
    // 将旧方法标记为已弃用
    [Deprecated]
    ExistingComponent oldMethod(String param);

    // 提供替代方法
    ExistingComponent newMethod(String param, optional i32 flags);
};
```

### 3.3 重新生成并验证

重新运行管线并检查输出：

```bash
bash generate.sh

# 验证生成的方法反映了变更
rg -n "borderWidth" out/sig runner/out/peers/sig
rg -n "setData" out/libace runner/out/peers/libace
```

检查以下内容：

- 生成的 peer 方法具有更新后的签名。
- C++ modifier 方法接受新的参数类型。
- Serializer 正确编码新的参数类型。

---

## IDL 语法快速参考

### 包和导入

```idl
package arkui.component.mycomponent;

import arkui.component.common;
import arkui.component.units.Length as Length;
```

### 带属性和方法的接口

```idl
[Entity=Class]
interface MyService {
    // 构造函数
    constructor(String name, optional i32 timeout);

    // 属性
    attribute String name;
    readonly attribute i32 id;
    [Optional] attribute String description;

    // 方法
    void start();
    boolean isRunning();
    String getStatus(optional boolean verbose);

    // 静态方法
    static MyService createDefault();
};
```

### 可选参数

```idl
void drawRect(number x, number y, number width, number height, optional ResourceColor fill);

// 可选接口属性
[Optional] attribute String tooltip;
```

### 回调

```idl
// 定义回调类型
callback OnChangeCallback = void (String newValue, i32 changeId);
callback OnErrorCallback = void (String message);

// 将回调用作方法参数或属性
interface MyComponent {
    attribute OnChangeCallback onChange;
    void setOnError(OnErrorCallback callback);
};
```

### 枚举（字典语法）

```idl
dictionary Direction {
    number UP = 0;
    number DOWN = 1;
    number LEFT = 2;
    number RIGHT = 3;
};
```

### 联合类型

```idl
// 接受多种类型的参数
void setSize((number or String or Length) value);

// 可选联合类型
void setColor(optional (ResourceColor or undefined) color);
```

### 序列和记录

```idl
void setItems(sequence<String> items);
void setMetadata(record<String, boolean> meta);
```

### 扩展属性

| 扩展属性 | 用法 | 描述 |
|---|---|---|
| `[Component]` | 用于接口 | 标记为 ArkUI 组件 |
| `[ComponentInterface]` | 用于接口 | 标记为属性 setter 接口 |
| `[Entity=Class]` | 用于接口 | 生成为带指针支持的类 |
| `[Entity=Interface]` | 用于接口 | 生成为纯接口 |
| `[Optional]` | 用于属性 | 属性可以省略 |
| `[Deprecated]` | 用于任何声明 | 标记 API 为已弃用 |
| `[Throws]` | 用于方法 | 方法可能抛出异常 |
| `[Accessor=Getter]` / `[Accessor=Setter]` | 用于属性 | 属性为访问器 |
| `[ComponentModifier]` | 用于接口 | 标记为 modifier stub |
| `[Static]` | 用于方法/属性 | 属于接口而非实例 |
| `[Documentation="..."]` | 用于任何声明 | 内联文档 |
| `[TypeParameters="T"]` | 用于接口 | 泛型类型参数声明 |
| `[TypeArguments="Foo"]` | 用于方法/属性 | 具体泛型参数 |
| `[VerbatimDts="..."]` | 用于任何声明 | 原样输出的 TypeScript 内容 |
| `[DtsName="original"]` | 用于任何声明 | 保留原始声明名称 |

### 常量

```idl
const String DEFAULT_LABEL = "OK";
const i32 MAX_RETRIES = 3;
```

### 类型别名

```idl
typedef ResourceColor = (number or String);
typedef OptionalNumber = number?;
```

---

## 文件位置参考

### 输入文件

| 内容 | 位置 |
|---|---|
| 手写 IDL 文件 | `interfaces/interfaces/arkui-extra/` |
| 生成的 IDL（来自 etsgen） | `runner/out/idl/` |
| 上游 SDK 子模块 | `interface_sdk-js/` |
| 已打补丁的 SDK（ArkTS） | `sdk-patched-arkts/` |
| 已打补丁的 SDK（TypeScript） | `sdk-patched/` |

### 生成输出

| 内容 | 位置 |
|---|---|
| 安装后的 ArkTS peer（`--target sig`） | `<--output>/` |
| 安装后的 C++ libace modifier（`--target libace`） | `<--output>/` |
| 安装后的全部输出（`--target all`） | `<--output>/sig/` 和 `<--output>/libace/` |
| 中间 peer 输出 | `runner/out/peers/` |
| 抓取的 IDL | `runner/out/scraper/` |
| 已准备的 SDK（ArkTS） | `runner/out/patched-sdk-arkts/` |
| 已准备的 SDK（TypeScript） | `runner/out/patched-sdk-ts/` |
| 响应文件 | `runner/out/response-files/` |

### 配置

| 内容 | 位置 |
|---|---|
| 生成配置 | `arkgen/generation-config/config.json` |
| 生成配置模式 | `arkgen/generation-config/schema.json` |
| Scraper 配置 | `runner/configs/scraper-config.json` |
| Etsgen 配置 | `etsgen/generator-config.json` |
| 输出目录常量 | `runner/src/shared.ts` |

### 生成脚本

标准生成命令位于仓库根目录的 `generate.sh` 中。
在任何 IDL 或配置变更后运行它以重新生成所有输出。
