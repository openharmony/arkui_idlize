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

import { Paint } from "./Paint"
import { Canvas } from "./Canvas"
import { Bitmap } from "./Bitmap"
import { SurfaceProps } from "./SurfaceProps"
import { uint8 } from "./utils"

export function testFun() {
    let clearColor = rgbColor(0xAA, 0xBB, 0xCC)
    let fgColor = rgbColor(0xCC, 0xAA, 0xBB)

    let bitmap = Bitmap.make()
    const props = SurfaceProps.Default
    let canvas = Canvas.makeFromBitmap(bitmap, props)
    let paint = Paint.make()
    paint.color = fgColor

    canvas.clear(clearColor)
    canvas.drawRect(8, 8, 24, 24, paint)
}

export function rgbColor(r: uint8, g: uint8, b: uint8, a: uint8 = 255) {
    return (a & 0xFF) << 24
        | (r & 0xFF) << 16
        | (g & 0xFF) << 8
        | (b & 0xFF) << 0
}
