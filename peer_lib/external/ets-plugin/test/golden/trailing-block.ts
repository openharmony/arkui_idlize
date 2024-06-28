import { AppStorage, ArkColumn, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, ArkStructBase, ArkText, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, SwiperController, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo } from "@koalaui/arkoala-arkui";
class ArkParentStructComponent extends ArkStructBase<ArkParentStructComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkParentStructComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkParentStructComponent) => void) | undefined) {
        ArkColumn(undefined, () => {
            ChildStruct(undefined, () => {
                ArkText(undefined, undefined, "xxx");
            });
        });
    }
}
class ArkChildStructComponent extends ArkStructBase<ArkChildStructComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkChildStructComponent>): void {
        if (initializers?.content) {
            this._content = initializers?.content;
        }
        if (!this._content && content)
            this._content = content;
    }
    /** @memo */
    _content!: () => void;
    /** @memo */
    get content(): () => void {
        return this._content;
    }
    set content(/**/
    /** @memo */
    value: () => void) {
        this._content = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkChildStructComponent) => void) | undefined) {
        this.content();
    }
}
/** @memo */
export function ParentStruct(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkParentStructComponent>): ArkParentStructComponent {
    return ArkParentStructComponent._instantiate(style, () => new ArkParentStructComponent, content, initializers);
}
/** @memo */
export function ChildStruct(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkChildStructComponent>): ArkChildStructComponent {
    return ArkChildStructComponent._instantiate(style, () => new ArkChildStructComponent, content, initializers);
}
