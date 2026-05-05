// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@mediaquery",
      baseUrl: ".",
      include: [
        "src/*.ts",
        "src/panda/**/*.ts",
        "generated/arkts/**/*.ts",
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#components": "./src/panda/components",
        "@ohos.mediaquery": "./generated/arkts/@ohos.mediaquery",
        "@ohos.base": "./generated/arkts/@ohos.base",
      },
      executable: {
        main: "@mediaquery.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
