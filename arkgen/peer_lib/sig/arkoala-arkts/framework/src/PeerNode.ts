import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { NativePeerNode } from "./NativePeerNode"
import {contextNode, DataNode, IncrementalNode} from "@koalaui/runtime"
import { ArkUINativeModule } from "./generated/ArkUINativeModule"
import {
    AreaChangePeerEvent,
    CallbackPeerEvent,
    GesturePeerEvent,
    ImageCompletePeerEvent, ImageErrorPeerEvent,
    KeyPeerEvent,
    MousePeerEvent,
    PeerEvent,
    SinglePointerPeerEvent,
    XComponentLoadPeerEvent,
    PeerEnterKeyType,
    PeerSubmitEvent
} from "./PeerEvents"
import { WebLoadInterceptDataType } from "./WebResourceRequest"

export const PeerNodeType = 11
export const PartialPropertiesType = 13
export const GeneratedPartialPropertiesType = 14
export const LegacyNodeType = 17

const InitialID = 999

export interface Sized {
    size(): number
}

export class LazyRangeStartMarker {
    public onRangeUpdate: (startIndex: number, endIndex: number) => void
    public currentStart: () => number
    public currentEnd: () => number
    private sizedRange: Sized

    constructor(onRangeUpdate: (startIndex: number, endIndex: number) => void, sizedRange: Sized,
                currentStart: () => number, currentEnd: () => number) {
        this.sizedRange = sizedRange
        this.currentEnd = currentEnd
        this.currentStart = currentStart
        this.onRangeUpdate = onRangeUpdate
    }

    rangeSize(): number {
        return this.sizedRange.size()
    }
}

export class LazyRangeEndMarker {
    constructor() { }
}

export interface Properties {
    onClick: (event: SinglePointerPeerEvent) => void
    onSwiperChange: (value: number) => void
    onTabsChange: (value: number) => void
    onVisibleAreaChange: (isVisible: boolean, currentRatio: number) => void
    lazyRangeStart: LazyRangeStartMarker
    lazyRangeEnd: LazyRangeEndMarker
    onAppear: () => void
    onDisappear: () => void
    onScrollIndex: (first: number, last: number) => void
    onNavigatorClick: () => void
    onAction: (event: GesturePeerEvent) => void
    onActionStart: (event: GesturePeerEvent) => void
    onActionUpdate: (event: GesturePeerEvent) => void
    onActionEnd: (event: GesturePeerEvent) => void
    onActionCancel: () => void
    onTextInput: (text: string) => void
    onSwiperAnimationStart: (index: number, targetIndex: number, currentOffset: number, targetOffset: number, velocity: number) => void
    onSwiperAnimationEnd: (index: number, currentOffset: number, targetOffset: number, velocity: number) => void
    onSwiperGestureSwipe: (index: number, currentOffset: number, targetOffset: number, velocity: number) => void
    onAreaChange: (event: AreaChangePeerEvent) => void
    onBlur: () => void
    onCanvasReady: () => void
    onListScroll:(scrollOffset: number, scrollState: number) => void
    onListScrollIndex:(start: number, end: number, center: number) => void
    onListScrollStart:() => void
    onListScrollStop:() => void
    onWebLoadIntercept: (event: WebLoadInterceptDataType) => boolean
    onToggleChange: (isOn: boolean) => void
    onTextInputEditChange: (isEditing: boolean) => void
    onTextInputSubmit: (enterKey: PeerEnterKeyType, event: PeerSubmitEvent) => void
    onTextInputChange: (value: string) => void
    onSliderChange: (value: number, mode: number) => void
    onHover: (isHover: boolean) => void
    onKeyEvent: (event: KeyPeerEvent) => void
    onMouse: (event: MousePeerEvent) => void
    onImageComplete: (event: ImageCompletePeerEvent) => void
    onImageError: (event: ImageErrorPeerEvent) => void
    onRefreshStateChange: (state: number) => void
    onRefreshing:() => void
    onRadioChange: (isChecked: boolean) => void
    onGridScroll:(scrollOffset: number, scrollState: number) => void
    onGridScrollStart:() => void
    onGridScrollStop:() => void
    onSideBarChange:(value: boolean) => void
    onXComponentLoad: (event: XComponentLoadPeerEvent) => void
    onXComponentDestroy: () => void
    onNavBarStateChange: (isVisible: boolean) => void
    navDestination: (name: string, param: unknown) => void
}

/** @memo */
export function UseProperties(properties: Partial<Properties>) {
    const parent = contextNode<PeerNode>(PeerNodeType)
    DataNode.attach(PartialPropertiesType, properties, () => {
        parent.invalidateProperties()
    })
}

let currentPostman = (node: PeerNode, peerEvent: PeerEvent, props: Partial<Properties>) => { }

export function setEventDeliverer(postman:
                                  (node: PeerNode, peerEvent: PeerEvent, props: Partial<Properties>) => void) {
    currentPostman = postman
}

export class PeerNode extends IncrementalNode {
    peer: NativePeerNode
    static nextId(): int32 { return ++PeerNode.currentId }
    protected static currentId: int32 = InitialID
    private id: int32

    constructor(peerPtr: pointer, id: int32, name: string, flags: int32) {
        super(PeerNodeType)
        this.id = id
        this.peer = new NativePeerNode(peerPtr, getNodeFinalizer())
    }
    getId(): number { return this.id }
    applyAttributes(attrs: Object) {}
    invalidateProperties() {}
}


function getNodeFinalizer() : pointer {
    return ArkUINativeModule._GetNodeFinalizer()
}
