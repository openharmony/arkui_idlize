// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@unit_ost",
      source: ".",
      include: [
        "src/app.ts",
        "src/panda/**/*.ts",
        "generated/arkts/**/*.ts",
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#handwritten": "./src/panda/handwritten",
      },
      executable: {
        main: "@unit_ost.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
