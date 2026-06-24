# IDLize 工具使用者指南

本指南面向把 IDLize 用作 ArkUI 代码生成工具的开发者。读完后，应能够：

- 运行标准生成流程。
- 判断输入声明、IDL 中间产物和生成代码分别位于哪里。
- 添加手写 IDL 或扩展现有接口。
- 修改接口参数后验证 ArkTS 和 C++ 侧生成结果。

完整 IDL 语言语法请参见 [IDL_SPEC.md](IDL_SPEC.md)。命令参数请参见
[CLI_REFERENCE.md](CLI_REFERENCE.md)。

## 1. 使用前提

从仓库根目录准备环境：

```bash
git submodule update --init
npm i
cd external
npm i
cd ..
cd runner
npm run compile
cd ..
npm run download:sdk
```

以上命令完成后即可运行标准生成流程。更完整的开发环境和发布说明请参见
[开发者指南](../../doc_developer/zh-cn/DEVELOPER_GUIDE.md)。

## 2. 运行标准生成流程

在仓库根目录执行：

```bash
bash generate.sh
```

`generate.sh` 调用 `runner m3`，使用 `sdk-patched-arkts/` 作为已准备的 SDK，
并把 `interfaces/interfaces/arkui-extra/` 作为额外 IDL 输入。标准生成会安装
全部目标：

```text
out/
  sig/       # ArkTS / TypeScript peer 和组件类
  libace/    # C++ modifier、serializer 和 native module 胶水代码
```

中间产物位于 `runner/out/`：

| 路径 | 用途 |
|---|---|
| `runner/out/idl/` | `etsgen` 从 `.d.ts` / `.d.ets` 转换出的 `.idl`。 |
| `runner/out/peers/sig/` | `arkgen` 生成的 ArkTS / TypeScript peer 中间输出。 |
| `runner/out/peers/libace/` | `arkgen` 生成的 C++ 中间输出。 |
| `runner/out/patched-sdk-arkts/` | 已准备的 ArkTS SDK 声明。 |
| `runner/out/patched-sdk-ts/` | 已准备的 TypeScript SDK 声明。 |
| `runner/out/scraper/` | scraper 阶段处理后的 IDL 输入。 |

这些目录是生成产物，不要手工修改。需要修正输入时，应修改手写 IDL、SDK patch
或生成配置，然后重新运行 `bash generate.sh`。

## 3. 判断生成结果是否正确

当生成代码缺少组件、方法或属性，或参数类型、可选标记、返回类型不符合预期时，
按产物链路反向检查：

1. 查看 `out/sig/` 或 `out/libace/`，确认安装后的文件是否缺失或内容不对。
2. 查看 `runner/out/peers/sig/` 或 `runner/out/peers/libace/`，确认 printer 实际输出。
3. 查看 `runner/out/idl/`，确认 parser 实际接收到的 IDL。
4. 如果 IDL 已经错误，继续检查 `runner/out/patched-sdk-arkts/`、
   `runner/out/patched-sdk-ts/` 和输入 patch。
5. 如果 IDL 正确但 peer 输出错误，检查 `arkgen/generation-config/config.json` 和相关生成器。

常用检查命令：

```bash
rg -n "MyButton" out runner/out/peers runner/out/idl
rg -n "borderWidth" out/sig runner/out/peers/sig
rg -n "setData" out/libace runner/out/peers/libace
```

## 4. 添加手写 IDL 组件

### 4.1 编写 IDL 文件

下面示例定义一个 `MyButton` 组件：

