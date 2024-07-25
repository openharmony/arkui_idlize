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

declare type CanvasFillRule = "evenodd" | "nonzero";

declare class ImageData {

  readonly data: Uint8ClampedArray;

  readonly height: number;

  readonly width: number;

  constructor(width: number, height: number, data?: Uint8ClampedArray);

  constructor(width: number, height: number, data?: Uint8ClampedArray, unit?: LengthMetricsUnit);
}

/*~declare interface CanvasPattern {

  setTransform(transform?: Matrix2D): void;
}*/

// interface ImageBitmap {

//   readonly height: number;

//   readonly width: number;

//   close(): void;
// }


declare class CanvasPath {

  rect(x: number, y: number, w: number, h: number): void;

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;

  closePath(): void;
}

/*~declare class CanvasGradient {

  addColorStop(offset: number, color: string): void;
}*/

declare class CanvasRenderer extends CanvasPath {

  //~ globalAlpha: number;

  //~ globalCompositeOperation: string;

  //~ fillStyle: string | number | CanvasGradient /*~| CanvasPattern*/;

  // drawImage(image: ImageBitmap | PixelMap, dx: number, dy: number): void;

  beginPath(): void;

  //~clip(fillRule?: CanvasFillRule): void;

  reset(): void;

  putImageData(imagedata: ImageData, dx: number | string, dy: number | string): void;

  putImageData(
    imagedata: ImageData,
    dx: number | string,
    dy: number | string,
    dirtyX: number | string,
    dirtyY: number | string,
    dirtyWidth: number | string,
    dirtyHeight: number | string
  ): void;

}

declare class RenderingContextSettings {

  antialias?: boolean;

  constructor(antialias?: boolean);
}

declare class CanvasRenderingContext2D extends CanvasRenderer {

  /*~readonly height: number;

  readonly width: number;*/

  stopImageAnalyzer(): void;

  constructor(settings?: RenderingContextSettings);

  static of(): CanvasRenderingContext2D
}

declare interface DrawingCanvas {}
declare interface Size {
  width: number;
  height: number;
}
declare class ImageBitmap {
  constructor(src: string);
  constructor(src: string, unit: LengthMetricsUnit);
  constructor(data: PixelMap);
  constructor(data: PixelMap, unit: LengthMetricsUnit);
  close(): void;
}

declare class DrawingRenderingContext {

  get size(): Size;

  get canvas(): DrawingCanvas;

  invalidate(): void;

  constructor(/*unit?: LengthMetricsUnit*/);
}

interface CanvasInterface {

  (context?: CanvasRenderingContext2D | DrawingRenderingContext): CanvasAttribute;
}

declare class CanvasAttribute extends CommonMethod<CanvasAttribute> {

  //~onReady(event: () => void): CanvasAttribute;

  enableAnalyzer(enable: boolean): CanvasAttribute;
}

declare const Canvas: CanvasInterface;

declare const CanvasInstance: CanvasAttribute;


