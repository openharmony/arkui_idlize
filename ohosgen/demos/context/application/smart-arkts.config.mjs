// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@application",
      baseUrl: "./generated/arkts",
      include: [
        "**/*.ts",
      ],
      exports: {
        "@application.ApplicationContext": "./generated/arkts/ApplicationContext",
        "@application.BaseContext": "./generated/arkts/BaseContext",
        "@application.Context": "./generated/arkts/Context",
        "@application.application.INTERNAL": "./generated/arkts/application.INTERNAL",
        "@application.index": "./generated/arkts/index",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
        { local: "../bundleManager" },
      ],
    },
  },
});
