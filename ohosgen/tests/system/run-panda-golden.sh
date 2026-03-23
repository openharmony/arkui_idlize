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

cur_test_case=$1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE=$SCRIPT_DIR/__temp__/arkts/$cur_test_case/output.txt
DIFF_FILE=$SCRIPT_DIR/__temp__/arkts/$cur_test_case/diff.txt

mkdir -p $(dirname $OUT_FILE)

bash $SCRIPT_DIR/run-panda.sh $cur_test_case > $OUT_FILE 2>&1 || {
    cat $OUT_FILE
    echo "TEST $cur_test_case FAILED: runtime error. See $OUT_FILE"
    exit 1
}
diff $SCRIPT_DIR/$cur_test_case/expected_output_arkts.txt $OUT_FILE > $DIFF_FILE || {
    cat $DIFF_FILE
    echo "TEST $cur_test_case FAILED: unexpected output. See $DIFF_FILE"
    exit 1
}
echo "TEST $cur_test_case SUCCESS"
