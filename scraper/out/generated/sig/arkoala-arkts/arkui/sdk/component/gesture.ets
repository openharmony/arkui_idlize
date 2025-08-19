/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { InteractionHand } from "./enums"
import { BaseEvent, SourceTool } from "./common"
export enum PanDirection {
    NONE = 0,
    None = 0,
    HORIZONTAL = 1,
    Horizontal = 1,
    LEFT = 2,
    Left = 2,
    RIGHT = 3,
    Right = 3,
    VERTICAL = 4,
    Vertical = 4,
    UP = 5,
    Up = 5,
    DOWN = 6,
    Down = 6,
    ALL = 7,
    All = 7
}
export enum SwipeDirection {
    NONE = 0,
    None = 0,
    HORIZONTAL = 1,
    Horizontal = 1,
    VERTICAL = 2,
    Vertical = 2,
    ALL = 3,
    All = 3
}
export enum GestureMode {
    SEQUENCE = 0,
    Sequence = 0,
    PARALLEL = 1,
    Parallel = 1,
    EXCLUSIVE = 2,
    Exclusive = 2
}
export enum GestureMask {
    NORMAL = 0,
    Normal = 0,
    IGNORE_INTERNAL = 1,
    IgnoreInternal = 1
}
export enum GestureJudgeResult {
    CONTINUE = 0,
    REJECT = 1
}
export declare interface GestureInfo {
    tag?: string;
    type: GestureControl.GestureType;
    isSystemGesture: boolean;
}
export declare interface FingerInfo {
    id: number;
    globalX: number;
    globalY: number;
    localX: number;
    localY: number;
    displayX: number;
    displayY: number;
    hand?: InteractionHand;
}
export type GestureType = Gesture | object;
export declare interface BaseGestureEvent extends BaseEvent {
    fingerList: Array<FingerInfo>;
}
export declare interface TapGestureEvent extends BaseGestureEvent {
}
export declare interface LongPressGestureEvent extends BaseGestureEvent {
    repeat: boolean;
}
export declare interface PanGestureEvent extends BaseGestureEvent {
    offsetX: number;
    offsetY: number;
    velocityX: number;
    velocityY: number;
    velocity: number;
}
export declare interface PinchGestureEvent extends BaseGestureEvent {
    scale: number;
    pinchCenterX: number;
    pinchCenterY: number;
}
export declare interface RotationGestureEvent extends BaseGestureEvent {
    angle: number;
}
export declare interface SwipeGestureEvent extends BaseGestureEvent {
    angle: number;
    speed: number;
}
export declare interface GestureEvent extends BaseEvent {
    repeat: boolean;
    fingerList: Array<FingerInfo>;
    offsetX: number;
    offsetY: number;
    angle: number;
    speed: number;
    scale: number;
    pinchCenterX: number;
    pinchCenterY: number;
    velocityX: number;
    velocityY: number;
    velocity: number;
}
export declare interface BaseHandlerOptions {
    isFingerCountLimited?: boolean;
}
export declare class Gesture {
    constructor()
    tag(tag: string): this
    allowedTypes(types: Array<SourceTool>): this
}
export declare interface TapGestureParameters extends BaseHandlerOptions {
    count?: number;
    fingers?: number;
    distanceThreshold?: number;
}
export declare class PanGestureOptions {
    constructor(value: PanGestureHandlerOptions | undefined)
    setDirection(value: PanDirection): void
    setDistance(value: number): void
    setFingers(value: number): void
    getDirection(): PanDirection
    getDistance(): number
}
export declare class SwipeGesture extends Gesture {
    constructor()
    static $_instantiate(factory: (() => SwipeGesture), value?: SwipeGestureHandlerOptions): SwipeGesture
    onAction(event: ((value0: GestureEvent) => void)): this
}
export declare class RotationGesture extends Gesture {
    constructor()
    static $_instantiate(factory: (() => RotationGesture), value?: RotationGestureHandlerOptions): RotationGesture
    onActionStart(event: ((value0: GestureEvent) => void)): this
    onActionUpdate(event: ((value0: GestureEvent) => void)): this
    onActionEnd(event: ((value0: GestureEvent) => void)): this
    onActionCancel(event: ((value0: GestureEvent) => void)): this
}
export declare interface GestureHandler {
}
export declare interface TapGestureHandlerOptions extends BaseHandlerOptions {
    count?: number;
    fingers?: number;
}
export declare interface TapGestureHandler extends GestureHandler {
}
export declare interface LongPressGestureHandlerOptions extends BaseHandlerOptions {
    fingers?: number;
    repeat?: boolean;
    duration?: number;
}
export declare interface LongPressGestureHandler extends GestureHandler {
}
export declare interface PanGestureHandlerOptions extends BaseHandlerOptions {
    fingers?: number;
    direction?: PanDirection;
    distance?: number;
}
export declare interface PanGestureHandler extends GestureHandler {
}
export declare interface SwipeGestureHandlerOptions extends BaseHandlerOptions {
    fingers?: number;
    direction?: SwipeDirection;
    speed?: number;
}
export declare interface SwipeGestureHandler extends GestureHandler {
}
export declare interface PinchGestureHandlerOptions extends BaseHandlerOptions {
    fingers?: number;
    distance?: number;
}
export declare interface PinchGestureHandler extends GestureHandler {
}
export declare interface RotationGestureHandlerOptions extends BaseHandlerOptions {
    fingers?: number;
    angle?: number;
}
export declare interface RotationGestureHandler extends GestureHandler {
}
export declare interface GestureGroupGestureHandlerOptions {
    _stub: int32;
}
export enum GesturePriority {
    NORMAL = 0,
    PRIORITY = 1
}
export enum GestureRecognizerState {
    READY = 0,
    DETECTING = 1,
    PENDING = 2,
    BLOCKED = 3,
    SUCCESSFUL = 4,
    FAILED = 5
}
export declare class ScrollableTargetInfo extends EventTargetInfo {
    constructor()
    isBegin(): boolean
    isEnd(): boolean
}
export declare class EventTargetInfo {
    constructor()
    getId(): string
}
export declare class GestureRecognizer {
    constructor()
    getTag(): string
    getType(): GestureControl.GestureType
    isBuiltIn(): boolean
    setEnabled(isEnabled: boolean): void
    isEnabled(): boolean
    getState(): GestureRecognizerState
    getEventTargetInfo(): EventTargetInfo
    isValid(): boolean
    getFingerCount(): number
    isFingerCountLimit(): boolean
}
export declare class TapRecognizer extends GestureRecognizer {
    constructor()
    getTapCount(): number
}
export declare class LongPressRecognizer extends GestureRecognizer {
    constructor()
    isRepeat(): boolean
    getDuration(): number
}
export declare class SwipeRecognizer extends GestureRecognizer {
    constructor()
    getVelocityThreshold(): number
    getDirection(): SwipeDirection
}
export declare class PinchRecognizer extends GestureRecognizer {
    constructor()
    getDistance(): number
}
export declare class RotationRecognizer extends GestureRecognizer {
    constructor()
    getAngle(): number
}
export declare class PanRecognizer extends GestureRecognizer {
    constructor()
    getPanGestureOptions(): PanGestureOptions
}
export declare namespace GestureControl {
    export enum GestureType {
        TAP_GESTURE = 0,
        LONG_PRESS_GESTURE = 1,
        PAN_GESTURE = 2,
        PINCH_GESTURE = 3,
        SWIPE_GESTURE = 4,
        ROTATION_GESTURE = 5,
        DRAG = 6,
        CLICK = 7
    }
}
