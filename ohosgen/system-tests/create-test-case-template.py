import argparse
import os
import re
import sys


def read_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test-case', '-c', type=str, required=True)
    parser.add_argument('--input-type', '-i', type=str, choices=['dts', 'idl'], required=True)
    return parser.parse_args()


test_case_pattern = '[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$'
test_case_requirements = '''
Requirements:
(1) Must be valid small-case identifiers
    Only a-z, 0-9 and underscore '_' are permitted, and the leading character shall not be a digit.
(2) Consecutive underscores (e.g. 'test__foo') are disallowed.
'''.strip()

args = read_args()
cur_test_case = args.test_case
if not re.match(test_case_pattern, cur_test_case):
    raise ValueError(f"Invalid test case name '{cur_test_case}'. {test_case_requirements}")
cur_package_name = cur_test_case.replace('_', '-')

if os.path.exists(f"./{cur_test_case}"):
    raise ValueError(f"File or directory './{cur_test_case}' already exists.")

os.makedirs(f"./{cur_test_case}/{args.input_type}")
os.makedirs(f"./{cur_test_case}/src/cpp")
os.makedirs(f"./{cur_test_case}/src/panda")

gitignore_template = \
'''
.cache/
build/
generated/
node_modules/
'''.strip()
with open(f"./{cur_test_case}/.gitignore", 'w') as file:
    file.write(gitignore_template)

arktsconfig_json_contents = '''
{
    "compilerOptions": {
        "package": "@__INSERT_PACKAGE_NAME_HERE__",
        "baseUrl": ".",
        "outDir": "build/panda/out",
        "paths": {
            "#compat": ["./src/panda/compat"],
            "#components": ["./src/panda/components"],
            "@koalaui/interop": ["../../../external/interop/src/arkts"],
            "@koalaui/common": ["../../../external/incremental/common/src"],
            "@koalaui/compat": ["../../../external/incremental/compat/src/arkts"],
            "@koalaui/runtime": ["../../../external/incremental/runtime/src"]
        }
    },
    "include": ["src/*.ts", "src/panda/**/*.ts", "generated/arkts/**/*.ts"],
    "exclude": ["src/panda/main.ts"]
}
'''.strip().replace('__INSERT_PACKAGE_NAME_HERE__', cur_package_name)
with open(f"./{cur_test_case}/arktsconfig.json", 'w') as file:
    file.write(arktsconfig_json_contents)

arktsconfig_main_json_contents = '''
{
    "compilerOptions": {
        "package": "@__INSERT_PACKAGE_NAME_HERE__",
        "baseUrl": ".",
        "outDir": "build/panda/out",
        "rootDir": "src/panda",
        "paths": {
            "#compat": ["./src/panda/compat"],
            "#components": ["./src/panda/components"],
            "@koalaui/interop": ["../../../external/interop/src/arkts"],
            "@koalaui/common": ["../../../external/incremental/common/src"],
            "@koalaui/compat": ["../../../external/incremental/compat/src/arkts"],
            "@koalaui/runtime": ["../../../external/incremental/runtime/src"]
        }
    },
    "include": ["src/panda/main.ts"]
}
'''.strip().replace('__INSERT_PACKAGE_NAME_HERE__', cur_package_name)
with open(f"./{cur_test_case}/arktsconfig.main.json", 'w') as file:
    file.write(arktsconfig_main_json_contents)

rollup_config_mjs_contents = '''
import * as path from "node:path"
import { defineConfig } from "rollup"
import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import commonjs from "@rollup/plugin-commonjs"

const outDir = path.resolve("build/node")

export default defineConfig({
    input: "src/node/main.ts",
    output: {
        file: "build/node/index.js",
        format: "commonjs",
        sourcemap: true,
    },
    plugins: [
        typescript({
            moduleResolution: "nodenext",
            outDir: "build/node"
        }),
        resolve(),
        // TODO Runtime JS modules should be in ES6 format
        commonjs(),
        replace({
            "NATIVE_LIBRARY_NAME": `"${path.join(outDir, '##__INSERT_UPPER_CASE_NAME_HERE__##_NativeBridgeNapi.node')}"`,
            preventAssignment: true,
        }),
    ]
})
'''.strip().replace('##__INSERT_UPPER_CASE_NAME_HERE__##', cur_test_case.upper())
with open(f"./{cur_test_case}/rollup.config.mjs", 'w') as file:
    file.write(rollup_config_mjs_contents)

compat_ts_contents = '''
import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts/peers/CallbacksChecker';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', '##__INSERT_UPPER_CASE_NAME_HERE__##NativeModule');
}
'''.strip().replace('##__INSERT_UPPER_CASE_NAME_HERE__##', cur_test_case.upper())
with open(f"./{cur_test_case}/src/panda/compat.ts", 'w') as file:
    file.write(compat_ts_contents)

components_ts_contents = '''
export { ##__INSERT_UPPER_CASE_NAME_HERE__##NativeModule }
    from '../../generated/arkts/##__INSERT_UPPER_CASE_NAME_HERE__##NativeModule';
export { TypeChecker } from '../../generated/arkts/peers/type_check';
'''.strip().replace('##__INSERT_UPPER_CASE_NAME_HERE__##', cur_test_case.upper())
with open(f"./{cur_test_case}/src/panda/components.ts", 'w') as file:
    file.write(components_ts_contents)

main_ts_contents = '''
import { pullEvents, init } from "./compat";

function mainBody() {
    /* ---- Insert your code here ---- */
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
'''.strip()
with open(f"./{cur_test_case}/src/panda/main.ts", 'w') as file:
    file.write(main_ts_contents)

print('Done.')
