// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@idlizer/arkgen-tests-template-arkts",
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