```idl
package arkui.component.mybutton;

import arkui.component.units;
import arkui.component.common;

callback MyButtonClickCallback = void (i32 clickCount);

[Component]
interface MyButton {
    constructor();

    attribute String label;
    attribute ResourceColor backgroundColor;
    attribute Length width;
    attribute Length height;
    attribute boolean enabled;

    MyButton onClick(MyButtonClickCallback callback);
    MyButton fontSize(Length size);
    MyButton borderRadius(Length radius);
};

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

要点：

- `package` 决定接口的命名空间。
- `import` 引入外部 IDL 包中的类型。
- `[Component]` 标记 ArkUI 组件接口。
- `[ComponentInterface]` 标记属性 setter 接口。
- setter 通常返回组件或属性接口类型，以支持链式调用。

### 4.2 放置 IDL 文件

推荐把手写 IDL 放在标准额外输入目录：

```text
interfaces/interfaces/arkui-extra/mybutton.idl
```

如果使用自定义目录，可以直接调用 `runner m3`，通过 `<idl-files...>` 位置参数传入。

### 4.3 配置生成

组件是否完整生成主要由 `arkgen/generation-config/config.json` 控制。新组件通常会被
materialized；如果需要强制完整生成，可将完全限定名加入 `forceMaterialized`：

```json
{
    "forceMaterialized": [
        "arkui.component.mybutton.MyButton",
        "arkui.component.mybutton.MyButtonAttribute"
    ]
}
```

完全限定名格式为 `<package>.<InterfaceName>`。如果组件在 `ignoreMaterialized` 中，
只会生成最小 stub。

### 4.4 重新生成并验证

```bash
bash generate.sh
find out/sig -name "*MyButton*"
find out/libace -name "*MyButton*"
```

常见命名约定：

| 生成产物 | 命名模式 |
|---|---|
| Peer 类 | `Ark<Component>Peer`，例如 `ArkMyButtonPeer`。 |
| Component 类 | `Ark<Component>Component`，例如 `ArkMyButtonComponent`。 |
| C++ Modifier | `<Component>Modifier`，例如 `MyButtonModifier`。 |
| Materialized 接口实现 | `<Name>Internal`，例如 `MyButtonInternal`。 |
| Native module 调用 | `ArkUIGeneratedNativeModule._<method>`。 |

## 5. 扩展现有组件接口

### 5.1 先确定输入来源

不要修改 `runner/out/idl/` 或 `out/`。这些目录会在每次生成时被覆盖。

| 来源 | 应修改的位置 |
|---|---|
| 手写或补充 IDL | `interfaces/interfaces/arkui-extra/` 或传给 `runner m3` 的自定义 IDL 路径。 |
| 上游 ArkTS SDK 声明 | `sdk-patched-arkts/`。 |
| 上游 TypeScript SDK 声明 | `sdk-patched/`。 |
| 生成配置 | `arkgen/generation-config/config.json`。 |

可以用以下命令定位手写 IDL：

```bash
rg -n "ExistingComponent" interfaces/interfaces
```

### 5.2 添加属性或方法

在组件接口和属性接口中补充对应声明：

```idl
package arkui.component.existing;

import arkui.component.common;
import arkui.component.units;

[Component]
interface ExistingComponent {
    attribute String tooltip;
    ExistingComponent shadow(number radius, number offsetX, number offsetY, ResourceColor color);
    ExistingComponent animation(optional Duration duration);
};

[ComponentInterface]
interface ExistingComponentAttribute {
    ExistingComponentAttribute tooltip(String value);
    ExistingComponentAttribute shadow(number radius, number offsetX, number offsetY, ResourceColor color);
};
```

重新生成：

```bash
bash generate.sh
```

生成方法名通常与 IDL 方法名一致，首字母不会自动转换大小写。

## 6. 修改现有接口参数

常见变更示例：

```idl
interface ExistingComponent {
    ExistingComponent borderWidth(Length width, optional ResourceColor color);
    void setData(sequence<String> data);
    ExistingComponent padding(Length value);
    ExistingComponent padding(record<String, Length> edges);
};
```

兼容性判断：

- 添加可选参数通常向后兼容。
- 新增重载通常向后兼容。
- 修改参数类型是破坏性变更。
- 删除参数或方法是破坏性变更；应先使用 `[Deprecated]` 标记旧 API。

```idl
interface ExistingComponent {
    [Deprecated]
    ExistingComponent oldMethod(String param);

