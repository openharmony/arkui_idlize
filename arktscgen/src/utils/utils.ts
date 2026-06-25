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
import { createRequire } from "node:module";
import path from "node:path"

declare const __filename: string | undefined

// Resolve the package's own package.json (exposed via the "./package.json"
// subpath in this package's "exports" field) and take its parent directory.
// This makes DIR_NAME point at the arktscgen package root regardless of whether
// the code runs from the tsc ESM output or the esbuild CJS bundle.
//
// In the esbuild CJS bundle, `import.meta.url` is unavailable; use the
// CommonJS `__filename` (preserved by esbuild) as the resolution base. In the
// tsc ESM output, use `import.meta.url`.
const baseUrl = typeof __filename !== "undefined" ? __filename : import.meta.url
const packageJsonPath = createRequire(baseUrl).resolve("@idlizer/arktscgen/package.json")
export const DIR_NAME = path.dirname(packageJsonPath)
