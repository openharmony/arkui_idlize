/*
 * Copyright (c) 2021-2023 Huawei Device Co., Ltd.
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

declare interface ScrollAnimationOptions {

  duration?: number;

  curve?: Curve | ICurve;

  canOverScroll?: boolean;
}

declare class Scroller {

  constructor();

  scrollTo(value: {

    xOffset: number | string;

    yOffset: number | string;

    animation?: ScrollAnimationOptions | boolean;
  });

  scrollPage(value: { next: boolean });

  scrollPage(value: { next: boolean; direction?: Axis });
}

interface ScrollInterface {
  (scroller?: Scroller): ScrollAttribute;
}

declare class ScrollAttribute extends ScrollableCommonMethod<ScrollAttribute> {

    //onScrollEdge(event: (side: Edge) => void): ScrollAttribute;
  scrollBar(barState: BarState): ScrollAttribute;
}

declare const Scroll: ScrollInterface;

declare const ScrollInstance: ScrollAttribute;
