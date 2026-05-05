// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@xml",
      baseUrl: ".",
      include: [
        "src/app.ts",
        "src/panda/**/*.ts",
        "generated/arkts/**/*.ts",
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#components": "./generated/arkts",
        "@langlib": "./src/panda/handwritten/langlib",
        "@ohos.xml": "./generated/arkts/@ohos.xml",
        "@ohos.base": "./generated/arkts/@ohos.base",
      },
      executable: {
        main: "@xml.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
