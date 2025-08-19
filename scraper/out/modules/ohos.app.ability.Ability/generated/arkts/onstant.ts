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
export default AbilityConstant
export namespace AbilityConstant {
    export interface LaunchParam {
        launchReason: AbilityConstant.LaunchReason;
        launchReasonMessage?: string;
        lastExitReason: AbilityConstant.LastExitReason;
        lastExitMessage: string;
        lastExitDetailInfo?: AbilityConstant.LastExitDetailInfo;
    }
    export interface LastExitDetailInfo {
        pid: int32;
        processName: string;
        uid: int32;
        exitSubReason: int32;
        exitMsg: string;
        rss: int32;
        pss: int32;
        timestamp: int64;
    }
    export enum LaunchReason {
        UNKNOWN = 0,
        START_ABILITY = 1,
        CALL = 2,
        CONTINUATION = 3,
        APP_RECOVERY = 4,
        SHARE = 5,
        AUTO_STARTUP = 8,
        INSIGHT_INTENT = 9,
        PREPARE_CONTINUATION = 10,
        PRELOAD = 11
    }
    export enum LastExitReason {
        UNKNOWN = 0,
        NORMAL = 2,
        CPP_CRASH = 3,
        JS_ERROR = 4,
        APP_FREEZE = 5,
        PERFORMANCE_CONTROL = 6,
        RESOURCE_CONTROL = 7,
        UPGRADE = 8,
        USER_REQUEST = 9,
        SIGNAL = 10
    }
    export enum MemoryLevel {
        MEMORY_LEVEL_MODERATE = 0,
        MEMORY_LEVEL_LOW = 1,
        MEMORY_LEVEL_CRITICAL = 2
    }
    export enum OnSaveResult {
        ALL_AGREE = 0,
        CONTINUATION_REJECT = 1,
        CONTINUATION_MISMATCH = 2,
        RECOVERY_AGREE = 3,
        RECOVERY_REJECT = 4,
        ALL_REJECT = 5
    }
    export enum StateType {
        CONTINUATION = 0,
        APP_RECOVERY = 1
    }
}
