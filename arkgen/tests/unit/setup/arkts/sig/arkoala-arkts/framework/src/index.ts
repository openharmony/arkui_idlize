/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { IncrementalNode } from "@koalaui/runtime"

export * from "./generated/ArkUINativeModule"
export * from "./generated/ArkUINativeModuleEmpty"
export * from "./generated/TestNativeModule"
export * from "./generated/TestNativeModuleEmpty"
export * from "./Events"
export * from "./PeerEvents"
export * from "./PeerNode"
export * from "./NativePeerNode"

export function createUiDetachedRoot(
    peerFactory: () => any,
    /** @memo */
    builder: () => void
): any { throw new Error("Stub") }
export function destroyUiDetachedRoot(node: any): void { throw new Error("Stub") }
export const GeneratedPartialPropertiesType = -111
export const PeerNodeType = -111