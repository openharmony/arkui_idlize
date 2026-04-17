// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@unit",
      source: ".",
      include: [
        "src/app.ts",
        "src/panda/**/*.ts",
        "generated/arkts/**/*.ts",
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#components": "./src/panda/components",
        "#handwritten": "./src/panda/handwritten",
        "@internal.lib": "./src/panda/modules/internal_lib",
        "@newname.lib": "./src/panda/modules/newname_lib",
        "@external.lib": "./src/panda/handwritten/external_lib",
        "@external.lib.sdk": "./src/panda/handwritten/external_lib_sdk",
      },
      executable: {
        main: "@unit.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
