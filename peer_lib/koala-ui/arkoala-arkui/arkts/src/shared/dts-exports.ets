/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AdaptiveColor,
         BackgroundBlurStyleOptions,
         BorderStyle,
         BlurStyle,
         BlurOptions,
         CustomBuilder,
         DismissReason,
         DragInteractionOptions,
         DragPreviewMode,
         DragPreviewOptions,
         EdgeWidths,
         GradientDirection,
         ShadowStyle,
         ShadowType,
         SheetMode,
         SheetSize,
         SheetOptions,
         SheetType,
         SourceTool,
         StateStyles,
         SymbolGlyphModifier,
         RectResult,
         ThemeColorMode,
         UIGestureEvent } from '@arkoala/arkui/ArkCommonInterfaces'
import { GestureInterface
         GestureJudgeResult,
         GestureMask,
         GesturePriority } from '@arkoala/arkui/ArkGestureInterfaces'
import { CalendarAlign } from '@arkoala/arkui/ArkCalendarPickerInterfaces'
import { EnumDTS } from '@arkoala/arkui/ArkTestInterfaces'
import { NavigationTitleMode } from '@arkoala/arkui/ArkNavigationInterfaces'
import { HorizontalAlign } from '@arkoala/arkui/ArkColumnInterfaces'
import { SelectedMode } from '@arkoala/arkui/ArkTabContentInterfaces'
import { BarMode } from '@arkoala/arkui/ArkTabsInterfaces'
import { Color,
         ColoringStrategy,
         FontWeight,
         FontStyle,
         TextHeightAdaptivePolicy,
         TextOverflow } from '@arkoala/arkui/ArkEnumInterfaces'
import { Dimension,
         Font,
         Length,
         LengthMetrics,
         LengthMetricsUnit,
         LocalizedPadding,
         Resource,
         ResourceColor,
         ResourceStr } from "@arkoala/arkui/ArkUnitsInterfaces"
import { NativeEmbedDataInfo } from '@arkoala/arkui/ArkWebInterfaces'

export class TabBarSymbol {
    normal: SymbolGlyphModifier
    selected?: SymbolGlyphModifier
}

export class RenderingContextSettings {
    antialias?: boolean;
    constructor(antialias?: boolean) {}
}

export class TouchTestInfo {
    windowX: number;
    windowY: number;
    parentX: number;
    parentY: number;
    x: number;
    y: number;
    rect: RectResult;
    id: string;
}

export interface ClassDTS {
    valBoolean: boolean
}

// Non materialized class
export class ClassWithConstructorDTS {
    constructor(valNumber: number, valString: string) {}
}

// Non materialized class
export class ClassWithConstructorAndFieldsDTS {
    valNumber: number
    valBoolean: boolean
    constructor(valNumber: number, valBoolean: boolean) {}
}

// Materialized class
export class ClassWithConstructorAndMethodsDTS {
    constructor(valNumber: number, valString: string) {}
    method(valNumber: number, valString: string): void {}
}

// Materialized class
export class ClassWithConstructorAndStaticMethodsDTS {
    constructor(valNumber: number, valString: string) {}
    static of(valNumber: number, valString: string): ClassWithConstructorAndStaticMethodsDTS {
        return new ClassWithConstructorAndStaticMethodsDTS(valNumber, valString)
    }
}

// Materialized class
export class ClassWithConstructorAndFieldsAndMethodsDTS {
    valNumber: number
    valBoolean: boolean
    constructor(valNumber: number, valBoolean: boolean) {}
    method(valNumber: number, valString: string): void {}
}


// Materialized class
export class ClassWithConstructorAndWithoutParamsDTS {
    constructor() {}
    static of(): ClassWithConstructorAndWithoutParamsDTS {
        return new ClassWithConstructorAndWithoutParamsDTS()
    }
    method(): void {}
}

export class ClassWithConstructorAndNonOptionalParamsDTS {
    constructor(valNumber: number, valString: string) {}
    static of(valNumber: number, valString: string): ClassWithConstructorAndNonOptionalParamsDTS {
        return new ClassWithConstructorAndNonOptionalParamsDTS(valNumber, valString)
    }
    method(valBoolean: boolean, valString: string): void {}
}