    ExistingComponent newMethod(String param, optional i32 flags);
};
```

验证时同时检查 ArkTS 和 C++ 侧：

```bash
bash generate.sh
rg -n "borderWidth" out/sig runner/out/peers/sig
rg -n "setData" out/libace runner/out/peers/libace
```

确认以下内容：

- ArkTS peer 方法签名已更新。
- C++ modifier 接受新的参数类型。
- Serializer 对新参数类型的编码符合预期。

## 7. 直接调用 `runner m3`

标准脚本等价于以下调用：

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

关键参数：

| 参数 | 用途 |
|---|---|
| `--sdk-stage prepared` | 从已准备的 SDK 开始。只使用 IDL 输入时可改为 `idl`。 |
| `--arkgen-options-file` | ArkUI 生成配置。 |
| `--etsgen-options-file` | `.d.ts` / `.d.ets` 到 IDL 的转换配置；`idl` 阶段不需要。 |
| `--arkgen-interop-types` | ArkTS/C++ 共享 interop 类型头文件。 |
| `--scraper-options-file` | scraper 处理范围配置。 |
| `--target` | `sig`、`libace` 或 `all`。 |
| `--output` | 安装后的输出目录。 |

## 8. IDL 快速参考

### 包和导入

```idl
package arkui.component.mycomponent;

import arkui.component.common;
import arkui.component.units.Length as Length;
```

### 接口、属性和方法

```idl
interface MyService {
    constructor(String name, optional i32 timeout);

    attribute String name;
    readonly attribute i32 id;
    [Optional] attribute String description;

    void start();
    boolean isRunning();
    String getStatus(optional boolean verbose);

    static MyService createDefault();
};
```

如果带 `[Entity=Class]` 的接口需要作为 peer 或包含方法，应避免普通属性，或使用
`[Accessor=Getter]` / `[Accessor=Setter]` 组合：

```idl
[Entity=Class]
interface MyService {
    [Accessor=Getter]
    attribute String name;
    [Accessor=Setter]
    attribute String name;

    void start();
};
```

### 回调

```idl
callback OnChangeCallback = void (String newValue, i32 changeId);

interface MyComponent {
    attribute OnChangeCallback onChange;
    void setOnChange(OnChangeCallback callback);
};
```

### 联合、序列和记录

```idl
void setSize((number or String or Length) value);
void setColor(optional (ResourceColor or undefined) color);
void setItems(sequence<String> items);
void setMetadata(record<String, boolean> meta);
```

### 常用扩展属性

| 扩展属性 | 用法 | 说明 |
|---|---|---|
| `[Component]` | 接口 | 标记 ArkUI 组件。 |
| `[ComponentInterface]` | 接口 | 标记组件属性 setter 接口。 |
| `[Entity=Class]` | 接口 | 生成带指针支持的类形态。 |
| `[Entity=Interface]` | 接口 | 生成接口形态。 |
| `[Optional]` | 属性 | 属性可以省略。 |
| `[Deprecated]` | 任意声明 | 标记 API 已弃用。 |
| `[Throws]` | 方法 | 方法可能抛出异常。 |
| `[Accessor=Getter]` / `[Accessor=Setter]` | 属性 | 属性为访问器。 |
| `[Documentation="..."]` | 任意声明 | 内联文档。 |
| `[DtsName="original"]` | 任意声明 | 保留原始声明名称。 |

## 9. 位置速查

| 内容 | 位置 |
|---|---|
| 手写 IDL | `interfaces/interfaces/arkui-extra/`。 |
| SDK ArkTS patch | `sdk-patched-arkts/`。 |
| SDK TypeScript patch | `sdk-patched/`。 |
| 生成配置 | `arkgen/generation-config/config.json`。 |
| Scraper 配置 | `runner/configs/scraper-config.json`。 |
| Etsgen 配置 | `etsgen/generator-config.json`。 |
| 输出目录常量 | `runner/src/shared.ts`。 |
