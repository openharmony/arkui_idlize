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


declare type Resource = import('../resource/resource').Resource;

declare type Length = string | number | Resource;

declare type ResourceColor = Color | number | string | Resource;

declare type PX = `${number}px`;

declare type VP = `${number}vp` | number;

declare type FP = `${number}fp`;

declare type LPX = `${number}lpx`;

declare type Percentage = `${number}%`;

declare type Dimension = PX | VP | FP | LPX | Percentage | Resource;

declare type ResourceStr = string | Resource;

declare type Offset = {
    dx: Length;

    dy: Length;
};

declare type AltOffset = {
    dx1: Length;
    dy2: Length;
};

declare interface Position {

    x?: Length;

    y?: Length;
}
