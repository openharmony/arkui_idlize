// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@context",
      source: ".",
      include: [
        "src/*.ts",
        "src/panda/**/*.ts",
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#components": "./src/panda/components",
        "@ohos.base": "./src/modules/internal/components",
      },
      executable: {
        main: "@context.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
        { local: "../application" },
        { local: "../bundleManager" },
      ],
    },
  },
});
