/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr } from "@koalaui/interop"
export default bundleManager
export namespace bundleManager {
    export enum ExtensionAbilityType {
        FORM = 0,
        WORK_SCHEDULER = 1,
        INPUT_METHOD = 2,
        SERVICE = 3,
        ACCESSIBILITY = 4,
        DATA_SHARE = 5,
        FILE_SHARE = 6,
        STATIC_SUBSCRIBER = 7,
        WALLPAPER = 8,
        BACKUP = 9,
        WINDOW = 10,
        ENTERPRISE_ADMIN = 11,
        THUMBNAIL = 13,
        PREVIEW = 14,
        PRINT = 15,
        SHARE = 16,
        PUSH = 17,
        DRIVER = 18,
        ACTION = 19,
        ADS_SERVICE = 20,
        EMBEDDED_UI = 21,
        INSIGHT_INTENT_UI = 22,
        FENCE = 24,
        CALLER_INFO_QUERY = 25,
        ASSET_ACCELERATION = 26,
        FORM_EDIT = 27,
        DISTRIBUTED = 28,
        APP_SERVICE = 29,
        LIVE_FORM = 30,
        UNSPECIFIED = 255
    }
    export enum SupportWindowMode {
        FULL_SCREEN = 0,
        SPLIT = 1,
        FLOATING = 2
    }
    export enum LaunchType {
        SINGLETON = 0,
        MULTITON = 1,
        SPECIFIED = 2
    }
    export enum DisplayOrientation {
        UNSPECIFIED = 0,
        LANDSCAPE = 1,
        PORTRAIT = 2,
        FOLLOW_RECENT = 3,
        LANDSCAPE_INVERTED = 4,
        PORTRAIT_INVERTED = 5,
        AUTO_ROTATION = 6,
        AUTO_ROTATION_LANDSCAPE = 7,
        AUTO_ROTATION_PORTRAIT = 8,
        AUTO_ROTATION_RESTRICTED = 9,
        AUTO_ROTATION_LANDSCAPE_RESTRICTED = 10,
        AUTO_ROTATION_PORTRAIT_RESTRICTED = 11,
        LOCKED = 12,
        AUTO_ROTATION_UNSPECIFIED = 13,
        FOLLOW_DESKTOP = 14
    }
    export enum ModuleType {
        ENTRY = 1,
        FEATURE = 2,
        SHARED = 3
    }
    export enum BundleType {
        APP = 0,
        ATOMIC_SERVICE = 1
    }
    export enum MultiAppModeType {
        UNSPECIFIED = 0,
        MULTI_INSTANCE = 1,
        APP_CLONE = 2
    }
}
