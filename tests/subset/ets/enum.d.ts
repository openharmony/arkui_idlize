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