// Materialized class
export class  ClassWithConstructorAndSomeOptionalParamsDTS {
    constructor(valNumber: number, valString?: string) {}
    static of(valNumber: number, valString?: string): ClassWithConstructorAndSomeOptionalParamsDTS {
        return new ClassWithConstructorAndSomeOptionalParamsDTS(valNumber, valString)
    }
    method(valBoolean: boolean, valString?: string): void {}
}

// Materialized class
export class ClassWithConstructorAndAllOptionalParamsDTS {
    constructor(valNumber?: number, valString?: string) {}
    static of(valNumber?: number, valString?: string): ClassWithConstructorAndAllOptionalParamsDTS {
        return new ClassWithConstructorAndAllOptionalParamsDTS(valNumber, valString)
    }

    method(valBoolean?: boolean, valString?: string): void {}
}

export class ImageData {
  readonly data: Uint8ClampedArray;
  readonly height?: number;
  readonly width?: number;
  constructor(width: number, height: number, data?: Uint8ClampedArray, unit?: LengthMetricsUnit) {
    this.width = width
    this.height = height
    this.data = data ?? new Uint8ClampedArray(0)
  }
}

export interface GestureModifier {
  applyGesture(): void;
  applyGesture(event: UIGestureEvent): void;
}

declare namespace GestureControl {
  enum GestureType {
    TAP_GESTURE = 0,
    LONG_PRESS_GESTURE = 1,
    PAN_GESTURE = 2,
    PINCH_GESTURE = 3,
    SWIPE_GESTURE = 4,
    ROTATION_GESTURE = 5,
    DRAG = 6,
    CLICK = 7,
  }
}

enum GestureRecognizerState {
  READY = 0,
  DETECTING = 1,
  PENDING = 2,
  BLOCKED = 3,
  SUCCESSFUL = 4,
  FAILED = 5,
}

abstract class EventTargetInfo {
  abstract getId(): string;
}

export interface GestureRecognizer {
  getTag(): string;
  getType(): GestureControl.GestureType;
  isBuiltIn(): boolean;
  setEnabled(isEnabled: boolean): void;
  isEnabled(): boolean;
  getState(): GestureRecognizerState;
  getEventTargetInfo(): EventTargetInfo;
}

interface CanvasPath {
    rect(x: number, y: number, w: number, h: number): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    closePath(): void;
}

interface CanvasRenderer extends CanvasPath {
    globalAlpha: number;
    globalCompositeOperation: string;
    // drawImage(image: ImageBitmap | PixelMap, dx: number, dy: number): void;
}

export class CanvasRenderingContext2D implements CanvasRenderer {
  readonly height: number;
  readonly width: number;
  globalAlpha: number;
  globalCompositeOperation: string;
  stopImageAnalyzer(): void {}
  constructor(settings?: RenderingContextSettings) {}
  static of(height: number, width: number): CanvasRenderingContext2D {
    return new CanvasRenderingContext2D()
  }
  rect(x: number, y: number, w: number, h: number): void {}
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {}
  closePath(): void {}
}

export class DrawingRenderingContext {
  // get size(): Size
  // get canvas(): DrawingCanvas;
  invalidate(): void {}
  constructor(unit?: LengthMetricsUnit) {}
}

declare class Indicator<T> {}

export class DotIndicator extends Indicator<DotIndicator> {
  constructor() {}
  itemWidth(value: Length): DotIndicator {
    return this;
  }
  itemHeight(value: Length): DotIndicator {
    return this;
  }
}

export type External_LITERAL_evenodd = string
export type External_LITERAL_onzero = string
export type External_LITERAL_nonzero = string
export type External_TEMPLATE_LITERAL_number_FP = string
export type External_TEMPLATE_LITERAL_number_LPX = string
export type External_TEMPLATE_LITERAL_number_vp = string
export type External_TEMPLATE_LITERAL_number_Percentage = string
export type External_TEMPLATE_LITERAL_number_PX = string
