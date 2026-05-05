// @ts-check
import { defineConfig } from '@koalaui/smart-arkts/frontend';

export default defineConfig({
  targets: {
    main: {
      package: "@test-modules-struct",
      source: ".",
      include: [
        "src/panda/**/*.ts",
        "generated/arkts/**/*.ts"
      ],
      exports: {
        "#compat": "./src/panda/compat",
        "#components": "./src/panda/components"
      },
      executable: {
        main: "@test-modules-struct.src.panda.main.ETSGLOBAL::main",
      },
      dependencies: [
        { external: "@koalaui/compat" },
        { external: "@koalaui/common" },
        { external: "@koalaui/interop" },
      ],
    },
  },
});
