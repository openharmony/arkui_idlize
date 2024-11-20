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

declare class SwiperController {

  constructor();

  showNext();

  showPrevious();

  changeIndex(index: number, useAnimation?: boolean);

  finishAnimation(callback?: () => void);
}


declare class Indicator<T> {

  left(value: Length): T;

  top(value: Length): T;

  right(value: Length): T;

  bottom(value: Length): T;

  start(value: LengthMetrics): T;

  end(value: LengthMetrics): T;

  static dot(): DotIndicator;

//   static digit(): DigitIndicator;
}

declare class DotIndicator extends Indicator<DotIndicator> {

  constructor();

  itemWidth(value: Length): DotIndicator;

  itemHeight(value: Length): DotIndicator;


//
//   selectedItemWidth(value: Length): DotIndicator;
//
//   selectedItemHeight(value: Length): DotIndicator;
//
//   mask(value: boolean): DotIndicator;
//
//   color(value: ResourceColor): DotIndicator;
//
//   selectedColor(value: ResourceColor): DotIndicator;
//
//   maxDisplayCount(maxDisplayCount: number): DotIndicator;
}

// declare class DigitIndicator extends Indicator<DigitIndicator> {
//
//   constructor();
//
//   fontColor(value: ResourceColor): DigitIndicator;
//
//   selectedFontColor(value: ResourceColor): DigitIndicator;
//
//   digitFont(value: Font): DigitIndicator;
//
//   selectedDigitFont(value: Font): DigitIndicator;
// }

declare class SwiperController {
  constructor();
  showNext();
  showPrevious();
  changeIndex(index: number, useAnimation?: boolean);
  finishAnimation(callback?: () => void);
}

interface SwiperInterface {
  (controller?: SwiperController): SwiperAttribute;
}

declare class SwiperAttribute extends CommonMethod<SwiperAttribute> {

  index(value: number): SwiperAttribute;

  indicator(value: DotIndicator): SwiperAttribute;
//  indicator(value: DotIndicator | DigitIndicator | boolean): SwiperAttribute;

  autoPlay(value: boolean): SwiperAttribute;
  loop(value: boolean): SwiperAttribute;
  vertical(value: boolean): SwiperAttribute;
  interval(value: number): SwiperAttribute;
}

declare const Swiper: SwiperInterface;

declare const SwiperInstance: SwiperAttribute;
