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

const generated = "./generated/sig/arkoala-arkts/arkui/generated";

export default defineConfig({
  targets: {
    main: {
      package: "arkui",
      baseUrl: generated,
      include: [
        `${generated}/**/*.ets`,
      ],
      exclude: [
        `${generated}/**/sdk/**/*`,
      ],
      exports: {
        "#components": `${generated}/framework/arkts`,
        "#handwritten": `${generated}/handwritten`,
        "#arktheme": `${generated}/ArkThemeScopeManager`,
        "@koalaui/builderLambda": `${generated}/annotations`,
        "arkui.PeerNode": `${generated}/PeerNode`,
        "arkui.framework.main": `${generated}/framework/main`,
        "arkui.framework.test_utils": `${generated}/framework/test_utils`,
        "arkui.ComponentBase": `${generated}/ComponentBase`,
        "arkui.NativeLog": `${generated}/NativeLog`,
        "arkui.NativePeerNode": `${generated}/NativePeerNode`,
        "arkui.ArkThemeScopeManager": `${generated}/ArkThemeScopeManager`,
        "arkui.CallbackTransformer": `${generated}/CallbackTransformer`,
        "internal": "./generated/modules/internal/generated/arkts",
        "external": "./generated/modules/external/generated/arkts",
      },
      executable: {
        main: "arkui.framework.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
        { external: "@koalaui/compat" },
        { external: "@idlizer/arkgen-tests-template-arkts" },
      ],
    },
  },
});
