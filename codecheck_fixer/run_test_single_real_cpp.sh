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

rm -rf tests/fixtures/output/cpp
npm run build

REPO_ROOT="$(pwd)"
INPUT_DIR="tests/fixtures/input/cpp"
OUTPUT_DIR="tests/fixtures/output/cpp"

# Path to clang-format (if not in PATH)
CLANG_FORMAT_PATH="/data/home/mlobakh/.local/clang.tmp/bin/clang-format"

if [ -f "$CLANG_FORMAT_PATH" ]; then
  echo "Using clang-format: $CLANG_FORMAT_PATH"
  /bin/bash run.sh cpp-format \
    -c config.json \
    --repo "$REPO_ROOT" \
    --cpp "$INPUT_DIR" \
    --output "$OUTPUT_DIR" \
    --verbose \
    --clang-format="$CLANG_FORMAT_PATH"
else
  echo "Using clang-format from PATH"
  /bin/bash run.sh cpp-format \
    -c config.json \
    --repo "$REPO_ROOT" \
    --cpp "$INPUT_DIR" \
    --output "$OUTPUT_DIR" \
    --verbose
fi

echo ""
echo "Check long lines before formatting:"
scripts/check_long_lines.sh -x cpp \
    -p "$REPO_ROOT/$INPUT_DIR" \
    -o "$OUTPUT_DIR/long_lines_before.csv"

echo ""
echo "Check long lines after formatting:"
scripts/check_long_lines.sh -x cpp \
    -p "$REPO_ROOT/$OUTPUT_DIR" \
    -o "$OUTPUT_DIR/long_lines_after.csv"

echo ""
echo "Compare results:"
echo "Input:  $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
