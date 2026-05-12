# 类型序列化

## 具体化类/接口

具有方法的接口或类需要在原生层面有对应的实现。
在托管层面会生成一个特殊的实现类，它持有一个指向原生结构的指针。
这些被称为 **具体化类/接口**，以区别于 builder 或用户实现的接口。

每个具体化类/接口提供：

- `getFinalizer(): KPointer` — 返回指向原生销毁方法的函数指针的静态方法。
- `getPeer(): Finalizable | undefined` — 返回持有原生指针的 peer（由序列化器使用）。
- `fromPtr(ptr: KPointer): ClassName` — 从原生指针构造实例的静态工厂方法。

### 具体化接口

示例 IDL：
```
interface TextBaseController {
  setSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void;
  closeSelectionMenu(): void;
}
```

实现类以 `Internal` 后缀命名，包装一个原生指针：

```typescript
class TextBaseControllerInternal implements TextBaseController {
    peer?: Finalizable

    getPeer(): Finalizable | undefined {
        return this.peer
    }

    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._TextBaseController_getFinalizer()
    }

    static fromPtr(ptr: KPointer): TextBaseControllerInternal {
        return new TextBaseControllerInternal(undefined, ptr)
    }

    constructor(tag?: MaterializedBaseTag, peerPtr?: KPointer) {
        this.peer = new Finalizable(peerPtr, TextBaseControllerInternal.getFinalizer())
    }

    // ...代理到原生的实现方法
}
```

### 具体化类

具体化类遵循相同的模式，但可能有原始的构造函数来创建原生结构：

```typescript
class CanvasRenderingContext2D extends CanvasRenderer {
    peer?: Finalizable

    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._CanvasRenderingContext2D_getFinalizer()
    }

    static fromPtr(ptr: KPointer): CanvasRenderingContext2D {
        return new CanvasRenderingContext2D(undefined, ptr)
    }

    constructor(tag?: MaterializedBaseTag, peerPtr?: KPointer) {
        super(tag, peerPtr)
        this.peer = new Finalizable(peerPtr, CanvasRenderingContext2D.getFinalizer())
    }

    // ...代理到原生的实现方法
}
```

对于支持构造函数重载的语言（TypeScript、ArkTS），每个原始构造函数与接受
指针的基础构造函数一起发射。对于不支持重载的语言（CangJie），
构造函数被合并为带有可选参数的单个构造函数。

### 命名约定

| 概念 | 约定 | 示例 |
|---------|-----------|---------|
| 具体化接口实现 | `ClassNameInternal` | `TextBaseControllerInternal` |
| 具体化类 | 与原始名称相同 | `CanvasRenderingContext2D` |
| 原生模块调用 | `ArkUIGeneratedNativeModule._method` | `ArkUIGeneratedNativeModule._CanvasPath_getFinalizer` |
| 工厂方法 | `static fromPtr(ptr)` | `TextBaseControllerInternal.fromPtr(ptr)` |

## 用户实现的接口

某些接口的方法由用户而非框架实现：

```typescript
interface ICurve {
    interpolate(fraction: number): number;
}

class SwiperAttribute {
    curve(value: Curve | string | ICurve): SwiperAttribute;
}
```

用法：
```typescript
swiper.curve({ interpolate: (fraction) => 0.8 * fraction })
```

此类接口无法表示为具体化类，因此被当作回调处理。
