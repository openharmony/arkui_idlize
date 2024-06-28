import { AppStorage, AppStorageLinkState, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, ArkStructBase, ArkText, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, MutableState, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, StorageLinkState, SwiperController, SyncedProperty, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo, contextLocalStateOf, observableProxy, propState, stateOf } from "@koalaui/arkoala-arkui";
class ArkStateToStateComponent extends ArkStructBase<ArkStateToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToStateComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToPropComponent extends ArkStructBase<ArkStateToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToPropComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = propState<string>(this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStateToPropComponent> | undefined): void {
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToProvideComponent extends ArkStructBase<ArkStateToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToProvideComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = initializers!._test!;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToStorageLinkComponent extends ArkStructBase<ArkStateToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToStorageLinkComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToLocalStorageLinkComponent extends ArkStructBase<ArkStateToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToLocalStorageLinkComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToStoragePropComponent extends ArkStructBase<ArkStateToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToStoragePropComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStateToStoragePropComponent> | undefined): void {
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToLocalStoragePropComponent extends ArkStructBase<ArkStateToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToLocalStoragePropComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStateToLocalStoragePropComponent> | undefined): void {
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToBuilderParamComponent extends ArkStructBase<ArkStateToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToBuilderParamComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStateToPlainComponent extends ArkStructBase<ArkStateToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStateToPlainComponent>): void {
        this._state = stateOf<string>(initializers?.state ?? ('Hello World'), this);
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStateToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToStateComponent extends ArkStructBase<ArkPropToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToStateComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToStateComponent> | undefined): void {
        this._state.update(initializers?.state);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToPropComponent extends ArkStructBase<ArkPropToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToPropComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = propState<string>(this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToPropComponent> | undefined): void {
        this._state.update(initializers?.state);
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToProvideComponent extends ArkStructBase<ArkPropToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToProvideComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = initializers!._test!;
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToProvideComponent> | undefined): void {
        this._state.update(initializers?.state);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToStorageLinkComponent extends ArkStructBase<ArkPropToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToStorageLinkComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToStorageLinkComponent> | undefined): void {
        this._state.update(initializers?.state);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToLocalStorageLinkComponent extends ArkStructBase<ArkPropToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToLocalStorageLinkComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToLocalStorageLinkComponent> | undefined): void {
        this._state.update(initializers?.state);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToStoragePropComponent extends ArkStructBase<ArkPropToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToStoragePropComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToStoragePropComponent> | undefined): void {
        this._state.update(initializers?.state);
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToLocalStoragePropComponent extends ArkStructBase<ArkPropToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToLocalStoragePropComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToLocalStoragePropComponent> | undefined): void {
        this._state.update(initializers?.state);
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToBuilderParamComponent extends ArkStructBase<ArkPropToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToBuilderParamComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToBuilderParamComponent> | undefined): void {
        this._state.update(initializers?.state);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPropToPlainComponent extends ArkStructBase<ArkPropToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPropToPlainComponent>): void {
        this._state = propState<string>('Hello World');
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPropToPlainComponent> | undefined): void {
        this._state.update(initializers?.state);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPropToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToStateComponent extends ArkStructBase<ArkProvideToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToStateComponent>): void {
        this._state = initializers!._state!;
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToPropComponent extends ArkStructBase<ArkProvideToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToPropComponent>): void {
        this._state = initializers!._state!;
        this._test = propState<string>(this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkProvideToPropComponent> | undefined): void {
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToProvideComponent extends ArkStructBase<ArkProvideToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToProvideComponent>): void {
        this._state = initializers!._state!;
        this._test = initializers!._test!;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToStorageLinkComponent extends ArkStructBase<ArkProvideToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToStorageLinkComponent>): void {
        this._state = initializers!._state!;
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToLocalStorageLinkComponent extends ArkStructBase<ArkProvideToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToLocalStorageLinkComponent>): void {
        this._state = initializers!._state!;
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToStoragePropComponent extends ArkStructBase<ArkProvideToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToStoragePropComponent>): void {
        this._state = initializers!._state!;
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkProvideToStoragePropComponent> | undefined): void {
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToLocalStoragePropComponent extends ArkStructBase<ArkProvideToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToLocalStoragePropComponent>): void {
        this._state = initializers!._state!;
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkProvideToLocalStoragePropComponent> | undefined): void {
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToBuilderParamComponent extends ArkStructBase<ArkProvideToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToBuilderParamComponent>): void {
        this._state = initializers!._state!;
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkProvideToPlainComponent extends ArkStructBase<ArkProvideToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkProvideToPlainComponent>): void {
        this._state = initializers!._state!;
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkProvideToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToStateComponent extends ArkStructBase<ArkStorageLinkToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToStateComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToPropComponent extends ArkStructBase<ArkStorageLinkToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToPropComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = propState<string>(this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStorageLinkToPropComponent> | undefined): void {
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToProvideComponent extends ArkStructBase<ArkStorageLinkToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToProvideComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = initializers!._test!;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToStorageLinkComponent extends ArkStructBase<ArkStorageLinkToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToStorageLinkComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToLocalStorageLinkComponent extends ArkStructBase<ArkStorageLinkToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToLocalStorageLinkComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToStoragePropComponent extends ArkStructBase<ArkStorageLinkToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToStoragePropComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStorageLinkToStoragePropComponent> | undefined): void {
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToLocalStoragePropComponent extends ArkStructBase<ArkStorageLinkToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToLocalStoragePropComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStorageLinkToLocalStoragePropComponent> | undefined): void {
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToBuilderParamComponent extends ArkStructBase<ArkStorageLinkToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToBuilderParamComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStorageLinkToPlainComponent extends ArkStructBase<ArkStorageLinkToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStorageLinkToPlainComponent>): void {
        this._state = AppStorageLinkState<string>("key", 'Hello World');
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStorageLinkToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToStateComponent extends ArkStructBase<ArkLocalStorageLinkToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToStateComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToPropComponent extends ArkStructBase<ArkLocalStorageLinkToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToPropComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = propState<string>(this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStorageLinkToPropComponent> | undefined): void {
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToProvideComponent extends ArkStructBase<ArkLocalStorageLinkToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToProvideComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = initializers!._test!;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToStorageLinkComponent extends ArkStructBase<ArkLocalStorageLinkToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToStorageLinkComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToLocalStorageLinkComponent extends ArkStructBase<ArkLocalStorageLinkToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToLocalStorageLinkComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToStoragePropComponent extends ArkStructBase<ArkLocalStorageLinkToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToStoragePropComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStorageLinkToStoragePropComponent> | undefined): void {
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToLocalStoragePropComponent extends ArkStructBase<ArkLocalStorageLinkToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToLocalStoragePropComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStorageLinkToLocalStoragePropComponent> | undefined): void {
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToBuilderParamComponent extends ArkStructBase<ArkLocalStorageLinkToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToBuilderParamComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStorageLinkToPlainComponent extends ArkStructBase<ArkLocalStorageLinkToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkToPlainComponent>): void {
        this._state = StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World');
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: MutableState<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToStateComponent extends ArkStructBase<ArkStoragePropToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToStateComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToStateComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToPropComponent extends ArkStructBase<ArkStoragePropToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToPropComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = propState<string>(this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToPropComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToProvideComponent extends ArkStructBase<ArkStoragePropToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToProvideComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = initializers!._test!;
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToProvideComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToStorageLinkComponent extends ArkStructBase<ArkStoragePropToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToStorageLinkComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToStorageLinkComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToLocalStorageLinkComponent extends ArkStructBase<ArkStoragePropToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToLocalStorageLinkComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToLocalStorageLinkComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToStoragePropComponent extends ArkStructBase<ArkStoragePropToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToStoragePropComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToStoragePropComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToLocalStoragePropComponent extends ArkStructBase<ArkStoragePropToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToLocalStoragePropComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToLocalStoragePropComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToBuilderParamComponent extends ArkStructBase<ArkStoragePropToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToBuilderParamComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToBuilderParamComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkStoragePropToPlainComponent extends ArkStructBase<ArkStoragePropToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStoragePropToPlainComponent>): void {
        this._state = propState<string>(AppStorageLinkState<string>("key", 'Hello World').value);
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkStoragePropToPlainComponent> | undefined): void {
        this._state.update(AppStorageLinkState<string>("key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStoragePropToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToStateComponent extends ArkStructBase<ArkLocalStoragePropToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToStateComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToStateComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToPropComponent extends ArkStructBase<ArkLocalStoragePropToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToPropComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = propState<string>(this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToPropComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToProvideComponent extends ArkStructBase<ArkLocalStoragePropToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToProvideComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = initializers!._test!;
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToProvideComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToStorageLinkComponent extends ArkStructBase<ArkLocalStoragePropToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToStorageLinkComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToStorageLinkComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToLocalStorageLinkComponent extends ArkStructBase<ArkLocalStoragePropToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToLocalStorageLinkComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToLocalStorageLinkComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToStoragePropComponent extends ArkStructBase<ArkLocalStoragePropToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToStoragePropComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToStoragePropComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToLocalStoragePropComponent extends ArkStructBase<ArkLocalStoragePropToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToLocalStoragePropComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToLocalStoragePropComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToBuilderParamComponent extends ArkStructBase<ArkLocalStoragePropToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToBuilderParamComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToBuilderParamComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkLocalStoragePropToPlainComponent extends ArkStructBase<ArkLocalStoragePropToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropToPlainComponent>): void {
        this._state = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: SyncedProperty<string>;
    get state(): string {
        return this._state!.value;
    }
    set state(value: string) {
        this._state!.value = observableProxy(value);
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropToPlainComponent> | undefined): void {
        this._state.update(StorageLinkState<string>(this._entry_local_storage_, "key", 'Hello World').value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToStateComponent extends ArkStructBase<ArkBuilderParamToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToStateComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToPropComponent extends ArkStructBase<ArkBuilderParamToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToPropComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = propState<string>(this.state + "!");
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkBuilderParamToPropComponent> | undefined): void {
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToProvideComponent extends ArkStructBase<ArkBuilderParamToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToProvideComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = initializers!._test!;
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToStorageLinkComponent extends ArkStructBase<ArkBuilderParamToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToStorageLinkComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = AppStorageLinkState<string>("test", this.state + "!");
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToLocalStorageLinkComponent extends ArkStructBase<ArkBuilderParamToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToLocalStorageLinkComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToStoragePropComponent extends ArkStructBase<ArkBuilderParamToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToStoragePropComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkBuilderParamToStoragePropComponent> | undefined): void {
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToLocalStoragePropComponent extends ArkStructBase<ArkBuilderParamToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToLocalStoragePropComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkBuilderParamToLocalStoragePropComponent> | undefined): void {
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToBuilderParamComponent extends ArkStructBase<ArkBuilderParamToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToBuilderParamComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkBuilderParamToPlainComponent extends ArkStructBase<ArkBuilderParamToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkBuilderParamToPlainComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._state && content)
            this._state = content;
    }
    /** @memo */
    _state!: string;
    /** @memo */
    get state(): string {
        return this._state;
    }
    set state(/**/
    /** @memo */
    value: string) {
        this._state = value;
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkBuilderParamToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToStateComponent extends ArkStructBase<ArkPlainToStateComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToStateComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = stateOf<string>(initializers?.test ?? (this.state + "!"), this);
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToStateComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToPropComponent extends ArkStructBase<ArkPlainToPropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToPropComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = propState<string>(this.state + "!");
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPlainToPropComponent> | undefined): void {
        this._test.update(initializers?.test);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToPropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToProvideComponent extends ArkStructBase<ArkPlainToProvideComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToProvideComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = initializers!._test!;
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToProvideComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToStorageLinkComponent extends ArkStructBase<ArkPlainToStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToStorageLinkComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = AppStorageLinkState<string>("test", this.state + "!");
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToLocalStorageLinkComponent extends ArkStructBase<ArkPlainToLocalStorageLinkComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToLocalStorageLinkComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!");
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: MutableState<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToLocalStorageLinkComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToStoragePropComponent extends ArkStructBase<ArkPlainToStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToStoragePropComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = propState<string>(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPlainToStoragePropComponent> | undefined): void {
        this._test.update(AppStorageLinkState<string>("test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToLocalStoragePropComponent extends ArkStructBase<ArkPlainToLocalStoragePropComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToLocalStoragePropComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: SyncedProperty<string>;
    get test(): string {
        return this._test!.value;
    }
    set test(value: string) {
        this._test!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkPlainToLocalStoragePropComponent> | undefined): void {
        this._test.update(StorageLinkState<string>(this._entry_local_storage_, "test", this.state + "!").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToLocalStoragePropComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToBuilderParamComponent extends ArkStructBase<ArkPlainToBuilderParamComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToBuilderParamComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = initializers?.test ?? (this.state + "!");
        if (!this._test && content)
            this._test = content;
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    /** @memo */
    _test!: string;
    /** @memo */
    get test(): string {
        return this._test;
    }
    set test(/**/
    /** @memo */
    value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToBuilderParamComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
class ArkPlainToPlainComponent extends ArkStructBase<ArkPlainToPlainComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkPlainToPlainComponent>): void {
        this._state = initializers?.state ?? ('Hello World');
        this._test = initializers?.test ?? (this.state + "!");
    }
    _state!: string;
    get state(): string {
        return this._state;
    }
    set state(value: string) {
        this._state = value;
    }
    _test!: string;
    get test(): string {
        return this._test;
    }
    set test(value: string) {
        this._test = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkPlainToPlainComponent) => void) | undefined) {
        ArkText(undefined, undefined, this.test);
    }
}
/** @memo */
export function StateToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToStateComponent>): ArkStateToStateComponent {
    return ArkStateToStateComponent._instantiate(style, () => new ArkStateToStateComponent, content, initializers);
}
/** @memo */
export function StateToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToPropComponent>): ArkStateToPropComponent {
    return ArkStateToPropComponent._instantiate(style, () => new ArkStateToPropComponent, content, initializers);
}
/** @memo */
export function StateToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToProvideComponent>): ArkStateToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkStateToProvideComponent._instantiate(style, () => new ArkStateToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function StateToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToStorageLinkComponent>): ArkStateToStorageLinkComponent {
    return ArkStateToStorageLinkComponent._instantiate(style, () => new ArkStateToStorageLinkComponent, content, initializers);
}
/** @memo */
export function StateToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToLocalStorageLinkComponent>): ArkStateToLocalStorageLinkComponent {
    return ArkStateToLocalStorageLinkComponent._instantiate(style, () => new ArkStateToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function StateToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToStoragePropComponent>): ArkStateToStoragePropComponent {
    return ArkStateToStoragePropComponent._instantiate(style, () => new ArkStateToStoragePropComponent, content, initializers);
}
/** @memo */
export function StateToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToLocalStoragePropComponent>): ArkStateToLocalStoragePropComponent {
    return ArkStateToLocalStoragePropComponent._instantiate(style, () => new ArkStateToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function StateToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToBuilderParamComponent>): ArkStateToBuilderParamComponent {
    return ArkStateToBuilderParamComponent._instantiate(style, () => new ArkStateToBuilderParamComponent, content, initializers);
}
/** @memo */
export function StateToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStateToPlainComponent>): ArkStateToPlainComponent {
    return ArkStateToPlainComponent._instantiate(style, () => new ArkStateToPlainComponent, content, initializers);
}
/** @memo */
export function PropToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToStateComponent>): ArkPropToStateComponent {
    return ArkPropToStateComponent._instantiate(style, () => new ArkPropToStateComponent, content, initializers);
}
/** @memo */
export function PropToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToPropComponent>): ArkPropToPropComponent {
    return ArkPropToPropComponent._instantiate(style, () => new ArkPropToPropComponent, content, initializers);
}
/** @memo */
export function PropToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToProvideComponent>): ArkPropToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkPropToProvideComponent._instantiate(style, () => new ArkPropToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function PropToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToStorageLinkComponent>): ArkPropToStorageLinkComponent {
    return ArkPropToStorageLinkComponent._instantiate(style, () => new ArkPropToStorageLinkComponent, content, initializers);
}
/** @memo */
export function PropToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToLocalStorageLinkComponent>): ArkPropToLocalStorageLinkComponent {
    return ArkPropToLocalStorageLinkComponent._instantiate(style, () => new ArkPropToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function PropToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToStoragePropComponent>): ArkPropToStoragePropComponent {
    return ArkPropToStoragePropComponent._instantiate(style, () => new ArkPropToStoragePropComponent, content, initializers);
}
/** @memo */
export function PropToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToLocalStoragePropComponent>): ArkPropToLocalStoragePropComponent {
    return ArkPropToLocalStoragePropComponent._instantiate(style, () => new ArkPropToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function PropToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToBuilderParamComponent>): ArkPropToBuilderParamComponent {
    return ArkPropToBuilderParamComponent._instantiate(style, () => new ArkPropToBuilderParamComponent, content, initializers);
}
/** @memo */
export function PropToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPropToPlainComponent>): ArkPropToPlainComponent {
    return ArkPropToPlainComponent._instantiate(style, () => new ArkPropToPlainComponent, content, initializers);
}
/** @memo */
export function ProvideToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToStateComponent>): ArkProvideToStateComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToStateComponent._instantiate(style, () => new ArkProvideToStateComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToPropComponent>): ArkProvideToPropComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToPropComponent._instantiate(style, () => new ArkProvideToPropComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToProvideComponent>): ArkProvideToProvideComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkProvideToProvideComponent._instantiate(style, () => new ArkProvideToProvideComponent, content, {
        _state: __provide_state,
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function ProvideToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToStorageLinkComponent>): ArkProvideToStorageLinkComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToStorageLinkComponent._instantiate(style, () => new ArkProvideToStorageLinkComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToLocalStorageLinkComponent>): ArkProvideToLocalStorageLinkComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToLocalStorageLinkComponent._instantiate(style, () => new ArkProvideToLocalStorageLinkComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToStoragePropComponent>): ArkProvideToStoragePropComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToStoragePropComponent._instantiate(style, () => new ArkProvideToStoragePropComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToLocalStoragePropComponent>): ArkProvideToLocalStoragePropComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToLocalStoragePropComponent._instantiate(style, () => new ArkProvideToLocalStoragePropComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToBuilderParamComponent>): ArkProvideToBuilderParamComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToBuilderParamComponent._instantiate(style, () => new ArkProvideToBuilderParamComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function ProvideToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkProvideToPlainComponent>): ArkProvideToPlainComponent {
    const __provide_state = contextLocalStateOf<string>("state", () => 'Hello World');
    return ArkProvideToPlainComponent._instantiate(style, () => new ArkProvideToPlainComponent, content, {
        _state: __provide_state,
        ...initializers
    });
}
/** @memo */
export function StorageLinkToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToStateComponent>): ArkStorageLinkToStateComponent {
    return ArkStorageLinkToStateComponent._instantiate(style, () => new ArkStorageLinkToStateComponent, content, initializers);
}
/** @memo */
export function StorageLinkToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToPropComponent>): ArkStorageLinkToPropComponent {
    return ArkStorageLinkToPropComponent._instantiate(style, () => new ArkStorageLinkToPropComponent, content, initializers);
}
/** @memo */
export function StorageLinkToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToProvideComponent>): ArkStorageLinkToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkStorageLinkToProvideComponent._instantiate(style, () => new ArkStorageLinkToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function StorageLinkToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToStorageLinkComponent>): ArkStorageLinkToStorageLinkComponent {
    return ArkStorageLinkToStorageLinkComponent._instantiate(style, () => new ArkStorageLinkToStorageLinkComponent, content, initializers);
}
/** @memo */
export function StorageLinkToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToLocalStorageLinkComponent>): ArkStorageLinkToLocalStorageLinkComponent {
    return ArkStorageLinkToLocalStorageLinkComponent._instantiate(style, () => new ArkStorageLinkToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function StorageLinkToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToStoragePropComponent>): ArkStorageLinkToStoragePropComponent {
    return ArkStorageLinkToStoragePropComponent._instantiate(style, () => new ArkStorageLinkToStoragePropComponent, content, initializers);
}
/** @memo */
export function StorageLinkToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToLocalStoragePropComponent>): ArkStorageLinkToLocalStoragePropComponent {
    return ArkStorageLinkToLocalStoragePropComponent._instantiate(style, () => new ArkStorageLinkToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function StorageLinkToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToBuilderParamComponent>): ArkStorageLinkToBuilderParamComponent {
    return ArkStorageLinkToBuilderParamComponent._instantiate(style, () => new ArkStorageLinkToBuilderParamComponent, content, initializers);
}
/** @memo */
export function StorageLinkToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStorageLinkToPlainComponent>): ArkStorageLinkToPlainComponent {
    return ArkStorageLinkToPlainComponent._instantiate(style, () => new ArkStorageLinkToPlainComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToStateComponent>): ArkLocalStorageLinkToStateComponent {
    return ArkLocalStorageLinkToStateComponent._instantiate(style, () => new ArkLocalStorageLinkToStateComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToPropComponent>): ArkLocalStorageLinkToPropComponent {
    return ArkLocalStorageLinkToPropComponent._instantiate(style, () => new ArkLocalStorageLinkToPropComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToProvideComponent>): ArkLocalStorageLinkToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkLocalStorageLinkToProvideComponent._instantiate(style, () => new ArkLocalStorageLinkToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function LocalStorageLinkToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToStorageLinkComponent>): ArkLocalStorageLinkToStorageLinkComponent {
    return ArkLocalStorageLinkToStorageLinkComponent._instantiate(style, () => new ArkLocalStorageLinkToStorageLinkComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToLocalStorageLinkComponent>): ArkLocalStorageLinkToLocalStorageLinkComponent {
    return ArkLocalStorageLinkToLocalStorageLinkComponent._instantiate(style, () => new ArkLocalStorageLinkToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToStoragePropComponent>): ArkLocalStorageLinkToStoragePropComponent {
    return ArkLocalStorageLinkToStoragePropComponent._instantiate(style, () => new ArkLocalStorageLinkToStoragePropComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToLocalStoragePropComponent>): ArkLocalStorageLinkToLocalStoragePropComponent {
    return ArkLocalStorageLinkToLocalStoragePropComponent._instantiate(style, () => new ArkLocalStorageLinkToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToBuilderParamComponent>): ArkLocalStorageLinkToBuilderParamComponent {
    return ArkLocalStorageLinkToBuilderParamComponent._instantiate(style, () => new ArkLocalStorageLinkToBuilderParamComponent, content, initializers);
}
/** @memo */
export function LocalStorageLinkToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkToPlainComponent>): ArkLocalStorageLinkToPlainComponent {
    return ArkLocalStorageLinkToPlainComponent._instantiate(style, () => new ArkLocalStorageLinkToPlainComponent, content, initializers);
}
/** @memo */
export function StoragePropToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToStateComponent>): ArkStoragePropToStateComponent {
    return ArkStoragePropToStateComponent._instantiate(style, () => new ArkStoragePropToStateComponent, content, initializers);
}
/** @memo */
export function StoragePropToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToPropComponent>): ArkStoragePropToPropComponent {
    return ArkStoragePropToPropComponent._instantiate(style, () => new ArkStoragePropToPropComponent, content, initializers);
}
/** @memo */
export function StoragePropToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToProvideComponent>): ArkStoragePropToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkStoragePropToProvideComponent._instantiate(style, () => new ArkStoragePropToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function StoragePropToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToStorageLinkComponent>): ArkStoragePropToStorageLinkComponent {
    return ArkStoragePropToStorageLinkComponent._instantiate(style, () => new ArkStoragePropToStorageLinkComponent, content, initializers);
}
/** @memo */
export function StoragePropToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToLocalStorageLinkComponent>): ArkStoragePropToLocalStorageLinkComponent {
    return ArkStoragePropToLocalStorageLinkComponent._instantiate(style, () => new ArkStoragePropToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function StoragePropToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToStoragePropComponent>): ArkStoragePropToStoragePropComponent {
    return ArkStoragePropToStoragePropComponent._instantiate(style, () => new ArkStoragePropToStoragePropComponent, content, initializers);
}
/** @memo */
export function StoragePropToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToLocalStoragePropComponent>): ArkStoragePropToLocalStoragePropComponent {
    return ArkStoragePropToLocalStoragePropComponent._instantiate(style, () => new ArkStoragePropToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function StoragePropToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToBuilderParamComponent>): ArkStoragePropToBuilderParamComponent {
    return ArkStoragePropToBuilderParamComponent._instantiate(style, () => new ArkStoragePropToBuilderParamComponent, content, initializers);
}
/** @memo */
export function StoragePropToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStoragePropToPlainComponent>): ArkStoragePropToPlainComponent {
    return ArkStoragePropToPlainComponent._instantiate(style, () => new ArkStoragePropToPlainComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToStateComponent>): ArkLocalStoragePropToStateComponent {
    return ArkLocalStoragePropToStateComponent._instantiate(style, () => new ArkLocalStoragePropToStateComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToPropComponent>): ArkLocalStoragePropToPropComponent {
    return ArkLocalStoragePropToPropComponent._instantiate(style, () => new ArkLocalStoragePropToPropComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToProvideComponent>): ArkLocalStoragePropToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkLocalStoragePropToProvideComponent._instantiate(style, () => new ArkLocalStoragePropToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function LocalStoragePropToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToStorageLinkComponent>): ArkLocalStoragePropToStorageLinkComponent {
    return ArkLocalStoragePropToStorageLinkComponent._instantiate(style, () => new ArkLocalStoragePropToStorageLinkComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToLocalStorageLinkComponent>): ArkLocalStoragePropToLocalStorageLinkComponent {
    return ArkLocalStoragePropToLocalStorageLinkComponent._instantiate(style, () => new ArkLocalStoragePropToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToStoragePropComponent>): ArkLocalStoragePropToStoragePropComponent {
    return ArkLocalStoragePropToStoragePropComponent._instantiate(style, () => new ArkLocalStoragePropToStoragePropComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToLocalStoragePropComponent>): ArkLocalStoragePropToLocalStoragePropComponent {
    return ArkLocalStoragePropToLocalStoragePropComponent._instantiate(style, () => new ArkLocalStoragePropToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToBuilderParamComponent>): ArkLocalStoragePropToBuilderParamComponent {
    return ArkLocalStoragePropToBuilderParamComponent._instantiate(style, () => new ArkLocalStoragePropToBuilderParamComponent, content, initializers);
}
/** @memo */
export function LocalStoragePropToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropToPlainComponent>): ArkLocalStoragePropToPlainComponent {
    return ArkLocalStoragePropToPlainComponent._instantiate(style, () => new ArkLocalStoragePropToPlainComponent, content, initializers);
}
/** @memo */
export function BuilderParamToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToStateComponent>): ArkBuilderParamToStateComponent {
    return ArkBuilderParamToStateComponent._instantiate(style, () => new ArkBuilderParamToStateComponent, content, initializers);
}
/** @memo */
export function BuilderParamToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToPropComponent>): ArkBuilderParamToPropComponent {
    return ArkBuilderParamToPropComponent._instantiate(style, () => new ArkBuilderParamToPropComponent, content, initializers);
}
/** @memo */
export function BuilderParamToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToProvideComponent>): ArkBuilderParamToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkBuilderParamToProvideComponent._instantiate(style, () => new ArkBuilderParamToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function BuilderParamToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToStorageLinkComponent>): ArkBuilderParamToStorageLinkComponent {
    return ArkBuilderParamToStorageLinkComponent._instantiate(style, () => new ArkBuilderParamToStorageLinkComponent, content, initializers);
}
/** @memo */
export function BuilderParamToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToLocalStorageLinkComponent>): ArkBuilderParamToLocalStorageLinkComponent {
    return ArkBuilderParamToLocalStorageLinkComponent._instantiate(style, () => new ArkBuilderParamToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function BuilderParamToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToStoragePropComponent>): ArkBuilderParamToStoragePropComponent {
    return ArkBuilderParamToStoragePropComponent._instantiate(style, () => new ArkBuilderParamToStoragePropComponent, content, initializers);
}
/** @memo */
export function BuilderParamToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToLocalStoragePropComponent>): ArkBuilderParamToLocalStoragePropComponent {
    return ArkBuilderParamToLocalStoragePropComponent._instantiate(style, () => new ArkBuilderParamToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function BuilderParamToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToBuilderParamComponent>): ArkBuilderParamToBuilderParamComponent {
    return ArkBuilderParamToBuilderParamComponent._instantiate(style, () => new ArkBuilderParamToBuilderParamComponent, content, initializers);
}
/** @memo */
export function BuilderParamToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkBuilderParamToPlainComponent>): ArkBuilderParamToPlainComponent {
    return ArkBuilderParamToPlainComponent._instantiate(style, () => new ArkBuilderParamToPlainComponent, content, initializers);
}
/** @memo */
export function PlainToState(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToStateComponent>): ArkPlainToStateComponent {
    return ArkPlainToStateComponent._instantiate(style, () => new ArkPlainToStateComponent, content, initializers);
}
/** @memo */
export function PlainToProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToPropComponent>): ArkPlainToPropComponent {
    return ArkPlainToPropComponent._instantiate(style, () => new ArkPlainToPropComponent, content, initializers);
}
/** @memo */
export function PlainToProvide(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToProvideComponent>): ArkPlainToProvideComponent {
    const __provide_test = contextLocalStateOf<string>("test", () => this.state + "!");
    return ArkPlainToProvideComponent._instantiate(style, () => new ArkPlainToProvideComponent, content, {
        _test: __provide_test,
        ...initializers
    });
}
/** @memo */
export function PlainToStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToStorageLinkComponent>): ArkPlainToStorageLinkComponent {
    return ArkPlainToStorageLinkComponent._instantiate(style, () => new ArkPlainToStorageLinkComponent, content, initializers);
}
/** @memo */
export function PlainToLocalStorageLink(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToLocalStorageLinkComponent>): ArkPlainToLocalStorageLinkComponent {
    return ArkPlainToLocalStorageLinkComponent._instantiate(style, () => new ArkPlainToLocalStorageLinkComponent, content, initializers);
}
/** @memo */
export function PlainToStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToStoragePropComponent>): ArkPlainToStoragePropComponent {
    return ArkPlainToStoragePropComponent._instantiate(style, () => new ArkPlainToStoragePropComponent, content, initializers);
}
/** @memo */
export function PlainToLocalStorageProp(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToLocalStoragePropComponent>): ArkPlainToLocalStoragePropComponent {
    return ArkPlainToLocalStoragePropComponent._instantiate(style, () => new ArkPlainToLocalStoragePropComponent, content, initializers);
}
/** @memo */
export function PlainToBuilderParam(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToBuilderParamComponent>): ArkPlainToBuilderParamComponent {
    return ArkPlainToBuilderParamComponent._instantiate(style, () => new ArkPlainToBuilderParamComponent, content, initializers);
}
/** @memo */
export function PlainToPlain(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkPlainToPlainComponent>): ArkPlainToPlainComponent {
    return ArkPlainToPlainComponent._instantiate(style, () => new ArkPlainToPlainComponent, content, initializers);
}
