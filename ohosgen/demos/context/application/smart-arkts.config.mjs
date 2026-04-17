// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@application",
      source: "./generated/arkts",
      include: [
        "**/*.ts",
      ],
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
        { local: "../bundleManager" },
      ],
    },
  },
});
