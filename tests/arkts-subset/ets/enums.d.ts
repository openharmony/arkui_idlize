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

declare enum Color {
    White,
    Black,
}

declare enum Curve {
  Linear,
  Ease,
}

declare enum TextHeightAdaptivePolicy {
  MAX_LINES_FIRST,
  MIN_FONT_SIZE_FIRST,
  LAYOUT_CONSTRAINT_FIRST,
}

declare enum TextOverflow {
  None,
  Clip,
  Ellipsis,
  MARQUEE,
}

declare enum FontWeight {
  Lighter,
  Normal,
  Regular,
  Medium,
  Bold,
  Bolder,
}

declare enum FontStyle {
  Normal,
  Italic,
}

declare enum ColoringStrategy {
  INVERT = 'invert',
  AVERAGE = 'average',
  PRIMARY = 'primary',
}

declare enum EmbeddedType {
  EMBEDDED_UI_EXTENSION = 0,
}

declare enum Axis {
  Vertical,
  Horizontal,
}

declare enum VerticalAlign {
  Top,
  Center,
  Bottom,
}

/////////////// recently added ///////////////

declare enum FlexDirection {
  Row,
  Column,
  RowReverse,
  ColumnReverse,
}

declare enum FlexWrap {
  NoWrap,
  Wrap,
  WrapReverse,
}

declare enum FlexAlign {
  Start,
  Center,
  End,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly,
}

declare enum ItemAlign {
  Auto,
  Start,
  Center,
  End,
  Baseline,
  Stretch,
}

declare enum IlluminatedType {
  NONE = 0,
  BORDER = 1,
  CONTENT = 2,
  BORDER_CONTENT = 3,
  BLOOM_BORDER = 4,
  BLOOM_BORDER_CONTENT = 5
}