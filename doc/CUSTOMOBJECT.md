# CustomObject processing

Instruction for CustomObject processing

## Setup

Clone and setup idlize project as it is described in [README.md](../README.md)

## List used custom objects

Run `check:peers` to print CustomOjbect usage warnings:
```
> npm run check:peers
...
WARNING: Use CustomObject for imported type DrawingCanvas
WARNING: Use CustomObject for imported type DrawContext
WARNING: Use CustomObject for imported type Theme
WARNING: Use CustomObject for imported type RectWidthStyle
WARNING: Use CustomObject for imported type RectHeightStyle
WARNING: Use CustomObject for imported type WebviewController
...
```

## Include CustomObject idl declarations to the project

Instruction for adding idl declaration which are

- generate idl declation from whole sdk to `full-idl` dir:
```
node . --dts2idl --input-dir ./interface_sdk-js/api,./interface_sdk-js/api/\@internal/component/ets,./interface_sdk-js/api/global --output-dir ./full-idl --default-idl-package ohos --verify-idl
```

- find an idl declaration for necessary CustomObject in the `full-idl` dir.
For example `RectWidthStyle` declaration is placed in the file `@ohos.graphics.text.idl`:
```
[Namespace=text]
dictionary RectWidthStyle {
    number TIGHT;
    number MAX;
};
```
- copy the `RectWidthStyle` idl declaration to [predefined/src/arkui-external.idl](../predefined/src/arkui-external.idl) file
- comment out the namespace if it exists
```
/*[Namespace=text]*/
dictionary RectWidthStyle {
    number TIGHT;
    number MAX;
};
```
- push the changes with the idl declaration to the separate branch to check that it passes CI.
- push the branch
