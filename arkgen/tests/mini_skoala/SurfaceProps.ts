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

import { int32 } from "./utils"
import { PixelGeometry } from "./PixelGeometry"

/**
 * Surface properties' flags.
 */
export enum SurfacePropsFlags {
    /**
     * no flags
     */
    None = 0,

    /**
     * flag to use device independent fonts
     */
    UseDeviceIndependentFonts = 1 << 0,

    /**
     * flag to use dynamic msaa
     */
    DynamicMSAA = 1 << 1
}

/**
 * Describes Surface properties: pixel geometry and flags
 */
export class SurfaceProps {
    pixelGeometry: PixelGeometry
    flags: int32
    constructor(
        pixelGeometry: PixelGeometry = PixelGeometry.UNKNOWN,
        flags: int32 = SurfacePropsFlags.None
    ) {
        this.pixelGeometry = pixelGeometry
        this.flags = flags
    }

    public static Default: Readonly<SurfaceProps> = new SurfaceProps(PixelGeometry.RGB_V, SurfacePropsFlags.DynamicMSAA)

    public get useDeviceIndependentFonts(): boolean {
        return ((this.flags & SurfacePropsFlags.UseDeviceIndependentFonts) == SurfacePropsFlags.UseDeviceIndependentFonts)
    }

    public get dynamicMSAA(): boolean {
        return ((this.flags & SurfacePropsFlags.DynamicMSAA) == SurfacePropsFlags.DynamicMSAA)
    }

    flatten(): int32[] {
        return [this.flags, this.pixelGeometry]
    }

    flattenToInt32Array(): Int32Array {
        return new Int32Array([this.flags, this.pixelGeometry])
    }
}
