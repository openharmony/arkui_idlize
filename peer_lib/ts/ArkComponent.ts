import { NativePeerNode } from "./Interop"

export class ArkComponent implements CommonMethod<CommonAttribute> {
    // custom code
    protected peer?: NativePeerNode
    setPeer(peer: NativePeerNode) {
    }
    /** @memo:intrinsic */
    protected checkPriority(
        name: string
    ): boolean { throw new Error("not implemented") }
    protected applyAttributesFinish(): void { throw new Error("not implemented") }

    // stubs for methods from common.d.ts
    width(value: Length): this { throw new Error("not implemented") }
    height(value: Length): this { throw new Error("not implemented") }
    drawModifier(modifier: DrawModifier | undefined): this { throw new Error("not implemented") }
    expandSafeArea(types?: Array<SafeAreaType>, edges?: Array<SafeAreaEdge>): this { throw new Error("not implemented") }
    responseRegion(value: Array<Rectangle> | Rectangle): this { throw new Error("not implemented") }
    mouseResponseRegion(value: Array<Rectangle> | Rectangle): this { throw new Error("not implemented") }
    size(value: SizeOptions): this { throw new Error("not implemented") }
    constraintSize(value: ConstraintSizeOptions): this { throw new Error("not implemented") }
    touchable(value: boolean): this { throw new Error("not implemented") }
    hitTestBehavior(value: HitTestMode): this { throw new Error("not implemented") }
    onChildTouchTest(event: (value: Array<TouchTestInfo>) => TouchResult): this { throw new Error("not implemented") }
    layoutWeight(value: number | string): this { throw new Error("not implemented") }
    padding(value: Padding | Length | LocalizedPadding): this { throw new Error("not implemented") }
    margin(value: Margin | Length | LocalizedMargin): this { throw new Error("not implemented") }
    background(builder: CustomBuilder, options?: { align?: Alignment }): this { throw new Error("not implemented") }
    backgroundColor(value: ResourceColor): this { throw new Error("not implemented") }
    pixelRound(value: PixelRoundPolicy): this { throw new Error("not implemented") }
    backgroundImage(src: ResourceStr | PixelMap, repeat?: ImageRepeat): this { throw new Error("not implemented") }
    backgroundImageSize(value: SizeOptions | ImageSize): this { throw new Error("not implemented") }
    backgroundImagePosition(value: Position | Alignment): this { throw new Error("not implemented") }
    backgroundBlurStyle(value: BlurStyle, options?: BackgroundBlurStyleOptions): this { throw new Error("not implemented") }
    backgroundEffect(options: BackgroundEffectOptions): this { throw new Error("not implemented") }
    backgroundImageResizable(value: ResizableOptions): this { throw new Error("not implemented") }
    foregroundEffect(options: ForegroundEffectOptions): this { throw new Error("not implemented") }
    foregroundBlurStyle(value: BlurStyle, options?: ForegroundBlurStyleOptions): this { throw new Error("not implemented") }
    opacity(value: number | Resource): this { throw new Error("not implemented") }
    border(value: BorderOptions): this { throw new Error("not implemented") }
    borderStyle(value: BorderStyle | EdgeStyles): this { throw new Error("not implemented") }
    borderWidth(value: Length | EdgeWidths | LocalizedEdgeWidths): this { throw new Error("not implemented") }
    borderColor(value: ResourceColor | EdgeColors | LocalizedEdgeColors): this { throw new Error("not implemented") }
    borderRadius(value: Length | BorderRadiuses | LocalizedBorderRadiuses): this { throw new Error("not implemented") }
    borderImage(value: BorderImageOption): this { throw new Error("not implemented") }
    outline(value: OutlineOptions): this { throw new Error("not implemented") }
    outlineStyle(value: OutlineStyle | EdgeOutlineStyles): this { throw new Error("not implemented") }
    outlineWidth(value: Dimension | EdgeOutlineWidths): this { throw new Error("not implemented") }
    outlineColor(value: ResourceColor | EdgeColors | LocalizedEdgeColors): this { throw new Error("not implemented") }
    outlineRadius(value: Dimension | OutlineRadiuses): this { throw new Error("not implemented") }
    foregroundColor(value: ResourceColor | ColoringStrategy): this { throw new Error("not implemented") }
    onClick(event: (event: ClickEvent) => void): this { throw new Error("not implemented") }
    onHover(event: (isHover: boolean, event: HoverEvent) => void): this { throw new Error("not implemented") }
    hoverEffect(value: HoverEffect): this { throw new Error("not implemented") }
    onMouse(event: (event: MouseEvent) => void): this { throw new Error("not implemented") }
    onTouch(event: (event: TouchEvent) => void): this { throw new Error("not implemented") }
    onKeyEvent(event: (event: KeyEvent) => void): this { throw new Error("not implemented") }
    onKeyPreIme(event: Callback<KeyEvent, boolean>): this { throw new Error("not implemented") }
    focusable(value: boolean): this { throw new Error("not implemented") }
    onFocus(event: () => void): this { throw new Error("not implemented") }
    onBlur(event: () => void): this { throw new Error("not implemented") }
    tabIndex(index: number): this { throw new Error("not implemented") }
    defaultFocus(value: boolean): this { throw new Error("not implemented") }
    groupDefaultFocus(value: boolean): this { throw new Error("not implemented") }
    focusOnTouch(value: boolean): this { throw new Error("not implemented") }
    animation(value: AnimateParam): this { throw new Error("not implemented") }
    transition(value: TransitionOptions | TransitionEffect): this { throw new Error("not implemented") }
    gesture(gesture: GestureType, mask?: GestureMask): this { throw new Error("not implemented") }
    priorityGesture(gesture: GestureType, mask?: GestureMask): this { throw new Error("not implemented") }
    parallelGesture(gesture: GestureType, mask?: GestureMask): this { throw new Error("not implemented") }
    blur(value: number, options?: BlurOptions): this { throw new Error("not implemented") }
    linearGradientBlur(value: number, options: LinearGradientBlurOptions): this { throw new Error("not implemented") }
    motionBlur(value: MotionBlurOptions): this { throw new Error("not implemented") }
    brightness(value: number): this { throw new Error("not implemented") }
    contrast(value: number): this { throw new Error("not implemented") }
    grayscale(value: number): this { throw new Error("not implemented") }
    colorBlend(value: Color | string | Resource): this { throw new Error("not implemented") }
    saturate(value: number): this { throw new Error("not implemented") }
    sepia(value: number): this { throw new Error("not implemented") }
    invert(value: number | InvertOptions): this { throw new Error("not implemented") }
    systemBarEffect(): this { throw new Error("not implemented") }
    hueRotate(value: number | string): this { throw new Error("not implemented") }
    useShadowBatching(value: boolean): this { throw new Error("not implemented") }
    useEffect(value: boolean): this { throw new Error("not implemented") }
    backdropBlur(value: number, options?: BlurOptions): this { throw new Error("not implemented") }
    renderGroup(value: boolean): this { throw new Error("not implemented") }
    freeze(value: boolean): this { throw new Error("not implemented") }
    translate(value: TranslateOptions): this { throw new Error("not implemented") }
    scale(value: ScaleOptions): this { throw new Error("not implemented") }
    gridSpan(value: number): this { throw new Error("not implemented") }
    gridOffset(value: number): this { throw new Error("not implemented") }
    rotate(value: RotateOptions): this { throw new Error("not implemented") }
    transform(value: object): this { throw new Error("not implemented") }
    onAppear(event: () => void): this { throw new Error("not implemented") }
    onDisAppear(event: () => void): this { throw new Error("not implemented") }
    onAreaChange(event: (oldValue: Area, newValue: Area) => void): this { throw new Error("not implemented") }
    visibility(value: Visibility): this { throw new Error("not implemented") }
    flexGrow(value: number): this { throw new Error("not implemented") }
    flexShrink(value: number): this { throw new Error("not implemented") }
    flexBasis(value: number | string): this { throw new Error("not implemented") }
    alignSelf(value: ItemAlign): this { throw new Error("not implemented") }
    displayPriority(value: number): this { throw new Error("not implemented") }
    zIndex(value: number): this { throw new Error("not implemented") }
    sharedTransition(id: string, options?: sharedTransitionOptions): this { throw new Error("not implemented") }
    direction(value: Direction): this { throw new Error("not implemented") }
    align(value: Alignment): this { throw new Error("not implemented") }
    position(value: Position | Edges | LocalizedEdges): this { throw new Error("not implemented") }
    markAnchor(value: Position | LocalizedPosition): this { throw new Error("not implemented") }
    offset(value: Position | Edges | LocalizedEdges): this { throw new Error("not implemented") }
    enabled(value: boolean): this { throw new Error("not implemented") }
    useSizeType(value: {
        xs?: number | { span: number; offset: number };
        sm?: number | { span: number; offset: number };
        md?: number | { span: number; offset: number };
        lg?: number | { span: number; offset: number };
    }): this { throw new Error("not implemented") }
    alignRules(value: AlignRuleOption): this { throw new Error("not implemented") }
    chainMode(direction: Axis, style: ChainStyle): this { throw new Error("not implemented") }
    aspectRatio(value: number): this { throw new Error("not implemented") }
    clickEffect(value: ClickEffect | null): this { throw new Error("not implemented") }
    onDragStart(event: (event: DragEvent, extraParams?: string) => CustomBuilder | DragItemInfo): this { throw new Error("not implemented") }
    onDragEnter(event: (event: DragEvent, extraParams?: string) => void): this { throw new Error("not implemented") }
    onDragMove(event: (event: DragEvent, extraParams?: string) => void): this { throw new Error("not implemented") }
    onDragLeave(event: (event: DragEvent, extraParams?: string) => void): this { throw new Error("not implemented") }
    onDrop(event: (event: DragEvent, extraParams?: string) => void): this { throw new Error("not implemented") }
    onDragEnd(event: (event: DragEvent, extraParams?: string) => void): this { throw new Error("not implemented") }
    allowDrop(value: Array<UniformDataType> | null): this { throw new Error("not implemented") }
    draggable(value: boolean): this { throw new Error("not implemented") }
    dragPreview(value: CustomBuilder | DragItemInfo | string): this { throw new Error("not implemented") }
    dragPreviewOptions(value: DragPreviewOptions, options?: DragInteractionOptions): this { throw new Error("not implemented") }
    onPreDrag(callback: Callback<PreDragStatus>): this { throw new Error("not implemented") }
    overlay(value: string | CustomBuilder, options?: { align?: Alignment; offset?: { x?: number; y?: number } }): this { throw new Error("not implemented") }
    linearGradient(value: {
        angle?: number | string;
        direction?: GradientDirection;
        colors: Array<[ResourceColor, number]>;
        repeating?: boolean;
    }): this { throw new Error("not implemented") }
    sweepGradient(value: {
        center: [Length, Length];
        start?: number | string;
        end?: number | string;
        rotation?: number | string;
        colors: Array<[ResourceColor, number]>;
        repeating?: boolean;
    }): this { throw new Error("not implemented") }
    radialGradient(value: {
        center: [Length, Length];
        radius: number | string;
        colors: Array<[ResourceColor, number]>;
        repeating?: boolean;
    }): this { throw new Error("not implemented") }
    motionPath(value: MotionPathOptions): this { throw new Error("not implemented") }
    shadow(value: ShadowOptions | ShadowStyle): this { throw new Error("not implemented") }
    blendMode(value: BlendMode, type?: BlendApplyType): this { throw new Error("not implemented") }
    clip(value: boolean | CircleAttribute | EllipseAttribute | PathAttribute | RectAttribute): this { throw new Error("not implemented") }
    clipShape(value: CircleShape | EllipseShape | PathShape | RectShape): this { throw new Error("not implemented") }
    mask(value: CircleAttribute | EllipseAttribute | PathAttribute | RectAttribute | ProgressMask): this { throw new Error("not implemented") }
    maskShape(value: CircleShape | EllipseShape | PathShape | RectShape): this { throw new Error("not implemented") }
    key(value: string): this { throw new Error("not implemented") }
    id(value: string): this { throw new Error("not implemented") }
    geometryTransition(id: string, options?: GeometryTransitionOptions): this { throw new Error("not implemented") }
    bindPopup(show: boolean, popup: PopupOptions | CustomPopupOptions): this { throw new Error("not implemented") }
    bindMenu(content: Array<MenuElement> | CustomBuilder, options?: MenuOptions): this
    bindMenu(isShow: boolean, content: Array<MenuElement> | CustomBuilder, options?: MenuOptions): this
    bindMenu(isShowOrContent: boolean | Array<MenuElement> | CustomBuilder, contentOrOptions?: Array<MenuElement> | CustomBuilder | MenuOptions, options?: MenuOptions): this { throw new Error("not implemented") }
    bindContextMenu(content: CustomBuilder, responseType: ResponseType, options?: ContextMenuOptions): this
    bindContextMenu(isShown: boolean, content: CustomBuilder, options?: ContextMenuOptions): this
    bindContextMenu(isShownOrContent: boolean | CustomBuilder, contentOrResponseType: CustomBuilder | ResponseType, options?: ContextMenuOptions): this { throw new Error("not implemented") }
    bindContentCover(isShow: boolean, builder: CustomBuilder, type?: ModalTransition): this
    bindContentCover(isShow: boolean, builder: CustomBuilder, options?: ContentCoverOptions): this
    bindContentCover(isShow: boolean, builder: CustomBuilder, optionsOrType?: ContentCoverOptions | ModalTransition): this { throw new Error("not implemented") }
    bindSheet(isShow: boolean, builder: CustomBuilder, options?: SheetOptions): this { throw new Error("not implemented") }
    stateStyles(value: StateStyles): this { throw new Error("not implemented") }
    restoreId(value: number): this { throw new Error("not implemented") }
    onVisibleAreaChange(ratios: Array<number>, event: (isVisible: boolean, currentRatio: number) => void): this { throw new Error("not implemented") }
    sphericalEffect(value: number): this { throw new Error("not implemented") }
    lightUpEffect(value: number): this { throw new Error("not implemented") }
    pixelStretchEffect(options: PixelStretchEffectOptions): this { throw new Error("not implemented") }
    keyboardShortcut(value: string | FunctionKey, keys: Array<ModifierKey>, action?: () => void): this { throw new Error("not implemented") }
    accessibilityGroup(value: boolean): this { throw new Error("not implemented") }
    accessibilityText(value: string): this { throw new Error("not implemented") }
    accessibilityTextHint(value: string): this { throw new Error("not implemented") }
    accessibilityDescription(value: string): this { throw new Error("not implemented") }
    accessibilityLevel(value: string): this { throw new Error("not implemented") }
    accessibilityVirtualNode(builder: CustomBuilder): this { throw new Error("not implemented") }
    obscured(reasons: Array<ObscuredReasons>): this { throw new Error("not implemented") }
    reuseId(id: string): this { throw new Error("not implemented") }
    renderFit(fitMode: RenderFit): this { throw new Error("not implemented") }
    attributeModifier(modifier: AttributeModifier<this>): this { throw new Error("not implemented") }
    gestureModifier(modifier: GestureModifier): this { throw new Error("not implemented") }
    backgroundBrightness(params: BackgroundBrightnessOptions): this { throw new Error("not implemented") }
    onGestureJudgeBegin(callback: (gestureInfo: GestureInfo, event: BaseGestureEvent) => GestureJudgeResult): this { throw new Error("not implemented") }
    monopolizeEvents(monopolize: boolean): this { throw new Error("not implemented") }
    onTouchIntercept(callback: Callback<TouchEvent, HitTestMode>): this { throw new Error("not implemented") }
    onSizeChange(event: SizeChangeCallback): this { throw new Error("not implemented") }
}
