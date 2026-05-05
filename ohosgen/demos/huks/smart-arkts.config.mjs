// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@huks",
      baseUrl: ".",
      include: [
        "src/app.ts",
        "src/panda/**/*.ts",
        "generated/arkts/**/*.ts",
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#components": "./generated/arkts",
        "@ohos.security.huks": "./generated/arkts/@ohos.security.huks",
        "@ohos.base": "./generated/arkts/@ohos.base",
      },
      executable: {
        main: "@huks.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
