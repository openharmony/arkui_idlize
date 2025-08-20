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

import { ConfigTypeInfer, D } from "@idlizer/core";
import { join, resolve } from "node:path";

export const AppConfigSchema = D.object({
    target: D.default(D.array(D.string()), []),
    exclude: D.default(D.array(D.string()), []),
    banned: D.default(D.array(D.string()), []),
    main: D.maybe(D.object({
        additionalPackages: D.default(D.array(D.string()), [])
    }))
})
export type AppConfigType = ConfigTypeInfer<typeof AppConfigSchema>

export interface AppOptions {
    target: string[],
}

export type AppConfig = AppOptions & AppConfigType

export const OUT_DIR = resolve(process.cwd(), 'out')
export const SUMMARY_PATH = join(OUT_DIR, 'summary.json')
export const ADDITIONAL_CONFIG_DIR = join(OUT_DIR, 'configs')
export const BASIC_CONFIG_PATH = join(OUT_DIR, 'main-config.json')

export const CONFIG_PATH = resolve(process.cwd(), 'scraper-config.json')
