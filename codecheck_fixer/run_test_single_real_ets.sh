#!/bin/bash
set -e

rm -rf out
npm run build
/bin/bash run.sh line-length -c tests/test_single_real_ets.json --fix --output out/fixed --verbose

REPO_ROOT="/data/home/mlobakh/BZ_OHOS/OHOS/foundation/arkui/ace_engine"

# scripts/check_long_lines.sh -x ets\
#     -p "$REPO_ROOT/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated/component/button.ets"\
#     -o out/fixed/long_lines_ets_before_fix.csv

scripts/check_long_lines.sh -x ets\
    -p "$REPO_ROOT/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated"\
    -p "$REPO_ROOT/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/src"\
    -o out/fixed/long_lines_ets_before_fix.csv

scripts/check_long_lines.sh -x ets -p out/fixed -o out/fixed/long_lines_ets_after_fix.csv
