#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive


cur_test_case=$1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MODULES_DIR="$SCRIPT_DIR/../../../node_modules"
TARGET_DIR="$SCRIPT_DIR/$cur_test_case"

PANDA_SDK="${PANDA_SDK_PATH:-$(node -e "console.log(require('path').dirname(require.resolve('@panda/sdk/package.json')))" 2>/dev/null)}"
ARCH_TOOLS="linux_host_tools"
ARK="$PANDA_SDK/$ARCH_TOOLS/bin/ark"
ETSSTDLIB="$PANDA_SDK/ets/etsstdlib.abc"
ENTRY_POINT="@${cur_test_case//_/-}.src.panda.main.ETSGLOBAL::main"
APP_ABC="$TARGET_DIR/build/panda/app.abc"

INTEROP_ABC="${NODE_MODULES_DIR}/@koalaui/interop/build/main/common/common.abc"
COMPAT_ABC="${NODE_MODULES_DIR}/@koalaui/compat/build/main/common/common.abc"
COMMON_ABC="${NODE_MODULES_DIR}/@koalaui/common/build/main/common/common.abc"
BOOT_FILES="${ETSSTDLIB}:${INTEROP_ABC}:${COMPAT_ABC}:${COMMON_ABC}:${APP_ABC}"

cd $SCRIPT_DIR
LD_LIBRARY_PATH=$TARGET_DIR/build/panda:${NODE_MODULES_DIR}/@koalaui/interop/build:$LD_LIBRARY_PATH \
    "$ARK" \
    --load-runtimes=ets \
    --boot-panda-files "$BOOT_FILES" \
    "$APP_ABC" \
    "$ENTRY_POINT"
