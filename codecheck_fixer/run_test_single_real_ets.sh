#!/bin/bash

# Copyright (c) 2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

rm -rf out
npm run build

REPO_ROOT="/data/home/mlobakh/BZ_OHOS/OHOS/foundation/arkui/ace_engine"
ETS_PATHS=(
  "frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated"
  "frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/src"
)

/bin/bash run.sh line-length \
  -c config.json \
  --repo "$REPO_ROOT" \
  --ets "${ETS_PATHS[@]}" \
  --fix \
  --output out/fixed \
  --verbose

# scripts/check_long_lines.sh -x ets\
#     -p "$REPO_ROOT/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated/component/button.ets"\
#     -o out/fixed/long_lines_ets_before_fix.csv

scripts/check_long_lines.sh -x ets\
    -p "$REPO_ROOT/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated"\
    -p "$REPO_ROOT/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/src"\
    -o out/fixed/long_lines_ets_before_fix.csv

scripts/check_long_lines.sh -x ets -p out/fixed -o out/fixed/long_lines_ets_after_fix.csv
