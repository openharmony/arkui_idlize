import { AppStorage, AppStorageLinkState, ArkButton, ArkButtonComponent, ArkColumn, ArkColumnComponent, ArkCommonMethod, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, ArkStructBase, ArkText, ArkTextComponent, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, MutableState, OffscreenCanvasRenderingContext2D, OnChange, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, SwiperController, SyncedProperty, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo, bindCustomDialog, contextLocal, contextLocalStateOf, objectLinkState, observableProxy, propState, stateOf } from "@koalaui/arkoala-arkui";
import { registerArkuiEntry } from "@koalaui/arkoala-arkui/ohos.router";
export class ArkEntryExampleComponent extends ArkStructBase<ArkEntryExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkEntryExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkEntryExampleComponent) => void) | undefined) { }
}
class ArkComponentExampleComponent extends ArkStructBase<ArkComponentExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkComponentExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkComponentExampleComponent) => void) | undefined) { }
}
class ArkBuildExampleComponent extends ArkStructBase<ArkBuildExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuildExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuildExampleComponent) => void) | undefined) {
        ArkText((instance: ArkTextComponent) => {
            instance.fontColor(Color.Red)
                .width(100);
        }, undefined, "message");
    }
}
class ArkStateExampleComponent extends ArkStructBase<ArkStateExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateExampleComponent>): void {
        this._x = stateOf<string>(initializers?.x ?? ("hello"), this);
    }
    _x!: MutableState<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.x);
    }
}
class ArkLinkExampleComponent extends ArkStructBase<ArkLinkExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLinkExampleComponent>): void {
        this._x = initializers!._x!;
    }
    _x!: MutableState<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLinkExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.x);
    }
}
class ArkPropExampleComponent extends ArkStructBase<ArkPropExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropExampleComponent>): void {
        this._x = propState<string>();
    }
    _x!: SyncedProperty<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropExampleComponent> | undefined): void {
        this._x.update(initializers?.x);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.x);
    }
}
class ArkPropInitializedExampleComponent extends ArkStructBase<ArkPropInitializedExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropInitializedExampleComponent>): void {
        this._x = propState<string>("init");
    }
    _x!: SyncedProperty<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropInitializedExampleComponent> | undefined): void {
        this._x.update(initializers?.x);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropInitializedExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.x);
    }
}
class ArkProvideExampleComponent extends ArkStructBase<ArkProvideExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideExampleComponent>): void {
        this._x = initializers!._x!;
    }
    _x!: MutableState<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.x);
    }
}
class ArkConsumeExampleComponent extends ArkStructBase<ArkConsumeExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkConsumeExampleComponent>): void {
        this._x = initializers!._x!;
    }
    _x!: MutableState<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkConsumeExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.x);
    }
}
class ArkBuilderExampleComponent extends ArkStructBase<ArkBuilderExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderExampleComponent>): void {
    }
    /** @memo */
    foo() {
        ArkText(undefined, undefined, "hello");
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderExampleComponent) => void) | undefined) {
        this.foo();
    }
}
/** @memo */
function bar() {
    ArkText(undefined, undefined, "hello");
}
class ArkGlobalBuilderExampleComponent extends ArkStructBase<ArkGlobalBuilderExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkGlobalBuilderExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkGlobalBuilderExampleComponent) => void) | undefined) {
        bar();
    }
}
class ArkBuilderParamExampleComponent extends ArkStructBase<ArkBuilderParamExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamExampleComponent>): void {
        if (initializers?.foo) {
            this._foo = initializers?.foo;
        }
        if (!this._foo && content)
            this._foo = content;
    }
    /** @memo */
    _foo!: () => {};
    /** @memo */
    get foo(): () => {} {
        return this._foo;
    }
    set foo(/**/
    /** @memo */
    value: () => {}) {
        this._foo = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamExampleComponent) => void) | undefined) {
        this.foo();
    }
}
/** @memo */
function looks<T extends ArkCommonMethod<T>>(CommonInstance: any): T {
    return CommonInstance.height(500)
        .width(400)
        .backgroundColor(Color.Gray);
}
class ArkStylesExampleComponent extends ArkStructBase<ArkStylesExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStylesExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStylesExampleComponent) => void) | undefined) {
        ArkText((instance: ArkTextComponent) => {
            instance.width(17).__applyStyle(looks);
        }, undefined);
    }
}
class ArkStylesMethodExampleComponent extends ArkStructBase<ArkStylesMethodExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStylesMethodExampleComponent>): void {
    }
    /** @memo */
    nice<T extends ArkCommonMethod<T>>(CommonInstance: any): T {
        return CommonInstance.height(500)
            .width(400)
            .backgroundColor(Color.Gray);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStylesMethodExampleComponent) => void) | undefined) {
        ArkText((instance: ArkTextComponent) => {
            instance.width(17).__applyStyle(this.nice.bind(this));
        }, undefined);
    }
}
/** @memo */
function clown__Column<T extends ArkColumnComponent>(ColumnInstance: any): ArkColumnComponent {
    return ColumnInstance.height(500)
        .width(400)
        .backgroundColor(Color.Gray);
}
class ArkExtendExampleComponent extends ArkStructBase<ArkExtendExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkExtendExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkExtendExampleComponent) => void) | undefined) {
        ArkColumn((instance: ArkColumnComponent) => {
            instance.width(17).__applyStyle(clown__Column);
        }, undefined);
    }
}
/** @memo */
function attributeExtend__Text<T extends ArkTextComponent>(TextInstance: any, n: number, unused: any): ArkTextComponent {
    return TextInstance.fontSize(n);
}
class ArkAnimatableExtendExampleComponent extends ArkStructBase<ArkAnimatableExtendExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkAnimatableExtendExampleComponent>): void {
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkAnimatableExtendExampleComponent) => void) | undefined) {
        ArkText((instance: ArkTextComponent) => {
            instance.width(17).__applyAnimatableExtend(attributeExtend__Text, 50, "unused");
        }, undefined);
    }
}
class ArkWatchExampleComponent extends ArkStructBase<ArkWatchExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkWatchExampleComponent>): void {
        this._x = stateOf<string>(initializers?.x ?? ("hello"), this);
    }
    _x!: MutableState<string>;
    get x(): string {
        return this._x!.value;
    }
    set x(value: string) {
        this._x!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkWatchExampleComponent> | undefined): void {
        OnChange(this.x, () => this.watchFunction());
    }
    watchFunction() {
        console.log("Watch function");
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkWatchExampleComponent) => void) | undefined) {
    }
}
class ArkStorageLinkExampleComponent extends ArkStructBase<ArkStorageLinkExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkExampleComponent>): void {
        this._link = AppStorageLinkState<string>("storage", "Start");
    }
    _link!: MutableState<string>;
    get link(): string {
        return this._link!.value;
    }
    set link(value: string) {
        this._link!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkExampleComponent) => void) | undefined) {
    }
}
class ArkStoragePropExampleComponent extends ArkStructBase<ArkStoragePropExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropExampleComponent>): void {
        this._prop = propState<string>(AppStorageLinkState<string>("storage", "Start").value);
    }
    _prop!: SyncedProperty<string>;
    get prop(): string {
        return this._prop!.value;
    }
    set prop(value: string) {
        this._prop!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropExampleComponent> | undefined): void {
        this._prop.update(AppStorageLinkState<string>("storage", "Start").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropExampleComponent) => void) | undefined) {
    }
}
class ArkCustomDialogExampleComponent extends ArkStructBase<ArkCustomDialogExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkCustomDialogExampleComponent>): void {
        if (initializers?.controller) {
            this._controller = initializers?.controller;
        }
    }
    _controller!: CustomDialogController;
    get controller(): CustomDialogController {
        return this._controller;
    }
    set controller(value: CustomDialogController) {
        this._controller = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkCustomDialogExampleComponent) => void) | undefined) {
    }
}
export class ArkCustomDialogControllerExampleComponent extends ArkStructBase<ArkCustomDialogControllerExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkCustomDialogControllerExampleComponent>): void {
        this._dialogController = initializers?.dialogController ?? (new CustomDialogController({
            builder: CustomDialogExample(),
            autoCancel: true,
            alignment: DialogAlignment.Default,
            offset: { dx: 0, dy: 0 },
            gridCount: 4,
            customStyle: false
        }));
    }
    _dialogController!: CustomDialogController;
    get dialogController(): CustomDialogController {
        return this._dialogController;
    }
    set dialogController(value: CustomDialogController) {
        this._dialogController = value;
    }
    aboutToAppear() {
        this.dialogController.open();
    }
    aboutToDisappear() {
        this.dialogController.close();
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkCustomDialogControllerExampleComponent) => void) | undefined) {
    }
}
// ObjectLink and Observed
@Observed
class ObservedExample {
    public c: number;
    constructor(c: number) {
        this.c = c;
    }
}
class ArkObjectLinkExampleComponent extends ArkStructBase<ArkObjectLinkExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkObjectLinkExampleComponent>): void {
        this._a = objectLinkState<ObservedExample>();
    }
    _a!: SyncedProperty<ObservedExample>;
    get a(): ObservedExample {
        return this._a!.value;
    }
    set a(value: ObservedExample) {
        this._a!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkObjectLinkExampleComponent> | undefined): void {
        this._a.update(initializers?.a);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkObjectLinkExampleComponent) => void) | undefined) {
        ArkButton((instance: ArkButtonComponent) => {
            instance.onClick(() => {
                this.a.c += 1;
            });
        }, undefined);
    }
}
class ArkObjectLinkExampleParentComponent extends ArkStructBase<ArkObjectLinkExampleParentComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkObjectLinkExampleParentComponent>): void {
        this._a = stateOf<ObservedExample[]>(initializers?.a ?? ([new ObservedExample(0), new ObservedExample(0)]), this);
    }
    _a!: MutableState<ObservedExample[]>;
    get a(): ObservedExample[] {
        return this._a!.value;
    }
    set a(value: ObservedExample[]) {
        this._a!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkObjectLinkExampleParentComponent) => void) | undefined) {
        ObjectLinkExample(undefined, undefined);
    }
}
class ArkPlainPropertyExampleComponent extends ArkStructBase<ArkPlainPropertyExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainPropertyExampleComponent>): void {
        this._field = initializers?.field ?? (17);
    }
    _field!: any;
    get field(): any {
        return this._field;
    }
    set field(value: any) {
        this._field = value;
    }
}
class ArkCallExampleComponent extends ArkStructBase<ArkCallExampleComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkCallExampleComponent>): void {
        this._state = stateOf<number>(initializers?.state ?? (17), this);
    }
    _state!: MutableState<number>;
    get state(): number {
        return this._state!.value;
    }
    set state(value: number) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkCallExampleComponent) => void) | undefined) {
        Child(undefined, undefined, { _counter: this._state });
    }
}
class ArkChildComponent extends ArkStructBase<ArkChildComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkChildComponent>): void {
        this._counter = initializers!._counter!;
    }
    _counter!: MutableState<number>;
    get counter(): number {
        return this._counter!.value;
    }
    set counter(value: number) {
        this._counter!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkChildComponent) => void) | undefined) { }
}
/** @memo */
export function EntryExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkEntryExampleComponent>): ArkEntryExampleComponent {
    return ArkEntryExampleComponent._instantiate(style, () => new ArkEntryExampleComponent, content, initializers);
}
/** @memo */
export function ComponentExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkComponentExampleComponent>): ArkComponentExampleComponent {
    return ArkComponentExampleComponent._instantiate(style, () => new ArkComponentExampleComponent, content, initializers);
}
/** @memo */
export function BuildExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuildExampleComponent>): ArkBuildExampleComponent {
    return ArkBuildExampleComponent._instantiate(style, () => new ArkBuildExampleComponent, content, initializers);
}
/** @memo */
export function StateExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateExampleComponent>): ArkStateExampleComponent {
    return ArkStateExampleComponent._instantiate(style, () => new ArkStateExampleComponent, content, initializers);
}
/** @memo */
export function LinkExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLinkExampleComponent>): ArkLinkExampleComponent {
    return ArkLinkExampleComponent._instantiate(style, () => new ArkLinkExampleComponent, content, initializers);
}
/** @memo */
export function PropExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropExampleComponent>): ArkPropExampleComponent {
    return ArkPropExampleComponent._instantiate(style, () => new ArkPropExampleComponent, content, initializers);
}
/** @memo */
export function PropInitializedExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropInitializedExampleComponent>): ArkPropInitializedExampleComponent {
    return ArkPropInitializedExampleComponent._instantiate(style, () => new ArkPropInitializedExampleComponent, content, initializers);
}
/** @memo */
export function ProvideExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideExampleComponent>): ArkProvideExampleComponent {
    const __provide_name = contextLocalStateOf<string>("name", () => "text");
    return ArkProvideExampleComponent._instantiate(style, () => new ArkProvideExampleComponent, content, {
        _x: __provide_name,
        ...initializers
    });
}
/** @memo */
export function ConsumeExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkConsumeExampleComponent>): ArkConsumeExampleComponent {
    const __consume_name = contextLocal<string>("name") as MutableState<string>;
    return ArkConsumeExampleComponent._instantiate(style, () => new ArkConsumeExampleComponent, content, {
        _x: __consume_name,
        ...initializers
    });
}
/** @memo */
export function BuilderExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderExampleComponent>): ArkBuilderExampleComponent {
    return ArkBuilderExampleComponent._instantiate(style, () => new ArkBuilderExampleComponent, content, initializers);
}
/** @memo */
export function GlobalBuilderExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkGlobalBuilderExampleComponent>): ArkGlobalBuilderExampleComponent {
    return ArkGlobalBuilderExampleComponent._instantiate(style, () => new ArkGlobalBuilderExampleComponent, content, initializers);
}
/** @memo */
export function BuilderParamExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamExampleComponent>): ArkBuilderParamExampleComponent {
    return ArkBuilderParamExampleComponent._instantiate(style, () => new ArkBuilderParamExampleComponent, content, initializers);
}
/** @memo */
export function StylesExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStylesExampleComponent>): ArkStylesExampleComponent {
    return ArkStylesExampleComponent._instantiate(style, () => new ArkStylesExampleComponent, content, initializers);
}
/** @memo */
export function StylesMethodExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStylesMethodExampleComponent>): ArkStylesMethodExampleComponent {
    return ArkStylesMethodExampleComponent._instantiate(style, () => new ArkStylesMethodExampleComponent, content, initializers);
}
/** @memo */
export function ExtendExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkExtendExampleComponent>): ArkExtendExampleComponent {
    return ArkExtendExampleComponent._instantiate(style, () => new ArkExtendExampleComponent, content, initializers);
}
/** @memo */
export function AnimatableExtendExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkAnimatableExtendExampleComponent>): ArkAnimatableExtendExampleComponent {
    return ArkAnimatableExtendExampleComponent._instantiate(style, () => new ArkAnimatableExtendExampleComponent, content, initializers);
}
/** @memo */
export function WatchExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkWatchExampleComponent>): ArkWatchExampleComponent {
    return ArkWatchExampleComponent._instantiate(style, () => new ArkWatchExampleComponent, content, initializers);
}
/** @memo */
export function StorageLinkExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkExampleComponent>): ArkStorageLinkExampleComponent {
    return ArkStorageLinkExampleComponent._instantiate(style, () => new ArkStorageLinkExampleComponent, content, initializers);
}
/** @memo */
export function StoragePropExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropExampleComponent>): ArkStoragePropExampleComponent {
    return ArkStoragePropExampleComponent._instantiate(style, () => new ArkStoragePropExampleComponent, content, initializers);
}
/** @memo */
export function CustomDialogExampleImpl(initializers?: Partial<ArkCustomDialogExampleComponent>): ArkCustomDialogExampleComponent {
    return ArkCustomDialogExampleComponent._instantiate(undefined, () => new ArkCustomDialogExampleComponent, undefined, initializers);
}
export function CustomDialogExample(initializer: any = {}) {
    return { build: bindCustomDialog(CustomDialogExampleImpl, initializer), buildOptions: initializer };
}
/** @memo */
export function CustomDialogControllerExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkCustomDialogControllerExampleComponent>): ArkCustomDialogControllerExampleComponent {
    return ArkCustomDialogControllerExampleComponent._instantiate(style, () => new ArkCustomDialogControllerExampleComponent, content, initializers);
}
/** @memo */
export function ObjectLinkExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkObjectLinkExampleComponent>): ArkObjectLinkExampleComponent {
    return ArkObjectLinkExampleComponent._instantiate(style, () => new ArkObjectLinkExampleComponent, content, initializers);
}
/** @memo */
export function ObjectLinkExampleParent(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkObjectLinkExampleParentComponent>): ArkObjectLinkExampleParentComponent {
    return ArkObjectLinkExampleParentComponent._instantiate(style, () => new ArkObjectLinkExampleParentComponent, content, initializers);
}
/** @memo */
export function PlainPropertyExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainPropertyExampleComponent>): ArkPlainPropertyExampleComponent {
    return ArkPlainPropertyExampleComponent._instantiate(style, () => new ArkPlainPropertyExampleComponent, content, initializers);
}
/** @memo */
export function CallExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkCallExampleComponent>): ArkCallExampleComponent {
    return ArkCallExampleComponent._instantiate(style, () => new ArkCallExampleComponent, content, initializers);
}
/** @memo */
export function Child(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkChildComponent>): ArkChildComponent {
    return ArkChildComponent._instantiate(style, () => new ArkChildComponent, content, initializers);
}
registerArkuiEntry(EntryExample, "Rewrite");
export const __Entry = EntryExample;
