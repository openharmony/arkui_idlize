const dtsImports = `import {
    AltOffset,
    BackgroundBlurStyleOptions,
    BlurOptions,
    BlurStyle,
    Color,
    CommonAttribute,
    CommonMethod,
    DragInteractionOptions,
    DragPreviewOptions,
    Length,
    Offset,
    Padding,
    Position,
    Resource,
    ResourceStr,
    ResourceColor,
    SheetOptions,
    SheetSize,
    StateStyles,
    SheetTitleOptions,
    CustomComponent
} from "./dts-exports"
`

export function collectDtsImports() {
    return dtsImports // for now
}