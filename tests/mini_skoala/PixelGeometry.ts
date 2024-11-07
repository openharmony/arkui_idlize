/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export enum PixelGeometry {
    /**
     * Unknown
     */
    UNKNOWN,

    /**
     * Primary colors rgb (red, green, blue) are ordered in horizontal stripes
     */
    RGB_H,

    /**
     * Primary colors bgr (blue, green, red) are ordered in horizontal stripes
     */
    BGR_H,

    /**
     * Primary colors rgb (red, green, blue) are ordered in vertical stripes
     */
    RGB_V,

    /**
     * Primary colors bgr (blue, green, red) are ordered in vertical stripes
     */
    BGR_V
}