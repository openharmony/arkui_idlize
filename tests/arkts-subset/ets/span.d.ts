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

declare interface TextBackgroundStyle {
    color?: ResourceColor;
    radius?: Dimension | BorderRadiuses;
  }

declare class BaseSpan<T> extends CommonMethod<T> {
    textBackgroundStyle(style: TextBackgroundStyle): T;
    baselineOffset(value: LengthMetrics): T;
}

interface SpanInterface {
    (value: string | Resource): SpanAttribute;
}

declare class SpanAttribute extends BaseSpan<SpanAttribute> {
    fontSize(value: number | string | Resource): SpanAttribute;
    fontWeight(value: number | FontWeight | string): SpanAttribute;
    fontColor(value: ResourceColor): SpanAttribute;
    // font(value: Font): SpanAttribute;
    // fontStyle(value: FontStyle): SpanAttribute;
    // fontFamily(value: string | Resource): SpanAttribute;
    // decoration(value: DecorationStyleInterface): SpanAttribute;
    // letterSpacing(value: number | string): SpanAttribute;
    // textCase(value: TextCase): SpanAttribute;
    // lineHeight(value: Length): SpanAttribute;
    // textShadow(value: ShadowOptions | Array<ShadowOptions>): SpanAttribute;
}