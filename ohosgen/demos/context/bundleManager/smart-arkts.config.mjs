// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@bundleManager",
      baseUrl: "./generated/arkts",
      include: [
        "**/*.ts",
      ],
      exports: {
        "@bundleManager.ApplicationInfo": "./generated/arkts/ApplicationInfo",
        "@bundleManager.bundleManager.INTERNAL": "./generated/arkts/bundleManager.INTERNAL",
        "@bundleManager.index": "./generated/arkts/index",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
