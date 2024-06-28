import { AppStorage, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, SwiperController, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo } from "@koalaui/arkoala-arkui";
/* TODO: not yet implemented in the plugin */
// @AnimatableExtend
class FooAttribute {
    bar(): this {
        console.log("bar");
        return this;
    }
    qux(): this {
        console.log("qux");
        return this;
    }
}
@BuilderLambda("_Foo")
declare function Foo(arg1: string): FooAttribute;
function _Foo(builder: (instance) => FooAttribute, arg1: string): void {
    builder(new FooAttribute());
}
_Foo(instance => {
    instance.bar()
        .qux();
}, "label");
