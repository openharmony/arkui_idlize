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

declare class CanvasPath {

  rect(x: number, y: number, w: number, h: number): void;

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;

  closePath(): void;
}

declare class CanvasRenderer extends CanvasPath {

  globalAlpha: number;

  globalCompositeOperation: string;

  drawImage(image: ImageBitmap | PixelMap, dx: number, dy: number): void;
}

declare class RenderingContextSettings {

  antialias?: boolean;

  constructor(antialias?: boolean);
}

declare class CanvasRenderingContext2D extends CanvasRenderer {

  readonly height: number;

  readonly width: number;

  stopImageAnalyzer(): void;

  constructor(settings?: RenderingContextSettings);

  static of(): CanvasRenderingContext2D
}

declare class DrawingRenderingContext {

  get size(): Size;

  get canvas(): DrawingCanvas;

  invalidate(): void;

  constructor(unit?: LengthMetricsUnit);
}

interface CanvasInterface {

  (context?: CanvasRenderingContext2D | DrawingRenderingContext): CanvasAttribute;
}

declare class CanvasAttribute extends CommonMethod<CanvasAttribute> {

  onReady(event: () => void): CanvasAttribute;

  enableAnalyzer(enable: boolean): CanvasAttribute;
}

declare const Canvas: CanvasInterface;

declare const CanvasInstance: CanvasAttribute;


