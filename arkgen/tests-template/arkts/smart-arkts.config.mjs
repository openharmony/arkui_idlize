/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "",
      baseUrl: "./src",
      include: [
        "src/**/*.ets",
      ],
      exports: {
        "arkui.incremental.annotation": "./src/arkui.incremental.annotation",
        "arkui.incremental.runtime.memo.node": "./src/arkui.incremental.runtime.memo.node",
        "arkui.incremental.runtime.memo.remember": "./src/arkui.incremental.runtime.memo.remember",
        "arkui.incremental.runtime.tree.IncrementalNode": "./src/arkui.incremental.runtime.tree.IncrementalNode",
      },
    },
  },
});
